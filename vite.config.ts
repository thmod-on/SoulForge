import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { cloudflare } from "@cloudflare/vite-plugin";

const legacyGitHubPages = process.env.SOULFORGE_LEGACY_PAGES === "true";

export default defineConfig(({ mode }) => ({
  base: legacyGitHubPages ? "/SoulForge/" : "/",
  plugins: [
    ...(mode === "test" || legacyGitHubPages ? [] : [cloudflare()]),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "SoulForge",
        short_name: "SoulForge",
        description: "Companion offline para personagens de Daggerheart.",
        theme_color: "#070b10",
        background_color: "#070b10",
        display: "standalone",
        orientation: "landscape-primary",
        start_url: ".",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,jpg,jpeg,png,svg,webp,json}"],
        globIgnores: ["assets/classes/**/*-banner.webp"],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/classes\/.*-banner\.webp$/,
            handler: "CacheFirst",
            options: {
              cacheName: "class-detail-artwork",
              expiration: {
                maxEntries: 16,
                maxAgeSeconds: 60 * 60 * 24 * 90
              }
            }
          }
        ],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      },
      devOptions: {
        enabled: true
      }
    })
  ]
}));
