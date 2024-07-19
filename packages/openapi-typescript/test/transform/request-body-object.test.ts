import { fileURLToPath } from "node:url";
import ts from "typescript";
import { astToString } from "../../src/lib/ts.js";
import transformRequestBodyObject from "../../src/transform/request-body-object.js";
import { DEFAULT_CTX, type TestCase } from "../test-helpers.js";

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
      },
    ],
    [
      "no-content",
      {
        given: {},
        want: `{
    content: {
        "*/*"?: never;
    };
}`,
      },
    ],
    [
      "POST data with default values",
      {
        given: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  required: { type: "string" },
                  optional: { type: "string" },
                  flag_optional: { type: "boolean", default: false },
                  flag_required: { type: "boolean", default: false },
                },
                required: ["required", "flag_required"],
              },
            },
          },
          required: true,
          description: "description",
        },
        want: `{
    content: {
        "application/x-www-form-urlencoded": {
            required: string;
            optional?: string;
            /** @default false */
            flag_optional?: boolean;
            /** @default false */
            flag_required: boolean;
        };
    };
}`,
        options: {
          path: "#/paths/~post-item/post/requestBody/application~1x-www-form-urlencoded",
          ctx: { ...DEFAULT_CTX },
        },
      },
    ],
    [
      "requestBodies -> POST data with default values",
      {
        given: {
          content: {
            "application/json": {
              schema: {
                properties: {
                  card_title: {
                    type: "string",
                    title: "Card Title",
                    default: "Social Profile",
                  },
                  template: {
                    type: "string",
                    title: "Template",
                  },
                  socials: {
                    type: "object",
                    title: "Socials",
                    default: {},
                  },
                },
                type: "object",
                required: ["template"],
                title: "Create",
                description: "Social Profile schema for create.",
              },
            },
          },
          description: "description",
        },
        want: `{
    content: {
        "application/json": {
            /**
             * Card Title
             * @default Social Profile
             */
            card_title?: string;
            /** Template */
            template: string;
            /**
             * Socials
             * @default {}
             */
            socials?: Record<string, never>;
        };
    };
}`,
        options: {
          path: "#/components/requestBodies/social_profiles__Create/application~1json",
          ctx: { ...DEFAULT_CTX },
        },
      },
    ],
  ];

  for (const [testName, { given, want, options = DEFAULT_OPTIONS, ci }] of tests) {
    test.skipIf(ci?.skipIf)(
      testName,
      async () => {
        const result = astToString(transformRequestBodyObject(given, options));
        if (want instanceof URL) {
          expect(result).toMatchFileSnapshot(fileURLToPath(want));
        } else {
          expect(result).toBe(`${want}\n`);
        }
      },
      ci?.timeout,
    );
  }
});
