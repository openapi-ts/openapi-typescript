import { describe, expect, test } from "vitest";
import { createObservedClient } from "../helpers.js";
import type { paths as get_paths } from "./schemas/get.js";
import type { paths as post_paths } from "./schemas/post.js";

describe("request", () => {
  test("sends correct method", async () => {
    let method = "";
    const client = createObservedClient<get_paths>({}, async (req) => {
      method = req.method;
      return Response.json({});
    });

    await client.request("get", "/posts");
    expect(method).toBe("GET");
  });

  test("sends correct method with params", async () => {
    let method = "";
    const client = createObservedClient<post_paths>({}, async (req) => {
      method = req.method;
      return Response.json({});
    });

    await client.request("post", "/posts", {
      body: { title: "My Post", body: "Post body", publish_date: new Date("2024-06-06T12:00:00Z").getTime() },
    });

    expect(method).toBe("POST");
  });
});
