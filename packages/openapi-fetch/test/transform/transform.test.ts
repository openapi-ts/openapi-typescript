import { assert, expect, test } from "vitest";
import { createObservedClient } from "../helpers.js";
import type { paths } from "./schemas/transform.js";

interface PostResponse {
  id: number;
  title: string;
  created_at: string | Date;
}

test("transforms date strings to Date objects", async () => {
  const client = createObservedClient<paths>(
    {
      transform: {
        response: (method, path, data) => {
          if (!data || typeof data !== "object") return data;

          const result = { ...data } as PostResponse;

          if (typeof result.created_at === "string") {
            result.created_at = new Date(result.created_at);
          }

          return result;
        },
      },
    },
    async () =>
      Response.json({
        id: 1,
        title: "Test Post",
        created_at: "2023-01-01T00:00:00Z",
      }),
  );

  const { data } = await client.GET("/posts/{id}", {
    params: { path: { id: 1 } },
  });

  const post = data as PostResponse;

  assert(post.created_at instanceof Date, "created_at should be a Date");
  expect(post.created_at.getFullYear()).toBe(2023);
  expect(post.created_at.getMonth()).toBe(0); // January
  expect(post.created_at.getDate()).toBe(1);
});
