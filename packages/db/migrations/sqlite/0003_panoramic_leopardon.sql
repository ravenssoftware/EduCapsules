CREATE TABLE `email_verification_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`,`user_id`) REFERENCES `users`(`organization_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `email_verification_tokens_user_idx` ON `email_verification_tokens` (`organization_id`,`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `email_verification_tokens_hash_unique` ON `email_verification_tokens` (`token_hash`);--> statement-breakpoint
CREATE TABLE `login_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`session_type` text DEFAULT 'standard' NOT NULL,
	`device_fingerprint` text,
	`ip_hash` text,
	`user_agent` text,
	`mfa_verified_at` integer,
	`issued_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	`idle_expires_at` integer NOT NULL,
	`absolute_expires_at` integer NOT NULL,
	`revoked_at` integer,
	`revocation_reason` text,
	`rotated_from_session_id` text,
	FOREIGN KEY (`organization_id`,`user_id`) REFERENCES `users`(`organization_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`,`rotated_from_session_id`) REFERENCES `login_sessions`(`organization_id`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `login_sessions_user_idx` ON `login_sessions` (`organization_id`,`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `login_sessions_org_id_unique` ON `login_sessions` (`organization_id`,`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `login_sessions_token_hash_unique` ON `login_sessions` (`token_hash`);--> statement-breakpoint
CREATE TABLE `mfa_factors` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`type` text DEFAULT 'TOTP' NOT NULL,
	`secret_ciphertext` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`verified_at` integer,
	`last_used_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`,`user_id`) REFERENCES `users`(`organization_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "mfa_factors_type_check" CHECK("mfa_factors"."type" IN ('TOTP')),
	CONSTRAINT "mfa_factors_status_check" CHECK("mfa_factors"."status" IN ('pending', 'active', 'disabled'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mfa_factors_org_id_unique` ON `mfa_factors` (`organization_id`,`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `mfa_factors_org_user_type_unique` ON `mfa_factors` (`organization_id`,`user_id`,`type`);--> statement-breakpoint
CREATE TABLE `mfa_recovery_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`mfa_factor_id` text NOT NULL,
	`code_hash` text NOT NULL,
	`used_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`,`user_id`) REFERENCES `users`(`organization_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`,`mfa_factor_id`) REFERENCES `mfa_factors`(`organization_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `mfa_recovery_codes_user_idx` ON `mfa_recovery_codes` (`organization_id`,`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `mfa_recovery_codes_hash_unique` ON `mfa_recovery_codes` (`code_hash`);--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`request_ip_hash` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`,`user_id`) REFERENCES `users`(`organization_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `password_reset_tokens_user_idx` ON `password_reset_tokens` (`organization_id`,`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `password_reset_tokens_hash_unique` ON `password_reset_tokens` (`token_hash`);--> statement-breakpoint
CREATE TABLE `security_events` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text,
	`user_id` text,
	`event_type` text NOT NULL,
	`severity` text DEFAULT 'medium' NOT NULL,
	`ip_hash` text,
	`user_agent` text,
	`occurred_at` integer NOT NULL,
	`details` text,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "security_events_event_type_check" CHECK("security_events"."event_type" IN ('RATE_LIMIT_EXCEEDED', 'LOGIN_BRUTE_FORCE', 'ACCOUNT_LOCKED', 'TOKEN_REUSE_DETECTED', 'SUSPICIOUS_SESSION')),
	CONSTRAINT "security_events_severity_check" CHECK("security_events"."severity" IN ('medium', 'high', 'critical'))
);
--> statement-breakpoint
CREATE INDEX `security_events_org_idx` ON `security_events` (`organization_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `security_events_user_idx` ON `security_events` (`user_id`,`occurred_at`);--> statement-breakpoint
-- HAND-FIXED: drizzle-kit's generated INSERT below originally listed
-- failed_login_count/locked_until/email_verified_at in both the target
-- and source column lists, but those columns do not exist yet on the OLD
-- `users` table being copied from (they are new in this same migration) —
-- the original generated SQL failed with "no such column". Removed from
-- both lists so SQLite applies each new column's own DEFAULT (0 / NULL /
-- NULL) instead, which is the correct behavior for a same-migration
-- add-column-and-rebuild. Verified against a real database after the fix.
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`password_hash` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`locale` text NOT NULL,
	`timezone` text NOT NULL,
	`mfa_enabled` integer DEFAULT false NOT NULL,
	`failed_login_count` integer DEFAULT 0 NOT NULL,
	`locked_until` integer,
	`email_verified_at` integer,
	`created_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`deleted_by` text,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "users_status_check" CHECK("__new_users"."status" IN ('pending', 'active', 'suspended', 'locked', 'deactivated', 'anonymised', 'purged'))
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "organization_id", "email", "phone", "password_hash", "status", "locale", "timezone", "mfa_enabled", "created_by", "created_at", "updated_at", "deleted_at", "deleted_by") SELECT "id", "organization_id", "email", "phone", "password_hash", "status", "locale", "timezone", "mfa_enabled", "created_by", "created_at", "updated_at", "deleted_at", "deleted_by" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `users_org_idx` ON `users` (`organization_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_org_email_unique` ON `users` (`organization_id`,`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_org_id_unique` ON `users` (`organization_id`,`id`);