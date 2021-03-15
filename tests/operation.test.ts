import prettier from "prettier";
import { transformOperationObj } from "../src/transform/operation";
import { transformRequestBodies } from "../src/transform/responses";

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
        {
          immutableTypes: false,
          version: 3,
        }
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
        {
          immutableTypes: false,
          version: 3,
        }
      ).trim()
    ).toBe(`requestBody: components["requestBodies"]["Request"];`);
  });
});

describe("requestBodies", () => {
  const format = (source: string) => prettier.format(source, { parser: "typescript" });

  it("basic", () => {
    const output = transformRequestBodies(
      {
        Pet: {
          description: "Pet request body",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  test: { type: "string" },
                },
              },
            },
          },
        },
      },
      {
        immutableTypes: false,
      }
    ).trim();

    expect(format(`type requestBodies = {${output}}`)).toBe(
      format(`type requestBodies = {
          /** Pet request body */
          Pet: {
            content: {
              "application/json": {
                test?: string;
              };
            };
          };
        };`)
    );
  });
});
