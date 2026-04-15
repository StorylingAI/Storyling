import "dotenv/config";
import axios from "axios";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerSecurityMiddleware, globalErrorHandler } from "./security";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { initWebPush } from "../pushNotifications";
import { getTrackById } from "../musicLibrary";


function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Initialize web push notifications (silent no-op if VAPID keys not set)
  initWebPush();

  // Security middleware (CORS, Helmet, rate limiting)
  registerSecurityMiddleware(app);

  // Stripe webhook MUST be registered BEFORE express.json() for signature verification
  const { handleStripeWebhook } = await import("../stripe/webhook");
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/music/preview/:trackId", async (req, res, next) => {
    const track = getTrackById(req.params.trackId);
    if (!track) {
      res.status(404).json({ error: "Track not found" });
      return;
    }

    try {
      const upstream = await axios.get(track.previewUrl, {
        responseType: "stream",
        timeout: 120000,
        headers: req.headers.range ? { Range: req.headers.range } : undefined,
        validateStatus: (status) => status >= 200 && status < 300,
      });

      res.status(upstream.status);
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Accept-Ranges", upstream.headers["accept-ranges"] || "bytes");
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.setHeader("Content-Disposition", `inline; filename="${track.id}.mp3"`);

      const contentLength = upstream.headers["content-length"];
      if (contentLength) {
        res.setHeader("Content-Length", contentLength);
      }

      const contentRange = upstream.headers["content-range"];
      if (contentRange) {
        res.setHeader("Content-Range", contentRange);
      }

      upstream.data.on("error", next);
      upstream.data.pipe(res);
    } catch (error) {
      next(error);
    }
  });

  // Serve uploaded files (local storage backend)
  const uploadsDir = process.env.UPLOADS_DIR || "uploads";
  app.use("/uploads", express.static(uploadsDir));

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    const fs = await import("fs");
    const path = await import("path");
    const distPath = path.resolve(import.meta.dirname, "public");
    if (!fs.existsSync(distPath)) {
      console.error(
        `Could not find the build directory: ${distPath}, make sure to build the client first`
      );
    }
    app.use(express.static(distPath));
    app.use("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  // Global error handler (must be last middleware)
  app.use(globalErrorHandler);

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
