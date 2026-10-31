import { defineConfig } from "vite";

// Serve assets from the root of the custom domain.
export default defineConfig({
  base: "/",
  build: {
    target: "es2020",
    assetsInlineLimit: 0,
  },
});
