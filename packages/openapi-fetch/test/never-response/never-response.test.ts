import { assertType, describe, expect, test } from "vitest";
import { createObservedClient } from "../helpers.js";
import type { components, paths } from "./schemas/never-response.js";

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
      id: 123,
      title: "My Post",
    };

    let actualPathname = "";
    const client = createObservedClient<paths>({}, async (req) => {
      actualPathname = new URL(req.url).pathname;
      return Response.json(mockData);
    });

    const { data, error, response } = await client.GET("/posts/{id}", {
      params: { path: { id: 123 } },
    });

    assertType<typeof mockData | undefined>(data);

    // assert correct URL was called
    expect(actualPathname).toBe("/posts/123");

    // assert correct data was returned
    expect(data).toEqual(mockData);
    expect(response.status).toBe(200);

    // assert error is empty
    expect(error).toBeUndefined();
  });

  test("sends correct options, returns undefined on 204", async () => {
    let actualPathname = "";
    const client = createObservedClient<paths>({}, async (req) => {
      actualPathname = new URL(req.url).pathname;
      return new Response(null, { status: 204 });
    });

    const { data, error, response } = await client.GET("/posts/{id}", {
      params: { path: { id: 123 } },
    });

    assertType<components["schemas"]["Post"] | undefined>(data);

    // assert correct URL was called
    expect(actualPathname).toBe("/posts/123");

    // assert 204 to be transformed to be undefined
    expect(data).toEqual(undefined);
    expect(response.status).toBe(204);

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

    assertType<typeof mockError | undefined>(error);

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

  test("handles array-type responses", async () => {
    const client = createObservedClient<paths>({}, async () => Response.json([]));

    const { data } = await client.GET("/posts", { params: {} });
    if (!data) {
      throw new Error("data empty");
    }

    // assert array type (and only array type) was inferred
    expect(data.length).toBe(0);
  });

  test("handles empty-array-type 204 response", async () => {
    let method = "";
    let actualPathname = "";
    const client = createObservedClient<paths>({}, async (req) => {
      method = req.method;
      actualPathname = new URL(req.url).pathname;
      return new Response(null, { status: 204 });
    });

    const { data } = await client.GET("/posts", { params: {} });

    assertType<components["schemas"]["Post"][] | unknown[] | undefined>(data);

    // assert correct URL was called
    expect(actualPathname).toBe("/posts");

    // assert correct method was called
    expect(method).toBe("GET");

    // assert 204 to be transformed to undefined
    expect(data).toEqual(undefined);
  });

  test("gracefully handles invalid JSON for errors", async () => {
    const client = createObservedClient<paths>({}, async () => new Response("Unauthorized", { status: 401 }));

    const { data, error } = await client.GET("/posts");

    expect(data).toBeUndefined();
    expect(error).toBe("Unauthorized");
  });

  test("type narrowing on status", async () => {
    const mockData = {
      id: 123,
      title: "My Post",
    };

    let actualPathname = "";
    const client = createObservedClient<paths>({}, async (req) => {
      actualPathname = new URL(req.url).pathname;
      return Response.json(mockData);
    });

    const { data, error, status } = await client.GET("/posts/{id}", {
      params: { path: { id: 123 } },
    });

    if (status === 200) {
      assertType<typeof mockData>(data);
      assertType<never>(error);
    } else if (status === 204) {
      assertType<undefined>(data);
    } else if (status === 400) {
      assertType<components["schemas"]["Error"]>(error);
    } else if (status === 201) {
      // Grabs the 'default' response
      assertType<components["schemas"]["Error"]>(error);
    } else if (status === 500) {
      assertType<never>(data);
      assertType<undefined>(error);
    } else {
      // All other status codes are handles with the 'default' response
      assertType<components["schemas"]["Error"]>(error);
    }
  });
});
