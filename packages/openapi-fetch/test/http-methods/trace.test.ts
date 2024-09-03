import { describe, expect, test } from "vitest";
import { createObservedClient } from "../helpers.js";
import type { paths } from "./schemas/trace.js";

describe("TRACE()", () => {
  // Note: this isn’t an actual tests; just used to assert current behavior.
  // Node.js does not support TRACE with new Request().
  test("(not supported in Node.js)", async () => {
    const client = createObservedClient<paths>();
    expect(() => client.TRACE("/resources/{id}", { params: { path: { id: 123 } } })).rejects.toThrow();
  });
});
