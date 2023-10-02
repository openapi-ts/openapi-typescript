import { fileURLToPath } from "node:url";
import openapiTS, { astToString } from "../src/index.js";
import type { OpenAPI3, OpenAPITSOptions } from "../src/types.js";
import { TestCase } from "./test-helpers.js";

const ONE_OF_TYPE_HELPERS = `
/** OneOf type helpers */
type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
type XOR<T, U> = (T | U) extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;
type OneOf<T extends any[]> = T extends [infer Only] ? Only : T extends [infer A, infer B, ...infer Rest] ? OneOf<[XOR<A, B>, ...Rest]> : never;
`;

const WITH_REQUIRED_TYPE_HELPERS = `
/** WithRequired type helpers */
type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
`;

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
        /** @description OK */
        get: {
            parameters: {
                path: {
                    /** @description This overrides parameters */
                    local_param_a: number;
                    local_ref_a: components["parameters"]["local_ref_a"];
                    remote_ref_a: external["_parameters-test-partial.yaml"]["remote_ref_a"];
                    local_ref_b: components["parameters"]["local_ref_b"];
                    remote_ref_b: external["_parameters-test-partial.yaml"]["remote_ref_b"];
                };
            };
        };
        parameters: {
            path: {
                local_param_a: string;
                local_ref_a: components["parameters"]["local_ref_a"];
                remote_ref_a: external["_parameters-test-partial.yaml"]["remote_ref_a"];
            };
        };
    };
}

export type webhooks = Record<string, never>;

export interface components {
    schemas: never;
    responses: never;
    parameters: {
        local_ref_a: string;
      local_ref_b: string;
    };
    requestBodies: never;
    headers: never;
    pathItems: never;
}

export type $defs = Record<string, never>;

export interface external {
    "_parameters-test-partial.yaml": {
        remote_ref_a: string;
        remote_ref_b: string;
    };
}

export type operations = Record<string, never>;`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "$refs > path object",
      {
        given: new URL("./fixtures/path-object-refs.yaml", import.meta.url),
        want: `export interface paths {
    /** @description Remote Ref */
    "/get-item": external["_path-object-refs-paths.yaml"]["GetItemOperation"];
}

export type webhooks = Record<string, never>;

export type components = Record<string, never>;

export type $defs = Record<string, never>;

export interface external {
    "_path-object-refs-paths.yaml": {
        GetItemOperation: {
            get: {
                responses: {
                    /** @description OK */
                    200: {
                        content: {
                            "application/json": external["_path-object-refs-paths.yaml"]["Item"];
                        };
                    };
                };
            };
        };
        Item: {
            id: string;
            name: string;
        };
    };
}

export type operations = Record<string, never>;
  `,
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
        get: {
            responses: {
                /** @description OK */
                200: {
                    content: never;
                };
            };
        };
    };
}

export type webhooks = Record<string, never>;

export interface components {
    schemas: {
        obj: external["anchor-with-ref-test.yaml"]["components"]["schemas"]["anchorTest"];
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}

export type $defs = Record<string, never>;

export interface external {
    "anchor-with-ref-test.yaml": {
        paths: {
            "/": {
                get: {
                    responses: {
                        /** @description OK */
                        200: {
                            content: never;
                        };
                    };
                };
            };
        };
        webhooks: Record<string, never>;
        components: {
            schemas: {
                test: {
                    metadata?: external["anchor-with-ref-test.yaml"]["components"]["schemas"]["metadata"];
                };
                anchorTest: {
                    metadata?: external["anchor-with-ref-test.yaml"]["components"]["schemas"]["metadata"];
                };
                metadata: {
                    [key: string]: unknown;
                };
            };
            responses: never;
            parameters: never;
            requestBodies: never;
            headers: never;
            pathItems: never;
        };
        $defs: Record<string, never>;
    };
}

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
        get: operations["getPost"];
        parameters: {
            query?: {
                revision?: number;
            };
        };
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

export type external = Record<string, never>;

export interface operations {
    getPost: {
        parameters: {
            query?: {
                revision?: number;
                format?: string;
            };
            path: {
                post_id: components["parameters"]["post_id"];
            };
        };
        responses: {
            /** @description OK */
            200: {
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

export type external = Record<string, never>;

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
            remoteDef?: components["schemas"]["RemoteDefs"]["$defs"]["remoteDef"];
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
              remoteDef: external["_jsonschema-remote-obj.yaml"]["RemoteObject"]["$defs"]["remoteDef"];
          };
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}

export interface $defs {
    StringType: string;
}

export interface external {
    "_jsonschema-remote-obj.yaml": {
        RemoteObject: {
            ownProperty?: boolean;
            $defs: {
                remoteDef: string;
            };
        };
    };
}

export type operations = Record<string, never>;`,
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

  describe("options", () => {
    describe("OneOf type helpers", () => {
      test("should be added only when used", async () => {
        const generated = await openapiTS(
          {
            openapi: "3.1",
            info: { title: "Test", version: "1.0" },
            components: {
              schemas: {
                User: {
                  oneOf: [
                    {
                      type: "object",
                      properties: { firstName: { type: "string" } },
                    },
                    {
                      type: "object",
                      properties: { name: { type: "string" } },
                    },
                  ],
                },
              },
            },
          },
          { exportType: false },
        );
        expect(generated).toBe(`${ONE_OF_TYPE_HELPERS}
export type paths = Record<string, never>;

export type webhooks = Record<string, never>;

export interface components {
    schemas: {
        User: OneOf<[{
            firstName?: string;
        }, {
            name?: string;
        }]>;
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}

export type $defs = Record<string, never>;

export type external = Record<string, never>;

export type operations = Record<string, never>;
`);
      });
    });

    describe("WithRequired type helpers", () => {
      test("should be added only when used", async () => {
        const generated = await openapiTS(
          {
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
          { exportType: false },
        );
        expect(generated).toBe(`${WITH_REQUIRED_TYPE_HELPERS}
export type paths = Record<string, never>;

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

export type external = Record<string, never>;

export type operations = Record<string, never>;
`);
      });
    });
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
