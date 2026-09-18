ALTER TABLE "users" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_by" text;--> statement-breakpoint
ALTER TABLE "classrooms" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "classrooms" ADD COLUMN "deleted_by" text;--> statement-breakpoint
ALTER TABLE "course_audiences" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "deleted_by" text;--> statement-breakpoint
ALTER TABLE "cycles" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "deleted_by" text;--> statement-breakpoint
ALTER TABLE "memberships" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "deleted_by" text;--> statement-breakpoint
ALTER TABLE "topics" ADD COLUMN "created_by" text;