import type { GlobalContext, WebhooksObject } from "../src/types.js";
import transformWebhooksObject from "../src/transform/webhooks-object.js";

const options: GlobalContext = {
  additionalProperties: false,
  alphabetize: false,
  defaultNonNullable: false,
  discriminators: {},
  emptyObjectsUnknown: false,
  immutableTypes: false,
  indentLv: 0,
  operations: {},
  parameters: {},
  pathParamsAsTypes: false,
  postTransform: undefined,
  silent: true,
  supportArrayLength: false,
  transform: undefined,
};

describe("Webhooks Object", () => {
  test("basic", () => {
    const schema: WebhooksObject = {
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
    };
    const generated = transformWebhooksObject(schema, options);
    expect(generated).toBe(`{
  "user-created": {
    post: {
      parameters: {
        query: {
          signature: string;
        };
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
        200: never;
      };
    };
  };
}`);
  });

  test("$ref", () => {
    const schema: WebhooksObject = {
      "user-created": {
        parameters: [
          { in: "query", name: "signature", schema: { type: "string" }, required: true },
          { $ref: 'components["parameters"]["query"]["utm_source"]' },
          { $ref: 'components["parameters"]["query"]["utm_email"]' },
          { $ref: 'components["parameters"]["query"]["utm_campaign"]' },
          { $ref: 'components["parameters"]["path"]["version"]' },
        ],
      },
    };
    const generated = transformWebhooksObject(schema, {
      ...options,
      parameters: {
        'components["parameters"]["query"]["utm_source"]': {
          in: "query",
          name: "utm_source",
          schema: { type: "string" },
        },
        'components["parameters"]["query"]["utm_email"]': {
          in: "query",
          name: "utm_email",
          schema: { type: "string" },
        },
        'components["parameters"]["query"]["utm_campaign"]': {
          in: "query",
          name: "utm_campaign",
          schema: { type: "string" },
        },
        'components["parameters"]["path"]["version"]': { in: "path", name: "utm_campaign", schema: { type: "string" } },
      },
    });
    expect(generated).toBe(`{
  "user-created": {
    parameters: {
      query: {
        signature: string;
        utm_source?: components["parameters"]["query"]["utm_source"];
        utm_email?: components["parameters"]["query"]["utm_email"];
        utm_campaign?: components["parameters"]["query"]["utm_campaign"];
      };
      path: {
        utm_campaign: components["parameters"]["path"]["version"];
      };
    };
  };
}`);
  });
});
