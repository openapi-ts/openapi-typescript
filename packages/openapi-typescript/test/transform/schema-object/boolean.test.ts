import { astToString } from "../../../src/lib/ts.js";
import transformSchemaObject from "../../../src/transform/schema-object.js";
import { DEFAULT_CTX, TestCase } from "../../test-helpers.js";

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
        want: `boolean`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "enum",
      {
        given: { type: "boolean", enum: [false] },
        want: `false`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "nullable",
      {
        given: { type: ["boolean", "null"] },
        want: `boolean | null`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "nullable (deprecated syntax)",
      {
        given: { type: "boolean", nullable: true },
        want: `boolean | null`,
        // options: DEFAULT_OPTIONS,
      },
    ],
  ];

  test.each(tests)("%s", (_, { given, want, options = DEFAULT_OPTIONS }) => {
    const ast = transformSchemaObject(given, options);
    expect(astToString(ast).trim()).toBe(want.trim());
  });
});
