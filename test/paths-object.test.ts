import type { GlobalContext, PathsObject } from "../src/types";
import transformPathsObject from "../src/transform/paths-object.js";

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

describe("Paths Object", () => {
  test("basic", () => {
    const schema: PathsObject = {
      "/api/v1/user/{user_id}": {
        parameters: [{ name: "page", in: "query", schema: { type: "number" }, description: "Page number." }],
        get: {
          parameters: [{ name: "user_id", in: "path", description: "User ID." }],
          responses: {
            200: {
              description: "OK",
              headers: {
                Link: {
                  $ref: 'components["headers"]["link"]',
                },
              },
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
            404: {
              $ref: 'components["responses"]["NotFound"]',
            },
          },
        },
      },
    };
    const generated = transformPathsObject(schema, options);
    expect(generated).toBe(`{
  "/api/v1/user/{user_id}": {
    get: {
      parameters: {
        path: {
          /** @description User ID. */
          user_id: string;
        };
      };
      responses: {
        /** @description OK */
        200: {
          headers: {
            Link: components["headers"]["link"];
          };
          content: {
            "application/json": {
              id: string;
              email: string;
              name?: string;
            };
          };
        };
        404: components["responses"]["NotFound"];
      };
    };
    parameters: {
      query: {
        /** @description Page number. */
        page?: number;
      };
    };
  };
}`);
  });

  test("$ref", () => {
    const schema: PathsObject = {
      "/api/{version}/user/{user_id}": {
        parameters: [
          { in: "query", name: "page", schema: { type: "number" } },
          { $ref: 'components["parameters"]["query"]["utm_source"]' },
          { $ref: 'components["parameters"]["query"]["utm_email"]' },
          { $ref: 'components["parameters"]["query"]["utm_campaign"]' },
          { $ref: 'components["parameters"]["path"]["version"]' },
          { in: "path", name: "user_id" },
        ],
      },
    };
    const generated = transformPathsObject(schema, options);
    expect(generated).toBe(`{
  "/api/{version}/user/{user_id}": {
    parameters: {
      query: {
        page?: number;
      } & (Pick<NonNullable<components["parameters"]["query"]>, "utm_source" | "utm_email" | "utm_campaign">);
      path: {
        user_id: string;
      } & Pick<components["parameters"]["path"], "version">;
    };
  };
}`);
  });
});
