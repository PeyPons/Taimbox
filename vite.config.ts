import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            if (id.includes("/pages/LandingPage") || id.includes("/pages/PreciosPage") || id.includes("/pages/SecurityLandingPage")) {
              return "marketing-core";
            }
            if (id.includes("LandingPage") || id.includes("landing/") || id.includes("/pages/Privacy") || id.includes("/pages/Terms")) {
              return "marketing-pages";
            }
          }
          if (id.includes("node_modules/react-dom") || id.includes("node_modules/react/")) return "vendor-react";
          if (id.includes("node_modules/@radix-ui")) return "vendor-radix";
          if (id.includes("node_modules/framer-motion")) return "vendor-motion";
          if (id.includes("node_modules/i18next") || id.includes("react-i18next")) return "vendor-i18n";
        },
      },
    },
  },
  server: {
    host: "::",
    port: 8080,
    allowedHosts: ["taimbox.com", "localhost", "127.0.0.1"],
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
