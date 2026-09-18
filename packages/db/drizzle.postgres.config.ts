import { defineConfig } from "drizzle-kit";

/**
 * PostgreSQL migration generation for the production target (SRS §41.4).
 * `generate` only diffs the schema and writes SQL files — it never
 * connects to a live database, so no credentials are needed here. Applying
 * the generated migrations (scripts/migrate-postgres.ts) does need a
 * connection, read from DATABASE_URL at that point, never hard-coded.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/postgres/index.ts",
  out: "./migrations/postgres",
  verbose: true,
  strict: true,
});
