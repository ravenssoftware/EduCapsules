import { describe, expect, it } from "vitest";
import { getTableColumns, getTableName } from "drizzle-orm";
import * as sqliteSchema from "./sqlite/index.js";
import * as postgresSchema from "./postgres/index.js";

/**
 * Structural-parity test — the enforcement mechanism behind the
 * portability directive (docs/decisions/02-assumptions-register.md A-13)
 * and DB-011/DB-019: Drizzle has no single table builder that targets both
 * SQLite/D1 and Postgres, so the two dialects are maintained as separate,
 * hand-mirrored schema modules. This test is what keeps them honest — if
 * a table or column exists in one dialect and not the other, or if
 * nullability/primary-key status drifts between them, this test fails the
 * build. It does not (and should not) compare concrete SQL column types,
 * since those legitimately differ per engine (e.g. `timestamp with time
 * zone` vs. an integer epoch) as long as the logical meaning is the same.
 */

interface TableModule {
  [exportName: string]: unknown;
}

function collectTables(schemaModule: TableModule) {
  const tables = new Map<string, ReturnType<typeof getTableColumns>>();
  for (const value of Object.values(schemaModule)) {
    // Every exported table object carries a name via getTableName; anything
    // that throws here isn't a table (e.g. a re-exported type) and is skipped.
    try {
      const name = getTableName(value as never);
      tables.set(name, getTableColumns(value as never));
    } catch {
      // not a table export — ignore
    }
  }
  return tables;
}

describe("SQLite <-> Postgres schema parity (portability directive, DB-011/DB-019)", () => {
  const sqliteTables = collectTables(sqliteSchema as TableModule);
  const postgresTables = collectTables(postgresSchema as TableModule);

  it("defines the same set of table names in both dialects", () => {
    const sqliteNames = [...sqliteTables.keys()].sort();
    const postgresNames = [...postgresTables.keys()].sort();
    expect(postgresNames).toEqual(sqliteNames);
  });

  it("has at least one table in each dialect (sanity check against a vacuous pass)", () => {
    expect(sqliteTables.size).toBeGreaterThan(0);
    expect(postgresTables.size).toBeGreaterThan(0);
  });

  for (const [tableName, sqliteColumns] of sqliteTables) {
    it(`"${tableName}": same column names, nullability and primary-key status in both dialects`, () => {
      const postgresColumns = postgresTables.get(tableName);
      expect(postgresColumns, `Postgres schema is missing table "${tableName}"`).toBeDefined();

      const sqliteColumnNames = Object.keys(sqliteColumns).sort();
      const postgresColumnNames = Object.keys(postgresColumns!).sort();
      expect(postgresColumnNames).toEqual(sqliteColumnNames);

      for (const columnKey of sqliteColumnNames) {
        const sqliteCol = (sqliteColumns as Record<string, { notNull: boolean; primary: boolean }>)[
          columnKey
        ]!;
        const postgresCol = (
          postgresColumns as Record<string, { notNull: boolean; primary: boolean }>
        )[columnKey]!;
        expect(
          postgresCol.notNull,
          `${tableName}.${columnKey}: nullability differs between dialects`,
        ).toBe(sqliteCol.notNull);
        expect(
          postgresCol.primary,
          `${tableName}.${columnKey}: primary-key status differs between dialects`,
        ).toBe(sqliteCol.primary);
      }
    });
  }
});
