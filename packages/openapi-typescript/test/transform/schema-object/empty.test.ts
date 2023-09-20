import { astToString } from "../../../src/lib/ts.js";
import transformSchemaObject from "../../../src/transform/schema-object.js";
import { DEFAULT_CTX, TestCase } from "../../test-helpers.js";

const DEFAULT_OPTIONS = {
  path: "#/components/schemas/schema-object",
  ctx: { ...DEFAULT_CTX },
};

describe("transformSchemaObject > empty/unknown", () => {
  const tests: TestCase[] = [
    [
      "true",
      {
        given: true,
        want: `unknown`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "false",
      {
        given: false,
        want: `never`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "empty object",
      {
        given: {},
        want: `unknown`,
        // options: DEFAULT_OPTIONS,
      },
    ],
  ];

  test.each(tests)("%s", (_, { given, want, options = DEFAULT_OPTIONS }) => {
    const ast = transformSchemaObject(given, options);
    expect(astToString(ast).trim()).toBe(want.trim());
  });
});
