import { fileURLToPath } from "node:url";
import openapiTS, { type OpenAPITSOptions, astToString } from "../src/index.js";
import type { TestCase } from "./test-helpers.js";

describe("3.1 discriminators", () => {
  const tests: TestCase<any, OpenAPITSOptions>[] = [
    [
      "allOf > mapping",
      {
        given: {
          openapi: "3.1",
          info: { title: "test", version: "1.0" },
          components: {
            schemas: {
              Pet: {
                type: "object",
                required: ["petType"],
                properties: { petType: { type: "string" } },
                discriminator: {
                  propertyName: "petType",
                  mapping: {
                    dog: "#/components/schemas/Dog",
                    poodle: "#/components/schemas/Dog",
                  },
                },
              },
              Cat: {
                allOf: [{ $ref: "#/components/schemas/Pet" }],
              },
              Dog: {
                allOf: [
                  { $ref: "#/components/schemas/Pet" },
                  {
                    type: "object",
                    properties: { bark: { type: "string" } },
                  },
                ],
              },
              Lizard: {
                // mix of object + allOf
                type: "object",
                properties: {
                  lovesRocks: { type: "boolean" },
                },
                allOf: [{ $ref: "#/components/schemas/Pet" }],
              },
              LizardDog: {
                allOf: [{ $ref: "#/components/schemas/Dog" }, { $ref: "#/components/schemas/Lizard" }],
              },
              AnimalSighting: {
                oneOf: [
                  {
                    $ref: "#/components/schemas/Cat",
                  },
                  {
                    $ref: "#/components/schemas/Dog",
                  },
                  {
                    $ref: "#/components/schemas/Lizard",
                  },
                ],
              },
              Beast: {
                anyOf: [
                  {
                    $ref: "#/components/schemas/Cat",
                  },
                  {
                    $ref: "#/components/schemas/Dog",
                  },
                  {
                    $ref: "#/components/schemas/Lizard",
                  },
                ],
              },
            },
          },
        },
        want: `export type paths = Record<string, never>;
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        Pet: {
            petType: string;
        };
        Cat: {
            petType: "Cat";
        } & Omit<components["schemas"]["Pet"], "petType">;
        Dog: Omit<components["schemas"]["Pet"], "petType"> & {
            bark?: string;
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            petType: "dog" | "poodle";
        };
        Lizard: {
            petType: "Lizard";
            lovesRocks?: boolean;
        } & Omit<components["schemas"]["Pet"], "petType">;
        LizardDog: {
            petType: "LizardDog";
        } & (Omit<components["schemas"]["Dog"], "petType"> & Omit<components["schemas"]["Lizard"], "petType">);
        AnimalSighting: components["schemas"]["Cat"] | components["schemas"]["Dog"] | components["schemas"]["Lizard"];
        Beast: components["schemas"]["Cat"] | components["schemas"]["Dog"] | components["schemas"]["Lizard"];
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
      "allOf > no mapping",
      {
        given: {
          openapi: "3.1",
          info: { title: "test", version: "1.0" },
          components: {
            schemas: {
              Pet: {
                type: "object",
                required: ["petType"],
                properties: { petType: { type: "string" } },
                discriminator: {
                  propertyName: "petType",
                },
              },
              Cat: {
                allOf: [{ $ref: "#/components/schemas/Pet" }],
              },
              Dog: {
                allOf: [
                  { $ref: "#/components/schemas/Pet" },
                  {
                    type: "object",
                    properties: { bark: { type: "string" } },
                  },
                ],
              },
              Lizard: {
                type: "object",
                properties: {
                  lovesRocks: { type: "boolean" },
                },
                allOf: [{ $ref: "#/components/schemas/Pet" }],
              },
            },
          },
        },
        want: `export type paths = Record<string, never>;
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        Pet: {
            petType: string;
        };
        Cat: {
            petType: "Cat";
        } & Omit<components["schemas"]["Pet"], "petType">;
        Dog: {
            petType: "Dog";
        } & (Omit<components["schemas"]["Pet"], "petType"> & {
            bark?: string;
        });
        Lizard: {
            petType: "Lizard";
            lovesRocks?: boolean;
        } & Omit<components["schemas"]["Pet"], "petType">;
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
      "allOf > inline inheritance",
      {
        given: {
          openapi: "3.1",
          info: { title: "test", version: "1.0" },
          components: {
            schemas: {
              Cat: {
                allOf: [
                  {
                    type: "object",
                    required: ["name", "petType"],
                    properties: {
                      name: { type: "string" },
                      petType: { type: "string" },
                    },
                    discriminator: {
                      propertyName: "petType",
                    },
                  },
                ],
              },
            },
          },
        },
        want: `export type paths = Record<string, never>;
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        Cat: {
            petType: "Cat";
        } & Omit<{
            name: string;
            petType: string;
        }, "petType">;
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
      "oneOf > implicit mapping",
      {
        given: {
          openapi: "3.1",
          info: { title: "test", version: "1.0" },
          components: {
            schemas: {
              Pet: {
                type: "object", // note: this is “wrong” but added because this should be ignored (fixes a bug)
                required: ["petType"],
                oneOf: [
                  { $ref: "#/components/schemas/Cat" },
                  { $ref: "#/components/schemas/Dog" },
                  { $ref: "#/components/schemas/Lizard" },
                ],
                discriminator: {
                  propertyName: "petType",
                  mapping: {
                    dog: "#/components/schemas/Dog",
                  },
                },
              } as any,
              Cat: {
                type: "object",
                properties: {
                  name: { type: "string" },
                },
                required: ["petType"],
              },
              Dog: {
                type: "object",
                properties: { bark: { type: "string" } },
                required: ["petType"],
              },
              Lizard: {
                type: "object",
                properties: {
                  lovesRocks: { type: "boolean" },
                },
                required: ["petType"],
              },
            },
          },
        },
        want: `export type paths = Record<string, never>;
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        Pet: components["schemas"]["Cat"] | components["schemas"]["Dog"] | components["schemas"]["Lizard"];
        Cat: {
            name?: string;
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            petType: "Cat";
        };
        Dog: {
            bark?: string;
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            petType: "dog";
        };
        Lizard: {
            lovesRocks?: boolean;
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            petType: "Lizard";
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
      "oneOf > explicit mapping > replace discriminator enum",
      {
        given: {
          openapi: "3.1.0",
          info: {
            title: "test",
            version: 1,
          },
          paths: {
            "/endpoint": {
              get: {
                responses: {
                  "200": {
                    description: "OK",
                    content: {
                      "application/json": {
                        schema: {
                          oneOf: [
                            {
                              $ref: "#/components/schemas/simpleObject",
                            },
                            {
                              $ref: "#/components/schemas/complexObject",
                            },
                          ],
                          discriminator: {
                            propertyName: "type",
                            mapping: {
                              simple: "#/components/schemas/simpleObject",
                              complex: "#/components/schemas/complexObject",
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          components: {
            schemas: {
              simpleObject: {
                type: "object",
                required: ["type"],
                properties: {
                  type: {
                    $ref: "#/components/schemas/type",
                  },
                  simple: {
                    type: "boolean",
                  },
                },
              },
              complexObject: {
                type: "object",
                required: ["type"],
                properties: {
                  type: {
                    $ref: "#/components/schemas/type",
                  },
                  complex: {
                    type: "boolean",
                  },
                },
              },
              type: {
                type: "string",
                enum: ["simple", "complex"],
              },
            },
          },
        },
        want: `export interface paths {
    "/endpoint": {
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
                        "application/json": components["schemas"]["simpleObject"] | components["schemas"]["complexObject"];
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
        simpleObject: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "simple";
            simple?: boolean;
        };
        complexObject: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "complex";
            complex?: boolean;
        };
        /** @enum {string} */
        type: "simple" | "complex";
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
      "oneOf > explicit mapping > append enum in allOf",
      {
        given: {
          openapi: "3.1.0",
          info: {
            title: "test",
            version: 1,
          },
          paths: {
            "/endpoint": {
              get: {
                responses: {
                  "200": {
                    description: "OK",
                    content: {
                      "application/json": {
                        schema: {
                          oneOf: [
                            {
                              $ref: "#/components/schemas/simpleObject",
                            },
                            {
                              $ref: "#/components/schemas/complexObject",
                            },
                          ],
                          discriminator: {
                            propertyName: "type",
                            mapping: {
                              simple: "#/components/schemas/simpleObject",
                              complex: "#/components/schemas/complexObject",
                              // special case for different enum value but using the same schema as 'complex'
                              tooComplex: "#/components/schemas/complexObject",
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          components: {
            schemas: {
              baseObject: {
                type: "object",
                required: ["type"],
                properties: {
                  type: {
                    $ref: "#/components/schemas/type",
                  },
                },
              },
              simpleObject: {
                allOf: [
                  {
                    $ref: "#/components/schemas/baseObject",
                  },
                  {
                    type: "object",
                    properties: {
                      simple: {
                        type: "boolean",
                      },
                    },
                  },
                ],
              },
              complexObject: {
                allOf: [
                  {
                    $ref: "#/components/schemas/baseObject",
                  },
                  {
                    type: "object",
                    properties: {
                      complex: {
                        type: "boolean",
                      },
                    },
                  },
                ],
              },
              type: {
                type: "string",
                enum: ["simple", "complex", "tooComplex"],
              },
            },
          },
        },
        want: `export interface paths {
    "/endpoint": {
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
                        "application/json": components["schemas"]["simpleObject"] | components["schemas"]["complexObject"];
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
        baseObject: {
            type: components["schemas"]["type"];
        };
        simpleObject: components["schemas"]["baseObject"] & {
            simple?: boolean;
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "simple";
        };
        complexObject: components["schemas"]["baseObject"] & {
            complex?: boolean;
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "complex" | "tooComplex";
        };
        /** @enum {string} */
        type: "simple" | "complex" | "tooComplex";
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
  ];

  for (const [testName, { given, want, options, ci }] of tests) {
    test.skipIf(ci?.skipIf)(
      testName,
      async () => {
        const result = astToString(await openapiTS(given, options));
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
