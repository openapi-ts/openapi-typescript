import { astToString } from "../../src/lib/ts.js";
import transformRequestBodyObject from "../../src/transform/request-body-object.js";
import { DEFAULT_CTX, TestCase } from "../test-helpers.js";

const DEFAULT_OPTIONS = {
  path: "#/paths/~1get-item/get",
  ctx: { ...DEFAULT_CTX },
};

describe("transformRequestBodyObject", () => {
  const tests: TestCase[] = [
    [
      "basic",
      {
        given: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  required: { type: "string" },
                  optional: { type: "string" },
                },
                required: ["required"],
              },
            },
          },
        },
        want: `{
    content: {
        "application/json": {
            required: string;
            optional?: string;
        };
    };
}`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "empty",
      {
        given: { content: {} },
        want: `{
    content: {
        "*/*"?: never;
    };
}`,
        // options: DEFAULT_OPTIONS,
      },
    ],
  ];

  test.each(tests)("%s", (_, { given, want, options = DEFAULT_OPTIONS }) => {
    const ast = transformRequestBodyObject(given, options);
    expect(astToString(ast).trim()).toBe(want.trim());
  });
});
