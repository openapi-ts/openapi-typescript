import { tsUnionOf } from "../src/utils";

describe("utils", () => {
  describe("tsUnionOf", () => {
    test("primitive", () => {
      return expect(tsUnionOf(...["string", "number", "boolean"])).toBe("string | number | boolean");
    });
    test("constant booleans", () => {
      return expect(tsUnionOf(...[true, false])).toBe("true | false");
    });
    test("constant strings", () => {
      return expect(tsUnionOf(...['"hello"', '"world"'])).toBe('"hello" | "world"');
    });
    test("constant numbers", () => {
      return expect(tsUnionOf(...[0, 1, 2, 3])).toBe("0 | 1 | 2 | 3");
    });
    test("mixed", () => {
      return expect(tsUnionOf(...[0, true, "string", '"hello"'])).toBe('0 | true | string | "hello"');
    });
  });
});
