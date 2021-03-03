import { transformOperationObj } from "../src/transform/operation";

describe("requestBody", () => {
  it("basic", () => {
    expect(
      transformOperationObj(
        {
          requestBody: {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Pet" },
              },
              "application/xml": {
                schema: { $ref: "#/components/schemas/Pet" },
              },
            },
          },
        },
        3
      ).trim()
    ).toBe(`requestBody: {
    content: {
      "application/json": components["schemas"]["Pet"];
      "application/xml": components["schemas"]["Pet"];
    }
  }`);
  });

  it("ref", () => {
    expect(
      transformOperationObj(
        {
          requestBody: { $ref: "#/components/requestBodies/Request" },
        },
        3
      ).trim()
    ).toBe(`requestBody: components["requestBodies"]["Request"];`);
  });
});
