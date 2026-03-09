export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = "Storyling.ai";

export const APP_LOGO = "/flip-mascot.png";

// Build an OAuth URL for the given type. Falls back to email auth routes when OAuth is not configured.
function buildOAuthUrl(type: "signIn" | "signUp"): string {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  if (!oauthPortalUrl || !appId || !oauthPortalUrl.startsWith("http")) {
    return type === "signUp" ? "/signup" : "/login";
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", type);

  return url.toString();
}

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => buildOAuthUrl("signIn");

// Generate sign-up URL with explicit sign-up type
export const getSignUpUrl = () => buildOAuthUrl("signUp");
