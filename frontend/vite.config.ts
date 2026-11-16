import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";

const backend = process.env.JOBPILOT_BACKEND_URL ?? "http://localhost:8080";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwind(),
    {
      name: "jobpilot-login-entry",
      configureServer(server) {
        if (mode === "test") return;
        server.middlewares.use(async (request, response, next) => {
          const path = request.url?.split("?")[0];
          if (path !== "/" && path !== "/index.html") return next();

          const session = await fetch(new URL("/__jobpilot/session", backend), {
            headers: { cookie: request.headers.cookie ?? "" },
          }).catch(() => null);
          if (session?.status === 204) return next();

          response.writeHead(302, { Location: "/login" }).end();
        });
      },
    },
  ],
  server: {
    proxy: {
      "/api/v1": { target: backend, xfwd: true },
      "^/login(?:[/?]|$)": {
        target: backend,
        xfwd: true,
      },
      "^/oauth2/authorization/keycloak(?:[?]|$)": {
        target: backend,
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
}));
