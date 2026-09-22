import { fileURLToPath } from "node:url";
import ts from "typescript";
import { astToString, stringToAST } from "../../../src/lib/ts.js";
import transformSchemaObject from "../../../src/transform/schema-object.js";
import { DEFAULT_CTX, expectTypeScriptToCompile, type TestCase } from "../../test-helpers.js";

const DEFAULT_OPTIONS = {
  path: "#/components/schemas/schema-object",
  ctx: { ...DEFAULT_CTX },
};

describe("composition", () => {
  const tests: TestCase[] = [
    [
      "polymorphic > nullable",
      {
        given: {
          type: ["string", "boolean", "number", "null"],
        },
        want: "string | boolean | number | null",
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "polymorphic > enum + nullable",
      {
        given: {
          type: ["string", "null"],
          enum: [null, "blue", "green", "yellow"],
        },
        want: 'null | "blue" | "green" | "yellow"',
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "polymorphic > enum + nullable (null missing in enum)",
      {
        given: {
          type: ["string", "null"],
          enum: ["blue", "green", "yellow"],
        },
        want: '"blue" | "green" | "yellow" | null',
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "polymorphic > enum + nullable (null missing in enum, falsy value in enum",
      {
        given: {
          type: ["string", "null"],
          enum: ["", "blue", "green", "yellow"],
        },
        want: '"" | "blue" | "green" | "yellow" | null',
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "oneOf > primitives",
      {
        given: { oneOf: [{ type: "string" }, { type: "number" }] },
        want: "string | number",
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "oneOf > string const",
      {
        given: {
          oneOf: [
            { type: "string", const: "hello" },
            { type: "string", const: "world" },
          ],
        },
        want: '"hello" | "world"',
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "oneOf > number const",
      {
        given: {
          oneOf: [
            { type: "number", const: 0 },
            { type: "number", const: 1 },
          ],
        },
        want: "0 | 1",
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "oneOf > nullable",
      {
        given: {
          oneOf: [{ type: "integer" }, { type: "string" }, { type: "null" }],
        },
        want: "number | string | null",
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "oneOf > nullable (deprecated syntax)",
      {
        given: {
          oneOf: [{ type: "integer" }, { type: "string" }],
          nullable: true,
        },
        want: "(number | string) | null",
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "oneOf > object without properties",
      {
        given: {
          type: "object",
          oneOf: [
            { type: "object", properties: { string: { type: "string" } } },
            { type: "object", properties: { boolean: { type: "boolean" } } },
          ],
        },
        want: `{
    string?: string;
} | {
    boolean?: boolean;
}`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "oneOf > object with properties",
      {
        given: {
          type: "object",
          oneOf: [
            { type: "object", properties: { foo: { type: "string" } } },
            { type: "object", properties: { bar: { type: "string" } } },
          ],
          properties: {
            baz: { type: "string" },
          },
        },
        want: `{
    baz?: string;
} & ({
    foo?: string;
} | {
    bar?: string;
})`,
      },
      // options: DEFAULT_OPTIONS,
    ],
    [
      "oneOf > polymorphic",
      {
        given: {
          oneOf: [{ type: "integer" }, { type: "string" }],
          type: ["null", "integer", "string"],
        },
        want: "null | number | string",
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "enum > acting as oneOf",
      {
        given: {
          type: "object",
          additionalProperties: true,
          enum: [
            { $ref: "#/components/schemas/simple-user" },
            { $ref: "#/components/schemas/team" },
            { $ref: "#/components/schemas/organization" },
          ],
        },
        want: `{
    [key: string]: unknown;
} & (components["schemas"]["simple-user"] | components["schemas"]["team"] | components["schemas"]["organization"])`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: {
            ...DEFAULT_OPTIONS.ctx,
            resolve($ref) {
              switch ($ref) {
                case "#/components/schemas/simple-user":
                case "#/components/schemas/team":
                case "#/components/schemas/organization": {
                  return {
                    type: "object",
                    required: ["name"],
                    properties: { name: { type: "string" } },
                  };
                }
                default: {
                  return undefined as any;
                }
              }
            },
          },
        },
      },
    ],
    [
      "discriminator > allOf",
      {
        given: {
          type: "object",
          allOf: [
            { $ref: "#/components/schemas/parent" },
            { type: "object", properties: { string: { type: "string" } } },
          ],
        },
        want: `{
    operation: "test";
} & (Omit<components["schemas"]["parent"], "operation"> & {
    string?: string;
})`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: {
            ...DEFAULT_OPTIONS.ctx,
            discriminators: {
              objects: {
                [DEFAULT_OPTIONS.path]: {
                  propertyName: "operation",
                  mapping: {
                    test: DEFAULT_OPTIONS.path,
                  },
                },
                "#/components/schemas/parent": {
                  propertyName: "operation",
                  mapping: {
                    test: DEFAULT_OPTIONS.path,
                  },
                },
              },
              refsHandled: [],
            },
            resolve($ref) {
              switch ($ref) {
                case "#/components/schemas/parent": {
                  return {
                    propertyName: "operation",
                    mapping: {
                      test: DEFAULT_OPTIONS.path,
                    },
                  };
                }
                default: {
                  return undefined as any;
                }
              }
            },
          },
        },
      },
    ],
    [
      "discriminator > oneOf",
      {
        given: {
          oneOf: [{ $ref: "#/components/schemas/Cat" }, { $ref: "#/components/schemas/Dog" }],
        },
        want: `components["schemas"]["Cat"] | components["schemas"]["Dog"]`,
        options: {
          path: "#/components/schemas/Pet",
          ctx: {
            ...DEFAULT_OPTIONS.ctx,
            discriminators: {
              objects: {
                "#/components/schemas/Pet": {
                  propertyName: "petType",
                },
                "#/components/schemas/Cat": {
                  propertyName: "petType",
                },
                "#/components/schemas/Dog": {
                  propertyName: "petType",
                },
              },
              refsHandled: [],
            },
            resolve($ref) {
              switch ($ref) {
                case "#/components/schemas/Pet": {
                  return {
                    propertyName: "petType",
                    oneOf: ["#/components/schemas/Cat"],
                  };
                }
                default: {
                  return undefined as any;
                }
              }
            },
          },
        },
      },
    ],
    [
      // this is actually invalid syntax for oneOfs, but we support it anyways for better compatibility with bad schemas
      "discriminator > oneOf inside object",
      {
        given: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
          },
          oneOf: [{ $ref: "#/components/schemas/Cat" }, { $ref: "#/components/schemas/Dog" }],
        },
        want: `{
    name: string;
} & (components["schemas"]["Cat"] | components["schemas"]["Dog"])`,
        options: {
          path: "#/components/schemas/Pet",
          ctx: {
            ...DEFAULT_OPTIONS.ctx,
            discriminators: {
              objects: {
                "#/components/schemas/Pet": {
                  propertyName: "petType",
                },
                "#/components/schemas/Cat": {
                  propertyName: "petType",
                },
                "#/components/schemas/Dog": {
                  propertyName: "petType",
                },
              },
              refsHandled: [],
            },
            resolve($ref) {
              switch ($ref) {
                case "#/components/schemas/Pet": {
                  return {
                    propertyName: "petType",
                    oneOf: ["#/components/schemas/Cat"],
                  };
                }
                default: {
                  return undefined as any;
                }
              }
            },
          },
        },
      },
    ],
    [
      "discriminator > oneOf + null + implicit mapping",
      {
        given: {
          oneOf: [{ $ref: "#/components/schemas/parent" }, { type: "null" }],
        },
        want: `components["schemas"]["parent"] | null`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: {
            ...DEFAULT_OPTIONS.ctx,
            discriminators: {
              objects: {
                [DEFAULT_OPTIONS.path]: {
                  propertyName: "operation",
                },
                "#/components/schemas/parent": {
                  propertyName: "operation",
                },
              },
              refsHandled: [],
            },
            resolve($ref) {
              switch ($ref) {
                case "#/components/schemas/parent": {
                  return { propertyName: "operation" };
                }
                default: {
                  return undefined as any;
                }
              }
            },
          },
        },
      },
    ],
    [
      "discriminator > escape",
      {
        given: {
          type: "object",
          allOf: [
            { $ref: "#/components/schemas/parent" },
            { type: "object", properties: { string: { type: "string" } } },
          ],
        },
        want: `{
    "@type": "test";
} & (Omit<components["schemas"]["parent"], "@type"> & {
    string?: string;
})`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: {
            ...DEFAULT_OPTIONS.ctx,
            discriminators: {
              objects: {
                "#/components/schemas/schema-object": {
                  propertyName: "@type",
                  mapping: {
                    test: DEFAULT_OPTIONS.path,
                  },
                },
                "#/components/schemas/parent": {
                  propertyName: "@type",
                  mapping: {
                    test: DEFAULT_OPTIONS.path,
                  },
                },
              },
              refsHandled: [],
            },
            resolve($ref) {
              switch ($ref) {
                case "#/components/schemas/parent": {
                  return {
                    propertyName: "@type",
                    mapping: {
                      test: DEFAULT_OPTIONS.path,
                    },
                  };
                }
                default: {
                  return undefined as any;
                }
              }
            },
          },
        },
      },
    ],
    [
      "discriminator > automatic propertyName",
      {
        given: {
          type: "object",
          allOf: [{ $ref: "#/components/schemas/Pet" }],
          properties: {
            bark: { type: "boolean" },
          },
          additionalProperties: false,
        },
        want: `{
    _petType: "Dog";
    bark?: boolean;
} & Omit<components["schemas"]["Pet"], "_petType">`,
        options: {
          path: "#/components/schemas/Dog",
          ctx: {
            ...DEFAULT_OPTIONS.ctx,
            discriminators: {
              objects: {
                "#/components/schemas/Pet": {
                  propertyName: "_petType",
                },
                "#/components/schemas/Dog": {
                  propertyName: "_petType",
                },
              },
              refsHandled: [],
            },
            resolve($ref) {
              switch ($ref) {
                case "#/components/schemas/Pet": {
                  return { propertyName: "_petType" };
                }
                default: {
                  return undefined as any;
                }
              }
            },
          },
        },
      },
    ],
    [
      "allOf > basic",
      {
        given: {
          allOf: [
            {
              type: "object",
              properties: { red: { type: "number" }, blue: { type: "number" } },
              required: ["red", "blue"],
            },
            {
              type: "object",
              properties: { green: { type: "number" } },
              required: ["green"],
            },
          ],
        },
        want: `{
    red: number;
    blue: number;
} & {
    green: number;
}`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "allOf > sibling required",
      {
        given: {
          required: ["red", "blue", "green"],
          allOf: [
            {
              type: "object",
              properties: { red: { type: "number" }, blue: { type: "number" } },
            },
            { type: "object", properties: { green: { type: "number" } } },
          ],
        },
        want: `{
    red: number;
    blue: number;
} & {
    green: number;
}`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "allOf > core properties",
      {
        given: {
          type: "object",
          properties: {
            price: {
              $ref: "#/components/schemas/Price",
            },
          },
          required: ["price", "name"],
          allOf: [{ $ref: "#/components/schemas/Product" }],
        },
        want: `{
    price: components["schemas"]["Price"];
} & WithRequired<components["schemas"]["Product"], "name">`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: {
            ...DEFAULT_OPTIONS.ctx,
            resolve($ref) {
              switch ($ref) {
                case "#/components/schemas/Price": {
                  return {
                    type: "object",
                    properties: {
                      value: { type: "number" },
                      currency: { type: "string" },
                    },
                    required: ["value", "currency"],
                  };
                }
                case "#/components/schemas/Product": {
                  return {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                      required: ["id"],
                    },
                  };
                }
                default: {
                  return undefined as any;
                }
              }
            },
          },
        },
      },
    ],
    [
      "allOf > #1474 typed required-only constraint",
      {
        given: {
          allOf: [{ $ref: "#/components/schemas/Base" }, { type: "object", required: ["required_string"] }],
        },
        want: `WithRequired<components["schemas"]["Base"], "required_string">`,
        options: optionsWithSchemas({
          Base: {
            type: "object",
            properties: { required_string: { type: "string" } },
          },
        }),
      },
    ],
    [
      "allOf > #1474 untyped required-only constraint",
      {
        given: {
          allOf: [{ $ref: "#/components/schemas/Base" }, { required: ["required_string"] }],
        },
        want: `WithRequired<components["schemas"]["Base"], "required_string">`,
        options: optionsWithSchemas({
          Base: {
            type: "object",
            properties: { required_string: { type: "string" } },
          },
        }),
      },
    ],
    [
      "allOf > aggregates parent, ref, inline, and repeated required keys",
      {
        given: {
          type: "object",
          properties: { core_id: { type: "string" } },
          required: ["optional_number"],
          allOf: [
            { $ref: "#/components/schemas/Base" },
            { $ref: "#/components/schemas/Details" },
            { type: "object", properties: { inline_flag: { type: "boolean" } } },
            { required: ["required_string", "detail_id", "inline_flag", "core_id"] },
            { required: ["optional_number", "required_string"] },
          ],
        },
        want: `{
    core_id: string;
} & (WithRequired<components["schemas"]["Base"], "optional_number" | "required_string"> & WithRequired<components["schemas"]["Details"], "detail_id"> & {
    inline_flag: boolean;
})`,
        options: optionsWithSchemas({
          Base: {
            type: "object",
            properties: {
              required_string: { type: "string" },
              optional_number: { type: "number" },
            },
          },
          Details: {
            type: "object",
            properties: { detail_id: { type: "number" } },
          },
        }),
      },
    ],
    [
      "allOf > discovers required properties through a recursive ref cycle",
      {
        given: {
          allOf: [{ $ref: "#/components/schemas/RecursiveA" }, { type: "object", required: ["recursive_key"] }],
        },
        want: `WithRequired<components["schemas"]["RecursiveA"], "recursive_key">`,
        options: optionsWithSchemas({
          RecursiveA: {
            allOf: [{ $ref: "#/components/schemas/RecursiveB" }],
          },
          RecursiveB: {
            type: "object",
            properties: { recursive_key: { type: "string" } },
            allOf: [{ $ref: "#/components/schemas/RecursiveA" }],
          },
        }),
      },
    ],
    [
      "discriminator > applies required constraint before Omit",
      {
        given: {
          type: "object",
          allOf: [{ $ref: "#/components/schemas/parent" }, { type: "object", required: ["name"] }],
        },
        want: `{
    operation: "test";
} & Omit<WithRequired<components["schemas"]["parent"], "name">, "operation">`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: {
            ...DEFAULT_OPTIONS.ctx,
            discriminators: {
              objects: {
                [DEFAULT_OPTIONS.path]: {
                  propertyName: "operation",
                  mapping: { test: DEFAULT_OPTIONS.path },
                },
                "#/components/schemas/parent": {
                  propertyName: "operation",
                  mapping: { test: DEFAULT_OPTIONS.path },
                },
              },
              refsHandled: [],
            },
            resolve($ref) {
              return (
                $ref === "#/components/schemas/parent"
                  ? {
                      type: "object",
                      properties: {
                        operation: { type: "string" },
                        name: { type: "string" },
                      },
                    }
                  : undefined
              ) as any;
            },
          },
        },
      },
    ],
    [
      "anyOf > basic",
      {
        given: {
          anyOf: [
            {
              type: "object",
              properties: { red: { type: "number" } },
              required: ["red"],
            },
            {
              type: "object",
              properties: { blue: { type: "number" } },
              required: ["blue"],
            },
            {
              type: "object",
              properties: { green: { type: "number" } },
              required: ["green"],
            },
          ],
        },
        want: `{
    red: number;
} | {
    blue: number;
} | {
    green: number;
}`,
        // options: DEFAULT_OPTIONS
      },
    ],
  ];

  for (const [testName, { given, want, options = DEFAULT_OPTIONS, ci }] of tests) {
    test.skipIf(ci?.skipIf)(
      testName,
      async () => {
        const result = astToString(transformSchemaObject(given, options));
        if (want instanceof URL) {
          await expect(result).toMatchFileSnapshot(fileURLToPath(want));
        } else {
          expect(result).toBe(`${want}\n`);
        }
      },
      ci?.timeout,
    );
  }
  test("allOf > preserves unsafe required-only constraints", () => {
    const transformPropertyOptions: any = { ...DEFAULT_OPTIONS, ctx: { ...DEFAULT_OPTIONS.ctx } };
    transformPropertyOptions.ctx.transformProperty = (property: ts.PropertySignature) =>
      ts.factory.updatePropertySignature(
        property,
        property.modifiers,
        ts.factory.createIdentifier("renamed"),
        property.questionToken,
        property.type,
      );
    const deprecatedOptions = optionsWithSchemas({
      Base: {
        type: "object",
        properties: { deprecated_key: { type: "string", deprecated: true } },
      },
    });
    deprecatedOptions.ctx.excludeDeprecated = true;

    const cases: [string, any, any, string][] = [
      [
        "extra validation keyword",
        {
          allOf: [
            { $ref: "#/components/schemas/Base" },
            { type: "object", required: ["required_string"], minProperties: 1 },
          ],
        },
        baseOptions(),
        'components["schemas"]["Base"] & Record<string, never>',
      ],
      [
        "unknown typed key",
        {
          allOf: [{ $ref: "#/components/schemas/Base" }, { type: "object", required: ["unknown"] }],
        },
        baseOptions(),
        'components["schemas"]["Base"] & Record<string, never>',
      ],
      [
        "unknown untyped key",
        { allOf: [{ $ref: "#/components/schemas/Base" }, { required: ["unknown"] }] },
        baseOptions(),
        'components["schemas"]["Base"] & unknown',
      ],
      [
        "no retained object assertion",
        {
          allOf: [
            { properties: { required_string: { type: "string" } } },
            { type: "object", required: ["required_string"] },
          ],
        },
        DEFAULT_OPTIONS,
        `{
    required_string?: string;
} & Record<string, never>`,
      ],
      [
        "mixed known/unknown typed and untyped keys",
        {
          allOf: [
            { $ref: "#/components/schemas/Base" },
            { type: "object", required: ["required_string", "unknown"] },
            { required: ["required_string", "unknown"] },
          ],
        },
        baseOptions(),
        'components["schemas"]["Base"] & Record<string, never> & unknown',
      ],
      [
        "nullable ref",
        {
          allOf: [{ $ref: "#/components/schemas/Base" }, { type: "object", required: ["required_string"] }],
        },
        optionsWithSchemas({
          Base: {
            type: ["object", "null"],
            properties: { required_string: { type: "string" } },
          },
        }),
        'components["schemas"]["Base"] & Record<string, never>',
      ],
      [
        "polymorphic ref",
        {
          allOf: [{ $ref: "#/components/schemas/Base" }, { required: ["required_string"] }],
        },
        optionsWithSchemas({
          Base: {
            type: ["object", "string"],
            properties: { required_string: { type: "string" } },
          },
        }),
        'components["schemas"]["Base"] & unknown',
      ],
      [
        "const ref",
        {
          allOf: [{ $ref: "#/components/schemas/Base" }, { type: "object", required: ["required_string"] }],
        },
        optionsWithSchemas({
          Base: {
            type: "object",
            const: {},
            properties: { required_string: { type: "string" } },
          },
        }),
        'components["schemas"]["Base"] & Record<string, never>',
      ],
      [
        "enum ref",
        {
          allOf: [{ $ref: "#/components/schemas/Base" }, { required: ["required_string"] }],
        },
        optionsWithSchemas({
          Base: {
            enum: ["fixed"],
            allOf: [{ type: "object", properties: { required_string: { type: "string" } } }],
          },
        }),
        'components["schemas"]["Base"] & unknown',
      ],
      [
        "outer anyOf",
        {
          allOf: [{ $ref: "#/components/schemas/Base" }, { required: ["required_string"] }],
          anyOf: [{ type: "string" }],
        },
        baseOptions(),
        '(components["schemas"]["Base"] & unknown) | string',
      ],
      [
        "outer oneOf",
        {
          allOf: [{ $ref: "#/components/schemas/Base" }, { required: ["required_string"] }],
          oneOf: [{ type: "object", properties: { variant: { type: "string" } } }],
        },
        baseOptions(),
        `(components["schemas"]["Base"] & unknown) & {
    variant?: string;
}`,
      ],
      [
        "transformProperty",
        {
          allOf: [{ type: "object", properties: { original: { type: "string" } } }, { required: ["original"] }],
        },
        transformPropertyOptions,
        `{
    renamed?: string;
} & unknown`,
      ],
      [
        "excludeDeprecated",
        {
          allOf: [{ $ref: "#/components/schemas/Base" }, { required: ["deprecated_key"] }],
        },
        deprecatedOptions,
        'components["schemas"]["Base"] & unknown',
      ],
    ];

    for (const [name, schema, options, want] of cases) {
      expect(astToString(transformSchemaObject(schema, options)).trim(), name).toBe(want);
    }
  });

  test("allOf > callback lifecycle preserves reused occurrence order and identity", () => {
    const sharedConstraint = { type: "object", required: ["required_string"] } as const;
    const schema = { allOf: [{ $ref: "#/components/schemas/Base" }, sharedConstraint, sharedConstraint] };
    const identityOptions = baseOptions();
    const calls: string[] = [];
    const postCalls: string[] = [];
    identityOptions.ctx.transform = (item, options) => {
      calls.push(`${options.path}:${item.required?.join(",")}`);
      return undefined;
    };
    identityOptions.ctx.postTransform = (type) => {
      postCalls.push(astToString(type).trim());
      return type;
    };

    expect(astToString(transformSchemaObject(schema as any, identityOptions)).trim()).toBe(
      'WithRequiredObject<components["schemas"]["Base"], "required_string">',
    );
    expect(calls).toEqual([`${identityOptions.path}:required_string`, `${identityOptions.path}:required_string`]);
    expect(postCalls).toEqual([
      'components["schemas"]["Base"]',
      "Record<string, never>",
      "Record<string, never>",
      'WithRequiredObject<components["schemas"]["Base"], "required_string">',
    ]);

    const replacementOptions = baseOptions();
    let occurrence = 0;
    replacementOptions.ctx.transform = (item) =>
      item.required?.includes("required_string")
        ? objectType({ [`occurrence${++occurrence}`]: ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword) })
        : undefined;
    const replaced = astToString(transformSchemaObject(schema as any, replacementOptions));
    expect(occurrence).toBe(2);
    expect(replaced).toContain("occurrence1: string");
    expect(replaced).toContain("occurrence2: string");
    expect(replaced).not.toContain("WithRequired");
  });

  test.each(["transform", "postTransform"] as const)("allOf > thrown %s propagates", (hook) => {
    const options = baseOptions();
    const callback = () => {
      throw new Error(hook);
    };
    if (hook === "transform") {
      options.ctx.transform = callback;
    } else {
      options.ctx.postTransform = callback;
    }
    expect(() =>
      transformSchemaObject(
        { allOf: [{ $ref: "#/components/schemas/Base" }, { type: "object", required: ["required_string"] }] } as any,
        options,
      ),
    ).toThrow(hook);
  });

  test("allOf > callback replacements remain authoritative", () => {
    const baseSchema = {
      allOf: [{ $ref: "#/components/schemas/Base" }, { type: "object", required: ["required_string"] }],
    };
    const cases: [string, any, any, (options: ReturnType<typeof optionsWithSchemas>) => void, string][] = [
      [
        "transform replacement",
        baseSchema,
        { Base: BASE_SCHEMA },
        (options) => {
          options.ctx.transform = () => ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
        },
        'components["schemas"]["Base"] & number',
      ],
      [
        "postTransform replacement",
        baseSchema,
        { Base: BASE_SCHEMA },
        (options) => {
          options.ctx.postTransform = (type) =>
            astToString(type).trim() === "Record<string, never>"
              ? ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
              : undefined;
        },
        'components["schemas"]["Base"] & number',
      ],
      [
        "partial typed-constraint replacement",
        {
          type: "object",
          properties: { first: { type: "string" }, second: { type: "number" } },
          allOf: [
            { type: "object", required: ["first"] },
            { type: "object", required: ["second"] },
          ],
        },
        {},
        (options) => {
          options.ctx.transform = (schema) =>
            schema.required?.includes("first")
              ? objectType({ replacement: ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword) })
              : undefined;
        },
        `WithRequiredObject<{
    first?: string;
    second?: number;
} & {
    replacement: boolean;
}, "second">`,
      ],
      [
        "untyped callback baseline",
        { allOf: [{ $ref: "#/components/schemas/Base" }, { required: ["required_string"] }] },
        { Base: BASE_SCHEMA },
        (options) => {
          options.ctx.transform = () => undefined;
        },
        'components["schemas"]["Base"] & unknown',
      ],
      [
        "ref postTransform replacement",
        baseSchema,
        { Base: BASE_SCHEMA },
        (options) => {
          options.ctx.postTransform = (type) =>
            astToString(type).trim() === 'components["schemas"]["Base"]'
              ? ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
              : undefined;
        },
        'WithRequiredObject<number, "required_string">',
      ],
    ];

    for (const [name, schema, schemas, configure, want] of cases) {
      const options = optionsWithSchemas(schemas);
      configure(options);
      expect(astToString(transformSchemaObject(schema, options)).trim(), name).toBe(want);
    }
  });

  test("discriminator > callback handled ref keeps non-discriminator required key through Omit", () => {
    const options = optionsWithSchemas({
      parent: {
        type: "object",
        required: ["operation"],
        properties: { operation: { type: "string", enum: ["test"] }, name: { type: "string" } },
      },
    });
    options.ctx.postTransform = (type) => type;
    options.ctx.discriminators = {
      objects: { "#/components/schemas/parent": { propertyName: "operation" } },
      refsHandled: ["#/components/schemas/parent"],
    };
    expect(
      astToString(
        transformSchemaObject(
          {
            allOf: [{ $ref: "#/components/schemas/parent" }, { type: "object", required: ["name"] }],
          } as any,
          options,
        ),
      ).trim(),
    ).toBe('WithRequiredObject<Omit<components["schemas"]["parent"], "operation">, "name">');
  });

  test("allOf > footer helper conflict uses the inline object constraint", () => {
    const options = baseOptions();
    options.ctx.injectFooter = stringToAST("interface WithRequiredObject { caller: true }") as ts.Node[];
    options.ctx.transform = () => undefined;
    const result = astToString(
      transformSchemaObject(
        { allOf: [{ $ref: "#/components/schemas/Base" }, { type: "object", required: ["required_string"] }] } as any,
        options,
      ),
    ).trim();
    expect(result).not.toContain("WithRequiredObject<");
    expect(astToString(options.ctx.injectFooter)).not.toContain("type WithRequiredObject<");
    expectTypeScriptToCompile(`
      interface components { schemas: { Base: { required_string?: string } } }
      ${astToString(options.ctx.injectFooter)}
      type Generated = ${result};
      const valid: Generated = { required_string: "value" };
      // @ts-expect-error required_string remains required
      const invalid: Generated = {};
    `);
  });

  test("allOf > completed callback aggregate combines refs, parent keys, and callback output", () => {
    const options = optionsWithSchemas({
      First: { type: "object", properties: { first: { type: "string" } } },
      Second: { type: "object", properties: { second: { type: "number" } } },
    });
    options.ctx.transform = (schema) =>
      "properties" in schema && schema.properties?.callback_value
        ? objectType({ callback_value: ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword) }, true)
        : undefined;

    const result = astToString(
      transformSchemaObject(
        {
          required: ["parent_only"],
          allOf: [
            { $ref: "#/components/schemas/First" },
            { $ref: "#/components/schemas/Second" },
            { type: "object", properties: { callback_value: { type: "string" } } },
            { type: "object", required: ["first", "second", "callback_value"] },
          ],
        } as any,
        options,
      ),
    ).trim();

    expect(result).toBe(`WithRequiredObject<components["schemas"]["First"] & components["schemas"]["Second"] & {
    callback_value?: number;
}, "parent_only" | "first" | "second" | "callback_value">`);
  });

  test("allOf > exact outer object enables callback constraints but synthetic type-array objects do not", () => {
    const exactOptions = optionsWithSchemas({});
    exactOptions.ctx.transform = () => undefined;
    const exact = astToString(
      transformSchemaObject(
        {
          type: "object",
          properties: { value: { type: "string" } },
          allOf: [{ type: "object", required: ["value"] }],
        },
        exactOptions,
      ),
    ).trim();
    expect(exact).toBe(`WithRequiredObject<{
    value?: string;
}, "value">`);

    const syntheticOptions = optionsWithSchemas({});
    syntheticOptions.ctx.transform = () => undefined;
    const synthetic = astToString(
      transformSchemaObject(
        {
          type: ["object", "string"],
          properties: { value: { type: "string" } },
          allOf: [{ type: "object", required: ["value"] }],
        } as any,
        syntheticOptions,
      ),
    );
    expect(synthetic).toContain("Record<string, never>");
    expect(synthetic).not.toContain("WithRequiredObject");
  });
});

function optionsWithSchemas(schemas: Record<string, any>) {
  return {
    ...DEFAULT_OPTIONS,
    ctx: {
      ...DEFAULT_OPTIONS.ctx,
      injectFooter: [] as ts.Node[],
      resolve($ref: string) {
        const name = $ref.startsWith("#/components/schemas/") ? $ref.slice("#/components/schemas/".length) : undefined;
        return name ? schemas[name] : undefined;
      },
    },
  };
}

const BASE_SCHEMA = {
  type: "object",
  properties: {
    required_string: { type: "string" },
    optional_number: { type: "number" },
  },
};

function baseOptions() {
  return optionsWithSchemas({ Base: BASE_SCHEMA });
}

function objectType(properties: Record<string, ts.TypeNode>, optional = false) {
  return ts.factory.createTypeLiteralNode(
    Object.entries(properties).map(([name, type]) =>
      ts.factory.createPropertySignature(
        undefined,
        name,
        optional ? ts.factory.createToken(ts.SyntaxKind.QuestionToken) : undefined,
        type,
      ),
    ),
  );
}
