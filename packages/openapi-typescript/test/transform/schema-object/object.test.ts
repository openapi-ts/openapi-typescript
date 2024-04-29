import { fileURLToPath } from "node:url";
import { astToString } from "../../../src/index.js";
import transformSchemaObject from "../../../src/transform/schema-object.js";
import { DEFAULT_CTX, type TestCase } from "../../test-helpers.js";

const DEFAULT_OPTIONS = {
  path: "#/schemas/components/schema-object",
  ctx: { ...DEFAULT_CTX },
};

describe("transformSchemaObject > object", () => {
  const tests: TestCase[] = [
    [
      "basic",
      {
        given: {
          type: "object",
          properties: {
            required: { type: "boolean" },
            optional: { type: "boolean" },
          },
          required: ["required"],
        },
        want: `{
    required: boolean;
    optional?: boolean;
}`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "empty",
      {
        given: { type: "object" },
        want: "Record<string, never>",
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "additionalProperties > basic",
      {
        given: {
          type: "object",
          properties: { property: { type: "boolean" } },
          additionalProperties: { type: "string" },
        },
        want: `{
    property?: boolean;
    [key: string]: string | undefined;
}`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "additionalProperties > no properties",
      {
        given: { type: "object", additionalProperties: { type: "string" } },
        want: `{
    [key: string]: string | undefined;
}`,
      },
    ],
    [
      "additionalProperties > true",
      {
        given: { type: "object", additionalProperties: true },
        want: `{
    [key: string]: unknown;
}`,
      },
    ],
    [
      "additionalProperties > empty object",
      {
        given: { type: "object", additionalProperties: {} },
        want: `{
    [key: string]: unknown;
}`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "nullable",
      {
        given: {
          type: ["object", "null"],
          properties: { string: { type: "string" } },
        },
        want: `{
    string?: string;
} | null`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "nullable (deprecated syntax)",
      {
        given: {
          type: "object",
          properties: { string: { type: "string" } },
          nullable: true,
        },
        want: `{
    string?: string;
} | null`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "default",
      {
        given: {
          type: "object",
          properties: {
            required: { type: "boolean" },
            requiredDefault: { type: "boolean", default: false },
            optional: { type: "boolean" },
            optionalDefault: { type: "boolean", default: false },
          },
          required: ["required", "requiredDefault"],
        },
        want: `{
    required: boolean;
    /** @default false */
    requiredDefault: boolean;
    optional?: boolean;
    /** @default false */
    optionalDefault: boolean;
}`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "default > options.defaultNonNullable: false",
      {
        given: {
          type: "object",
          properties: {
            required: { type: "boolean" },
            requiredDefault: { type: "boolean", default: false },
            optional: { type: "boolean" },
            optionalDefault: { type: "boolean", default: false },
          },
          required: ["required", "requiredDefault"],
        },
        want: `{
    required: boolean;
    /** @default false */
    requiredDefault: boolean;
    optional?: boolean;
    /** @default false */
    optionalDefault?: boolean;
}`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx, defaultNonNullable: false },
        },
      },
    ],
    [
      "const > string",
      {
        given: {
          type: "object",
          properties: { constant: { type: "string", const: "a" } },
          required: ["constant"],
        },
        want: `{
    /** @constant */
    constant: "a";
}`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "const > string (inferred)",
      {
        given: { const: "99" },
        want: `"99"`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "const > number",
      {
        given: {
          type: "object",
          properties: { constant: { type: "number", const: 1 } },
          required: ["constant"],
        },
        want: `{
    /** @constant */
    constant: 1;
}`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "const > number (inferred)",
      {
        given: { const: 300 },
        want: "300",
      },
    ],
    [
      "const > number (falsy value)",
      {
        given: {
          type: "object",
          properties: { constant: { type: "number", const: 0 } },
          required: ["constant"],
        },
        want: `{
    /** @constant */
    constant: 0;
}`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "JSONSchema > $defs",
      {
        given: {
          type: "object",
          properties: {
            foo: { type: "string" },
          },
          $defs: {
            defEnum: { type: "string", enum: ["one", "two", "three"] },
          },
        },
        want: `{
    foo?: string;
    $defs: {
        /** @enum {string} */
        defEnum: "one" | "two" | "three";
    };
}`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "x-* properties > ignored",
      {
        given: {
          type: "object",
          properties: { string: { type: "string" } },
          "x-extension": true,
        },
        want: `{
    string?: string;
}`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "options > emptyObjectsUnknown: true",
      {
        given: { type: "object" },
        want: "Record<string, unknown>",
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx, emptyObjectsUnknown: true },
        },
      },
    ],
    [
      "options > additionalProperties: true",
      {
        given: { type: "object", properties: { string: { type: "string" } } },
        want: `{
    string?: string;
    [key: string]: unknown;
}`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx, additionalProperties: true },
        },
      },
    ],
    [
      "options > immutable (string)",
      {
        given: {
          type: "string",
        },
        want: "string",
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx, immutable: true },
        },
      },
    ],
    [
      "options > immutable (array)",
      {
        given: {
          type: "object",
          properties: {
            array: {
              type: "array",
              nullable: true,
              items: {
                type: "object",
                additionalProperties: true,
              },
            },
          },
        },
        want: `{
    readonly array?: readonly {
        readonly [key: string]: unknown;
    }[] | null;
}`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx, immutable: true },
        },
      },
    ],
    [
      "options > excludeDeprecated: true",
      {
        given: {
          type: "object",
          properties: {
            new: { type: "string" },
            old: { type: "string", deprecated: true },
          },
        },
        want: `{
    new?: string;
}`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx, excludeDeprecated: true },
        },
      },
    ],
    [
      "options > propertiesRequiredByDefault: true",
      {
        given: { type: "object", properties: { string: { type: "string" } } },
        want: `{
    string: string;
}`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx, propertiesRequiredByDefault: true },
        },
      },
    ],
    [
      "options > propertiesRequiredByDefault: true + array",
      {
        given: {
          type: "object",
          properties: {
            required: { type: "boolean" },
            optional: { type: "boolean" },
          },
          required: ["required"],
        },
        want: `{
    required: boolean;
    optional?: boolean;
}`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx, propertiesRequiredByDefault: true },
        },
      },
    ],
    [
      "options > two-dimensional array",
      {
        given: {
          type: "object",
          properties: {
            array: {
              type: "array",
              items: {
                items: [
                  {
                    type: "string",
                  },
                  {
                    type: "boolean",
                  },
                ],
                type: "array",
                maxItems: 2,
                minItems: 2,
              },
            },
          },
        },
        want: `{
    array?: [
        string,
        boolean
    ][];
}`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx },
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
