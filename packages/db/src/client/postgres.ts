import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../schema/postgres/index.js";

export type PostgresDb = ReturnType<typeof drizzle<typeof schema>>;

/**
 * The PostgreSQL connection factory for the production target (SRS §41.4,
 * CON-02). Configuration from the environment only (BE-007) — never a
 * hard-coded connection string.
 */
export function createPostgresDb(connectionString: string): {
  db: PostgresDb;
  close: () => Promise<void>;
} {
  const pool = new Pool({ connectionString });
  return {
    db: drizzle(pool, { schema }),
    close: () => pool.end(),
  };
}
