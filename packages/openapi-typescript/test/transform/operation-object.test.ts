import { fileURLToPath } from "node:url";
import { astToString } from "../../src/lib/ts.js";
import transformOperationObject from "../../src/transform/operation-object.js";
import { DEFAULT_CTX, type TestCase } from "../test-helpers.js";

const DEFAULT_OPTIONS = { path: "#/paths/~1get-item", ctx: { ...DEFAULT_CTX } };

describe("transformOperationObject", () => {
  const tests: TestCase[] = [
    [
      "supports XX codes",
      {
        given: {
          responses: {
            "2XX": {
              description: "OK",
              content: {
                "application/json": {
                  schema: { type: "string" },
                },
              },
            },
            "4XX": {
              description: "OK",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "5XX": {
              description: "OK",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
        want: `parameters: {
    query?: never;
    header?: never;
    path?: never;
    cookie?: never;
};
requestBody?: never;
responses: {
    /** @description OK */
    "2XX": {
        headers: {
            [name: string]: unknown;
        };
        content: {
            "application/json": string;
        };
    };
    /** @description OK */
    "4XX": {
        headers: {
            [name: string]: unknown;
        };
        content: {
            "application/json": components["schemas"]["Error"];
        };
    };
    /** @description OK */
    "5XX": {
        headers: {
            [name: string]: unknown;
        };
        content: {
            "application/json": components["schemas"]["Error"];
        };
    };
};`,
      },
    ],
    [
      "parameters > root optional if no path params and no required params",
      {
        given: {
          parameters: [
            { in: "query", name: "search", schema: { type: "string" } },
            {
              in: "header",
              name: "x-header",
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "OK",
              content: { "application/json": { schema: { type: "string" } } },
            },
          },
        },
        want: `parameters: {
    query?: {
        search?: string;
    };
    header?: {
        "x-header"?: string;
    };
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
};`,
      },
    ],
    [
      "parameters > root not optional if any path params",
      {
        given: {
          parameters: [
            { in: "path", name: "user_id", schema: { type: "string" } },
            { in: "query", name: "search", schema: { type: "string" } },
          ],
          responses: {
            "200": {
              description: "OK",
              content: { "application/json": { schema: { type: "string" } } },
            },
          },
        },
        want: `parameters: {
    query?: {
        search?: string;
    };
    header?: never;
    path: {
        user_id: string;
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
            "application/json": string;
        };
    };
};`,
      },
    ],
    [
      "defaultNonNullable > parameters aren’t required even with defaults",
      {
        given: {
          parameters: [
            {
              in: "query",
              name: "format",
              schema: { type: "string", default: "json" },
            },
          ],
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      required: {
                        type: "string",
                        default: "true",
                      },
                      optional: {
                        type: "boolean",
                      },
                    },
                  },
                },
              },
            },
          },
        },
        want: `parameters: {
    query?: {
        format?: string;
    };
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
            "application/json": {
                /** @default true */
                required: string;
                optional?: boolean;
            };
        };
    };
};`,
      },
    ],
    [
      "parameters, responses > test excludeDeprecated option",
      {
        options: {
          ...DEFAULT_OPTIONS,
          ctx: { ...DEFAULT_CTX, excludeDeprecated: true },
        },
        given: {
          parameters: [
            { in: "path", name: "user_id", schema: { type: "string" } },
            {
              in: "path",
              name: "user_id_deprecated",
              schema: { type: "string", deprecated: true },
            },
            { in: "query", name: "search", schema: { type: "string" } },
            {
              in: "query",
              name: "search_deprecated",
              schema: { type: "string", deprecated: true },
            },
          ],
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      hello: { type: "string" },
                      hello_deprecated: { type: "string", deprecated: true },
                    },
                  },
                },
              },
            },
          },
        },
        want: `parameters: {
    query?: {
        search?: string;
    };
    header?: never;
    path: {
        user_id: string;
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
            "application/json": {
                hello?: string;
            };
        };
    };
};`,
      },
    ],
  ];

  for (const [testName, { given, want, options = DEFAULT_OPTIONS, ci }] of tests) {
    test.skipIf(ci?.skipIf)(
      testName,
      async () => {
        const result = astToString(transformOperationObject(given, options));
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
