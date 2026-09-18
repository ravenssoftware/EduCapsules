CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`timezone` text NOT NULL,
	`locale` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`plan_id` text,
	`closed_at` integer,
	`closure_reason` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "organizations_status_check" CHECK("organizations"."status" IN ('active', 'closure_requested', 'closure_confirmed', 'grace_period', 'read_only', 'archived'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_slug_unique` ON `organizations` (`slug`);--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`category` text NOT NULL,
	`is_delegatable` integer DEFAULT false NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `permissions_key_unique` ON `permissions` (`key`);--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`role_id` text NOT NULL,
	`permission_id` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`role_id`, `permission_id`),
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`is_system` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_org_key_unique` ON `roles` (`organization_id`,`key`);--> statement-breakpoint
CREATE UNIQUE INDEX `roles_org_id_unique` ON `roles` (`organization_id`,`id`);--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`avatar_file_id` text,
	`bio` text,
	`contact_preferences` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_role_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role_id` text NOT NULL,
	`scope_type` text NOT NULL,
	`scope_id` text,
	`granted_by` text,
	`valid_from` integer NOT NULL,
	`valid_until` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`,`user_id`) REFERENCES `users`(`organization_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "user_role_assignments_scope_type_check" CHECK("user_role_assignments"."scope_type" IN ('ORG', 'CLASSROOM', 'GROUP', 'SUBJECT', 'COURSE'))
);
--> statement-breakpoint
CREATE INDEX `user_role_assignments_user_idx` ON `user_role_assignments` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_role_assignments_scope_idx` ON `user_role_assignments` (`scope_type`,`scope_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`password_hash` text,
	`status` text DEFAULT 'active' NOT NULL,
	`locale` text NOT NULL,
	`timezone` text NOT NULL,
	`mfa_enabled` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `users_org_idx` ON `users` (`organization_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_org_email_unique` ON `users` (`organization_id`,`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_org_id_unique` ON `users` (`organization_id`,`id`);--> statement-breakpoint
CREATE TABLE `academic_periods` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`starts_on` text NOT NULL,
	`ends_on` text NOT NULL,
	`status` text DEFAULT 'planned' NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `academic_periods_org_idx` ON `academic_periods` (`organization_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `academic_periods_org_id_unique` ON `academic_periods` (`organization_id`,`id`);--> statement-breakpoint
CREATE TABLE `classrooms` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`grade_level` text,
	`academic_period_id` text NOT NULL,
	`homeroom_teacher_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`,`academic_period_id`) REFERENCES `academic_periods`(`organization_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`,`homeroom_teacher_id`) REFERENCES `users`(`organization_id`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `classrooms_org_period_idx` ON `classrooms` (`organization_id`,`academic_period_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `classrooms_org_id_unique` ON `classrooms` (`organization_id`,`id`);--> statement-breakpoint
CREATE TABLE `course_audiences` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`course_id` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`,`course_id`) REFERENCES `courses`(`organization_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "course_audiences_target_type_check" CHECK("course_audiences"."target_type" IN ('classroom', 'group'))
);
--> statement-breakpoint
CREATE INDEX `course_audiences_target_idx` ON `course_audiences` (`organization_id`,`target_type`,`target_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `course_audiences_unique` ON `course_audiences` (`course_id`,`target_type`,`target_id`);--> statement-breakpoint
CREATE TABLE `courses` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`subject_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`owner_teacher_id` text NOT NULL,
	`academic_period_id` text NOT NULL,
	`visibility` text DEFAULT 'organization' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`,`subject_id`) REFERENCES `subjects`(`organization_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`,`academic_period_id`) REFERENCES `academic_periods`(`organization_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`,`owner_teacher_id`) REFERENCES `users`(`organization_id`,`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "courses_status_check" CHECK("courses"."status" IN ('draft', 'published', 'archived'))
);
--> statement-breakpoint
CREATE INDEX `courses_org_subject_idx` ON `courses` (`organization_id`,`subject_id`);--> statement-breakpoint
CREATE INDEX `courses_org_period_idx` ON `courses` (`organization_id`,`academic_period_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `courses_org_id_unique` ON `courses` (`organization_id`,`id`);--> statement-breakpoint
CREATE TABLE `cycles` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`course_id` text NOT NULL,
	`title` text NOT NULL,
	`sequence_no` integer NOT NULL,
	`starts_on` text,
	`ends_on` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`,`course_id`) REFERENCES `courses`(`organization_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `cycles_org_course_idx` ON `cycles` (`organization_id`,`course_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `cycles_org_id_unique` ON `cycles` (`organization_id`,`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `cycles_course_sequence_unique` ON `cycles` (`course_id`,`sequence_no`);--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`student_user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`academic_period_id` text NOT NULL,
	`enrolled_at` integer NOT NULL,
	`withdrawn_at` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`source` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`,`student_user_id`) REFERENCES `users`(`organization_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`,`course_id`) REFERENCES `courses`(`organization_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`,`academic_period_id`) REFERENCES `academic_periods`(`organization_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `enrollments_org_course_idx` ON `enrollments` (`organization_id`,`course_id`);--> statement-breakpoint
CREATE INDEX `enrollments_org_student_idx` ON `enrollments` (`organization_id`,`student_user_id`);--> statement-breakpoint
CREATE TABLE `groups` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`classroom_id` text NOT NULL,
	`name` text NOT NULL,
	`purpose` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`,`classroom_id`) REFERENCES `classrooms`(`organization_id`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `groups_org_classroom_idx` ON `groups` (`organization_id`,`classroom_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `groups_org_id_unique` ON `groups` (`organization_id`,`id`);--> statement-breakpoint
CREATE TABLE `memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`container_type` text NOT NULL,
	`container_id` text NOT NULL,
	`role_in_container` text,
	`joined_at` integer NOT NULL,
	`left_at` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`,`user_id`) REFERENCES `users`(`organization_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "memberships_container_type_check" CHECK("memberships"."container_type" IN ('classroom', 'group'))
);
--> statement-breakpoint
CREATE INDEX `memberships_container_idx` ON `memberships` (`organization_id`,`container_type`,`container_id`);--> statement-breakpoint
CREATE INDEX `memberships_user_idx` ON `memberships` (`organization_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`code` text,
	`description` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subjects_org_id_unique` ON `subjects` (`organization_id`,`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `subjects_org_code_unique` ON `subjects` (`organization_id`,`code`);--> statement-breakpoint
CREATE TABLE `topics` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`cycle_id` text NOT NULL,
	`title` text NOT NULL,
	`sequence_no` integer NOT NULL,
	`learning_objectives` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`,`cycle_id`) REFERENCES `cycles`(`organization_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `topics_org_cycle_idx` ON `topics` (`organization_id`,`cycle_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `topics_org_id_unique` ON `topics` (`organization_id`,`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `topics_cycle_sequence_unique` ON `topics` (`cycle_id`,`sequence_no`);--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`actor_user_id` text,
	`actor_role` text,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`before_ref` text,
	`after_ref` text,
	`ip_hash` text,
	`login_session_id` text,
	`occurred_at` integer NOT NULL,
	`reason` text,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `audit_log_target_idx` ON `audit_log` (`organization_id`,`target_type`,`target_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `audit_log_actor_idx` ON `audit_log` (`organization_id`,`actor_user_id`);