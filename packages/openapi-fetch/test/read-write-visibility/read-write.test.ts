import type { $Read, Readable } from "openapi-typescript-helpers";
import { describe, expect, expectTypeOf, test } from "vitest";
import type { Client, MethodResponse } from "../../src/index.js";
import { createObservedClient } from "../helpers.js";
import type { paths } from "./schemas/read-write.js";

describe("readOnly/writeOnly", () => {
  describe("deeply nested $Read unwrapping through $Read<Object>", () => {
    test("$Read should continue recursion when unwrapping $Read<ObjectWithReadProperties>", async () => {
      // This tests the fix for a bug where Readable<$Read<U>> returned U directly
      // instead of Readable<U>, causing nested $Read markers to not be unwrapped.
      // Example: nested: $Read<NestedObject> where NestedObject contains
      // entries: $Read<Entry[]> - the inner $Read was not stripped.
      const client = createObservedClient<paths, `${string}/${string}`, true>({}, async () =>
        Response.json({
          id: 1,
          items: [
            {
              id: 1,
              nested: {
                entries: [{ code: "A1", label: "Label1" }],
              },
            },
          ],
        }),
      );

      const { data } = await client.GET("/resources/{id}", {
        params: { path: { id: 1 } },
      });

      // nested is $Read<NestedObject> - should be unwrapped
      // NestedObject.entries is $Read<Entry[]> - should ALSO be unwrapped
      // Entry.label is $Read<string> - should ALSO be unwrapped

      // This would fail before the fix: "Property '0' does not exist on type '$Read<Entry[]>'"
      const entries = data?.items[0]?.nested.entries;
      expect(entries?.[0]?.code).toBe("A1");

      // Type assertions to ensure proper unwrapping at all levels
      type EntriesType = NonNullable<typeof data>["items"][number]["nested"]["entries"];
      // Should be Entry[] (array), not $Read<Entry[]>
      expectTypeOf<EntriesType>().toMatchTypeOf<{ code: string; label: string }[]>();

      type LabelType = NonNullable<typeof data>["items"][number]["nested"]["entries"][number]["label"];
      // Should be string, not $Read<string>
      expectTypeOf<LabelType>().toEqualTypeOf<string>();
    });
  });

  describe("request body (POST)", () => {
    test("CANNOT include readOnly properties", async () => {
      const client = createObservedClient<paths, `${string}/${string}`, true>({});

      await client.POST("/users", {
        body: {
          // @ts-expect-error - id is readOnly, should NOT be allowed in request
          id: 123,
          name: "Alice",
          password: "secret",
        },
      });
    });

    test("CAN include writeOnly properties", async () => {
      const client = createObservedClient<paths, `${string}/${string}`, true>({});

      // No error - password (writeOnly) is allowed in request
      await client.POST("/users", {
        body: {
          name: "Alice",
          password: "secret",
        },
      });
    });

    test("CAN include normal properties", async () => {
      const client = createObservedClient<paths, `${string}/${string}`, true>({});

      // No error - name (normal) is allowed everywhere
      await client.POST("/users", {
        body: { name: "Alice" },
      });
    });
  });

  describe("response body (GET/POST response)", () => {
    test("CAN access readOnly properties", async () => {
      const client = createObservedClient<paths, `${string}/${string}`, true>({}, async () =>
        Response.json({ id: 1, name: "Alice" }),
      );

      const { data } = await client.GET("/users");
      // No error - id (readOnly) is available in response
      const id: number | undefined = data?.id;
      expect(id).toBe(1);
    });

    test("CANNOT access writeOnly properties", async () => {
      const client = createObservedClient<paths, `${string}/${string}`, true>({}, async () =>
        Response.json({ id: 1, name: "Alice" }),
      );

      const { data } = await client.GET("/users");
      // @ts-expect-error - password is writeOnly, should NOT be in response
      const password = data?.password;
      expect(password).toBeUndefined();
    });

    test("CAN access normal properties", async () => {
      const client = createObservedClient<paths, `${string}/${string}`, true>({}, async () =>
        Response.json({ id: 1, name: "Alice" }),
      );

      const { data } = await client.GET("/users");
      // No error - name (normal) is available everywhere
      const name: string | undefined = data?.name;
      expect(name).toBe("Alice");
    });
  });

  describe("markers opt-in (default: off)", () => {
    test("without Markers, $Read/$Write markers are NOT resolved", async () => {
      // Default createClient — Markers = false
      const client = createObservedClient<paths>({}, async () =>
        Response.json({ id: 1, name: "Alice", password: "secret" }),
      );

      const { data } = await client.GET("/users");
      // Without markers, $Write<string> is NOT stripped — password is accessible
      // (it's treated as a raw type, not resolved)
      const password = data?.password;
      expect(password).toBe("secret");
    });
  });

  describe("MethodResponse with Markers", () => {
    test("MethodResponse infers Markers from Client type", () => {
      // Verify that MethodResponse correctly infers Markers from a Client<..., true>
      type MarkerClient = Client<paths, `${string}/${string}`, true>;
      type Resp = MethodResponse<MarkerClient, "get", "/users">;
      // With Markers=true, id ($Read<number>) should be unwrapped to number
      expectTypeOf<Resp>().toHaveProperty("id");
      expectTypeOf<Resp>().toHaveProperty("name");
    });

    test("MethodResponse works with default (no Markers) client", () => {
      type DefaultClient = Client<paths>;
      type Resp = MethodResponse<DefaultClient, "get", "/users">;
      // Without markers, $Read/$Write are raw types — all properties present
      expectTypeOf<Resp>().toHaveProperty("name");
    });
  });

  describe("#2615: Readable preserves array types", () => {
    test("readonly arrays are not destructured into object types", () => {
      // Before fix: Readable<readonly string[]> fell through to `T extends object`,
      // producing { readonly [x: number]: string; length: number; ... } instead of an array
      expectTypeOf<Readable<readonly string[]>>().toEqualTypeOf<readonly string[]>();
    });

    test("mutable arrays remain mutable", () => {
      expectTypeOf<Readable<string[]>>().toEqualTypeOf<string[]>();
    });

    test("nested readonly arrays are preserved", () => {
      expectTypeOf<Readable<readonly { id: number }[]>>().toEqualTypeOf<readonly { id: number }[]>();
    });
  });

  describe("#2620: discriminated union narrowing", () => {
    test("narrowing preserved when markers disabled (default)", async () => {
      // The core fix: Readable<T> is no longer applied when Markers=false,
      // so the original discriminated union type identity is preserved and
      // TypeScript's control-flow narrowing works as expected.
      const client = createObservedClient<paths>({}, async () => Response.json({ type: "success", payload: "ok" }));

      const { data } = await client.GET("/events");
      if (data) {
        if (data.type === "success") {
          // Without Readable wrapping, narrowing works: 'payload' exists on SuccessEvent
          expectTypeOf(data.payload).toEqualTypeOf<string>();
          expect(data.payload).toBe("ok");
        }
      }
    });

    test("narrowing preserved with markers on non-marker union members", async () => {
      // When Markers=true but union members have no $Read/$Write markers,
      // Readable<T> recurses into the object branch but produces a structurally
      // identical type, preserving narrowing for simple discriminated unions.
      const client = createObservedClient<paths, `${string}/${string}`, true>({}, async () =>
        Response.json({ type: "error", message: "not found" }),
      );

      const { data } = await client.GET("/events");
      if (data) {
        if (data.type === "error") {
          expectTypeOf(data.message).toEqualTypeOf<string>();
          expect(data.message).toBe("not found");
        }
      }
    });

    test("narrowing preserved when union members contain $Read markers", () => {
      // Verify that Readable distributes over the union and unwraps $Read
      // while preserving the discriminant for control-flow narrowing.
      type MarkedUnion = { type: "success"; data: string; audit: $Read<string> } | { type: "error"; message: string };

      type Result = Readable<MarkedUnion>;

      // Use control-flow narrowing on the resolved type
      const value = {} as Result;
      if (value.type === "success") {
        expectTypeOf(value.data).toEqualTypeOf<string>();
        expectTypeOf(value.audit).toEqualTypeOf<string>();
      } else {
        expectTypeOf(value.message).toEqualTypeOf<string>();
      }
    });
  });
});
