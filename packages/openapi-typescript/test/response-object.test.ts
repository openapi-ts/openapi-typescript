import transformResponseObject, { TransformResponseObjectOptions } from "../src/transform/response-object.js";
import type { ResponseObject } from "../src/types.js";

const options: TransformResponseObjectOptions = {
  path: "#/test/response-object",
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
    excludeDeprecated: false,
    rootTypes: false,
  },
};

describe("Response Object", () => {
  test("basic", () => {
    const schema: ResponseObject = {
      description: "basic",
      headers: {
        foo: {
          schema: { type: "string" }
        }
      },
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
    const generated = transformResponseObject(schema, options);
    expect(generated).toBe(`{
  headers: {
    foo?: string;
  };
  content: {
    "application/json": {
      url: string;
      "content-type"?: string;
    };
  };
}`);
  });

  test("empty", () => {
    const schema: ResponseObject = {
      description: "empty",
      headers: {
        "some-header": {
          schema: { type: "string" }
        }
      }
    };
    const generated = transformResponseObject(schema, options);
    expect(generated).toBe(`{
  headers: {
    "some-header"?: string;
  };
  content: never;
}`)
  });
});
