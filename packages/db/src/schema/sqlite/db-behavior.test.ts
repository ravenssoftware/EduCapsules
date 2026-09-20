import { fileURLToPath } from "node:url";
import path from "node:path";
import { afterAll, beforeAll, expect, it } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { eq } from "drizzle-orm";
import { uuid7 } from "@educapsules/shared";
import * as schema from "./index.js";
import { insertOrg, runDbBehaviorScenarios } from "../db-behavior-scenarios.js";

/**
 * Real-engine behavior tests for the SQLite dialect — an in-memory
 * better-sqlite3 database, migrated with the actual generated migration
 * files (not a hand-written schema), matching what D1 would run.
 */

// Resolved relative to this file, not process.cwd() — this suite must pass
// identically whether run from packages/db (`pnpm test`) or the repo root
// (`pnpm -w run test`, as CI does).
const migrationsFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../migrations/sqlite",
);

const sqlite = new Database(":memory:");
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite, { schema });

beforeAll(() => {
  migrate(db, { migrationsFolder });
});

afterAll(() => {
  sqlite.close();
});

it("applies migrations to a clean database and again to an already-migrated one", () => {
  expect(() => migrate(db, { migrationsFolder })).not.toThrow();
});

it("rolls back an entire transaction when a later statement violates a constraint", async () => {
  // better-sqlite3's transaction wrapper requires a synchronous callback
  // (no async gaps) since the underlying driver is fully synchronous —
  // see drizzle-orm/better-sqlite3/session.ts. .run() on a query builder
  // executes immediately rather than returning a Promise to await.
  const org = await insertOrg(db, schema);
  const survivorEmail = `rollback-${uuid7()}@example.test`;
  const now = new Date();

  expect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see db-behavior-scenarios.ts's file-level note on tx typing
    db.transaction((tx: any) => {
      tx.insert(schema.users)
        .values({
          id: uuid7(),
          organizationId: org.id,
          email: survivorEmail,
          phone: null,
          passwordHash: null,
          status: "active",
          locale: "en",
          timezone: "UTC",
          mfaEnabled: false,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        })
        .run();
      tx.insert(schema.organizations)
        .values({
          id: uuid7(),
          name: "Rollback probe",
          slug: `rollback-${uuid7()}`,
          timezone: "UTC",
          locale: "en",
          status: "not_a_real_status",
          planId: null,
          closedAt: null,
          closureReason: null,
          createdAt: now,
          updatedAt: now,
        })
        .run();
    });
  }).toThrow();

  const rows = await db.select().from(schema.users).where(eq(schema.users.email, survivorEmail));
  expect(rows).toHaveLength(0);
});

runDbBehaviorScenarios({
  dialectName: "sqlite",
  db,
  schema,
  execRaw: async (sqlText: string) => {
    sqlite.exec(sqlText);
  },
});
