import { describe, expect, test } from "vitest";
import { createObservedClient } from "../helpers.js";
import type { paths } from "./schemas/patch.js";

describe("PATCH", () => {
  test("sends the correct method", async () => {
    let method = "";
    const client = createObservedClient<paths>({}, async (req) => {
      method = req.method;
      return Response.json({});
    });
    await client.PATCH("/resources/{id}", {
      params: { path: { id: 123 } },
      body: { name: "New name" },
    });
    expect(method).toBe("PATCH");
  });
});
