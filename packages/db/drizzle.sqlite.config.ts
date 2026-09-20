import { defineConfig } from "drizzle-kit";

/**
 * SQLite/D1 migration generation. Applied locally via better-sqlite3
 * (scripts/migrate-sqlite.ts); the same generated SQL applies unmodified
 * through D1's migration mechanism in the real Cloudflare environment
 * (Phase 25 wires that up) — drizzle-kit's job here is only to diff the
 * schema and emit portable SQL, not to touch a live database itself.
 */
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/schema/sqlite/index.ts",
  out: "./migrations/sqlite",
  verbose: true,
  strict: true,
});
