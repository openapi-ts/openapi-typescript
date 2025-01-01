import type { MediaType } from "openapi-typescript-helpers";
import { createExpect, describe, expect, expectTypeOf, test } from "vitest";
import { createPathBasedClient, type PathBasedClient } from "../../src/index.js";
import type { paths } from "./schemas/path-based-client.js";

// identical to helper, but for createObservedPathBasedClient
function createObservedPathBasedClient<T extends {}, M extends MediaType = MediaType>(
  options?: Parameters<typeof createPathBasedClient<T>>[0],
  onRequest: (input: Request) => Promise<Response> = async () => Response.json({ status: 200, message: "OK" }),
) {
  return createPathBasedClient<T, M>({
    ...options,
    baseUrl: options?.baseUrl || "https://fake-api.example", // Node.js requires a domain for Request(). This restriction doesn’t exist in browsers, but we are using `e2e.test.ts` for that..
    fetch: (input) => onRequest(input),
  });
}

describe("createPathBasedClient", () => {
  describe("path based client", () => {
    test("provides a PathBasedClient type", () => {
      const client = createObservedPathBasedClient<paths>();
      expectTypeOf(client).toEqualTypeOf<PathBasedClient<paths>>();
    });

    test("GET (no params)", async () => {
      let method = "";
      const client = createObservedPathBasedClient<paths>({}, async (req) => {
        method = req.method;
        return Response.json({});
      });
      await client["/posts"].GET();
      expect(method).toBe("GET");
    });

    test("GET (params)", async () => {
      let actualPathname = "";
      const client = createObservedPathBasedClient<paths>({}, async (req) => {
        actualPathname = new URL(req.url).pathname;
        return Response.json({ title: "Blog post title" });
      });

      // Wrong method
      // @ts-expect-error
      await client["/posts/{id}"].POST({
        params: {
          // Unknown property `path`.
          // @ts-expect-error
          path: {
            id: 123,
          },
        },
      });

      await client["/posts/{id}"].GET({
        params: {
          path: {
            // expect error on string instead of number.
            // @ts-expect-error
            id: "1234",
          },
        },
      });

      const { data, error } = await client["/posts/{id}"].GET({
        params: { path: { id: 123 } },
      });

      expect(actualPathname).toBe("/posts/123");

      // Check typing of data.
      if (error) {
        // Fail, but we need the if above for type inference.
        expect(error).toBeUndefined();
      } else {
        // @ts-expect-error
        data.not_a_blogpost_property;
        // Check typing of result value.
        expect(data.title).toBe("Blog post title");
      }
    });
  });
});
