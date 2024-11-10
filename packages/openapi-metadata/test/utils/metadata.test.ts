import { isThunk } from "../../src/utils/metadata";

test("isThunk", () => {
  expect(isThunk(() => true)).toBe(true);
  expect(isThunk(true)).toBe(false);
  expect(isThunk(() => ({ hello: "world" }))).toBe(true);

  const data = { type: () => "string" };
  expect(isThunk(data.type)).toBe(true);

  class User {}
  expect(isThunk(User)).toBe(false);
  expect(isThunk(() => User)).toBe(true);

  expect(
    isThunk(() => {
      return "TESTEST";
    }),
  ).toBe(true);
});
