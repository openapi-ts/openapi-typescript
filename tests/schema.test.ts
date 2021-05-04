/**
 * Tests raw generation, pre-Prettier
 */

import { transformSchemaObj as transform } from "../src/transform/schema";

const defaults = {
  additionalProperties: false,
  immutableTypes: false,
  defaultNonNullable: false,
  required: new Set<string>(),
  rawSchema: false,
  version: 3,
};

describe("SchemaObject", () => {
  describe("basic", () => {
    it("string", () => {
      expect(transform({ type: "string" }, { ...defaults })).toBe("string");
      expect(transform({ type: "string", nullable: true }, { ...defaults })).toBe("(string) | null");
    });

    it("number", () => {
      expect(transform({ type: "integer" }, { ...defaults })).toBe("number");
      expect(transform({ type: "number" }, { ...defaults })).toBe("number");
      expect(transform({ type: "number", nullable: true }, { ...defaults })).toBe("(number) | null");
    });

    it("boolean", () => {
      expect(transform({ type: "boolean" }, { ...defaults })).toBe("boolean");
      expect(transform({ type: "boolean", nullable: true }, { ...defaults })).toBe("(boolean) | null");
    });

    const objStd = {
      type: "object",
      properties: {
        object: {
          properties: { string: { type: "string" }, number: { $ref: 'components["schemas"]["object_ref"]' } },
          type: "object",
        },
      },
    };
    const objUnknown = { type: "object" };
    const objNullable = { type: "object", properties: { string: { type: "string" } }, nullable: true };
    const objRequired = {
      properties: { required: { type: "string" }, optional: { type: "boolean" } },
      required: ["required"],
      type: "object",
    };

    it("object", () => {
      // standard object
      expect(transform(objStd, { ...defaults })).toBe(
        `{\n"object"?: {\n"string"?: string;\n"number"?: components["schemas"]["object_ref"];\n\n};\n\n}`
      );

      // unknown
      expect(transform(objUnknown, { ...defaults })).toBe(`{ [key: string]: any }`);

      // empty
      expect(transform({}, { ...defaults })).toBe(`{ [key: string]: any }`);

      // nullable
      expect(transform(objNullable, { ...defaults })).toBe(`({\n"string"?: string;\n\n}) | null`);

      // required
      expect(transform(objRequired, { ...defaults })).toBe(`{\n"required": string;\n"optional"?: boolean;\n\n}`);
    });

    it("object (immutableTypes)", () => {
      // (same as above test, but with immutableTypes: true)
      const opts = { ...defaults, immutableTypes: true };
      expect(transform(objStd, opts)).toBe(
        `{\nreadonly "object"?: {\nreadonly "string"?: string;\nreadonly "number"?: components["schemas"]["object_ref"];\n\n};\n\n}`
      );
      expect(transform(objUnknown, opts)).toBe(`{ readonly [key: string]: any }`);
      expect(transform({}, opts)).toBe(`{ readonly [key: string]: any }`);
      expect(transform(objNullable, opts)).toBe(`({\nreadonly "string"?: string;\n\n}) | null`);
      expect(transform(objRequired, opts)).toBe(`{\nreadonly "required": string;\nreadonly "optional"?: boolean;\n\n}`);
    });

    it("array", () => {
      // primitive
      expect(transform({ type: "array", items: { type: "string" } }, { ...defaults })).toBe(`(string)[]`);
      expect(transform({ type: "array", items: { type: "number" } }, { ...defaults })).toBe(`(number)[]`);
      expect(transform({ type: "array", items: { type: "boolean" } }, { ...defaults })).toBe(`(boolean)[]`);

      // nested
      expect(
        transform(
          { type: "array", items: { type: "array", items: { type: "array", items: { type: "number" } } } },
          { ...defaults }
        )
      ).toBe(`(((number)[])[])[]`);

      // enum
      expect(transform({ type: "array", items: { enum: ["chocolate", "vanilla"] } }, { ...defaults })).toBe(
        `(('chocolate') | ('vanilla'))[]`
      );

      // $ref
      expect(transform({ type: "array", items: { $ref: 'components["schemas"]["ArrayItem"]' } }, { ...defaults })).toBe(
        `(components["schemas"]["ArrayItem"])[]`
      );

      // inferred
      expect(transform({ items: { $ref: 'components["schemas"]["ArrayItem"]' } }, { ...defaults })).toBe(
        `(components["schemas"]["ArrayItem"])[]`
      );

      // tuple
      expect(transform({ type: "array", items: [{ type: "string" }, { type: "number" }] }, { ...defaults })).toBe(
        `[string, number]`
      );

      // nullable
      expect(transform({ type: "array", items: { type: "string" }, nullable: true }, { ...defaults })).toBe(
        `((string)[]) | null`
      );
    });

    it("array (immutableTypes)", () => {
      // (same as above test, but with immutableTypes: true)
      const opts = { ...defaults, immutableTypes: true };
      expect(transform({ type: "array", items: { type: "string" } }, opts)).toBe(`readonly (string)[]`);
      expect(transform({ type: "array", items: { type: "number" } }, opts)).toBe(`readonly (number)[]`);
      expect(transform({ type: "array", items: { type: "boolean" } }, opts)).toBe(`readonly (boolean)[]`);
      expect(
        transform(
          { type: "array", items: { type: "array", items: { type: "array", items: { type: "number" } } } },
          opts
        )
      ).toBe(`readonly (readonly (readonly (number)[])[])[]`);
      expect(transform({ type: "array", items: { enum: ["chocolate", "vanilla"] } }, opts)).toBe(
        `readonly (('chocolate') | ('vanilla'))[]`
      );
      expect(transform({ type: "array", items: { $ref: 'components["schemas"]["ArrayItem"]' } }, opts)).toBe(
        `readonly (components["schemas"]["ArrayItem"])[]`
      );
      expect(transform({ items: { $ref: 'components["schemas"]["ArrayItem"]' } }, opts)).toBe(
        `readonly (components["schemas"]["ArrayItem"])[]`
      );
      expect(transform({ type: "array", items: { type: "string" }, nullable: true }, opts)).toBe(
        `(readonly (string)[]) | null`
      );
      expect(transform({ type: "array", items: [{ type: "string" }, { type: "number" }] }, opts)).toBe(
        `readonly [string, number]`
      );
    });

    it("enum", () => {
      const enumBasic = ["Totoro", "Sats'uki", "Mei"]; // note: also tests quotes in enum
      expect(
        transform({ properties: { string: { type: "string", enum: enumBasic } }, type: "object" }, { ...defaults })
      ).toBe(`{
"string"?: ('Totoro') | ('Sats\\'uki') | ('Mei');

}`);

      const enumNull = ["Totoro", "Sats'uki", "Mei", null];
      expect(transform({ properties: { string: { type: "string", enum: enumNull } }, type: "object" }, { ...defaults }))
        .toBe(`{
"string"?: ('Totoro') | ('Sats\\'uki') | ('Mei') | (null);

}`);

      const enumMixed = ["Totoro", 2, false, null];
      expect(
        transform({ properties: { string: { type: "string", enum: enumMixed } }, type: "object" }, { ...defaults })
      ).toBe(`{
"string"?: ('Totoro') | (2) | (false) | (null);

}`);

      // nullable 1
      expect(
        transform(
          { properties: { string: { type: "string", enum: enumMixed, nullable: true } }, type: "object" },
          { ...defaults }
        )
      ).toBe(`{
"string"?: (('Totoro') | (2) | (false)) | null;

}`);

      // nullable 2
      const enumMixed2 = ["Totoro", 2, false];
      expect(
        transform(
          { properties: { string: { type: "string", enum: enumMixed2, nullable: true } }, type: "object" },
          { ...defaults }
        )
      ).toBe(`{
"string"?: (('Totoro') | (2) | (false)) | null;

}`);

      // empty
      expect(transform({ properties: { string: { type: "string", enum: [] } }, type: "object" }, { ...defaults })).toBe(
        `{
"string"?: string;

}`
      );
    });

    it("$ref", () => {
      expect(transform({ $ref: 'components["parameters"]["ReferenceObject"]' }, { ...defaults })).toBe(
        `components["parameters"]["ReferenceObject"]`
      );
    });
  });

  describe("advanced", () => {
    it("additionalProperties", () => {
      // boolean
      expect(transform({ additionalProperties: true }, { ...defaults })).toBe(`{ [key: string]: any }`);

      // empty object
      expect(transform({ additionalProperties: {} }, { ...defaults })).toBe(`{ [key: string]: any }`);

      // type
      expect(transform({ additionalProperties: { type: "string" } }, { ...defaults })).toBe(
        `{ [key: string]: string; }`
      );

      // $ref
      expect(transform({ additionalProperties: { $ref: 'definitions["Message"]' } }, { ...defaults })).toBe(
        `{ [key: string]: definitions["Message"]; }`
      );
    });

    it("allOf", () => {
      expect(
        transform(
          {
            allOf: [
              { $ref: 'components["schemas"]["base"]' },
              { properties: { string: { type: "string" } }, type: "object" },
            ],
            properties: { password: { type: "string" } },
            type: "object",
          },
          { ...defaults }
        )
      ).toBe(`(components["schemas"]["base"]) & ({\n"string"?: string;\n\n}) & ({\n"password"?: string;\n\n})`);
    });

    it("anyOf", () => {
      expect(
        transform(
          {
            anyOf: [
              { $ref: 'components["schemas"]["StringType"]' },
              { $ref: 'components["schemas"]["NumberType"]' },
              { $ref: 'components["schemas"]["BooleanType"]' },
            ],
          },
          { ...defaults }
        )
      ).toBe(
        `(Partial<components["schemas"]["StringType"]>) & (Partial<components["schemas"]["NumberType"]>) & (Partial<components["schemas"]["BooleanType"]>)`
      );
    });

    it("oneOf", () => {
      // standard
      expect(
        transform(
          { oneOf: [{ type: "string" }, { type: "number" }, { $ref: 'components["schemas"]["one_of_ref"]' }] },
          { ...defaults }
        )
      ).toBe(`(string) | (number) | (components["schemas"]["one_of_ref"])`);

      // additionalProperties
      expect(
        transform(
          {
            type: "object",
            additionalProperties: { oneOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }] },
          },
          { ...defaults }
        )
      ).toBe(`{ [key: string]: (string) | (number) | (boolean); }`);
    });

    // https://www.jsonschemavalidator.net/s/fOyR2UtQ
    it("properties + oneOf", () => {
      expect(
        transform(
          {
            properties: {
              a: {
                type: "string",
              },
            },
            oneOf: [
              { properties: { b: { type: "string" } }, required: ["b"] },
              { properties: { c: { type: "string" } }, required: ["c"] },
            ],
          },
          { ...defaults }
        )
      ).toBe(`(({
"b": string;

}) | ({
"c": string;

})) & ({
"a"?: string;

})`);
    });

    it("properties + anyOf", () => {
      expect(
        transform(
          {
            properties: {
              a: {
                type: "string",
              },
            },
            anyOf: [
              { properties: { b: { type: "string" } }, required: ["b"] },
              { properties: { c: { type: "string" } }, required: ["c"] },
            ],
          },
          { ...defaults }
        )
      ).toBe(`((Partial<{
"b": string;

}>) & (Partial<{
"c": string;

}>)) & ({
"a"?: string;

})`);
    });
  });

  describe("comments", () => {
    it("basic", () => {
      expect(
        transform(
          {
            type: "object",
            properties: {
              email: { type: "string", description: "user email" },
              loc: { type: "string", description: "user location" },
              avatar: { type: "string", description: "user photo" },
            },
          },
          { ...defaults }
        )
      ).toBe(`{
/** user email */
"email"?: string;
/** user location */
"loc"?: string;
/** user photo */
"avatar"?: string;

}`);
    });
  });

  describe("--default-non-nullable", () => {
    it("default: objects with default values are nullable", () => {
      expect(
        transform({ type: "object", properties: { default: { type: "boolean", default: true } } }, { ...defaults })
      ).toBe(`{
"default"?: boolean;

}`);
    });

    it("enabled: objects with default values are non-nullable", () => {
      expect(
        transform(
          { type: "object", properties: { default: { type: "boolean", default: true } } },
          { ...defaults, defaultNonNullable: true }
        )
      ).toBe(`{
"default": boolean;

}`);
    });
  });
});
