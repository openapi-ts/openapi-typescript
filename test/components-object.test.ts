import type { ComponentsObject, GlobalContext } from "../src/types";
import transformComponentsObject from "../src/transform/components-object.js";

const options: GlobalContext = {
  additionalProperties: false,
  alphabetize: false,
  emptyObjectsUnknown: false,
  defaultNonNullable: false,
  discriminators: {},
  immutableTypes: false,
  indentLv: 0,
  operations: {},
  pathParamsAsTypes: false,
  postTransform: undefined,
  silent: true,
  supportArrayLength: false,
  transform: undefined,
};

const basicSchema: ComponentsObject = {
  schemas: {
    String: { type: "string" },
  },
  responses: {
    OK: {
      description: "OK",
      content: {
        "text/html": {
          schema: {
            type: "string",
          },
        },
      },
    },
    NoContent: {
      description: "No Content",
    },
  },
  parameters: {
    Search: {
      name: "search",
      in: "query",
      schema: { type: "string" },
    },
  },
  requestBodies: {
    UploadUser: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: { email: { type: "string" } },
            required: ["email"],
          },
        },
      },
    },
  },
  // "examples" should just be ignored
  examples: {
    ExampleObject: {
      value: {
        name: "Example",
        $ref: "foo.yml#/components/schemas/Bar",
      },
    },
  },
  headers: {
    Auth: { schema: { type: "string" } },
  },
  pathItems: {
    UploadUser: {
      get: {
        requestBody: { $ref: 'components["requestBodies"]["UploadUser"]' },
      },
    },
  },
};

describe("Components Object", () => {
  test("basic", () => {
    const generated = transformComponentsObject(basicSchema, options);
    expect(generated).toBe(`{
  schemas: {
    String: string;
  };
  responses: {
    /** @description OK */
    OK: {
      content: {
        "text/html": string;
      };
    };
    /** @description No Content */
    NoContent: never;
  };
  parameters: {
    Search: string;
  };
  requestBodies: {
    UploadUser?: {
      content: {
        "application/json": {
          email: string;
        };
      };
    };
  };
  headers: {
    Auth: string;
  };
  pathItems: {
    UploadUser: {
      get: {
        requestBody: components["requestBodies"]["UploadUser"];
      };
    };
  };
}`);
  });

  describe("options", () => {
    describe("alphabetize", () => {
      test("true", () => {
        const schema: ComponentsObject = {
          schemas: {
            Gamma: {
              type: "object",
              properties: {
                10: { type: "boolean" },
                2: { type: "boolean" },
                1: { type: "boolean" },
              },
            },
            Beta: {
              type: "object",
              properties: {
                b: { type: "boolean" },
                c: { type: "boolean" },
                a: { type: "boolean" },
              },
            },
            Alpha: {
              type: "object",
              properties: {
                z: { type: "boolean" },
                a: { type: "boolean" },
              },
            },
          },
        };
        const generated = transformComponentsObject(schema, { ...options, alphabetize: true });
        expect(generated).toBe(`{
  schemas: {
    Alpha: {
      a?: boolean;
      z?: boolean;
    };
    Beta: {
      a?: boolean;
      b?: boolean;
      c?: boolean;
    };
    Gamma: {
      1?: boolean;
      2?: boolean;
      10?: boolean;
    };
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}`);
      });
    });
    describe("immutableTypes", () => {
      test("true", () => {
        const generated = transformComponentsObject(basicSchema, { ...options, immutableTypes: true });
        expect(generated).toBe(`{
  schemas: {
    readonly String: string;
  };
  responses: {
    /** @description OK */
    readonly OK: {
      content: {
        readonly "text/html": string;
      };
    };
    /** @description No Content */
    readonly NoContent: never;
  };
  parameters: {
    readonly Search: string;
  };
  requestBodies: {
    readonly UploadUser?: {
      readonly content: {
        readonly "application/json": {
          readonly email: string;
        };
      };
    };
  };
  headers: {
    readonly Auth: string;
  };
  pathItems: {
    readonly UploadUser: {
      get: {
        readonly requestBody: components["requestBodies"]["UploadUser"];
      };
    };
  };
}`);
      });
    });
  });
});
