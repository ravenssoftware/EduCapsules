PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_academic_periods` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`starts_on` text NOT NULL,
	`ends_on` text NOT NULL,
	`status` text DEFAULT 'planned' NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "academic_periods_status_check" CHECK("__new_academic_periods"."status" IN ('planned', 'active', 'closed'))
);
--> statement-breakpoint
INSERT INTO `__new_academic_periods`("id", "organization_id", "name", "starts_on", "ends_on", "status", "created_by", "created_at", "updated_at") SELECT "id", "organization_id", "name", "starts_on", "ends_on", "status", "created_by", "created_at", "updated_at" FROM `academic_periods`;--> statement-breakpoint
DROP TABLE `academic_periods`;--> statement-breakpoint
ALTER TABLE `__new_academic_periods` RENAME TO `academic_periods`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `academic_periods_org_idx` ON `academic_periods` (`organization_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `academic_periods_org_id_unique` ON `academic_periods` (`organization_id`,`id`);--> statement-breakpoint
CREATE TABLE `__new_enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`student_user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`academic_period_id` text NOT NULL,
	`enrolled_at` integer NOT NULL,
	`withdrawn_at` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`source` text,
	`created_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`,`student_user_id`) REFERENCES `users`(`organization_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`,`course_id`) REFERENCES `courses`(`organization_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`,`academic_period_id`) REFERENCES `academic_periods`(`organization_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "enrollments_status_check" CHECK("__new_enrollments"."status" IN ('requested', 'active', 'withdrawn', 'completed', 'transferred'))
);
--> statement-breakpoint
INSERT INTO `__new_enrollments`("id", "organization_id", "student_user_id", "course_id", "academic_period_id", "enrolled_at", "withdrawn_at", "status", "source", "created_by", "created_at", "updated_at") SELECT "id", "organization_id", "student_user_id", "course_id", "academic_period_id", "enrolled_at", "withdrawn_at", "status", "source", "created_by", "created_at", "updated_at" FROM `enrollments`;--> statement-breakpoint
DROP TABLE `enrollments`;--> statement-breakpoint
ALTER TABLE `__new_enrollments` RENAME TO `enrollments`;--> statement-breakpoint
CREATE INDEX `enrollments_org_course_idx` ON `enrollments` (`organization_id`,`course_id`);--> statement-breakpoint
CREATE INDEX `enrollments_org_student_idx` ON `enrollments` (`organization_id`,`student_user_id`);