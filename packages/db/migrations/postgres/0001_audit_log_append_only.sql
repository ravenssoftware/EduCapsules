-- DB-004, AUD-001/002/004/005: audit_log must be append-only. This is
-- enforced here at the database-privilege level (not merely by application
-- convention), by revoking UPDATE and DELETE on this table from the
-- application's runtime database role.
--
-- PORTABILITY / DEPLOYMENT NOTE (flagged per Phase 3 instructions rather
-- than silently assumed):
-- Postgres has real role-based GRANT/REVOKE, so this mechanism is only
-- meaningful once deployment tooling provisions a distinct, lower-privileged
-- runtime role for the backend to connect as (separate from the
-- migration/owner role, which must retain UPDATE/DELETE to run future
-- migrations). That role's name and provisioning are a deployment/ops
-- decision that has not been made as of Phase 3 -- this migration does not
-- invent one. The block below is a guarded no-op: it revokes the privilege
-- IF a role named 'educapsules_app' already exists, and does nothing
-- otherwise, so it never fails against a database that has no such role
-- yet (e.g. this project's local dev/test databases, which run migrations
-- and seeds as the owning role). When a real deployment role is
-- introduced, either name it 'educapsules_app' or add a matching REVOKE
-- for its actual name at that time.
--
-- SQLite/D1 has no database-level user/privilege system at all (no GRANT,
-- REVOKE, or roles), so this same enforcement is not possible on that
-- dialect -- see migrations/sqlite/0001_audit_log_append_only.sql, which
-- documents that the append-only guarantee must be enforced at the
-- application/service data-access layer there instead.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'educapsules_app') THEN
    EXECUTE 'REVOKE UPDATE, DELETE ON TABLE audit_log FROM educapsules_app';
  END IF;
END
$$;
