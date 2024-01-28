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
            petType: "dog";
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
      "oneOf",
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
        };
        Dog: {
            bark?: string;
        };
        Lizard: {
            lovesRocks?: boolean;
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
  ];

  for (const [testName, { given, want, options, ci }] of tests) {
    test.skipIf(ci?.skipIf)(
      testName,
      async () => {
        const result = astToString(await openapiTS(given, options));
        if (want instanceof URL) {
          expect(result).toMatchFileSnapshot(fileURLToPath(want));
        } else {
          expect(result).toBe(want + "\n");
        }
      },
      ci?.timeout,
    );
  }
});
