import { fileURLToPath } from "node:url";
import { astToString } from "../../../src/lib/ts.js";
import transformSchemaObject from "../../../src/transform/schema-object.js";
import { DEFAULT_CTX, type TestCase } from "../../test-helpers.js";

const DEFAULT_OPTIONS = {
  path: "#/components/schemas/schema-object",
  ctx: { ...DEFAULT_CTX },
};

describe("transformSchemaObject > number", () => {
  const tests: TestCase[] = [
    [
      "basic",
      {
        given: { type: "number" },
        want: "number",
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "enum",
      {
        given: { type: "number", enum: [-50, 50, 100, 200] },
        want: "-50 | 50 | 100 | 200",
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "integer",
      {
        given: { type: "integer" },
        want: "number",
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "nullable",
      {
        given: { type: ["number", "null"] },
        want: "number | null",
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "nullable (deprecated syntax)",
      {
        given: { type: "number", nullable: true },
        want: "number | null",
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
