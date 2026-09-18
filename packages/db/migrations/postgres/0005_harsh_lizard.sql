CREATE TABLE "assistant_assignment_permissions" (
	"organization_id" text NOT NULL,
	"assistant_assignment_id" text NOT NULL,
	"permission_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "assistant_assignment_permissions_assistant_assignment_id_permission_id_pk" PRIMARY KEY("assistant_assignment_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "assistant_assignment_scopes" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"assistant_assignment_id" text NOT NULL,
	"scope_type" text NOT NULL,
	"scope_id" text NOT NULL,
	CONSTRAINT "assistant_assignment_scopes_scope_type_check" CHECK ("assistant_assignment_scopes"."scope_type" IN ('CLASSROOM', 'GROUP', 'SUBJECT', 'COURSE', 'CYCLE'))
);
--> statement-breakpoint
CREATE TABLE "assistant_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"assistant_user_id" text NOT NULL,
	"teacher_user_id" text NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_until" timestamp with time zone,
	"status" text DEFAULT 'active' NOT NULL,
	"created_by" text,
	"revoked_at" timestamp with time zone,
	"revoked_by" text,
	"revocation_reason" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "assistant_assignments_org_id_unique" UNIQUE("organization_id","id"),
	CONSTRAINT "assistant_assignments_status_check" CHECK ("assistant_assignments"."status" IN ('pending', 'active', 'expired', 'revoked', 'suspended'))
);
--> statement-breakpoint
CREATE TABLE "parent_links" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"parent_user_id" text NOT NULL,
	"student_user_id" text NOT NULL,
	"relationship" text NOT NULL,
	"requested_by" text,
	"confirmed_at" timestamp with time zone,
	"confirmed_by" text,
	"revoked_at" timestamp with time zone,
	"revoked_by" text,
	"status" text DEFAULT 'requested' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "parent_links_status_check" CHECK ("parent_links"."status" IN ('requested', 'confirmed', 'revoked'))
);
--> statement-breakpoint
ALTER TABLE "assistant_assignment_permissions" ADD CONSTRAINT "assistant_assignment_permissions_assignment_fk" FOREIGN KEY ("organization_id","assistant_assignment_id") REFERENCES "public"."assistant_assignments"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_assignment_permissions" ADD CONSTRAINT "assistant_assignment_permissions_organization_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_assignment_permissions" ADD CONSTRAINT "assistant_assignment_permissions_permission_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_assignment_scopes" ADD CONSTRAINT "assistant_assignment_scopes_assignment_fk" FOREIGN KEY ("organization_id","assistant_assignment_id") REFERENCES "public"."assistant_assignments"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_assignment_scopes" ADD CONSTRAINT "assistant_assignment_scopes_organization_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_assignments" ADD CONSTRAINT "assistant_assignments_organization_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_assignments" ADD CONSTRAINT "assistant_assignments_assistant_fk" FOREIGN KEY ("organization_id","assistant_user_id") REFERENCES "public"."users"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_assignments" ADD CONSTRAINT "assistant_assignments_teacher_fk" FOREIGN KEY ("organization_id","teacher_user_id") REFERENCES "public"."users"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_links" ADD CONSTRAINT "parent_links_organization_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_links" ADD CONSTRAINT "parent_links_parent_fk" FOREIGN KEY ("organization_id","parent_user_id") REFERENCES "public"."users"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_links" ADD CONSTRAINT "parent_links_student_fk" FOREIGN KEY ("organization_id","student_user_id") REFERENCES "public"."users"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assistant_assignment_scopes_assignment_idx" ON "assistant_assignment_scopes" USING btree ("assistant_assignment_id");--> statement-breakpoint
CREATE INDEX "assistant_assignment_scopes_scope_idx" ON "assistant_assignment_scopes" USING btree ("organization_id","scope_type","scope_id");--> statement-breakpoint
CREATE INDEX "assistant_assignments_org_assistant_idx" ON "assistant_assignments" USING btree ("organization_id","assistant_user_id");--> statement-breakpoint
CREATE INDEX "assistant_assignments_org_teacher_idx" ON "assistant_assignments" USING btree ("organization_id","teacher_user_id");--> statement-breakpoint
CREATE INDEX "parent_links_org_parent_idx" ON "parent_links" USING btree ("organization_id","parent_user_id");--> statement-breakpoint
CREATE INDEX "parent_links_org_student_idx" ON "parent_links" USING btree ("organization_id","student_user_id");