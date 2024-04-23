import { fileURLToPath } from "node:url";
import { astToString } from "../../../src/lib/ts.js";
import transformSchemaObject from "../../../src/transform/schema-object.js";
import { DEFAULT_CTX, type TestCase } from "../../test-helpers.js";

const DEFAULT_OPTIONS = {
  path: "#/components/schemas/schema-object",
  ctx: { ...DEFAULT_CTX },
};

describe("transformSchemaObject > boolean", () => {
  const tests: TestCase[] = [
    [
      "basic",
      {
        given: { type: "boolean" },
        want: "boolean",
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "enum",
      {
        given: { type: "boolean", enum: [false] },
        want: "false",
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "nullable",
      {
        given: { type: ["boolean", "null"] },
        want: "boolean | null",
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "nullable (deprecated syntax)",
      {
        given: { type: "boolean", nullable: true },
        want: "boolean | null",
        // options: DEFAULT_OPTIONS,
      },
    ],
  ];

  for (const [testName, { given, want, options = DEFAULT_OPTIONS, ci }] of tests) {
    test.skipIf(ci?.skipIf)(
      testName,
      async () => {
        const result = astToString(transformSchemaObject(given, options));
        if (want instanceof URL) {
          expect(result).toMatchFileSnapshot(fileURLToPath(want));
        } else {
          expect(result).toBe(`${want}\n`);
        }
      },
      ci?.timeout,
    );
  }
});
