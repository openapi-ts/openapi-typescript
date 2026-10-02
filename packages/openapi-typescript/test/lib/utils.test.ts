import {
  collectDynamicAnchors,
  createRef,
  getEntries,
  resolveDynamicAnchor,
  schemaContainsDynamicRef,
} from "../../src/lib/utils.js";

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

describe("schemaContainsDynamicRef", () => {
  test("returns false for null", () => {
    expect(schemaContainsDynamicRef(null)).toBe(false);
  });
  test("returns false for undefined", () => {
    expect(schemaContainsDynamicRef(undefined)).toBe(false);
  });
  test("returns false for primitive", () => {
    expect(schemaContainsDynamicRef("string")).toBe(false);
    expect(schemaContainsDynamicRef(42)).toBe(false);
  });
  test("returns false for empty object", () => {
    expect(schemaContainsDynamicRef({})).toBe(false);
  });
  test("returns false for object with no $dynamicRef", () => {
    expect(schemaContainsDynamicRef({ type: "string" })).toBe(false);
  });
  test("returns true for object with shallow $dynamicRef", () => {
    expect(schemaContainsDynamicRef({ $dynamicRef: "#itemType" })).toBe(true);
  });
  test("returns true for object with nested $dynamicRef in properties", () => {
    expect(
      schemaContainsDynamicRef({
        type: "object",
        properties: {
          items: { type: "array", items: { $dynamicRef: "#itemType" } },
        },
      }),
    ).toBe(true);
  });
  test("returns true for object with $dynamicRef in allOf", () => {
    expect(schemaContainsDynamicRef({ allOf: [{ $dynamicRef: "#itemType" }] })).toBe(true);
  });
  test("returns true for object with $dynamicRef deeply nested in $defs", () => {
    expect(
      schemaContainsDynamicRef({
        $defs: {
          nested: {
            properties: {
              child: { $dynamicRef: "#deep" },
            },
          },
        },
      }),
    ).toBe(true);
  });
});

describe("collectDynamicAnchors", () => {
  test("returns undefined for schema without $defs", () => {
    expect(collectDynamicAnchors({ type: "string" })).toBeUndefined();
  });
  test("returns undefined for schema with null $defs", () => {
    expect(collectDynamicAnchors({ $defs: null })).toBeUndefined();
  });
  test("returns undefined for schema with non-object $defs", () => {
    expect(collectDynamicAnchors({ $defs: "not-an-object" })).toBeUndefined();
  });
  test("returns undefined for $defs with no $dynamicAnchor entries", () => {
    expect(collectDynamicAnchors({ $defs: { helper: { type: "string" } } })).toBeUndefined();
  });
  test("collects single anchor from $defs", () => {
    const result = collectDynamicAnchors({
      $defs: { itemType: { $dynamicAnchor: "itemType", type: "string" } },
    });
    expect(result).toEqual({ itemType: { type: "string" } });
  });
  test("collects multiple anchors from $defs", () => {
    const result = collectDynamicAnchors({
      $defs: {
        itemType: { $dynamicAnchor: "itemType", type: "string" },
        metaType: { $dynamicAnchor: "metaType", type: "integer" },
        helper: { type: "boolean" },
      },
    });
    expect(result).toEqual({
      itemType: { type: "string" },
      metaType: { type: "integer" },
    });
  });
  test("bare $dynamicAnchor with no other properties returns full def", () => {
    const result = collectDynamicAnchors({
      $defs: { bare: { $dynamicAnchor: "bare" } },
    });
    expect(result).toEqual({ bare: { $dynamicAnchor: "bare" } });
  });
  test("strips $dynamicAnchor from anchor value when other properties exist", () => {
    const result = collectDynamicAnchors({
      $defs: { itemType: { $dynamicAnchor: "itemType", $ref: "#/components/schemas/User" } },
    });
    expect(result).toEqual({ itemType: { $ref: "#/components/schemas/User" } });
    expect(result?.itemType).not.toHaveProperty("$dynamicAnchor");
  });
});

describe("resolveDynamicAnchor", () => {
  const makeOpts = (dynamicAnchors?: Record<string, any>) => ({ dynamicAnchors });
  const baseSchema: any = {};

  test("returns override from dynamicAnchors when present", () => {
    const override = { $ref: "#/components/schemas/User" };
    const result = resolveDynamicAnchor("itemType", makeOpts({ itemType: override }), baseSchema);
    expect(result).toBe(override);
  });
  test("returns undefined when no dynamicAnchors and no $defs", () => {
    const result = resolveDynamicAnchor("itemType", makeOpts(), baseSchema);
    expect(result).toBeUndefined();
  });
  test("returns undefined when $defs has no matching anchor", () => {
    const result = resolveDynamicAnchor("itemType", makeOpts(), {
      $defs: { other: { $dynamicAnchor: "other", type: "string" } },
    } as any);
    expect(result).toBeUndefined();
  });
  test("returns fallback from $defs when no dynamicAnchors match", () => {
    const result = resolveDynamicAnchor("itemType", makeOpts(), {
      $defs: { itemType: { $dynamicAnchor: "itemType", type: "number" } },
    } as any);
    expect(result).toEqual({ type: "number" });
  });
  test("dynamicAnchors override takes precedence over $defs fallback", () => {
    const override = { type: "string" };
    const result = resolveDynamicAnchor("itemType", makeOpts({ itemType: override }), {
      $defs: { itemType: { $dynamicAnchor: "itemType", type: "number" } },
    } as any);
    expect(result).toBe(override);
  });
  test("returns undefined for bare $dynamicAnchor in $defs (no other properties)", () => {
    const result = resolveDynamicAnchor("bare", makeOpts(), {
      $defs: { bare: { $dynamicAnchor: "bare" } },
    } as any);
    expect(result).toBeUndefined();
  });
});
