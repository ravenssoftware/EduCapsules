import { foreignKey, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { organizations } from "./identity.js";

/**
 * AuditLog — SRS §37.3.5 (Table 37.6), DB-004, AUD-001/002/004/005.
 * Append-only: the application's database role receives no UPDATE/DELETE
 * grant on this table (enforced at the database-user-privilege level in
 * the migration, not merely by application convention — see
 * migrations/*_audit_log_append_only.sql).
 */
export const auditLog = sqliteTable(
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
    occurredAt: integer("occurred_at", { mode: "timestamp_ms" }).notNull(),
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
