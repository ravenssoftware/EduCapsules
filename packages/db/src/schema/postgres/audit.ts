import { foreignKey, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organizations } from "./identity.js";

/**
 * AuditLog — Postgres mirror of ../sqlite/audit.ts. Append-only: see
 * migrations/postgres/*_audit_log_append_only.sql for the REVOKE that
 * removes UPDATE/DELETE from the application role on this table.
 */
export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    actorUserId: text("actor_user_id"),
    actorRole: text("actor_role"),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    beforeRef: text("before_ref"),
    afterRef: text("after_ref"),
    ipHash: text("ip_hash"),
    loginSessionId: text("login_session_id"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    reason: text("reason"),
  },
  (t) => [
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organizations.id],
      name: "audit_log_organization_fk",
    }),
    index("audit_log_target_idx").on(t.organizationId, t.targetType, t.targetId, t.occurredAt),
    index("audit_log_actor_idx").on(t.organizationId, t.actorUserId),
  ],
);
