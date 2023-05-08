import type { GlobalContext, PathItemObject } from "../src/types.js";
import transformPathItemObject, { TransformPathItemObjectOptions } from "../src/transform/path-item-object.js";

const options: TransformPathItemObjectOptions = {
  path: "#/test/path-item",
  ctx: {
    additionalProperties: false,
    alphabetize: false,
    emptyObjectsUnknown: false,
    defaultNonNullable: false,
    discriminators: {},
    immutableTypes: false,
    indentLv: 0,
    operations: {},
    parameters: {},
    pathParamsAsTypes: false,
    postTransform: undefined,
    silent: true,
    supportArrayLength: false,
    transform: undefined,
  },
};

describe("Path Item Object", () => {
  test("basic", () => {
    const schema: PathItemObject = {
      get: {
        description: "Basic GET",
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                  },
                  required: ["success"],
                },
              },
            },
          },
          404: { $ref: 'components["responses"]["NotFound"]' },
          "5xx": {
            description: "Server error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    code: { type: "string" },
                  },
                  required: ["message"],
                },
              },
            },
          },
        },
      },
      post: {
        description: "Basic POST",
        requestBody: {
          content: {
            "application/json": { $ref: 'components["schemas"]["User"]' },
          },
        },
        responses: {
          200: { $ref: 'components["responses"]["AllGood"]' },
          404: { $ref: 'components["responses"]["NotFound"]' },
        },
      },
    };
    const generated = transformPathItemObject(schema, options);
    expect(generated).toBe(`{
  /** @description Basic GET */
  get: {
    responses: {
      /** @description OK */
      200: {
        content: {
          "application/json": {
            success: boolean;
          };
        };
      };
      404: components["responses"]["NotFound"];
      /** @description Server error */
      "5xx": {
        content: {
          "application/json": {
            message: string;
            code?: string;
          };
        };
      };
    };
  };
  /** @description Basic POST */
  post: {
    requestBody?: {
      content: {
        "application/json": components["schemas"]["User"];
      };
    };
    responses: {
      200: components["responses"]["AllGood"];
      404: components["responses"]["NotFound"];
    };
  };
}`);
  });

  test("operations", () => {
    const operations: GlobalContext["operations"] = {};
    const schema: PathItemObject = {
      get: {
        description: "Get a user",
        operationId: "getUser",
        responses: {
          200: {
            description: "Get User",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    url: { type: "string" },
                    "content-type": { type: "string" },
                  },
                  required: ["url"],
                },
              },
            },
          },
        },
      },
    };
    const generated = transformPathItemObject(schema, { ...options, ctx: { ...options.ctx, operations } });
    expect(generated).toBe(`{
  /** @description Get a user */
  get: operations["getUser"];
}`);
    expect(operations).toEqual({
      getUser: {
        comment: "/** @description Get a user */",
        operationType: `{
    responses: {
      /** @description Get User */
      200: {
        content: {
          "application/json": {
            url: string;
            "content-type"?: string;
          };
        };
      };
    };
  }`,
      },
    });
  });
});
