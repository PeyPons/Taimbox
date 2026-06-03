import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    emptyOutDir: true,
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
    // Una sola copia de React (evita createContext undefined con chunks manuales)
    dedupe: ["react", "react-dom"],
  },
});
