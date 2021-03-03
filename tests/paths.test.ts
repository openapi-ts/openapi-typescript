import prettier from "prettier";
import { transformPathsObj } from "../src/transform/paths";

const transform = (schema: any, operations: any = { operations: {}, parameters: {} }, parameters?: any) =>
  prettier.format(`export interface paths {\n${transformPathsObj(schema, { operations, parameters }, 3)}\n}`.trim(), {
    parser: "typescript",
  });

describe("transformPathsObj", () => {
  it("basic", () => {
    expect(
      transform({
        "/": {
          get: {
            responses: {
              200: {
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { title: { type: "string" }, body: { type: "string" } },
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
      })
    ).toBe(`export interface paths {
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
  });

  it("empty responses (#333)", () => {
    expect(
      transform({
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
      })
    ).toBe(`export interface paths {
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
}\n`);
  });

  it("requestBody (#338)", () => {
    expect(
      transform({
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
          delete: {
            operationId: "testsDelete",
            requestBody: { $ref: "#/components/schemas/Pet" },
          },
        },
      })
    ).toBe(`export interface paths {
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
  });

  it("$refs in paths (#329, #351, #408)", () => {
    expect(
      transform(
        {
          "/some/path": {
            get: {
              parameters: [{ $ref: "#/components/parameters/param1" }, { $ref: "#/components/parameters/param2" }],
              responses: {
                400: { $ref: "#/components/responses/400BadRequest" },
              },
            },
          },
        },
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
  });

  it("parameters on entire path (#346)", () => {
    expect(
      transform({
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
      })
    ).toBe(`export interface paths {
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
}\n`);
  });

  it("parameters missing schema (#377)", () => {
    expect(
      transform({
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
      })
    ).toBe(`export interface paths {
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
  });

  it("paths include 'summary' and 'description'", () => {
    expect(
      transform({
        "/": {
          summary: "root summary",
          description: "root description",
          get: {
            summary: "get summary",
            description: "get description",
            responses: {},
          },
        },
      })
    ).toBe(`export interface paths {
  /** root description */
  "/": {
    /** get description */
    get: {
      responses: {};
    };
  };
}\n`);
  });
});
