import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
import { VitePWA } from "vite-plugin-pwa";


const plugins = [
  react(),
  tailwindcss(),
  vitePluginManusRuntime(),
  VitePWA({
    strategies: "injectManifest",
    srcDir: "src",
    filename: "sw.ts",
    injectRegister: false,
    manifestFilename: "manifest.json",
    manifest: {
      name: "Storyling AI",
      short_name: "Storyling",
      description: "Learn languages through AI-generated stories",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#3B82F6",
      icons: [
        { src: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/favicon-512x512.png", sizes: "512x512", type: "image/png" },
      ],
    },
    injectManifest: {
      maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB — main bundle is ~2.2MB
    },
    devOptions: {
      enabled: false,
      type: "module",
    },
  }),
];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    hmr: {
      clientPort: 443,
      protocol: 'wss',
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
