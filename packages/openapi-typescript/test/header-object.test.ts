import type { HeaderObject } from "../src/types.js";
import transformHeaderObject, { TransformHeaderObjectOptions } from "../src/transform/header-object.js";

const options: TransformHeaderObjectOptions = {
  path: "#/test/header-object",
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

describe("Header Object", () => {
  test("basic", () => {
    const schema: HeaderObject = {
      description: "Auth",
      content: {
        "application/json": {
          schema: { type: "string" },
        },
      },
    };
    const generated = transformHeaderObject(schema, options);
    expect(generated).toBe(`{
  "application/json": string;
}`);
  });
});
