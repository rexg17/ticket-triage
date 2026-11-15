import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// base "./" deixa o build funcionar em qualquer subpasta, como o GitHub Pages.
export default defineConfig({
  base: "./",
  plugins: [react()],
  test: { environment: "node" },
});
