import { fileURLToPath } from "node:url";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { sqliteSchema } from "@educapsules/db";
import { uuid7 } from "@educapsules/shared";
import { createApp } from "../app.js";
import { createAuthRepository } from "../modules/auth/repository.js";

/**
 * Full HTTP-surface integration tests for /api/v1/auth, against a real
 * in-memory SQLite database migrated with the actual generated migrations
 * (same pattern as packages/db/src/schema/sqlite/db-behavior.test.ts) —
 * not a mocked repository. Covers the Phase 4 "test security properties,
 * not just happy paths" requirement: account-state restrictions, session
 * lifecycle, MFA, lockout, rate limiting, tenant isolation, and the named
 * vulnerability classes (session fixation, reuse of revoked/expired
 * sessions, enumeration, cross-tenant access) each get a dedicated test.
 */

process.env.MFA_SECRET_ENCRYPTION_KEY = Buffer.from(
  new Uint8Array(32).map((_, i) => i + 1),
).toString("base64");

const migrationsFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../packages/db/migrations/sqlite",
);

const sqlite = new Database(":memory:");
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite, { schema: sqliteSchema });
migrate(db, { migrationsFolder });

const authRepository = createAuthRepository(db, sqliteSchema);
const app = createApp({ authRepository });

const ORG_A = uuid7();
const ORG_B = uuid7();
const ADMIN_ROLE_ID = uuid7();

function now() {
  return new Date();
}

beforeAll(() => {
  const t = now();
  db.insert(sqliteSchema.organizations)
    .values([
      {
        id: ORG_A,
        name: "Org A",
        slug: `org-a-${ORG_A}`,
        timezone: "UTC",
        locale: "en",
        status: "active",
        createdAt: t,
        updatedAt: t,
      },
      {
        id: ORG_B,
        name: "Org B",
        slug: `org-b-${ORG_B}`,
        timezone: "UTC",
        locale: "en",
        status: "active",
        createdAt: t,
        updatedAt: t,
      },
    ])
    .run();
  db.insert(sqliteSchema.roles)
    .values({
      id: ADMIN_ROLE_ID,
      organizationId: null,
      key: "ADMIN",
      name: "Admin",
      isSystem: true,
      createdAt: t,
      updatedAt: t,
    })
    .run();
});

afterAll(() => {
  sqlite.close();
});

async function post(pathName: string, body?: unknown, headers: Record<string, string> = {}) {
  // A fresh source IP per call by default, so the shared module-level rate
  // limiters in routes/auth.ts don't let unrelated tests exhaust each
  // other's budget — the dedicated rate-limit test below overrides this
  // with a fixed IP on purpose.
  return app.request(pathName, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": uuid7(), ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

async function registerAndVerify(
  organizationId: string,
  email: string,
  password = "a-very-strong-password-1",
) {
  const res = await post("/api/v1/auth/register", { organizationId, email, password });
  const body = (await res.json()) as { devVerificationToken: string };
  await post("/api/v1/auth/verify-email", { token: body.devVerificationToken });
  return body.devVerificationToken;
}

async function loginAndGetToken(
  organizationId: string,
  email: string,
  password = "a-very-strong-password-1",
) {
  const res = await post("/api/v1/auth/login", { organizationId, email, password });
  const body = (await res.json()) as { sessionToken: string };
  return body.sessionToken;
}

describe("POST /api/v1/auth/register + /verify-email", () => {
  it("creates a pending user and issues a single-use verification token", async () => {
    const email = `reg-${uuid7()}@example.test`;
    const res = await post("/api/v1/auth/register", {
      organizationId: ORG_A,
      email,
      password: "a-very-strong-password-1",
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { devVerificationToken: string };
    expect(body.devVerificationToken).toBeTruthy();

    const userQueryRows = await db
      .select()
      .from(sqliteSchema.users)
      .where(eq(sqliteSchema.users.email, email));
    const row = userQueryRows[0]!;
    expect(row.status).toBe("pending");
    expect(row.passwordHash).not.toContain("a-very-strong-password-1");
  });

  it("rejects registering the same email twice in the same organization", async () => {
    const email = `dup-${uuid7()}@example.test`;
    await post("/api/v1/auth/register", {
      organizationId: ORG_A,
      email,
      password: "a-very-strong-password-1",
    });
    const res = await post("/api/v1/auth/register", {
      organizationId: ORG_A,
      email,
      password: "a-very-strong-password-1",
    });
    expect(res.status).toBe(409);
  });

  it("allows the same email in a different organization (DB-012 scoping)", async () => {
    const email = `cross-org-${uuid7()}@example.test`;
    const a = await post("/api/v1/auth/register", {
      organizationId: ORG_A,
      email,
      password: "a-very-strong-password-1",
    });
    const b = await post("/api/v1/auth/register", {
      organizationId: ORG_B,
      email,
      password: "a-very-strong-password-1",
    });
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
  });

  it("rejects a weak password", async () => {
    const res = await post("/api/v1/auth/register", {
      organizationId: ORG_A,
      email: `weak-${uuid7()}@example.test`,
      password: "short",
    });
    expect(res.status).toBe(422);
  });

  it("rejects a malformed request body", async () => {
    const res = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not json",
    });
    expect(res.status).toBe(422);
  });

  it("verifying moves the account from pending to active, and the token cannot be reused", async () => {
    const email = `verify-${uuid7()}@example.test`;
    const token = await registerAndVerify(ORG_A, email);
    const userQueryRows = await db
      .select()
      .from(sqliteSchema.users)
      .where(eq(sqliteSchema.users.email, email));
    const row = userQueryRows[0]!;
    expect(row.status).toBe("active");
    expect(row.emailVerifiedAt).not.toBeNull();

    const reuse = await post("/api/v1/auth/verify-email", { token });
    expect(reuse.status).toBe(400);
  });
});

describe("POST /api/v1/auth/login — account states and credential checks", () => {
  it("logs in successfully with correct credentials and never returns the password hash", async () => {
    const email = `login-ok-${uuid7()}@example.test`;
    await registerAndVerify(ORG_A, email);
    const res = await post("/api/v1/auth/login", {
      organizationId: ORG_A,
      email,
      password: "a-very-strong-password-1",
    });
    expect(res.status).toBe(200);
    const bodyText = await res.text();
    expect(bodyText).not.toContain("passwordHash");
    expect(bodyText).not.toContain("argon2id");
  });

  it("rejects an unregistered email with a generic error (no enumeration)", async () => {
    const res = await post("/api/v1/auth/login", {
      organizationId: ORG_A,
      email: `nobody-${uuid7()}@example.test`,
      password: "whatever-password-1",
    });
    expect(res.status).toBe(401);
  });

  it("rejects a wrong password with the same generic error as an unregistered email", async () => {
    const email = `wrongpw-${uuid7()}@example.test`;
    await registerAndVerify(ORG_A, email);
    const wrongPw = await post("/api/v1/auth/login", {
      organizationId: ORG_A,
      email,
      password: "totally-wrong-pw-1",
    });
    const noSuchUser = await post("/api/v1/auth/login", {
      organizationId: ORG_A,
      email: `nobody-${uuid7()}@example.test`,
      password: "totally-wrong-pw-1",
    });
    expect(wrongPw.status).toBe(401);
    expect(noSuchUser.status).toBe(401);
    const wrongPwBody = (await wrongPw.json()) as { title: string };
    const noSuchUserBody = (await noSuchUser.json()) as { title: string };
    expect(wrongPwBody.title).toBe(noSuchUserBody.title);
  });

  it("blocks login for a pending (unverified) account", async () => {
    const email = `pending-${uuid7()}@example.test`;
    await post("/api/v1/auth/register", {
      organizationId: ORG_A,
      email,
      password: "a-very-strong-password-1",
    });
    const res = await post("/api/v1/auth/login", {
      organizationId: ORG_A,
      email,
      password: "a-very-strong-password-1",
    });
    expect(res.status).toBe(403);
  });

  it("blocks login for a suspended account", async () => {
    const email = `suspended-${uuid7()}@example.test`;
    await registerAndVerify(ORG_A, email);
    await db
      .update(sqliteSchema.users)
      .set({ status: "suspended" })
      .where(eq(sqliteSchema.users.email, email))
      .run();
    const res = await post("/api/v1/auth/login", {
      organizationId: ORG_A,
      email,
      password: "a-very-strong-password-1",
    });
    expect(res.status).toBe(403);
  });

  it("rejects login against the wrong organization even with correct credentials (tenant isolation)", async () => {
    const email = `tenant-${uuid7()}@example.test`;
    await registerAndVerify(ORG_A, email);
    const res = await post("/api/v1/auth/login", {
      organizationId: ORG_B,
      email,
      password: "a-very-strong-password-1",
    });
    expect(res.status).toBe(401);
  });

  it("writes a LOGIN_SUCCESS audit event on success and LOGIN_FAILED on failure", async () => {
    const email = `audit-${uuid7()}@example.test`;
    await registerAndVerify(ORG_A, email);
    await post("/api/v1/auth/login", {
      organizationId: ORG_A,
      email,
      password: "wrong-one-here-1",
    });
    await post("/api/v1/auth/login", {
      organizationId: ORG_A,
      email,
      password: "a-very-strong-password-1",
    });

    const userQueryRows = await db
      .select()
      .from(sqliteSchema.users)
      .where(eq(sqliteSchema.users.email, email));
    const user = userQueryRows[0]!;
    const events = await db
      .select()
      .from(sqliteSchema.auditLog)
      .where(eq(sqliteSchema.auditLog.actorUserId, user.id));
    const actions = events.map((e) => e.action);
    expect(actions).toContain("LOGIN_SUCCESS");
    expect(actions).toContain("LOGIN_FAILED");
  });
});

describe("brute-force lockout (SEC-032)", () => {
  it("locks the account after repeated failed attempts and rejects further attempts even with the correct password", async () => {
    const email = `lockout-${uuid7()}@example.test`;
    await registerAndVerify(ORG_A, email);

    for (let i = 0; i < 10; i++) {
      await post("/api/v1/auth/login", {
        organizationId: ORG_A,
        email,
        password: "wrong-attempt-number",
      });
    }

    const userQueryRows = await db
      .select()
      .from(sqliteSchema.users)
      .where(eq(sqliteSchema.users.email, email));
    const row = userQueryRows[0]!;
    expect(row.status).toBe("locked");

    const res = await post("/api/v1/auth/login", {
      organizationId: ORG_A,
      email,
      password: "a-very-strong-password-1",
    });
    expect(res.status).toBe(423);

    const securityEvents = await db
      .select()
      .from(sqliteSchema.securityEvents)
      .where(eq(sqliteSchema.securityEvents.userId, row.id));
    expect(securityEvents.some((e) => e.eventType === "LOGIN_BRUTE_FORCE")).toBe(true);
    expect(securityEvents.some((e) => e.eventType === "ACCOUNT_LOCKED")).toBe(true);
  });
});

describe("rate limiting (SEC-031/API-017)", () => {
  it("returns 429 with Retry-After once the login rate limit is exceeded", async () => {
    let lastStatus = 200;
    for (let i = 0; i < 15; i++) {
      const res = await post(
        "/api/v1/auth/login",
        {
          organizationId: ORG_A,
          email: `flood-${uuid7()}@example.test`,
          password: "irrelevant-password-1",
        },
        { "x-forwarded-for": "203.0.113.55" },
      );
      lastStatus = res.status;
      if (res.status === 429) {
        expect(res.headers.get("retry-after")).toBeTruthy();
        break;
      }
    }
    expect(lastStatus).toBe(429);
  });
});

describe("session lifecycle (AUTH-104..110, AUTH-118)", () => {
  it("issues a working session that authorizes /sessions", async () => {
    const email = `sess-${uuid7()}@example.test`;
    await registerAndVerify(ORG_A, email);
    const token = await loginAndGetToken(ORG_A, email);
    const res = await app.request("/api/v1/auth/sessions", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { sessions: Array<{ isCurrent: boolean }> };
    expect(body.sessions.some((s) => s.isCurrent)).toBe(true);
  });

  it("rejects a missing or garbage bearer token (authentication bypass check)", async () => {
    const noAuth = await app.request("/api/v1/auth/sessions");
    expect(noAuth.status).toBe(401);
    const garbage = await app.request("/api/v1/auth/sessions", {
      headers: { authorization: "Bearer not-a-real-token" },
    });
    expect(garbage.status).toBe(401);
  });

  it("logout revokes the session — a second use of the same token is rejected (replay of a revoked session)", async () => {
    const email = `logout-${uuid7()}@example.test`;
    await registerAndVerify(ORG_A, email);
    const token = await loginAndGetToken(ORG_A, email);

    const first = await post("/api/v1/auth/logout", undefined, {
      authorization: `Bearer ${token}`,
    });
    expect(first.status).toBe(200);

    const second = await app.request("/api/v1/auth/sessions", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(second.status).toBe(401);
  });

  it("logout-all revokes every session for the user, not just the current one", async () => {
    const email = `logoutall-${uuid7()}@example.test`;
    await registerAndVerify(ORG_A, email);
    const tokenA = await loginAndGetToken(ORG_A, email);
    const tokenB = await loginAndGetToken(ORG_A, email);

    await post("/api/v1/auth/logout-all", undefined, { authorization: `Bearer ${tokenA}` });

    const checkA = await app.request("/api/v1/auth/sessions", {
      headers: { authorization: `Bearer ${tokenA}` },
    });
    const checkB = await app.request("/api/v1/auth/sessions", {
      headers: { authorization: `Bearer ${tokenB}` },
    });
    expect(checkA.status).toBe(401);
    expect(checkB.status).toBe(401);
  });

  it("a session past its idle expiry is rejected (reuse of an expired session)", async () => {
    const email = `expired-${uuid7()}@example.test`;
    await registerAndVerify(ORG_A, email);
    const token = await loginAndGetToken(ORG_A, email);

    // Directly simulate elapsed time — this test asserts the expiry check
    // itself, not the passage of real wall-clock time.
    await db
      .update(sqliteSchema.loginSessions)
      .set({ idleExpiresAt: new Date(Date.now() - 1000) })
      .where(eq(sqliteSchema.loginSessions.userId, await userIdFor(email)))
      .run();

    const res = await app.request("/api/v1/auth/sessions", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(401);
  });

  it("revoking a specific session by id does not affect other sessions", async () => {
    const email = `revoke-one-${uuid7()}@example.test`;
    await registerAndVerify(ORG_A, email);
    const tokenA = await loginAndGetToken(ORG_A, email);
    const tokenB = await loginAndGetToken(ORG_A, email);

    const listRes = await app.request("/api/v1/auth/sessions", {
      headers: { authorization: `Bearer ${tokenA}` },
    });
    const { sessions } = (await listRes.json()) as {
      sessions: Array<{ id: string; isCurrent: boolean }>;
    };
    const otherSessionId = sessions.find((s) => !s.isCurrent)!.id;

    const del = await app.request(`/api/v1/auth/sessions/${otherSessionId}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(del.status).toBe(200);

    const stillA = await app.request("/api/v1/auth/sessions", {
      headers: { authorization: `Bearer ${tokenA}` },
    });
    const nowB = await app.request("/api/v1/auth/sessions", {
      headers: { authorization: `Bearer ${tokenB}` },
    });
    expect(stillA.status).toBe(200);
    expect(nowB.status).toBe(401);
  });

  it("cannot revoke another user's session by id (cross-user session access, AUTH-118)", async () => {
    const emailA = `owner-${uuid7()}@example.test`;
    const emailB = `intruder-${uuid7()}@example.test`;
    await registerAndVerify(ORG_A, emailA);
    await registerAndVerify(ORG_A, emailB);
    const tokenA = await loginAndGetToken(ORG_A, emailA);
    const tokenB = await loginAndGetToken(ORG_A, emailB);

    const listRes = await app.request("/api/v1/auth/sessions", {
      headers: { authorization: `Bearer ${tokenA}` },
    });
    const { sessions } = (await listRes.json()) as { sessions: Array<{ id: string }> };
    const sessionAId = sessions[0]!.id;

    const res = await app.request(`/api/v1/auth/sessions/${sessionAId}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${tokenB}` },
    });
    expect(res.status).toBe(401);

    const stillA = await app.request("/api/v1/auth/sessions", {
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(stillA.status).toBe(200);
  });

  it("refresh rotates the credential — the old token stops working and reusing it revokes the new one too (token reuse detection, AUTH-115)", async () => {
    const email = `rotate-${uuid7()}@example.test`;
    await registerAndVerify(ORG_A, email);
    const originalToken = await loginAndGetToken(ORG_A, email);

    const refreshRes = await post("/api/v1/auth/refresh", undefined, {
      authorization: `Bearer ${originalToken}`,
    });
    expect(refreshRes.status).toBe(200);
    const { sessionToken: rotatedToken } = (await refreshRes.json()) as { sessionToken: string };
    expect(rotatedToken).not.toBe(originalToken);

    const withRotated = await app.request("/api/v1/auth/sessions", {
      headers: { authorization: `Bearer ${rotatedToken}` },
    });
    expect(withRotated.status).toBe(200);

    // Replaying the OLD (already-rotated-away) token is a reuse signal —
    // it must fail, AND it must revoke the new token it was rotated into.
    const withOldToken = await app.request("/api/v1/auth/sessions", {
      headers: { authorization: `Bearer ${originalToken}` },
    });
    expect(withOldToken.status).toBe(401);

    const withRotatedAfterReuse = await app.request("/api/v1/auth/sessions", {
      headers: { authorization: `Bearer ${rotatedToken}` },
    });
    expect(withRotatedAfterReuse.status).toBe(401);
  });
});

describe("password reset (AUTH-119, AUTH-121, AUTH-122)", () => {
  it("issues the same generic response whether or not the email is registered (no enumeration)", async () => {
    const email = `reset-${uuid7()}@example.test`;
    await registerAndVerify(ORG_A, email);
    const real = await post("/api/v1/auth/password/forgot", { organizationId: ORG_A, email });
    const fake = await post("/api/v1/auth/password/forgot", {
      organizationId: ORG_A,
      email: `nobody-${uuid7()}@example.test`,
    });
    expect(real.status).toBe(fake.status);
    expect(((await real.json()) as { status: string }).status).toBe(
      ((await fake.json()) as { status: string }).status,
    );
  });

  it("resets the password, revokes existing sessions, and establishes a new one (AUTH-119)", async () => {
    const email = `reset2-${uuid7()}@example.test`;
    await registerAndVerify(ORG_A, email);
    const oldSessionToken = await loginAndGetToken(ORG_A, email);

    const forgot = await post("/api/v1/auth/password/forgot", { organizationId: ORG_A, email });
    const { devResetToken } = (await forgot.json()) as { devResetToken: string };

    const reset = await post("/api/v1/auth/password/reset", {
      token: devResetToken,
      newPassword: "a-brand-new-password-1",
    });
    expect(reset.status).toBe(200);

    const oldSessionCheck = await app.request("/api/v1/auth/sessions", {
      headers: { authorization: `Bearer ${oldSessionToken}` },
    });
    expect(oldSessionCheck.status).toBe(401);

    const loginWithNew = await post("/api/v1/auth/login", {
      organizationId: ORG_A,
      email,
      password: "a-brand-new-password-1",
    });
    expect(loginWithNew.status).toBe(200);
    const loginWithOld = await post("/api/v1/auth/login", {
      organizationId: ORG_A,
      email,
      password: "a-very-strong-password-1",
    });
    expect(loginWithOld.status).toBe(401);
  });

  it("rejects reusing a reset token a second time (single-use, AUTH-121)", async () => {
    const email = `reset3-${uuid7()}@example.test`;
    await registerAndVerify(ORG_A, email);
    const forgot = await post("/api/v1/auth/password/forgot", { organizationId: ORG_A, email });
    const { devResetToken } = (await forgot.json()) as { devResetToken: string };

    await post("/api/v1/auth/password/reset", {
      token: devResetToken,
      newPassword: "a-first-new-password-1",
    });
    const secondUse = await post("/api/v1/auth/password/reset", {
      token: devResetToken,
      newPassword: "a-second-new-password-1",
    });
    expect(secondUse.status).toBe(400);
  });

  it("rejects an invalid/unknown reset token", async () => {
    const res = await post("/api/v1/auth/password/reset", {
      token: "not-a-real-token",
      newPassword: "whatever-new-1",
    });
    expect(res.status).toBe(400);
  });

  it("authenticated password change requires the current password and revokes other sessions", async () => {
    const email = `change-${uuid7()}@example.test`;
    await registerAndVerify(ORG_A, email);
    const sessionA = await loginAndGetToken(ORG_A, email);
    const sessionB = await loginAndGetToken(ORG_A, email);

    const wrongCurrent = await post(
      "/api/v1/auth/password/change",
      { currentPassword: "not-the-real-password", newPassword: "a-newer-password-12" },
      { authorization: `Bearer ${sessionA}` },
    );
    expect(wrongCurrent.status).toBe(401);

    const ok = await post(
      "/api/v1/auth/password/change",
      { currentPassword: "a-very-strong-password-1", newPassword: "a-newer-password-12" },
      { authorization: `Bearer ${sessionA}` },
    );
    expect(ok.status).toBe(200);

    const bCheck = await app.request("/api/v1/auth/sessions", {
      headers: { authorization: `Bearer ${sessionB}` },
    });
    expect(bCheck.status).toBe(401);
  });
});

describe("MFA enrollment and challenge (AUTH-116, AUTH-126, AUTH-127)", () => {
  async function enrollAndConfirmMfa(token: string) {
    const enrollRes = await post("/api/v1/auth/mfa/enroll", undefined, {
      authorization: `Bearer ${token}`,
    });
    const { secret } = (await enrollRes.json()) as { secret: string };
    const { currentTotpCode } = await import("../modules/auth/totp.js");
    const code = await currentTotpCode(secret);
    const confirmRes = await post(
      "/api/v1/auth/mfa/confirm",
      { code },
      { authorization: `Bearer ${token}` },
    );
    const { recoveryCodes } = (await confirmRes.json()) as { recoveryCodes: string[] };
    return { secret, recoveryCodes, confirmRes };
  }

  it("enrolling and confirming MFA enables it, and login now requires a second step", async () => {
    const email = `mfa-${uuid7()}@example.test`;
    await registerAndVerify(ORG_A, email);
    const token = await loginAndGetToken(ORG_A, email);
    const { confirmRes, recoveryCodes } = await enrollAndConfirmMfa(token);
    expect(confirmRes.status).toBe(200);
    expect(recoveryCodes).toHaveLength(10);

    const loginRes = await post("/api/v1/auth/login", {
      organizationId: ORG_A,
      email,
      password: "a-very-strong-password-1",
    });
    const body = (await loginRes.json()) as { status: string; mfaChallengeToken?: string };
    expect(body.status).toBe("mfa_required");
    expect(body.mfaChallengeToken).toBeTruthy();
  });

  it("the mfa_pending challenge token cannot be used as a regular authenticated session (session fixation / AUTH-110)", async () => {
    const email = `mfa-fix-${uuid7()}@example.test`;
    await registerAndVerify(ORG_A, email);
    const token = await loginAndGetToken(ORG_A, email);
    await enrollAndConfirmMfa(token);

    const loginRes = await post("/api/v1/auth/login", {
      organizationId: ORG_A,
      email,
      password: "a-very-strong-password-1",
    });
    const { mfaChallengeToken } = (await loginRes.json()) as { mfaChallengeToken: string };

    const misuse = await app.request("/api/v1/auth/sessions", {
      headers: { authorization: `Bearer ${mfaChallengeToken}` },
    });
    expect(misuse.status).toBe(401);
  });

  it("completes login with a valid TOTP code after the MFA challenge", async () => {
    const email = `mfa-ok-${uuid7()}@example.test`;
    await registerAndVerify(ORG_A, email);
    const initialToken = await loginAndGetToken(ORG_A, email);
    const { secret } = await enrollAndConfirmMfa(initialToken);

    const loginRes = await post("/api/v1/auth/login", {
      organizationId: ORG_A,
      email,
      password: "a-very-strong-password-1",
    });
    const { mfaChallengeToken } = (await loginRes.json()) as { mfaChallengeToken: string };

    const { currentTotpCode } = await import("../modules/auth/totp.js");
    const code = await currentTotpCode(secret);
    const verifyRes = await post("/api/v1/auth/mfa/verify", { mfaChallengeToken, code });
    expect(verifyRes.status).toBe(200);
    const { sessionToken } = (await verifyRes.json()) as { sessionToken: string };

    const sessionsRes = await app.request("/api/v1/auth/sessions", {
      headers: { authorization: `Bearer ${sessionToken}` },
    });
    expect(sessionsRes.status).toBe(200);
  });

  it("rejects an invalid TOTP code at the MFA challenge", async () => {
    const email = `mfa-bad-${uuid7()}@example.test`;
    await registerAndVerify(ORG_A, email);
    const initialToken = await loginAndGetToken(ORG_A, email);
    await enrollAndConfirmMfa(initialToken);

    const loginRes = await post("/api/v1/auth/login", {
      organizationId: ORG_A,
      email,
      password: "a-very-strong-password-1",
    });
    const { mfaChallengeToken } = (await loginRes.json()) as { mfaChallengeToken: string };

    const res = await post("/api/v1/auth/mfa/verify", { mfaChallengeToken, code: "000000" });
    expect(res.status).toBe(400);
  });

  it("a recovery code completes the MFA challenge exactly once (AUTH-127)", async () => {
    const email = `mfa-rec-${uuid7()}@example.test`;
    await registerAndVerify(ORG_A, email);
    const initialToken = await loginAndGetToken(ORG_A, email);
    const { recoveryCodes } = await enrollAndConfirmMfa(initialToken);
    const code = recoveryCodes[0]!;

    const loginRes1 = await post("/api/v1/auth/login", {
      organizationId: ORG_A,
      email,
      password: "a-very-strong-password-1",
    });
    const { mfaChallengeToken: challenge1 } = (await loginRes1.json()) as {
      mfaChallengeToken: string;
    };
    const firstUse = await post("/api/v1/auth/mfa/verify", {
      mfaChallengeToken: challenge1,
      code,
      isRecoveryCode: true,
    });
    expect(firstUse.status).toBe(200);

    const loginRes2 = await post("/api/v1/auth/login", {
      organizationId: ORG_A,
      email,
      password: "a-very-strong-password-1",
    });
    const { mfaChallengeToken: challenge2 } = (await loginRes2.json()) as {
      mfaChallengeToken: string;
    };
    const secondUse = await post("/api/v1/auth/mfa/verify", {
      mfaChallengeToken: challenge2,
      code,
      isRecoveryCode: true,
    });
    expect(secondUse.status).toBe(400);
  });

  it("disabling MFA requires the current password and turns the challenge back off", async () => {
    const email = `mfa-off-${uuid7()}@example.test`;
    await registerAndVerify(ORG_A, email);
    const token = await loginAndGetToken(ORG_A, email);
    await enrollAndConfirmMfa(token);

    const wrongPw = await post(
      "/api/v1/auth/mfa/disable",
      { currentPassword: "wrong" },
      { authorization: `Bearer ${token}` },
    );
    expect(wrongPw.status).toBe(401);

    const disable = await post(
      "/api/v1/auth/mfa/disable",
      { currentPassword: "a-very-strong-password-1" },
      { authorization: `Bearer ${token}` },
    );
    expect(disable.status).toBe(200);

    const loginRes = await post("/api/v1/auth/login", {
      organizationId: ORG_A,
      email,
      password: "a-very-strong-password-1",
    });
    const body = (await loginRes.json()) as { status: string };
    expect(body.status).toBe("authenticated");
  });

  it("issues an admin-typed session for a user holding the ADMIN role", async () => {
    const email = `admin-${uuid7()}@example.test`;
    await registerAndVerify(ORG_A, email);
    const userQueryRows = await db
      .select()
      .from(sqliteSchema.users)
      .where(eq(sqliteSchema.users.email, email));
    const user = userQueryRows[0]!;
    const t = now();
    await db
      .insert(sqliteSchema.userRoleAssignments)
      .values({
        id: uuid7(),
        organizationId: ORG_A,
        userId: user.id,
        roleId: ADMIN_ROLE_ID,
        scopeType: "ORG",
        scopeId: null,
        grantedBy: null,
        validFrom: t,
        validUntil: null,
        status: "active",
        createdAt: t,
        updatedAt: t,
      })
      .run();

    const token = await loginAndGetToken(ORG_A, email);
    const sessions = await db
      .select()
      .from(sqliteSchema.loginSessions)
      .where(eq(sqliteSchema.loginSessions.userId, user.id));
    expect(sessions.some((s) => s.sessionType === "admin")).toBe(true);
    expect(token).toBeTruthy();
  });
});

async function userIdFor(email: string): Promise<string> {
  const userQueryRows = await db
    .select()
    .from(sqliteSchema.users)
    .where(eq(sqliteSchema.users.email, email));
  const row = userQueryRows[0]!;
  return row.id;
}
