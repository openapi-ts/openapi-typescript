import { test } from "vitest";
import { createPathBasedClient } from "../../src/index.js";
import type { paths } from "../http-methods/schemas/post.js";

test("path-based client rejects undefined request body properties", () => {
  const client = createPathBasedClient<paths>();

  client["/posts"].POST({
    body: {
      title: "My Post",
      body: "Post body",
      publish_date: new Date("2024-06-06T12:00:00Z").getTime(),
      // Regression test for #1769 across path-based clients.
      // @ts-expect-error
      undefined_property: true,
    },
  });
});
