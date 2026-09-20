CREATE TABLE `assistant_assignment_permissions` (
	`organization_id` text NOT NULL,
	`assistant_assignment_id` text NOT NULL,
	`permission_id` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`assistant_assignment_id`, `permission_id`),
	FOREIGN KEY (`organization_id`,`assistant_assignment_id`) REFERENCES `assistant_assignments`(`organization_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `assistant_assignment_scopes` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`assistant_assignment_id` text NOT NULL,
	`scope_type` text NOT NULL,
	`scope_id` text NOT NULL,
	FOREIGN KEY (`organization_id`,`assistant_assignment_id`) REFERENCES `assistant_assignments`(`organization_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "assistant_assignment_scopes_scope_type_check" CHECK("assistant_assignment_scopes"."scope_type" IN ('CLASSROOM', 'GROUP', 'SUBJECT', 'COURSE', 'CYCLE'))
);
--> statement-breakpoint
CREATE INDEX `assistant_assignment_scopes_assignment_idx` ON `assistant_assignment_scopes` (`assistant_assignment_id`);--> statement-breakpoint
CREATE INDEX `assistant_assignment_scopes_scope_idx` ON `assistant_assignment_scopes` (`organization_id`,`scope_type`,`scope_id`);--> statement-breakpoint
CREATE TABLE `assistant_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`assistant_user_id` text NOT NULL,
	`teacher_user_id` text NOT NULL,
	`valid_from` integer NOT NULL,
	`valid_until` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`created_by` text,
	`revoked_at` integer,
	`revoked_by` text,
	`revocation_reason` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`,`assistant_user_id`) REFERENCES `users`(`organization_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`,`teacher_user_id`) REFERENCES `users`(`organization_id`,`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "assistant_assignments_status_check" CHECK("assistant_assignments"."status" IN ('pending', 'active', 'expired', 'revoked', 'suspended'))
);
--> statement-breakpoint
CREATE INDEX `assistant_assignments_org_assistant_idx` ON `assistant_assignments` (`organization_id`,`assistant_user_id`);--> statement-breakpoint
CREATE INDEX `assistant_assignments_org_teacher_idx` ON `assistant_assignments` (`organization_id`,`teacher_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `assistant_assignments_org_id_unique` ON `assistant_assignments` (`organization_id`,`id`);--> statement-breakpoint
CREATE TABLE `parent_links` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`parent_user_id` text NOT NULL,
	`student_user_id` text NOT NULL,
	`relationship` text NOT NULL,
	`requested_by` text,
	`confirmed_at` integer,
	`confirmed_by` text,
	`revoked_at` integer,
	`revoked_by` text,
	`status` text DEFAULT 'requested' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`,`parent_user_id`) REFERENCES `users`(`organization_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`,`student_user_id`) REFERENCES `users`(`organization_id`,`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "parent_links_status_check" CHECK("parent_links"."status" IN ('requested', 'confirmed', 'revoked'))
);
--> statement-breakpoint
CREATE INDEX `parent_links_org_parent_idx` ON `parent_links` (`organization_id`,`parent_user_id`);--> statement-breakpoint
CREATE INDEX `parent_links_org_student_idx` ON `parent_links` (`organization_id`,`student_user_id`);