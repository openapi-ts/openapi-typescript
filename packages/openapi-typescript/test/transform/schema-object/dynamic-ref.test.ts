import { fileURLToPath } from "node:url";
import { astToString } from "../../../src/lib/ts.js";
import transformSchemaObject from "../../../src/transform/schema-object.js";
import { DEFAULT_CTX, type TestCase } from "../../test-helpers.js";

const DEFAULT_OPTIONS = {
  path: "#/components/schemas/schema-object",
  ctx: { ...DEFAULT_CTX },
};

describe("$dynamicRef", () => {
  const tests: TestCase[] = [
    [
      "$dynamicRef > no override → fallback to unknown",
      {
        given: {
          $dynamicRef: "#itemType",
        },
        want: "unknown",
      },
    ],
    [
      "$dynamicRef > with dynamicAnchors override providing $ref",
      {
        given: {
          $dynamicRef: "#itemType",
        },
        want: 'components["schemas"]["User"]',
        options: {
          ...DEFAULT_OPTIONS,
          dynamicAnchors: {
            itemType: { $ref: "#/components/schemas/User" },
          },
        },
      },
    ],
    [
      "$dynamicRef > with dynamicAnchors override providing inline type",
      {
        given: {
          $dynamicRef: "#itemType",
        },
        want: "string",
        options: {
          ...DEFAULT_OPTIONS,
          dynamicAnchors: {
            itemType: { type: "string" },
          },
        },
      },
    ],
    [
      "$dynamicRef > with fallback in schema $defs",
      {
        given: {
          $dynamicRef: "#itemType",
          $defs: {
            itemType: {
              $dynamicAnchor: "itemType",
              type: "number",
            },
          },
        },
        want: "number",
      },
    ],
    [
      "$dynamicRef > dynamicAnchors override takes precedence over $defs fallback",
      {
        given: {
          $dynamicRef: "#itemType",
          $defs: {
            itemType: {
              $dynamicAnchor: "itemType",
              type: "number",
            },
          },
        },
        want: "string",
        options: {
          ...DEFAULT_OPTIONS,
          dynamicAnchors: {
            itemType: { type: "string" },
          },
        },
      },
    ],
    [
      "$ref + $defs with $dynamicAnchor > resolves template with override",
      {
        given: {
          $ref: "#/components/schemas/PaginatedTemplate",
          $defs: {
            itemType: {
              $dynamicAnchor: "itemType",
              $ref: "#/components/schemas/User",
            },
          },
        },
        want: `{
    items?: components["schemas"]["User"][];
    $defs: {
        itemType: unknown;
    };
}`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: {
            ...DEFAULT_OPTIONS.ctx,
            resolve($ref: string) {
              if ($ref === "#/components/schemas/PaginatedTemplate") {
                return {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: {
                        $dynamicRef: "#itemType",
                      },
                    },
                  },
                  $defs: {
                    itemType: {
                      $dynamicAnchor: "itemType",
                      not: {},
                    },
                  },
                };
              }
              if ($ref === "#/components/schemas/User") {
                return { type: "object", properties: { id: { type: "integer" }, name: { type: "string" } } };
              }
              return undefined as any;
            },
          },
        },
      },
    ],
    [
      "$ref + $defs with $dynamicAnchor > recursive self-reference",
      {
        given: {
          $ref: "#/components/schemas/BaseCategory",
          $defs: {
            childType: {
              $dynamicAnchor: "childType",
              $ref: "#/components/schemas/LocalizedCategory",
            },
          },
        },
        want: `{
    name?: string;
    children?: components["schemas"]["LocalizedCategory"][];
    $defs: {
        childType: unknown;
    };
}`,
        options: {
          ...DEFAULT_OPTIONS,
          ctx: {
            ...DEFAULT_OPTIONS.ctx,
            resolve($ref: string) {
              if ($ref === "#/components/schemas/BaseCategory") {
                return {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    children: {
                      type: "array",
                      items: {
                        $dynamicRef: "#childType",
                      },
                    },
                  },
                  $defs: {
                    childType: {
                      $dynamicAnchor: "childType",
                      not: {},
                    },
                  },
                };
              }
              return undefined as any;
            },
          },
        },
      },
    ],
    [
      "$ref without $dynamicAnchor $defs > normal $ref behavior",
      {
        given: {
          $ref: "#/components/schemas/User",
        },
        want: 'components["schemas"]["User"]',
        options: {
          ...DEFAULT_OPTIONS,
          ctx: {
            ...DEFAULT_OPTIONS.ctx,
            resolve($ref: string) {
              if ($ref === "#/components/schemas/User") {
                return { type: "object", properties: { name: { type: "string" } } };
              }
              return undefined as any;
            },
          },
        },
      },
    ],
    [
      "$ref + $defs without $dynamicAnchor > normal $ref behavior",
      {
        given: {
          $ref: "#/components/schemas/User",
          $defs: {
            helper: { type: "string" },
          },
        },
        want: 'components["schemas"]["User"]',
        options: {
          ...DEFAULT_OPTIONS,
          ctx: {
            ...DEFAULT_OPTIONS.ctx,
            resolve($ref: string) {
              if ($ref === "#/components/schemas/User") {
                return { type: "object", properties: { name: { type: "string" } } };
              }
              return undefined as any;
            },
          },
        },
      },
    ],
    [
      "$dynamicAnchor on schema > self-registers and resolves $dynamicRef in child properties",
      {
        given: {
          $dynamicAnchor: "nodeType",
          type: "object",
          properties: {
            name: { type: "string" },
            children: {
              type: "array",
              items: {
                $dynamicRef: "#nodeType",
              },
            },
          },
        },
        want: `{
    name?: string;
    children?: components["schemas"]["schema-object"][];
}`,
      },
    ],
    [
      "$defs with $dynamicAnchor on parent schema > resolves child $dynamicRef",
      {
        given: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                $dynamicRef: "#itemType",
              },
            },
          },
          $defs: {
            itemType: {
              $dynamicAnchor: "itemType",
              type: "string",
            },
          },
        },
        want: `{
    items?: string[];
    $defs: {
        itemType: string;
    };
}`,
      },
    ],
    [
      "$dynamicAnchor on schema > child override takes precedence over self-registration",
      {
        given: {
          $dynamicAnchor: "nodeType",
          type: "object",
          properties: {
            name: { type: "string" },
            children: {
              type: "array",
              items: {
                $dynamicRef: "#nodeType",
              },
            },
          },
        },
        want: `{
    name?: string;
    children?: components["schemas"]["CustomNode"][];
}`,
        options: {
          ...DEFAULT_OPTIONS,
          dynamicAnchors: {
            nodeType: { $ref: "#/components/schemas/CustomNode" },
          },
        },
      },
    ],
    [
      "$ref with inherited dynamicAnchors but resolved target has no $dynamicRef > falls through to oapiRef",
      {
        given: {
          $ref: "#/components/schemas/User",
        },
        want: 'components["schemas"]["User"]',
        options: {
          ...DEFAULT_OPTIONS,
          dynamicAnchors: {
            unrelatedAnchor: { type: "string" },
          },
          ctx: {
            ...DEFAULT_OPTIONS.ctx,
            resolve($ref: string) {
              if ($ref === "#/components/schemas/User") {
                return { type: "object", properties: { name: { type: "string" } } };
              }
              return undefined as any;
            },
          },
        },
      },
    ],
    [
      "$ref with inherited dynamicAnchors and resolved target contains $dynamicRef > concretizes",
      {
        given: {
          $ref: "#/components/schemas/Template",
        },
        want: `{
    items?: string[];
}`,
        options: {
          ...DEFAULT_OPTIONS,
          dynamicAnchors: {
            itemType: { type: "string" },
          },
          ctx: {
            ...DEFAULT_OPTIONS.ctx,
            resolve($ref: string) {
              if ($ref === "#/components/schemas/Template") {
                return {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: { $dynamicRef: "#itemType" },
                    },
                  },
                };
              }
              return undefined as any;
            },
          },
        },
      },
    ],
    [
      "collectDynamicAnchors > bare $dynamicAnchor with no other properties",
      {
        given: {
          $dynamicRef: "#bare",
          $defs: {
            bare: {
              $dynamicAnchor: "bare",
            },
          },
        },
        want: "unknown",
      },
    ],
    [
      "multiple dynamic anchors in single $defs",
      {
        given: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: { $dynamicRef: "#itemType" },
            },
            meta: { $dynamicRef: "#metaType" },
          },
          $defs: {
            itemType: {
              $dynamicAnchor: "itemType",
              type: "integer",
            },
            metaType: {
              $dynamicAnchor: "metaType",
              type: "string",
            },
          },
        },
        want: `{
    items?: number[];
    meta?: string;
    $defs: {
        itemType: number;
        metaType: string;
    };
}`,
      },
    ],
    [
      "schemaContainsDynamicRef guard > $ref with local $defs anchors but resolved target has no $dynamicRef",
      {
        given: {
          $ref: "#/components/schemas/Simple",
          $defs: {
            itemType: {
              $dynamicAnchor: "itemType",
              type: "string",
            },
          },
        },
        want: 'components["schemas"]["Simple"]',
        options: {
          ...DEFAULT_OPTIONS,
          ctx: {
            ...DEFAULT_OPTIONS.ctx,
            resolve($ref: string) {
              if ($ref === "#/components/schemas/Simple") {
                return { type: "object", properties: { id: { type: "integer" } } };
              }
              return undefined as any;
            },
          },
        },
      },
    ],
    [
      "$dynamicRef with non-# URI > uses full string as anchor name",
      {
        given: {
          $dynamicRef: "itemType",
          $defs: {
            itemType: {
              $dynamicAnchor: "itemType",
              type: "boolean",
            },
          },
        },
        want: "boolean",
      },
    ],
    [
      "$dynamicAnchor without options.path > self-registration skipped",
      {
        given: {
          $dynamicAnchor: "nodeType",
          type: "object",
          properties: {
            children: {
              type: "array",
              items: { $dynamicRef: "#nodeType" },
            },
          },
        },
        want: `{
    children?: unknown[];
}`,
        options: {
          ctx: { ...DEFAULT_CTX },
        },
      },
    ],
    [
      "$dynamicRef inside allOf > resolves with parent $defs anchors",
      {
        given: {
          allOf: [
            {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: { $dynamicRef: "#itemType" },
                },
              },
            },
          ],
          $defs: {
            itemType: {
              $dynamicAnchor: "itemType",
              type: "string",
            },
          },
        },
        want: `{
    $defs: {
        itemType: string;
    };
} & {
    items?: string[];
}`,
      },
    ],
    [
      "$dynamicRef inside oneOf > resolves with parent $defs anchors",
      {
        given: {
          oneOf: [{ $dynamicRef: "#itemType" }, { type: "null" }],
          $defs: {
            itemType: {
              $dynamicAnchor: "itemType",
              type: "integer",
            },
          },
        },
        want: `{
    $defs: {
        itemType: number;
    };
} | number | null`,
      },
    ],
    [
      "$dynamicRef and $dynamicAnchor on same schema > $dynamicRef returns early before self-registration",
      {
        given: {
          $dynamicRef: "#anchor",
          $dynamicAnchor: "anchor",
          $defs: {
            anchor: {
              $dynamicAnchor: "anchor",
              type: "number",
            },
          },
        },
        want: "number",
      },
    ],
    [
      "$ref with both inherited and local anchors > both are merged and passed to resolved template",
      {
        given: {
          $ref: "#/components/schemas/PairTemplate",
          $defs: {
            secondType: {
              $dynamicAnchor: "secondType",
              type: "boolean",
            },
          },
        },
        want: `{
    first?: string;
    second?: boolean;
}`,
        options: {
          ...DEFAULT_OPTIONS,
          dynamicAnchors: {
            firstType: { type: "string" },
          },
          ctx: {
            ...DEFAULT_OPTIONS.ctx,
            resolve($ref: string) {
              if ($ref === "#/components/schemas/PairTemplate") {
                return {
                  type: "object",
                  properties: {
                    first: { $dynamicRef: "#firstType" },
                    second: { $dynamicRef: "#secondType" },
                  },
                };
              }
              return undefined as any;
            },
          },
        },
      },
    ],
    [
      "resolveDynamicAnchor skips non-matching anchor names in $defs",
      {
        given: {
          $dynamicRef: "#target",
          $defs: {
            other: {
              $dynamicAnchor: "other",
              type: "number",
            },
            target: {
              $dynamicAnchor: "target",
              type: "string",
            },
          },
        },
        want: "string",
      },
    ],
    [
      "collectDynamicAnchors > $defs with mixed entries (some with $dynamicAnchor, some without)",
      {
        given: {
          type: "object",
          properties: {
            data: { $dynamicRef: "#myType" },
          },
          $defs: {
            helper: { type: "string" },
            myType: {
              $dynamicAnchor: "myType",
              type: "integer",
            },
          },
        },
        want: `{
    data?: number;
    $defs: {
        helper: string;
        myType: number;
    };
}`,
      },
    ],
    [
      "collectDynamicAnchors > non-object $defs returns undefined > no anchors collected",
      {
        given: {
          $dynamicRef: "#itemType",
          $defs: "not-an-object",
        },
        want: "unknown",
      },
    ],
    [
      "$dynamicAnchor self-registration > nested $dynamicRef resolves through self-ref",
      {
        given: {
          $dynamicAnchor: "tree",
          type: "object",
          properties: {
            value: { type: "string" },
            left: { $dynamicRef: "#tree" },
            right: { $dynamicRef: "#tree" },
          },
        },
        want: `{
    value?: string;
    left?: components["schemas"]["schema-object"];
    right?: components["schemas"]["schema-object"];
}`,
      },
    ],
  ];

  for (const [testName, { given, want, options = DEFAULT_OPTIONS, ci }] of tests) {
    test.skipIf(ci?.skipIf)(
      testName,
      async () => {
        const result = astToString(transformSchemaObject(given, options));
        if (want instanceof URL) {
          await expect(result).toMatchFileSnapshot(fileURLToPath(want));
        } else {
          expect(result).toBe(`${want}\n`);
        }
      },
      ci?.timeout,
    );
  }
});
