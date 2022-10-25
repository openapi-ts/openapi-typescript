import eol from "eol";
import fs from "fs";
import { URL } from "url";
import { describe, expect, it } from "vitest";
import openapiTS from "../../dist/index.js";

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
    const expected = eol.lf(fs.readFileSync(new URL("./expected/empty-definitions.ts", import.meta.url), "utf8"));
    expect(generated).to.equal(expected);
  });

  it("immutable", async () => {
    const generated = await openapiTS(schema, { immutableTypes: true, version: 2 });
    const expected = eol.lf(
      fs.readFileSync(new URL("./expected/empty-definitions.immutable.ts", import.meta.url), "utf8")
    );
    expect(generated).to.equal(expected);
  });
});
