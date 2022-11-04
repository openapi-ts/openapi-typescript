import type { HeaderObject } from "../src/types";
import transformHeaderObject, { TransformHeaderObjectOptions } from "../src/transform/header-object.js";

const options: TransformHeaderObjectOptions = {
  path: "#/test/header-object",
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
