import { astToString } from "../../src/lib/ts.js";
import transformMediaTypeObject from "../../src/transform/media-type-object.js";
import { DEFAULT_CTX, type TestCase } from "../test-helpers.js";

const DEFAULT_OPTIONS = {
  path: "#/paths/~1get-item/responses/200/content/application~1json",
  ctx: { ...DEFAULT_CTX },
};

describe("transformMediaTypeObject", () => {
  const tests: TestCase[] = [
    [
      "schema only",
      {
        given: {
          schema: {
            type: "object",
            properties: {
              id: { type: "string" },
            },
            required: ["id"],
          },
        },
        want: `{
    id: string;
}`,
      },
    ],
    [
      "itemSchema only",
      {
        given: {
          itemSchema: {
            type: "object",
            properties: {
              event: { type: "string" },
              data: { type: "number" },
            },
            required: ["event"],
          },
        },
        want: `{
    event: string;
    data?: number;
}`,
      },
    ],
    [
      "itemSchema takes precedence over schema",
      {
        given: {
          schema: { type: "string" },
          itemSchema: {
            type: "object",
            properties: {
              id: { type: "integer" },
              message: { type: "string" },
            },
            required: ["id", "message"],
          },
        },
        want: `{
    id: number;
    message: string;
}`,
      },
    ],
    [
      "neither schema nor itemSchema returns unknown",
      {
        given: {},
        want: "unknown",
      },
    ],
    [
      "schema with no itemSchema still works (backward compat)",
      {
        given: {
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
            },
            required: ["name"],
          },
        },
        want: `{
    name: string;
}`,
      },
    ],
  ];

  for (const [testName, { given, want, options = DEFAULT_OPTIONS, ci }] of tests) {
    test.skipIf(ci?.skipIf)(testName, async () => {
      const result = astToString(transformMediaTypeObject(given, options));
      expect(result).toBe(`${want}\n`);
    });
  }
});
