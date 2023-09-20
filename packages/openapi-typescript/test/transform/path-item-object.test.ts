import { astToString } from "../../src/lib/ts.js";
import transformPathItemObject from "../../src/transform/path-item-object.js";
import { DEFAULT_CTX, TestCase } from "../test-helpers.js";

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
    put: never;
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
    delete: never;
    options: never;
    head: never;
    patch: never;
    trace: never;
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
    put: never;
    post: never;
    delete: never;
    options: never;
    head: never;
    patch: never;
    trace: never;
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
    put: never;
    post: never;
    delete: never;
    options: never;
    head: never;
    patch: never;
    trace: never;
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
    get: never;
    put: never;
    post: never;
    delete: never;
    options: never;
    head: never;
    patch: never;
    trace: never;
}`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_OPTIONS.ctx, excludeDeprecated: true },
        },
      },
    ],
  ];

  test.each(tests)("%s", (_, { given, want, options = DEFAULT_OPTIONS }) => {
    const ast = transformPathItemObject(given, options);
    expect(astToString(ast).trim()).toBe(want.trim());
  });
});
