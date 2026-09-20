/**
 * The `JobQueue` port — SRS BE-008's portability contract applied to
 * background work. No domain or service code may import a queue SDK
 * (Cloudflare Queues, Redis/BullMQ, etc.) directly. The Cloudflare Queues
 * adapter (MVP) and the Redis-backed adapter (production) are added when a
 * module first needs background jobs (e.g. notification fan-out, Phase 19).
 */
export interface Job<TPayload = unknown> {
  readonly id: string;
  readonly type: string;
  readonly payload: TPayload;
  /** The actor a background job runs under — never "the system" (BE-003). */
  readonly actorId: string;
  readonly correlationId: string;
  readonly attempt: number;
}

export type JobHandler<TPayload = unknown> = (job: Job<TPayload>) => Promise<void>;

export interface JobQueue {
  enqueue<TPayload>(
    type: string,
    payload: TPayload,
    options: { actorId: string; correlationId: string },
  ): Promise<string>;
  consume(type: string, handler: JobHandler): void;
  /** Failed jobs land here after exhausting retries — never silently dropped. */
  deadLetter(jobId: string): Promise<Job | null>;
}
