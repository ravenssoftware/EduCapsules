import type { MiddlewareHandler } from "hono";
import { newCorrelationId } from "@educapsules/shared";
import type { AppEnv } from "../types.js";

const HEADER = "x-correlation-id";

/**
 * Assigns a correlation id to every request at the Transport layer
 * (docs/architecture/backend.md §1) and propagates it on the response, so a
 * background job triggered by this request can carry the same id forward
 * (SRS NFR-012, INF-006, BE-003).
 */
export const correlationId: MiddlewareHandler<AppEnv> = async (c, next) => {
  const incoming = c.req.header(HEADER);
  const id = incoming && incoming.length > 0 ? incoming : newCorrelationId();
  c.set("correlationId", id);
  await next();
  c.header(HEADER, id);
};
