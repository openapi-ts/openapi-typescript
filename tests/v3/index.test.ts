import prettier from "prettier";

import { OpenAPI3 } from "../../src/types";
import swaggerToTS, { WARNING_MESSAGE } from "../../src";

// test helper: don’t throw the test due to whitespace differences
function format(types: string): string {
  return prettier.format(WARNING_MESSAGE.concat(types).trim(), {
    parser: "typescript",
  });
}

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
        }
      }`)
    );
  });
});

/*
describe('OpenAPI3 features', () => {
  it('oneOf', () => {
    const schema: OpenAPI3 = {
      openapi: '3.0',
      components: {
        schemas: {
          one_of: {
            properties: {
              options: {
                oneOf: [
                  { type: 'string' },
                  { type: 'number' },
                  { $ref: '#/components/one_of_ref' },
                ],
                type: 'array',
              },
            },
            type: 'object',
          },
          one_of_ref: {
            properties: {
              boolean: { type: 'boolean' },
            },
            type: 'object',
          },
        },
      },
    };
    expect(v3(schema)).toBe(
      format(`
    export interface components {
      schemas: {
        one_of: { options?: string | number | components['one_of_ref'] };
        one_of_ref: { boolean?: boolean };
      }
    }`)
    );
  });
});
*/
