import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as crypto from "crypto";
import { parse as parseCookieHeader } from "cookie";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

// ── Google OAuth helpers ──

function getGoogleRedirectUri(req: Request): string {
  const origin = ENV.isProduction
    ? "https://www.storyling.ai"
    : `${req.protocol}://${req.get("host")}`;
  return `${origin}/api/auth/google/callback`;
}

async function exchangeGoogleCode(
  code: string,
  redirectUri: string
): Promise<{ access_token: string; id_token: string }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: ENV.googleClientId,
      client_secret: ENV.googleClientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }

  return res.json();
}

async function getGoogleUserInfo(accessToken: string): Promise<{
  sub: string;
  name: string;
  email: string;
  picture: string;
}> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Google user info");
  }

  return res.json();
}

export function registerOAuthRoutes(app: Express) {
  // ── Dev-only login: creates a local user and sets the session cookie ──
  if (process.env.NODE_ENV === "development") {
    app.get("/api/dev-login", async (req: Request, res: Response) => {
      try {
        const openId = "dev-local-user";
        const name = "Dev User";
        const email = "dev@localhost";

        await db.upsertUser({
          openId,
          name,
          email,
          loginMethod: "dev",
          lastSignedIn: new Date(),
        });

        const sessionToken = await sdk.createSessionToken(openId, {
          name,
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        res.redirect(302, "/");
      } catch (error) {
        console.error("[Dev Login] Failed", error);
        res.status(500).json({ error: "Dev login failed", details: String(error) });
      }
    });
  }

  // ── Google OAuth: redirect to Google consent screen ──
  app.get("/api/auth/google", (req: Request, res: Response) => {
    if (!ENV.googleClientId) {
      res.status(500).json({ error: "Google OAuth is not configured" });
      return;
    }

    const state = crypto.randomBytes(32).toString("hex");
    const redirectUri = getGoogleRedirectUri(req);

    // Store state in a short-lived cookie for CSRF protection
    res.cookie("google_oauth_state", state, {
      httpOnly: true,
      secure: ENV.isProduction,
      sameSite: "lax",
      maxAge: 10 * 60 * 1000, // 10 minutes
      path: "/",
    });

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", ENV.googleClientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");

    res.redirect(302, url.toString());
  });

  // ── Google OAuth: callback after user consents ──
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const error = getQueryParam(req, "error");

    if (error) {
      console.error("[Google OAuth] User denied access:", error);
      res.redirect(302, "/login?error=google_denied");
      return;
    }

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    // Verify CSRF state
    const cookies = parseCookieHeader(req.headers.cookie || "");
    const cookieState = cookies.google_oauth_state;
    if (!cookieState || cookieState !== state) {
      res.status(403).json({ error: "Invalid state parameter" });
      return;
    }

    // Clear the state cookie
    res.clearCookie("google_oauth_state", { path: "/" });

    try {
      const redirectUri = getGoogleRedirectUri(req);
      const tokens = await exchangeGoogleCode(code, redirectUri);
      const googleUser = await getGoogleUserInfo(tokens.access_token);

      const openId = `google_${googleUser.sub}`;

      await db.upsertUser({
        openId,
        name: googleUser.name || null,
        email: googleUser.email ?? null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(openId, {
        name: googleUser.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/app");
    } catch (err) {
      console.error("[Google OAuth] Callback failed", err);
      res.redirect(302, "/login?error=google_failed");
    }
  });

  // ── Legacy Manus OAuth callback (keep for backward compatibility) ──
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/app");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
