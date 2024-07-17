import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, test, vi } from "vitest";
import openapiTS, { astToString } from "../src/index.js";
import type { OpenAPI3, OpenAPITSOptions } from "../src/types.js";
import type { TestCase } from "./test-helpers.js";

// prevent process.exit(1) from truly firing, as it will bypass Vitest’s error catching (throw new Error() will work as-expected)
beforeAll(() => {
  vi.spyOn(process, "exit").mockImplementation(((code: number) => {
    throw new Error(`Process exited with error code ${code}`);
  }) as any);
});

describe("openapiTS", () => {
  beforeAll(() => {
    vi.spyOn(process, "exit").mockImplementation((() => {}) as any);
  });

  const tests: TestCase<any, OpenAPITSOptions>[] = [
    [
      "$refs > basic",
      {
        given: {
          openapi: "3.1",
          info: { title: "Test", version: "1.0" },
          components: {
            schemas: {
              StringType: { type: "string" },
              ObjRef: {
                type: "object",
                properties: {
                  base: { $ref: "#/components/schemas/StringType" },
                },
              },
              HasString: {
                type: "object",
                properties: { string: { type: "string" } },
              },
              HasNumber: {
                type: "object",
                properties: { number: { type: "number" } },
              },
              AllOf: {
                allOf: [{ $ref: "#/components/schemas/HasString" }, { $ref: "#/components/schemas/HasNumber" }],
              },
            },
          },
        },
        want: `export type paths = Record<string, never>;
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        StringType: string;
        ObjRef: {
            base?: components["schemas"]["StringType"];
        };
        HasString: {
            string?: string;
        };
        HasNumber: {
            number?: number;
        };
        AllOf: components["schemas"]["HasString"] & components["schemas"]["HasNumber"];
    };
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
      "$refs > arbitrary $refs are respected",
      {
        given: {
          openapi: "3.1",
          info: { title: "Test", version: "1.0" },
          components: {
            schemas: {
              Base: {
                type: "object",
                additionalProperties: { type: "string" },
              },
              SchemaType: {
                oneOf: [
                  { $ref: "#/components/schemas/Base" },
                  { $ref: "#/x-swagger-bake/components/schemas/Extension" },
                ],
              },
            },
          },
          "x-swagger-bake": {
            components: {
              schemas: {
                Extension: {
                  additionalProperties: true,
                },
              },
            },
          },
        },
        want: `export type paths = Record<string, never>;
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        Base: {
            [key: string]: string | undefined;
        };
        SchemaType: components["schemas"]["Base"] | x-swagger-bake["components"]["schemas"]["Extension"];
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;`,
      },
    ],
    [
      "$refs > parameters get hoisted",
      {
        given: new URL("./fixtures/parameters-test.yaml", import.meta.url),
        want: `export interface paths {
    "/endpoint": {
        parameters: {
            query: {
                local_ref_override: components["parameters"]["local_ref_override"];
                remote_ref_override: components["parameters"]["remote_ref_override"];
            };
            header?: never;
            path: {
                local_param_a: string;
                local_ref_a: components["parameters"]["local_ref_a"];
                remote_ref_a: components["parameters"]["remote_ref_a"];
            };
            cookie?: never;
        };
        /** @description OK */
        get: {
            parameters: {
                query?: {
                    /** @description This overrides parameters with local $ref */
                    local_ref_override?: string;
                    /** @description This overrides parameters with remote $ref */
                    remote_ref_override?: string;
                };
                header?: never;
                path: {
                    /** @description This overrides parameters */
                    local_param_a: number;
                    local_ref_a: components["parameters"]["local_ref_a"];
                    remote_ref_a: components["parameters"]["remote_ref_a"];
                    local_ref_b: components["parameters"]["local_ref_b"];
                    remote_ref_b: components["parameters"]["remote_ref_b"];
                };
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
    schemas: never;
    responses: never;
    parameters: {
        local_ref_a: string;
        local_ref_b: string;
        local_ref_override: string;
        remote_ref_a: string;
        remote_ref_override: string;
        remote_ref_b: string;
    };
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
      "$refs > path object",
      {
        given: new URL("./fixtures/path-object-refs.yaml", import.meta.url),
        want: `export interface paths {
    "/get-item": {
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
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Item"];
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
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        Item: {
            id: string;
            name: string;
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
      },
    ],
    [
      "$refs > YAML anchors",
      {
        given: new URL("./fixtures/anchor-with-ref-test-2.yaml", import.meta.url),
        want: `export interface paths {
    "/": {
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
            requestBody?: never;
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
    schemas: {
        obj: components["schemas"]["anchorTest"];
        metadata: {
            [key: string]: unknown;
        };
        anchorTest: {
            metadata?: components["schemas"]["metadata"];
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
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "parameters > operations get correct params",
      {
        given: {
          openapi: "3.0",
          info: { title: "Test", version: "1.0" },
          paths: {
            "/post/{id}": {
              get: {
                operationId: "getPost",
                parameters: [
                  { name: "format", in: "query", schema: { type: "string" } },
                  { $ref: "#/components/parameters/post_id" },
                ],
                responses: {
                  200: {
                    description: "OK",
                    content: {
                      "application/json": {
                        schema: { $ref: "#/components/schemas/Post" },
                      },
                    },
                  },
                },
              },
              parameters: [{ name: "revision", in: "query", schema: { type: "number" } }],
            },
          },
          components: {
            schemas: {
              Post: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  title: { type: "string" },
                  body: { type: "string" },
                  published_at: { type: "number" },
                },
                required: ["id", "title", "body"],
              },
            },
            parameters: {
              post_id: {
                name: "post_id",
                in: "path",
                schema: { type: "string" },
                required: true,
              },
            },
          },
        },
        want: `export interface paths {
    "/post/{id}": {
        parameters: {
            query?: {
                revision?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getPost"];
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
        Post: {
            id: number;
            title: string;
            body: string;
            published_at?: number;
        };
    };
    responses: never;
    parameters: {
        post_id: string;
    };
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    getPost: {
        parameters: {
            query?: {
                revision?: number;
                format?: string;
            };
            header?: never;
            path: {
                post_id: components["parameters"]["post_id"];
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
                    "application/json": components["schemas"]["Post"];
                };
            };
        };
    };
}`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "examples > skipped",
      {
        given: {
          openapi: "3.1",
          info: { title: "Test", version: "1.0" },
          components: {
            schemas: {
              Example: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  $ref: { type: "string" },
                },
                required: ["name", "$ref"],
              },
            },
            examples: {
              Example: {
                value: {
                  name: "Test",
                  $ref: "#/components/schemas/Example",
                },
              },
            },
          },
        },
        want: `export type paths = Record<string, never>;
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        Example: {
            name: string;
            $ref: string;
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
        // options: DEFAULT_OPTIONS
      },
    ],

    [
      "operations > # character is parsed correctly",
      {
        given: {
          openapi: "3.1",
          info: { title: "Test", version: "1.0" },
          paths: {
            "/accounts": {
              get: {
                operationId: "Accounts#List",
                responses: {
                  200: {
                    description: "OK",
                    content: {
                      "application/json": {
                        schema: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        want: `export interface paths {
    "/accounts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["Accounts/List"];
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
    "Accounts/List": {
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
                    "application/json": string;
                };
            };
        };
    };
}`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "JSONSchema > $defs are respected",
      {
        given: new URL("./fixtures/jsonschema-defs.yaml", import.meta.url),
        want: `export type paths = Record<string, never>;
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        Object: {
            rootDef?: $defs["StringType"];
            nestedDef?: components["schemas"]["OtherObject"]["$defs"]["nestedDef"];
            remoteDef?: components["schemas"]["remoteDef"];
            $defs: {
                hasDefs: boolean;
            };
        };
        ArrayOfDefs: $defs["StringType"][];
        OtherObject: {
            $defs: {
                nestedDef: boolean;
            };
        };
        RemoteDefs: {
            $defs: {
                remoteDef: components["schemas"]["remoteDef"];
            };
        };
        remoteDef: string;
    };
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
      "TypeScript > WithRequired type helper",
      {
        given: {
          openapi: "3.1",
          info: { title: "Test", version: "1.0" },
          components: {
            schemas: {
              Address: {
                properties: {
                  address: { type: "string" },
                  address2: { type: "string" },
                  city: { type: "string" },
                  state: { type: "string" },
                  zip: { type: "string" },
                },
              },
              User: {
                required: ["firstName", "lastName", "city", "state"],
                allOf: [
                  {
                    type: "object",
                    properties: {
                      firstName: { type: "string" },
                      lastName: { type: "string" },
                    },
                  },
                  {
                    type: "object",
                    properties: { middleName: { type: "string" } },
                  },
                  { $ref: "#/components/schemas/Address" },
                ],
              },
            },
          },
        },
        want: `export type paths = Record<string, never>;
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        Address: {
            address?: string;
            address2?: string;
            city?: string;
            state?: string;
            zip?: string;
        };
        User: {
            firstName: string;
            lastName: string;
        } & {
            middleName?: string;
        } & WithRequired<components["schemas"]["Address"], "city" | "state">;
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
type WithRequired<T, K extends keyof T> = T & {
    [P in K]-?: T[P];
};
export type operations = Record<string, never>;`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "inject option",
      {
        given: {
          openapi: "3.1",
          info: { title: "Test", version: "1.0" },
        },
        want: `type Foo = string;
type Bar = number;
export type paths = Record<string, never>;
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
        options: {
          inject: "type Foo = string;\ntype Bar = number;",
        },
      },
    ],
  ];

  for (const [testName, { given, want, options, ci }] of tests) {
    test.skipIf(ci?.skipIf)(
      testName,
      async () => {
        const result = astToString(await openapiTS(given, options));
        if (want instanceof URL) {
          expect(want).toMatchFileSnapshot(fileURLToPath(want));
        } else {
          expect(result).toBe(`${want}\n`);
        }
      },
      ci?.timeout,
    );
  }

  test("does not mutate original reference", async () => {
    const schema: OpenAPI3 = {
      openapi: "3.1",
      info: { title: "test", version: "1.0" },
      components: {
        schemas: {
          OKResponse: {
            type: "object",
            required: ["status", "message"],
            properties: {
              status: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
      paths: {
        "/": {
          get: {
            responses: {
              200: {
                description: "ok",
                $ref: "#/components/schemas/OKResponse",
              },
            },
          },
        },
      },
    };
    const before = JSON.stringify(schema);
    await openapiTS(schema);
    const after = JSON.stringify(schema);
    expect(before).toBe(after);
  });
});
