import { fileURLToPath } from "node:url";
import { astToString } from "../../src/lib/ts.js";
import { transformPathsObject, transformDynamicPathsObject } from "../../src/transform/paths-object.js";
import type { GlobalContext } from "../../src/types.js";
import { DEFAULT_CTX, type TestCase } from "../test-helpers.js";

const DEFAULT_OPTIONS = DEFAULT_CTX;

describe("transformPathsObject", () => {
  const tests: TestCase<any, GlobalContext>[] = [
    [
      "basic",
      {
        given: {
          "/api/v1/user/{user_id}": {
            parameters: [
              {
                name: "page",
                in: "query",
                schema: { type: "number" },
                description: "Page number.",
              },
            ],
            get: {
              parameters: [{ name: "user_id", in: "path", description: "User ID." }],
              responses: {
                200: {
                  description: "OK",
                  headers: {
                    Link: {
                      $ref: "#/components/headers/link",
                    },
                  },
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          email: { type: "string" },
                          name: { type: "string" },
                        },
                        required: ["id", "email"],
                      },
                    },
                  },
                },
                404: {
                  $ref: "#/components/responses/NotFound",
                },
              },
            },
          },
        },
        want: `{
    "/api/v1/user/{user_id}": {
        parameters: {
            query?: {
                /** @description Page number. */
                page?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    /** @description Page number. */
                    page?: number;
                };
                header?: never;
                path: {
                    /** @description User ID. */
                    user_id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        Link: components["headers"]["link"];
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            id: string;
                            email: string;
                            name?: string;
                        };
                    };
                };
                404: components["responses"]["NotFound"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "$ref",
      {
        given: {
          "/api/{version}/user/{user_id}": {
            parameters: [
              { $ref: "#/components/parameters/utm_source" },
              { $ref: "#/components/parameters/utm_email" },
              { $ref: "#/components/parameters/utm_campaign" },
              { $ref: "#/components/parameters/version" },
              { in: "query", name: "page", schema: { type: "number" } },
              { in: "path", name: "user_id" },
            ],
          },
        },
        want: `{
    "/api/{version}/user/{user_id}": {
        parameters: {
            query?: {
                utm_source?: components["parameters"]["utm_source"];
                utm_email?: components["parameters"]["utm_email"];
                utm_campaign?: components["parameters"]["utm_campaign"];
                page?: number;
            };
            header?: never;
            path: {
                version: components["parameters"]["version"];
                user_id: string;
            };
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
    };
}`,
        options: {
          ...DEFAULT_OPTIONS,
          resolve($ref) {
            switch ($ref) {
              case "#/components/parameters/utm_source": {
                return {
                  in: "query",
                  name: "utm_source",
                  schema: { type: "string" },
                };
              }
              case "#/components/parameters/utm_email": {
                return {
                  in: "query",
                  name: "utm_email",
                  schema: { type: "string" },
                };
              }
              case "#/components/parameters/utm_campaign": {
                return {
                  in: "query",
                  name: "utm_campaign",
                  schema: { type: "string" },
                };
              }
              case "#/components/parameters/version": {
                return {
                  in: "path",
                  name: "version",
                  schema: { type: "string" },
                };
              }
              default: {
                return undefined as any;
              }
            }
          },
        },
      },
    ],
    [
      "options > alphabetize: true",
      {
        given: {
          "/api/{version}/user/{user_id}": {
            parameters: [
              { in: "query", name: "page", schema: { type: "number" } },
              { $ref: "#/components/parameters/utm_source" },
              { $ref: "#/components/parameters/utm_email" },
              { $ref: "#/components/parameters/utm_campaign" },
              { $ref: "#/components/parameters/version" },
              { in: "path", name: "user_id" },
            ],
          },
        },
        want: `{
    "/api/{version}/user/{user_id}": {
        parameters: {
            query?: {
                page?: number;
                utm_campaign?: components["parameters"]["utm_campaign"];
                utm_email?: components["parameters"]["utm_email"];
                utm_source?: components["parameters"]["utm_source"];
            };
            header?: never;
            path: {
                user_id: string;
                version: components["parameters"]["version"];
            };
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
    };
}`,
        options: {
          ...DEFAULT_OPTIONS,
          alphabetize: true,
          resolve($ref) {
            switch ($ref) {
              case "#/components/parameters/utm_source": {
                return {
                  in: "query",
                  name: "utm_source",
                  schema: { type: "string" },
                };
              }
              case "#/components/parameters/utm_email": {
                return {
                  in: "query",
                  name: "utm_email",
                  schema: { type: "string" },
                };
              }
              case "#/components/parameters/utm_campaign": {
                return {
                  in: "query",
                  name: "utm_campaign",
                  schema: { type: "string" },
                };
              }
              case "#/components/parameters/version": {
                return {
                  in: "path",
                  name: "version",
                  schema: { type: "string" },
                };
              }
              default: {
                return undefined as any;
              }
            }
          },
        },
      },
    ],
    [
      "options > pathParamsAsTypes: true",
      {
        given: {
          "/api/v1/user/{user_id}": {
            parameters: [
              {
                name: "page",
                in: "query",
                schema: { type: "number" },
                description: "Page number.",
              },
              {
                name: "user_id",
                in: "path",
                schema: { format: "int64", type: "integer" },
              },
            ],
            get: {
              parameters: [],
              responses: {
                200: {
                  description: "OK",
                  headers: {
                    Link: {
                      $ref: "#/components/headers/link",
                    },
                  },
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          email: { type: "string" },
                          name: { type: "string" },
                        },
                        required: ["id", "email"],
                      },
                    },
                  },
                },
                404: {
                  $ref: "#/components/responses/NotFound",
                },
              },
            },
          },
        },
        want: "{}",
        options: { ...DEFAULT_OPTIONS, pathParamsAsTypes: true },
      },
    ],
  ];

  for (const [testName, { given, want, options = DEFAULT_OPTIONS, ci }] of tests) {
    test.skipIf(ci?.skipIf)(
      testName,
      async () => {
        const result = astToString(transformPathsObject(given, options));
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

describe("transformDynamicPathsObject", () => {
  const tests: TestCase<any, GlobalContext>[] = [
    [
      "basic path parameters with different types",
      {
        given: {
          "/api/v1/users/{userId}": {
            parameters: [
              {
                name: "userId",
                in: "path",
                schema: { type: "integer" },
                description: "User ID.",
              },
            ],
            get: {
              responses: {
                200: {
                  description: "OK",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          id: { type: "integer" },
                          name: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "/api/v1/items/{itemId}/tags/{tagName}": {
            parameters: [
              {
                name: "itemId",
                in: "path",
                schema: { type: "integer" },
                description: "Item ID.",
              },
              {
                name: "tagName",
                in: "path",
                schema: { type: "string" },
                description: "Tag name.",
              },
            ],
            get: {
              responses: {
                200: {
                  description: "OK",
                  content: {
                    "application/json": {
                      schema: {
                        type: "array",
                        items: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        want: `{
    [path: \`/api/v1/users/\${number}\`]: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description User ID. */
                userId: number;
            };
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description User ID. */
                    userId: number;
                };
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
                            id?: number;
                            name?: string;
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
} & {
    [path: \`/api/v1/items/\${number}/tags/\${string}\`]: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Item ID. */
                itemId: number;
                /** @description Tag name. */
                tagName: string;
            };
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description Item ID. */
                    itemId: number;
                    /** @description Tag name. */
                    tagName: string;
                };
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
                        "application/json": string[];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}`,
        options: { ...DEFAULT_OPTIONS, pathParamsAsTypes: true },
      },
    ],
    [
      "path parameters with $ref",
      {
        given: {
          "/api/v1/users/{userId}/posts/{postId}": {
            parameters: [{ $ref: "#/components/parameters/userId" }, { $ref: "#/components/parameters/postId" }],
            get: {
              responses: {
                200: {
                  description: "OK",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          content: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        want: `{
    [path: \`/api/v1/users/\${number}/posts/\${string}\`]: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                userId: components["parameters"]["userId"];
                postId: components["parameters"]["postId"];
            };
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    userId: components["parameters"]["userId"];
                    postId: components["parameters"]["postId"];
                };
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
                            title?: string;
                            content?: string;
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}`,
        options: {
          ...DEFAULT_OPTIONS,
          pathParamsAsTypes: true,
          resolve($ref) {
            switch ($ref) {
              case "#/components/parameters/userId": {
                return {
                  in: "path",
                  name: "userId",
                  schema: { type: "integer" },
                };
              }
              case "#/components/parameters/postId": {
                return {
                  in: "path",
                  name: "postId",
                  schema: { type: "string" },
                };
              }
              default: {
                return undefined as any;
              }
            }
          },
        },
      },
    ],
    [
      "pathParamsAsTypes: false",
      {
        given: {
          "/api/v1/users/{userId}": {
            parameters: [
              {
                name: "userId",
                in: "path",
                schema: { type: "integer" },
                description: "User ID.",
              },
            ],
          },
        },
        want: "{}",
        options: { ...DEFAULT_OPTIONS, pathParamsAsTypes: false },
      },
    ],
  ];

  for (const [testName, { given, want, options = DEFAULT_OPTIONS, ci }] of tests) {
    test.skipIf(ci?.skipIf)(
      testName,
      async () => {
        const result = astToString(transformDynamicPathsObject(given, options));
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
