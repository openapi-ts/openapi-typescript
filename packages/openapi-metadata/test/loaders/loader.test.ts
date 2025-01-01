import type { Context } from "../../src/context.js";
import { loadType } from "../../src/loaders/type.js";

const context: Context = {
  schemas: {},
  typeLoaders: [],
  logger: {
    warn: () => {},
  },
};

test("array", async () => {
  expect(await loadType(context, { type: [String] })).toEqual({
    type: "array",
    items: {
      type: "string",
    },
  });
});

test("primitive", async () => {
  expect(await loadType(context, { type: Number })).toEqual({
    type: "number",
  });
});

test("enum", async () => {
  expect(await loadType(context, { enum: ["openapi", "graphql"] })).toEqual({
    type: "string",
    enum: ["openapi", "graphql"],
  });

  expect(await loadType(context, { enum: [24, 69] })).toEqual({
    type: "number",
    enum: [24, 69],
  });
});

test("raw schema", async () => {
  expect(
    await loadType(context, {
      schema: { type: "string", description: "test" },
    }),
  ).toEqual({
    type: "string",
    description: "test",
  });

  expect(await loadType(context, { enum: [24, 69] })).toEqual({
    type: "number",
    enum: [24, 69],
  });
});
