import vine from "@vinejs/vine";
import {
  VineTypeResolver,
  enrichType,
  parseArrayNode,
  parseLiteralNode,
  parseObjectNode,
} from "../src/resolvers/vine-type.resolver";
import { DocumentBuilder } from "openapi-metadata/builders";

describe("parseLiteralNode", () => {
  // INFO: This test is not really necessary
  it("should always returns string", () => {
    const validator = vine.compile(vine.string());
    const json = validator.toJSON();
    const result = parseLiteralNode(json.schema.schema as any, json.refs);

    expect(result.type).toBe("string");
  });
});

describe("parseArrayNode", () => {
  it("should parse array of string", () => {
    const validator = vine.compile(vine.array(vine.string()));
    const json = validator.toJSON();
    const result: any = parseArrayNode(json.schema.schema as any, json.refs);

    expect(result.type).toBe("array");
    expect(result.items.type).toBe("string");
  });
});

describe("parseObjectNode", () => {
  it("should parse object", () => {
    const validator = vine.compile(
      vine.object({
        email: vine.string().email(),
        password: vine.string(),
      }),
    );
    const json = validator.toJSON();
    const result: any = parseObjectNode(json.schema.schema as any, json.refs);

    expect(result.properties.email).toBeDefined();
    expect(result.properties.password).toBeDefined();
  });

  it("should parse nested object", () => {
    const validator = vine.compile(
      vine.object({
        nested: vine.object({
          again: vine.object({
            example: vine.string(),
          }),
        }),
      }),
    );
    const json = validator.toJSON();

    const result: any = parseObjectNode(json.schema.schema as any, json.refs);

    expect(result.properties.nested.properties.again.properties.example).toBeDefined();
  });

  it("should mark properties as required by default", () => {
    const validator = vine.compile(
      vine.object({
        example: vine.string(),
      }),
    );
    const json = validator.toJSON();
    const result: any = parseObjectNode(json.schema.schema as any, json.refs);

    expect(result.required).toContain("example");
  });

  it("should handle optional properties", () => {
    const validator = vine.compile(
      vine.object({
        required: vine.string(),
        notRequired: vine.string().optional(),
      }),
    );
    const json = validator.toJSON();
    const result: any = parseObjectNode(json.schema.schema as any, json.refs);

    expect(result.required).toContain("required");
    expect(result.required).not.toContain("notRequired");
  });
});

describe("enrichType", () => {
  it("should properly find types using validators", async () => {
    const validator = vine.compile(
      vine.object({
        boolean: vine.boolean(),
        number: vine.number(),
        string: vine.string(),
      }),
    );

    const schema: any = {
      type: "object",
      properties: {
        boolean: {
          type: "string",
        },
        number: {
          type: "string",
        },
        string: {
          type: "string",
        },
      },
    };

    await enrichType(validator, schema);

    expect(schema.properties.string.type).toBe("string");
    expect(schema.properties.boolean.type).toBe("boolean");
    expect(schema.properties.number.type).toBe("number");
  });
});
