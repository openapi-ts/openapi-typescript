import { fileURLToPath } from "node:url";
import ts from "typescript";
import openapiTS, { COMMENT_HEADER, astToString } from "../src/index.js";
import type { OpenAPITSOptions } from "../src/types.js";
import type { TestCase } from "./test-helpers.js";

const EXAMPLES_DIR = new URL("../examples/", import.meta.url);

const DATE = ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("Date"));
const BLOB = ts.factory.createTypeReferenceNode("Blob");

describe("Node.js API", () => {
  const tests: TestCase<any, OpenAPITSOptions>[] = [
    [
      "input > string > YAML",
      {
        given: `openapi: "3.1"
info:
  title: test
  version: 1.0`,
        want: `export type paths = Record<string, never>;
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
export type operations = Record<string, never>;`,
      },
      // options: DEFAULT_OPTIONS,
    ],
    [
      "input > string > JSON",
      {
        given: JSON.stringify({
          openapi: "3.1",
          info: { title: "test", version: "1.0" },
        }),
        want: `export type paths = Record<string, never>;
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
export type operations = Record<string, never>;`,
      },
      // options: DEFAULT_OPTIONS,
    ],
    [
      "input > string > URL",
      {
        given: "https://raw.githubusercontent.com/Redocly/redocly-cli/main/__tests__/lint/oas3.1/openapi.yaml",
        want: new URL("simple-example.ts", EXAMPLES_DIR),
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "input > URL > remote",
      {
        given: new URL("https://raw.githubusercontent.com/Redocly/redocly-cli/main/__tests__/lint/oas3.1/openapi.yaml"),
        want: new URL("simple-example.ts", EXAMPLES_DIR),
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "input > URL > local",
      {
        given: new URL("./simple-example.yaml", EXAMPLES_DIR),
        want: new URL("simple-example.ts", EXAMPLES_DIR),
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "input > object",
      {
        given: {
          openapi: "3.1",
          info: { title: "test", version: "1.0" },
        },
        want: `export type paths = Record<string, never>;
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
export type operations = Record<string, never>;`,
      },
      // options: DEFAULT_OPTIONS,
    ],
    [
      "input > buffer",
      {
        given: Buffer.from(`openapi: "3.1"
info:
  title: test
  version: 1.0`),
        want: `export type paths = Record<string, never>;
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
export type operations = Record<string, never>;`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "options > exportType > false",
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
export type operations = Record<string, never>;`,
        options: { exportType: false },
      },
    ],
    [
      "options > exportType > true",
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
export type operations = Record<string, never>;`,
        options: { exportType: true },
      },
    ],
    [
      "options > pathParamsAsTypes > false",
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
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
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
export type operations = Record<string, never>;`,
        options: { pathParamsAsTypes: false },
      },
    ],
    [
      "options > pathParamsAsTypes > true",
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
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
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
export type operations = Record<string, never>;`,
        options: { pathParamsAsTypes: true },
      },
    ],
    [
      "options > transform",
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
export type operations = Record<string, never>;`,
        options: {
          transform(schemaObject) {
            if ("format" in schemaObject && schemaObject.format === "date-time") {
              /**
               * Tip: use astexplorer.net to first type out the desired TypeScript,
               * then use the `typescript` parser and it will tell you the desired
               * AST
               */
              return DATE;
            }
          },
        },
      },
    ],
    [
      "options > transform with schema object",
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
        Date?: Date;
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;`,
        options: {
          transform(schemaObject) {
            if ("format" in schemaObject && schemaObject.format === "date-time") {
              return {
                schema: DATE,
                questionToken: true,
              };
            }
          },
        },
      },
    ],
    [
      "options > transform with blob",
      {
        given: {
          openapi: "3.1",
          info: { title: "Test", version: "1.0" },
          components: {
            requestBodies: {
              Blob: {
                content: {
                  "application/json": {
                    schema: {
                      type: "string",
                      format: "binary",
                    },
                  },
                },
              },
            },
          },
        },
        want: `export type paths = Record<string, never>;
export type webhooks = Record<string, never>;
export interface components {
    schemas: never;
    responses: never;
    parameters: never;
    requestBodies: {
        Blob: {
            content: {
                "application/json": Blob;
            };
        };
    };
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;`,
        options: {
          transform(schemaObject) {
            if (schemaObject.format === "binary") {
              return BLOB;
            }
          },
        },
      },
    ],
    [
      "options > transform with optional blob property",
      {
        given: {
          openapi: "3.1",
          info: { title: "Test", version: "1.0" },
          components: {
            requestBodies: {
              Blob: {
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        blob: { type: "string", format: "binary" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        want: `export type paths = Record<string, never>;
export type webhooks = Record<string, never>;
export interface components {
    schemas: never;
    responses: never;
    parameters: never;
    requestBodies: {
        Blob: {
            content: {
                "application/json": {
                    /** Format: binary */
                    blob?: Blob;
                };
            };
        };
    };
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;`,
        options: {
          transform(schemaObject) {
            if (schemaObject.format === "binary") {
              return {
                schema: BLOB,
                questionToken: true,
              };
            }
          },
        },
      },
    ],
    [
      "options > postTransform",
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
export type operations = Record<string, never>;`,
        options: {
          postTransform(type, options) {
            if (options.path?.includes("Date")) {
              /**
               * Tip: use astexplorer.net to first type out the desired TypeScript,
               * then use the `typescript` parser and it will tell you the desired
               * AST
               */
              return ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("DateOrTime"));
            }
          },
        },
      },
    ],
    [
      "options > enum",
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
              XEnumVarnames: {
                type: "number",
                enum: [0, 1, 2],
                "x-enum-varnames": ["Success", "Warning", "Error"],
                "x-enum-descriptions": [
                  "Used when the status of something is successful",
                  "Used when the status of something has a warning",
                  "Used when the status of something has an error",
                ],
              },
              XEnumNames: {
                type: "number",
                enum: [1, 2, 3],
                "x-enumNames": ["Uno", "Dos", "Tres"],
                "x-enumDescriptions": ["El número uno", "El número dos", "El número tres"],
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
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** @enum {string} */
        Status: Status;
        /** @enum {number} */
        ErrorCode: ErrorCode;
        /** @enum {number} */
        XEnumVarnames: XEnumVarnames;
        /** @enum {number} */
        XEnumNames: XEnumNames;
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
export enum XEnumVarnames {
    // Used when the status of something is successful
    Success = 0,
    // Used when the status of something has a warning
    Warning = 1,
    // Used when the status of something has an error
    Error = 2
}
export enum XEnumNames {
    // El número uno
    Uno = 1,
    // El número dos
    Dos = 2,
    // El número tres
    Tres = 3
}
export type operations = Record<string, never>;`,
        options: { enum: true },
      },
    ],
    [
      "options > enumValues",
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
                    status?: "active" | "inactive";
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: never;
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** @enum {string} */
        Status: "active" | "inactive";
        /** @enum {number} */
        ErrorCode: 100 | 101 | 102 | 103 | 104 | 105;
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export const pathsUrlGetParametersQueryStatusValues: ReadonlyArray<paths["/url"]["get"]["parameters"]["query"]["status"]> = ["active", "inactive"];
export const statusValues: ReadonlyArray<components["schemas"]["Status"]> = ["active", "inactive"];
export const errorCodeValues: ReadonlyArray<components["schemas"]["ErrorCode"]> = [100, 101, 102, 103, 104, 105];
export type operations = Record<string, never>;`,
        options: { enumValues: true },
      },
    ],
    [
      "snapshot > GitHub",
      {
        given: new URL("./github-api.yaml", EXAMPLES_DIR),
        want: new URL("./github-api.ts", EXAMPLES_DIR),
        // options: DEFAULT_OPTIONS,
        ci: { timeout: 3_000 },
      },
    ],
    [
      "snapshot > GitHub (next)",
      {
        given: new URL("./github-api-next.yaml", EXAMPLES_DIR),
        want: new URL("./github-api-next.ts", EXAMPLES_DIR),
        // options: DEFAULT_OPTIONS,
        ci: { timeout: 30_000 },
      },
    ],
    [
      "snapshot > Octokit GHES 3.6 Diff to API",
      {
        given: new URL("./octokit-ghes-3.6-diff-to-api.json", EXAMPLES_DIR),
        want: new URL("./octokit-ghes-3.6-diff-to-api.ts", EXAMPLES_DIR),
        // options: DEFAULT_OPTIONS,
        ci: { timeout: 30_000 },
      },
    ],
    [
      "snapshot > Stripe",
      {
        given: new URL("./stripe-api.yaml", EXAMPLES_DIR),
        want: new URL("./stripe-api.ts", EXAMPLES_DIR),
        // options: DEFAULT_OPTIONS,
        ci: { timeout: 30_000 },
      },
    ],
    [
      "snapshot > DigitalOcean",
      {
        given: new URL("./digital-ocean-api/DigitalOcean-public.v2.yaml", EXAMPLES_DIR),
        want: new URL("./digital-ocean-api.ts", EXAMPLES_DIR),
        // options: DEFAULT_OPTIONS,
        ci: { timeout: 30_000 },
      },
    ],
  ];

  for (const [testName, { given, want, options, ci }] of tests) {
    test.skipIf(ci?.skipIf)(
      testName,
      async () => {
        const result = astToString(await openapiTS(given, options));
        if (want instanceof URL) {
          expect(`${COMMENT_HEADER}${result}`).toMatchFileSnapshot(fileURLToPath(want));
        } else {
          expect(result).toBe(`${want}\n`);
        }
      },
      ci?.timeout || 5000,
    );
  }
});
