import { describe, expect, it } from "vitest";
import { computeProgressiveDelayMs } from "./progressive-delay.js";

describe("progressive login delay (SEC-032/API-017)", () => {
  it("applies no delay for the first couple of failed attempts", () => {
    expect(computeProgressiveDelayMs(1)).toBe(0);
    expect(computeProgressiveDelayMs(2)).toBe(0);
  });

  it("grows monotonically with each further failed attempt", () => {
    const delays = [3, 4, 5, 6, 7, 8].map(computeProgressiveDelayMs);
    for (let i = 1; i < delays.length; i++) {
      expect(delays[i]!).toBeGreaterThanOrEqual(delays[i - 1]!);
    }
    expect(delays[0]).toBeGreaterThan(0);
  });

  it("caps out rather than growing unbounded", () => {
    expect(computeProgressiveDelayMs(20)).toBe(computeProgressiveDelayMs(9));
  });
});
