import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png"],
      manifest: {
        name: "Verde Prime - Fichas Técnicas",
        short_name: "Verde Prime",
        description: "Cadastro de fichas técnicas e Cadastro Ambiental Rural (CAR) — Verde Prime Consultoria Ambiental.",
        theme_color: "#124430",
        background_color: "#124430",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Não força cache de chamadas ao Supabase (dados precisam ser sempre atuais/online);
        // só a casca do app (HTML/CSS/JS/imagens) fica disponível offline.
        navigateFallbackDenylist: [/^\/rest\//, /^\/auth\//, /^\/storage\//],
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Garante que cada novo deploy substitua o cache antigo imediatamente,
        // em vez de deixar o navegador preso numa versão anterior (que pode
        // referenciar arquivos que não existem mais no site novo).
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
});
