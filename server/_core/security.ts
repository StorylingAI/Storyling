import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import type { Express, Request, Response, NextFunction } from "express";

const isProd = process.env.NODE_ENV === "production";
const appUrl = process.env.VITE_APP_URL || "http://localhost:3000";

// CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: isProd
    ? [appUrl, "https://storyling.ai", "https://www.storyling.ai"]
    : true, // allow all in dev
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "stripe-signature"],
};

// General API rate limit: 300 requests per 15 min per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

// Auth rate limit: 10 attempts per 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts, please try again later." },
});

// Payment rate limit: 20 requests per 15 min per IP
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many payment requests, please try again later." },
});

// Global error handler: suppress stack traces in production
function globalErrorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error("[Error]", isProd ? err.message : err);
  res.status(500).json({
    error: isProd ? "Internal server error" : err.message,
    ...(isProd ? {} : { stack: err.stack }),
  });
}

export function registerSecurityMiddleware(app: Express) {
  // Trust proxy (Railway, Docker, etc.) so rate limiting uses real client IP
  app.set("trust proxy", 1);

  // Helmet: security headers + CSP
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "blob:", "https:"],
          connectSrc: [
            "'self'",
            "https://api.stripe.com",
            "https://api.manus.im",
            "https://api.openai.com",
            "https://api.elevenlabs.io",
            "https://api.resend.com",
            appUrl,
          ],
          frameSrc: ["'self'", "https://js.stripe.com"],
          mediaSrc: ["'self'", "blob:", "https:"],
        },
      },
    })
  );

  // CORS
  app.use(cors(corsOptions));

  // Rate limiting on sensitive endpoints
  app.use("/api/trpc/auth.", authLimiter);
  app.use("/api/oauth", authLimiter);
  app.use("/api/trpc/checkout.", paymentLimiter);
  app.use("/api/trpc/subscription.", paymentLimiter);
  app.use("/api/stripe", paymentLimiter);

  // General rate limit on all API routes
  app.use("/api", generalLimiter);
}

export { globalErrorHandler };
