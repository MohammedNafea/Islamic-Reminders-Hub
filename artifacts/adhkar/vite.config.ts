import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import legacy from "@vitejs/plugin-legacy";

const port = Number(process.env.PORT) || 5000;
const basePath = process.env.BASE_PATH || "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    legacy({
      targets: ["defaults", "not IE 11", "Android >= 5", "Chrome >= 50", "safari >= 10"],
      renderLegacyChunks: true,
      modernPolyfills: true,
    }),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "apple-touch-icon.png", "icon-512.png", "data/library_content.json", "data/adhkar.ts"],
      injectManifest: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json,woff2,mp3}"],
      },
      manifest: {
        name: "مركز الأذكار الإسلامي",
        short_name: "الأذكار",
        description: "رفيقك المسلم للأذكار، القرآن، ومواقيت الصلاة - يعمل بدون إنترنت",
        theme_color: "#0f766e",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: basePath,
        start_url: basePath,
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    target: ["es2015", "chrome60", "firefox60", "safari11", "edge18", "ios11"],
    cssTarget: ["chrome60", "firefox60", "safari11", "edge18", "ios11"],
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          i18n: ['i18next', 'react-i18next'],
          ui: ['framer-motion', 'lucide-react']
        }
      }
    }
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: [],
    include: ["tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/lib/hijri.ts", "src/lib/prayer-times.ts", "src/hooks/useFavorites.ts"],
    },
  },
});
