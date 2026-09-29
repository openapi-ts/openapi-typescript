import { fileURLToPath } from "node:url";
import { astToString } from "../../src/lib/ts.js";
import transformResponseObject from "../../src/transform/response-object.js";
import { DEFAULT_CTX, type TestCase } from "../test-helpers.js";

const DEFAULT_OPTIONS = {
  path: "#/paths/~1get-item/responses/200",
  ctx: { ...DEFAULT_CTX },
};

describe("transformResponseObject", () => {
  const tests: TestCase[] = [
    [
      "basic",
      {
        given: {
          description: "basic",
          headers: {
            foo: {
              schema: { type: "string" },
            },
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
        },
        want: `{
    headers: {
        foo?: string;
        [name: string]: unknown;
    };
    content: {
        "application/json": {
            url: string;
            "content-type"?: string;
        };
    };
}`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "empty",
      {
        given: {
          description: "empty",
          headers: {
            "some-header": {
              schema: { type: "string" },
              required: true,
            },
          },
        },
        want: `{
    headers: {
        "some-header": string;
        [name: string]: unknown;
    };
    content?: never;
}`,
        // options: DEFAULT_OPTIONS,
      },
    ],
    [
      "no-content",
      {
        given: {},
        want: `{
    headers: {
        [name: string]: unknown;
    };
    content?: never;
}`,
      },
    ],
    [
      "text/event-stream with itemSchema",
      {
        given: {
          description: "SSE stream",
          content: {
            "text/event-stream": {
              schema: { type: "string" },
              itemSchema: {
                type: "object",
                properties: {
                  event: { type: "string" },
                  data: { type: "string" },
                },
                required: ["event", "data"],
              },
            },
          },
        },
        want: `{
    headers: {
        [name: string]: unknown;
    };
    content: {
        "text/event-stream": {
            event: string;
            data: string;
        };
    };
}`,
      },
    ],
    [
      "itemSchema without schema",
      {
        given: {
          description: "SSE stream with only itemSchema",
          content: {
            "text/event-stream": {
              itemSchema: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  payload: { type: "number" },
                },
                required: ["id"],
              },
            },
          },
        },
        want: `{
    headers: {
        [name: string]: unknown;
    };
    content: {
        "text/event-stream": {
            id: string;
            payload?: number;
        };
    };
}`,
      },
    ],
    [
      "mixed content types: SSE with itemSchema and JSON with schema",
      {
        given: {
          description: "Mixed response",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  results: { type: "array", items: { type: "string" } },
                },
                required: ["results"],
              },
            },
            "text/event-stream": {
              schema: { type: "string" },
              itemSchema: {
                type: "object",
                properties: {
                  event: { type: "string" },
                  data: { type: "string" },
                },
                required: ["event", "data"],
              },
            },
          },
        },
        want: `{
    headers: {
        [name: string]: unknown;
    };
    content: {
        "application/json": {
            results: string[];
        };
        "text/event-stream": {
            event: string;
            data: string;
        };
    };
}`,
      },
    ],
  ];

  for (const [testName, { given, want, options = DEFAULT_OPTIONS, ci }] of tests) {
    test.skipIf(ci?.skipIf)(
      testName,
      async () => {
        const result = astToString(transformResponseObject(given, options));
        if (want instanceof URL) {
          await expect(result).toMatchFileSnapshot(fileURLToPath(want));
        } else {
          expect(result).toBe(`${want}\n`);
        }
      },
      ci?.timeout,
    );
  }
});
