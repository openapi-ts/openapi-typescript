const { expect } = require("chai");
const eol = require("eol");
const fs = require("fs");
const path = require("path");
const { default: openapiTS } = require("../../dist/cjs/index.js");

describe("allow empty definitions", () => {
  const schema = {
    swagger: "2.0",
    paths: {
      "/pet": {
        post: {
          description: "",
          operationId: "addPet",
          parameters: [
            {
              in: "body",
              name: "body",
              description: "Pet object that needs to be added to the store",
              required: true,
              schema: {
                $ref: 'definitions["Pet"]',
              },
            },
          ],
          responses: {
            405: {
              description: "Invalid input",
            },
          },
        },
      },
    },
  };

  it("basic", async () => {
    const generated = await openapiTS(schema, { version: 2 });
    const expected = eol.lf(fs.readFileSync(path.join(__dirname, "expected", "empty-definitions.ts"), "utf8"));
    expect(generated).to.equal(expected);
  });

  it("immutable", async () => {
    const generated = await openapiTS(schema, { immutableTypes: true, version: 2 });
    const expected = eol.lf(
      fs.readFileSync(path.join(__dirname, "expected", "empty-definitions.immutable.ts"), "utf8")
    );
    expect(generated).to.equal(expected);
  });
});
