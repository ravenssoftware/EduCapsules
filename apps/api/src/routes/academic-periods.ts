import { Hono, type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "../types.js";
import { requireSession } from "../modules/auth/middleware.js";
import { AUTHZ_ERROR_STATUS, AuthzDomainError } from "../modules/authz/errors.js";
import {
  ACADEMIC_STRUCTURE_ERROR_STATUS,
  AcademicStructureDomainError,
} from "../modules/academic-structure/errors.js";
import * as service from "../modules/academic-structure/service.js";

/** /api/v1/academic-periods (SRS §8.1, PER-001..006). */

export const academicPeriods = new Hono<AppEnv>();

academicPeriods.use("*", requireSession());

function toHttpException(err: unknown): HTTPException {
  if (err instanceof AuthzDomainError) {
    return new HTTPException(AUTHZ_ERROR_STATUS[err.code] as 400, { message: err.message });
  }
  if (err instanceof AcademicStructureDomainError) {
    return new HTTPException(ACADEMIC_STRUCTURE_ERROR_STATUS[err.code] as 400, {
      message: err.message,
    });
  }
  throw err;
}

async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) throw new Error("not an object");
    return body as Record<string, unknown>;
  } catch {
    throw new HTTPException(422, { message: "Request body must be valid JSON." });
  }
}

function deps(c: Context<AppEnv>): service.Deps {
  return { repo: c.get("academicStructureRepository"), authzRepo: c.get("authzRepository") };
}

academicPeriods.get("/", async (c) => {
  const session = c.get("session")!;
  try {
    const periods = await service.listAcademicPeriods(deps(c), {
      organizationId: session.organizationId,
      userId: session.userId,
    });
    return c.json({ academicPeriods: periods });
  } catch (err) {
    throw toHttpException(err);
  }
});

academicPeriods.get("/:id", async (c) => {
  const session = c.get("session")!;
  try {
    const period = await service.getAcademicPeriod(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
    );
    return c.json({ academicPeriod: period });
  } catch (err) {
    throw toHttpException(err);
  }
});

academicPeriods.post("/", async (c) => {
  const session = c.get("session")!;
  const body = await readJsonBody(c.req.raw);
  const name = typeof body["name"] === "string" ? body["name"] : "";
  const startsOn = typeof body["startsOn"] === "string" ? body["startsOn"] : "";
  const endsOn = typeof body["endsOn"] === "string" ? body["endsOn"] : "";

  try {
    const period = await service.createAcademicPeriod(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      { name, startsOn, endsOn },
      { loginSessionId: session.id },
    );
    return c.json({ academicPeriod: period }, 201);
  } catch (err) {
    throw toHttpException(err);
  }
});

academicPeriods.patch("/:id", async (c) => {
  const session = c.get("session")!;
  const body = await readJsonBody(c.req.raw);
  const patch: { name?: string; startsOn?: string; endsOn?: string; status?: string } = {};
  if (typeof body["name"] === "string") patch.name = body["name"];
  if (typeof body["startsOn"] === "string") patch.startsOn = body["startsOn"];
  if (typeof body["endsOn"] === "string") patch.endsOn = body["endsOn"];
  if (typeof body["status"] === "string") patch.status = body["status"];

  try {
    const period = await service.updateAcademicPeriod(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
      patch,
      { loginSessionId: session.id },
    );
    return c.json({ academicPeriod: period });
  } catch (err) {
    throw toHttpException(err);
  }
});
