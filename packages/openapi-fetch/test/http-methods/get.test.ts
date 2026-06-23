import { describe, expect, test } from "vitest";
import { createObservedClient } from "../helpers.js";
import type { paths } from "./schemas/get.js";

describe("GET", () => {
  test("sends correct method", async () => {
    let method = "";
    const client = createObservedClient<paths>({}, async (req) => {
      method = req.method;
      return Response.json({});
    });
    await client.GET("/posts");
    expect(method).toBe("GET");
  });

  test("sends correct options, returns success", async () => {
    const mockData = {
      title: "My Post",
      body: "<p>This is a very good post</p>",
      publish_date: new Date("2023-03-01T12:00:00Z").getTime(),
    };

    let actualPathname = "";
    const client = createObservedClient<paths>({}, async (req) => {
      actualPathname = new URL(req.url).pathname;
      return Response.json(mockData);
    });

    const { data, error, response } = await client.GET("/posts/{id}", {
      params: { path: { id: 123 } },
    });

    // assert correct URL was called
    expect(actualPathname).toBe("/posts/123");

    // assert correct data was returned
    expect(data).toEqual(mockData);
    expect(response.status).toBe(200);

    // assert error is empty
    expect(error).toBeUndefined();
  });

  test("sends correct options, returns error", async () => {
    const mockError = { code: 404, message: "Post not found" };

    let method = "";
    let actualPathname = "";
    const client = createObservedClient<paths>({}, async (req) => {
      method = req.method;
      actualPathname = new URL(req.url).pathname;
      return Response.json(mockError, { status: 404 });
    });

    const { data, error, response } = await client.GET("/posts/{id}", {
      params: { path: { id: 123 } },
    });

    // assert correct URL was called
    expect(actualPathname).toBe("/posts/123");

    // assert correct method was called
    expect(method).toBe("GET");

    // assert correct error was returned
    expect(error).toEqual(mockError);
    expect(response.status).toBe(404);

    // assert data is empty
    expect(data).toBeUndefined();
  });

  // note: this was a previous bug in the type inference
  test("handles array-type responses", async () => {
    const client = createObservedClient<paths>({}, async () => Response.json([]));

    const { data } = await client.GET("/posts", { params: {} });
    if (!data) {
      throw new Error("data empty");
    }

    // assert array type (and only array type) was inferred
    expect(data.length).toBe(0);
  });

  test("gracefully handles invalid JSON for errors", async () => {
    const client = createObservedClient<paths>({}, async () => new Response("Unauthorized", { status: 401 }));

    const { data, error } = await client.GET("/posts");

    expect(data).toBeUndefined();
    expect(error).toBe("Unauthorized");
  });
});
