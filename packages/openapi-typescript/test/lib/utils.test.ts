import { createRef, getEntries } from "../../src/lib/utils.js";

describe("getEntries", () => {
  test("operates like Object.entries()", () => {
    expect(getEntries({ z: "z", a: "a" })).toEqual([
      ["z", "z"],
      ["a", "a"],
    ]);
  });

  describe("options", () => {
    test("alphabetize: true", () => {
      expect(getEntries({ z: "z", 0: 0, a: "a" }, { alphabetize: true })).toEqual([
        ["0", 0],
        ["a", "a"],
        ["z", "z"],
      ]);
    });

    test("excludeDeprecated: true", () => {
      expect(
        getEntries(
          {
            z: "z",
            a: "a",
            deprecated: {
              deprecated: true,
            },
          },
          { excludeDeprecated: true },
        ),
      ).toEqual([
        ["z", "z"],
        ["a", "a"],
      ]);
    });
  });
});

describe("createRef", () => {
  test("basic", () => {
    expect(createRef(["components", "schemas", "SchemaObject"])).toBe("#/components/schemas/SchemaObject");
  });

  test("escapes", () => {
    expect(createRef(["paths", "/foo/{bar}", "get", "parameters"])).toBe("#/paths/~1foo~1{bar}/get/parameters");
    expect(createRef(["components", "schemas", "~SchemaObject"])).toBe("#/components/schemas/~0SchemaObject");
  });

  test("handles partial paths", () => {
    expect(createRef(["#/paths/~1foo~1{bar}", "parameters", "query", "page"])).toBe(
      "#/paths/~1foo~1{bar}/parameters/query/page",
    );
  });
});
