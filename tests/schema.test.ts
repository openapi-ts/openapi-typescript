/**
 * Tests raw generation, pre-Prettier
 */

import { transformSchemaObj } from "../src/transform/schema";

function transform(schemaObject: any): string {
  return transformSchemaObj(schemaObject).trim();
}

describe("SchemaObject", () => {
  describe("basic", () => {
    it("string", () => {
      expect(transform({ type: "string" })).toBe("string");
      expect(transform({ type: "string", nullable: true })).toBe("(string) | null");
    });

    it("number", () => {
      expect(transform({ type: "integer" })).toBe("number");
      expect(transform({ type: "number" })).toBe("number");
      expect(transform({ type: "number", nullable: true })).toBe("(number) | null");
    });

    it("boolean", () => {
      expect(transform({ type: "boolean" })).toBe("boolean");
      expect(transform({ type: "boolean", nullable: true })).toBe("(boolean) | null");
    });

    it("object", () => {
      // standard object
      expect(
        transform({
          type: "object",
          properties: {
            object: {
              properties: { string: { type: "string" }, number: { $ref: "#/components/schemas/object_ref" } },
              type: "object",
            },
          },
        })
      ).toBe(`{\n"object"?: {\n"string"?: string;\n"number"?: components["schemas"]["object_ref"];\n\n};\n\n}`);

      // unknown
      expect(transform({ type: "object" })).toBe(`{ [key: string]: any }`);

      // empty
      expect(transform({})).toBe(`{ [key: string]: any }`);

      // nullable
      expect(transform({ type: "object", properties: { string: { type: "string" } }, nullable: true })).toBe(
        `({\n"string"?: string;\n\n}) | null`
      );

      // required
      expect(
        transform({
          properties: { required: { type: "string" }, optional: { type: "boolean" } },
          required: ["required"],
          type: "object",
        })
      ).toBe(`{\n"required": string;\n"optional"?: boolean;\n\n}`);
    });

    it("array", () => {
      // primitive
      expect(transform({ type: "array", items: { type: "string" } })).toBe(`(string)[]`);
      expect(transform({ type: "array", items: { type: "number" } })).toBe(`(number)[]`);
      expect(transform({ type: "array", items: { type: "boolean" } })).toBe(`(boolean)[]`);

      // nested
      expect(
        transform({ type: "array", items: { type: "array", items: { type: "array", items: { type: "number" } } } })
      ).toBe(`(((number)[])[])[]`);

      // eum
      expect(transform({ type: "array", items: { enum: ["chocolate", "vanilla"] } })).toBe(
        `(('chocolate') | ('vanilla'))[]`
      );

      // $ref
      expect(transform({ type: "array", items: { $ref: "#/components/schemas/ArrayItem" } })).toBe(
        `(components["schemas"]["ArrayItem"])[]`
      );

      // inferred
      expect(transform({ items: { $ref: "#/components/schemas/ArrayItem" } })).toBe(
        `(components["schemas"]["ArrayItem"])[]`
      );

      // tuple
      expect(transform({ type: "array", items: [{ type: "string" }, { type: "number" }] })).toBe(`[string, number]`);

      // nullable
      expect(transform({ type: "array", items: { type: "string" }, nullable: true })).toBe(`((string)[]) | null`);
    });

    it("enum", () => {
      expect(
        transform({
          properties: { string: { type: "string", enum: ["Totoro", "Sats'uki", "Mei"] } }, // note: also tests quotes in enum
          type: "object",
        })
      ).toBe(`{
"string"?: ('Totoro') | ('Sats\\'uki') | ('Mei');

}`);

      expect(
        transform({
          properties: { string: { type: "string", enum: ["Totoro", "Sats'uki", "Mei", null] } }, // note: also tests quotes in enum
          type: "object",
        })
      ).toBe(`{
"string"?: ('Totoro') | ('Sats\\'uki') | ('Mei') | (null);

}`);

      expect(
        transform({
          properties: { string: { type: "string", enum: ["Totoro", 2, false, null] } }, // note: also tests quotes in enum
          type: "object",
        })
      ).toBe(`{
"string"?: ('Totoro') | (2) | (false) | (null);

}`);

      expect(
        transform({
          properties: { string: { type: "string", enum: ["Totoro", 2, false, null], nullable: true } }, // note: also tests quotes in enum
          type: "object",
        })
      ).toBe(`{
"string"?: (('Totoro') | (2) | (false)) | null;

}`);

      expect(
        transform({
          properties: { string: { type: "string", enum: ["Totoro", 2, false], nullable: true } }, // note: also tests quotes in enum
          type: "object",
        })
      ).toBe(`{
"string"?: (('Totoro') | (2) | (false)) | null;

}`);
    });

    it("$ref", () => {
      expect(transform({ $ref: "#/components/parameters/ReferenceObject" })).toBe(
        `components["parameters"]["ReferenceObject"]`
      );
    });

    // TODO: allow import later
    it("$ref (external)", () => {
      expect(transform({ $ref: "./external.yaml" })).toBe(`any`);
    });
  });

  describe("advanced", () => {
    it("additionalProperties", () => {
      // boolean
      expect(transform({ additionalProperties: true })).toBe(`{ [key: string]: any }`);

      // type
      expect(transform({ additionalProperties: { type: "string" } })).toBe(`{ [key: string]: string; }`);

      // $ref
      expect(transform({ additionalProperties: { $ref: "#/definitions/Message" } })).toBe(
        `{ [key: string]: definitions["Message"]; }`
      );
    });

    it("allOf", () => {
      expect(
        transform({
          allOf: [
            { $ref: "#/components/schemas/base" },
            { properties: { string: { type: "string" } }, type: "object" },
          ],
          properties: { password: { type: "string" } },
          type: "object",
        })
      ).toBe(`(components["schemas"]["base"]) & ({\n"string"?: string;\n\n}) & ({\n"password"?: string;\n\n})`);
    });

    it("anyOf", () => {
      expect(
        transform({
          anyOf: [
            { $ref: "#/components/schemas/StringType" },
            { $ref: "#/components/schemas/NumberType" },
            { $ref: "#/components/schemas/BooleanType" },
          ],
        })
      ).toBe(
        `(Partial<components["schemas"]["StringType"]>) & (Partial<components["schemas"]["NumberType"]>) & (Partial<components["schemas"]["BooleanType"]>)`
      );
    });

    it("oneOf", () => {
      // standard
      expect(
        transform({ oneOf: [{ type: "string" }, { type: "number" }, { $ref: "#/components/schemas/one_of_ref" }] })
      ).toBe(`(string) | (number) | (components["schemas"]["one_of_ref"])`);

      // additionalProperties
      expect(
        transform({
          type: "object",
          additionalProperties: { oneOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }] },
        })
      ).toBe(`{ [key: string]: (string) | (number) | (boolean); }`);
    });

    // https://www.jsonschemavalidator.net/s/fOyR2UtQ
    it("properties + oneOf", () => {
      expect(
        transform({
          properties: {
            a: {
              type: "string",
            },
          },
          oneOf: [
            { properties: { b: { type: "string" } }, required: ["b"] },
            { properties: { c: { type: "string" } }, required: ["c"] },
          ],
        })
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
        transform({
          properties: {
            a: {
              type: "string",
            },
          },
          anyOf: [
            { properties: { b: { type: "string" } }, required: ["b"] },
            { properties: { c: { type: "string" } }, required: ["c"] },
          ],
        })
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
        transform({
          type: "object",
          properties: {
            email: { type: "string", description: "user email" },
            loc: { type: "string", description: "user location" },
            avatar: { type: "string", description: "user photo" },
          },
        })
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
});
