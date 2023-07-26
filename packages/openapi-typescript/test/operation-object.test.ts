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
    const generated = transformOperationObject(schema, { ctx, path: "#/paths/~get-item" });
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
});
