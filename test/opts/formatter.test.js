import fs from "fs";
import eol from "eol";
import { URL } from "url";
import { describe, expect, it } from "vitest";
import openapiTS from "../../dist/index.js";

describe("formatter", () => {
  it("basic", async () => {
    const schema = {
      openapi: "3.0.1",
      components: {
        schemas: {
          date: {
            type: "string",
            format: "date-time",
          },
        },
      },
    };

    const generated = await openapiTS(schema, {
      formatter(schemaObj) {
        if (schemaObj.format === "date-time") {
          return "Date";
        }
        return;
      },
      version: 3,
    });
    const expected = eol.lf(fs.readFileSync(new URL("./expected/formatter-basic.ts", import.meta.url), "utf8"));
    expect(generated).to.equal(expected);
  });

  it("hasObject", async () => {
    const schemaHasObject = {
      openapi: "3.0.1",
      components: {
        schemas: {
          calendar: {
            type: "object",
            properties: {
              dates: {
                type: "object",
                properties: {
                  start: {
                    type: "string",
                    format: "date-time",
                  },
                },
              },
            },
          },
        },
      },
    };

    const generated = await openapiTS(schemaHasObject, {
      formatter(schemaObj) {
        if (schemaObj.format === "date-time") {
          return "Date";
        }
        return;
      },
      version: 3,
    });
    const expected = eol.lf(fs.readFileSync(new URL("./expected/formatter-has-object.ts", import.meta.url), "utf8"));
    expect(generated).to.equal(expected);
  });
});
