import { astToString } from "../../../src/lib/ts.js";
import transformSchemaObject from "../../../src/transform/schema-object.js";
import { DEFAULT_CTX, TestCase } from "../../test-helpers.js";

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
        want: `string[]`,
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
          prefixItems: [
            { type: "number" },
            { type: "number" },
            { type: "number" },
          ],
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
        want: `string[] | null`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "nullable (deprecated syntax)",
      {
        given: { type: "array", items: { type: "string" }, nullable: true },
        want: `string[] | null`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "nullable items",
      {
        given: { type: "array", items: { type: ["string", "null"] } },
        want: `(string | null)[]`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "nullable items (deprecated syntax)",
      {
        given: { type: "array", items: { type: "string", nullable: true } },
        want: `(string | null)[]`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "options > supportArrayLength: true > default",
      {
        given: { type: "array", items: { type: "string" } },
        want: `string[]`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx, supportArrayLength: true },
        },
      },
    ],
    [
      "options > supportArrayLength: true > minItems: 1",
      {
        given: { type: "array", items: { type: "string" }, minItems: 1 },
        want: `[
    string,
    ...string[]
]`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx, supportArrayLength: true },
        },
      },
    ],
    [
      "options > supportArrayLength: true > maxItems: 2",
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
          ctx: { ...DEFAULT_OPTIONS.ctx, supportArrayLength: true },
        },
      },
    ],
    [
      "options > supportArrayLength: true > maxItems: 20",
      {
        given: { type: "array", items: { type: "string" }, maxItems: 20 },
        want: `string[]`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx, supportArrayLength: true },
        },
      },
    ],
    [
      "options > immutableTypes: true",
      {
        given: {
          type: "array",
          items: { type: "array", items: { type: "string" } },
        },
        want: `(readonly (readonly string)[])[]`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx, immutableTypes: true },
        },
      },
    ],
  ];

  test.each(tests)("%s", (_, { given, want, options = DEFAULT_OPTIONS }) => {
    const ast = transformSchemaObject(given, options);
    expect(astToString(ast).trim()).toBe(want.trim());
  });
});
