import { tsIntersectionOf, tsUnionOf } from "../src/utils.js";

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

  describe("tsIntersectionOf", () => {
    const tests: [string, string[], string][] = [
      ["identity for single type", ["string"], "string"],
      ["basic intersection", ["string", "number"], "string & number"],
      ["filter out unknown", ["string", "number", "unknown"], "string & number"],
      ["identity for unknown type", ["unknown"], "unknown"],
      ["unknown for no types passed", [], "unknown"],
      ["parentheses around types with union", ["4", `string | number`], "4 & (string | number)"],
      [
        "parentheses around types with intersection",
        ["{ red: string }", "{ blue: string } & { green: string }"],
        "{ red: string } & ({ blue: string } & { green: string })",
      ],
    ];

    tests.forEach(([name, input, output]) => {
      test(name, () => {
        expect(tsIntersectionOf(...input)).toBe(output);
      });
    });
  });
});
