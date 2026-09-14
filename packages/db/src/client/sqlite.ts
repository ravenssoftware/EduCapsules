import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../schema/sqlite/index.js";

export type SqliteDb = ReturnType<typeof drizzle<typeof schema>>;

/**
 * The local-development and test connection factory for the SQLite
 * dialect. `better-sqlite3` stands in for D1 here — Drizzle's generated
 * SQL is the same for both; only the driver differs (BE-008's portability
 * pattern applied to the database layer itself). When the API actually
 * deploys to Cloudflare Workers with a real D1 binding (not yet — apps/api
 * runs on Node only as of Phase 2/3), the equivalent factory is
 * `drizzle(env.DB, { schema })` from `drizzle-orm/d1`, added at that point
 * rather than now, to avoid taking on a Cloudflare-specific type dependency
 * before anything actually uses it.
 */
export function createSqliteDb(filename: string | ":memory:" = ":memory:"): SqliteDb {
  const sqlite = new Database(filename);
  sqlite.pragma("journal_mode = WAL");
  // D1's own FK enforcement has historically been weaker/evolving; this
  // package always declares FKs (DB-009) and, for the local/better-sqlite3
  // path specifically, also turns on real enforcement so tests catch
  // violations the same way Postgres would.
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}
