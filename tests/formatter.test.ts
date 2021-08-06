import { default as openapiTS } from "../src/index";

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

    // Ensures consistency and indentation in string output with snapshot. Please do NOT update snapshot unless value changes
    expect(
      await openapiTS(schema, {
        formatter(schemaObj) {
          if (schemaObj.format === "date-time") {
            return "Date";
          }
          return;
        },
        version: 3,
      })
    ).toMatchSnapshot();
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

    expect(
      await openapiTS(schemaHasObject, {
        formatter(schemaObj) {
          if (schemaObj.format === "date-time") {
            return "Date";
          }
          return;
        },
        version: 3,
      })
    ).toMatchSnapshot();
  });
});
