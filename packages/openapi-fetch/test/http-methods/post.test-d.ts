import { test } from "vitest";
import createClient from "../../src/index.js";
import type { paths } from "./schemas/post.js";

test("POST rejects undefined request body properties", () => {
  const client = createClient<paths>();

  client.POST("/posts", {
    body: {
      title: "My Post",
      body: "Post body",
      publish_date: new Date("2024-06-06T12:00:00Z").getTime(),
      // Regression test for #1769: extra body fields must still error when required fields are present.
      // @ts-expect-error
      undefined_property: true,
    },
  });
});
