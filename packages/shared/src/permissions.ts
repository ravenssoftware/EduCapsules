/**
 * Phase 5 — the permission catalogue (SRS §26.1: "The permission catalogue
 * is closed: an action with no permission code cannot be performed").
 * Single source of truth, shared by `packages/db`'s seed data (which
 * inserts one `permissions` row per entry) and `apps/api`'s authz module
 * (which imports `EducationalPermissionKey` for compile-time-checked
 * `requirePermission()` calls) — so the catalogue can never drift between
 * what's seeded and what a route actually asks for.
 *
 * IDs are fixed, pre-generated UUIDv7 values (not random per run), the same
 * determinism convention `packages/db/src/seed/data.ts`'s SYSTEM_ROLES
 * already established, so seeding stays idempotent.
 *
 * Two catalogues, per §26.2/§26.3 — kept as two separate exported lists
 * because they answer different questions (what a Teacher/Assistant may do
 * educationally, vs. what an Admin may do administratively) and, per the
 * Phase 0 roadmap's own phase map, only §26.2 is Phase 5's to wire up:
 * §26.3/§26.4's platform-governance sub-roles (Platform Owner, Super,
 * Security, Support, Billing, Moderation — SRS §23) are the roadmap's own
 * later "Administration" phase. §26.3's codes are still seeded here (the
 * catalogue is closed and global — Table 37.2's Permission entity says its
 * rows "are created by migration, never by end users"), but only a
 * conservative, organization-scoped subset is granted to the ADMIN system
 * role in Phase 5 — see `packages/db/src/seed/data.ts`'s `ADMIN_PERMISSION_KEYS`
 * for exactly which ones and why.
 */

export interface PermissionCatalogueEntry {
  id: string;
  key: string;
  category: string;
  /** Table 26.1's "Delegatable to Assistant?" column. Always false for §26.3 (AST-004: an Assistant may never hold Admin permissions). */
  isDelegatable: boolean;
  description: string;
}

/** SRS §26.2 — Educational permission catalogue (Table 26.1). "Default holder: Teacher" for every row. */
export const EDUCATIONAL_PERMISSIONS = [
  {
    id: "01a0a7a7-d72c-734e-98d8-4d1875cd51a8",
    key: "VIEW_STUDENTS",
    category: "students",
    isDelegatable: true,
    description: "See students in scope",
  },
  {
    id: "01a0a7a7-d72e-7ab3-9f20-ec9fb5724a68",
    key: "MANAGE_STUDENTS",
    category: "students",
    isDelegatable: true,
    description: "Manage student membership in scope",
  },
  {
    id: "01a0a7a7-d72f-719c-8e98-209e3421af24",
    key: "VIEW_STUDENT_PROGRESS",
    category: "students",
    isDelegatable: true,
    description: "See progress in scope",
  },
  {
    id: "01a0a7a7-d72f-765a-a874-dd34f29248f5",
    key: "VIEW_STUDENT_ACTIVITY",
    category: "students",
    isDelegatable: true,
    description: "See activity state in scope",
  },
  {
    id: "01a0a7a7-d72f-7bcf-8f84-54e9f0a6d72c",
    key: "VIEW_STUDENT_ATTENDANCE",
    category: "students",
    isDelegatable: true,
    description: "See attendance in scope",
  },
  {
    id: "01a0a7a7-d72f-7a0f-a734-f6af61701dd3",
    key: "MANAGE_CLASSROOM",
    category: "academic_structure",
    isDelegatable: true,
    description: "Create/edit classrooms and groups",
  },
  {
    id: "01a0a7a7-d72f-7236-b7ef-30dd5bc7df8d",
    key: "MANAGE_COURSE",
    category: "academic_structure",
    isDelegatable: true,
    description: "Create/edit courses, cycles, topics",
  },
  {
    id: "01a0a7a7-d72f-74d8-8efc-95cfcc081f24",
    key: "PUBLISH_CONTENT",
    category: "academic_structure",
    isDelegatable: true,
    description: "Publish content to students",
  },
  {
    id: "01a0a7a7-d72f-7292-b979-8731a6947646",
    key: "CREATE_SESSION",
    category: "sessions",
    isDelegatable: true,
    description: "Schedule teaching sessions",
  },
  {
    id: "01a0a7a7-d730-7267-a94f-f106cbee0c13",
    key: "EDIT_SESSION",
    category: "sessions",
    isDelegatable: true,
    description: "Manage teaching sessions",
  },
  {
    id: "01a0a7a7-d730-7f53-972b-7f2b274fb574",
    key: "MANAGE_ATTENDANCE",
    category: "sessions",
    isDelegatable: true,
    description: "Record and update attendance",
  },
  {
    id: "01a0a7a7-d730-7b88-99af-515939d880c3",
    key: "CREATE_HOMEWORK",
    category: "homework",
    isDelegatable: true,
    description: "Author homework activities",
  },
  {
    id: "01a0a7a7-d730-7a7a-bbfe-a63243ec8d2d",
    key: "EDIT_HOMEWORK",
    category: "homework",
    isDelegatable: true,
    description: "Edit homework activities",
  },
  {
    id: "01a0a7a7-d730-7848-a3e2-9eb10044bc53",
    key: "GRADE_HOMEWORK",
    category: "homework",
    isDelegatable: true,
    description: "Grade homework submissions",
  },
  {
    id: "01a0a7a7-d730-798e-9953-d3e037d246bb",
    key: "CREATE_QUIZ",
    category: "quiz",
    isDelegatable: true,
    description: "Author quizzes",
  },
  {
    id: "01a0a7a7-d730-7fa7-a604-4c1153c4f57a",
    key: "EDIT_QUIZ",
    category: "quiz",
    isDelegatable: true,
    description: "Edit quizzes",
  },
  {
    id: "01a0a7a7-d730-7310-8461-c3ee0f1a8f41",
    key: "GRADE_QUIZ",
    category: "quiz",
    isDelegatable: true,
    description: "Grade quiz submissions",
  },
  {
    id: "01a0a7a7-d730-7ebe-94c6-67d47efd71c5",
    key: "VIEW_GRADES",
    category: "grading",
    isDelegatable: true,
    description: "See grades in scope",
  },
  {
    id: "01a0a7a7-d730-7b77-852e-571251a2ed32",
    key: "ENTER_GRADES",
    category: "grading",
    isDelegatable: true,
    description: "Enter grades in scope",
  },
  {
    id: "01a0a7a7-d730-75b6-8acb-0c8d0f7e4cc3",
    key: "EDIT_GRADES",
    category: "grading",
    isDelegatable: true,
    description: "Change a grade after entry",
  },
  {
    id: "01a0a7a7-d730-79f1-ab72-15aa69c7425e",
    key: "RELEASE_GRADES",
    category: "grading",
    isDelegatable: true,
    description: "Make grades visible to student/parent",
  },
  {
    id: "01a0a7a7-d730-7ee4-8737-96a12cf2d08d",
    key: "VIEW_QUESTION_BANK",
    category: "question_bank",
    isDelegatable: true,
    description: "Browse the question bank in scope",
  },
  {
    id: "01a0a7a7-d730-7dbf-8321-2da144c82bb3",
    key: "CREATE_QUESTION",
    category: "question_bank",
    isDelegatable: true,
    description: "Author questions",
  },
  {
    id: "01a0a7a7-d730-7226-8ef4-73dfa5078021",
    key: "EDIT_QUESTION",
    category: "question_bank",
    isDelegatable: true,
    description: "Edit questions",
  },
  {
    id: "01a0a7a7-d730-717a-b0a3-a82ca1822fa2",
    key: "DELETE_QUESTION",
    category: "question_bank",
    isDelegatable: true,
    description: "Archive/remove questions",
  },
  {
    id: "01a0a7a7-d730-7495-a8d0-844d091ba6f5",
    key: "IMPORT_QUESTIONS",
    category: "question_bank",
    isDelegatable: true,
    description: "Bulk-import questions",
  },
  {
    id: "01a0a7a7-d730-7adc-b5c8-cb86d51abc72",
    key: "EXPORT_QUESTIONS",
    category: "question_bank",
    isDelegatable: true,
    description: "Bulk-export questions",
  },
  {
    id: "01a0a7a7-d731-7b2e-ab46-bfdbaeae151f",
    key: "MANAGE_QUESTION_POOLS",
    category: "question_bank",
    isDelegatable: true,
    description: "Create and configure question pools",
  },
  {
    id: "01a0a7a7-d731-7042-8d85-60b014e5ac32",
    key: "MANAGE_ACHIEVEMENTS",
    category: "achievements",
    isDelegatable: true,
    description: "Configure achievement rules in scope",
  },
  {
    id: "01a0a7a7-d731-7381-91e8-e58fcaea897f",
    key: "CREATE_ACHIEVEMENT",
    category: "achievements",
    isDelegatable: false,
    description: "Define a new custom achievement",
  },
  {
    id: "01a0a7a7-d731-71d6-90c7-68fcb90925d0",
    key: "AWARD_ACHIEVEMENTS",
    category: "achievements",
    isDelegatable: true,
    description: "Award an achievement to a student",
  },
  {
    id: "01a0a7a7-d731-7f0e-93e4-1570217df08d",
    key: "ADJUST_POINTS",
    category: "achievements",
    isDelegatable: false,
    description: "Manually adjust points with reason",
  },
  {
    id: "01a0a7a7-d731-7acc-8f2a-522a097bb7f4",
    key: "MANAGE_LEADERBOARD",
    category: "achievements",
    isDelegatable: true,
    description: "Configure or disable a leaderboard",
  },
  {
    id: "01a0a7a7-d731-7347-92ae-22eb6fb53598",
    key: "MESSAGE_STUDENTS",
    category: "communication",
    isDelegatable: true,
    description: "Communicate with students in scope",
  },
  {
    id: "01a0a7a7-d731-747b-a581-fadb0917a29d",
    key: "MESSAGE_PARENTS",
    category: "communication",
    isDelegatable: true,
    description: "Communicate with parents in scope",
  },
  {
    id: "01a0a7a7-d731-7984-94b7-cd69e33be980",
    key: "CREATE_ANNOUNCEMENTS",
    category: "communication",
    isDelegatable: true,
    description: "Post announcements in scope",
  },
  {
    id: "01a0a7a7-d731-77ef-b019-0cf0ce354757",
    key: "VIEW_STORAGE",
    category: "storage",
    isDelegatable: true,
    description: "Work with shared Teacher Storage",
  },
  {
    id: "01a0a7a7-d731-7012-9f11-bb3d1f23b1e9",
    key: "UPLOAD_FILES",
    category: "storage",
    isDelegatable: true,
    description: "Upload files to shared Teacher Storage",
  },
  {
    id: "01a0a7a7-d731-7b5d-ae63-54719bc52051",
    key: "DOWNLOAD_ORIGINAL",
    category: "storage",
    isDelegatable: true,
    description: "Download original stored files",
  },
  {
    id: "01a0a7a7-d731-7b77-9be8-47c7ddd6e3c9",
    key: "MANAGE_STORAGE_PERMISSIONS",
    category: "storage",
    isDelegatable: false,
    description: "Change who may access stored files",
  },
  {
    id: "01a0a7a7-d731-7be6-859e-4d139296db7a",
    key: "ASSIGN_ASSISTANT",
    category: "delegation",
    isDelegatable: false,
    description: "Create or modify an Assistant Assignment",
  },
  {
    id: "01a0a7a7-d731-7258-8d9e-0fb314971a9c",
    key: "VIEW_ANALYTICS",
    category: "analytics",
    isDelegatable: true,
    description: "Educational analytics in scope",
  },
] as const satisfies readonly PermissionCatalogueEntry[];

/** SRS §26.3 — Administrative permission catalogue (Table 26.2). Not delegatable to an Assistant under any circumstance (AST-004). Only a subset is granted to the ADMIN system role in Phase 5 — see packages/db/src/seed/data.ts. */
export const ADMINISTRATIVE_PERMISSIONS = [
  {
    id: "01a0a7a7-d731-758c-b667-55b0e601f797",
    key: "USER_VIEW",
    category: "administrative",
    isDelegatable: false,
    description: "Account administration — view",
  },
  {
    id: "01a0a7a7-d731-7176-9be0-76bd9736eff3",
    key: "USER_SUSPEND",
    category: "administrative",
    isDelegatable: false,
    description: "Account administration — suspend",
  },
  {
    id: "01a0a7a7-d731-7b29-a943-c6214618fb91",
    key: "USER_RESTORE",
    category: "administrative",
    isDelegatable: false,
    description: "Account administration — restore",
  },
  {
    id: "01a0a7a7-d731-7a24-8e03-64897df60ca1",
    key: "ORG_VIEW",
    category: "administrative",
    isDelegatable: false,
    description: "Organization administration — view",
  },
  {
    id: "01a0a7a7-d731-7f22-87c6-a39befce6ef5",
    key: "ORG_MANAGE",
    category: "administrative",
    isDelegatable: false,
    description: "Organization administration — manage",
  },
  {
    id: "01a0a7a7-d731-783d-893a-9317a7f74582",
    key: "CONTENT_REVIEW",
    category: "administrative",
    isDelegatable: false,
    description: "Content moderation — review",
  },
  {
    id: "01a0a7a7-d731-7209-86e3-1958946f0b26",
    key: "CONTENT_RESTRICT",
    category: "administrative",
    isDelegatable: false,
    description: "Content moderation — restrict",
  },
  {
    id: "01a0a7a7-d731-757c-b9c9-3d8534639ea1",
    key: "CONTENT_REMOVE",
    category: "administrative",
    isDelegatable: false,
    description: "Content moderation — remove",
  },
  {
    id: "01a0a7a7-d731-71f3-abde-99ec14aed01a",
    key: "BILLING_VIEW",
    category: "administrative",
    isDelegatable: false,
    description: "Commercial operations — view",
  },
  {
    id: "01a0a7a7-d731-737b-8cdc-d191ac2ed23e",
    key: "REFUND_MANAGE",
    category: "administrative",
    isDelegatable: false,
    description: "Commercial operations — refunds",
  },
  {
    id: "01a0a7a7-d731-78e8-9d1c-546742b5b4af",
    key: "PLAN_MANAGE",
    category: "administrative",
    isDelegatable: false,
    description: "Commercial operations — plans",
  },
  {
    id: "01a0a7a7-d731-7747-8f0d-a5e44c44c80a",
    key: "SECURITY_VIEW",
    category: "administrative",
    isDelegatable: false,
    description: "Security monitoring — view",
  },
  {
    id: "01a0a7a7-d731-7f65-96df-72a8859da4d5",
    key: "SECURITY_RESPOND",
    category: "administrative",
    isDelegatable: false,
    description: "Security monitoring — respond",
  },
  {
    id: "01a0a7a7-d731-7095-afcf-12eb8e5f0c72",
    key: "AUDIT_VIEW",
    category: "administrative",
    isDelegatable: false,
    description: "Read the audit log",
  },
  {
    id: "01a0a7a7-d731-7865-9849-9411d1bbdaa4",
    key: "SUPPORT_MANAGE",
    category: "administrative",
    isDelegatable: false,
    description: "Support tickets and user issues",
  },
  {
    id: "01a0a7a7-d731-7d36-b3af-5dfabd0f92ec",
    key: "SYSTEM_CONFIG",
    category: "administrative",
    isDelegatable: false,
    description: "Platform configuration",
  },
  {
    id: "01a0a7a7-d731-7d03-83e4-9426991ab322",
    key: "FEATURE_FLAG_MANAGE",
    category: "administrative",
    isDelegatable: false,
    description: "Platform feature flags",
  },
  {
    id: "01a0a7a7-d731-75a3-9685-6dc25841b693",
    key: "IMPERSONATE_USER",
    category: "administrative",
    isDelegatable: false,
    description: "Controlled support impersonation",
  },
  {
    id: "01a0a7a7-d731-7f96-852a-152d1ec360e7",
    key: "PRIVATE_DATA_ACCESS",
    category: "administrative",
    isDelegatable: false,
    description: "Exceptional access to restricted private data",
  },
  {
    id: "01a0a7a7-d731-7887-8c47-0338e7529eca",
    key: "GRADING_SCALE_MANAGE",
    category: "administrative",
    isDelegatable: false,
    description: "Create/edit the Organization's grading scale",
  },
] as const satisfies readonly PermissionCatalogueEntry[];

export const PERMISSION_CATALOGUE: readonly PermissionCatalogueEntry[] = [
  ...EDUCATIONAL_PERMISSIONS,
  ...ADMINISTRATIVE_PERMISSIONS,
];

export type EducationalPermissionKey = (typeof EDUCATIONAL_PERMISSIONS)[number]["key"];
export type AdministrativePermissionKey = (typeof ADMINISTRATIVE_PERMISSIONS)[number]["key"];
export type PermissionKey = EducationalPermissionKey | AdministrativePermissionKey;
