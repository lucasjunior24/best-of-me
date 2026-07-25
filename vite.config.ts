import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@core": path.resolve(__dirname, "src/core"),
      "@adapters": path.resolve(__dirname, "src/adapters"),
      "@presentation": path.resolve(__dirname, "src/presentation"),
      "@shared": path.resolve(__dirname, "src/shared"),
      "@di": path.resolve(__dirname, "src/di"),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
