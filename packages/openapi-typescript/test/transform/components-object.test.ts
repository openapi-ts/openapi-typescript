import { fileURLToPath } from "node:url";
import ts from "typescript";
import { NULL, astToString } from "../../src/lib/ts.js";
import transformComponentsObject from "../../src/transform/components-object.js";
import type { GlobalContext } from "../../src/types.js";
import { DEFAULT_CTX, type TestCase } from "../test-helpers.js";

const DEFAULT_OPTIONS = DEFAULT_CTX;

const DATE = ts.factory.createTypeReferenceNode("Date");

describe("transformComponentsObject", () => {
  const tests: TestCase<any, GlobalContext>[] = [
    [
      "basic",
      {
        given: {
          schemas: {
            String: { type: "string" },
            Error: {
              type: "object",
              required: ["code", "message"],
              properties: {
                code: { type: "string" },
                message: { type: "string" },
              },
            },
          },
          responses: {
            OK: {
              description: "OK",
              content: { "text/html": { schema: { type: "string" } } },
            },
            NoContent: { description: "No Content" },
            ErrorResponse: {
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
          parameters: {
            Search: {
              name: "search",
              in: "query",
              required: true,
              schema: { type: "string" },
            },
          },
          requestBodies: {
            UploadUser: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { email: { type: "string" } },
                    required: ["email"],
                  },
                },
              },
            },
          },
          // "examples" should just be ignored
          examples: {
            ExampleObject: {
              value: {
                name: "Example",
                $ref: "foo.yml#/components/schemas/Bar",
              },
            },
          },
          headers: { Auth: { schema: { type: "string" } } },
          pathItems: {
            UploadUser: {
              get: {
                requestBody: {
                  $ref: "#/components/requestBodies/UploadUser",
                },
              },
            },
          },
        },
        want: `{
    schemas: {
        String: string;
        Error: {
            code: string;
            message: string;
        };
    };
    responses: {
        /** @description OK */
        OK: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "text/html": string;
            };
        };
        /** @description No Content */
        NoContent: {
            headers: {
                [name: string]: unknown;
            };
            content?: never;
        };
        ErrorResponse: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
    };
    parameters: {
        Search: string;
    };
    requestBodies: {
        UploadUser: {
            content: {
                "application/json": {
                    email: string;
                };
            };
        };
    };
    headers: {
        Auth: string;
    };
    pathItems: {
        UploadUser: {
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
                requestBody?: components["requestBodies"]["UploadUser"];
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
    };
}`,
        options: {
          ...DEFAULT_OPTIONS,
          resolve($ref) {
            switch ($ref) {
              case "#/components/requestBodies/UploadUser": {
                return {
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: { email: { type: "string" } },
                        required: ["email"],
                      },
                    },
                  },
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
      "all optional parameters",
      {
        given: {
          parameters: {
            myParam: {
              name: "myParam",
              in: "query",
              required: false,
              schema: { type: "string" },
            },
            myParam2: {
              name: "myParam2",
              in: "query",
              schema: { type: "string" },
            },
          },
        },
        want: `{
    schemas: never;
    responses: never;
    parameters: {
        myParam: string;
        myParam2: string;
    };
    requestBodies: never;
    headers: never;
    pathItems: never;
}`,
      },
      // options: DEFAULT_OPTIONS,
    ],
    [
      "options > alphabetize: true",
      {
        given: {
          schemas: {
            Gamma: {
              type: "object",
              properties: {
                10: { type: "boolean" },
                2: { type: "boolean" },
                1: { type: "boolean" },
              },
            },
            Beta: {
              type: "object",
              properties: {
                b: { type: "boolean" },
                c: { type: "boolean" },
                a: { type: "boolean" },
              },
            },
            Alpha: {
              type: "object",
              properties: {
                z: { type: "boolean" },
                a: { type: "boolean" },
              },
            },
          },
        },
        want: `{
    schemas: {
        Alpha: {
            a?: boolean;
            z?: boolean;
        };
        Beta: {
            a?: boolean;
            b?: boolean;
            c?: boolean;
        };
        Gamma: {
            1?: boolean;
            2?: boolean;
            10?: boolean;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}`,
        options: { ...DEFAULT_OPTIONS, alphabetize: true },
      },
    ],
    [
      "options > immutable: true",
      {
        given: {
          schemas: {
            String: { type: "string" },
            Error: {
              type: "object",
              required: ["code", "message"],
              properties: {
                code: { type: "string" },
                message: { type: "string" },
              },
            },
          },
          responses: {
            OK: {
              description: "OK",
              content: { "text/html": { schema: { type: "string" } } },
            },
            NoContent: { description: "No Content" },
            ErrorResponse: {
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
          parameters: {
            Search: {
              name: "search",
              in: "query",
              required: true,
              schema: { type: "string" },
            },
          },
          requestBodies: {
            UploadUser: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { email: { type: "string" } },
                    required: ["email"],
                  },
                },
              },
            },
          },
          headers: { Auth: { schema: { type: "string" } } },
          pathItems: {
            UploadUser: {
              get: {
                requestBody: {
                  $ref: "#/components/requestBodies/UploadUser",
                },
              },
            },
          },
        },
        want: `{
    schemas: {
        readonly String: string;
        readonly Error: {
            readonly code: string;
            readonly message: string;
        };
    };
    responses: {
        /** @description OK */
        readonly OK: {
            headers: {
                readonly [name: string]: unknown;
            };
            content: {
                readonly "text/html": string;
            };
        };
        /** @description No Content */
        readonly NoContent: {
            headers: {
                readonly [name: string]: unknown;
            };
            content?: never;
        };
        readonly ErrorResponse: {
            headers: {
                readonly [name: string]: unknown;
            };
            content: {
                readonly "application/json": components["schemas"]["Error"];
            };
        };
    };
    parameters: {
        readonly Search: string;
    };
    requestBodies: {
        readonly UploadUser: {
            readonly content: {
                readonly "application/json": {
                    readonly email: string;
                };
            };
        };
    };
    headers: {
        readonly Auth: string;
    };
    pathItems: {
        readonly UploadUser: {
            readonly parameters: {
                readonly query?: never;
                readonly header?: never;
                readonly path?: never;
                readonly cookie?: never;
            };
            readonly get: {
                readonly parameters: {
                    readonly query?: never;
                    readonly header?: never;
                    readonly path?: never;
                    readonly cookie?: never;
                };
                readonly requestBody?: components["requestBodies"]["UploadUser"];
                readonly responses: never;
            };
            readonly put?: never;
            readonly post?: never;
            readonly delete?: never;
            readonly options?: never;
            readonly head?: never;
            readonly patch?: never;
            readonly trace?: never;
        };
    };
}`,
        options: {
          ...DEFAULT_OPTIONS,
          immutable: true,
          resolve($ref) {
            switch ($ref) {
              case "#/components/requestBodies/UploadUser": {
                return {
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: { email: { type: "string" } },
                        required: ["email"],
                      },
                    },
                  },
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
      "options > excludeDeprecated: true",
      {
        given: {
          schemas: {
            Alpha: {
              type: "object",
              properties: {
                a: { type: "boolean", deprecated: true },
                z: { type: "boolean" },
              },
            },
          },
        },
        want: `{
    schemas: {
        Alpha: {
            z?: boolean;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}`,
        options: { ...DEFAULT_OPTIONS, excludeDeprecated: true },
      },
    ],
    [
      "transform > with transform object",
      {
        given: {
          schemas: {
            Alpha: {
              type: "object",
              properties: {
                z: { type: "string", format: "date-time" },
              },
            },
          },
        },
        want: `{
    schemas: {
        Alpha: {
            /** Format: date-time */
            z?: Date | null;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}`,
        options: {
          ...DEFAULT_OPTIONS,
          transform(schemaObject) {
            if (schemaObject.format === "date-time") {
              return {
                schema: ts.factory.createUnionTypeNode([DATE, NULL]),
                questionToken: true,
              };
            }
          },
        },
      },
    ],
    [
      "$ref nested properties",
      {
        given: {
          parameters: {
            direct: {
              name: "direct",
              in: "query",
              required: true,
              schema: {
                $ref: "#/components/aaa",
              },
            },
            nested: {
              name: "nested",
              in: "query",
              required: true,
              schema: {
                $ref: "#/components/schemas/bbb/properties/ccc",
              },
            },
          },
          schemas: {
            aaa: {
              type: "string",
            },
            bbb: {
              type: "object",
              properties: {
                ccc: {
                  type: "string",
                },
              },
            },
          },
        },
        want: `{
    schemas: {
        aaa: string;
        bbb: {
            ccc?: string;
        };
    };
    responses: never;
    parameters: {
        direct: components["aaa"];
        nested: components["schemas"]["bbb"]["ccc"];
    };
    requestBodies: never;
    headers: never;
    pathItems: never;
}`,
      },
    ],
  ];

  for (const [testName, { given, want, options = DEFAULT_OPTIONS, ci }] of tests) {
    test.skipIf(ci?.skipIf)(
      testName,
      async () => {
        const result = astToString(transformComponentsObject(given, options ?? DEFAULT_OPTIONS));
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
