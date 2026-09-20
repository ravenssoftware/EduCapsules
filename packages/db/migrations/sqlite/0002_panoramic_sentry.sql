ALTER TABLE `users` ADD `created_by` text;--> statement-breakpoint
ALTER TABLE `users` ADD `deleted_by` text;--> statement-breakpoint
ALTER TABLE `classrooms` ADD `created_by` text;--> statement-breakpoint
ALTER TABLE `classrooms` ADD `deleted_by` text;--> statement-breakpoint
ALTER TABLE `course_audiences` ADD `created_by` text;--> statement-breakpoint
ALTER TABLE `courses` ADD `created_by` text;--> statement-breakpoint
ALTER TABLE `courses` ADD `deleted_by` text;--> statement-breakpoint
ALTER TABLE `cycles` ADD `created_by` text;--> statement-breakpoint
ALTER TABLE `enrollments` ADD `created_by` text;--> statement-breakpoint
ALTER TABLE `groups` ADD `created_by` text;--> statement-breakpoint
ALTER TABLE `groups` ADD `deleted_by` text;--> statement-breakpoint
ALTER TABLE `memberships` ADD `created_by` text;--> statement-breakpoint
ALTER TABLE `subjects` ADD `created_by` text;--> statement-breakpoint
ALTER TABLE `subjects` ADD `deleted_by` text;--> statement-breakpoint
ALTER TABLE `topics` ADD `created_by` text;