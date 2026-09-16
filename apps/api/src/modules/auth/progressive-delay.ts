/**
 * SEC-032 / API-017 progressive delay — a defense against brute force and
 * credential stuffing that is independent of both the account-lockout
 * threshold (lockout.ts) and the IP-based rate limiter (rate-limit.ts):
 * each consecutive failed login attempt against the *same account* adds
 * real latency before the failure response is returned, making automated
 * guessing increasingly costly well before the account actually locks.
 *
 * Keyed on the account's own failed-attempt counter (the same one
 * lockout.ts tracks), not the caller's IP — this is what makes it
 * "additionally" and "independently of the IP-based limit" per API-017:
 * a distributed attacker spreading one guess per account across many IPs
 * still pays this cost once they retry the *same* account.
 *
 * Values are conservative and deliberately small (milliseconds, not
 * seconds) so the defense is real without making a legitimate user who
 * mistypes a password twice notice — same "conservative point in an
 * indicative band, trivially reconfigurable" treatment as
 * sessions.ts's SESSION_POLICY.
 *
 * Known limitation (documented, not silently absorbed): this delay only
 * applies once a real account with a failed-attempt history is found —
 * the login() path for a non-existent email (which only ever runs the
 * fixed-cost DUMMY_HASH verify for AUTH-122 timing normalization) is not
 * delayed the same way, since there is no per-account counter to key off
 * for an account that doesn't exist. This reopens a narrow, secondary
 * timing signal after >=3 failed attempts against the same real account,
 * smaller than the disclosure account_locked (423) itself already makes
 * at attempt 10 regardless.
 */
const DELAY_STARTS_AT_ATTEMPT = 3;
const BASE_DELAY_MS = 50;
const MAX_DELAY_MS = 500;

export function computeProgressiveDelayMs(failedLoginCount: number): number {
  if (failedLoginCount < DELAY_STARTS_AT_ATTEMPT) return 0;
  const exponent = failedLoginCount - DELAY_STARTS_AT_ATTEMPT;
  return Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** exponent);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
