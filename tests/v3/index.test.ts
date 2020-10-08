import prettier from "prettier";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

import { OpenAPI3 } from "../../src/types";
import swaggerToTS, { WARNING_MESSAGE } from "../../src";

// test helper: don’t throw the test due to whitespace differences
function format(types: string): string {
  return prettier.format(WARNING_MESSAGE.concat(types).trim(), {
    parser: "typescript",
  });
}

describe("cli", () => {
  ["github", "stripe", "manifold", "petstore"].forEach((file) => {
    it(`reads ${file} spec (v3) from file`, () => {
      execSync(
        `../../pkg/bin/cli.js specs/${file}.yaml -o generated/${file}.ts`,
        {
          cwd: path.resolve(__dirname),
        }
      );
      expect(
        fs.readFileSync(path.resolve(__dirname, `expected/${file}.ts`), "utf8")
      ).toBe(
        fs.readFileSync(path.resolve(__dirname, `generated/${file}.ts`), "utf8")
      );
    });
  });
});

describe("types", () => {
  it("string", () => {
    const schema: OpenAPI3 = {
      openapi: "3.0",
      components: {
        schemas: {
          object: {
            properties: { string: { type: "string" } },
            type: "object",
          },
          string: { type: "string" },
          string_ref: { $ref: "#/components/schemas/string" },
          nullable: {
            type: "string",
            nullable: true,
          },
        },
      },
    };
    expect(swaggerToTS(schema)).toBe(
      format(`
      export interface components {
        schemas: {
          object: { string?: string };
          string: string;
          string_ref: components['schemas']['string'];
          nullable: string | null;
        }
      }`)
    );
  });

  it("number", () => {
    const schema: OpenAPI3 = {
      openapi: "3.0",
      components: {
        schemas: {
          object: {
            properties: {
              integer: { type: "integer" },
              number: { type: "number" },
            },
            type: "object",
          },
          number: { type: "number" },
          number_ref: { $ref: "#/components/schemas/number" },
          nullable: {
            type: "number",
            nullable: true,
          },
        },
      },
    };
    expect(swaggerToTS(schema)).toBe(
      format(`
      export interface components {
        schemas: {
          object: { integer?: number; number?: number }
          number: number;
          number_ref: components['schemas']['number'];
          nullable: number | null;
        }
      }`)
    );
  });

  it("boolean", () => {
    const schema: OpenAPI3 = {
      openapi: "3.0",
      components: {
        schemas: {
          object: {
            properties: { boolean: { type: "boolean" } },
            type: "object",
          },
          boolean: { type: "boolean" },
          boolean_ref: { $ref: "#/components/schemas/boolean" },
          nullable: { type: "boolean", nullable: true },
        },
      },
    };
    expect(swaggerToTS(schema)).toBe(
      format(`
      export interface components {
        schemas: {
          object: { boolean?: boolean };
          boolean: boolean;
          boolean_ref: components['schemas']['boolean'];
          nullable: boolean | null;
        }
      }`)
    );
  });

  it("object", () => {
    const schema: OpenAPI3 = {
      openapi: "3.0",
      components: {
        schemas: {
          object: {
            properties: {
              object: {
                properties: {
                  object: {
                    properties: {
                      string: { type: "string" },
                      number: { $ref: "#/components/schemas/object_ref" },
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
          object_empty: {},
          nullable: {
            type: "object",
            properties: {
              string: { type: "string" },
            },
            nullable: true,
          },
        },
      },
    };
    expect(swaggerToTS(schema)).toBe(
      format(`
      export interface components {
        schemas: {
          object: {
            object?: {
              object?: { string?: string; number?: components['schemas']['object_ref'] };
            };
          };
          object_ref: { number?: number };
          object_unknown: { [key: string]: any };
          object_empty: { [key: string]: any };
          nullable: { string?: string } | null;
        }
      }`)
    );
  });

  it("array", () => {
    const schema: OpenAPI3 = {
      openapi: "3.0",
      components: {
        schemas: {
          array: {
            properties: {
              arrays: {
                type: "array",
                items: { type: "array", items: { type: "number" } },
              },
              strings: { type: "array", items: { type: "string" } },
              numbers: { type: "array", items: { type: "number" } },
              refs: {
                type: "array",
                items: { $ref: "#/components/schemas/string" },
              },
            },
            type: "object",
          },

          string: { type: "string" },
          array_ref: {
            items: { $ref: "#/components/schemas/array" },
            type: "array",
          },
          inferred_array: {
            items: { $ref: "#/components/schemas/array" },
          },
          tuple: {
            type: "array",
            items: [{ type: "string" }, { type: "number" }],
          },
          nullable: {
            type: "array",
            items: { type: "string" },
            nullable: true,
          },
        },
      },
    };

    expect(swaggerToTS(schema)).toBe(
      format(`
      export interface components {
        schemas: {
          array: {
            arrays?: number[][];
            strings?: string[];
            numbers?: number[];
            refs?: components['schemas']['string'][];
          };
          string: string;
          array_ref: components['schemas']['array'][];
          inferred_array: components['schemas']['array'][];
          tuple: [string, number];
          nullable: string[] | null;
        }
      }`)
    );
  });

  it("union", () => {
    const schema: OpenAPI3 = {
      openapi: "3.0",
      components: {
        schemas: {
          union: {
            properties: {
              string: { type: "string", enum: ["Totoro", "Satsuki", "Mei"] },
            },
            type: "object",
          },
        },
      },
    };
    expect(swaggerToTS(schema)).toBe(
      format(`
      export interface components {
        schemas: {
          union: { string?: 'Totoro' | 'Satsuki' | 'Mei' }
        }
      }`)
    );
  });
});

describe("OpenAPI3 features", () => {
  it("additionalProperties", () => {
    const schema: OpenAPI3 = {
      openapi: "3.0",
      components: {
        schemas: {
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
      },
    };
    expect(swaggerToTS(schema)).toBe(
      format(`
      export interface components {
        schemas: {
          additional_properties: { number?: number; [key: string]: any };
          additional_properties_string: { string?: string; [key: string]: string };
        }
      }`)
    );
  });

  it("allOf", () => {
    const schema: OpenAPI3 = {
      openapi: "3.0",
      components: {
        schemas: {
          base: {
            properties: {
              boolean: { type: "boolean" },
              number: { type: "number" },
            },
            type: "object",
          },
          all_of: {
            allOf: [
              { $ref: "#/components/schemas/base" },
              { properties: { string: { type: "string" } }, type: "object" },
            ],
            properties: { password: { type: "string" } },
            type: "object",
          },
        },
      },
    };
    expect(swaggerToTS(schema)).toBe(
      format(`
      export interface components {
        schemas: {
          base: { boolean?: boolean; number?: number };
          all_of: components['schemas']['base'] & { string?: string } & { password?: string };
        }
      }`)
    );
  });

  it("anyOf", () => {
    const schema: OpenAPI3 = {
      openapi: "3.0",
      components: {
        schemas: {
          any_of: {
            anyOf: [
              { $ref: "#/components/schemas/string" },
              { $ref: "#/components/schemas/number" },
              { $ref: "#/components/schemas/boolean" },
            ],
          },
          string: {
            type: "object",
            properties: {
              string: { type: "string" },
            },
          },
          number: {
            type: "object",
            properties: {
              number: { type: "number" },
            },
          },
          boolean: {
            type: "object",
            properties: {
              boolean: { type: "boolean" },
            },
          },
        },
      },
    };
    expect(swaggerToTS(schema)).toBe(
      format(`
      export interface components {
        schemas: {
          any_of: Partial<components['schemas']['string']> & Partial<components['schemas']['number']> & Partial<components['schemas']['boolean']>;
          string: {string?: string };
          number: {number?: number };
          boolean: {boolean?: boolean };
        }
      }`)
    );
  });

  it("required", () => {
    const schema: OpenAPI3 = {
      openapi: "3.0",
      components: {
        schemas: {
          required: {
            properties: {
              required: { type: "string" },
              optional: { type: "boolean" },
            },
            required: ["required"],
            type: "object",
          },
        },
      },
    };
    expect(swaggerToTS(schema)).toBe(
      format(`
      export interface components {
        schemas: {
          required: { required: string; optional?: boolean  }
        }
      }`)
    );
  });

  it("oneOf", () => {
    const schema: OpenAPI3 = {
      openapi: "3.0",
      components: {
        schemas: {
          one_of: {
            properties: {
              options: {
                oneOf: [
                  { type: "string" },
                  { type: "number" },
                  { $ref: "#/components/schemas/one_of_ref" },
                ],
              },
            },
            type: "object",
          },
          one_of_ref: {
            properties: {
              boolean: { type: "boolean" },
            },
            type: "object",
          },
          one_of_inferred: {
            oneOf: [
              {
                properties: {
                  kibana: {
                    type: "object",
                    properties: { versions: { type: "string" } },
                  },
                },
              },
              {
                properties: {
                  elasticsearch: {
                    type: "object",
                    properties: { versions: { type: "string" } },
                  },
                },
              },
            ],
          },
        },
      },
    };

    expect(swaggerToTS(schema)).toBe(
      format(`
    export interface components {
      schemas: {
        one_of: { options?: string | number | components['schemas']['one_of_ref'] };
        one_of_ref: { boolean?: boolean };
        one_of_inferred:
          | { kibana?: { versions?: string } }
          | { elasticsearch?: { versions?: string } }
      }
    }`)
    );
  });

  it("raw schemas", () => {
    const schema: any = {
      User: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string" },
        },
        required: ["name", "email"],
      },
    };

    expect(swaggerToTS(schema, { version: 3, rawSchema: true })).toBe(
      format(`
      export interface schemas {
        User: { name: string; email: string }
      }`)
    );
  });

  it("paths", () => {
    const schema: OpenAPI3 = {
      openapi: "3.0.1",
      paths: {
        "/": {
          get: {
            responses: {
              "200": {
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        body: { type: "string" },
                      },
                      required: ["title", "body"],
                    },
                  },
                },
              },
            },
          },
        },
        "/search": {
          post: {
            parameters: [
              {
                name: "q",
                in: "query",
                required: true,
                schema: { type: "string" },
              },
              {
                name: "p",
                in: "query",
                schema: { type: "integer" },
              },
            ],
            responses: {
              "200": {
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        results: {
                          type: "array",
                          items: { $ref: "#/components/schemas/SearchResult" },
                        },
                        total: { type: "integer" },
                      },
                      required: ["total"],
                    },
                  },
                },
              },
              "404": {
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/ErrorResponse" },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          ErrorResponse: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
            },
            required: ["error", "message"],
          },
          SearchResponse: {
            type: "object",
            properties: {
              title: { type: "string" },
              date: { type: "string" },
            },
            required: ["title", "date"],
          },
        },
        responses: {
          NotFound: {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    };

    expect(swaggerToTS(schema)).toBe(
      format(`
      export interface paths {
        '/': {
          get: {
            responses: {
              '200': {
                'application/json': { title: string; body: string }
              }
            }
          }
        };
        '/search': {
          post: {
            parameters: {
              query: {
                q: string;
                p?: number;
              }
            };
            responses: {
              '200': {
                'application/json': {
                  results?: components['schemas']['SearchResult'][];
                  total: number;
                }
              }
              '404': {
                'application/json': components['schemas']['ErrorResponse']
              }
            }
          }
        }
      }

      export interface components {
        schemas: {
          ErrorResponse: { error: string; message: string };
          SearchResponse: { title: string; date: string }
        }
        responses: {
          NotFound: { [key: string]: any }
        }
      }`)
    );
  });
});
