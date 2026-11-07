import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwind()],
  server: {
    proxy: {
      "/__jobpilot/aggregator-login": {
        target: process.env.JOBPILOT_BACKEND_URL ?? "http://localhost:8080",
        xfwd: true,
      },
    },
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    environment: "jsdom",
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/main.tsx"],
      thresholds: { lines: 90, branches: 90 },
    },
  },
});
