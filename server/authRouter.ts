import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { sdk } from "./_core/sdk";
import { ONE_YEAR_MS, COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import * as crypto from "crypto";
import { sendEmail } from "./_core/email";
import { verificationEmail } from "./emailTemplates";

// Password hashing utilities
async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.pbkdf2(password, salt, 100000, 64, "sha512", (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ":" + derivedKey.toString("hex"));
    });
  });
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(":");
    crypto.pbkdf2(password, salt, 100000, 64, "sha512", (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString("hex"));
    });
  });
}

function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export const authRouter = router({
  signUp: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Check if email already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });
      }

      // Hash password
      const passwordHash = await hashPassword(input.password);

      // Generate verification token
      const verificationToken = generateVerificationToken();
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create user with email/password
      const openId = `email_${crypto.randomBytes(16).toString("hex")}`;
      
      const [newUser] = await db.insert(users).values({
        openId,
        email: input.email,
        name: input.name,
        passwordHash,
        emailVerified: false,
        verificationToken,
        verificationTokenExpiry,
        loginMethod: "email",
        lastSignedIn: new Date(),
      });

      // Send verification email
      const baseUrl = process.env.BASE_URL || `${ctx.req.protocol}://${ctx.req.get("host")}`;
      const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

      try {
        await sendEmail({
          to: input.email,
          subject: "Verify your Storyling AI account",
          html: verificationEmail({
            name: input.name,
            verificationUrl,
          }),
        });
      } catch (error) {
        console.error("Failed to send verification email:", error);
        // Don't fail the signup if email fails - user can request resend
      }

      // Create session token
      const sessionToken = await sdk.createSessionToken(openId, {
        name: input.name,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      return {
        success: true,
        message: "Account created! Please check your email to verify your account.",
        userId: newUser.insertId,
      };
    }),

  signIn: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Find user by email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }

      // Verify password
      const isValid = await verifyPassword(input.password, user.passwordHash);
      if (!isValid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }

      // Update last signed in
      await db
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, user.id));

      // Create session token
      const sessionToken = await sdk.createSessionToken(user.openId || '', {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      return {
        success: true,
        emailVerified: user.emailVerified,
      };
    }),

  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Find user with this token
      const [user] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.verificationToken, input.token),
          )
        )
        .limit(1);

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invalid verification token" });
      }

      // Check if token expired
      if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Verification token expired" });
      }

      // Mark email as verified
      await db
        .update(users)
        .set({
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null,
        })
        .where(eq(users.id, user.id));

      return { success: true };
    }),

  resendVerification: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (!user) {
        // Don't reveal if email exists
        return { success: true };
      }

      if (user.emailVerified) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Email already verified" });
      }

      // Generate new token
      const verificationToken = generateVerificationToken();
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await db
        .update(users)
        .set({ verificationToken, verificationTokenExpiry })
        .where(eq(users.id, user.id));

      // Send verification email
      const baseUrl = process.env.BASE_URL || `${ctx.req.protocol}://${ctx.req.get("host")}`;
      const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

      await sendEmail({
        to: input.email,
        subject: "Verify your Storyling AI account",
        html: verificationEmail({
          name: user.name || '',
          verificationUrl,
          isResend: true,
        }),
      });

      return { success: true };
    }),
});
