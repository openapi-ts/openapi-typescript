import { assertType, describe, expect, test } from "vitest";
import type { components, paths } from "../common/schemas/common.js";
import { createObservedClient } from "../helpers.js";

// Perform some basic type tests
// but with `strictNullChecks` disabled in tsconfig.json

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
        // @ts-expect-error: FIXME: data is undefined for strictNullChecks: false
        assertType<undefined>(data);
      }
    });
  });
});
