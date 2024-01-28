import { fileURLToPath } from "node:url";
import ts from "typescript";
import { astToString } from "../../src/lib/ts.js";
import transformRequestBodyObject from "../../src/transform/request-body-object.js";
import { DEFAULT_CTX, type TestCase } from "../test-helpers.js";

const DEFAULT_OPTIONS = {
  path: "#/paths/~1get-item/get",
  ctx: { ...DEFAULT_CTX },
};

const BLOB = ts.factory.createTypeReferenceNode("Blob");

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
    [
      "optional blob property with transform",
      {
        given: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  blob: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        want: `{
    content: {
        "application/json": {
            /** Format: binary */
            blob?: Blob;
        };
    };
}`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: {
            ...DEFAULT_CTX,
            transform(schemaObject) {
              if (schemaObject.format === "binary") {
                return {
                  schema: BLOB,
                  questionToken: true,
                };
              }
            },
          },
        },
      },
    ],
  ];

  for (const [
    testName,
    { given, want, options = DEFAULT_OPTIONS, ci },
  ] of tests) {
    test.skipIf(ci?.skipIf)(
      testName,
      async () => {
        const result = astToString(transformRequestBodyObject(given, options));
        if (want instanceof URL) {
          expect(result).toMatchFileSnapshot(fileURLToPath(want));
        } else {
          expect(result).toBe(want + "\n");
        }
      },
      ci?.timeout,
    );
  }
});
