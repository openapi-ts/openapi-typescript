import type { SchemaObject } from "../src/types.js";
import transformSchemaObject, { TransformSchemaObjectOptions } from "../src/transform/schema-object.js";

const options: TransformSchemaObjectOptions = {
  path: "#/test/schema-object",
  ctx: {
    additionalProperties: false,
    alphabetize: false,
    emptyObjectsUnknown: false,
    defaultNonNullable: false,
    discriminators: {},
    immutableTypes: false,
    indentLv: 0,
    operations: {},
    parameters: {},
    pathParamsAsTypes: false,
    postTransform: undefined,
    silent: true,
    supportArrayLength: false,
    transform: undefined,
    excludeDeprecated: false,
  },
};

describe("Schema Object", () => {
  describe("boolean schema", () => {
    it("true", () => {
      expect(transformSchemaObject(true as any, options)).toBe("unknown");
    });
    it("false", () => {
      expect(transformSchemaObject(false as any, options)).toBe("never");
    });
  });
  describe("data types", () => {
    describe("string", () => {
      test("basic", () => {
        const schema: SchemaObject = { type: "string" };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe("string");
      });

      test("enum", () => {
        const schema: SchemaObject = { type: "string", enum: ["blue", "green", "yellow", ""] };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe('"blue" | "green" | "yellow" | ""');
      });

      test("enum (inferred)", () => {
        const schema: SchemaObject = {
          properties: {
            status: { enum: ["complete", "incomplete"] },
          },
        } as any;
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe(`{
  /** @enum {unknown} */
  status?: "complete" | "incomplete";
}`);
      });

      test("enum (whitespace)", () => {
        const schema: SchemaObject = { type: "string", enum: [" blue", "green ", " ", ""] };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe('" blue" | "green " | " " | ""');
      });
    });

    describe("number", () => {
      test("basic", () => {
        const schema: SchemaObject = { type: "number" };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe("number");
      });

      test("enum", () => {
        const schema: SchemaObject = { type: "number", enum: [50, 100, 200] };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe("50 | 100 | 200");
      });

      test("integer", () => {
        const schema: SchemaObject = { type: "integer" };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe("number");
      });
    });

    describe("boolean", () => {
      test("basic", () => {
        const schema: SchemaObject = { type: "boolean" };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe("boolean");
      });

      test("enum", () => {
        const schema: SchemaObject = { type: "boolean", enum: [true] };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe("true");
      });
    });

    describe("array", () => {
      test("basic", () => {
        const schema: SchemaObject = { type: "array", items: { type: "string" } };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe("string[]");
      });

      test("tuple array", () => {
        const schema: SchemaObject = { type: "array", items: [{ type: "string" }, { type: "number" }], minItems: 2, maxItems: 2 };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe("[string, number]");
      });

      test("ref", () => {
        const schema: SchemaObject = { type: "array", items: { $ref: 'components["schemas"]["ArrayItem"]' } };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe('components["schemas"]["ArrayItem"][]');
      });
    });

    describe("object", () => {
      test("empty", () => {
        const schema: SchemaObject = {
          type: "object",
        };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe(`Record<string, never>`);
      });

      test("empty with emptyObjectsUnknown", () => {
        const schema: SchemaObject = {
          type: "object",
        };
        const generated = transformSchemaObject(schema, {
          ...options,
          ctx: { ...options.ctx, emptyObjectsUnknown: true },
        });
        expect(generated).toBe(`Record<string, unknown>`);
      });

      test("basic", () => {
        const schema: SchemaObject = {
          type: "object",
          properties: { required: { type: "boolean" }, optional: { type: "boolean" } },
          required: ["required"],
        };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe(`{
  required: boolean;
  optional?: boolean;
}`);
      });

      test("const string field", () => {
        const schema: SchemaObject = {
          type: "object",
          properties: { constant: { const: "a", type: "string" } },
          required: ["constant"],
        };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe(`{
  /** @constant */
  constant: "a";
}`);
      });

      test("const number field", () => {
        const schema: SchemaObject = {
          type: "object",
          properties: { constant: { const: 1, type: "number" } },
          required: ["constant"],
        };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe(`{
  /** @constant */
  constant: 1;
}`);
      });

      test("const number field which is 0", () => {
        const schema: SchemaObject = {
          type: "object",
          properties: { constant: { const: 0, type: "number" } },
          required: ["constant"],
        };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe(`{
  /** @constant */
  constant: 0;
}`);
      });

      test("additionalProperties with properties", () => {
        const schema: SchemaObject = {
          type: "object",
          properties: { property: { type: "boolean" } },
          additionalProperties: { type: "string" },
        };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe(`{
  property?: boolean;
  [key: string]: string | undefined;
}`);
      });

      test("additionalProperties with all required properties", () => {
        const schema: SchemaObject = {
          type: "object",
          properties: { property: { type: "boolean" } },
          additionalProperties: { type: "string" },
          required: ["property"],
        };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe(`{
  property: boolean;
  [key: string]: string;
}`);
      });

      test("additionalProperties with partly required properties", () => {
        const schema: SchemaObject = {
          type: "object",
          properties: { property: { type: "boolean" }, property2: { type: "boolean" } },
          additionalProperties: { type: "string" },
          required: ["property"],
        };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe(`{
  property: boolean;
  property2?: boolean;
  [key: string]: string | undefined;
}`);
      });

      test("additionalProperties: true", () => {
        const schema: SchemaObject = { type: "object", additionalProperties: true };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe(`{
  [key: string]: unknown;
}`);
      });

      test("additionalProperties: SchemaObject", () => {
        const schema: SchemaObject = {
          type: "object",
          additionalProperties: { type: "string" },
        };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe(`{
  [key: string]: string;
}`);
      });

      test("additionalProperties: {}", () => {
        const schema: SchemaObject = { type: "object", additionalProperties: {} };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe(`{
  [key: string]: unknown;
}`);
      });
    });

    describe("const", () => {
      test("string", () => {
        const generated = transformSchemaObject({ type: "string", const: "duck" }, options);
        expect(generated).toBe(`"duck"`);
      });

      test("number", () => {
        const generated = transformSchemaObject({ type: "number", const: 42 }, options);
        expect(generated).toBe("42");
      });

      test("string, no type specified", () => {
        const generated = transformSchemaObject({ const: "99" }, options);
        expect(generated).toBe(`"99"`);
      });

      test("number, no type specified", () => {
        const generated = transformSchemaObject({ const: 300 }, options);
        expect(generated).toBe("300");
      });
    });

    describe("nullable", () => {
      describe("3.0 nullable", () => {
        test("string", () => {
          const generated = transformSchemaObject({ type: "string", nullable: true }, options);
          expect(generated).toBe("string | null");
        });

        test("number", () => {
          const generated = transformSchemaObject({ type: "number", nullable: true }, options);
          expect(generated).toBe("number | null");
        });

        test("boolean", () => {
          const generated = transformSchemaObject({ type: "boolean", nullable: true }, options);
          expect(generated).toBe("boolean | null");
        });

        test("array", () => {
          const generated = transformSchemaObject({ type: "array", items: { type: "string" }, nullable: true }, options);
          expect(generated).toBe("string[] | null");
        });

        test("object", () => {
          const generated = transformSchemaObject({ type: "object", properties: { string: { type: "string" } }, nullable: true }, options);
          expect(generated).toBe(`{
  string?: string;
} | null`);
        });
      });

      describe("3.1 nullable", () => {
        test("string", () => {
          const generated = transformSchemaObject({ type: ["string", "null"] }, options);
          expect(generated).toBe("string | null");
        });

        test("number", () => {
          const generated = transformSchemaObject({ type: ["number", "null"] }, options);
          expect(generated).toBe("number | null");
        });

        test("integer", () => {
          const generated = transformSchemaObject({ type: ["integer", "null"] }, options);
          expect(generated).toBe("number | null");
        });

        test("boolean", () => {
          const generated = transformSchemaObject({ type: ["boolean", "null"] }, options);
          expect(generated).toBe("boolean | null");
        });

        test("array", () => {
          const generated = transformSchemaObject({ type: ["array", "null"], items: { type: "string" } } as any, options);
          expect(generated).toBe("string[] | null");
        });

        test("object", () => {
          const generated = transformSchemaObject({ type: ["object", "null"], properties: { string: { type: "string" } } }, options);
          expect(generated).toBe(`{
  string?: string;
} | null`);
        });
      });
    });

    describe("polymorphic", () => {
      test("nullish primitive", () => {
        const generated = transformSchemaObject({ type: ["string", "boolean", "number", "null"] }, options);
        expect(generated).toBe("string | boolean | number | null");
      });

      test("enum + polymorphism + nullable 1", () => {
        const generated = transformSchemaObject({ type: ["string", "null"], enum: ["blue", "green", "yellow"] }, options);
        expect(generated).toBe(`"blue" | "green" | "yellow"`);
      });

      test("enum + polymorphism + nullable 2", () => {
        const generated = transformSchemaObject({ type: ["string", "null"], enum: ["", "blue", "green", "yellow"] }, options);
        expect(generated).toBe(`"" | "blue" | "green" | "yellow"`);
      });

      test("enum + polymorphism + nullable 3", () => {
        const generated = transformSchemaObject({ type: ["string", "null"], enum: [null, "blue", "green", "yellow"] }, options);
        expect(generated).toBe(`null | "blue" | "green" | "yellow"`);
      });
    });

    test("unknown", () => {
      const generated = transformSchemaObject({}, options);
      expect(generated).toBe(`unknown`);
    });

    test("unknown nullable", () => {
      const generated = transformSchemaObject({ nullable: true }, options);
      expect(generated).toBe(`unknown`);
    });
  });

  describe("schema composition", () => {
    describe("oneOf", () => {
      test("primitive", () => {
        const schema: SchemaObject = {
          oneOf: [{ type: "string" }, { type: "number" }],
        };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe("string | number");
      });

      test("const string", () => {
        const schema: SchemaObject = {
          oneOf: [
            { type: "string", const: "hello" },
            { type: "string", const: "world" },
          ],
        };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe('"hello" | "world"');
      });

      test("const number", () => {
        const schema: SchemaObject = {
          oneOf: [
            { type: "number", const: 0 },
            { type: "number", const: 1 },
          ],
        };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe("0 | 1");
      });

      test("empty object + oneOf is ignored", () => {
        const schema: SchemaObject = {
          type: "object",
          oneOf: [
            {
              title: "DetailsId",
              type: "object",
              required: ["id"],
              properties: {
                id: { type: "string", description: "The ID of an existing resource that exists before the pipeline is run." },
              },
            },
            {
              title: "DetailsFrom",
              type: "object",
              required: ["from"],
              properties: {
                from: {
                  type: "object",
                  description: "The stage and step to report on.",
                  required: ["step"],
                  properties: { stage: { type: "string", description: "An identifier for the stage the step being reported on resides in." }, step: { type: "string", description: "An identifier for the step to be reported on." } },
                },
              },
            },
          ],
        };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe(`OneOf<[{
  /** @description The ID of an existing resource that exists before the pipeline is run. */
  id: string;
}, {
  /** @description The stage and step to report on. */
  from: {
    /** @description An identifier for the stage the step being reported on resides in. */
    stage?: string;
    /** @description An identifier for the step to be reported on. */
    step: string;
  };
}]>`);
      });

      test("nullable: true", () => {
        const schema: SchemaObject = { nullable: true, oneOf: [{ type: "integer" }, { type: "string" }] };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe("number | string | null");
      });

      test("complex", () => {
        const schema: SchemaObject = {
          oneOf: [
            { type: "object", properties: { string: { type: "string" } }, required: ["string"] },
            { type: "object", properties: { boolean: { type: "boolean" } }, required: ["boolean"] },
            { type: "object", properties: { number: { type: "number" } }, required: ["number"] },
          ],
        };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe(`OneOf<[{
  string: string;
}, {
  boolean: boolean;
}, {
  number: number;
}]>`);
      });

      test("oneOf + properties", () => {
        const schema = {
          type: "object",
          oneOf: [
            { type: "object", properties: { foo: { type: "string" } } },
            { type: "object", properties: { bar: { type: "string" } } },
          ],
          properties: {
            baz: { type: "string" },
          },
        } as SchemaObject;
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe(`{
  baz?: string;
} & OneOf<[{
  foo?: string;
}, {
  bar?: string;
}]>`);
      });

      test("oneOf + array type", () => {
        const schema = {
          oneOf: [{ type: "integer" }, { type: "string" }],
          type: ["null", "integer", "string"],
        };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe("number | string | null");
      });

      test("enum (acting as oneOf)", () => {
        const schema: SchemaObject = {
          type: "object",
          additionalProperties: true,
          enum: [{ $ref: "#/components/schemas/simple-user" }, { $ref: "#/components/schemas/team" }, { $ref: "#/components/schemas/organization" }],
        };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe(`{
  [key: string]: unknown;
} & (#/components/schemas/simple-user | #/components/schemas/team | #/components/schemas/organization)`);
      });

      test("falls back to union at high complexity", () => {
        const schema: SchemaObject = {
          oneOf: [
            { type: "object", properties: { string: { type: "string" } }, required: ["string"] },
            { type: "object", properties: { boolean: { type: "boolean" } }, required: ["boolean"] },
            { type: "object", properties: { number: { type: "number" } }, required: ["number"] },
            { type: "object", properties: { array: { type: "array", items: { type: "string" } } }, required: ["array"] },
            { type: "object", properties: { object: { type: "object", properties: { string: { type: "string" } }, required: ["string"] } }, required: ["object"] },
            { type: "object", properties: { enum: { type: "string", enum: ["foo", "bar", "baz"] } }, required: ["enum"] },
          ],
        };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe(`{
  string: string;
} | {
  boolean: boolean;
} | {
  number: number;
} | {
  array: string[];
} | {
  object: {
    string: string;
  };
} | ({
  /** @enum {string} */
  enum: "foo" | "bar" | "baz";
})`);
      });

      test("discriminator", () => {
        const schema: SchemaObject = {
          type: "object",
          allOf: [{ $ref: 'components["schemas"]["parent"]' }, { type: "object", properties: { string: { type: "string" } } }],
        };
        const generated = transformSchemaObject(schema, {
          path: options.path,
          ctx: {
            ...options.ctx,
            discriminators: {
              'components["schemas"]["parent"]': {
                propertyName: "operation",
                mapping: {
                  test: options.path,
                },
              },
            },
          },
        });
        expect(generated).toBe(`{
  operation: "test";
} & Omit<components["schemas"]["parent"], "operation"> & {
  string?: string;
}`);
      });

      test("discriminator (oneOf)", () => {
        const schema: SchemaObject = {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
          },
        };
        const generated = transformSchemaObject(schema, {
          path: "#/components/schemas/Cat",
          ctx: {
            ...options.ctx,
            discriminators: {
              'components["schemas"]["Pet"]': {
                propertyName: "petType",
                oneOf: ["#/components/schemas/Cat"],
              },
            },
          },
        });
        expect(generated).toBe(`{
  petType: "Cat";
  name: string;
}`);
      });

      test("discriminator without mapping and oneOf and null", () => {
        const schema: SchemaObject = {
          oneOf: [{ $ref: 'components["schemas"]["parent"]' }, { type: "null" }],
        };
        const generated = transformSchemaObject(schema, {
          path: options.path,
          ctx: {
            ...options.ctx,
            discriminators: {
              'components["schemas"]["parent"]': { propertyName: "operation" },
            },
          },
        });
        expect(generated).toBe(`{
  operation: "schema-object";
} & (Omit<components["schemas"]["parent"], "operation"> | null)`);
      });

      test("discriminator escape", () => {
        const schema: SchemaObject = {
          type: "object",
          allOf: [{ $ref: 'components["schemas"]["parent"]' }, { type: "object", properties: { string: { type: "string" } } }],
        };
        const generated = transformSchemaObject(schema, {
          path: options.path,
          ctx: {
            ...options.ctx,
            discriminators: {
              'components["schemas"]["parent"]': {
                propertyName: "@type",
                mapping: {
                  test: options.path,
                },
              },
            },
          },
        });
        expect(generated).toBe(`{
  "@type": "test";
} & Omit<components["schemas"]["parent"], "@type"> & {
  string?: string;
}`);
      });

      test("discriminator with automatic propertyName", () => {
        const schema: SchemaObject = {
          type: "object",
          allOf: [{ $ref: 'components["schemas"]["Pet"]' }],
          properties: {
            bark: { type: "boolean" },
          },
          additionalProperties: false,
        };
        const generated = transformSchemaObject(schema, {
          path: "#/components/schemas/Dog",
          ctx: {
            ...options.ctx,
            discriminators: {
              'components["schemas"]["Pet"]': { propertyName: "_petType" },
            },
          },
        });
        expect(generated).toBe(`{
  _petType: "Dog";
  bark?: boolean;
} & Omit<components["schemas"]["Pet"], "_petType">`);
      });
    });

    describe("allOf", () => {
      test("basic", () => {
        const schema: SchemaObject = {
          allOf: [
            {
              type: "object",
              properties: { red: { type: "number" }, blue: { type: "number" } },
              required: ["red", "blue"],
            },
            { type: "object", properties: { green: { type: "number" } }, required: ["green"] },
          ],
        };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe(`{
  red: number;
  blue: number;
} & {
  green: number;
}`);
      });

      test("sibling required", () => {
        const schema: SchemaObject = {
          required: ["red", "blue", "green"],
          allOf: [
            {
              type: "object",
              properties: { red: { type: "number" }, blue: { type: "number" } },
            },
            { type: "object", properties: { green: { type: "number" } } },
          ],
        };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe(`WithRequired<{
  red?: number;
  blue?: number;
} & {
  green?: number;
}, "red" | "blue" | "green">`);
      });
    });

    describe("anyOf", () => {
      test("basic", () => {
        const schema: SchemaObject = {
          anyOf: [
            { type: "object", properties: { red: { type: "number" } }, required: ["red"] },
            { type: "object", properties: { blue: { type: "number" } }, required: ["blue"] },
            { type: "object", properties: { green: { type: "number" } }, required: ["green"] },
          ],
        };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe(`{
  red: number;
} | {
  blue: number;
} | {
  green: number;
}`);
      });
    });
  });

  describe("options", () => {
    describe("additionalProperties", () => {
      test("true", () => {
        const schema: SchemaObject = {
          type: "object",
          properties: {
            fixed: { type: "boolean" },
          },
          required: ["fixed"],
        };
        const generated = transformSchemaObject(schema, {
          ...options,
          ctx: { ...options.ctx, additionalProperties: true },
        });
        expect(generated).toBe(`{
  fixed: boolean;
  [key: string]: unknown;
}`);
      });
    });

    describe("emptyObjectsUnknown", () => {
      describe("with object with no specified properties", () => {
        const schema: SchemaObject = {
          type: "object",
        };

        test("true", () => {
          const generated = transformSchemaObject(schema, {
            ...options,
            ctx: { ...options.ctx, emptyObjectsUnknown: true },
          });
          expect(generated).toBe(`Record<string, unknown>`);
        });

        test("false", () => {
          const generated = transformSchemaObject(schema, {
            ...options,
            ctx: { ...options.ctx, emptyObjectsUnknown: false },
          });
          expect(generated).toBe(`Record<string, never>`);
        });
      });
    });

    describe("defaultNonNullable", () => {
      test("true", () => {
        const schema: SchemaObject = {
          type: "object",
          properties: {
            required: { type: "boolean" },
            requiredDefault: { type: "boolean", default: false },
            optional: { type: "boolean" },
            optionalDefault: { type: "boolean", default: false },
          },
          required: ["required", "requiredDefault"],
        };
        const generated = transformSchemaObject(schema, {
          ...options,
          ctx: { ...options.ctx, defaultNonNullable: true },
        });
        expect(generated).toBe(`{
  required: boolean;
  /** @default false */
  requiredDefault: boolean;
  optional?: boolean;
  /** @default false */
  optionalDefault: boolean;
}`);
      });
    });

    test("supportArrayLength", () => {
      const opts = { ...options, ctx: { ...options.ctx, supportArrayLength: true } };
      expect(transformSchemaObject({ type: "array", items: { type: "string" } }, options)).toBe(`string[]`);
      expect(transformSchemaObject({ type: "array", items: { type: "string" }, minItems: 1 }, opts)).toBe(`[string, ...string[]]`);
      expect(transformSchemaObject({ type: "array", items: { type: "string" }, maxItems: 2 }, opts)).toBe(`[] | [string] | [string, string]`);
      expect(transformSchemaObject({ type: "array", items: { type: "string" }, maxItems: 20 }, opts)).toBe(`string[]`);
    });

    test("prefixItems", () => {
      const schema: SchemaObject = {
        type: "array",
        items: { type: "number" },
        prefixItems: [{ type: "number" }, { type: "number" }, { type: "number" }],
      };
      const generated = transformSchemaObject(schema, options);
      expect(generated).toBe(`[number, number, number]`);
    });

    describe("immutableTypes", () => {
      test("nullable array of records property", () => {
        const schema: SchemaObject = {
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
        };
        const generated = transformSchemaObject(schema, {
          ...options,
          ctx: { ...options.ctx, immutableTypes: true },
        });
        expect(generated).toBe(`{
  readonly array?: (readonly {
      [key: string]: unknown;
    }[]) | null;
}`);
      });

      test("readonly arrays", () => {
        const schema: SchemaObject = {
          type: "array",
          items: {
            type: "array",
            items: {
              type: "string",
            },
          },
        };

        const generated = transformSchemaObject(schema, {
          ...options,
          ctx: { ...options.ctx, immutableTypes: true },
        });
        expect(generated).toBe(`readonly (readonly string[])[]`);
      });
    });
  });

  describe("JSONSchema", () => {
    test("$defs are kept (for types that can hold them)", () => {
      const generated = transformSchemaObject(
        {
          type: "object",
          properties: {
            foo: { type: "string" },
          },
          $defs: {
            defEnum: { type: "string", enum: ["one", "two", "three"] },
          },
        },
        options,
      );
      expect(generated).toBe(`{
  foo?: string;
  $defs: {
    /** @enum {string} */
    defEnum: "one" | "two" | "three";
  };
}`);
    });
  });
});

describe("ReferenceObject", () => {
  test("x-* properties are ignored", () => {
    expect(
      transformSchemaObject(
        {
          type: "object",
          properties: { string: { type: "string" } },
          "x-extension": true,
        },
        options,
      ),
    ).toBe("{\n  string?: string;\n}");
  });
});
