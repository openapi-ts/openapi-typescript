import { describe } from "node:test";
import { expect, test } from "vitest";
import { createObservedClient } from "../helpers.js";
import type { paths } from "./schemas/head.js";

describe("HEAD", () => {
  test("sends the correct method", async () => {
    let method = "";
    const client = createObservedClient<paths>({}, async (req) => {
      method = req.method;
      return new Response(null, { headers: { "Content-Length": "0" } });
    });
    await client.HEAD("/resources/{id}", { params: { path: { id: 123 } } });
    expect(method).toBe("HEAD");
  });
});
