import { fileURLToPath } from "node:url";
import { astToString } from "../../src/lib/ts.js";
import makeApiPathsEnum from "../../src/transform/paths-enum.js";
import type { GlobalContext } from "../../src/types.js";
import type { TestCase } from "../test-helpers.js";

describe("transformPathsObjectToEnum", () => {
  const tests: TestCase<any, GlobalContext>[] = [
    [
      "basic",
      {
        given: {
          "/api/v1/user": {
            get: {},
          },
        },
        want: `export enum ApiPaths {
    GetApiV1User = "/api/v1/user"
}`,
      },
    ],
    [
      "basic with path parameter",
      {
        given: {
          "/api/v1/user/{user_id}": {
            parameters: [
              {
                name: "page",
                in: "query",
                schema: { type: "number" },
                description: "Page number.",
              },
            ],
            get: {
              parameters: [{ name: "user_id", in: "path", description: "User ID." }],
            },
          },
        },
        want: `export enum ApiPaths {
    GetApiV1User = "/api/v1/user/:user_id"
}`,
      },
    ],
    [
      "with operationId",
      {
        given: {
          "/api/v1/user/{user_id}": {
            parameters: [
              {
                name: "page",
                in: "query",
                schema: { type: "number" },
                description: "Page number.",
              },
            ],
            get: {
              operationId: "GetUserById",
              parameters: [{ name: "user_id", in: "path", description: "User ID." }],
            },
          },
        },
        want: `export enum ApiPaths {
    GetUserById = "/api/v1/user/:user_id"
}`,
      },
    ],
    [
      "with and without operationId",
      {
        given: {
          "/api/v1/user/{user_id}": {
            parameters: [
              {
                name: "page",
                in: "query",
                schema: { type: "number" },
                description: "Page number.",
              },
            ],
            get: {
              operationId: "GetUserById",
              parameters: [{ name: "user_id", in: "path", description: "User ID." }],
            },
            post: {
              parameters: [{ name: "user_id", in: "path", description: "User ID." }],
            },
          },
        },
        want: `export enum ApiPaths {
    GetUserById = "/api/v1/user/:user_id",
    PostApiV1User = "/api/v1/user/:user_id"
}`,
      },
    ],
    [
      "invalid method",
      {
        given: {
          "/api/v1/user": {
            invalidMethod: {},
          },
        },
        want: `export enum ApiPaths {
}`,
      },
    ],
  ];

  for (const [testName, { given, want, ci }] of tests) {
    test.skipIf(ci?.skipIf)(
      testName,
      async () => {
        const result = astToString(makeApiPathsEnum(given));
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
