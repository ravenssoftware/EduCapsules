/**
 * RFC 9457 problem-detail error shape (SRS API-008, §40). Every API error
 * response uses this shape so a client never has to special-case error
 * parsing per endpoint. The full error-code catalogue is defined when §40's
 * error-handling architecture is implemented (Phase 3+); this is the
 * portable shape every module builds against from day one.
 */
export interface ProblemDetail {
  /** A URI reference identifying the problem type. Stable and machine-readable. */
  type: string;
  /** Short, human-readable summary of the problem type. */
  title: string;
  /** HTTP status code for this occurrence. */
  status: number;
  /** Human-readable explanation specific to this occurrence. */
  detail?: string;
  /** URI reference identifying the specific occurrence, if useful. */
  instance?: string;
  /** Correlation id for this request, propagated per NFR-012. */
  correlationId: string;
}

export function problemDetail(
  init: Omit<ProblemDetail, "correlationId"> & { correlationId: string },
): ProblemDetail {
  return { ...init };
}
