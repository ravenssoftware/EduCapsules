-- DB-004: security_events is append-only, same treatment as audit_log
-- (see migrations/postgres/0001_audit_log_append_only.sql for the full
-- rationale — this migration is the same guarded, role-name-pending
-- REVOKE pattern applied to the second DB-004 table).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'educapsules_app') THEN
    EXECUTE 'REVOKE UPDATE, DELETE ON TABLE security_events FROM educapsules_app';
  END IF;
END
$$;
