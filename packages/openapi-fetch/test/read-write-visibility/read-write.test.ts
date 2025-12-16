import { describe, expect, test } from "vitest";
import { createObservedClient } from "../helpers.js";
import type { paths } from "./schemas/read-write.js";

describe("readOnly/writeOnly", () => {
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
