import { fileURLToPath } from "node:url";
import { transformSchema } from "../../../src/index.js";
import { astToString } from "../../../src/lib/ts.js";
import type { GlobalContext } from "../../../src/types.js";
import { DEFAULT_CTX, type TestCase } from "../../test-helpers.js";

const DEFAULT_OPTIONS = DEFAULT_CTX;

const schema = {
  openapi: "3.0.0",
  info: {
    title: "Status API",
    version: "1.0.0",
  },
  paths: {
    "/status": {
      get: {
        summary: "Get current status",
        responses: {
          "200": {
            description: "Status response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    required: {
                      "status": true,
                      "statusEnum": true,
                    },
                    status: {
                      $ref: "#/components/schemas/StatusResponse",
                    },
                    statusEnum: {
                      $ref: "#/components/schemas/StatusEnumResponse",
                    }
                  }
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
      StatusResponse: {
        type: "object",
        properties: {
          status: {
            $ref: "#/components/schemas/Status",
          },
        },
      },
      Status: {
        type: "string",
        enum: ["pending", "active", "done"],
      },
      StatusEnumResponse: {
        type: "object",
        properties: {
          status: {
            $ref: "#/components/schemas/StatusEnum",
          },
        },
      },
      StatusEnum: {
        type: "string",
        enum: ["pending", "active", "done"],
        "x-enum-varnames": ["Pending", "Active", "Done"],
        "x-enum-descriptions": [
          "The task is pending",
          "The task is active",
          "The task is done",
        ],
      },
    },
  },
};

describe("transformComponentsObject", () => {
  const tests: TestCase<any, GlobalContext>[] = [
    [
      "options > enum: true and conditionalEnums: false",
      {
        given: schema,
        want: `export interface paths {
    "/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get current status */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Status response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            required?: unknown;
                            status?: components["schemas"]["StatusResponse"];
                            statusEnum?: components["schemas"]["StatusEnumResponse"];
                        };
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
        StatusResponse: {
            status?: components["schemas"]["Status"];
        };
        /** @enum {string} */
        Status: Status;
        StatusEnumResponse: {
            status?: components["schemas"]["StatusEnum"];
        };
        /** @enum {string} */
        StatusEnum: StatusEnum;
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export enum Status {
    pending = "pending",
    active = "active",
    done = "done"
}
export enum StatusEnum {
    // The task is pending
    Pending = "pending",
    // The task is active
    Active = "active",
    // The task is done
    Done = "done"
}
export type operations = Record<string, never>;`,
        options: { ...DEFAULT_OPTIONS, enum: true, conditionalEnums: false },
      },
    ],
    [
      "options > enum: true and conditionalEnums: true",
      {
        given: schema,
        want: `export interface paths {
    "/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get current status */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Status response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            required?: unknown;
                            status?: components["schemas"]["StatusResponse"];
                            statusEnum?: components["schemas"]["StatusEnumResponse"];
                        };
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
        StatusResponse: {
            status?: components["schemas"]["Status"];
        };
        /** @enum {string} */
        Status: "pending" | "active" | "done";
        StatusEnumResponse: {
            status?: components["schemas"]["StatusEnum"];
        };
        /** @enum {string} */
        StatusEnum: StatusEnum;
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export enum Status {
    pending = "pending",
    active = "active",
    done = "done"
}
export enum StatusEnum {
    // The task is pending
    Pending = "pending",
    // The task is active
    Active = "active",
    // The task is done
    Done = "done"
}
export enum StatusEnum {
    // The task is pending
    Pending = "pending",
    // The task is active
    Active = "active",
    // The task is done
    Done = "done"
}
export type operations = Record<string, never>;`,
        options: { ...DEFAULT_OPTIONS, enum: true, conditionalEnums: true },
      },
    ],
  ];

  for (const [testName, { given, want, options, ci }] of tests) {
    test.skipIf(ci?.skipIf)(
      testName,
      async () => {
        const result = astToString(transformSchema(given, options ?? DEFAULT_OPTIONS));
        if (want instanceof URL) {
          await expect(result).toMatchFileSnapshot(fileURLToPath(want));
        } else {
          expect(result.trim()).toBe(want.trim());
        }
      },
      ci?.timeout,
    );
  }
});
