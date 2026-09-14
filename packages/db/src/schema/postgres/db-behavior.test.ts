import { fileURLToPath } from "node:url";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { eq } from "drizzle-orm";
import { uuid7 } from "@educapsules/shared";
import * as schema from "./index.js";
import { insertOrg, insertUser, runDbBehaviorScenarios } from "../db-behavior-scenarios.js";

/**
 * Real-engine behavior tests for the PostgreSQL dialect. Requires a real
 * Postgres reachable at DATABASE_URL (a local dev instance, or the CI
 * Postgres service container — see .github/workflows/ci.yml). Skipped,
 * not failed, when DATABASE_URL is unset, so this file doesn't break
 * environments that only have SQLite available.
 */

// Resolved relative to this file, not process.cwd() — this suite must pass
// identically whether run from packages/db (`pnpm test`) or the repo root
// (`pnpm -w run test`, as CI does).
const migrationsFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../migrations/postgres",
);

const connectionString = process.env.DATABASE_URL;

describe.skipIf(!connectionString)("postgres migrations + behavior", () => {
  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema });

  beforeAll(async () => {
    // Clean-database migration test: drop and recreate BOTH the "public"
    // schema (where the real tables live) AND drizzle-kit's own "drizzle"
    // tracking schema (where it records which migrations already ran).
    // Resetting only "public" leaves stale tracking rows behind, so
    // migrate() believes the migrations already ran and silently skips
    // them — leaving "public" empty for the rest of the run. Both must be
    // reset together for this to actually be a from-clean-database test.
    await pool.query(
      'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; DROP SCHEMA IF EXISTS "drizzle" CASCADE;',
    );
    await migrate(db, { migrationsFolder });
  });

  afterAll(async () => {
    await pool.end();
  });

  it("re-applies migrations against an already-migrated database without error", async () => {
    await expect(migrate(db, { migrationsFolder })).resolves.not.toThrow();
  });

  it("rolls back an entire transaction when a later statement violates a constraint", async () => {
    const org = await insertOrg(db, schema);
    const survivorEmail = `rollback-${uuid7()}@example.test`;

    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see db-behavior-scenarios.ts's file-level note on tx typing
      db.transaction(async (tx: any) => {
        await insertUser(tx, schema, org.id, { email: survivorEmail });
        await tx.insert(schema.organizations).values({
          id: uuid7(),
          name: "Rollback probe",
          slug: `rollback-${uuid7()}`,
          timezone: "UTC",
          locale: "en",
          status: "not_a_real_status",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }),
    ).rejects.toThrow();

    const rows = await db.select().from(schema.users).where(eq(schema.users.email, survivorEmail));
    expect(rows).toHaveLength(0);
  });

  runDbBehaviorScenarios({
    dialectName: "postgres",
    db,
    schema,
    execRaw: async (sqlText: string) => {
      await pool.query(sqlText);
    },
  });
});
