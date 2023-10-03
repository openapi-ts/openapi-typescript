import { fileURLToPath } from "node:url";
import openapiTS, { astToString } from "../src/index.js";
import type { OpenAPI3, OpenAPITSOptions } from "../src/types.js";
import { TestCase } from "./test-helpers.js";

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
              ObjRef: {
                type: "object",
                properties: {
                  base: { $ref: "#/components/schemas/Entity/properties/foo" },
                },
              },
              AllOf: {
                allOf: [
                  { $ref: "#/components/schemas/Entity/properties/foo" },
                  { $ref: "#/components/schemas/Thingy/properties/bar" },
                ],
              },
            },
          },
        },
        want: `export type paths = Record<string, never>;

export type webhooks = Record<string, never>;

export interface components {
    schemas: {
        ObjRef: {
            base?: components["schemas"]["Entity"]["foo"];
        };
        AllOf: components["schemas"]["Entity"]["foo"] & components["schemas"]["Thingy"]["bar"];
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}

export type $defs = Record<string, never>;

export type external = Record<string, never>;

export type operations = Record<string, never>;`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "$refs > unresolved $refs are ignored",
      {
        given: {
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
        },
        want: `export type paths = Record<string, never>;

export type webhooks = Record<string, never>;

export interface components {
    schemas: {
        Base: {
            [key: string]: string;
        };
        SchemaType: components["schemas"]["Base"];
    };
    responses: Record<string, never>;
    parameters: Record<string, never>;
    requestBodies: Record<string, never>;
    headers: Record<string, never>;
    pathItems: Record<string, never>;
}

export type $defs = Record<string, never>;

export type external = Record<string, never>;

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
            query?: never;
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
                query?: never;
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
    schemas: never;
    responses: never;
    parameters: {
        local_ref_a: string;
        local_ref_b: string;
        remote_ref_a: string;
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
        given: new URL(
          "./fixtures/anchor-with-ref-test-2.yaml",
          import.meta.url,
        ),
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
              parameters: [
                { name: "revision", in: "query", schema: { type: "number" } },
              ],
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
                  $ref: "fake.yml#/components/schemas/Example",
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
    responses: Record<string, never>;
    parameters: Record<string, never>;
    requestBodies: Record<string, never>;
    headers: Record<string, never>;
    pathItems: Record<string, never>;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;`,
        // options: DEFAULT_OPTIONS
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
              User: {
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
                ],
                required: ["firstName", "lastName"],
              },
            },
          },
        },
        want: `export type paths = Record<string, never>;
export type webhooks = Record<string, never>;
export interface components {
schemas: {
    User: WithRequired<{
        firstName?: string;
        lastName?: string;
    } & {
        middleName?: string;
    }, "firstName" | "lastName">;
};
responses: never;
parameters: never;
requestBodies: never;
headers: never;
pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
/** WithRequired type helper */
type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
`,
        // options: DEFAULT_OPTIONS,
      },
    ],
  ];

  describe.each(tests)("%s", (_, { given, want, options, ci }) => {
    test.skipIf(ci?.skipIf)(
      "test",
      async () => {
        const result = astToString(await openapiTS(given, options));
        if (want instanceof URL) {
          expect(want).toMatchFileSnapshot(fileURLToPath(want));
        } else {
          expect(result).toBe(want + "\n");
        }
      },
      ci?.timeout,
    );
  });

  it("does not mutate original reference", async () => {
    const schema: OpenAPI3 = {
      openapi: "3.1",
      info: { title: "test", version: "1.0" },
      components: {},
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
