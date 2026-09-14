import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { optionalEnv, requireEnv } from "@educapsules/shared";
import * as schema from "../schema/postgres/index.js";
import { devSampleData, systemRoleRows } from "../seed/data.js";

/** Postgres counterpart of seed-sqlite.ts — see that file for the rules. */
const includeDevData = process.argv.includes("--dev");

if (includeDevData && optionalEnv("NODE_ENV", "development") === "production") {
  console.error("Refusing to seed synthetic dev sample data with NODE_ENV=production.");
  process.exit(1);
}

async function main() {
  const pool = new Pool({ connectionString: requireEnv("DATABASE_URL") });
  const db = drizzle(pool, { schema });

  await db.insert(schema.roles).values(systemRoleRows()).onConflictDoNothing();
  console.log(`Seeded ${systemRoleRows().length} system roles`);

  if (includeDevData) {
    const sample = devSampleData();
    await db.insert(schema.organizations).values(sample.organization).onConflictDoNothing();
    await db.insert(schema.users).values(sample.users).onConflictDoNothing();
    await db.insert(schema.academicPeriods).values(sample.academicPeriod).onConflictDoNothing();
    await db.insert(schema.classrooms).values(sample.classroom).onConflictDoNothing();
    await db.insert(schema.groups).values(sample.group).onConflictDoNothing();
    await db.insert(schema.memberships).values(sample.membership).onConflictDoNothing();
    await db.insert(schema.subjects).values(sample.subject).onConflictDoNothing();
    await db.insert(schema.courses).values(sample.course).onConflictDoNothing();
    console.log("Seeded synthetic dev sample data (organization, users, classroom, course).");
  }

  await pool.end();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
