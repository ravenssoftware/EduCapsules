import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { requireEnv } from "@educapsules/shared";

/**
 * Applies the PostgreSQL migrations, reproducibly from a clean database.
 * DATABASE_URL is required and never defaulted to anything real — see
 * .env.example.
 */
async function main() {
  const pool = new Pool({ connectionString: requireEnv("DATABASE_URL") });
  const db = drizzle(pool);

  await migrate(db, { migrationsFolder: "./migrations/postgres" });
  console.log("PostgreSQL migrations applied");
  await pool.end();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
