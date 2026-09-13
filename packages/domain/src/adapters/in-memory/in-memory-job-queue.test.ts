import { describe, expect, it } from "vitest";
import type { JobQueue } from "../../ports/job-queue.js";
import { InMemoryJobQueue } from "./in-memory-job-queue.js";

/**
 * Contract test for `JobQueue` — see the object-store contract test for why
 * this stays one parametrized suite as real adapters (Cloudflare Queues,
 * Redis) are added in the phase that first needs background jobs.
 */
const implementations: Array<[string, () => JobQueue]> = [
  ["InMemoryJobQueue", () => new InMemoryJobQueue()],
];

describe.each(implementations)("JobQueue contract (%s)", (_name, factory) => {
  it("delivers an enqueued job to its consumer", async () => {
    const queue = factory();
    let received: unknown;
    queue.consume("test.job", async (job) => {
      received = job.payload;
    });
    await queue.enqueue(
      "test.job",
      { hello: "world" },
      {
        actorId: "svc:test",
        correlationId: "corr-1",
      },
    );
    expect(received).toEqual({ hello: "world" });
  });

  it("carries an explicit actor id — never an anonymous 'the system' actor (BE-003)", async () => {
    const queue = factory();
    let actorId: string | undefined;
    queue.consume("test.job", async (job) => {
      actorId = job.actorId;
    });
    await queue.enqueue("test.job", {}, { actorId: "svc:notifications", correlationId: "c-1" });
    expect(actorId).toBe("svc:notifications");
  });

  it("routes a job with no registered consumer to the dead letter, never dropping it", async () => {
    const queue = factory();
    const jobId = await queue.enqueue(
      "unhandled.job",
      {},
      {
        actorId: "svc:test",
        correlationId: "c-1",
      },
    );
    const dead = await queue.deadLetter(jobId);
    expect(dead?.type).toBe("unhandled.job");
  });

  it("routes a job whose handler throws to the dead letter, never silently swallowing it", async () => {
    const queue = factory();
    queue.consume("failing.job", async () => {
      throw new Error("boom");
    });
    const jobId = await queue.enqueue(
      "failing.job",
      {},
      {
        actorId: "svc:test",
        correlationId: "c-1",
      },
    );
    const dead = await queue.deadLetter(jobId);
    expect(dead?.type).toBe("failing.job");
  });
});
