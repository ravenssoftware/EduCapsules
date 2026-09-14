import type { AuthRepository, UserRow } from "./repository.js";

/**
 * SEC-032 brute-force protection / Table 44.1 LOCKED account state. A
 * self-healing time-based lock: after MAX_FAILED_ATTEMPTS consecutive
 * failures the account moves to status='locked' with a locked_until
 * timestamp; the very next login attempt after that timestamp passes is
 * allowed to proceed to normal password verification again (which, if
 * correct, calls recordSuccessfulLogin and clears the lock). This is the
 * "defined recovery path" Phase 4's scope calls for without building the
 * admin-unlock tooling that belongs to a later phase — see
 * docs/auth/authentication.md §4 for the full reasoning and the documented
 * limitation (no immediate admin override yet).
 */
const MAX_FAILED_ATTEMPTS = 10;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export function isCurrentlyLocked(user: UserRow, now: Date): boolean {
  return (
    user.status === "locked" &&
    user.lockedUntil !== null &&
    user.lockedUntil.getTime() > now.getTime()
  );
}

/** Returns true if this failure just triggered a new lock (caller uses this to decide whether to raise ACCOUNT_LOCKED). */
export async function recordFailedLogin(
  repo: AuthRepository,
  user: UserRow,
  now: Date,
): Promise<{ locked: boolean }> {
  // A lock whose timer has already expired self-clears on the next attempt,
  // successful or not, rather than requiring a separate unlock action.
  const startingCount =
    user.status === "locked" && !isCurrentlyLocked(user, now) ? 0 : user.failedLoginCount;
  const failedLoginCount = startingCount + 1;

  if (failedLoginCount >= MAX_FAILED_ATTEMPTS) {
    await repo.patchUser(user.organizationId, user.id, {
      status: "locked",
      failedLoginCount,
      lockedUntil: new Date(now.getTime() + LOCKOUT_DURATION_MS),
      updatedAt: now,
    });
    return { locked: true };
  }

  await repo.patchUser(user.organizationId, user.id, {
    failedLoginCount,
    updatedAt: now,
    ...(user.status === "locked" ? { status: "active" as const, lockedUntil: null } : {}),
  });
  return { locked: false };
}

export async function recordSuccessfulLogin(
  repo: AuthRepository,
  user: UserRow,
  now: Date,
): Promise<void> {
  if (user.failedLoginCount === 0 && user.status !== "locked") return;
  await repo.patchUser(user.organizationId, user.id, {
    failedLoginCount: 0,
    lockedUntil: null,
    ...(user.status === "locked" ? { status: "active" as const } : {}),
    updatedAt: now,
  });
}
