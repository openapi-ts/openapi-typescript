import { describe, expect, it } from "vitest";
import { transformOperationObj } from "../../dist/transform/operation.js";

const defaults = {
  additionalProperties: false,
  immutableTypes: false,
  defaultNonNullable: false,
  rawSchema: false,
};

describe("requestBody", () => {
  const basicSchema = {
    requestBody: {
      content: {
        "application/json": {
          schema: { $ref: 'components["schemas"]["Pet"]' },
        },
        "application/xml": {
          schema: { $ref: 'components["schemas"]["Pet"]' },
        },
      },
    },
  };

  it("basic", () => {
    expect(
      transformOperationObj(basicSchema, {
        ...defaults,
        version: 3,
      }).trim()
    ).to.equal(`requestBody: {
    content: {
      "application/json": components["schemas"]["Pet"];
      "application/xml": components["schemas"]["Pet"];
    }
  }`);
  });

  it("basic (immutableTypes)", () => {
    expect(
      transformOperationObj(basicSchema, {
        ...defaults,
        immutableTypes: true,
        rawSchema: false,
        version: 3,
      }).trim()
    ).to.equal(`readonly requestBody: {
    readonly content: {
      readonly "application/json": components["schemas"]["Pet"];
      readonly "application/xml": components["schemas"]["Pet"];
    }
  }`);
  });

  const refSchema = {
    requestBody: { $ref: 'components["requestBodies"]["Request"]' },
  };

  it("$ref", () => {
    expect(
      transformOperationObj(refSchema, {
        ...defaults,
        version: 3,
      }).trim()
    ).to.equal(`requestBody: components["requestBodies"]["Request"];`);
  });

  it("$ref (immutableTypes)", () => {
    expect(
      transformOperationObj(refSchema, {
        ...defaults,
        immutableTypes: true,
        rawSchema: false,
        version: 3,
      }).trim()
    ).to.equal(`readonly requestBody: components["requestBodies"]["Request"];`);
  });
});

describe("parameters", () => {
  it("operation parameters only", () => {
    expect(
      transformOperationObj(
        {
          parameters: [
            {
              in: "path",
              name: "p1",
              schema: {
                type: "string",
              },
            },
          ],
        },
        {
          ...defaults,
          version: 3,
          pathItem: {},
        }
      ).trim()
    ).to.equal(`parameters: {
      path: {
    "p1"?: string;
  }

  }`);
  });

  it("inherited path parameters only", () => {
    expect(
      transformOperationObj(
        {},
        {
          ...defaults,
          version: 3,
          pathItem: {
            parameters: [
              {
                in: "path",
                name: "p1",
                schema: {
                  type: "string",
                },
              },
            ],
          },
        }
      ).trim()
    ).to.equal(`parameters: {
      path: {
    "p1"?: string;
  }

  }`);
  });

  it("inherited path parameters and operation parameters", () => {
    expect(
      transformOperationObj(
        {
          parameters: [
            {
              in: "path",
              name: "p1",
              schema: {
                type: "string",
              },
            },
            {
              in: "path",
              name: "p2",
              schema: {
                type: "number",
              },
            },
          ],
        },
        {
          ...defaults,
          version: 3,
          pathItem: {
            parameters: [
              {
                in: "path",
                name: "p2",
                schema: {
                  type: "string",
                },
              },
              {
                in: "path",
                name: "p3",
                schema: {
                  type: "string",
                },
              },
            ],
          },
        }
      ).trim()
    ).to.equal(`parameters: {
      path: {
    "p2"?: number;
    "p3"?: string;
    "p1"?: string;
  }

  }`);
  });

  describe("alphabetize", () => {
    function assertSchema(actual, expected) {
      const result = transformOperationObj(actual, {
        ...defaults,
        alphabetize: true,
        version: 3,
        pathItem: {
          parameters: [
            {
              in: "path",
              name: "p2",
              schema: {
                type: "string",
              },
            },
            {
              in: "path",
              name: "p3",
              schema: {
                type: "string",
              },
            },
          ],
        },
      });
      expect(result.trim()).to.equal(expected.trim());
    }

    it("content types", () => {
      const actual = {
        requestBody: {
          content: {
            "font/woff2": {
              schema: { type: "string" },
            },
            "font/otf": {
              schema: { type: "string" },
            },
            "font/sfnt": {
              schema: { type: "string" },
            },
            "font/ttf": {
              schema: { type: "string" },
            },
            "font/woff": {
              schema: { type: "string" },
            },
          },
        },
      };

      const expected = `parameters: {
      path: {
    "p2"?: string;
    "p3"?: string;
  }

  }
  requestBody: {
    content: {
      "font/otf": string;
      "font/sfnt": string;
      "font/ttf": string;
      "font/woff": string;
      "font/woff2": string;
    }
  }`;

      assertSchema(actual, expected);
    });

    it("operation parameters", () => {
      const actual = {
        parameters: [
          {
            in: "path",
            name: "p2",
            schema: {
              type: "number",
            },
          },
          {
            in: "path",
            name: "p1",
            schema: {
              type: "string",
            },
          },
        ],
      };

      const expected = `parameters: {
      path: {
    "p1"?: string;
    "p2"?: number;
    "p3"?: string;
  }

  }`;

      assertSchema(actual, expected);
    });
  });
});
