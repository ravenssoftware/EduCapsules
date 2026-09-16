/**
 * SEC-011 scope containment (§7.3): "A grant at scope S applies to S and to
 * every scope contained by S. It never applies to a parent or a sibling of
 * S." Two independent trees (Figure 9.1): the cohort tree
 * (ORG > CLASSROOM > GROUP) and the content tree
 * (ORG > SUBJECT > COURSE > CYCLE). A scope from one tree never contains or
 * is contained by a scope from the other, except at ORG, which is the root
 * of both.
 */

export type ScopeType = "ORG" | "CLASSROOM" | "GROUP" | "SUBJECT" | "COURSE" | "CYCLE";

export interface ScopeRef {
  scopeType: ScopeType;
  /** Null only for scopeType 'ORG' — an organization-wide scope. */
  scopeId: string | null;
}

/**
 * The chain from a concrete scope up to ORG, inclusive of the scope itself
 * — e.g. resolveAncestors(GROUP g) -> [GROUP g, CLASSROOM c, ORG].
 * Requires a repository capable of walking one level at a time (see
 * repository.ts's `findParentScope`), since which classroom a group
 * belongs to, or which subject a course belongs to, is data, not a static
 * rule.
 */
export async function resolveAncestorChain(
  findParentScope: (organizationId: string, scope: ScopeRef) => Promise<ScopeRef | null>,
  organizationId: string,
  scope: ScopeRef,
): Promise<ScopeRef[]> {
  const chain: ScopeRef[] = [scope];
  let current = scope;
  // A concrete tree is at most 3 deep (CYCLE -> COURSE -> SUBJECT -> ORG, or
  // GROUP -> CLASSROOM -> ORG) — the loop bound is a defensive cap against a
  // data bug creating a cycle, not an expected path length.
  for (let i = 0; i < 8 && current.scopeType !== "ORG"; i++) {
    const parent = await findParentScope(organizationId, current);
    if (!parent) break;
    chain.push(parent);
    current = parent;
  }
  return chain;
}

/** True if `grantedScope` covers `target` — target is the same scope, or is contained by it, per the chain already resolved for target. */
export function grantCoversTarget(grantedScope: ScopeRef, targetChain: ScopeRef[]): boolean {
  if (grantedScope.scopeType === "ORG") return true; // ORG contains everything on either tree.
  return targetChain.some(
    (s) => s.scopeType === grantedScope.scopeType && s.scopeId === grantedScope.scopeId,
  );
}
