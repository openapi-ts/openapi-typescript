/**
 * Tests raw generation, pre-Prettier
 */
import { expect } from "chai";
import { transformSchemaObj as transform } from "../../dist/transform/schema.js";

const defaults = {
  additionalProperties: false,
  immutableTypes: false,
  defaultNonNullable: false,
  required: new Set(),
  rawSchema: false,
  version: 3,
  supportArrayLength: false,
};

describe("SchemaObject", () => {
  describe("basic", () => {
    it("string", () => {
      expect(transform({ type: "string" }, { ...defaults })).to.equal("string");
      expect(transform({ type: "string", nullable: true }, { ...defaults })).to.equal("(string) | null");
    });

    it("number", () => {
      expect(transform({ type: "integer" }, { ...defaults })).to.equal("number");
      expect(transform({ type: "number" }, { ...defaults })).to.equal("number");
      expect(transform({ type: "number", nullable: true }, { ...defaults })).to.equal("(number) | null");
    });

    it("boolean", () => {
      expect(transform({ type: "boolean" }, { ...defaults })).to.equal("boolean");
      expect(transform({ type: "boolean", nullable: true }, { ...defaults })).to.equal("(boolean) | null");
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
      expect(transform(objStd, { ...defaults })).to.equal(
        `{\n"object"?: {\n"string"?: string;\n"number"?: components["schemas"]["object_ref"];\n\n};\n\n}`
      );

      // unknown
      expect(transform(objUnknown, { ...defaults })).to.equal(`{ [key: string]: unknown }`);

      // empty
      expect(transform({}, { ...defaults })).to.equal(`unknown`);

      // nullable
      expect(transform(objNullable, { ...defaults })).to.equal(`({\n"string"?: string;\n\n}) | null`);

      // required
      expect(transform(objRequired, { ...defaults })).to.equal(`{\n"required": string;\n"optional"?: boolean;\n\n}`);
    });

    it("object (immutableTypes)", () => {
      // (same as above test, but with immutableTypes: true)
      const opts = { ...defaults, immutableTypes: true };
      expect(transform(objStd, opts)).to.equal(
        `{\nreadonly "object"?: {\nreadonly "string"?: string;\nreadonly "number"?: components["schemas"]["object_ref"];\n\n};\n\n}`
      );
      expect(transform(objUnknown, opts)).to.equal(`{ readonly [key: string]: unknown }`);
      expect(transform({}, opts)).to.equal(`unknown`);
      expect(transform(objNullable, opts)).to.equal(`({\nreadonly "string"?: string;\n\n}) | null`);
      expect(transform(objRequired, opts)).to.equal(
        `{\nreadonly "required": string;\nreadonly "optional"?: boolean;\n\n}`
      );
    });

    it("array", () => {
      // primitive
      expect(transform({ type: "array", items: { type: "string" } }, { ...defaults })).to.equal(`(string)[]`);
      expect(transform({ type: "array", items: { type: "number" } }, { ...defaults })).to.equal(`(number)[]`);
      expect(transform({ type: "array", items: { type: "boolean" } }, { ...defaults })).to.equal(`(boolean)[]`);

      // nested
      expect(
        transform(
          { type: "array", items: { type: "array", items: { type: "array", items: { type: "number" } } } },
          { ...defaults }
        )
      ).to.equal(`(((number)[])[])[]`);

      // enum
      expect(transform({ type: "array", items: { enum: ["chocolate", "vanilla"] } }, { ...defaults })).to.equal(
        `(('chocolate') | ('vanilla'))[]`
      );

      // $ref
      expect(
        transform({ type: "array", items: { $ref: 'components["schemas"]["ArrayItem"]' } }, { ...defaults })
      ).to.equal(`(components["schemas"]["ArrayItem"])[]`);

      // inferred
      expect(transform({ items: { $ref: 'components["schemas"]["ArrayItem"]' } }, { ...defaults })).to.equal(
        `(components["schemas"]["ArrayItem"])[]`
      );

      // tuple
      expect(transform({ type: "array", items: [{ type: "string" }, { type: "number" }] }, { ...defaults })).to.equal(
        `[string, number]`
      );

      // nullable
      expect(transform({ type: "array", items: { type: "string" }, nullable: true }, { ...defaults })).to.equal(
        `((string)[]) | null`
      );
    });

    it("array (immutableTypes)", () => {
      // (same as above test, but with immutableTypes: true)
      const opts = { ...defaults, immutableTypes: true };
      expect(transform({ type: "array", items: { type: "string" } }, opts)).to.equal(`readonly (string)[]`);
      expect(transform({ type: "array", items: { type: "number" } }, opts)).to.equal(`readonly (number)[]`);
      expect(transform({ type: "array", items: { type: "boolean" } }, opts)).to.equal(`readonly (boolean)[]`);
      expect(
        transform(
          { type: "array", items: { type: "array", items: { type: "array", items: { type: "number" } } } },
          opts
        )
      ).to.equal(`readonly (readonly (readonly (number)[])[])[]`);
      expect(transform({ type: "array", items: { enum: ["chocolate", "vanilla"] } }, opts)).to.equal(
        `readonly (('chocolate') | ('vanilla'))[]`
      );
      expect(transform({ type: "array", items: { $ref: 'components["schemas"]["ArrayItem"]' } }, opts)).to.equal(
        `readonly (components["schemas"]["ArrayItem"])[]`
      );
      expect(transform({ items: { $ref: 'components["schemas"]["ArrayItem"]' } }, opts)).to.equal(
        `readonly (components["schemas"]["ArrayItem"])[]`
      );
      expect(transform({ type: "array", items: { type: "string" }, nullable: true }, opts)).to.equal(
        `(readonly (string)[]) | null`
      );
      expect(transform({ type: "array", items: [{ type: "string" }, { type: "number" }] }, opts)).to.equal(
        `readonly [string, number]`
      );
    });

    it("array (supportArrayLength)", () => {
      // (same as above test, but with supportArrayLength: true)
      const opts = { ...defaults, supportArrayLength: true };
      expect(transform({ type: "array", items: { type: "string" } }, opts)).to.equal(`(string)[]`);
      expect(transform({ type: "array", items: { type: "string" }, minItems: 1 }, opts)).to.equal(
        `[string, ...(string)[]]`
      );
      expect(transform({ type: "array", items: { type: "string" }, maxItems: 2 }, opts)).to.equal(
        `([]) | ([string]) | ([string, string])`
      );
      expect(transform({ type: "array", items: { type: "string" }, maxItems: 20 }, opts)).to.equal(`(string)[]`);
    });

    it("array (immutableTypes, supportArrayLength)", () => {
      // (same as above test, but with immutableTypes: true, supportArrayLength: true)
      const opts = { ...defaults, immutableTypes: true, supportArrayLength: true };
      expect(transform({ type: "array", items: { type: "string" } }, opts)).to.equal(`readonly (string)[]`);
      expect(transform({ type: "array", items: { type: "string" }, minItems: 1 }, opts)).to.equal(
        `readonly [string, ...(string)[]]`
      );
      expect(transform({ type: "array", items: { type: "string" }, maxItems: 2 }, opts)).to.equal(
        `(readonly []) | (readonly [string]) | (readonly [string, string])`
      );
      expect(transform({ type: "array", items: { type: "string" }, maxItems: 20 }, opts)).to.equal(
        `readonly (string)[]`
      );
    });

    describe("alphabetize", () => {
      it("object", () => {
        const opts = { ...defaults, alphabetize: true };
        expect(transform(objStd, opts)).to.equal(
          `{\n"object"?: {\n"number"?: components["schemas"]["object_ref"];\n"string"?: string;\n\n};\n\n}`
        );
        expect(transform(objUnknown, opts)).to.equal(`{ [key: string]: unknown }`);
        expect(transform({}, opts)).to.equal(`unknown`);
        expect(transform(objNullable, opts)).to.equal(`({\n"string"?: string;\n\n}) | null`);
        expect(transform(objRequired, opts)).to.equal(`{\n"optional"?: boolean;\n"required": string;\n\n}`);
      });

      it("array", () => {
        const opts = { ...defaults, alphabetize: true };
        expect(transform({ type: "array", items: { type: "string" } }, opts)).to.equal(`(string)[]`);
        expect(transform({ type: "array", items: { type: "number" } }, opts)).to.equal(`(number)[]`);
        expect(transform({ type: "array", items: { type: "boolean" } }, opts)).to.equal(`(boolean)[]`);
        expect(
          transform(
            { type: "array", items: { type: "array", items: { type: "array", items: { type: "number" } } } },
            opts
          )
        ).to.equal(`(((number)[])[])[]`);
        expect(transform({ type: "array", items: { $ref: 'components["schemas"]["ArrayItem"]' } }, opts)).to.equal(
          `(components["schemas"]["ArrayItem"])[]`
        );
        expect(transform({ items: { $ref: 'components["schemas"]["ArrayItem"]' } }, opts)).to.equal(
          `(components["schemas"]["ArrayItem"])[]`
        );
        expect(transform({ type: "array", items: { type: "string" }, nullable: true }, opts)).to.equal(
          `((string)[]) | null`
        );
        // enums should not be alphabetized, because the implicit order of the
        // values can be significant.
        expect(transform({ type: "array", items: { enum: ["vanilla", "chocolate"] } }, opts)).to.equal(
          `(('vanilla') | ('chocolate'))[]`
        );
        // non-enum arrays probably should be alphabetized but are not. It
        // would take a more significant rewrite of schema.ts to make that
        // possible, and I'm not sure that it makes much difference. Primary
        // use-case for alphabetize is to ensure types are stable when checked
        // into git. I doubt array declarations will shuffle positions, even
        // when the docs are generated dynamically.
        /*
        expect(transform({ type: "array", items: [{ type: "string" }, { type: "number" }] }, opts)).to.equal(
          `[number, string]`
        );
        */
      });
    });

    it("enum", () => {
      const enumBasic = ["Totoro", "Sats'uki", "Mei"]; // note: also tests quotes in enum
      expect(
        transform({ properties: { string: { type: "string", enum: enumBasic } }, type: "object" }, { ...defaults })
      ).to.equal(`{
/** @enum {string} */
"string"?: ('Totoro') | ('Sats\\'uki') | ('Mei');

}`);

      const enumNull = ["Totoro", "Sats'uki", "Mei", null];
      expect(transform({ properties: { string: { type: "string", enum: enumNull } }, type: "object" }, { ...defaults }))
        .to.equal(`{
/** @enum {string} */
"string"?: ('Totoro') | ('Sats\\'uki') | ('Mei') | (null);

}`);

      const enumMixed = ["Totoro", 2, false, null];
      expect(
        transform({ properties: { string: { type: "string", enum: enumMixed } }, type: "object" }, { ...defaults })
      ).to.equal(`{
/** @enum {string} */
"string"?: ('Totoro') | (2) | (false) | (null);

}`);

      // nullable 1
      expect(
        transform(
          { properties: { string: { type: "string", enum: enumMixed, nullable: true } }, type: "object" },
          { ...defaults }
        )
      ).to.equal(`{
/** @enum {string|null} */
"string"?: (('Totoro') | (2) | (false) | (null)) | null;

}`);

      // nullable 2
      const enumMixed2 = ["Totoro", 2, false];
      expect(
        transform(
          { properties: { string: { type: "string", enum: enumMixed2, nullable: true } }, type: "object" },
          { ...defaults }
        )
      ).to.equal(`{
/** @enum {string|null} */
"string"?: (('Totoro') | (2) | (false)) | null;

}`);

      // empty
      expect(
        transform({ properties: { string: { type: "string", enum: [] } }, type: "object" }, { ...defaults })
      ).to.equal(
        `{
/** @enum {string} */
"string"?: string;

}`
      );
    });

    console.log("ASD LAST");

    it("$ref", () => {
      expect(transform({ $ref: 'components["parameters"]["ReferenceObject"]' }, { ...defaults })).to.equal(
        `components["parameters"]["ReferenceObject"]`
      );
    });

    it("file", () => {
      expect(transform({ type: "file" }, { ...defaults })).to.equal("unknown");
    });
  });

  describe("advanced", () => {
    it("additionalProperties", () => {
      // boolean
      expect(transform({ additionalProperties: true }, { ...defaults })).to.equal(`{ [key: string]: unknown }`);

      // empty object
      expect(transform({ additionalProperties: {} }, { ...defaults })).to.equal(`{ [key: string]: unknown }`);

      // type
      expect(transform({ additionalProperties: { type: "string" } }, { ...defaults })).to.equal(
        `{ [key: string]: string; }`
      );

      // $ref
      expect(transform({ additionalProperties: { $ref: 'definitions["Message"]' } }, { ...defaults })).to.equal(
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
      ).to.equal(`(components["schemas"]["base"]) & ({\n"string"?: string;\n\n}) & ({\n"password"?: string;\n\n})`);
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
      ).to.equal(
        `(components["schemas"]["StringType"]) | (components["schemas"]["NumberType"]) | (components["schemas"]["BooleanType"])`
      );
    });

    it("oneOf", () => {
      // standard
      expect(
        transform(
          { oneOf: [{ type: "string" }, { type: "number" }, { $ref: 'components["schemas"]["one_of_ref"]' }] },
          { ...defaults }
        )
      ).to.equal(`(string) | (number) | (components["schemas"]["one_of_ref"])`);

      // additionalProperties
      expect(
        transform(
          {
            type: "object",
            additionalProperties: { oneOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }] },
          },
          { ...defaults }
        )
      ).to.equal(`{ [key: string]: (string) | (number) | (boolean); }`);
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
      ).to.equal(`(({
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
      ).to.equal(`(({
"b": string;

}) | ({
"c": string;

})) & ({
"a"?: string;

})`);
    });

    it("properties + anyOf with only required properties", () => {
      expect(
        transform(
          {
            properties: {
              a: {
                type: "string",
              },

              b: {
                type: "string",
              },
            },

            anyOf: [{ required: ["a"] }, { required: ["b"] }],
          },

          { ...defaults }
        )
      ).to.equal(`{
"a"?: string;
"b"?: string;

}`);
    });
    it("empty object with required fields", () => {
      expect(
        transform(
          {
            type: "object",
            required: ["abc"],
          },
          { ...defaults }
        )
      ).to.equal(`({ [key: string]: unknown }) & ({
abc: unknown;
})`);
    });
  });

  it("object with missing required fields", () => {
    expect(
      transform(
        {
          type: "object",
          required: ["abc", "email"],
          properties: {
            email: { type: "string" },
          },
        },
        { ...defaults }
      )
    ).to.equal(`({
"email": string;

}) & ({
abc: unknown;
})`);
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
      ).to.equal(`{
/** @description user email */
"email"?: string;
/** @description user location */
"loc"?: string;
/** @description user photo */
"avatar"?: string;

}`);
    });
  });

  describe("--default-non-nullable", () => {
    it("default: objects with default values are nullable", () => {
      expect(
        transform({ type: "object", properties: { default: { type: "boolean", default: true } } }, { ...defaults })
      ).to.equal(`{
/** @default true */
"default"?: boolean;

}`);
    });

    it("enabled: objects with default values are non-nullable", () => {
      expect(
        transform(
          { type: "object", properties: { default: { type: "boolean", default: true } } },
          { ...defaults, defaultNonNullable: true }
        )
      ).to.equal(`{
/** @default true */
"default": boolean;

}`);
    });
  });

  describe("deprecated", () => {
    expect(transform({ type: "object", properties: { userId: { type: "string", deprecated: true } } }, { ...defaults }))
      .to.equal(`{
/** @deprecated */
"userId"?: string;

}`);
  });
});
