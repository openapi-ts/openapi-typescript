import type { PathItemObject } from "../src/types";
import transformPathItemObject, { TransformPathItemObjectOptions } from "../src/transform/path-item-object.js";

const options: TransformPathItemObjectOptions = {
  operations: {},
  path: "#/test/path-item",
  ctx: {
    additionalProperties: false,
    alphabetize: false,
    defaultNonNullable: false,
    discriminators: {},
    immutableTypes: false,
    indentLv: 0,
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
        responses: {
          200: { $ref: 'components["responses"]["AllGood"]' },
          404: { $ref: 'components["responses"]["NotFound"]' },
        },
      },
      post: {
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
  get: {
    responses: {
      200: components["responses"]["AllGood"];
      404: components["responses"]["NotFound"];
    };
  };
  post: {
    requestBody?: {
      "application/json": components["schemas"]["User"];
    };
    responses: {
      200: components["responses"]["AllGood"];
      404: components["responses"]["NotFound"];
    };
  };
}`);
  });
});
