import fs from "fs";
import path from "path";
import eol from "eol";
import { default as openapiTS } from "../../src/index";

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
    const expected = eol.lf(fs.readFileSync(path.join(__dirname, "expected", "formatter-basic.ts"), "utf8"));
    expect(generated).toBe(expected);
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
    const expected = eol.lf(fs.readFileSync(path.join(__dirname, "expected", "formatter-has-object.ts"), "utf8"));
    expect(generated).toBe(expected);
  });
});
