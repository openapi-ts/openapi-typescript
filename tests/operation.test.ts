import { transformOperationObj } from "../src/transform/operation";

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
    ).toBe(`requestBody: {
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
    ).toBe(`readonly requestBody: {
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
    ).toBe(`requestBody: components["requestBodies"]["Request"];`);
  });

  it("$ref (immutableTypes)", () => {
    expect(
      transformOperationObj(refSchema, {
        ...defaults,
        immutableTypes: true,
        rawSchema: false,
        version: 3,
      }).trim()
    ).toBe(`readonly requestBody: components["requestBodies"]["Request"];`);
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
    ).toBe(`parameters: {
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
    ).toBe(`parameters: {
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
    ).toBe(`parameters: {
      path: {
    "p2"?: number;
    "p3"?: string;
    "p1"?: string;
  }

  }`);
  });
});
