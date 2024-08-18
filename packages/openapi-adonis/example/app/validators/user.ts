import vine from "@vinejs/vine";

export const listUserValidator = vine.compile(
  vine.object({
    one: vine.string(),
    two: vine.number(),
    nested: vine.object({
      test: vine.number(),
    }),
    array: vine.array(vine.number()).maxLength(5),
  }),
);
