/**
 * Domain-layer errors for the academic-structure module — same split as
 * ../auth/errors.ts and ../authz/errors.ts (no Hono/HTTP types here,
 * BE-002). `not_found`/`forbidden` follow SEC-009 exactly as the authz
 * module's own AuthzDomainError does; this module's own codes cover the
 * business-rule validation failures that are this module's to raise
 * (duplicate codes, overlapping periods, PER-003 cardinality, invalid
 * lifecycle transitions, polymorphic reference validation) rather than
 * authorization's.
 */
export type AcademicStructureErrorCode =
  "not_found" | "forbidden" | "validation_failed" | "conflict";

export class AcademicStructureDomainError extends Error {
  readonly code: AcademicStructureErrorCode;

  constructor(code: AcademicStructureErrorCode, message: string) {
    super(message);
    this.name = "AcademicStructureDomainError";
    this.code = code;
  }
}

export const ACADEMIC_STRUCTURE_ERROR_STATUS: Record<AcademicStructureErrorCode, number> = {
  not_found: 404,
  forbidden: 403,
  validation_failed: 422,
  conflict: 409,
};
