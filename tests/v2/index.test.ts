import fs from "fs";
import { execSync } from "child_process";
import path from "path";
import prettier from "prettier";
import { OpenAPI2, OpenAPI2SchemaObject, Property } from "../../src/types";
import swaggerToTS, { WARNING_MESSAGE } from "../../src";

// test helper: don’t throw the test due to whitespace differences
function format(types: string): string {
  return prettier.format([WARNING_MESSAGE, types.trim()].join("\n"), {
    parser: "typescript",
  });
}

// simple snapshot tests with valid schemas to make sure it can generally parse & generate output
describe("cli", () => {
  it("reads stripe.yaml spec (v2) from file", () => {
    execSync("../../pkg/bin/cli.js specs/stripe.yaml -o generated/stripe.ts", {
      cwd: path.resolve(__dirname),
    });
    expect(
      fs.readFileSync(path.resolve(__dirname, "expected/stripe.ts"), "utf8")
    ).toBe(
      fs.readFileSync(path.resolve(__dirname, "generated/stripe.ts"), "utf8")
    );
  });

  it("reads manifold.yaml spec (v2) from file", () => {
    execSync(
      "../../pkg/bin/cli.js specs/manifold.yaml -o generated/manifold.ts",
      {
        cwd: path.resolve(__dirname),
      }
    );
    expect(
      fs.readFileSync(path.resolve(__dirname, "expected/manifold.ts"), "utf8")
    ).toBe(
      fs.readFileSync(path.resolve(__dirname, "generated/manifold.ts"), "utf8")
    );
  });

  it("reads swagger.json spec (v2) from remote resource", () => {
    execSync(
      "../../pkg/bin/cli.js https://api.catalog.stage.manifold.co/swagger.json -o generated/http.ts",
      {
        cwd: path.resolve(__dirname),
      }
    );
    expect(
      fs.readFileSync(path.resolve(__dirname, "expected/http.ts"), "utf8")
    ).toBe(
      fs.readFileSync(path.resolve(__dirname, "generated/http.ts"), "utf8")
    );
  });
});

// check individual transformations
describe("transformation", () => {
  describe("types", () => {
    it("string", () => {
      const schema: OpenAPI2 = {
        swagger: "2.0",
        definitions: {
          object: {
            properties: {
              binary: { type: "binary" },
              byte: { type: "byte" },
              password: { type: "password" },
              string: { type: "string" },
            },
            type: "object",
          },
          string: { type: "string" },
          string_ref: { $ref: "#/definitions/string" },
        },
      };
      expect(swaggerToTS(schema)).toBe(
        format(`
        export interface definitions {
          object: {
            binary?: string
            byte?: string
            password?: string
            string?: string
          };
          string: string;
          string_ref: definitions['string'];
        }`)
      );
    });

    it("number", () => {
      const schema: OpenAPI2 = {
        swagger: "2.0",
        definitions: {
          object: {
            properties: {
              double: { type: "double" },
              float: { type: "float" },
              integer: { type: "integer" },
              number: { type: "number" },
            },
            type: "object",
          },
          number: { type: "number" },
          number_ref: { $ref: "#/definitions/number" },
        },
      };
      expect(swaggerToTS(schema)).toBe(
        format(`
        export interface definitions {
          object: {
            double?: number;
            float?: number;
            integer?: number;
            number?: number;
          }
          number: number;
          number_ref: definitions['number'];
        }`)
      );
    });

    it("boolean", () => {
      const schema: OpenAPI2 = {
        swagger: "2.0",
        definitions: {
          object: {
            properties: { boolean: { type: "boolean" } },
            type: "object",
          },
          boolean: { type: "boolean" },
          boolean_ref: { $ref: "#/definitions/boolean" },
        },
      };
      expect(swaggerToTS(schema)).toBe(
        format(`
        export interface definitions {
          object: { boolean?: boolean };
          boolean: boolean;
          boolean_ref: definitions['boolean'];
        }`)
      );
    });

    it("object", () => {
      const schema: OpenAPI2 = {
        swagger: "2.0",
        definitions: {
          object: {
            properties: {
              object: {
                properties: {
                  object: {
                    properties: {
                      string: { type: "string" },
                      number: { $ref: "#/definitions/object_ref" },
                    },
                    type: "object",
                  },
                },
                type: "object",
              },
            },
            type: "object",
          },
          object_ref: {
            properties: { number: { type: "number" } },
            type: "object",
          },
          object_unknown: { type: "object" },
        },
      };
      expect(swaggerToTS(schema)).toBe(
        format(`
        export interface definitions {
          object: {
            object?: {
              object?: { string?: string; number?: definitions['object_ref'] };
            };
          };
          object_ref: { number?: number };
          object_unknown: { [key: string]: any };
        }`)
      );
    });

    it("array", () => {
      const schema: OpenAPI2 = {
        swagger: "2.0",
        definitions: {
          array: {
            properties: {
              arrays: {
                type: "array",
                items: { type: "array", items: { type: "number" } },
              },
              strings: { type: "array", items: { type: "string" } },
              numbers: { type: "array", items: { type: "number" } },
              refs: { type: "array", items: { $ref: "#/definitions/string" } },
            },
            type: "object",
          },
          string: { type: "string" },
          array_ref: { items: { $ref: "#/definitions/array" }, type: "array" },
        },
      };

      expect(swaggerToTS(schema)).toBe(
        format(`
        export interface definitions {
          array: {
            arrays?: number[][];
            strings?: string[];
            numbers?: number[];
            refs?: definitions['string'][];
          };
          string: string;
          array_ref: definitions['array'][];
        }`)
      );
    });

    it("union", () => {
      const schema: OpenAPI2 = {
        swagger: "2.0",
        definitions: {
          union: {
            properties: {
              string: { type: "string", enum: ["Totoro", "Satsuki", "Mei"] },
            },
            type: "object",
          },
        },
      };
      expect(swaggerToTS(schema)).toBe(
        format(`
        export interface definitions {
          union: { string?: 'Totoro' | 'Satsuki' | 'Mei' }
        }`)
      );
    });
  });

  describe("OpenAPI2 features", () => {
    it("additionalProperties", () => {
      const schema: OpenAPI2 = {
        swagger: "2.0",
        definitions: {
          additional_properties: {
            type: "object",
            properties: { number: { type: "number" } },
            additionalProperties: true,
          },
          additional_properties_string: {
            type: "object",
            properties: { string: { type: "string" } },
            additionalProperties: { type: "string" },
          },
        },
      };
      expect(swaggerToTS(schema)).toBe(
        format(`
        export interface definitions {
          additional_properties: { number?: number; [key: string]: any };
          additional_properties_string: { string?: string; [key: string]: string };
        }`)
      );
    });

    it("allOf", () => {
      const schema: OpenAPI2 = {
        swagger: "2.0",
        definitions: {
          base: {
            properties: {
              boolean: { type: "boolean" },
              number: { type: "number" },
            },
            type: "object",
          },
          all_of: {
            allOf: [
              { $ref: "#/definitions/base" },
              { properties: { string: { type: "string" } }, type: "object" },
            ],
            properties: { password: { type: "string" } },
            type: "object",
          },
        },
      };
      expect(swaggerToTS(schema)).toBe(
        format(`
        export interface definitions {
          base: { boolean?: boolean; number?: number };
          all_of: definitions['base'] & { string?: string } & { password?: string };
        }`)
      );
    });

    it("required", () => {
      const schema: OpenAPI2 = {
        swagger: "2.0",
        definitions: {
          required: {
            properties: {
              required: { type: "string" },
              optional: { type: "boolean" },
            },
            required: ["required"],
            type: "object",
          },
        },
      };
      expect(swaggerToTS(schema)).toBe(
        format(`
        export interface definitions {
          required: { required: string; optional?: boolean  }
        }`)
      );
    });
  });

  describe("propertyMapper", () => {
    const schema: OpenAPI2 = {
      swagger: "2.0",
      definitions: {
        Name: {
          properties: {
            first: { type: "string" },
            last: { type: "string", "x-nullable": false },
          },
          type: "object",
        },
      },
    };

    it("accepts a mapper in options", () => {
      const propertyMapper = (
        swaggerDefinition: OpenAPI2SchemaObject,
        property: Property
      ): Property => property;
      swaggerToTS(schema, { propertyMapper });
    });

    it("passes definition to mapper", () => {
      const propertyMapper = jest.fn((_, prop) => prop);
      swaggerToTS(schema, { propertyMapper });
      if (!schema.definitions || !schema.definitions.Name.properties) {
        throw new Error("properties missing");
      }
      expect(propertyMapper).toBeCalledWith(
        schema.definitions.Name.properties.first,
        expect.any(Object)
      );
    });

    it("uses result of mapper", () => {
      const getNullable = (d: { [key: string]: any }): boolean => {
        const nullable = d["x-nullable"];
        if (typeof nullable === "boolean") {
          return nullable;
        }
        return true;
      };

      const propertyMapper = (
        swaggerDefinition: OpenAPI2SchemaObject,
        property: Property
      ): Property => ({
        ...property,
        optional: getNullable(swaggerDefinition),
      });

      swaggerToTS(schema, { propertyMapper });

      expect(swaggerToTS(schema, { propertyMapper })).toBe(
        format(`
        export interface definitions {
          Name: { first?: string; last: string }
        }`)
      );
    });
  });
});
