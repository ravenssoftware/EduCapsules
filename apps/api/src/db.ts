import { createPostgresDb, createSqliteDb, postgresSchema, sqliteSchema } from "@educapsules/db";
import { optionalEnv } from "@educapsules/shared";
import { createAuthRepository, type AuthRepository } from "./modules/auth/repository.js";

/**
 * Selects the active database dialect for this process — SQLite (D1
 * stand-in, the default for local development) when DATABASE_URL is unset,
 * PostgreSQL when it is. Mirrors packages/db's own test-suite convention
 * (packages/db/src/schema/postgres/db-behavior.test.ts) rather than
 * inventing a second env-var convention for the same decision.
 */
export interface AppDatabase {
  authRepository: AuthRepository;
  close: () => Promise<void>;
}

export function createAppDatabase(): AppDatabase {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    const { db, close } = createPostgresDb(databaseUrl);
    return { authRepository: createAuthRepository(db, postgresSchema), close };
  }
  const sqlitePath = optionalEnv("SQLITE_DB_PATH", "./educapsules.sqlite");
  const db = createSqliteDb(sqlitePath);
  return { authRepository: createAuthRepository(db, sqliteSchema), close: () => Promise.resolve() };
}
