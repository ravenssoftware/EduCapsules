-- DB-004: security_events is append-only, same documented gap as
-- audit_log on this dialect (see migrations/sqlite/0001_audit_log_append_only.sql
-- for the full rationale) — SQLite/D1 has no database-level privilege
-- system, so enforcement here is an application/service-layer requirement.
-- No-op placeholder so the SQLite and Postgres migration sequences stay
-- numbered in lockstep.
SELECT 1;
