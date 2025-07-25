import { defineConfig } from "vite";
import tailwindCSS from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: "./build",
    emptyOutDir: true,
  },
  assetsInclude: ["**/*.json"],
  plugins: [react(), tailwindCSS()],
});
