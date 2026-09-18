import { defineConfig } from "@playwright/test";

/**
 * Playwright, retained per docs/decisions/06-flutter-client-decision.md §0,
 * scoped to API/contract-level testing — the client is Flutter, not a
 * browser app, so there is no UI here for Playwright to drive. This
 * exercises the real HTTP server end to end (SES §46 use-case level),
 * complementing the in-process Vitest tests in src/app.test.ts.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:8787",
  },
  webServer: {
    command: "pnpm run dev",
    url: "http://localhost:8787/health",
    reuseExistingServer: !process.env["CI"],
    timeout: 30_000,
  },
});
