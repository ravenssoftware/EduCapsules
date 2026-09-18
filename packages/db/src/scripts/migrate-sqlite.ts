import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { optionalEnv } from "@educapsules/shared";

/**
 * Applies the SQLite/D1 migrations to a local database file (or
 * :memory:), reproducibly from a clean state. Used for local development
 * and by the test suite; the equivalent D1 path (Phase 25) runs the same
 * generated SQL through Cloudflare's own D1 migration mechanism, not this
 * script.
 */
const filename = optionalEnv("SQLITE_DB_PATH", "./educapsules.sqlite");
const sqlite = new Database(filename);
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite);

migrate(db, { migrationsFolder: "./migrations/sqlite" });
console.log(`SQLite migrations applied to ${filename}`);
sqlite.close();
