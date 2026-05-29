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
      targets: [
        "chrome >= 70", "safari >= 12", "firefox >= 68", "edge >= 79",
        "samsung >= 12", "and_chr >= 70", "ios_saf >= 12",
        "android >= 70", "opera >= 60", "not dead", "not op_mini all"
      ],
      renderLegacyChunks: true,
      modernPolyfills: true,
      additionalLegacyPolyfills: ["regenerator-runtime/runtime"],
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
        name: "مركز الأذكار الإسلامي | Islamic Hub",
        short_name: "الأذكار",
        description: "القرآن الكريم، أذكار يومية، مواقيت الصلاة، القبلة، الزكاة - 100 لغة - يعمل بدون إنترنت",
        theme_color: "#0a150a",
        background_color: "#0a150a",
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
        manualChunks(id) {
          // Core React runtime
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) {
            return 'vendor';
          }
          // i18n
          if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next') || id.includes('node_modules/i18next-')) {
            return 'i18n';
          }
          // App translation resources
          if (id.includes('/src/i18n/')) {
            return 'i18n-translations';
          }
          // Animation
          if (id.includes('node_modules/framer-motion') || id.includes('node_modules/motion')) {
            return 'motion';
          }
          // Icons
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
          // Radix UI components
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix';
          }
          // Router
          if (id.includes('node_modules/wouter')) {
            return 'router';
          }
          // DOMPurify / isomorphic-dompurify
          if (id.includes('node_modules/dompurify') || id.includes('node_modules/isomorphic-dompurify')) {
            return 'security';
          }
          // Tailwind merge / class variance utilities
          if (id.includes('node_modules/clsx') || id.includes('node_modules/tailwind-merge') || id.includes('node_modules/class-variance-authority')) {
            return 'ui-utils';
          }
          // Quran page (split out separately - it's complex but manageable)
          if (id.includes('/src/pages/Quran')) {
            return 'page-quran';
          }
          // All other app pages bundled together to avoid circular deps
          if (id.includes('/src/pages/') || id.includes('/src/screens/')) {
            return 'pages';
          }
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
