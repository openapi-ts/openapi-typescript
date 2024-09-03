import { describe, expect, test } from "vitest";
import { createObservedClient } from "../helpers.js";
import type { paths } from "./schemas/put.js";

describe("PUT", () => {
  test("sends the correct method", async () => {
    let method = "";
    const client = createObservedClient<paths>({}, async (req) => {
      method = req.method;
      return Response.json({});
    });
    await client.PUT("/resources", {
      body: { name: "New name" },
    });
    expect(method).toBe("PUT");
  });
});
