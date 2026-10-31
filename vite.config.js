import { defineConfig } from "vite";

// Relative base so the build works on the custom domain and on <user>.github.io/<repo>/.
export default defineConfig({
  base: "./",
  build: {
    target: "es2020",
    assetsInlineLimit: 0,
  },
});
