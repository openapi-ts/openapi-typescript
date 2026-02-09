import { fileURLToPath } from "node:url";
import ts from "typescript";
import openapiTS, { astToString, COMMENT_HEADER } from "../src/index.js";
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
        given:
          "https://raw.githubusercontent.com/Redocly/redocly-cli/13e753a4ca008293dab212ad3b70109166bf93c5/__tests__/lint/oas3.1/openapi.yaml",
        want: new URL("simple-example.ts", EXAMPLES_DIR),
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "input > URL > remote",
      {
        given: new URL(
          "https://raw.githubusercontent.com/Redocly/redocly-cli/13e753a4ca008293dab212ad3b70109166bf93c5/__tests__/lint/oas3.1/openapi.yaml",
        ),
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
              Set: {
                "x-string-enum-to-set": true,
                type: "string",
                enum: ["low", "medium", "high"],
              },
            },
          },
        },
        want: `export type paths = Record<string, never>;
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** Format: date-time */
        Date: DateOrTime;
        /** @enum {string} */
        Set: Set<"low" | "medium" | "high">;
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
          postTransform(_type, options) {
            if (options.path?.includes("Date")) {
              /**
               * Tip: use astexplorer.net to first type out the desired TypeScript,
               * then use the `typescript` parser and it will tell you the desired
               * AST
               */
              return ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("DateOrTime"));
            }

            // Previously, in order to access the schema in postTransform,
            // you could resolve the schema using the path.
            // Now, the schema is made available directly on the options.
            // const schema = options.path
            //   ? options.ctx.resolve<ReferenceObject | SchemaObject>(options.path)
            //   : undefined;
            const schema = options.schema;

            if (
              schema &&
              !("$ref" in schema) &&
              Object.hasOwn(schema, "x-string-enum-to-set") &&
              schema.type === "string" &&
              schema.enum?.every((enumMember) => {
                return typeof enumMember === "string";
              })
            ) {
              return ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("Set"), [
                ts.factory.createUnionTypeNode(
                  schema.enum.map((value) => {
                    return ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(value));
                  }),
                ),
              ]);
            }
          },
        },
      },
    ],
    [
      "options > transformProperty > JSDoc validation annotations",
      {
        given: {
          openapi: "3.1",
          info: { title: "Test", version: "1.0" },
          components: {
            schemas: {
              User: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    minLength: 1,
                    pattern: "^[a-zA-Z0-9]+$",
                  },
                  email: {
                    type: "string",
                    format: "email",
                  },
                  age: {
                    type: "integer",
                    minimum: 0,
                    maximum: 120,
                  },
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
            /**
             * @minLength 1
             * @pattern ^[a-zA-Z0-9]+$
             */
            name: string;
            /**
             * @format email
             */
            /** Format: email */
            email: string;
            /**
             * @minimum 0
             * @maximum 120
             */
            age?: number;
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
        options: {
          transformProperty(property, schemaObject, _options) {
            const validationTags: string[] = [];
            const schema = schemaObject as any; // Cast to access validation properties

            if (schema.minLength !== undefined) {
              validationTags.push(`@minLength ${schema.minLength}`);
            }
            if (schema.maxLength !== undefined) {
              validationTags.push(`@maxLength ${schema.maxLength}`);
            }
            if (schema.minimum !== undefined) {
              validationTags.push(`@minimum ${schema.minimum}`);
            }
            if (schema.maximum !== undefined) {
              validationTags.push(`@maximum ${schema.maximum}`);
            }
            if (schema.pattern !== undefined) {
              validationTags.push(`@pattern ${schema.pattern}`);
            }
            if (schema.format !== undefined) {
              validationTags.push(`@format ${schema.format}`);
            }

            if (validationTags.length > 0) {
              // Create a new property signature
              const newProperty = ts.factory.updatePropertySignature(
                property,
                property.modifiers,
                property.name,
                property.questionToken,
                property.type,
              );

              // Add JSDoc comment using the same format as addJSDocComment
              const jsDocText = `*\n * ${validationTags.join("\n * ")}\n `;

              ts.addSyntheticLeadingComment(newProperty, ts.SyntaxKind.MultiLineCommentTrivia, jsDocText, true);

              return newProperty;
            }

            return property;
          },
        },
      },
    ],
    [
      "options > transformProperty > no-op when returning undefined",
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
                  email: { type: "string", format: "email" },
                },
                required: ["name"],
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
            /** Format: email */
            email?: string;
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
        options: {
          transformProperty(property, schemaObject, _options) {
            const schema = schemaObject as any; // Cast to access validation properties
            // Only transform properties with minLength, return undefined for others
            if (schema.minLength === undefined) {
              return undefined; // Should leave property unchanged
            }
            return property;
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
              InvalidPropertyNameChars: {
                type: "string",
                enum: ["=", "!=", ">", "~", "^", "TE=ST"],
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
        /** @enum {string} */
        InvalidPropertyNameChars: InvalidPropertyNameChars;
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
export enum InvalidPropertyNameChars {
    "=" = "=",
    "!=" = "!=",
    ">" = ">",
    "~" = "~",
    "^" = "^",
    TE_ST = "TE=ST"
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
type FlattenedDeepRequired<T> = {
    [K in keyof T]-?: FlattenedDeepRequired<T[K] extends unknown[] | undefined | null ? Extract<T[K], unknown[]>[number] : T[K]>;
};
type ReadonlyArray<T> = [
    Exclude<T, undefined>
] extends [
    unknown[]
] ? Readonly<Exclude<T, undefined>> : Readonly<Exclude<T, undefined>[]>;
export const pathsUrlGetParametersQueryStatusValues: ReadonlyArray<FlattenedDeepRequired<paths>["/url"]["get"]["parameters"]["query"]["status"]> = ["active", "inactive"];
export const statusValues: ReadonlyArray<FlattenedDeepRequired<components>["schemas"]["Status"]> = ["active", "inactive"];
export const errorCodeValues: ReadonlyArray<FlattenedDeepRequired<components>["schemas"]["ErrorCode"]> = [100, 101, 102, 103, 104, 105];
export type operations = Record<string, never>;`,
        options: { enumValues: true },
      },
    ],
    [
      "options > enumValues with record types",
      {
        given: {
          openapi: "3.1",
          info: { title: "Test", version: "1.0" },
          components: {
            schemas: {
              ComplexEditKeyDto: {
                type: "object",
                properties: {
                  states: {
                    type: "object",
                    additionalProperties: {
                      type: "string",
                      enum: ["TRANSLATED", "REVIEWED"],
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
    schemas: {
        ComplexEditKeyDto: {
            states?: {
                [key: string]: "TRANSLATED" | "REVIEWED";
            };
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
type FlattenedDeepRequired<T> = {
    [K in keyof T]-?: FlattenedDeepRequired<T[K] extends unknown[] | undefined | null ? Extract<T[K], unknown[]>[number] : T[K]>;
};
type ReadonlyArray<T> = [
    Exclude<T, undefined>
] extends [
    unknown[]
] ? Readonly<Exclude<T, undefined>> : Readonly<Exclude<T, undefined>[]>;
export const complexEditKeyDtoStatesValues: ReadonlyArray<FlattenedDeepRequired<components>["schemas"]["ComplexEditKeyDto"]["states"][string]> = ["TRANSLATED", "REVIEWED"];
export type operations = Record<string, never>;`,
        options: { enumValues: true },
      },
    ],
    [
      "options > enumValues with unions",
      {
        given: {
          openapi: "3.1.0",
          info: {
            title: "API Portal",
            version: "1.0.0",
            description: "This is the **Analytics API** description",
          },
          paths: {
            "/analytics/data": {
              get: {
                operationId: "analytics.data",
                tags: ["Analytics"],
                responses: {
                  "400": {
                    description: "",
                    content: {
                      "application/json": {
                        schema: {
                          anyOf: [
                            {
                              type: "object",
                              properties: {
                                message: {
                                  type: "string",
                                  enum: ["Bad request. (InvalidFilterException)"],
                                },
                                errors: {
                                  type: "object",
                                  properties: {
                                    filters: {
                                      type: "string",
                                    },
                                  },
                                  required: ["filters"],
                                },
                              },
                              required: ["message", "errors"],
                            },
                            {
                              type: "object",
                              properties: {
                                message: {
                                  type: "string",
                                  enum: ["Bad request. (InvalidDimensionException)"],
                                },
                                errors: {
                                  type: "object",
                                  properties: {
                                    dimensions: {
                                      type: "array",
                                      prefixItems: [
                                        {
                                          type: "string",
                                        },
                                      ],
                                      minItems: 1,
                                      maxItems: 1,
                                      additionalItems: false,
                                    },
                                  },
                                  required: ["dimensions"],
                                },
                              },
                              required: ["message", "errors"],
                            },
                            {
                              type: "object",
                              properties: {
                                message: {
                                  type: "string",
                                  enum: ["Bad request. (InvalidMetricException)"],
                                },
                                errors: {
                                  type: "object",
                                  properties: {
                                    metrics: {
                                      type: "string",
                                    },
                                  },
                                  required: ["metrics"],
                                },
                              },
                              required: ["message", "errors"],
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        want: `export interface paths {
    "/analytics/data": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["analytics.data"];
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
    schemas: never;
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    "analytics.data": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @enum {string} */
                        message: "Bad request. (InvalidFilterException)";
                        errors: {
                            filters: string;
                        };
                    } | {
                        /** @enum {string} */
                        message: "Bad request. (InvalidDimensionException)";
                        errors: {
                            dimensions: [
                                string
                            ];
                        };
                    } | {
                        /** @enum {string} */
                        message: "Bad request. (InvalidMetricException)";
                        errors: {
                            metrics: string;
                        };
                    };
                };
            };
        };
    };
}
type FlattenedDeepRequired<T> = {
    [K in keyof T]-?: FlattenedDeepRequired<T[K] extends unknown[] | undefined | null ? Extract<T[K], unknown[]>[number] : T[K]>;
};
type ReadonlyArray<T> = [
    Exclude<T, undefined>
] extends [
    unknown[]
] ? Readonly<Exclude<T, undefined>> : Readonly<Exclude<T, undefined>[]>;
export const pathsAnalyticsDataGetResponses400ContentApplicationJsonAnyOf0MessageValues: ReadonlyArray<Extract<FlattenedDeepRequired<paths>["/analytics/data"]["get"]["responses"]["400"]["content"]["application/json"], {
    message: unknown;
}>["message"]> = ["Bad request. (InvalidFilterException)"];
export const pathsAnalyticsDataGetResponses400ContentApplicationJsonAnyOf1MessageValues: ReadonlyArray<Extract<FlattenedDeepRequired<paths>["/analytics/data"]["get"]["responses"]["400"]["content"]["application/json"], {
    message: unknown;
}>["message"]> = ["Bad request. (InvalidDimensionException)"];
export const pathsAnalyticsDataGetResponses400ContentApplicationJsonAnyOf2MessageValues: ReadonlyArray<Extract<FlattenedDeepRequired<paths>["/analytics/data"]["get"]["responses"]["400"]["content"]["application/json"], {
    message: unknown;
}>["message"]> = ["Bad request. (InvalidMetricException)"];`,
        options: { enumValues: true },
      },
    ],
    [
      "options > dedupeEnums",
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
              StatusReverse: {
                type: "string",
                enum: ["inactive", "active"],
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
        Status: PathsUrlGetParametersQueryStatus;
        /** @enum {string} */
        StatusReverse: PathsUrlGetParametersQueryStatus;
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
export type operations = Record<string, never>;`,
        options: { enum: true, dedupeEnums: true },
      },
    ],
    [
      "snapshot > GitHub",
      {
        given: new URL("./github-api.yaml", EXAMPLES_DIR),
        want: new URL("./github-api.ts", EXAMPLES_DIR),
        // options: DEFAULT_OPTIONS,
        ci: { timeout: 30_000 },
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
    [
      "options > enumValues with request body enum",
      {
        given: {
          openapi: "3.1",
          info: { title: "Test", version: "1.0" },
          paths: {
            "/test": {
              get: {
                requestBody: {
                  content: {
                    "application/json": {
                      schema: {
                        properties: {
                          status: {
                            type: "string",
                            enum: ["active", "inactive"],
                          },
                        },
                      },
                    },
                  },
                },
                responses: { 200: { description: "OK" } },
              },
            },
          },
        },
        want: `export interface paths {
    "/test": {
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
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        /** @enum {string} */
                        status?: "active" | "inactive";
                    };
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
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
type FlattenedDeepRequired<T> = {
    [K in keyof T]-?: FlattenedDeepRequired<T[K] extends unknown[] | undefined | null ? Extract<T[K], unknown[]>[number] : T[K]>;
};
type ReadonlyArray<T> = [
    Exclude<T, undefined>
] extends [
    unknown[]
] ? Readonly<Exclude<T, undefined>> : Readonly<Exclude<T, undefined>[]>;
export const pathsTestGetRequestBodyContentApplicationJsonStatusValues: ReadonlyArray<FlattenedDeepRequired<paths>["/test"]["get"]["requestBody"]["content"]["application/json"]["status"]> = ["active", "inactive"];
export type operations = Record<string, never>;`,
        options: { enumValues: true },
      },
    ],
    // When an enum is within a oneOf/anyOf variant, the generated enumValues type path uses
    // Extract<> to narrow union types before accessing variant-specific properties.
    // For example, accessing "nested" on a union where only one variant has that property:
    // Extract<FlattenedDeepRequired<...>["items"], { nested: unknown }>["nested"]
    // This ensures valid TypeScript when properties don't exist on all union variants.
    [
      "options > enumValues with nested union types",
      {
        given: {
          openapi: "3.1",
          info: { title: "Test", version: "1.0" },
          components: {
            schemas: {
              Resource: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["id", "type"],
                      properties: {
                        id: { type: "string" },
                      },
                      oneOf: [
                        {
                          type: "object",
                          properties: {
                            type: { type: "string", enum: ["simple"] },
                          },
                        },
                        {
                          type: "object",
                          properties: {
                            type: { type: "string", enum: ["complex"] },
                            nested: {
                              type: "object",
                              required: ["code"],
                              properties: {
                                code: { type: "string", enum: ["a", "b"] },
                              },
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
        // The enumValues are exported with type paths that properly handle union types.
        // The path for "nested.code" uses Extract<> to narrow to the union variant
        // that has the "nested" property before accessing "code".
        want: `export type paths = Record<string, never>;
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        Resource: {
            items?: ({
                id: string;
            } & ({
                /** @enum {string} */
                type?: "simple";
            } | {
                /** @enum {string} */
                type?: "complex";
                nested?: {
                    /** @enum {string} */
                    code: "a" | "b";
                };
            }))[];
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
type FlattenedDeepRequired<T> = {
    [K in keyof T]-?: FlattenedDeepRequired<T[K] extends unknown[] | undefined | null ? Extract<T[K], unknown[]>[number] : T[K]>;
};
type ReadonlyArray<T> = [
    Exclude<T, undefined>
] extends [
    unknown[]
] ? Readonly<Exclude<T, undefined>> : Readonly<Exclude<T, undefined>[]>;
export const resourceItemsOneOf0TypeValues: ReadonlyArray<Extract<FlattenedDeepRequired<components>["schemas"]["Resource"]["items"], {
    type: unknown;
}>["type"]> = ["simple"];
export const resourceItemsOneOf1TypeValues: ReadonlyArray<Extract<FlattenedDeepRequired<components>["schemas"]["Resource"]["items"], {
    type: unknown;
}>["type"]> = ["complex"];
export const resourceItemsOneOf1NestedCodeValues: ReadonlyArray<Extract<Extract<FlattenedDeepRequired<components>["schemas"]["Resource"]["items"], {
    nested: unknown;
}>["nested"], {
    code: unknown;
}>["code"]> = ["a", "b"];
export type operations = Record<string, never>;`,
        options: { enumValues: true },
      },
    ],
    // Test case: Same property name with different inner schemas.
    // Both variants have "nested" but with different inner structures.
    // Extract<> is applied at each property level to handle cases where the inner
    // schemas differ (e.g., one has "type", the other has "code").
    [
      "options > enumValues with same property different inner schemas",
      {
        given: {
          openapi: "3.1",
          info: { title: "Test", version: "1.0" },
          components: {
            schemas: {
              Resource: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    items: {
                      oneOf: [
                        {
                          type: "object",
                          properties: {
                            nested: {
                              type: "object",
                              properties: {
                                type: { type: "string", enum: ["simple"] },
                              },
                              required: ["type"],
                            },
                          },
                          required: ["nested"],
                        },
                        {
                          type: "object",
                          properties: {
                            nested: {
                              type: "object",
                              properties: {
                                code: { type: "string", enum: ["a", "b"] },
                              },
                              required: ["code"],
                            },
                          },
                          required: ["nested"],
                        },
                      ],
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
    schemas: {
        Resource: {
            items?: ({
                nested: {
                    /** @enum {string} */
                    type: "simple";
                };
            } | {
                nested: {
                    /** @enum {string} */
                    code: "a" | "b";
                };
            })[];
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
type FlattenedDeepRequired<T> = {
    [K in keyof T]-?: FlattenedDeepRequired<T[K] extends unknown[] | undefined | null ? Extract<T[K], unknown[]>[number] : T[K]>;
};
type ReadonlyArray<T> = [
    Exclude<T, undefined>
] extends [
    unknown[]
] ? Readonly<Exclude<T, undefined>> : Readonly<Exclude<T, undefined>[]>;
export const resourceItemsOneOf0NestedTypeValues: ReadonlyArray<Extract<Extract<FlattenedDeepRequired<components>["schemas"]["Resource"]["items"], {
    nested: unknown;
}>["nested"], {
    type: unknown;
}>["type"]> = ["simple"];
export const resourceItemsOneOf1NestedCodeValues: ReadonlyArray<Extract<Extract<FlattenedDeepRequired<components>["schemas"]["Resource"]["items"], {
    nested: unknown;
}>["nested"], {
    code: unknown;
}>["code"]> = ["a", "b"];
export type operations = Record<string, never>;`,
        options: { enumValues: true },
      },
    ],
    // Test case: Deeply nested unions (UnionA -> UnionB -> Prop).
    // Validates that Extract<> is applied correctly at multiple levels of nesting,
    // producing chains like Extract<Extract<Extract<...>["outer"], ...>["inner"], ...>["code"].
    [
      "options > enumValues with deeply nested unions",
      {
        given: {
          openapi: "3.1",
          info: { title: "Test", version: "1.0" },
          components: {
            schemas: {
              Resource: {
                type: "object",
                properties: {
                  outer: {
                    oneOf: [
                      {
                        type: "object",
                        properties: {
                          kind: { type: "string", enum: ["typeA"] },
                          inner: {
                            oneOf: [
                              {
                                type: "object",
                                properties: {
                                  variant: { type: "string", enum: ["v1"] },
                                },
                                required: ["variant"],
                              },
                              {
                                type: "object",
                                properties: {
                                  variant: { type: "string", enum: ["v2"] },
                                  deep: {
                                    type: "object",
                                    properties: {
                                      code: { type: "string", enum: ["x", "y"] },
                                    },
                                    required: ["code"],
                                  },
                                },
                                required: ["variant"],
                              },
                            ],
                          },
                        },
                        required: ["kind"],
                      },
                      {
                        type: "object",
                        properties: {
                          kind: { type: "string", enum: ["typeB"] },
                        },
                        required: ["kind"],
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        want: `export type paths = Record<string, never>;
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        Resource: {
            outer?: {
                /** @enum {string} */
                kind: "typeA";
                inner?: {
                    /** @enum {string} */
                    variant: "v1";
                } | {
                    /** @enum {string} */
                    variant: "v2";
                    deep?: {
                        /** @enum {string} */
                        code: "x" | "y";
                    };
                };
            } | {
                /** @enum {string} */
                kind: "typeB";
            };
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
type FlattenedDeepRequired<T> = {
    [K in keyof T]-?: FlattenedDeepRequired<T[K] extends unknown[] | undefined | null ? Extract<T[K], unknown[]>[number] : T[K]>;
};
type ReadonlyArray<T> = [
    Exclude<T, undefined>
] extends [
    unknown[]
] ? Readonly<Exclude<T, undefined>> : Readonly<Exclude<T, undefined>[]>;
export const resourceOuterOneOf0KindValues: ReadonlyArray<Extract<FlattenedDeepRequired<components>["schemas"]["Resource"]["outer"], {
    kind: unknown;
}>["kind"]> = ["typeA"];
export const resourceOuterOneOf0InnerOneOf0VariantValues: ReadonlyArray<Extract<Extract<FlattenedDeepRequired<components>["schemas"]["Resource"]["outer"], {
    inner: unknown;
}>["inner"], {
    variant: unknown;
}>["variant"]> = ["v1"];
export const resourceOuterOneOf0InnerOneOf1VariantValues: ReadonlyArray<Extract<Extract<FlattenedDeepRequired<components>["schemas"]["Resource"]["outer"], {
    inner: unknown;
}>["inner"], {
    variant: unknown;
}>["variant"]> = ["v2"];
export const resourceOuterOneOf0InnerOneOf1DeepCodeValues: ReadonlyArray<Extract<Extract<Extract<FlattenedDeepRequired<components>["schemas"]["Resource"]["outer"], {
    inner: unknown;
}>["inner"], {
    deep: unknown;
}>["deep"], {
    code: unknown;
}>["code"]> = ["x", "y"];
export const resourceOuterOneOf1KindValues: ReadonlyArray<Extract<FlattenedDeepRequired<components>["schemas"]["Resource"]["outer"], {
    kind: unknown;
}>["kind"]> = ["typeB"];
export type operations = Record<string, never>;`,
        options: { enumValues: true },
      },
    ],
  ];

  for (const [testName, { given, want, options, ci }] of tests) {
    test.skipIf(ci?.skipIf)(
      testName,
      async () => {
        const result = astToString(await openapiTS(given, options));
        if (want instanceof URL) {
          await expect(`${COMMENT_HEADER}${result}`).toMatchFileSnapshot(fileURLToPath(want));
        } else {
          expect(result).toBe(`${want}\n`);
        }
      },
      ci?.timeout || 5000,
    );
  }
});
