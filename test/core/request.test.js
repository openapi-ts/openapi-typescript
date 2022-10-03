import prettier from "prettier";
import { describe, expect, it } from "vitest";
import { transformRequestBodies } from "../../dist/transform/request.js";

const defaults = {
  additionalProperties: false,
  immutableTypes: false,
  defaultNonNullable: false,
  rawSchema: false,
};

function format(source) {
  return prettier.format(`type requestBodies = {${source.trim()}}`, { parser: "typescript" });
}

describe("requestBodies", () => {
  const basicSchema = {
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
  };

  it("basic", () => {
    expect(format(transformRequestBodies(basicSchema, { ...defaults, version: 2 }))).to.equal(
      format(`/** Pet request body */
          Pet: {
            content: {
              "application/json": {
                test?: string;
              };
            };
          };`)
    );
  });

  it("basic (immutableTypes)", () => {
    expect(format(transformRequestBodies(basicSchema, { ...defaults, immutableTypes: true, version: 2 }))).to.equal(
      format(`/** Pet request body */
          Pet: {
            readonly content: {
              readonly "application/json": {
                readonly test?: string;
              };
            };
          };`)
    );
  });

  const schemaHyphen = {
    "Pet-example": {
      description: "Pet-example request body",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: { test: { type: "string" } },
          },
        },
      },
    },
  };

  it("hypenated", () => {
    expect(format(transformRequestBodies(schemaHyphen, { ...defaults, version: 3 }))).to.equal(
      format(`/** Pet-example request body */
          "Pet-example": {
            content: {
              "application/json": {
                test?: string;
              }
            };
          };`)
    );
  });

  it("hypenated (additionalProperties)", () => {
    expect(
      format(transformRequestBodies(schemaHyphen, { ...defaults, additionalProperties: true, version: 3 }))
    ).to.equal(
      format(`/** Pet-example request body */
          "Pet-example": {
            content: {
              "application/json": {
                test?: string;
              } & { [key: string]: unknown };
            };
          };`)
    );
  });

  it("hyphenated (immutable)", () => {
    expect(format(transformRequestBodies(schemaHyphen, { ...defaults, immutableTypes: true, version: 3 }))).to.equal(
      format(`/** Pet-example request body */
          "Pet-example": {
            readonly content: {
              readonly "application/json": {
                readonly test?: string;
              }
            };
          };`)
    );
  });
});
