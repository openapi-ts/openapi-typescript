import { describe, expect, expectTypeOf, test } from "vitest";
import { createObservedClient } from "../helpers.js";
import type { paths } from "./schemas/read-write.js";

describe("readOnly/writeOnly", () => {
  describe("deeply nested $Read unwrapping through $Read<Object>", () => {
    test("$Read should continue recursion when unwrapping $Read<ObjectWithReadProperties>", async () => {
      // This tests the fix for a bug where Readable<$Read<U>> returned U directly
      // instead of Readable<U>, causing nested $Read markers to not be unwrapped.
      // Example: nested: $Read<NestedObject> where NestedObject contains
      // entries: $Read<Entry[]> - the inner $Read was not stripped.
      const client = createObservedClient<paths>({}, async () =>
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
      const client = createObservedClient<paths>({});

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
      const client = createObservedClient<paths>({});

      // No error - password (writeOnly) is allowed in request
      await client.POST("/users", {
        body: {
          name: "Alice",
          password: "secret",
        },
      });
    });

    test("CAN include normal properties", async () => {
      const client = createObservedClient<paths>({});

      // No error - name (normal) is allowed everywhere
      await client.POST("/users", {
        body: { name: "Alice" },
      });
    });
  });

  describe("response body (GET/POST response)", () => {
    test("CAN access readOnly properties", async () => {
      const client = createObservedClient<paths>({}, async () => Response.json({ id: 1, name: "Alice" }));

      const { data } = await client.GET("/users");
      // No error - id (readOnly) is available in response
      const id: number | undefined = data?.id;
      expect(id).toBe(1);
    });

    test("CANNOT access writeOnly properties", async () => {
      const client = createObservedClient<paths>({}, async () => Response.json({ id: 1, name: "Alice" }));

      const { data } = await client.GET("/users");
      // @ts-expect-error - password is writeOnly, should NOT be in response
      const password = data?.password;
      expect(password).toBeUndefined();
    });

    test("CAN access normal properties", async () => {
      const client = createObservedClient<paths>({}, async () => Response.json({ id: 1, name: "Alice" }));

      const { data } = await client.GET("/users");
      // No error - name (normal) is available everywhere
      const name: string | undefined = data?.name;
      expect(name).toBe("Alice");
    });
  });
});
