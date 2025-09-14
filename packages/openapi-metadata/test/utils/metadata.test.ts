import { isThunk } from "../../src/utils/metadata.js";

test("isThunk", () => {
  expect(isThunk(() => true)).toBe(true);
  expect(isThunk(true)).toBe(false);
  expect(isThunk(() => ({ hello: "world" }))).toBe(true);

  const data = { type: () => "string" };
  expect(isThunk(data.type)).toBe(true);

  class User {}
  expect(isThunk(User)).toBe(false);
  expect(isThunk(() => User)).toBe(true);

  class InsideThunk {
    test() {
      // biome-ignore lint/suspicious/useIterableCallbackReturn: part of test
      return [].map(() => {});
    }
  }
  expect(isThunk(InsideThunk)).toBe(false);
  expect(isThunk(() => InsideThunk)).toBe(true);

  expect(
    isThunk(() => {
      return "TESTEST";
    }),
  ).toBe(true);
});
