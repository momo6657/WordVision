import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const imageApiBaseUrl = process.env.VITE_IMAGE_API_BASE_URL || "https://wordvision.vercel.app";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: imageApiBaseUrl,
        changeOrigin: true,
        secure: true,
      },
    },
  },
  preview: {
    proxy: {
      "/api": {
        target: imageApiBaseUrl,
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 12000,
  },
});
