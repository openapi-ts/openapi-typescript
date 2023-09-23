import type { GlobalContext, OperationObject } from "../src/types.js";
import transformOperationObject from "../src/transform/operation-object.js";

const ctx: GlobalContext = {
  additionalProperties: false,
  alphabetize: false,
  defaultNonNullable: false,
  discriminators: {},
  emptyObjectsUnknown: false,
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
};

const options = { ctx, path: "#/paths/~get-item" };

describe("Operation Object", () => {
  it("allows 2XX codes", () => {
    const schema: OperationObject = {
      responses: {
        "2XX": {
          description: "OK",
          content: {
            "application/json": {
              schema: { type: "string" },
            },
          },
        },
        "4XX": {
          description: "OK",
          content: {
            "application/json": { schema: { $ref: 'components["schemas"]["Error"]' } },
          },
        },
        "5XX": {
          description: "OK",
          content: {
            "application/json": { schema: { $ref: 'components["schemas"]["Error"]' } },
          },
        },
      },
    };
    const generated = transformOperationObject(schema, options);
    expect(generated).toBe(`{
  responses: {
    /** @description OK */
    "2XX": {
      content: {
        "application/json": string;
      };
    };
    /** @description OK */
    "4XX": {
      content: {
        "application/json": components["schemas"]["Error"];
      };
    };
    /** @description OK */
    "5XX": {
      content: {
        "application/json": components["schemas"]["Error"];
      };
    };
  };
}`);
  });

  it("marks parameters optional if they are all optional", () => {
    const schema: OperationObject = {
      parameters: [
        {
          in: "query",
          name: "search",
          schema: { type: "string" },
        },
        {
          in: "header",
          name: "x-header",
          schema: { type: "string" },
          required: false,
        },
      ],
      responses: {
        "200": {
          description: "OK",
          content: {
            "application/json": {
              schema: { type: "string" },
            },
          },
        },
      },
    };
    const generated = transformOperationObject(schema, options);
    expect(generated).toBe(`{
  parameters?: {
    query?: {
      search?: string;
    };
    header?: {
      "x-header"?: string;
    };
  };
  responses: {
    /** @description OK */
    200: {
      content: {
        "application/json": string;
      };
    };
  };
}`);
  });

  it("marks parameters required if there are any path params", () => {
    const schema: OperationObject = {
      parameters: [
        {
          in: "path",
          name: "user_id",
          schema: { type: "string" },
        },
        {
          in: "query",
          name: "search",
          schema: { type: "string" },
        },
      ],
      responses: {
        "200": {
          description: "OK",
          content: {
            "application/json": {
              schema: { type: "string" },
            },
          },
        },
      },
    };
    const generated = transformOperationObject(schema, options);
    expect(generated).toBe(`{
  parameters: {
    query?: {
      search?: string;
    };
    path: {
      user_id: string;
    };
  };
  responses: {
    /** @description OK */
    200: {
      content: {
        "application/json": string;
      };
    };
  };
}`);
  });
});
