import type { SchemaObject } from "../src/types";
import transformSchemaObject, { TransformSchemaObjectOptions } from "../src/transform/schema-object.js";

const options: TransformSchemaObjectOptions = {
  path: "#/test/schema-object",
  ctx: {
    additionalProperties: false,
    alphabetize: false,
    defaultNonNullable: false,
    discriminators: {},
    immutableTypes: false,
    indentLv: 0,
    operations: {},
    pathParamsAsTypes: false,
    postTransform: undefined,
    silent: true,
    supportArrayLength: false,
    transform: undefined,
  },
};

describe("Schema Object", () => {
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
        expect(generated).toBe("(string)[]");
      });

      test("ref", () => {
        const schema: SchemaObject = { type: "array", items: { $ref: 'components["schemas"]["ArrayItem"]' } };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe('(components["schemas"]["ArrayItem"])[]');
      });
    });

    describe("object", () => {
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

      test("additionalProperties: true", () => {
        const schema: SchemaObject = { type: "object", additionalProperties: true };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe(`{
  [key: string]: unknown | undefined;
}`);
      });

      test("additionalProperties: value", () => {
        const schema: SchemaObject = { type: "object", additionalProperties: { type: "string" } };
        const generated = transformSchemaObject(schema, options);
        expect(generated).toBe(`{
  [key: string]: string | undefined;
}`);
      });
    });

    describe("const", () => {
      test("string", () => {
        const generated = transformSchemaObject({ type: "string", const: "duck" }, options);
        expect(generated).toBe("duck");
      });
    });

    describe("polymorphic", () => {
      test("nullish primitive", () => {
        const generated = transformSchemaObject({ type: ["string", "boolean", "number", "null"] }, options);
        expect(generated).toBe("OneOf<[string, boolean, number, null]>");
      });

      test("enum + polymorphism + nullable", () => {
        const generated = transformSchemaObject(
          { type: ["string", "null"], enum: ["", "false positive", "won't fix", "used in tests"] },
          options
        );
        expect(generated).toBe(`"" | "false positive" | "won't fix" | "used in tests" | null`);
      });
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
  [key: string]: unknown | undefined;
}`);
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

    describe("supportArrayLength", () => {
      test("true", () => {
        const opts = { ...options, ctx: { ...options.ctx, supportArrayLength: true } };
        expect(transformSchemaObject({ type: "array", items: { type: "string" } }, options)).toBe(`(string)[]`);
        expect(transformSchemaObject({ type: "array", items: { type: "string" }, minItems: 1 }, opts)).toBe(
          `[string, ...(string)[]]`
        );
        expect(transformSchemaObject({ type: "array", items: { type: "string" }, maxItems: 2 }, opts)).toBe(
          `[] | [string] | [string, string]`
        );
        expect(transformSchemaObject({ type: "array", items: { type: "string" }, maxItems: 20 }, opts)).toBe(
          `(string)[]`
        );
      });
    });
  });
});

describe("ReferenceObject", () => {
  it("x-* properties are ignored", () => {
    expect(
      transformSchemaObject(
        {
          type: "object",
          properties: { string: { type: "string" } },
          "x-extension": true,
        },
        options
      )
    ).toBe("{\n  string?: string;\n}");
  });
});
