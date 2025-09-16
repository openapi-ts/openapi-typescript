import { assertType, describe, expect, expectTypeOf, test } from "vitest";
import type { MethodResponse } from "../../src/index.js";
import { createObservedClient } from "../helpers.js";
import type { components, paths } from "./schemas/common.js";

type Resource = components["schemas"]["Resource"];
type Error = components["schemas"]["Error"];

describe("response", () => {
  describe("data/error", () => {
    test("valid path", async () => {
      const client = createObservedClient<paths>();

      const result = await client.GET("/resources");

      // 1. assert data & error may be undefined initially
      assertType<Resource[] | undefined>(result.data);
      assertType<Error | undefined>(result.error);

      // 2. assert data is not undefined inside condition block
      if (result.data) {
        assertType<NonNullable<Resource[]>>(result.data);
        assertType<undefined>(result.error);
      }
      // 2b. inverse should work, too
      if (!result.error) {
        assertType<NonNullable<Resource[]>>(result.data);
        assertType<undefined>(result.error);
      }

      // 3. assert error is not undefined inside condition block
      if (result.error) {
        assertType<undefined>(result.data);
        assertType<NonNullable<Error>>(result.error);
      }
      // 3b. inverse should work, too
      if (!result.data) {
        assertType<undefined>(result.data);
        assertType<NonNullable<Error>>(result.error);
      }
    });

    test("invalid path", async () => {
      const client = createObservedClient<paths>();

      const result = await client.GET(
        // @ts-expect-error this should throw an error
        "/not-a-real-path",
        {},
      );

      //@ts-expect-error impossible to determine data type for invalid path
      assertType<never>(result.data);
      assertType<undefined>(result.error);
    });

    test("returns union for mismatched response", async () => {
      const client = createObservedClient<paths>();
      const result = await client.GET("/mismatched-response");
      if (result.data) {
        expectTypeOf(result.data).toEqualTypeOf<Resource | Resource[]>();
      } else {
        expectTypeOf(result.error).extract<{ code: number }>().toEqualTypeOf<{ code: number; message: string }>();
        expectTypeOf(result.error).exclude<{ code: number }>().toEqualTypeOf<never>();
      }
    });

    test("returns union for mismatched errors", async () => {
      const client = createObservedClient<paths>();
      const result = await client.GET("/mismatched-errors");
      if (result.data) {
        expectTypeOf(result.data).toEqualTypeOf<Resource>();
        expectTypeOf(result.data).toEqualTypeOf<MethodResponse<typeof client, "get", "/mismatched-errors">>();
      } else {
        expectTypeOf(result.data).toBeUndefined();
        expectTypeOf(result.error).extract<{ code: number }>().toEqualTypeOf<{ code: number; message: string }>();
        expectTypeOf(result.error).exclude<{ code: number }>().toEqualTypeOf(undefined);
      }
    });

    describe("media union", () => {
      const client = createObservedClient<paths>();

      // ⚠️ Warning: DO NOT iterate over type tests! Deduplicating runtime tests
      // is good. But these do not test runtime.
      test("application/json", async () => {
        const { data } = await client.GET("/media-json");
        assertType<Resource[] | undefined>(data);
      });

      test("application/vnd.api+json", async () => {
        const { data } = await client.GET("/media-vnd-json");
        assertType<Resource[] | undefined>(data);
      });

      test("text/html", async () => {
        const { data } = await client.GET("/media-text");
        assertType<string | undefined>(data);
      });

      test("multiple", async () => {
        const { data } = await client.GET("/media-multiple");
        assertType<{ foo: string } | { bar: string } | { baz: string } | string | undefined>(data);
      });

      test("invalid", async () => {
        const { data } = await client.GET(
          // @ts-expect-error not a real path
          "/invalid",
          {},
        );
        assertType<unknown>(data);
      });
    });

    test("`default` is an error", async () => {
      const client = createObservedClient<paths>({ headers: { "Cache-Control": "max-age=10000000" } }, async () =>
        Response.json({ code: 500, message: "An unexpected error occurred" }, { status: 500 }),
      );

      const { error } = await client.GET("/error-default");
      if (error) {
        assertType<Error>(error);
      }
    });
  });

  describe("response object", () => {
    test.each([200, 404, 500] as const)("%s", async (status) => {
      const client = createObservedClient<paths>({}, async (req) =>
        Response.json({ status, message: "OK" }, { status }),
      );
      const result = await client.GET(status === 200 ? "/resources" : `/error-${status}`);
      expect(result.response.status).toBe(status);
    });
  });

  describe("parseAs", () => {
    const client = createObservedClient<paths>({}, async () => Response.json({}));

    test("text", async () => {
      const { data, error } = (await client.GET("/resources", {
        parseAs: "text",
      })) satisfies { data?: string };
      if (error) {
        throw new Error("parseAs text: error");
      }
      expect(data).toBe("{}");
    });

    test("arrayBuffer", async () => {
      const { data, error } = (await client.GET("/resources", {
        parseAs: "arrayBuffer",
      })) satisfies { data?: ArrayBuffer };
      if (error) {
        throw new Error("parseAs arrayBuffer: error");
      }
      expect(data.byteLength).toBe("{}".length);
    });

    test("blob", async () => {
      const { data, error } = (await client.GET("/resources", {
        parseAs: "blob",
      })) satisfies { data?: Blob };
      if (error) {
        throw new Error("parseAs blob: error");
      }
      expect(data.constructor.name).toBe("Blob");
    });

    test("stream", async () => {
      const { data } = (await client.GET("/resources", {
        parseAs: "stream",
      })) satisfies { data?: ReadableStream<Uint8Array> | null };
      if (!data) {
        throw new Error("parseAs stream: error");
      }

      expect(data).toBeInstanceOf(ReadableStream);
      const reader = data.getReader();
      const result = await reader.read();
      expect(result.value?.length).toBe(2);
    });

    test("use the selected content", async () => {
      const client = createObservedClient<paths, "application/ld+json">({}, async () => Response.json({ bar: "bar" }));
      const { data } = await client.GET("/media-multiple", {
        headers: { Accept: "application/ld+json" },
      });
      if (data) {
        assertType<{ bar: string }>(data);
      }
    });
  });
});
