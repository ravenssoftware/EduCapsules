CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"timezone" text NOT NULL,
	"locale" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"plan_id" text,
	"closed_at" timestamp with time zone,
	"closure_reason" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug"),
	CONSTRAINT "organizations_status_check" CHECK ("organizations"."status" IN ('active', 'closure_requested', 'closure_confirmed', 'grace_period', 'read_only', 'archived'))
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"category" text NOT NULL,
	"is_delegatable" boolean DEFAULT false NOT NULL,
	"description" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "permissions_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" text NOT NULL,
	"permission_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "roles_org_key_unique" UNIQUE("organization_id","key"),
	CONSTRAINT "roles_org_id_unique" UNIQUE("organization_id","id")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"avatar_file_id" text,
	"bio" text,
	"contact_preferences" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_role_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role_id" text NOT NULL,
	"scope_type" text NOT NULL,
	"scope_id" text,
	"granted_by" text,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_until" timestamp with time zone,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "user_role_assignments_scope_type_check" CHECK ("user_role_assignments"."scope_type" IN ('ORG', 'CLASSROOM', 'GROUP', 'SUBJECT', 'COURSE'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"password_hash" text,
	"status" text DEFAULT 'active' NOT NULL,
	"locale" text NOT NULL,
	"timezone" text NOT NULL,
	"mfa_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_org_email_unique" UNIQUE("organization_id","email"),
	CONSTRAINT "users_org_id_unique" UNIQUE("organization_id","id")
);
--> statement-breakpoint
CREATE TABLE "academic_periods" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"status" text DEFAULT 'planned' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "academic_periods_org_id_unique" UNIQUE("organization_id","id")
);
--> statement-breakpoint
CREATE TABLE "classrooms" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"grade_level" text,
	"academic_period_id" text NOT NULL,
	"homeroom_teacher_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "classrooms_org_id_unique" UNIQUE("organization_id","id")
);
--> statement-breakpoint
CREATE TABLE "course_audiences" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"course_id" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "course_audiences_unique" UNIQUE("course_id","target_type","target_id"),
	CONSTRAINT "course_audiences_target_type_check" CHECK ("course_audiences"."target_type" IN ('classroom', 'group'))
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"subject_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"owner_teacher_id" text NOT NULL,
	"academic_period_id" text NOT NULL,
	"visibility" text DEFAULT 'organization' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "courses_org_id_unique" UNIQUE("organization_id","id"),
	CONSTRAINT "courses_status_check" CHECK ("courses"."status" IN ('draft', 'published', 'archived'))
);
--> statement-breakpoint
CREATE TABLE "cycles" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"course_id" text NOT NULL,
	"title" text NOT NULL,
	"sequence_no" integer NOT NULL,
	"starts_on" date,
	"ends_on" date,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "cycles_org_id_unique" UNIQUE("organization_id","id"),
	CONSTRAINT "cycles_course_sequence_unique" UNIQUE("course_id","sequence_no")
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"student_user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"academic_period_id" text NOT NULL,
	"enrolled_at" timestamp with time zone NOT NULL,
	"withdrawn_at" timestamp with time zone,
	"status" text DEFAULT 'active' NOT NULL,
	"source" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"classroom_id" text NOT NULL,
	"name" text NOT NULL,
	"purpose" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "groups_org_id_unique" UNIQUE("organization_id","id")
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"container_type" text NOT NULL,
	"container_id" text NOT NULL,
	"role_in_container" text,
	"joined_at" timestamp with time zone NOT NULL,
	"left_at" timestamp with time zone,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "memberships_container_type_check" CHECK ("memberships"."container_type" IN ('classroom', 'group'))
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "subjects_org_id_unique" UNIQUE("organization_id","id"),
	CONSTRAINT "subjects_org_code_unique" UNIQUE("organization_id","code")
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"cycle_id" text NOT NULL,
	"title" text NOT NULL,
	"sequence_no" integer NOT NULL,
	"learning_objectives" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "topics_org_id_unique" UNIQUE("organization_id","id"),
	CONSTRAINT "topics_cycle_sequence_unique" UNIQUE("cycle_id","sequence_no")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"actor_user_id" text,
	"actor_role" text,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"before_ref" text,
	"after_ref" text,
	"ip_hash" text,
	"login_session_id" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"reason" text
);
--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_organization_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_user_fk" FOREIGN KEY ("organization_id","user_id") REFERENCES "public"."users"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_role_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_organization_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_periods" ADD CONSTRAINT "academic_periods_organization_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_organization_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_academic_period_fk" FOREIGN KEY ("organization_id","academic_period_id") REFERENCES "public"."academic_periods"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_homeroom_teacher_fk" FOREIGN KEY ("organization_id","homeroom_teacher_id") REFERENCES "public"."users"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_audiences" ADD CONSTRAINT "course_audiences_course_fk" FOREIGN KEY ("organization_id","course_id") REFERENCES "public"."courses"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_audiences" ADD CONSTRAINT "course_audiences_organization_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_organization_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_subject_fk" FOREIGN KEY ("organization_id","subject_id") REFERENCES "public"."subjects"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_academic_period_fk" FOREIGN KEY ("organization_id","academic_period_id") REFERENCES "public"."academic_periods"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_owner_teacher_fk" FOREIGN KEY ("organization_id","owner_teacher_id") REFERENCES "public"."users"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycles" ADD CONSTRAINT "cycles_course_fk" FOREIGN KEY ("organization_id","course_id") REFERENCES "public"."courses"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycles" ADD CONSTRAINT "cycles_organization_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_fk" FOREIGN KEY ("organization_id","student_user_id") REFERENCES "public"."users"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_fk" FOREIGN KEY ("organization_id","course_id") REFERENCES "public"."courses"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_academic_period_fk" FOREIGN KEY ("organization_id","academic_period_id") REFERENCES "public"."academic_periods"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_organization_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_organization_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_classroom_fk" FOREIGN KEY ("organization_id","classroom_id") REFERENCES "public"."classrooms"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_fk" FOREIGN KEY ("organization_id","user_id") REFERENCES "public"."users"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_organization_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_cycle_fk" FOREIGN KEY ("organization_id","cycle_id") REFERENCES "public"."cycles"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_organization_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_organization_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_role_assignments_user_idx" ON "user_role_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_role_assignments_scope_idx" ON "user_role_assignments" USING btree ("scope_type","scope_id");--> statement-breakpoint
CREATE INDEX "users_org_idx" ON "users" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "academic_periods_org_idx" ON "academic_periods" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "classrooms_org_period_idx" ON "classrooms" USING btree ("organization_id","academic_period_id");--> statement-breakpoint
CREATE INDEX "course_audiences_target_idx" ON "course_audiences" USING btree ("organization_id","target_type","target_id");--> statement-breakpoint
CREATE INDEX "courses_org_subject_idx" ON "courses" USING btree ("organization_id","subject_id");--> statement-breakpoint
CREATE INDEX "courses_org_period_idx" ON "courses" USING btree ("organization_id","academic_period_id");--> statement-breakpoint
CREATE INDEX "cycles_org_course_idx" ON "cycles" USING btree ("organization_id","course_id");--> statement-breakpoint
CREATE INDEX "enrollments_org_course_idx" ON "enrollments" USING btree ("organization_id","course_id");--> statement-breakpoint
CREATE INDEX "enrollments_org_student_idx" ON "enrollments" USING btree ("organization_id","student_user_id");--> statement-breakpoint
CREATE INDEX "groups_org_classroom_idx" ON "groups" USING btree ("organization_id","classroom_id");--> statement-breakpoint
CREATE INDEX "memberships_container_idx" ON "memberships" USING btree ("organization_id","container_type","container_id");--> statement-breakpoint
CREATE INDEX "memberships_user_idx" ON "memberships" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "topics_org_cycle_idx" ON "topics" USING btree ("organization_id","cycle_id");--> statement-breakpoint
CREATE INDEX "audit_log_target_idx" ON "audit_log" USING btree ("organization_id","target_type","target_id","occurred_at");--> statement-breakpoint
CREATE INDEX "audit_log_actor_idx" ON "audit_log" USING btree ("organization_id","actor_user_id");