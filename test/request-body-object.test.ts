import transformRequestBodyObject, { TransformRequestBodyObjectOptions } from "../src/transform/request-body-object.js";
import { RequestBodyObject } from "../src/types";

const options: TransformRequestBodyObjectOptions = {
  path: "#/test/request-body-object",
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

describe("Request Body Object", () => {
  test("basic", () => {
    const schema: RequestBodyObject = {
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
    };
    const generated = transformRequestBodyObject(schema, options);
    expect(generated).toBe(`{
  "application/json": {
    url: string;
    "content-type"?: string;
  };
}`);
  });
});
