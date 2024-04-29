import { fileURLToPath } from "node:url";
import { astToString } from "../../../src/lib/ts.js";
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
          expect(result).toMatchFileSnapshot(fileURLToPath(want));
        } else {
          expect(result).toBe(`${want}\n`);
        }
      },
      ci?.timeout,
    );
  }
});
