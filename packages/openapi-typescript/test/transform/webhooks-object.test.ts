import { fileURLToPath } from "node:url";
import { astToString } from "../../src/lib/ts.js";
import transformWebhooksObject from "../../src/transform/webhooks-object.js";
import type { GlobalContext } from "../../src/types.js";
import { DEFAULT_CTX, type TestCase } from "../test-helpers.js";

const DEFAULT_OPTIONS = { ...DEFAULT_CTX };

describe("transformWebhooksObject", () => {
  const tests: TestCase<any, GlobalContext>[] = [
    [
      "basic",
      {
        given: {
          "user-created": {
            post: {
              parameters: [
                {
                  name: "signature",
                  in: "query",
                  schema: { type: "string" },
                  required: true,
                },
              ],
              requestBody: {
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        email: { type: "string" },
                        name: { type: "string" },
                      },
                      required: ["id", "email"],
                    },
                  },
                },
              },
              responses: {
                200: {
                  description: "Return a 200 status to indicate that the data was received successfully",
                },
              },
            },
          },
        },
        want: `{
    "user-created": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query: {
                    signature: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        id: string;
                        email: string;
                        name?: string;
                    };
                };
            };
            responses: {
                /** @description Return a 200 status to indicate that the data was received successfully */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}`,
      },
      // options: DEFAULT_OPTIONS,
    ],
    [
      "$ref",
      {
        given: {
          "user-created": {
            parameters: [
              {
                in: "query",
                name: "signature",
                schema: { type: "string" },
                required: true,
              },
              { $ref: "#/components/parameters/query/utm_source" },
              { $ref: "#/components/parameters/query/utm_email" },
              { $ref: "#/components/parameters/query/utm_campaign" },
              { $ref: "#/components/parameters/path/version" },
            ],
          },
        },
        want: `{
    "user-created": {
        parameters: {
            query: {
                signature: string;
                utm_source?: components["parameters"]["query"]["utm_source"];
                utm_email?: components["parameters"]["query"]["utm_email"];
                utm_campaign?: components["parameters"]["query"]["utm_campaign"];
            };
            header?: never;
            path: {
                utm_campaign: components["parameters"]["path"]["version"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}`,
        options: {
          ...DEFAULT_OPTIONS,
          resolve($ref) {
            switch ($ref) {
              case "#/components/parameters/query/utm_source": {
                return {
                  in: "query",
                  name: "utm_source",
                  schema: { type: "string" },
                };
              }
              case "#/components/parameters/query/utm_email": {
                return {
                  in: "query",
                  name: "utm_email",
                  schema: { type: "string" },
                };
              }
              case "#/components/parameters/query/utm_campaign": {
                return {
                  in: "query",
                  name: "utm_campaign",
                  schema: { type: "string" },
                };
              }
              case "#/components/parameters/path/version": {
                return {
                  in: "path",
                  name: "utm_campaign",
                  schema: { type: "string" },
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
  ];

  for (const [testName, { given, want, options = DEFAULT_OPTIONS, ci }] of tests) {
    test.skipIf(ci?.skipIf)(
      testName,
      async () => {
        const result = astToString(transformWebhooksObject(given, options));
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
