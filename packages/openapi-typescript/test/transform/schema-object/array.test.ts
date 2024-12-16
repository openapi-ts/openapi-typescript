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
      "array > heterogeneous items",
      {
        given: {
          type: "array",
          items: { anyOf: [{ type: "number" }, { type: "string" }] },
        },
        want: "(number | string)[]",
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
    number,
    ...number[]
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
      "options > arrayLength: false > minItems: 0",
      {
        given: { type: "array", items: { type: "string" }, minItems: 0 },
        want: "string[]",
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx, arrayLength: false },
        },
      },
    ],
    [
      "options > arrayLength: false > minItems: 1",
      {
        given: { type: "array", items: { type: "string" }, minItems: 1 },
        want: "string[]",
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx, arrayLength: false },
        },
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
      "options > arrayLength: true > minItems: 0",
      {
        given: { type: "array", items: { type: "string" }, minItems: 0 },
        want: "string[]",
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx, arrayLength: true },
        },
      },
    ],
    [
      "options > arrayLength: true, immutable: true > minItems: 0",
      {
        given: { type: "array", items: { type: "string" }, minItems: 0 },
        want: "readonly string[]",
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx, arrayLength: true, immutable: true },
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
      "options > arrayLength: true, immutable: true > minItems: 1",
      {
        given: { type: "array", items: { type: "string" }, minItems: 1 },
        want: `readonly [
    string,
    ...readonly string[]
]`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx, arrayLength: true, immutable: true },
        },
      },
    ],
    [
      "options > arrayLength: true > minItems: 2",
      {
        given: { type: "array", items: { type: "string" }, minItems: 2 },
        want: `[
    string,
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
      "options > arrayLength: true, immutable: true > minItems: 2",
      {
        given: { type: "array", items: { type: "string" }, minItems: 2 },
        want: `readonly [
    string,
    string,
    ...readonly string[]
]`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx, arrayLength: true, immutable: true },
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
      "options > arrayLength: true, immutable: true > maxItems: 2",
      {
        given: { type: "array", items: { type: "string" }, maxItems: 2 },
        want: `readonly [
] | readonly [
    string
] | readonly [
    string,
    string
]`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx, arrayLength: true, immutable: true },
        },
      },
    ],
    [
      "options > arrayLength: true > minItems: 1, maxItems: 2",
      {
        given: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 2 },
        want: `[
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
      "options > arrayLength: true, immutable: true > minItems: 1, maxItems: 2",
      {
        given: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 2 },
        want: `readonly [
    string
] | readonly [
    string,
    string
]`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx, arrayLength: true, immutable: true },
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
      "options > arrayLength: true, immutable: true > maxItems: 20",
      {
        given: { type: "array", items: { type: "string" }, maxItems: 20 },
        want: "readonly string[]",
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx, arrayLength: true, immutable: true },
        },
      },
    ],
    [
      "options > arrayLength: true > minItems: 2, maxItems: 2",
      {
        given: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 2 },
        want: `[
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
      "options > arrayLength: true, immutable: true > prefixItems, minItems: 3",
      {
        given: {
          type: "array",
          items: { type: "string" },
          prefixItems: [{ type: "string" }, { type: "number" }],
          minItems: 3,
        },
        want: `readonly [
    string,
    number,
    string,
    ...readonly string[]
]`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx, arrayLength: true, immutable: true },
        },
      },
    ],
    [
      "options > arrayLength: true, immutable: true > prefixItems, minItems: 3, maxItems: 3",
      {
        given: {
          type: "array",
          items: { type: "string" },
          prefixItems: [{ type: "string" }, { type: "number" }],
          minItems: 3,
          maxItems: 3,
        },
        want: `readonly [
    string,
    number,
    string
]`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx, arrayLength: true, immutable: true },
        },
      },
    ],
    [
      "options > arrayLength: false, immutable: true > prefixItems, minItems: 3, maxItems: 5",
      {
        given: {
          type: "array",
          items: { type: "string" },
          prefixItems: [{ type: "string" }, { type: "number" }],
          minItems: 3,
          maxItems: 5,
        },
        want: `readonly [
    string,
    number,
    ...readonly string[]
]`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx, arrayLength: false, immutable: true },
        },
      },
    ],
    [
      "options > arrayLength: false > prefixItems, items: false",
      {
        given: {
          type: "array",
          items: false,
          prefixItems: [{ type: "string", enum: ["professor"] }],
        },
        want: `[
    "professor",
    ...unknown[]
]`,
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
    number,
    ...readonly number[]
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

  const invalidTests: TestCase[] = [
    [
      "error > items is array",
      {
        given: {
          type: "array",
          items: [{ type: "number" }, { type: "string" }],
        },
        want: "#/components/schemas/schema-object: invalid property items. Expected Schema Object, got Array",
      },
    ],
  ];

  for (const [testName, { given, want, options = DEFAULT_OPTIONS, ci }] of invalidTests) {
    test.skipIf(ci?.skipIf)(testName, () => {
      expect(() => {
        transformSchemaObject(given, options);
      }).toThrowError(want.toString());
    });
  }
});
