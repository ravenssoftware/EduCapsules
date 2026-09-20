import { describe, expect, it } from "vitest";
import { newCorrelationId } from "./correlation-id.js";

describe("newCorrelationId", () => {
  it("generates a unique id each call", () => {
    const a = newCorrelationId();
    const b = newCorrelationId();
    expect(a).not.toBe(b);
  });

  it("generates a well-formed UUID", () => {
    const id = newCorrelationId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});
