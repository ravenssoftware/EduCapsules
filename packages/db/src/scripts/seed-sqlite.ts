import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { optionalEnv } from "@educapsules/shared";
import * as schema from "../schema/sqlite/index.js";
import { devSampleData, systemRoleRows } from "../seed/data.js";

/**
 * Seeds the five system roles (safe in every environment, including
 * production — SRS GEN-006). Pass --dev to additionally seed the
 * synthetic dev/test sample data (organization, users, classroom, etc.);
 * that flag is refused outright when NODE_ENV=production, so a synthetic
 * fixture organization can never land in a real deployment by accident.
 */
const includeDevData = process.argv.includes("--dev");

if (includeDevData && optionalEnv("NODE_ENV", "development") === "production") {
  console.error("Refusing to seed synthetic dev sample data with NODE_ENV=production.");
  process.exit(1);
}

const filename = optionalEnv("SQLITE_DB_PATH", "./educapsules.sqlite");
const sqlite = new Database(filename);
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite, { schema });

db.insert(schema.roles).values(systemRoleRows()).onConflictDoNothing().run();
console.log(`Seeded ${systemRoleRows().length} system roles into ${filename}`);

if (includeDevData) {
  const sample = devSampleData();
  db.insert(schema.organizations).values(sample.organization).onConflictDoNothing().run();
  db.insert(schema.users).values(sample.users).onConflictDoNothing().run();
  db.insert(schema.academicPeriods).values(sample.academicPeriod).onConflictDoNothing().run();
  db.insert(schema.classrooms).values(sample.classroom).onConflictDoNothing().run();
  db.insert(schema.groups).values(sample.group).onConflictDoNothing().run();
  db.insert(schema.memberships).values(sample.membership).onConflictDoNothing().run();
  db.insert(schema.subjects).values(sample.subject).onConflictDoNothing().run();
  db.insert(schema.courses).values(sample.course).onConflictDoNothing().run();
  console.log("Seeded synthetic dev sample data (organization, users, classroom, course).");
}

sqlite.close();
