import { fileURLToPath } from "node:url";
import { astToString } from "../../src/lib/ts.js";
import transformPathItemObject from "../../src/transform/path-item-object.js";
import { DEFAULT_CTX, type TestCase } from "../test-helpers.js";

const DEFAULT_OPTIONS = {
  path: "#/paths/~1get-item",
  ctx: { ...DEFAULT_CTX },
};

describe("transformPathItemObject", () => {
  const tests: TestCase[] = [
    [
      "basic",
      {
        given: {
          get: {
            description: "Basic GET",
            responses: {
              200: {
                description: "OK",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean" },
                      },
                      required: ["success"],
                    },
                  },
                },
              },
              404: { $ref: "#/components/responses/NotFound" },
              "5xx": {
                description: "Server error",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        message: { type: "string" },
                        code: { type: "string" },
                      },
                      required: ["message"],
                    },
                  },
                },
              },
            },
          },
          put: {
            description: "Basic PUT",
            requestbody: {
              "application/json": { $ref: "#/components/schemas/User" },
            },
            responses: {
              200: { $ref: "#/components/responses/AllGood" },
              404: { $ref: "#/components/responses/NotFound" },
            },
          },
          post: {
            description: "Basic POST",
            requestBody: {
              content: {
                "application/json": { $ref: "#/components/schemas/User" },
              },
            },
            responses: {
              200: { $ref: "#/components/responses/AllGood" },
              404: { $ref: "#/components/responses/NotFound" },
            },
          },
          delete: {
            description: "Basic DELETE",
            requestbody: {
              "application/json": { $ref: "#/components/schemas/User" },
            },
            responses: {
              200: { $ref: "#/components/responses/AllGood" },
              404: { $ref: "#/components/responses/NotFound" },
            },
          },
          options: {
            description: "Basic OPTIONS",
            responses: {
              200: { $ref: "#/components/responses/AllGood" },
            },
          },
          head: {
            description: "Basic HEAD",
            responses: {
              200: { $ref: "#/components/responses/AllGood" },
            },
          },
          patch: {
            description: "Basic PATCH",
            requestbody: {
              "application/json": { $ref: "#/components/schemas/User" },
            },
            responses: {
              200: { $ref: "#/components/responses/AllGood" },
              404: { $ref: "#/components/responses/NotFound" },
            },
          },
          trace: {
            description: "Basic TRACE",
            responses: {
              200: { $ref: "#/components/responses/AllGood" },
            },
          },
        },
        want: `{
    parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
    };
    /** @description Basic GET */
    get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        success: boolean;
                    };
                };
            };
            404: components["responses"]["NotFound"];
            /** @description Server error */
            "5xx": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        message: string;
                        code?: string;
                    };
                };
            };
        };
    };
    /** @description Basic PUT */
    put: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["AllGood"];
            404: components["responses"]["NotFound"];
        };
    };
    /** @description Basic POST */
    post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["User"];
            };
        };
        responses: {
            200: components["responses"]["AllGood"];
            404: components["responses"]["NotFound"];
        };
    };
    /** @description Basic DELETE */
    delete: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["AllGood"];
            404: components["responses"]["NotFound"];
        };
    };
    /** @description Basic OPTIONS */
    options: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["AllGood"];
        };
    };
    /** @description Basic HEAD */
    head: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["AllGood"];
        };
    };
    /** @description Basic PATCH */
    patch: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["AllGood"];
            404: components["responses"]["NotFound"];
        };
    };
    /** @description Basic TRACE */
    trace: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["AllGood"];
        };
    };
}`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "operations",
      {
        given: {
          get: {
            description: "Get a user",
            operationId: "getUser",
            responses: {
              200: {
                description: "Get User",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        url: { type: "string" },
                        "content-type": { type: "string" },
                      },
                      required: ["url"],
                    },
                  },
                },
              },
            },
          },
        },
        want: `{
    parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
    };
    /** @description Get a user */
    get: operations["getUser"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
}`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "$ref",
      {
        given: {
          get: {
            $ref: "#/components/schemas/GetUserOperation",
          },
        },
        want: `{
    parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
    };
    get: components["schemas"]["GetUserOperation"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
}`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "options > excludeDeprecated: true",
      {
        given: {
          get: {
            deprecated: true,
          },
        },
        want: `{
    parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
}`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx, excludeDeprecated: true },
        },
      },
    ],
  ];

  for (const [testName, { given, want, options = DEFAULT_OPTIONS, ci }] of tests) {
    test.skipIf(ci?.skipIf)(
      testName,
      async () => {
        const result = astToString(transformPathItemObject(given, options));
        if (want instanceof URL) {
          expect(result).toMatchFileSnapshot(fileURLToPath(want));
        } else {
          expect(result).toBe(`${want}\n`);
        }
      },
      ci?.timeout,
    );
  }
});
