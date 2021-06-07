import prettier from "prettier";
import { transformPathsObj as transform } from "../src/transform/paths";

function format(source: string): string {
  return prettier.format(`export interface paths {\n${source}\n}`, { parser: "typescript" });
}

const defaults = {
  additionalProperties: false,
  globalParameters: {},
  immutableTypes: false,
  defaultNonNullable: false,
  operations: {},
  rawSchema: false,
  version: 3, // both 2 and 3 should generate the same
};

describe("transformPathsObj", () => {
  const basicSchema: any = {
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
                    results: { type: "array", items: { $ref: 'components["schemas"]["SearchResult"]' } },
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
                schema: { $ref: 'components["schemas"]["ErrorResponse"]' },
              },
            },
          },
        },
      },
    },
  };

  it("basic", () => {
    expect(format(transform(basicSchema, { ...defaults }))).toBe(
      format(`
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
  };`)
    );
  });

  it("basic (immutableTypes)", () => {
    expect(format(transform(basicSchema, { ...defaults, immutableTypes: true }))).toBe(
      format(`
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
  };`)
    );
  });

  const emptyResponsesSchema: any = {
    "/no-content": {
      get: {
        responses: {
          200: { description: "OK", content: { "application/json": {} } },
          204: { description: "Empty response" },
        },
      },
    },
    "/not-modified": { get: { responses: { 304: { description: "Empty response" } } } },
    "/not-found": { get: { responses: { 404: { description: "Empty response" } } } },
  };

  it("empty responses (#333, #536)", () => {
    expect(format(transform(emptyResponsesSchema, { ...defaults, version: 3 }))).toBe(
      format(`
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
  };`)
    );
  });

  it("empty responses (immutableTypes)", () => {
    expect(format(transform(emptyResponsesSchema, { ...defaults, immutableTypes: true }))).toBe(
      format(`
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
  };`)
    );
  });

  const requestBodySchema: any = {
    "/tests": {
      post: {
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { title: { type: "string" } },
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
                  properties: { id: { type: "string" }, title: { type: "string" } },
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
        requestBody: { $ref: 'components["schemas"]["Pet"]' },
      },
    },
  };

  it("requestBody (#338)", () => {
    expect(format(transform(requestBodySchema, { ...defaults }))).toBe(
      format(`
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
  };`)
    );
  });

  it("requestBody (immutableTypes)", () => {
    expect(format(transform(requestBodySchema, { ...defaults, immutableTypes: true }))).toBe(
      format(`
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
  };`)
    );
  });

  it("$refs in paths (#329, #351, #408)", () => {
    expect(
      format(
        transform(
          {
            "/some/path": {
              get: {
                parameters: [
                  { $ref: 'components["parameters"]["param1"]' },
                  { $ref: 'components["parameters"]["param2"]' },
                ],
                responses: { 400: { $ref: 'components["responses"]["400BadRequest"]' } },
              },
            },
          },
          {
            ...defaults,
            globalParameters: {
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
          }
        )
      )
    ).toBe(
      format(`
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
  };`)
    );
  });

  it("parameters on entire path (#346)", () => {
    expect(
      format(
        transform(
          {
            "/{example}": {
              get: { responses: {} },
              parameters: [{ name: "example", in: "path", required: true, schema: { type: "string" } }],
            },
          },
          { ...defaults }
        )
      )
    ).toBe(
      format(`
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
  };`)
    );
  });

  it("parameters missing schema (#377)", () => {
    expect(
      format(
        transform(
          {
            "/c/{id}.json": {
              get: {
                description: "Get a list of topics in the specified category\n",
                tags: ["Categories"],
                parameters: [{ name: "id", in: "path", required: true }],
                responses: {},
              },
            },
          },
          { ...defaults }
        )
      )
    ).toBe(
      format(`
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
  };`)
    );
  });

  it("paths include 'summary' and 'description'", () => {
    expect(
      format(
        transform(
          {
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
          { ...defaults }
        )
      )
    ).toBe(
      format(`
  /** root description */
  "/": {
    /** get description */
    get: {
      responses: {};
    };
  };`)
    );
  });
});
