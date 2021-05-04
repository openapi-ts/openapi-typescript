import { transformParametersArray } from "../src/transform/parameters";

const defaults = {
  additionalProperties: false,
  immutableTypes: false,
  defaultNonNullable: false,
  rawSchema: false,
};

describe("transformParametersArray()", () => {
  describe("v2", () => {
    const basicSchema: any = [
      {
        description: "Specifies which fields in the response should be expanded.",
        in: "query",
        name: "expand",
        required: false,
        items: {
          type: "string",
        },
        type: "array",
      },
      { in: "path", name: "three_d_secure", required: true, type: "string" },
      { in: "body", name: "payload", schema: { type: "string" } },
    ];

    it("basic", () => {
      expect(
        transformParametersArray(basicSchema as any, {
          ...defaults,
          version: 2,
        }).trim()
      ).toBe(
        `query: {
/** Specifies which fields in the response should be expanded. */
    "expand"?: (string)[];
  }
  path: {
    "three_d_secure": string;
  }
  body: {
    "payload"?: string;
  }`
      );
    });

    it("basic (immutableTypes)", () => {
      expect(
        transformParametersArray(basicSchema as any, {
          ...defaults,
          immutableTypes: true,
          rawSchema: false,
          version: 2,
        }).trim()
      ).toBe(
        `readonly query: {
/** Specifies which fields in the response should be expanded. */
    readonly "expand"?: readonly (string)[];
  }
  readonly path: {
    readonly "three_d_secure": string;
  }
  readonly body: {
    readonly "payload"?: string;
  }`
      );
    });

    const refSchema = [
      { $ref: 'parameters["per_page"]' },
      { $ref: 'parameters["page"]' },
      { $ref: 'parameters["since"]' },
    ];

    it("$ref", () => {
      expect(
        transformParametersArray(refSchema, {
          ...defaults,
          globalParameters: {
            per_page: { in: "query", name: "per_page", required: true, type: "number" },
            page: { in: "query", name: "page", type: "number" },
            since: { in: "query", name: "since", type: "string" },
          },
          version: 2,
        }).trim()
      ).toBe(`query: {
    "per_page": parameters["per_page"];
    "page"?: parameters["page"];
    "since"?: parameters["since"];
  }`);
    });

    it("$ref (immutableTypes)", () => {
      expect(
        transformParametersArray(refSchema, {
          ...defaults,
          immutableTypes: true,
          globalParameters: {
            per_page: { in: "query", name: "per_page", required: true, type: "number" },
            page: { in: "query", name: "page", type: "number" },
            since: { in: "query", name: "since", type: "string" },
          },
          version: 2,
        }).trim()
      ).toBe(`readonly query: {
    readonly "per_page": parameters["per_page"];
    readonly "page"?: parameters["page"];
    readonly "since"?: parameters["since"];
  }`);
    });
  });

  describe("v3", () => {
    const basicSchema = [
      {
        description: "Specifies which fields in the response should be expanded.",
        in: "query",
        name: "expand",
        required: false,
        schema: {
          items: {
            type: "string",
          },
          type: "array",
        },
      },
      {
        in: "path",
        name: "three_d_secure",
        required: true,
        schema: {
          type: "string",
        },
      },
    ];

    it("basic", () => {
      expect(
        transformParametersArray(basicSchema as any, {
          ...defaults,
          version: 3,
        }).trim()
      ).toBe(
        `query: {
/** Specifies which fields in the response should be expanded. */
    "expand"?: (string)[];
  }
  path: {
    "three_d_secure": string;
  }`
      );
    });

    it("basic (immutableTypes)", () => {
      expect(
        transformParametersArray(basicSchema as any, {
          ...defaults,
          immutableTypes: true,
          rawSchema: false,
          version: 3,
        }).trim()
      ).toBe(
        `readonly query: {
/** Specifies which fields in the response should be expanded. */
    readonly "expand"?: readonly (string)[];
  }
  readonly path: {
    readonly "three_d_secure": string;
  }`
      );
    });

    const refSchema = [
      { $ref: 'components["parameters"]["per_page"]' },
      { $ref: 'components["parameters"]["page"]' },
      { $ref: 'components["parameters"]["since"]' },
    ];

    it("$ref", () => {
      expect(
        transformParametersArray(refSchema, {
          ...defaults,
          globalParameters: {
            per_page: { in: "query", name: "per_page", required: true },
            page: { in: "query", name: "page" },
            since: { in: "query", name: "since" },
          },
          version: 3,
        }).trim()
      ).toBe(`query: {
    "per_page": components["parameters"]["per_page"];
    "page"?: components["parameters"]["page"];
    "since"?: components["parameters"]["since"];
  }`);
    });

    it("$ref (immutableTypes)", () => {
      expect(
        transformParametersArray(refSchema, {
          ...defaults,
          immutableTypes: true,
          globalParameters: {
            per_page: { in: "query", name: "per_page", required: true },
            page: { in: "query", name: "page" },
            since: { in: "query", name: "since" },
          },
          version: 3,
        }).trim()
      ).toBe(`readonly query: {
    readonly "per_page": components["parameters"]["per_page"];
    readonly "page"?: components["parameters"]["page"];
    readonly "since"?: components["parameters"]["since"];
  }`);
    });

    it("nullable", () => {
      const schema: any = [
        { in: "query", name: "nullableString", schema: { type: "string", nullable: true } },
        { in: "query", name: "nullableNum", schema: { type: "number", nullable: true } },
      ];

      expect(
        transformParametersArray(schema as any, {
          ...defaults,
          version: 3,
        }).trim()
      ).toBe(`query: {
    "nullableString"?: (string) | null;
    "nullableNum"?: (number) | null;
  }`);
    });
  });
});
