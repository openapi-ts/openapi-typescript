import { fileURLToPath } from "node:url";
import { astToString } from "../../src/lib/ts.js";
import transformPathsObject from "../../src/transform/paths-object.js";
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
          "/api/v1/user/me": {
            parameters: [
              {
                name: "page",
                in: "query",
                schema: { type: "number" },
                description: "Page number.",
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
        want: `{
    "/api/v1/user/me": {
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
                path?: never;
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
