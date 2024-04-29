import { fileURLToPath } from "node:url";
import { astToString } from "../../../src/lib/ts.js";
import transformSchemaObject from "../../../src/transform/schema-object.js";
import { DEFAULT_CTX, type TestCase } from "../../test-helpers.js";

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
        want: "string",
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
      "enum (UTF-8)",
      {
        given: { type: "string", enum: ["赤", "青", "緑"] },
        want: `"赤" | "青" | "緑"`,
        // options: DEFAULT_OPTIONS
      },
    ],
    [
      "enum (quotes)",
      {
        // prettier-ignore
        given: { type: "string", enum: ['"', "'", '"', "`"] },
        want: `"\\"" | "'" | "\\"" | "\`"`,
      },
    ],
    [
      "nullable",
      {
        given: { type: ["string", "null"] },
        want: "string | null",
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "nullable (deprecated syntax)",
      {
        given: { type: "string", nullable: true },
        want: "string | null",
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "enum + nullable",
      {
        given: { type: ["string", "null"], enum: ["A", "B", "C"] },
        want: '"A" | "B" | "C" | null',
      },
    ],
    [
      "enum + nullable (deprecated syntax)",
      {
        given: { type: "string", enum: ["A", "B", "C"], nullable: true },
        want: '"A" | "B" | "C" | null',
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
