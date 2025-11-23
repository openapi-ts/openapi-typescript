import { fileURLToPath } from "node:url";
import { astToString } from "../../src/lib/ts.js";
import transformPathsObject from "../../src/transform/paths-object.js";
import type { GlobalContext } from "../../src/types.js";
import { DEFAULT_CTX, type TestCase } from "../test-helpers.js";

const DEFAULT_OPTIONS = DEFAULT_CTX;

describe("parametersWithDefaults", () => {
  const tests: TestCase<any, GlobalContext>[] = [
    [
      "options > default",
      {
        given: {
          "/api/{version}/user/{user_id}": {
            parameters: [
              { in: "query", name: "no_default", required: false, schema: { type: "number" } },
              { in: "query", name: "with_default", required: false, schema: { type: "number", default: 1337 } },
            ],
          },
        },
        want: `{
    "/api/{version}/user/{user_id}": {
        parameters: {
            query?: {
                no_default?: number;
                with_default?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}`,
        options: {
          ...DEFAULT_OPTIONS,
        },
      },
    ],
    [
      "options > makeParametersWithDefaultNotUndefined: true",
      {
        given: {
          "/api/{version}/user/{user_id}": {
            parameters: [
              { in: "query", name: "no_default", required: false, schema: { type: "number" } },
              { in: "query", name: "with_default", required: false, schema: { type: "number", default: 1337 } },
            ],
          },
        },
        want: `{
    "/api/{version}/user/{user_id}": {
        parameters: {
            query: {
                no_default?: number;
                with_default: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}`,
        options: {
          ...DEFAULT_OPTIONS,
          makeParametersWithDefaultNotUndefined: true,
        },
      },
    ],
  ];

  for (const [testName, { given, want, options = DEFAULT_OPTIONS, ci }] of tests) {
    test.skipIf(ci?.skipIf)(
      testName,
      async () => {
        const result = astToString(transformPathsObject(given, options));
        if (want instanceof URL) {
          await expect(result).toMatchFileSnapshot(fileURLToPath(want));
        } else {
          expect(result).toBe(`${want}\n`);
        }
      },
      ci?.timeout,
    );
  }
});
