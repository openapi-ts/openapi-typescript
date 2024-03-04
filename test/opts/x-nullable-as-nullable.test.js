import { expect } from "chai";
import fs from "fs";
import eol from "eol";
import openapiTS from "../../dist/index.js";

describe("x-nullable-as-nullable", () => {
  const cases = [
    {
      name: "swagger 2.0",
      expectedFile: "x-nullable-as-nullable.2.0.ts",
      schema: {
        swagger: "2.0",
        definitions: {
          MyType: {
            type: "string",
          },
          MyTypeXNullable: {
            type: "string",
            description: "Some value that has x-nullable set",
            "x-nullable": true,
          },
          MyEnum: {
            description: "Enum with x-nullable",
            type: "string",
            enum: ["foo", "bar"],
            "x-nullable": true,
          },
        },
      },
    },
    {
      name: "openapi 3.1",
      expectedFile: "x-nullable-as-nullable.3.1.ts",
      schema: {
        openapi: "3.1",
        components: {
          schemas: {
            MyType: {
              type: "string",
            },
            MyTypeXNullable: {
              type: "string",
              description: "Some value that has x-nullable set",
              "x-nullable": true,
            },
            MyEnum: {
              description: "Enum with x-nullable",
              type: "string",
              enum: ["foo", "bar"],
              "x-nullable": true,
            },
          },
        },
      },
    },
  ];

  cases.forEach(({ name, expectedFile, schema }) => {
    it(name, async () => {
      const generated = await openapiTS(schema, {
        xNullableAsNullable: true,
      });
      const expected = eol.lf(fs.readFileSync(new URL(`./expected/${expectedFile}`, import.meta.url), "utf8"));
      expect(generated).to.equal(expected);
    });
  });
});
