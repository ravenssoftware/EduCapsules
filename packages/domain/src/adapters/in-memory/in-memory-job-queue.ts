import type { Job, JobHandler, JobQueue } from "../../ports/job-queue.js";

/**
 * A dependency-free `JobQueue` implementation for unit tests and local
 * development — runs handlers synchronously on enqueue. Not a production
 * adapter. Proves the port's shape is implementable by more than one
 * backend before the Cloudflare Queues / Redis adapters exist (BE-008).
 */
export class InMemoryJobQueue implements JobQueue {
  private readonly handlers = new Map<string, JobHandler>();
  private readonly deadLetters = new Map<string, Job>();
  private nextId = 1;

  async enqueue<TPayload>(
    type: string,
    payload: TPayload,
    options: { actorId: string; correlationId: string },
  ): Promise<string> {
    const job: Job<TPayload> = {
      id: String(this.nextId++),
      type,
      payload,
      actorId: options.actorId,
      correlationId: options.correlationId,
      attempt: 1,
    };
    const handler = this.handlers.get(type);
    if (!handler) {
      this.deadLetters.set(job.id, job as Job);
      return job.id;
    }
    try {
      await handler(job as Job);
    } catch {
      this.deadLetters.set(job.id, job as Job);
    }
    return job.id;
  }

  consume(type: string, handler: JobHandler): void {
    this.handlers.set(type, handler);
  }

  async deadLetter(jobId: string): Promise<Job | null> {
    return this.deadLetters.get(jobId) ?? null;
  }
}
