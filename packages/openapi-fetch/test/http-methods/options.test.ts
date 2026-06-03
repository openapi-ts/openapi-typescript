import { describe, expect, test } from "vitest";
import { createObservedClient } from "../helpers.js";
import type { paths } from "./schemas/options.js";

describe("OPTIONS", () => {
  test("sends the correct method", async () => {
    let method = "";
    const client = createObservedClient<paths>({}, async (req) => {
      method = req.method;
      return new Response("", { headers: { Allow: "OPTIONS, GET, HEAD, POST" }, status: 200 });
    });
    await client.OPTIONS("/resources", { parseAs: "text" });
    expect(method).toBe("OPTIONS");
  });
});
