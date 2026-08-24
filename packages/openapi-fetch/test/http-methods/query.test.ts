import { describe, expect, test } from "vitest";
import { wrapAsPathBasedClient } from "../../src/index.js";
import { createObservedClient, headersToObj } from "../helpers.js";
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

  test("sends the request body with a Content-Type", async () => {
    // RFC 10008 §2: a QUERY request has content, so it must identify its media type
    let actualBody = "";
    let actualContentType: string | null = "";
    const client = createObservedClient<paths>({}, async (req) => {
      actualBody = await req.text();
      actualContentType = req.headers.get("Content-Type");
      return Response.json({});
    });

    await client.QUERY("/resources/{id}", {
      params: { path: { id: 123 } },
      body: { ids: [1, 2, 3] },
    });

    expect(actualBody).toBe(JSON.stringify({ ids: [1, 2, 3] }));
    expect(actualContentType).toBe("application/json");
  });

  // QUERY is defined as safe & idempotent (RFC 10008 §2), so identical calls must stay
  // identical on the wire: the client may not add per-request state of its own, and it
  // may not consume or mutate the caller’s `init`.
  describe("idempotency", () => {
    test("repeated identical calls produce identical requests", async () => {
      const observed: { method: string; url: string; headers: Record<string, string>; body: string }[] = [];
      const client = createObservedClient<paths>({}, async (req) => {
        observed.push({
          method: req.method,
          url: req.url,
          headers: headersToObj(req.headers),
          body: await req.text(),
        });
        return Response.json({});
      });

      const init = {
        params: { path: { id: 123 } },
        body: { ids: [1, 2, 3] },
      };

      // reuse the exact same init object, to assert it is not consumed or mutated
      await client.QUERY("/resources/{id}", init);
      await client.QUERY("/resources/{id}", init);

      expect(observed).toHaveLength(2);
      expect(observed[1]).toEqual(observed[0]);
      expect(init).toEqual({ params: { path: { id: 123 } }, body: { ids: [1, 2, 3] } });
    });

    test("is safe: no request body is read or replayed across calls", async () => {
      // a request body may only be consumed once, so each call must build its own Request
      const bodies: string[] = [];
      const client = createObservedClient<paths>({}, async (req) => {
        bodies.push(await req.text());
        return Response.json({});
      });

      await client.QUERY("/resources/{id}", { params: { path: { id: 1 } }, body: { ids: [1] } });
      await client.QUERY("/resources/{id}", { params: { path: { id: 1 } }, body: { ids: [1] } });

      expect(bodies).toEqual([JSON.stringify({ ids: [1] }), JSON.stringify({ ids: [1] })]);
    });
  });

  test("works with the path based client", async () => {
    let method = "";
    let actualPathname = "";
    const client = wrapAsPathBasedClient<paths>(
      createObservedClient<paths>({}, async (req) => {
        method = req.method;
        actualPathname = new URL(req.url).pathname;
        return Response.json({});
      }),
    );

    await client["/resources/{id}"].QUERY({
      params: { path: { id: 123 } },
      body: { ids: [1, 2, 3] },
    });

    expect(method).toBe("QUERY");
    expect(actualPathname).toBe("/resources/123");
  });
});
