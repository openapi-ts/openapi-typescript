import "reflect-metadata";
import type { Context } from "../../src/context.js";
import { ApiProperty } from "../../src/decorators/api-property.js";
import { ClassTypeLoader } from "../../src/loaders/type.js";

test("simple class", async () => {
  const context: Context = { schemas: {}, typeLoaders: [], logger: console };
  class Post {
    @ApiProperty()
    declare id: string;
  }

  const result = await ClassTypeLoader(context, Post);

  expect(result).toEqual({ $ref: "#/components/schemas/Post" });
  expect(context.schemas.Post).toEqual({
    type: "object",
    properties: {
      id: {
        type: "string",
      },
    },
    required: ["id"],
  });
});
