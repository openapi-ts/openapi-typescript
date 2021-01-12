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
    it.only(`reads ${file} spec (v3) from file`, () => {
      execSync(`../../pkg/bin/cli.js specs/${file}.yaml -o generated/${file}.ts`, {
        cwd: __dirname,
      });
      const expected = fs.readFileSync(path.join(__dirname, "expected", `${file}.ts`), "utf8");
      const generated = fs.readFileSync(path.join(__dirname, "generated", `${file}.ts`), "utf8");
      expect(generated).toBe(expected);
    });
  });

  it("reads spec (v3) from remote resource", () => {
    execSync(
      "../../pkg/bin/cli.js https://raw.githubusercontent.com/drwpow/openapi-typescript/main/tests/v3/specs/manifold.yaml -o generated/http.ts",
      {
        cwd: __dirname,
      }
    );
    const expected = fs.readFileSync(path.join(__dirname, "expected", "http.ts"), "utf8");
    const generated = fs.readFileSync(path.join(__dirname, "generated", "http.ts"), "utf8");
    expect(generated).toBe(expected);
  });
});

describe("OpenAPI3 features", () => {
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
        User: {
          name: string;
          email: string;
        }
      }`)
    );
  });
});

describe("responses", () => {
  it("paths", () => {
    const schema: OpenAPI3 = {
      openapi: "3.0.1",
      paths: {
        "/": {
          get: {
            responses: {
              200: {
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
              200: {
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
              404: {
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
        "/": {
          get: {
            responses: {
              200: {
                "application/json": {
                  title: string;
                  body: string;
                }
              }
            }
          }
        };
        "/search": {
          post: {
            parameters: {
              query: {
                q: string;
                p?: number;
              }
            };
            responses: {
              200: {
                "application/json": {
                  results?: components["schemas"]["SearchResult"][];
                  total: number;
                }
              }
              404: {
                "application/json": components["schemas"]["ErrorResponse"]
              }
            }
          }
        }
      }

      export interface operations {}

      export interface components {
        schemas: {
          ErrorResponse: {
            error: string;
            message: string;
          };
          SearchResponse: {
            title: string;
            date: string;
          }
        }
        responses: {
          NotFound: {
            content: {
              "application/json": components["schemas"]["ErrorResponse"];
            }
          }
        }
      }`)
    );
  });

  it("empty responses (#333)", () => {
    const schema: OpenAPI3 = {
      openapi: "3.0.1",
      paths: {
        "/no-content": {
          get: {
            responses: {
              204: {
                description: "Empty response",
              },
            },
          },
        },
        "/not-modified": {
          get: {
            responses: {
              304: {
                description: "Empty response",
              },
            },
          },
        },
        "/not-found": {
          get: {
            responses: {
              404: {
                description: "Empty response",
              },
            },
          },
        },
      },
    };

    expect(swaggerToTS(schema)).toEqual(
      format(`
      export interface paths {
        "/no-content": {
          get: {
            responses: {
              /** Empty response */
              204: never;
            };
          };
        };
        "/not-modified": {
          get: {
            responses: {
              /** Empty response */
              304: never;
            };
          };
        };
        "/not-found": {
          get: {
            responses: {
              /** Empty response */
              404: unknown;
            };
          };
        };
      }

      export interface operations {}

      export interface components {}
    `)
    );
  });

  it("requestBody (#338)", () => {
    const schema: OpenAPI3 = {
      openapi: "3.0.1",
      paths: {
        "/tests": {
          post: {
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                    },
                    required: ["title"],
                  },
                },
              },
            },
            responses: {
              201: {
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        title: { type: "string" },
                      },
                      required: ["title", "id"],
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    expect(swaggerToTS(schema)).toEqual(
      format(`
      export interface paths {
        "/tests": {
          post: {
            requestBody: {
              'application/json': {
                title: string;
              }
            }
            responses: {
              201: {
                'application/json': {
                  id: string;
                  title: string;
                }
              };
            };
          };
        };
      }

      export interface operations {}

      export interface components {}
    `)
    );
  });

  it("$refs in paths (#329, #351, #408)", () => {
    const schema: OpenAPI3 = {
      openapi: "3.0.1",
      paths: {
        "/some/path": {
          get: {
            parameters: [{ $ref: "#/components/parameters/param1" }, { $ref: "#/components/parameters/param2" }],
            responses: {
              400: { $ref: "#/components/responses/400BadRequest" },
            },
          },
        },
      },
      components: {
        schemas: {
          BadRequestError: {
            type: "object",
            properties: {
              message: { type: "string" },
              code: {
                type: "string",
                enum: ["capacity_check_failed", "limit_check_failed"],
              },
              activityId: { type: "string" },
            },
            required: ["message"],
          },
        },
        parameters: {
          param1: {
            name: "param1",
            description: "some description",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
          param2: {
            name: "param2",
            in: "query",
            required: false,
            schema: { type: "string" },
          },
        },
        responses: {
          "400BadRequest": {
            description: "There were issues with the request",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    errors: { type: "array", items: { $ref: "#/components/schemas/BadRequestError" } },
                  },
                  required: ["errors"],
                },
              },
            },
          },
        },
      },
    };

    expect(swaggerToTS(schema)).toEqual(
      format(`
      export interface paths {
        "/some/path": {
          get: {
            parameters: {
              query: {
                param1: components["parameters"]["param1"];
                param2?: components["parameters"]["param2"];
              }
            };
            responses: {
              400: components["responses"]["400BadRequest"];
            };
          };
        };
      }

      export interface operations {}

      export interface components {
        parameters: {
          /** some description */
          param1: string;
          param2: string;
        }
        schemas: {
          BadRequestError: {
            message: string;
            code?: 'capacity_check_failed' | 'limit_check_failed';
            activityId?: string;
          }
        }
        responses: {
          /** There were issues with the request */
          "400BadRequest": {
            content: {
              "application/json": {
                errors: components["schemas"]["BadRequestError"][];
              }
            }
          }
        }
      }
    `)
    );
  });

  it("parameters on entire path (#346)", () => {
    const schema: OpenAPI3 = {
      openapi: "3.0.1",
      paths: {
        "/{example}": {
          get: {
            responses: {},
          },
          parameters: [
            {
              name: "example",
              in: "path",
              required: true,
              schema: {
                type: "string",
              },
            },
          ],
        },
      },
    };

    expect(swaggerToTS(schema)).toEqual(
      format(`
      export interface paths {

        "/{example}": {
          get: {
            responses: {};
          };
          parameters: {
            path: {
              example: string;
            };
          };
        };
      }

      export interface operations {}

      export interface components {}
    `)
    );
  });

  it("parameters missing schema (#377)", () => {
    const schema: OpenAPI3 = {
      openapi: "3.0.1",
      paths: {
        "/c/{id}.json": {
          get: {
            description: "Get a list of topics in the specified category\n",
            tags: ["Categories"],
            parameters: [
              {
                name: "id",
                in: "path",
                required: true,
              },
            ],
            responses: {},
          },
        },
      },
    };

    expect(swaggerToTS(schema)).toEqual(
      format(`
      export interface paths {
        "/c/{id}.json": {
          /** Get a list of topics in the specified category */
          get: {
            parameters: {
              path: {
                id: unknown;
              }
            }
            responses: {}
          }
        }
      }

      export interface operations {}

      export interface components {}
      `)
    );
  });

  it("operations interface (#341)", () => {
    const schema: OpenAPI3 = {
      openapi: "3.0.1",
      paths: {
        "/test/{test_id}": {
          get: {
            operationId: "get-test",
            description: "some description",
            parameters: [
              {
                name: "test_id",
                in: "path",
                required: true,
                schema: {
                  type: "string",
                },
              },
            ],
            responses: {},
          },
        },
      },
    };

    expect(swaggerToTS(schema)).toEqual(
      format(`
      export interface paths {
        "/test/{test_id}": {
          get: operations["get-test"];
        };
      }

      export interface operations {
        /** some description */
        "get-test": {
          parameters: {
            path: {
              test_id: string
            }
          },
          responses: {}
        }
      }

      export interface components {}
    `)
    );
  });

  it("paths include 'summary' and 'description'", () => {
    const schema: OpenAPI3 = {
      openapi: "3.0.1",
      paths: {
        "/": {
          summary: "root summary",
          description: "root description",
          get: {
            summary: "get summary",
            description: "get description",
            responses: {},
          },
        },
      },
    };

    expect(swaggerToTS(schema)).toBe(
      format(`
      export interface paths {
        '/': {
          /** get description */
          get: {
            responses: {}
          }
        };
      }

      export interface operations {}

      export interface components {}`)
    );
  });
});
