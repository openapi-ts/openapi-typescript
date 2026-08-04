import { fileURLToPath } from "node:url";
import ts from "typescript";
import { astToString, stringToAST } from "../../../src/lib/ts.js";
import transformSchemaObject from "../../../src/transform/schema-object.js";
import { DEFAULT_CTX, type TestCase } from "../../test-helpers.js";

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
      "allOf > Scramble object required constraint",
      {
        given: {
          allOf: [{ $ref: "#/components/schemas/Base" }, { type: "object", required: ["required_string"] }],
        },
        want: `WithRequired<components["schemas"]["Base"], "required_string">`,
        options: optionsWithSchemas({
          Base: {
            type: "object",
            properties: {
              required_string: { type: "string" },
              optional_number: { type: "number" },
            },
          },
        }),
      },
    ],
    [
      "allOf > annotations prevent required constraint classification",
      {
        given: {
          allOf: [
            { $ref: "#/components/schemas/Base" },
            {
              required: ["required_string"],
              title: "Required base fields",
              description: "This annotation does not change validation.",
              $comment: "Required in this use of Base.",
            },
          ],
        },
        want: `components["schemas"]["Base"] & unknown`,
        options: optionsWithSchemas({
          Base: {
            type: "object",
            properties: { required_string: { type: "string" } },
          },
        }),
      },
    ],
    [
      "allOf > required constraint across composed members",
      {
        given: {
          allOf: [
            { $ref: "#/components/schemas/Base" },
            { $ref: "#/components/schemas/Details" },
            {
              type: "object",
              properties: { inline_flag: { type: "boolean" } },
            },
            {
              required: ["required_string", "detail_id", "inline_flag"],
            },
          ],
        },
        want: `WithRequired<components["schemas"]["Base"], "required_string"> & WithRequired<components["schemas"]["Details"], "detail_id"> & {
    inline_flag: boolean;
}`,
        options: optionsWithSchemas({
          Base: {
            type: "object",
            properties: { required_string: { type: "string" } },
          },
          Details: {
            type: "object",
            properties: { detail_id: { type: "number" } },
          },
        }),
      },
    ],
    [
      "allOf > parent and constraint required are combined and deduplicated",
      {
        given: {
          required: ["optional_number", "required_string"],
          allOf: [{ $ref: "#/components/schemas/Base" }, { type: "object", required: ["required_string"] }],
        },
        want: `WithRequired<components["schemas"]["Base"], "optional_number" | "required_string">`,
        options: optionsWithSchemas({
          Base: {
            type: "object",
            properties: {
              required_string: { type: "string" },
              optional_number: { type: "number" },
            },
          },
        }),
      },
    ],
    [
      "allOf > required constraint applies to core and ref properties",
      {
        given: {
          type: "object",
          properties: { core_id: { type: "string" } },
          allOf: [{ $ref: "#/components/schemas/Base" }, { required: ["core_id", "required_string"] }],
        },
        want: `{
    core_id: string;
} & WithRequired<components["schemas"]["Base"], "required_string">`,
        options: optionsWithSchemas({
          Base: {
            type: "object",
            properties: { required_string: { type: "string" } },
          },
        }),
      },
    ],
    [
      "allOf > required constraint discovers nested ref properties",
      {
        given: {
          allOf: [{ $ref: "#/components/schemas/Derived" }, { required: ["required_string"] }],
        },
        want: `WithRequired<components["schemas"]["Derived"], "required_string">`,
        options: optionsWithSchemas({
          Base: {
            type: "object",
            properties: { required_string: { type: "string" } },
          },
          Derived: {
            allOf: [{ $ref: "#/components/schemas/Base" }],
          },
        }),
      },
    ],
    [
      "allOf > required constraint discovers properties through a recursive ref cycle",
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
      "allOf > multiple required constraints deduplicate keys",
      {
        given: {
          allOf: [
            { $ref: "#/components/schemas/Base" },
            { required: ["required_string"] },
            { required: ["optional_number", "required_string"] },
          ],
        },
        want: `WithRequired<components["schemas"]["Base"], "required_string" | "optional_number">`,
        options: optionsWithSchemas({
          Base: {
            type: "object",
            properties: {
              required_string: { type: "string" },
              optional_number: { type: "number" },
            },
          },
        }),
      },
    ],
    [
      "allOf > typed required constraints do not prove object-likeness for each other",
      {
        given: {
          allOf: [
            {
              properties: {
                first: { type: "string" },
                second: { type: "string" },
              },
            },
            { type: "object", required: ["first"] },
            { type: "object", required: ["second"] },
          ],
        },
        want: `{
    first?: string;
    second?: string;
} & Record<string, never> & Record<string, never>`,
      },
    ],
    [
      "allOf > typed required constraint does not erase a primitive composition",
      {
        given: {
          allOf: [
            {
              type: "string",
              properties: { required_string: { type: "string" } },
            },
            { type: "object", required: ["required_string"] },
          ],
        },
        want: `string & Record<string, never>`,
      },
    ],
    [
      "allOf > typed required constraint with unknown key preserves its object assertion",
      {
        given: {
          allOf: [{ $ref: "#/components/schemas/Base" }, { type: "object", required: ["unknown_property"] }],
        },
        want: `components["schemas"]["Base"] & Record<string, never>`,
        options: optionsWithSchemas({
          Base: {
            type: "object",
            properties: { required_string: { type: "string" } },
          },
        }),
      },
    ],
    [
      "allOf > untyped required constraint with mixed known and unknown keys is preserved",
      {
        given: {
          allOf: [{ $ref: "#/components/schemas/Base" }, { required: ["required_string", "unknown_property"] }],
        },
        want: `components["schemas"]["Base"] & unknown`,
        options: optionsWithSchemas({
          Base: {
            type: "object",
            properties: { required_string: { type: "string" } },
          },
        }),
      },
    ],
    [
      "allOf > typed required constraint with mixed known and unknown keys is preserved",
      {
        given: {
          allOf: [
            { $ref: "#/components/schemas/Base" },
            { type: "object", required: ["required_string", "unknown_property"] },
          ],
        },
        want: `components["schemas"]["Base"] & Record<string, never>`,
        options: optionsWithSchemas({
          Base: {
            type: "object",
            properties: { required_string: { type: "string" } },
          },
        }),
      },
    ],
    [
      "allOf > polymorphic type array ref prevents untyped constraint translation",
      {
        given: {
          allOf: [{ $ref: "#/components/schemas/Polymorphic" }, { required: ["required_string"] }],
        },
        want: `components["schemas"]["Polymorphic"] & unknown`,
        options: optionsWithSchemas({
          Polymorphic: {
            type: ["object", "string"],
            properties: { required_string: { type: "string" } },
          },
        }),
      },
    ],
    [
      "allOf > polymorphic type array ref prevents typed constraint translation",
      {
        given: {
          allOf: [{ $ref: "#/components/schemas/Polymorphic" }, { type: "object", required: ["required_string"] }],
        },
        want: `components["schemas"]["Polymorphic"] & Record<string, never>`,
        options: optionsWithSchemas({
          Polymorphic: {
            type: ["object", "string"],
            properties: { required_string: { type: "string" } },
          },
        }),
      },
    ],
    [
      "allOf > primitive ref properties do not make required keys discoverable",
      {
        given: {
          allOf: [{ $ref: "#/components/schemas/Primitive" }, { required: ["required_string"] }],
        },
        want: `components["schemas"]["Primitive"] & unknown`,
        options: optionsWithSchemas({
          Primitive: {
            type: "string",
            properties: { required_string: { type: "string" } },
          },
        }),
      },
    ],
    [
      "allOf > const object ref prevents untyped constraint translation",
      {
        given: {
          allOf: [{ $ref: "#/components/schemas/Constant" }, { required: ["required_string"] }],
        },
        want: `components["schemas"]["Constant"] & unknown`,
        options: optionsWithSchemas({
          Constant: {
            type: "object",
            const: {},
            properties: { required_string: { type: "string" } },
          },
        }),
      },
    ],
    [
      "allOf > const object ref prevents typed constraint translation",
      {
        given: {
          allOf: [{ $ref: "#/components/schemas/Constant" }, { type: "object", required: ["required_string"] }],
        },
        want: `components["schemas"]["Constant"] & Record<string, never>`,
        options: optionsWithSchemas({
          Constant: {
            type: "object",
            const: {},
            properties: { required_string: { type: "string" } },
          },
        }),
      },
    ],
    [
      "allOf > early-return enum ref prevents constraint translation",
      {
        given: {
          allOf: [{ $ref: "#/components/schemas/Enumerated" }, { required: ["required_string"] }],
        },
        want: `components["schemas"]["Enumerated"] & unknown`,
        options: optionsWithSchemas({
          Enumerated: {
            enum: ["fixed"],
            allOf: [
              {
                type: "object",
                properties: { required_string: { type: "string" } },
              },
            ],
          },
        }),
      },
    ],
    [
      "allOf > nullable object ref does not prove typed constraint object-likeness",
      {
        given: {
          allOf: [{ $ref: "#/components/schemas/NullableBase" }, { type: "object", required: ["required_string"] }],
        },
        want: `components["schemas"]["NullableBase"] & Record<string, never>`,
        options: optionsWithSchemas({
          NullableBase: {
            type: ["object", "null"],
            properties: { required_string: { type: "string" } },
          },
        }),
      },
    ],
    [
      "allOf > outer anyOf prevents required constraint translation",
      {
        given: {
          allOf: [{ $ref: "#/components/schemas/Base" }, { required: ["required_string"] }],
          anyOf: [{ type: "string" }],
        },
        want: `(components["schemas"]["Base"] & unknown) | string`,
        options: optionsWithSchemas({
          Base: {
            type: "object",
            properties: { required_string: { type: "string" } },
          },
        }),
      },
    ],
    [
      "allOf > outer oneOf prevents required constraint translation",
      {
        given: {
          allOf: [{ $ref: "#/components/schemas/Base" }, { required: ["required_string"] }],
          oneOf: [{ type: "object", properties: { variant: { type: "string" } } }],
        },
        want: `(components["schemas"]["Base"] & unknown) & {
    variant?: string;
}`,
        options: optionsWithSchemas({
          Base: {
            type: "object",
            properties: { required_string: { type: "string" } },
          },
        }),
      },
    ],
    [
      "allOf > excludeDeprecated prevents required constraint translation",
      {
        given: {
          allOf: [{ $ref: "#/components/schemas/Base" }, { required: ["deprecated_key"] }],
        },
        want: `components["schemas"]["Base"] & unknown`,
        options: {
          ...optionsWithSchemas({
            Base: {
              type: "object",
              properties: { deprecated_key: { type: "string", deprecated: true } },
            },
          }),
          ctx: {
            ...optionsWithSchemas({
              Base: {
                type: "object",
                properties: { deprecated_key: { type: "string", deprecated: true } },
              },
            }).ctx,
            excludeDeprecated: true,
          },
        },
      },
    ],
    [
      "allOf > explicit additionalProperties false is not a required-only constraint",
      {
        given: {
          allOf: [
            { $ref: "#/components/schemas/Base" },
            {
              type: "object",
              required: ["required_string"],
              additionalProperties: false,
            },
          ],
        },
        want: `components["schemas"]["Base"] & Record<string, never>`,
        options: optionsWithSchemas({
          Base: {
            type: "object",
            properties: { required_string: { type: "string" } },
          },
        }),
      },
    ],
    [
      "allOf > member with properties remains an ordinary intersection",
      {
        given: {
          allOf: [
            { $ref: "#/components/schemas/Base" },
            {
              type: "object",
              required: ["inline_flag"],
              properties: { inline_flag: { type: "boolean" } },
            },
          ],
        },
        want: `components["schemas"]["Base"] & {
    inline_flag: boolean;
}`,
        options: optionsWithSchemas({
          Base: {
            type: "object",
            properties: { required_string: { type: "string" } },
          },
        }),
      },
    ],
    [
      "allOf > member with another validation keyword remains an ordinary intersection",
      {
        given: {
          allOf: [
            { $ref: "#/components/schemas/Base" },
            {
              type: "object",
              required: ["required_string"],
              minProperties: 1,
            },
          ],
        },
        want: `components["schemas"]["Base"] & Record<string, never>`,
        options: optionsWithSchemas({
          Base: {
            type: "object",
            properties: { required_string: { type: "string" } },
          },
        }),
      },
    ],
    [
      "allOf > nullable object type union is not a required-only constraint",
      {
        given: {
          allOf: [
            { $ref: "#/components/schemas/Base" },
            {
              type: ["object", "null"],
              required: ["required_string"],
            },
          ],
        },
        want: `components["schemas"]["Base"] & (Record<string, never> | null)`,
        options: optionsWithSchemas({
          Base: {
            type: "object",
            properties: { required_string: { type: "string" } },
          },
        }),
      },
    ],
    [
      "allOf > vendor extension prevents required constraint classification",
      {
        given: {
          allOf: [
            { $ref: "#/components/schemas/Base" },
            {
              required: ["required_string"],
              "x-validation-behavior": true,
            },
          ],
        },
        want: `components["schemas"]["Base"] & unknown`,
        options: optionsWithSchemas({
          Base: {
            type: "object",
            properties: { required_string: { type: "string" } },
          },
        }),
      },
    ],
    [
      "allOf > unknown required constraint name preserves the member",
      {
        given: {
          allOf: [{ $ref: "#/components/schemas/Base" }, { required: ["unknown_property"] }],
        },
        want: `components["schemas"]["Base"] & unknown`,
        options: optionsWithSchemas({
          Base: {
            type: "object",
            properties: { required_string: { type: "string" } },
          },
        }),
      },
    ],
    [
      "discriminator > allOf required constraint uses ref required handling before Omit",
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
              if ($ref === "#/components/schemas/parent") {
                return {
                  type: "object",
                  properties: {
                    operation: { type: "string" },
                    name: { type: "string" },
                  },
                };
              }
              return undefined as any;
            },
          },
        },
      },
    ],
    [
      "discriminator > handled ref keeps translated non-discriminator required key",
      {
        given: {
          allOf: [{ $ref: "#/components/schemas/parent" }, { required: ["name"] }],
        },
        want: `Omit<WithRequired<components["schemas"]["parent"], "name">, "operation">`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: {
            ...DEFAULT_OPTIONS.ctx,
            discriminators: {
              objects: {
                "#/components/schemas/parent": {
                  propertyName: "operation",
                  mapping: { test: DEFAULT_OPTIONS.path },
                },
              },
              refsHandled: ["#/components/schemas/parent"],
            },
            resolve($ref) {
              if ($ref === "#/components/schemas/parent") {
                return {
                  type: "object",
                  required: ["operation"],
                  properties: {
                    operation: { type: "string", enum: ["test"] },
                    name: { type: "string" },
                  },
                };
              }
              return undefined as any;
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

  for (const [keyword, value] of [
    ["default", { required_string: "default" }],
    ["readOnly", true],
    ["writeOnly", true],
    ["deprecated", true],
    ["examples", [{ required_string: "example" }]],
    ["example", { required_string: "legacy example" }],
  ] as const) {
    test(`allOf > ${keyword} prevents required constraint classification`, () => {
      const result = astToString(
        transformSchemaObject(
          {
            allOf: [
              { $ref: "#/components/schemas/Base" },
              {
                type: "object",
                required: ["required_string"],
                [keyword]: value,
              },
            ],
          } as any,
          optionsWithSchemas({
            Base: {
              type: "object",
              properties: { required_string: { type: "string" } },
            },
          }),
        ),
      );

      expect(result).toBe('components["schemas"]["Base"] & Record<string, never>\n');
    });
  }

  test("allOf > transform callback replacement prevents constraint translation", () => {
    let transformCalls = 0;
    let postTransformCalls = 0;
    const options = optionsWithSchemas({
      Base: {
        type: "object",
        properties: { required_string: { type: "string" } },
      },
    });
    options.ctx.transform = () => {
      transformCalls++;
      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
    };
    options.ctx.postTransform = () => void postTransformCalls++;

    const result = astToString(
      transformSchemaObject(
        {
          allOf: [{ $ref: "#/components/schemas/Base" }, { type: "object", required: ["required_string"] }],
        } as any,
        options,
      ),
    );

    expect(result).toBe('components["schemas"]["Base"] & number\n');
    expect(transformCalls).toBe(1);
    expect(postTransformCalls).toBe(3);
  });

  test("allOf > postTransform callback replacement prevents constraint translation", () => {
    const options = optionsWithSchemas({
      Base: {
        type: "object",
        properties: { required_string: { type: "string" } },
      },
    });
    options.ctx.postTransform = (type) =>
      ts.isTypeReferenceNode(type) && ts.isIdentifier(type.typeName) && type.typeName.text === "Record"
        ? ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
        : undefined;

    const result = astToString(
      transformSchemaObject(
        {
          allOf: [{ $ref: "#/components/schemas/Base" }, { type: "object", required: ["required_string"] }],
        } as any,
        options,
      ),
    );

    expect(result).toBe('components["schemas"]["Base"] & number\n');
  });

  test("allOf > unrelated transform callback keeps concise typed constraint output", () => {
    const calls: string[] = [];
    const options = optionsWithSchemas({
      Base: {
        type: "object",
        properties: { required_string: { type: "string" } },
      },
    });
    options.ctx.transform = (schema) => {
      calls.push(schema.required?.includes("required_string") ? "constraint" : "other");
      return undefined;
    };

    const result = astToString(
      transformSchemaObject(
        {
          allOf: [{ $ref: "#/components/schemas/Base" }, { type: "object", required: ["required_string"] }],
        } as any,
        options,
      ),
    );

    expect(result).toBe('WithRequiredObject<components["schemas"]["Base"], "required_string">\n');
    expect(calls).toEqual(["constraint"]);
    expect(astToString(options.ctx.injectFooter).match(/type WithRequiredObject</g)).toHaveLength(1);
  });

  test("allOf > outer object core retains typed callback constraint", () => {
    const schema = {
      type: "object",
      properties: { value: { type: "string" } },
      allOf: [{ type: "object", required: ["value"] }],
    };
    const generated = generateComponentsAndConstrainedType({}, schema, (options) => {
      options.ctx.transform = () => undefined;
    });

    expect(generated.generated).toBe(`WithRequiredObject<{
    value?: string;
}, "value">`);
    expectTypeScriptToCompile(`${generated.source}
      const valid: Generated = { value: "value" };
      // @ts-expect-error the typed sibling makes the core property required
      const invalid: Generated = {};
    `);

    const noCallback = generateComponentsAndConstrainedType({}, schema);
    expect(noCallback.generated).toBe(`{
    value?: string;
} & Record<string, never>`);
  });

  test("allOf > outer object core retains typed constraint with identity postTransform", () => {
    const generated = generateComponentsAndConstrainedType(
      {},
      {
        type: "object",
        properties: { value: { type: "string" } },
        allOf: [{ type: "object", required: ["value"] }],
      },
      (options) => {
        options.ctx.postTransform = (type) => type;
      },
    );

    expect(generated.generated).toBe(`WithRequiredObject<{
    value?: string;
}, "value">`);
    expectTypeScriptToCompile(`${generated.source}
      const valid: Generated = { value: "value" };
      // @ts-expect-error identity observation does not remove the sibling assertion
      const invalid: Generated = {};
    `);
  });

  test("allOf > typed sibling constrains a callback-replaced outer object core", () => {
    const replacement = ts.factory.createTypeLiteralNode([
      ts.factory.createPropertySignature(
        undefined,
        "other",
        undefined,
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
      ),
    ]);
    const generated = generateComponentsAndConstrainedType(
      {},
      {
        type: "object",
        properties: { value: { type: "string" } },
        allOf: [{ type: "object", required: ["value"] }],
      },
      (options) => {
        options.ctx.transform = (schema) => ("properties" in schema && schema.properties ? replacement : undefined);
      },
    );

    expect(generated.generated).toBe(`WithRequiredObject<{
    other: number;
}, "value">`);
    expectTypeScriptToCompile(`${generated.source}
      const valid: Generated = { other: 1, value: "required unknown" };
      // @ts-expect-error callback replacement does not erase the untouched typed sibling
      const invalid: Generated = { other: 1 };
    `);
  });

  test.each([
    ["primitive", ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)],
    ["array", ts.factory.createArrayTypeNode(ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword))],
  ])("allOf > typed sibling rejects a callback-replaced %s outer core", (_label, replacement) => {
    const generated = generateComponentsAndConstrainedType(
      {},
      {
        type: "object",
        properties: { value: { type: "string" } },
        allOf: [{ type: "object", required: ["value"] }],
      },
      (options) => {
        options.ctx.transform = (schema) => ("properties" in schema && schema.properties ? replacement : undefined);
      },
    );

    expect(generated.generated).toContain("WithRequiredObject<");
    expectTypeScriptToCompile(`${generated.source}
      type IsNever<T> = [T] extends [never] ? true : false;
      const isNever: IsNever<Generated> = true;
      // @ts-expect-error the untouched type: object sibling rejects non-object callback output
      const invalid: Generated = ${_label === "array" ? "[]" : '"value"'};
    `);
  });

  test("allOf > outer object core supports partial typed member replacement", () => {
    const generated = generateComponentsAndConstrainedType(
      {},
      {
        type: "object",
        properties: { first: { type: "string" }, second: { type: "number" } },
        allOf: [
          { type: "object", required: ["first"] },
          { type: "object", required: ["second"] },
        ],
      },
      (options) => {
        options.ctx.transform = (schema) =>
          schema.required?.includes("first")
            ? ts.factory.createTypeLiteralNode([
                ts.factory.createPropertySignature(
                  undefined,
                  "replacement",
                  undefined,
                  ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword),
                ),
              ])
            : undefined;
      },
    );

    expect(generated.generated).toBe(`WithRequiredObject<{
    first?: string;
    second?: number;
} & {
    replacement: boolean;
}, "second">`);
    expectTypeScriptToCompile(`${generated.source}
      const valid: Generated = { replacement: true, second: 1 };
      // @ts-expect-error the untouched second constraint is still applied
      const missingSecond: Generated = { replacement: true };
      // @ts-expect-error the replacement remains authoritative
      const missingReplacement: Generated = { second: 1 };
    `);
  });

  test.each([
    [
      "nullable",
      {
        type: "object",
        nullable: true,
        properties: { value: { type: "string" } },
        allOf: [{ type: "object", required: ["value"] }],
      },
    ],
    [
      "type array",
      {
        type: ["object", "string"],
        properties: { value: { type: "string" } },
        allOf: [{ type: "object", required: ["value"] }],
      },
    ],
    [
      "anyOf union",
      {
        type: "object",
        properties: { value: { type: "string" } },
        allOf: [{ type: "object", required: ["value"] }],
        anyOf: [{ type: "string" }],
      },
    ],
    [
      "oneOf union",
      {
        type: "object",
        properties: { value: { type: "string" } },
        allOf: [{ type: "object", required: ["value"] }],
        oneOf: [{ type: "string" }],
      },
    ],
  ])("allOf > unsafe %s core does not prove exact callback object semantics", (_label, schema) => {
    const generated = generateComponentsAndConstrainedType({}, schema, (options) => {
      options.ctx.transform = () => undefined;
    });

    expect(generated.generated).not.toContain("WithRequiredObject");
    expect(generated.generated).toContain("Record<string, never>");
    expectTypeScriptToCompile(`${generated.source}
      declare const generated: Generated;
      const assignment: unknown = generated;
    `);
  });

  test("discriminator > synthesized outer core property remains in callback aggregate", () => {
    const generated = generateComponentsAndConstrainedType(
      {},
      {
        type: "object",
        properties: { name: { type: "string" } },
        allOf: [{ type: "object", required: ["name"] }],
      },
      (options) => {
        options.ctx.transform = () => undefined;
        options.ctx.discriminators = {
          objects: {
            [options.path ?? DEFAULT_OPTIONS.path]: { propertyName: "operation" },
          },
          refsHandled: [],
        };
      },
    );

    expect(generated.generated).toBe(`WithRequiredObject<{
    operation: "schema-object";
    name?: string;
}, "name">`);
    expectTypeScriptToCompile(`${generated.source}
      const valid: Generated = { operation: "schema-object", name: "value" };
      // @ts-expect-error synthesized discriminator does not replace the required name assertion
      const invalid: Generated = { operation: "schema-object" };
    `);
  });

  test("allOf > generated callback object helper has typed object semantics", () => {
    const options = optionsWithSchemas({
      Base: { type: "object", properties: { value: { type: "string" } } },
    });
    options.ctx.transform = () => undefined;
    transformSchemaObject(
      {
        allOf: [{ $ref: "#/components/schemas/Base" }, { type: "object", required: ["value"] }],
      } as any,
      options,
    );
    const helper = astToString(options.ctx.injectFooter).trim();

    expect(helper.match(/type WithRequiredObject</g)).toHaveLength(1);
    expectTypeScriptToCompile(`
      ${helper}

      type Optional = WithRequiredObject<{ value?: string }, "value">;
      const optional: Optional = { value: "value" };
      // @ts-expect-error implicit optional undefined is removed
      const optionalUndefined: Optional = { value: undefined };

      type ExplicitUndefined = WithRequiredObject<{ value?: string | undefined }, "value">;
      const explicitUndefined: ExplicitUndefined = { value: undefined };

      type ReadonlyValue = WithRequiredObject<{ readonly value?: string }, "value">;
      const readonlyValue: ReadonlyValue = { value: "value" };
      // @ts-expect-error readonly is preserved
      readonlyValue.value = "other";

      type Union = WithRequiredObject<{ value?: string } | { other: number }, "value">;
      const unionKnown: Union = { value: "value" };
      const unionMissing: Union = { other: 1, value: true };
      // @ts-expect-error every object branch requires value
      const unionInvalid: Union = { other: 1 };

      declare const symbolKey: unique symbol;
      type StringIndex = WithRequiredObject<{ [key: string]: number | undefined }, "value">;
      type NumberIndex = WithRequiredObject<{ [key: number]: string | undefined }, 1>;
      type SymbolIndex = WithRequiredObject<{ [key: symbol]: boolean | undefined }, typeof symbolKey>;
      const stringIndex: StringIndex = { value: 1 };
      const numberIndex: NumberIndex = { 1: "value" };
      const symbolIndex: SymbolIndex = { [symbolKey]: true };

      type Missing = WithRequiredObject<{ other: number }, "value">;
      const missing: Missing = { other: 1, value: "anything" };
      // @ts-expect-error a callback-removed key remains required
      const missingInvalid: Missing = { other: 1 };

      type UnknownValue = WithRequiredObject<unknown, "value">;
      type AnyValue = WithRequiredObject<any, "value">;
      const unknownValue: UnknownValue = { value: 1 };
      const anyValue: AnyValue = { value: 1 };
      // @ts-expect-error unknown still requires the key
      const unknownInvalid: UnknownValue = {};
      // @ts-expect-error any does not erase required presence
      const anyInvalid: AnyValue = {};

      type Primitive = WithRequiredObject<string | null, "value">;
      type ArrayValue = WithRequiredObject<readonly string[], "value">;
      type Callable = WithRequiredObject<() => string, "value">;
      type Constructor = WithRequiredObject<abstract new () => object, "value">;
      type GlobalFunction = WithRequiredObject<Function, "value">;
      type Nothing = WithRequiredObject<never, "value">;
      // @ts-expect-error primitives become never
      const primitive: Primitive = "value";
      // @ts-expect-error arrays become never
      const arrayValue: ArrayValue = Object.assign([], { value: 1 });
      // @ts-expect-error callables become never
      const callable: Callable = Object.assign(() => "value", { value: 1 });
      // @ts-expect-error constructors become never
      const constructorValue: Constructor = Object.assign(class {}, { value: 1 });
      // Nominal Function has no call/construct signature and remains structurally indistinguishable from an object.
      const globalFunction: GlobalFunction = Object.assign(() => "value", { value: 1 });
      // @ts-expect-error never remains never
      const nothing: Nothing = { value: 1 };
    `);
  });

  test("allOf > required-only transform replacement is authoritative", () => {
    const options = optionsWithSchemas({
      Base: { type: "object", properties: { required_string: { type: "string" } } },
    });
    options.ctx.transform = (schema) =>
      schema.required?.includes("required_string")
        ? ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
        : undefined;

    const result = astToString(
      transformSchemaObject(
        {
          allOf: [{ $ref: "#/components/schemas/Base" }, { type: "object", required: ["required_string"] }],
        } as any,
        options,
      ),
    );

    expect(result).toBe('components["schemas"]["Base"] & number\n');
  });

  test("allOf > required-only postTransform replacement is authoritative", () => {
    const options = optionsWithSchemas({
      Base: { type: "object", properties: { required_string: { type: "string" } } },
    });
    options.ctx.postTransform = (type) =>
      ts.isTypeReferenceNode(type) && ts.isIdentifier(type.typeName) && type.typeName.text === "Record"
        ? ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
        : undefined;

    const result = astToString(
      transformSchemaObject(
        {
          allOf: [{ $ref: "#/components/schemas/Base" }, { type: "object", required: ["required_string"] }],
        } as any,
        options,
      ),
    );

    expect(result).toBe('components["schemas"]["Base"] & number\n');
  });

  test("allOf > identity postTransform translates typed constraint and sees final helper", () => {
    const calls: string[] = [];
    const options = optionsWithSchemas({
      Base: { type: "object", properties: { required_string: { type: "string" } } },
    });
    options.ctx.postTransform = (type) => {
      calls.push(astToString(type).trim());
      return type;
    };

    const result = astToString(
      transformSchemaObject(
        {
          allOf: [{ $ref: "#/components/schemas/Base" }, { type: "object", required: ["required_string"] }],
        } as any,
        options,
      ),
    );

    expect(result).toBe('WithRequiredObject<components["schemas"]["Base"], "required_string">\n');
    expect(calls).toEqual([
      'components["schemas"]["Base"]',
      "Record<string, never>",
      'WithRequiredObject<components["schemas"]["Base"], "required_string">',
    ]);
  });

  test("allOf > callback order options and occurrence counts remain unchanged", () => {
    const sharedConstraint = { type: "object", required: ["required_string"] } as const;
    const schemas = { Base: { type: "object", properties: { required_string: { type: "string" } } } };
    const schema = {
      allOf: [{ $ref: "#/components/schemas/Base" }, sharedConstraint, sharedConstraint],
    };
    const baselineOptions = optionsWithSchemas(schemas);
    const baselineCalls: string[] = [];
    baselineOptions.ctx.transform = (item, callbackOptions) => {
      baselineCalls.push(
        `${callbackOptions.path}:${item.required?.includes("required_string") ? "constraint" : "other"}`,
      );
      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
    };
    const baseline = astToString(transformSchemaObject(schema as any, baselineOptions));

    const optimizedOptions = optionsWithSchemas(schemas);
    const optimizedCalls: string[] = [];
    optimizedOptions.ctx.transform = (item, callbackOptions) => {
      optimizedCalls.push(
        `${callbackOptions.path}:${item.required?.includes("required_string") ? "constraint" : "other"}`,
      );
      return undefined;
    };
    const optimized = astToString(transformSchemaObject(schema as any, optimizedOptions));

    expect(baseline).toBe('components["schemas"]["Base"] & number\n');
    expect(optimized).toBe('WithRequiredObject<components["schemas"]["Base"], "required_string">\n');
    expect(optimizedCalls).toEqual(baselineCalls);
    expect(optimizedCalls).toEqual([`${optimizedOptions.path}:constraint`, `${optimizedOptions.path}:constraint`]);
  });

  test("allOf > repeated object occurrences keep stateful callback results", () => {
    const sharedConstraint = { type: "object", required: ["required_string"] } as const;
    const options = optionsWithSchemas({
      Base: { type: "object", properties: { required_string: { type: "string" } } },
    });
    let calls = 0;
    options.ctx.transform = (schema) => {
      if (!schema.required?.includes("required_string")) {
        return undefined;
      }
      calls++;
      return ts.factory.createTypeLiteralNode([
        ts.factory.createPropertySignature(
          undefined,
          ts.factory.createIdentifier(`occurrence${calls}`),
          undefined,
          ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
        ),
      ]);
    };

    const result = astToString(
      transformSchemaObject(
        {
          allOf: [{ $ref: "#/components/schemas/Base" }, sharedConstraint, sharedConstraint],
        } as any,
        options,
      ),
    );

    expect(calls).toBe(2);
    expect(result).toContain("occurrence1: string");
    expect(result).toContain("occurrence2: string");
    expect(result).not.toContain("WithRequired");
  });

  test("allOf > completed callback aggregate supports keys spread across refs", () => {
    const options = optionsWithSchemas({
      First: { type: "object", properties: { first: { type: "string" } } },
      Second: { type: "object", properties: { second: { type: "number" } } },
    });
    options.ctx.transform = () => undefined;

    const result = astToString(
      transformSchemaObject(
        {
          allOf: [
            { $ref: "#/components/schemas/First" },
            { $ref: "#/components/schemas/Second" },
            { type: "object", required: ["first", "second"] },
          ],
        } as any,
        options,
      ),
    );

    expect(result).toBe(
      'WithRequiredObject<components["schemas"]["First"] & components["schemas"]["Second"], "first" | "second">\n',
    );
  });

  test("allOf > parent required joins surviving typed callback constraint", () => {
    const options = optionsWithSchemas({
      Base: {
        type: "object",
        properties: { parent: { type: "number" }, constraint: { type: "boolean" } },
      },
    });
    options.ctx.transform = () => undefined;

    const result = astToString(
      transformSchemaObject(
        {
          required: ["parent"],
          allOf: [{ $ref: "#/components/schemas/Base" }, { type: "object", required: ["constraint"] }],
        } as any,
        options,
      ),
    );

    expect(result).toBe('WithRequiredObject<components["schemas"]["Base"], "parent" | "constraint">\n');
  });

  test("allOf > callback aggregate keeps parent required names absent from raw properties", () => {
    const options = optionsWithSchemas({
      Base: { type: "object", properties: { constraint: { type: "boolean" } } },
    });
    options.ctx.transform = () => undefined;

    const result = astToString(
      transformSchemaObject(
        {
          required: ["callback_only"],
          allOf: [{ $ref: "#/components/schemas/Base" }, { type: "object", required: ["constraint"] }],
        } as any,
        options,
      ),
    ).trim();
    const footer = astToString(options.ctx.injectFooter).trim();

    expect(result).toBe('WithRequiredObject<components["schemas"]["Base"], "callback_only" | "constraint">');
    expectTypeScriptToCompile(`
      interface components { schemas: { Base: { constraint?: boolean } } }
      ${footer}
      type Generated = ${result};
      const valid: Generated = { callback_only: "unknown is accepted", constraint: true };
      // @ts-expect-error callback_only remains required even though it was absent from raw properties
      const missingParent: Generated = { constraint: true };
    `);
  });

  test("allOf > caller footer name conflict uses anonymous typed object constraint", () => {
    const options = optionsWithSchemas({
      Base: { type: "object", properties: { required_string: { type: "string" } } },
    });
    options.ctx.injectFooter = stringToAST("interface WithRequiredObject { caller: true }") as ts.Node[];
    options.ctx.transform = () => undefined;
    let sawOuterConditional = false;
    options.ctx.postTransform = (type) => {
      if (ts.isConditionalTypeNode(type)) {
        sawOuterConditional = true;
      }
      return type;
    };

    const result = astToString(
      transformSchemaObject(
        {
          allOf: [{ $ref: "#/components/schemas/Base" }, { type: "object", required: ["required_string"] }],
        } as any,
        options,
      ),
    ).trim();

    expect(result).not.toContain("WithRequiredObject<");
    expect(result).toContain("extends infer U");
    expect(sawOuterConditional).toBe(true);
    expect(options.ctx.injectFooter).toHaveLength(1);
    expectTypeScriptToCompile(`
      interface components { schemas: { Base: { required_string?: string } } }
      ${astToString(options.ctx.injectFooter)}
      type Generated = ${result};
      const valid: Generated = { required_string: "value" };
      // @ts-expect-error required_string remains required
      const invalid: Generated = {};
    `);
  });

  test("allOf > unknown raw key remains ordinary callback member", () => {
    let calls = 0;
    const options = optionsWithSchemas({
      Base: { type: "object", properties: { known: { type: "string" } } },
    });
    options.ctx.transform = () => {
      calls++;
      return undefined;
    };

    const result = astToString(
      transformSchemaObject(
        {
          allOf: [{ $ref: "#/components/schemas/Base" }, { type: "object", required: ["unknown"] }],
        } as any,
        options,
      ),
    );

    expect(result).toBe('components["schemas"]["Base"] & Record<string, never>\n');
    expect(result).not.toContain("WithRequired");
    expect(calls).toBe(1);
  });

  test("allOf > untyped callback constraint stays on the baseline path", () => {
    const options = optionsWithSchemas({
      Polymorphic: {
        type: ["object", "string"],
        properties: { required_string: { type: "string" } },
      },
    });
    options.ctx.transform = () => undefined;

    const result = astToString(
      transformSchemaObject(
        {
          allOf: [{ $ref: "#/components/schemas/Polymorphic" }, { required: ["required_string"] }],
        } as any,
        options,
      ),
    );

    expect(result).toBe('components["schemas"]["Polymorphic"] & unknown\n');
    expect(result).not.toContain("WithRequired");
  });

  test("discriminator > callback typed constraint preserves Omit ordering", () => {
    const options = optionsWithSchemas({
      parent: {
        type: "object",
        properties: { operation: { type: "string" }, name: { type: "string" } },
      },
    });
    options.ctx.postTransform = (type) => type;
    options.ctx.discriminators = {
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
    };

    const result = astToString(
      transformSchemaObject(
        {
          type: "object",
          allOf: [{ $ref: "#/components/schemas/parent" }, { type: "object", required: ["name"] }],
        } as any,
        options,
      ),
    );

    expect(result).toBe(`WithRequiredObject<{
    operation: "test";
} & Omit<components["schemas"]["parent"], "operation">, "name">\n`);
  });

  test("allOf > generated required constraint types compile", () => {
    const scrambleOptions = optionsWithSchemas({
      Base: {
        type: "object",
        properties: { required_string: { type: "string" } },
      },
    });
    const scramble = astToString(
      transformSchemaObject(
        {
          allOf: [{ $ref: "#/components/schemas/Base" }, { type: "object", required: ["required_string"] }],
        } as any,
        scrambleOptions,
      ),
    ).trim();
    expectTypeScriptToCompile(`
      type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
      interface components { schemas: { Base: { required_string?: string } } }
      type Generated = ${scramble};
      const valid: Generated = { required_string: "value" };
      // @ts-expect-error required_string is required
      const invalid: Generated = {};
    `);

    const untyped = astToString(
      transformSchemaObject(
        {
          allOf: [{ $ref: "#/components/schemas/Base" }, { required: ["required_string"] }],
        } as any,
        optionsWithSchemas({
          Base: {
            type: "object",
            properties: { required_string: { type: "string" } },
          },
        }),
      ),
    ).trim();
    expectTypeScriptToCompile(`
      type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
      interface components { schemas: { Base: { required_string?: string } } }
      type Generated = ${untyped};
      const valid: Generated = { required_string: "value" };
      // @ts-expect-error required_string is required
      const invalid: Generated = {};
    `);

    const nullableOptions = optionsWithSchemas({
      NullableBase: {
        type: ["object", "null"],
        properties: { required_string: { type: "string" } },
      },
    });
    const nullable = astToString(
      transformSchemaObject(
        {
          allOf: [{ $ref: "#/components/schemas/NullableBase" }, { type: "object", required: ["required_string"] }],
        } as any,
        nullableOptions,
      ),
    ).trim();
    expectTypeScriptToCompile(`
      interface components { schemas: { NullableBase: { required_string?: string } | null } }
      type Generated = ${nullable};
      // @ts-expect-error the retained typed constraint remains unassignable
      const invalid: Generated = { required_string: "value" };
    `);

    const deprecatedOptions = optionsWithSchemas({
      Base: {
        type: "object",
        properties: { deprecated_key: { type: "string", deprecated: true } },
      },
    });
    deprecatedOptions.ctx.excludeDeprecated = true;
    const deprecated = astToString(
      transformSchemaObject(
        {
          allOf: [{ $ref: "#/components/schemas/Base" }, { required: ["deprecated_key"] }],
        } as any,
        deprecatedOptions,
      ),
    ).trim();
    expectTypeScriptToCompile(`
      interface components { schemas: { Base: Record<string, never> } }
      type Generated = ${deprecated};
      const valid: Generated = {};
    `);

    const transformPropertyOptions = { ...DEFAULT_OPTIONS, ctx: { ...DEFAULT_OPTIONS.ctx } };
    transformPropertyOptions.ctx.transformProperty = (property) =>
      ts.factory.updatePropertySignature(
        property,
        property.modifiers,
        ts.factory.createIdentifier("renamed"),
        property.questionToken,
        property.type,
      );
    const renamed = astToString(
      transformSchemaObject(
        {
          allOf: [{ type: "object", properties: { original: { type: "string" } } }, { required: ["original"] }],
        } as any,
        transformPropertyOptions,
      ),
    ).trim();
    expect(renamed).toBe(`{
    renamed?: string;
} & unknown`);
    expectTypeScriptToCompile(`
      type Generated = ${renamed};
      const valid: Generated = { renamed: "value" };
    `);

    const union = astToString(
      transformSchemaObject(
        {
          allOf: [{ $ref: "#/components/schemas/Base" }, { required: ["required_string"] }],
          anyOf: [{ type: "string" }],
        } as any,
        optionsWithSchemas({
          Base: {
            type: "object",
            properties: { required_string: { type: "string" } },
          },
        }),
      ),
    ).trim();
    expectTypeScriptToCompile(`
      interface components { schemas: { Base: { required_string?: string } } }
      type Generated = ${union};
      const objectValue: Generated = {};
      const stringValue: Generated = "value";
    `);

    const polymorphicOptions = optionsWithSchemas({
      Polymorphic: {
        type: ["object", "string"],
        properties: { required_string: { type: "string" } },
      },
    });
    const polymorphic = astToString(
      transformSchemaObject(
        {
          allOf: [{ $ref: "#/components/schemas/Polymorphic" }, { required: ["required_string"] }],
        } as any,
        polymorphicOptions,
      ),
    ).trim();
    expect(polymorphic).toBe('components["schemas"]["Polymorphic"] & unknown');
    expectTypeScriptToCompile(`
      interface components { schemas: { Polymorphic: { required_string?: string } | string } }
      type Generated = ${polymorphic};
      const objectValue: Generated = {};
      const stringValue: Generated = "value";
    `);

    const typedPolymorphic = astToString(
      transformSchemaObject(
        {
          allOf: [{ $ref: "#/components/schemas/Polymorphic" }, { type: "object", required: ["required_string"] }],
        } as any,
        polymorphicOptions,
      ),
    ).trim();
    expect(typedPolymorphic).toBe('components["schemas"]["Polymorphic"] & Record<string, never>');
    expectTypeScriptToCompile(`
      interface components { schemas: { Polymorphic: { required_string?: string } | string } }
      type Generated = ${typedPolymorphic};
      // @ts-expect-error the retained object constraint remains unassignable
      const invalid: Generated = { required_string: "value" };
    `);

    const handledDiscriminatorOptions = optionsWithSchemas({
      parent: {
        type: "object",
        required: ["operation"],
        properties: {
          operation: { type: "string", enum: ["test"] },
          name: { type: "string" },
        },
      },
    });
    handledDiscriminatorOptions.ctx.discriminators = {
      objects: {
        "#/components/schemas/parent": {
          propertyName: "operation",
          mapping: { test: DEFAULT_OPTIONS.path },
        },
      },
      refsHandled: ["#/components/schemas/parent"],
    };
    const handledDiscriminator = astToString(
      transformSchemaObject(
        {
          allOf: [{ $ref: "#/components/schemas/parent" }, { required: ["name"] }],
        } as any,
        handledDiscriminatorOptions,
      ),
    ).trim();
    expectTypeScriptToCompile(`
      type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
      interface components { schemas: { parent: { operation: "test"; name?: string } } }
      type Generated = ${handledDiscriminator};
      const valid: Generated = { name: "value" };
      // @ts-expect-error name is required after omitting the discriminator property
      const invalid: Generated = {};
    `);
  });

  test("allOf > generated components and constrained types compile together", () => {
    const baseSchemas = {
      Base: {
        type: "object",
        properties: { required_string: { type: "string" } },
      },
    };
    const scramble = generateComponentsAndConstrainedType(baseSchemas, {
      allOf: [{ $ref: "#/components/schemas/Base" }, { type: "object", required: ["required_string"] }],
    });
    expectTypeScriptToCompile(`${scramble.source}
      const valid: Generated = { required_string: "value" };
      // @ts-expect-error required_string is required
      const invalid: Generated = {};
    `);

    const constantSchemas = {
      Constant: {
        type: "object",
        const: {},
        properties: { required_string: { type: "string" } },
      },
    };
    for (const constraint of [{ required: ["required_string"] }, { type: "object", required: ["required_string"] }]) {
      const constant = generateComponentsAndConstrainedType(constantSchemas, {
        allOf: [{ $ref: "#/components/schemas/Constant" }, constraint],
      });
      expect(constant.generated).not.toContain("WithRequired");
      expectTypeScriptToCompile(`${constant.source}
        type Check = Generated;
      `);
    }

    const enumerated = generateComponentsAndConstrainedType(
      {
        Enumerated: {
          enum: ["fixed"],
          allOf: [
            {
              type: "object",
              properties: { required_string: { type: "string" } },
            },
          ],
        },
      },
      {
        allOf: [{ $ref: "#/components/schemas/Enumerated" }, { required: ["required_string"] }],
      },
    );
    expect(enumerated.generated).not.toContain("WithRequired");
    expectTypeScriptToCompile(`${enumerated.source}
      const valid: Generated = "fixed";
    `);

    const polymorphic = generateComponentsAndConstrainedType(
      {
        Polymorphic: {
          type: ["object", "string"],
          properties: { required_string: { type: "string" } },
        },
      },
      {
        allOf: [{ $ref: "#/components/schemas/Polymorphic" }, { required: ["required_string"] }],
      },
    );
    expect(polymorphic.generated).not.toContain("WithRequired");
    expectTypeScriptToCompile(`${polymorphic.source}
      const objectValue: Generated = {};
      const stringValue: Generated = "value";
    `);

    const nullable = generateComponentsAndConstrainedType(
      {
        Nullable: {
          type: ["object", "null"],
          properties: { required_string: { type: "string" } },
        },
      },
      {
        allOf: [{ $ref: "#/components/schemas/Nullable" }, { type: "object", required: ["required_string"] }],
      },
    );
    expect(nullable.generated).not.toContain("WithRequired");
    expectTypeScriptToCompile(`${nullable.source}
      type Check = Generated;
    `);

    const deprecated = generateComponentsAndConstrainedType(
      {
        Deprecated: {
          type: "object",
          properties: { old: { type: "string", deprecated: true } },
        },
      },
      {
        allOf: [{ $ref: "#/components/schemas/Deprecated" }, { required: ["old"] }],
      },
      (options) => {
        options.ctx.excludeDeprecated = true;
      },
    );
    expect(deprecated.generated).not.toContain("WithRequired");
    expectTypeScriptToCompile(`${deprecated.source}
      const valid: Generated = {};
    `);

    const renamed = generateComponentsAndConstrainedType(
      {
        Renamed: {
          type: "object",
          properties: { original: { type: "string" } },
        },
      },
      {
        allOf: [{ $ref: "#/components/schemas/Renamed" }, { required: ["original"] }],
      },
      (options) => {
        options.ctx.transformProperty = (property) =>
          ts.factory.updatePropertySignature(
            property,
            property.modifiers,
            ts.factory.createIdentifier("renamed"),
            property.questionToken,
            property.type,
          );
      },
    );
    expect(renamed.generated).not.toContain("WithRequired");
    expectTypeScriptToCompile(`${renamed.source}
      const valid: Generated = { renamed: "value" };
    `);
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

function generateComponentsAndConstrainedType(
  schemas: Record<string, any>,
  constrainedSchema: any,
  configure?: (options: ReturnType<typeof optionsWithSchemas>) => void,
) {
  const options = optionsWithSchemas(schemas);
  options.ctx.injectFooter = [];
  configure?.(options);
  const componentTypes = Object.entries(schemas)
    .map(([name, schema]) => {
      const type = astToString(
        transformSchemaObject(schema, {
          ...options,
          path: `#/components/schemas/${name}`,
        }),
      ).trim();
      return `${JSON.stringify(name)}: ${type};`;
    })
    .join("\n");
  const generated = astToString(transformSchemaObject(constrainedSchema, options)).trim();
  const footer = astToString(options.ctx.injectFooter).trim();

  return {
    generated,
    source: `
      interface components { schemas: { ${componentTypes} } }
      type Generated = ${generated};
      ${footer}
    `,
  };
}

function expectTypeScriptToCompile(source: string) {
  const fileName = "/required-constraint.test.ts";
  const compilerOptions: ts.CompilerOptions = {
    exactOptionalPropertyTypes: true,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    noEmit: true,
    skipLibCheck: true,
    strict: true,
    target: ts.ScriptTarget.ESNext,
  };
  const host = ts.createCompilerHost(compilerOptions);
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.ESNext, true);
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (name, languageVersion, onError, shouldCreateNewSourceFile) =>
    name === fileName ? sourceFile : getSourceFile(name, languageVersion, onError, shouldCreateNewSourceFile);
  const fileExists = host.fileExists.bind(host);
  host.fileExists = (name) => name === fileName || fileExists(name);
  const readFile = host.readFile.bind(host);
  host.readFile = (name) => (name === fileName ? source : readFile(name));

  const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([fileName], compilerOptions, host));
  expect(diagnostics.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"))).toEqual([]);
}
