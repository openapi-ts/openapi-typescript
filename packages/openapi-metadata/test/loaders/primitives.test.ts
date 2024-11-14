import type { Context } from "../../src/context.js";
import { PrimitiveTypeLoader } from "../../src/loaders/type.js";

const context: Context = { schemas: {}, typeLoaders: [], logger: console };

test("string", async () => {
  expect(await PrimitiveTypeLoader(context, "string")).toEqual({
    type: "string",
  });

  expect(await PrimitiveTypeLoader(context, "number")).toEqual({
    type: "number",
  });

  expect(await PrimitiveTypeLoader(context, "boolean")).toEqual({
    type: "boolean",
  });

  expect(await PrimitiveTypeLoader(context, "integer")).toEqual({
    type: "integer",
  });
});

test("constructor", async () => {
  expect(await PrimitiveTypeLoader(context, String)).toEqual({
    type: "string",
  });

  expect(await PrimitiveTypeLoader(context, Number)).toEqual({
    type: "number",
  });

  expect(await PrimitiveTypeLoader(context, Boolean)).toEqual({
    type: "boolean",
  });
});
