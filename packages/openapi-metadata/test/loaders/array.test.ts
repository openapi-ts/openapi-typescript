import "reflect-metadata";
import type { Context } from "../../src/context.js";
import { ApiProperty } from "../../src/decorators/api-property.js";
import { ArrayTypeLoader } from "../../src/loaders/type.js";

let error: string | undefined = undefined;
const context: Context = {
  schemas: {},
  typeLoaders: [],
  logger: {
    warn: (message) => {
      error = message;
    },
  },
};

test("simple array", async () => {
  expect(await ArrayTypeLoader(context, [String])).toEqual({
    type: "array",
    items: {
      type: "string",
    },
  });
});

test("model", async () => {
  class User {
    @ApiProperty()
    declare id: string;
  }

  expect(await ArrayTypeLoader(context, [User])).toEqual({
    type: "array",
    items: {
      $ref: "#/components/schemas/User",
    },
  });
});

test("empty array should warn", async () => {
  // @ts-expect-error
  expect(await ArrayTypeLoader(context, [])).toEqual(undefined);
  expect(error).toContain("You tried to specify an array type without any item");
});

test("array with multiple items should warn", async () => {
  // @ts-expect-error
  expect(await ArrayTypeLoader(context, [String, Number])).toEqual(undefined);
  expect(error).toContain("You tried to specify an array type with multiple items.");
});
