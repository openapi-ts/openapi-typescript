import type { GlobalContext, WebhooksObject } from "../src/types";
import transformWebhooksObject from "../src/transform/webhooks-object.js";

const options: GlobalContext = {
  additionalProperties: false,
  alphabetize: false,
  defaultNonNullable: false,
  discriminators: {},
  immutableTypes: false,
  indentLv: 0,
  operations: {},
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
    const generated = transformWebhooksObject(schema, options);
    expect(generated).toBe(`{
  "user-created": {
    parameters: {
      query: {
        signature: string;
      } & (Pick<NonNullable<components["parameters"]["query"]>, "utm_source" | "utm_email" | "utm_campaign">);
      path: Pick<components["parameters"]["path"], "version">;
    };
  };
}`);
  });
});
