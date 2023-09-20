import { astToString } from "../../../src/lib/ts.js";
import transformSchemaObject from "../../../src/transform/schema-object.js";
import { DEFAULT_CTX, TestCase } from "../../test-helpers.js";

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
        want: `number`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "enum",
      {
        given: { type: "number", enum: [50, 100, 200] },
        want: `50 | 100 | 200`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "integer",
      {
        given: { type: "integer" },
        want: `number`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "nullable",
      {
        given: { type: ["number", "null"] },
        want: `number | null`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "nullable (deprecated syntax)",
      {
        given: { type: "number", nullable: true },
        want: `number | null`,
        // options: DEFAULT_OPTIONS,
      },
    ],
  ];

  test.each(tests)("%s", (_, { given, want, options = DEFAULT_OPTIONS }) => {
    const ast = transformSchemaObject(given, options);
    expect(astToString(ast).trim()).toBe(want.trim());
  });
});
