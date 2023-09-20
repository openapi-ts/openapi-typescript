import ts from "typescript";
import openapiTS, { astToString } from "../src/index.js";
import { OpenAPITSOptions } from "../src/types.js";
import { TestCase } from "./test-helpers.js";

describe("Node.js API", () => {
  const tests: TestCase<any, OpenAPITSOptions>[] = [
    [
      "exportType > false",
      {
        given: {
          openapi: "3.1",
          info: { title: "Test", version: "1.0" },
          components: {
            schemas: {
              User: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                },
                required: ["name", "email"],
              },
            },
          },
        },

        want: `export type paths = Record<string, never>;
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        User: {
            name: string;
            email: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
`,
        options: { exportType: false },
      },
    ],
    [
      "exportType > true",
      {
        given: {
          openapi: "3.1",
          info: { title: "Test", version: "1.0" },
          components: {
            schemas: {
              User: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                },
                required: ["name", "email"],
              },
            },
          },
        },
        want: `export type paths = Record<string, never>;
export type webhooks = Record<string, never>;
export type components = {
    schemas: {
        User: {
            name: string;
            email: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
};
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
`,
        options: { exportType: true },
      },
    ],

    [
      "pathParamsAsTypes > false",
      {
        given: {
          openapi: "3.1",
          info: { title: "Test", version: "1.0" },
          paths: {
            "/user/{user_id}": {
              get: {
                parameters: [{ name: "user_id", in: "path" }],
              },
              put: {
                parameters: [{ name: "user_id", in: "path" }],
              },
            },
          },
        },
        want: `export interface paths {
    "/user/{user_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    user_id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: never;
        };
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    user_id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: never;
        };
        post: never;
        delete: never;
        options: never;
        head: never;
        patch: never;
        trace: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: never;
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
`,
        options: { pathParamsAsTypes: false },
      },
    ],
    [
      "pathParamsAsTypes > true",
      {
        given: {
          openapi: "3.1",
          info: { title: "Test", version: "1.0" },
          paths: {
            "/user/{user_id}": {
              get: {
                parameters: [{ name: "user_id", in: "path" }],
              },
              put: {
                parameters: [{ name: "user_id", in: "path" }],
              },
            },
          },
        },
        want: `export interface paths {
    [path: \`/user/\${string}\`]: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    user_id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: never;
        };
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    user_id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: never;
        };
        post: never;
        delete: never;
        options: never;
        head: never;
        patch: never;
        trace: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: never;
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
`,
        options: { pathParamsAsTypes: true },
      },
    ],
    [
      "transform",
      {
        given: {
          openapi: "3.1",
          info: { title: "Test", version: "1.0" },
          components: {
            schemas: {
              Date: { type: "string", format: "date-time" },
            },
          },
        },
        want: `export type paths = Record<string, never>;
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** Format: date-time */
        Date: Date;
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
`,
        options: {
          transform(schemaObject) {
            if (
              "format" in schemaObject &&
              schemaObject.format === "date-time"
            ) {
              /**
               * Tip: use astexplorer.net to first type out the desired TypeScript,
               * then use the `typescript` parser and it will tell you the desired
               * AST
               */
              return ts.factory.createTypeReferenceNode(
                ts.factory.createIdentifier("Date"),
              );
            }
          },
        },
      },
    ],
    [
      "postTransform",
      {
        given: {
          openapi: "3.1",
          info: { title: "Test", version: "1.0" },
          components: {
            schemas: {
              Date: { type: "string", format: "date-time" },
            },
          },
        },
        want: `export type paths = Record<string, never>;
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** Format: date-time */
        Date: DateOrTime;
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
`,
        options: {
          postTransform(type, options) {
            if (options.path?.includes("Date")) {
              /**
               * Tip: use astexplorer.net to first type out the desired TypeScript,
               * then use the `typescript` parser and it will tell you the desired
               * AST
               */
              return ts.factory.createTypeReferenceNode(
                ts.factory.createIdentifier("DateOrTime"),
              );
            }
          },
        },
      },
    ],
    [
      "enum",
      {
        given: {
          openapi: "3.1",
          info: { title: "Test", version: "1.0" },
          paths: {
            "/url": {
              get: {
                parameters: [
                  {
                    name: "status",
                    in: "query",
                    schema: {
                      type: "string",
                      enum: ["active", "inactive"],
                    },
                  },
                ],
              },
            },
          },
          components: {
            schemas: {
              Status: {
                type: "string",
                enum: ["active", "inactive"],
              },
              ErrorCode: {
                type: "number",
                enum: [100, 101, 102, 103, 104, 105],
              },
            },
          },
        },
        want: `export interface paths {
    "/url": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    status?: PathsUrlGetParametersQueryStatus;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: never;
        };
        put: never;
        post: never;
        delete: never;
        options: never;
        head: never;
        patch: never;
        trace: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** @enum {string} */
        Status: Status;
        /** @enum {number} */
        ErrorCode: ErrorCode;
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export enum PathsUrlGetParametersQueryStatus {
    active = "active",
    inactive = "inactive"
}
export enum Status {
    active = "active",
    inactive = "inactive"
}
export enum ErrorCode {
    Value100 = 100,
    Value101 = 101,
    Value102 = 102,
    Value103 = 103,
    Value104 = 104,
    Value105 = 105
}
export type operations = Record<string, never>;
`,
        options: { enum: true },
      },
    ],
  ];

  test.each(tests)("%s", async (_, { given, want, options }) => {
    expect(astToString(await openapiTS(given, options))).toBe(want);
  });
});
