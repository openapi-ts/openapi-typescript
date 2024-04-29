import { fileURLToPath } from "node:url";
import { astToString } from "../../../src/lib/ts.js";
import transformSchemaObject from "../../../src/transform/schema-object.js";
import { DEFAULT_CTX, type TestCase } from "../../test-helpers.js";

const DEFAULT_OPTIONS = {
  path: "#/components/schemas/schema-object",
  ctx: { ...DEFAULT_CTX },
};

describe("transformSchemaObject > array", () => {
  const tests: TestCase[] = [
    [
      "basic",
      {
        given: { type: "array", items: { type: "string" } },
        want: "string[]",
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "tuple > tuple items",
      {
        given: {
          type: "array",
          items: [{ type: "string" }, { type: "number" }],
          minItems: 2,
          maxItems: 2,
        },
        want: `[
    string,
    number
]`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "tuple > prefixItems",
      {
        given: {
          type: "array",
          items: { type: "number" },
          prefixItems: [{ type: "number" }, { type: "number" }, { type: "number" }],
        },
        want: `[
    number,
    number,
    number
]`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "ref",
      {
        given: {
          type: "array",
          items: { $ref: "#/components/schemas/ArrayItem" },
        },
        want: `components["schemas"]["ArrayItem"][]`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "nullable",
      {
        given: { type: ["array", "null"], items: { type: "string" } },
        want: "string[] | null",
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "nullable (deprecated syntax)",
      {
        given: { type: "array", items: { type: "string" }, nullable: true },
        want: "string[] | null",
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "nullable items",
      {
        given: { type: "array", items: { type: ["string", "null"] } },
        want: "(string | null)[]",
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "nullable items (deprecated syntax)",
      {
        given: { type: "array", items: { type: "string", nullable: true } },
        want: "(string | null)[]",
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "options > arrayLength: true > default",
      {
        given: { type: "array", items: { type: "string" } },
        want: "string[]",
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx, arrayLength: true },
        },
      },
    ],
    [
      "options > arrayLength: true > minItems: 1",
      {
        given: { type: "array", items: { type: "string" }, minItems: 1 },
        want: `[
    string,
    ...string[]
]`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx, arrayLength: true },
        },
      },
    ],
    [
      "options > arrayLength: true > maxItems: 2",
      {
        given: { type: "array", items: { type: "string" }, maxItems: 2 },
        want: `[
] | [
    string
] | [
    string,
    string
]`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx, arrayLength: true },
        },
      },
    ],
    [
      "options > arrayLength: true > maxItems: 20",
      {
        given: { type: "array", items: { type: "string" }, maxItems: 20 },
        want: "string[]",
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx, arrayLength: true },
        },
      },
    ],
    [
      "options > immutable: true",
      {
        given: {
          type: "array",
          items: { type: "string" },
        },
        want: "readonly string[]",
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx, immutable: true },
        },
      },
    ],
    [
      "options > immutable: true (tuple)",
      {
        given: {
          type: "array",
          items: { type: "number" },
          prefixItems: [{ type: "number" }, { type: "number" }, { type: "number" }],
        },
        want: `readonly [
    number,
    number,
    number
]`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx, immutable: true },
        },
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
