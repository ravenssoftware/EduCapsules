/**
 * One correlation id per causal chain (an API request, and every background
 * job it triggers), propagated across services, jobs and logs — SRS
 * NFR-012 / INF-006 / BE-003. Generation uses the platform-neutral Web
 * Crypto API (available in both Cloudflare Workers and Node 22+), never a
 * vendor-specific id generator.
 */
export type CorrelationId = string & { readonly __brand: "CorrelationId" };

export function newCorrelationId(): CorrelationId {
  return crypto.randomUUID() as CorrelationId;
}
