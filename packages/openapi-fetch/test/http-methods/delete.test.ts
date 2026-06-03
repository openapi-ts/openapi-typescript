import { assertType, describe, expect, test } from "vitest";
import { createObservedClient } from "../helpers.js";
import type { paths } from "./schemas/delete.js";

describe("DELETE", () => {
  test("returns empty object on 204", async () => {
    const client = createObservedClient<paths>({}, async () => new Response(null, { status: 204 }));
    const { data, error, response } = await client.DELETE("/tags/{name}", {
      params: { path: { name: "New Tag" } },
    });

    // assert correct data was returned
    assertType<undefined>(data);
    expect(data).toEqual(undefined);
    expect(response.status).toBe(204);

    // assert error is empty
    expect(error).toBeUndefined();
  });

  test("sends the correct method", async () => {
    let method = "";
    const client = createObservedClient<paths>({}, async (req) => {
      method = req.method;
      return new Response(null, { status: 204 });
    });
    await client.DELETE("/tags/{name}", { params: { path: { name: "Tag" } } });
    expect(method).toBe("DELETE");
  });

  test("returns undefined on Content-Length: 0", async () => {
    const client = createObservedClient<paths>(
      {},
      async () => new Response(null, { status: 200, headers: { "Content-Length": "0" } }),
    );
    const { data, error } = await client.DELETE("/tags/{name}", {
      params: {
        path: { name: "Tag" },
      },
    });

    // assert correct data was returned
    assertType<undefined>(data);
    expect(data).toEqual(undefined);

    // assert error is empty
    expect(error).toBeUndefined();
  });

  test("handles error response with empty body when Content-Length header is stripped by proxy", async () => {
    // Simulate proxy stripping Content-Length header from an empty error response
    const client = createObservedClient<paths>(
      {},
      async () => new Response(null, { status: 500 }), // No Content-Length header
    );
    const { data, error, response } = await client.DELETE("/tags/{name}", {
      params: {
        path: { name: "Tag" },
      },
    });

    // assert data is undefined for error response
    expect(data).toBeUndefined();

    // assert error is undefined for empty body (consistent with 204 and Content-Length: 0 handling)
    expect(error).toBeUndefined();

    // assert response status is preserved
    expect(response.status).toBe(500);
    expect(response.ok).toBe(false);
  });

  test("handles success response with empty body when Content-Length header is stripped by proxy", async () => {
    // Simulate proxy stripping Content-Length header from an empty success response
    const client = createObservedClient<paths>(
      {},
      async () => new Response(null, { status: 200 }), // No Content-Length header
    );
    const { data, error, response } = await client.DELETE("/tags/{name}", {
      params: {
        path: { name: "Tag" },
      },
    });

    // assert data is undefined for empty body
    expect(data).toBeUndefined();

    // assert error is undefined for success response
    expect(error).toBeUndefined();

    // assert response status is preserved
    expect(response.status).toBe(200);
    expect(response.ok).toBe(true);
  });
});
