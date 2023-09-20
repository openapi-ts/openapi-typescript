import { astToString } from "../../../src/lib/ts.js";
import transformSchemaObject from "../../../src/transform/schema-object.js";
import { DEFAULT_CTX, TestCase } from "../../test-helpers.js";

const DEFAULT_OPTIONS = {
  path: "#/components/schemas/schema-object",
  ctx: { ...DEFAULT_CTX },
};

describe("transformSchemaObject > string", () => {
  const tests: TestCase[] = [
    [
      "basic",
      {
        given: { type: "string" },
        want: `string`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "enum",
      {
        given: { type: "string", enum: ["blue", "green", "yellow", ""] },
        want: `"blue" | "green" | "yellow" | ""`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "enum (inferred)",
      {
        given: { properties: { status: { enum: ["complete", "incomplete"] } } },
        want: `{
    /** @enum {unknown} */
    status?: "complete" | "incomplete";
}`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "enum (whitespace)",
      {
        given: { type: "string", enum: [" blue", "green ", " ", ""] },
        want: `" blue" | "green " | " " | ""`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "nullable",
      {
        given: { type: ["string", "null"] },
        want: `string | null`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "nullable (deprecated syntax)",
      {
        given: { type: "string", nullable: true },
        want: `string | null`,
        // options: DEFAULT_OPTIONS,
      },
    ],
  ];

  test.each(tests)("%s", (_, { given, want, options = DEFAULT_OPTIONS }) => {
    const ast = transformSchemaObject(given, options);
    expect(astToString(ast).trim()).toBe(want.trim());
  });
});
