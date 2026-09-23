import { describe, expect, test } from "vitest";
import { createObservedClient } from "../helpers.js";
import type { paths } from "./schemas/query.js";

describe("QUERY", () => {
  test("sends the correct method", async () => {
    let method = "";
    const client = createObservedClient<paths>({}, async (req) => {
      method = req.method;
      return Response.json({});
    });
    await client.QUERY("/resources/{id}", {
      params: { path: { id: 123 } },
      body: { ids: [1, 2, 3] },
    });
    expect(method).toBe("QUERY");
  });

  describe("request body", () => {
    test("requires necessary requestBodies", async () => {
      const client = createObservedClient<paths>({});

      // expect error on missing `body`
      await client.QUERY("/resources/{id}", {
        params: { path: { id: 1 } },
        // @ts-expect-error
        body: undefined,
      });

      // expect error on missing required fields
      await client.QUERY("/resources/{id}", {
        params: { path: { id: 1 } },
        // @ts-expect-error
        body: {},
      });

      // expect present body to be good enough
      await client.QUERY("/resources/{id}", {
        params: { path: { id: 1 } },
        body: { ids: [1, 2, 3] },
      });
    });

    test("requestBody with required: false", async () => {
      const client = createObservedClient<paths>({});

      // assert missing `body` doesn't raise a TS error
      await client.QUERY("/resources-optional", {
        params: { path: { id: 1 } },
      });

      // assert error on type mismatch
      await client.QUERY("/resources-optional", {
        params: { path: { id: 1 } },
        body: {
          // @ts-expect-error
          ids: "not-an-array",
        },
      });
    });
  });

  test("sends correct options, returns success", async () => {
    const mockData = { status: "ok" };
    let actualPathname = "";
    const client = createObservedClient<paths>({}, async (req) => {
      actualPathname = new URL(req.url).pathname;
      return Response.json(mockData, { status: 200 });
    });

    const { data, error, response } = await client.QUERY("/resources/{id}", {
      params: { path: { id: 456 } },
      body: { ids: [7, 8, 9] },
    });

    // assert correct URL was called
    expect(actualPathname).toBe("/resources/456");

    // assert correct data was returned
    expect(data).toEqual(mockData);
    expect(response.status).toBe(200);

    // assert error is empty
    expect(error).toBeUndefined();
  });
});
