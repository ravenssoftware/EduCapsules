import { serve } from "@hono/node-server";
import { optionalEnv } from "@educapsules/shared";
import { createApp } from "./app.js";

// Configuration from the environment only (SRS BE-007) — .env is never
// committed (see .env.example); loadEnvFile is a no-op if the file is absent.
try {
  process.loadEnvFile();
} catch {
  // No .env file present — fine outside local development (CI, containers
  // supply real environment variables directly).
}

const port = Number(optionalEnv("PORT", "8787"));
const app = createApp();

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`EduCapsules API listening on http://localhost:${info.port}`);
});
