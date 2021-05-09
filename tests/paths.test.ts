import prettier from "prettier";
import { transformPathsObj } from "../src/transform/paths";

const transform = (schema: any, operations: any = { operations: {}, globalParameters: {} }, globalParameters?: any) =>
  prettier.format(
    `export interface paths {\n${transformPathsObj(schema, {
      globalParameters,
      immutableTypes: operations.immutableTypes,
      document: schema,
      operations,
      version: 3,
    })}\n}`.trim(),
    {
      parser: "typescript",
    }
  );

describe("transformPathsObj", () => {
  it("basic", () => {
    const basicSchema = {
      "/": {
        get: {
          responses: {
            200: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { title: { type: "string" }, body: { type: "string" } },
                    additionalProperties: false,
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
            { name: "q", in: "query", required: true, schema: { type: "string" } },
            { name: "p", in: "query", schema: { type: "integer" } },
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
                    additionalProperties: false,
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
    };

    expect(transform(basicSchema)).toBe(`export interface paths {
  "/": {
    get: {
      responses: {
        200: {
          content: {
            "application/json": {
              title: string;
              body: string;
            };
          };
        };
      };
    };
  };
  "/search": {
    post: {
      parameters: {
        query: {
          q: string;
          p?: number;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": {
              results?: components["schemas"]["SearchResult"][];
              total: number;
            };
          };
        };
        404: {
          content: {
            "application/json": components["schemas"]["ErrorResponse"];
          };
        };
      };
    };
  };
}\n`);

    expect(transform(basicSchema, { immutableTypes: true })).toBe(`export interface paths {
  readonly "/": {
    readonly get: {
      readonly responses: {
        readonly 200: {
          readonly content: {
            readonly "application/json": {
              readonly title: string;
              readonly body: string;
            };
          };
        };
      };
    };
  };
  readonly "/search": {
    readonly post: {
      readonly parameters: {
        readonly query: {
          readonly q: string;
          readonly p?: number;
        };
      };
      readonly responses: {
        readonly 200: {
          readonly content: {
            readonly "application/json": {
              readonly results?: readonly components["schemas"]["SearchResult"][];
              readonly total: number;
            };
          };
        };
        readonly 404: {
          readonly content: {
            readonly "application/json": components["schemas"]["ErrorResponse"];
          };
        };
      };
    };
  };
}\n`);
  });

  it("empty responses (#333, #536)", () => {
    const emptyResponsesSchema = {
      "/no-content": {
        get: {
          responses: {
            200: {
              description: "OK",
              content: {
                "application/json": {},
              },
            },
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
    };

    expect(transform(emptyResponsesSchema)).toBe(`export interface paths {
  "/no-content": {
    get: {
      responses: {
        /** OK */
        200: {
          content: {
            "application/json": unknown;
          };
        };
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
}\n`);

    expect(transform(emptyResponsesSchema, { immutableTypes: true })).toBe(`export interface paths {
  readonly "/no-content": {
    readonly get: {
      readonly responses: {
        /** OK */
        readonly 200: {
          readonly content: {
            readonly "application/json": unknown;
          };
        };
        /** Empty response */
        readonly 204: never;
      };
    };
  };
  readonly "/not-modified": {
    readonly get: {
      readonly responses: {
        /** Empty response */
        readonly 304: never;
      };
    };
  };
  readonly "/not-found": {
    readonly get: {
      readonly responses: {
        /** Empty response */
        readonly 404: unknown;
      };
    };
  };
}\n`);
  });

  it("requestBody (#338)", () => {
    const requestBodySchema = {
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
                  additionalProperties: false,
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
                    additionalProperties: false,
                    required: ["title", "id"],
                  },
                },
              },
            },
          },
        },
        delete: {
          operationId: "testsDelete",
          requestBody: { $ref: "#/components/schemas/Pet" },
        },
      },
    };

    expect(transform(requestBodySchema)).toBe(`export interface paths {
  "/tests": {
    post: {
      responses: {
        201: {
          content: {
            "application/json": {
              id: string;
              title: string;
            };
          };
        };
      };
      requestBody: {
        content: {
          "application/json": {
            title: string;
          };
        };
      };
    };
    delete: operations["testsDelete"];
  };
}\n`);

    expect(transform(requestBodySchema, { immutableTypes: true })).toBe(`export interface paths {
  readonly "/tests": {
    readonly post: {
      readonly responses: {
        readonly 201: {
          readonly content: {
            readonly "application/json": {
              readonly id: string;
              readonly title: string;
            };
          };
        };
      };
      readonly requestBody: {
        readonly content: {
          readonly "application/json": {
            readonly title: string;
          };
        };
      };
    };
    readonly delete: operations["testsDelete"];
  };
}\n`);
  });

  it("$refs in paths (#329, #351, #408)", () => {
    const refsSchema = {
      "/some/path": {
        get: {
          parameters: [{ $ref: "#/components/parameters/param1" }, { $ref: "#/components/parameters/param2" }],
          responses: {
            400: { $ref: "#/components/responses/400BadRequest" },
          },
        },
      },
    };

    expect(
      transform(
        refsSchema,
        {},
        {
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
        }
      )
    ).toBe(`export interface paths {
  "/some/path": {
    get: {
      parameters: {
        query: {
          /** some description */
          param1: components["parameters"]["param1"];
          param2?: components["parameters"]["param2"];
        };
      };
      responses: {
        400: components["responses"]["400BadRequest"];
      };
    };
  };
}\n`);

    expect(
      transform(
        refsSchema,
        { immutableTypes: true },
        {
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
        }
      )
    ).toBe(`export interface paths {
  readonly "/some/path": {
    readonly get: {
      readonly parameters: {
        readonly query: {
          /** some description */
          readonly param1: components["parameters"]["param1"];
          readonly param2?: components["parameters"]["param2"];
        };
      };
      readonly responses: {
        readonly 400: components["responses"]["400BadRequest"];
      };
    };
  };
}\n`);
  });

  it("parameters on entire path (#346)", () => {
    const parametersSchema = {
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
    };

    expect(transform(parametersSchema)).toBe(`export interface paths {
  "/{example}": {
    get: {
      parameters: {
        path: {
          example: string;
        };
      };
      responses: {};
    };
    parameters: {
      path: {
        example: string;
      };
    };
  };
}\n`);

    expect(transform(parametersSchema, { immutableTypes: true })).toBe(`export interface paths {
  readonly "/{example}": {
    readonly get: {
      readonly parameters: {
        readonly path: {
          readonly example: string;
        };
      };
      readonly responses: {};
    };
    readonly parameters: {
      readonly path: {
        readonly example: string;
      };
    };
  };
}\n`);
  });

  it("parameters missing schema (#377)", () => {
    const parametersMissingSchema = {
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
    };

    expect(transform(parametersMissingSchema)).toBe(`export interface paths {
  "/c/{id}.json": {
    /** Get a list of topics in the specified category */
    get: {
      parameters: {
        path: {
          id: unknown;
        };
      };
      responses: {};
    };
  };
}\n`);

    expect(transform(parametersMissingSchema, { immutableTypes: true })).toBe(`export interface paths {
  readonly "/c/{id}.json": {
    /** Get a list of topics in the specified category */
    readonly get: {
      readonly parameters: {
        readonly path: {
          readonly id: unknown;
        };
      };
      readonly responses: {};
    };
  };
}\n`);
  });

  it("paths include 'summary' and 'description'", () => {
    const pathsIncludeSchema = {
      "/": {
        summary: "root summary",
        description: "root description",
        get: {
          summary: "get summary",
          description: "get description",
          responses: {},
        },
      },
    };

    expect(transform(pathsIncludeSchema)).toBe(`export interface paths {
  /** root description */
  "/": {
    /** get description */
    get: {
      responses: {};
    };
  };
}\n`);

    expect(transform(pathsIncludeSchema, { immutableTypes: true })).toBe(`export interface paths {
  /** root description */
  readonly "/": {
    /** get description */
    readonly get: {
      readonly responses: {};
    };
  };
}\n`);
  });
});
