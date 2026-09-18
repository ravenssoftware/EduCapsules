import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { problemDetail } from "@educapsules/shared";
import type { AppEnv } from "../types.js";

/**
 * Every error becomes an RFC 9457 problem-detail response (SRS API-008).
 * Production errors never expose stack traces, internal paths or
 * infrastructure details (SEC-037) — only a stable type/title and, where
 * the error is a deliberate HTTPException, the detail its caller chose to
 * disclose. Anything else collapses to a generic 500 with no detail.
 */
export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
  const correlationId = c.get("correlationId");

  if (err instanceof HTTPException) {
    const body = problemDetail({
      type: `https://educapsules.dev/problems/${err.status}`,
      title: err.message || "Request failed",
      status: err.status,
      correlationId,
    });
    return c.json(body, err.status);
  }

  const body = problemDetail({
    type: "https://educapsules.dev/problems/internal-error",
    title: "Internal Server Error",
    status: 500,
    correlationId,
  });
  return c.json(body, 500);
};
