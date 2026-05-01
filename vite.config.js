import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://wordvision.vercel.app",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  preview: {
    proxy: {
      "/api": {
        target: "https://wordvision.vercel.app",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 12000,
  },
});
