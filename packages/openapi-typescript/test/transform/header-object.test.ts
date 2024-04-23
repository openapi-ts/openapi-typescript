import { fileURLToPath } from "node:url";
import { astToString } from "../../src/lib/ts.js";
import transformHeaderObject from "../../src/transform/header-object.js";
import { DEFAULT_CTX, type TestCase } from "../test-helpers.js";

const DEFAULT_OPTIONS = {
  path: "#/components/headers/header-object",
  ctx: { ...DEFAULT_CTX },
};

describe("transformHeaderObject", () => {
  const tests: TestCase[] = [
    [
      "basic",
      {
        given: {
          description: "Auth",
          schema: {
            type: "string",
          },
        },
        want: "string",
        // options: DEFAULT_OPTIONS,
      },
    ],
  ];

  for (const [testName, { given, want, options = DEFAULT_OPTIONS, ci }] of tests) {
    test.skipIf(ci?.skipIf)(testName, async () => {
      const result = astToString(transformHeaderObject(given, options));
      if (want instanceof URL) {
        expect(result).toMatchFileSnapshot(fileURLToPath(want));
      } else {
        expect(result).toBe(`${want}\n`);
      }
    });
  }
});
