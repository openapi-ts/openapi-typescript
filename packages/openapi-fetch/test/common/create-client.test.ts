import { describe, expect, test } from "vitest";
import { createObservedClient } from "../helpers.js";
import createClient, { type FetchOptions, type HeadersOptions } from "../../src/index.js";
import type { paths } from "./schemas/common.js";
import { Agent } from "undici";

describe("createClient options", () => {
  test("baseUrl", async () => {
    let actualURL = new URL("https://fakeurl.example");
    const client = createObservedClient<paths>({ baseUrl: "https://api.foo.bar/v2" }, async (req) => {
      actualURL = new URL(req.url);
      return Response.json([]);
    });
    await client.GET("/resources");
    expect(actualURL.href).toBe("https://api.foo.bar/v2/resources");
  });

  test("baseUrl removes trailing slash", async () => {
    let actualURL = new URL("https://fakeurl.example");
    const client = createObservedClient<paths>({ baseUrl: "https://api.foo.bar/v3/" }, async (req) => {
      actualURL = new URL(req.url);
      return Response.json([]);
    });
    await client.GET("/resources");
    expect(actualURL.href).toBe("https://api.foo.bar/v3/resources");
  });

  test("baseUrl per request", async () => {
    let actualURL = new URL("https://fakeurl.example");
    const client = createObservedClient<paths>({ baseUrl: "https://fakeurl.example" }, async (req) => {
      actualURL = new URL(req.url);
      return Response.json([]);
    });

    const localBaseUrl = "https://api.foo.bar/v3";
    await client.GET("/resources", { baseUrl: localBaseUrl });

    // assert baseUrl and path mesh as expected
    expect(actualURL.href).toBe("https://api.foo.bar/v3/resources");
  });

  describe("content-type", () => {
    const BODY_ACCEPTING_METHODS = [["PUT"], ["POST"], ["DELETE"], ["OPTIONS"], ["PATCH"]] as const;
    const ALL_METHODS = [...BODY_ACCEPTING_METHODS, ["GET"], ["HEAD"]] as const;

    async function fireRequestAndGetContentType(options: {
      defaultHeaders?: HeadersOptions;
      method: (typeof ALL_METHODS)[number][number];
      fetchOptions: FetchOptions<any>;
    }) {
      let headers = new Headers();
      const client = createObservedClient<any>({ headers: options.defaultHeaders }, async (req) => {
        headers = req.headers;
        return Response.json([]);
      });
      await client[options.method]("/resources", options.fetchOptions as any);
      return headers.get("content-type");
    }

    test.each(ALL_METHODS)("no content-type for body-less requests - %s", async (method) => {
      const contentType = await fireRequestAndGetContentType({
        method,
        fetchOptions: {},
      });

      expect(contentType).toBe(null);
    });

    test.each(ALL_METHODS)("no content-type for `undefined` body requests - %s", async (method) => {
      const contentType = await fireRequestAndGetContentType({
        method,
        fetchOptions: { body: undefined },
      });

      expect(contentType).toBe(null);
    });

    const BODIES = [{ prop: "a" }, {}, "", "str", null, false, 0, 1, new Date("2024-08-07T09:52:00.836Z")] as const;
    const METHOD_BODY_COMBINATIONS = BODY_ACCEPTING_METHODS.flatMap(([method]) =>
      BODIES.map((body) => [method, body] as const),
    );

    test.each(METHOD_BODY_COMBINATIONS)(
      "implicit default content-type for body-full requests - %s, %j",
      async (method, body) => {
        const contentType = await fireRequestAndGetContentType({
          method,
          fetchOptions: { body },
        });

        expect(contentType).toBe("application/json");
      },
    );

    test.each(METHOD_BODY_COMBINATIONS)(
      "provided default content-type for body-full requests - %s, %j",
      async (method, body) => {
        const contentType = await fireRequestAndGetContentType({
          defaultHeaders: { "content-type": "application/my-json" },
          method,
          fetchOptions: { body },
        });

        expect(contentType).toBe("application/my-json");
      },
    );

    test.each(METHOD_BODY_COMBINATIONS)(
      "native-fetch default content-type for body-full requests, when default is suppressed - %s, %j",
      async (method, body) => {
        const contentType = await fireRequestAndGetContentType({
          defaultHeaders: { "content-type": null },
          method,
          fetchOptions: { body },
        });
        // the fetch implementation won't allow sending a body without content-type,
        // and it defaults to `text/plain;charset=UTF-8`, however the actual default value
        // is irrelevant and might be flaky across different fetch implementations
        // for us, it's important that it's not `application/json`
        expect(contentType).not.toBe("application/json");
      },
    );

    test.each(METHOD_BODY_COMBINATIONS)(
      "specified content-type for body-full requests - %s, %j",
      async (method, body) => {
        const contentType = await fireRequestAndGetContentType({
          method,
          fetchOptions: {
            body,
            headers: { "content-type": "application/my-json" },
          },
        });

        expect(contentType).toBe("application/my-json");
      },
    );

    test.each(METHOD_BODY_COMBINATIONS)(
      "specified content-type for body-full requests, even when default is suppressed - %s, %j",
      async (method, body) => {
        const contentType = await fireRequestAndGetContentType({
          method,
          fetchOptions: {
            body,
            headers: { "content-type": "application/my-json" },
          },
        });

        expect(contentType).toBe("application/my-json");
      },
    );
  });
});
