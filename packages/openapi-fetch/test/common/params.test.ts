import { assertType, describe, expect, test } from "vitest";
import { createObservedClient } from "../helpers.js";
import type { QuerySerializerOptions } from "../../src/index.js";
import type { components, paths } from "./schemas/common.js";

type Resource = components["schemas"]["Resource"];

const resource1: Resource = { id: 123 };
const resource2: Resource = { id: 456 };
const resource3: Resource = { id: 789 };

describe("params", () => {
  describe("path", () => {
    test("typechecks", async () => {
      const client = createObservedClient<paths>({}, async (req) => {
        const found = [resource1, resource2, resource3].find(
          (post) => String(post.id) === req.url.split("/resources/")[1],
        );
        return found ? Response.json(found) : Response.json({ code: 404, message: "Not found" }, { status: 404 });
      });

      // assert missing options throws error
      await client
        // @ts-expect-error
        .GET("/resources/{id}");

      // assert missing options.params throws error
      await client
        // @ts-expect-error
        .GET("/resources/{id}", {});

      // assert missing path params throws error
      await client.GET("/resources/{id}", {
        // @ts-expect-error
        params: {},
      });

      // assert empty paths object throws error
      await client.GET("/resources/{id}", {
        params: {
          // @ts-expect-error
          path: {},
        },
      });

      // assert right name, mismatched type throws error
      await client.GET("/resources/{id}", {
        params: {
          path: {
            // @ts-expect-error
            id: "123",
          },
        },
      });

      // assert right name, right type passes
      const result = await client.GET("/resources/{id}", { params: { path: { id: 456 } } });
      expect(result.data).toEqual(resource2);
    });

    test("typechecks (empty path params)", async () => {
      const client = createObservedClient<paths>({}, async () => Response.json([resource1, resource2, resource3]));

      // assert unneeded path params throws type error
      await client.GET("/resources", {
        params: {
          // @ts-expect-error
          path: { id: 123 },
        },
      });

      // assert even empty objects throw type error
      await client.GET("/resources", {
        params: {
          // @ts-expect-error
          path: {},
        },
      });

      const { data } = await client.GET("/resources");

      // assert data matches expected type
      if (data) {
        assertType<Resource[]>(data);
        expect(data).toEqual([resource1, resource2, resource3]); // also test runtime, too
      } else {
        // note: even though this is not a reachable code path, type tests still work!
        assertType<undefined>(data);
      }
    });

    test("serializes", async () => {
      const baseUrl = "https://fakeurl.example";
      let actualPathname = "";
      const client = createObservedClient<paths>({ baseUrl }, async (req) => {
        actualPathname = new URL(req.url).pathname;
        return Response.json({});
      });

      await client.GET(
        "/path-params/{simple_primitive}/{simple_obj_flat}/{simple_arr_flat}/{simple_obj_explode*}/{simple_arr_explode*}/{.label_primitive}/{.label_obj_flat}/{.label_arr_flat}/{.label_obj_explode*}/{.label_arr_explode*}/{;matrix_primitive}/{;matrix_obj_flat}/{;matrix_arr_flat}/{;matrix_obj_explode*}/{;matrix_arr_explode*}",
        {
          params: {
            path: {
              simple_primitive: "simple",
              simple_obj_flat: { a: "b", c: "d" },
              simple_arr_flat: [1, 2, 3],
              simple_obj_explode: { e: "f", g: "h" },
              simple_arr_explode: [4, 5, 6],
              label_primitive: "label",
              label_obj_flat: { a: "b", c: "d" },
              label_arr_flat: [1, 2, 3],
              label_obj_explode: { e: "f", g: "h" },
              label_arr_explode: [4, 5, 6],
              matrix_primitive: "matrix",
              matrix_obj_flat: { a: "b", c: "d" },
              matrix_arr_flat: [1, 2, 3],
              matrix_obj_explode: { e: "f", g: "h" },
              matrix_arr_explode: [4, 5, 6],
            },
          },
        },
      );

      expect(actualPathname).toBe(
        `/path-params/${[
          // simple
          "simple",
          "a,b,c,d",
          "1,2,3",
          "e=f,g=h",
          "4,5,6",
          // label
          ".label",
          ".a,b,c,d",
          ".1,2,3",
          ".e=f.g=h",
          ".4.5.6",
          // matrix
          ";matrix_primitive=matrix",
          ";matrix_obj_flat=a,b,c,d",
          ";matrix_arr_flat=1,2,3",
          ";e=f;g=h",
          ";matrix_arr_explode=4;matrix_arr_explode=5;matrix_arr_explode=6",
        ].join("/")}`,
      );
    });

    test("escapes reserved characters in path segment", async () => {
      let actualPathname = "";
      const client = createObservedClient<paths>({}, async (req) => {
        actualPathname = new URL(req.url).pathname;
        return Response.json({ success: true });
      });

      await client.GET("/path-params/{string}", {
        params: { path: { string: ";/?:@&=+$,# " } },
      });

      // expect post_id to be encoded properly
      expect(actualPathname).toBe("/path-params/%3B%2F%3F%3A%40%26%3D%2B%24%2C%23%20");
    });

    test("does not escape allowed characters in path segment", async () => {
      let actualPathname = "";
      const client = createObservedClient<paths>({}, async (req) => {
        actualPathname = new URL(req.url).pathname;
        return Response.json({ success: true });
      });

      const value = "aAzZ09-_.!~*'()";

      await client.GET("/path-params/{string}", {
        params: { path: { string: value } },
      });

      // expect post_id to stay unchanged
      expect(actualPathname).toBe(`/path-params/${value}`);
    });

    test("allows UTF-8 characters", async () => {
      let actualPathname = "";
      const client = createObservedClient<paths>({}, async (req) => {
        actualPathname = new URL(req.url).pathname;
        return Response.json({ success: true });
      });
      await client.GET("/path-params/{string}", {
        params: { path: { string: "🥴" } },
      });

      // expect post_id to be encoded properly
      expect(actualPathname).toBe("/path-params/%F0%9F%A5%B4");
    });
  });

  describe("header", () => {
    test("per-request", async () => {
      const client = createObservedClient<paths>({}, async (req) => {
        const header = req.headers.get("x-required-header");
        if (header !== "correct") {
          return Response.json({ code: 500, message: "missing correct header" }, { status: 500 });
        }
        return Response.json({ status: header }, { status: 200, headers: req.headers });
      });

      // expect error on missing header
      // @ts-expect-error
      await client.GET("/header-params");

      // expect error on incorrect header
      await client.GET("/header-params", {
        // @ts-expect-error
        params: { header: { foo: "bar" } },
      });

      // expect error on mismatched type
      await client.GET("/header-params", {
        // @ts-expect-error
        params: { header: { "x-required-header": true } },
      });

      // (no error)
      const response = await client.GET("/header-params", {
        params: { header: { "x-required-header": "correct" } },
      });

      // expect param passed correctly
      expect(response.response.headers.get("x-required-header")).toBe("correct");
    });
  });

  describe("query", () => {
    describe("querySerializer", () => {
      test("primitives", async () => {
        let actualURL = new URL("https://fakeurl.example");
        const client = createObservedClient<paths>({}, async (req) => {
          actualURL = new URL(req.url);
          return Response.json({});
        });

        await client.GET("/query-params", {
          params: {
            query: { string: "string", number: 0, boolean: false },
          },
        });

        expect(actualURL.search).toBe("?string=string&number=0&boolean=false");
      });

      test("array params (empty)", async () => {
        let actualURL = new URL("https://fakeurl.example");
        const client = createObservedClient<paths>({}, async (req) => {
          actualURL = new URL(req.url);
          return Response.json({});
        });

        await client.GET("/query-params", {
          params: {
            query: { array: [] },
          },
        });

        expect(actualURL.pathname).toBe("/query-params");
        expect(actualURL.search).toBe("");
      });

      test("array params (empty, multiple)", async () => {
        let actualURL = new URL("https://fakeurl.example");
        const client = createObservedClient<paths>({}, async (req) => {
          actualURL = new URL(req.url);
          return Response.json({});
        });

        await client.GET("/query-params", {
          params: {
            query: { array: [], second_array: [], third_array: [] },
          },
        });

        expect(actualURL.pathname).toBe("/query-params");
        expect(actualURL.search).toBe("");
      });

      test("empty/null params", async () => {
        let actualURL = new URL("https://fakeurl.example");
        const client = createObservedClient<paths>({}, async (req) => {
          actualURL = new URL(req.url);
          return Response.json({});
        });

        await client.GET("/query-params", {
          params: {
            query: { string: undefined, number: null as any },
          },
        });

        expect(actualURL.pathname).toBe("/query-params");
        expect(actualURL.search).toBe("");
      });

      describe("array", () => {
        test.each([
          [
            "form",
            {
              given: { style: "form", explode: false },
              want: "array=1,2,3&boolean=true",
            },
          ],
          [
            "form (explode)",
            {
              given: { style: "form", explode: true },
              want: "array=1&array=2&array=3&boolean=true",
            },
          ],
          [
            "spaceDelimited",
            {
              given: { style: "spaceDelimited", explode: false },
              want: "array=1%202%203&boolean=true",
            },
          ],
          [
            "spaceDelimited (explode)",
            {
              given: { style: "spaceDelimited", explode: true },
              want: "array=1&array=2&array=3&boolean=true",
            },
          ],
          [
            "pipeDelimited",
            {
              given: { style: "pipeDelimited", explode: false },
              want: "array=1|2|3&boolean=true",
            },
          ],
          [
            "pipeDelimited (explode)",
            {
              given: { style: "pipeDelimited", explode: true },
              want: "array=1&array=2&array=3&boolean=true",
            },
          ],
        ] as [
          string,
          {
            given: NonNullable<QuerySerializerOptions["array"]>;
            want: string;
          },
        ][])("%s", async (_, { given, want }) => {
          let actualURL = new URL("https://fakeurl.example");
          const client = createObservedClient<paths>(
            {
              querySerializer: { array: given },
            },
            async (req) => {
              actualURL = new URL(req.url);
              return Response.json({});
            },
          );

          await client.GET("/query-params", {
            params: {
              query: { array: ["1", "2", "3"], boolean: true },
            },
          });

          // skip leading '?'
          expect(actualURL.search.substring(1)).toBe(want);
        });
      });

      describe("object", () => {
        test.each([
          [
            "form",
            {
              given: { style: "form", explode: false },
              want: "object=foo,bar,bar,baz&boolean=true",
            },
          ],
          [
            "form (explode)",
            {
              given: { style: "form", explode: true },
              want: "foo=bar&bar=baz&boolean=true",
            },
          ],
          [
            "deepObject",
            {
              given: { style: "deepObject", explode: false }, // note: `false` not supported; same as `true`
              want: "object[foo]=bar&object[bar]=baz&boolean=true",
            },
          ],
          [
            "deepObject (explode)",
            {
              given: { style: "deepObject", explode: true },
              want: "object[foo]=bar&object[bar]=baz&boolean=true",
            },
          ],
        ] as [
          string,
          {
            given: NonNullable<QuerySerializerOptions["object"]>;
            want: string;
          },
        ][])("%s", async (_, { given, want }) => {
          let actualURL = new URL("https://fakeurl.example");
          const client = createObservedClient<paths>(
            {
              querySerializer: { object: given },
            },
            async (req) => {
              actualURL = new URL(req.url);
              return Response.json({});
            },
          );

          await client.GET("/query-params", {
            params: {
              query: { object: { foo: "bar", bar: "baz" }, boolean: true },
            },
          });

          // skip leading '?'
          expect(actualURL.search.substring(1)).toBe(want);
        });
      });

      test("allowReserved", async () => {
        let actualURL = new URL("https://fakeurl.example");
        const client = createObservedClient<paths>(
          {
            querySerializer: { allowReserved: true },
          },
          async (req) => {
            actualURL = new URL(req.url);
            return Response.json({});
          },
        );

        await client.GET("/query-params", {
          params: {
            query: {
              string: "bad/character🐶",
            },
          },
        });

        expect(actualURL.search).toBe("?string=bad/character%F0%9F%90%B6");
        expect(actualURL.searchParams.get("string")).toBe("bad/character🐶");

        await client.GET("/query-params", {
          params: {
            query: {
              string: "bad/character🐶",
            },
          },
          querySerializer: {
            allowReserved: false,
          },
        });

        expect(actualURL.search).toBe("?string=bad%2Fcharacter%F0%9F%90%B6");
        expect(actualURL.searchParams.get("string")).toBe("bad/character🐶");
      });

      describe("function", () => {
        test("global default", async () => {
          let actualURL = new URL("https://fakeurl.example");
          const client = createObservedClient<paths>(
            {
              querySerializer: (q) => `alpha=${q.version}&beta=${q.format}`,
            },
            async (req) => {
              actualURL = new URL(req.url);
              return Response.json({});
            },
          );

          await client.GET("/resources/{id}", {
            params: {
              path: { id: 123 },
              query: { version: 2, format: "json" },
            },
          });

          expect(`${actualURL.pathname}${actualURL.search}`).toBe("/resources/123?alpha=2&beta=json");
        });

        test("per-request", async () => {
          let actualURL = new URL("https://fakeurl.example");
          const client = createObservedClient<paths>(
            {
              querySerializer: () => "query",
            },
            async (req) => {
              actualURL = new URL(req.url);
              return Response.json({});
            },
          );

          await client.GET("/resources/{id}", {
            params: {
              path: { id: 456 },
              query: { version: 2, format: "json" },
            },
            querySerializer: (q) => `alpha=${q.version}&beta=${q.format}`,
          });

          expect(`${actualURL.pathname}${actualURL.search}`).toBe("/resources/456?alpha=2&beta=json");
        });
      });

      test("ignores leading ? characters", async () => {
        let actualURL = new URL("https://fakeurl.example");
        const client = createObservedClient<paths>(
          {
            querySerializer: () => "?query",
          },
          async (req) => {
            actualURL = new URL(req.url);
            return Response.json({});
          },
        );
        await client.GET("/resources/{id}", {
          params: {
            path: { id: 789 },
            query: { version: 2, format: "json" },
          },
        });
        expect(`${actualURL.pathname}${actualURL.search}`).toBe("/resources/789?query");
      });
    });
  });
});
