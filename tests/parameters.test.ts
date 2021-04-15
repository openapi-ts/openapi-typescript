import { transformParametersArray } from "../src/transform/parameters";

describe("transformParametersArray()", () => {
  describe("v2", () => {
    it("basic", () => {
      const basicSchema = [
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

      expect(
        transformParametersArray(basicSchema as any, {
          immutableTypes: false,
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

      expect(
        transformParametersArray(basicSchema as any, {
          immutableTypes: true,
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

    it("$ref", () => {
      const refSchema = [
        { $ref: "#/parameters/per_page" },
        { $ref: "#/parameters/page" },
        { $ref: "#/parameters/since" },
      ];

      expect(
        transformParametersArray(refSchema, {
          globalParameters: {
            per_page: { in: "query", name: "per_page", required: true, type: "number" },
            page: { in: "query", name: "page", type: "number" },
            since: { in: "query", name: "since", type: "string" },
          },
          immutableTypes: false,
          version: 2,
        }).trim()
      ).toBe(`query: {
    "per_page": parameters["per_page"];
    "page"?: parameters["page"];
    "since"?: parameters["since"];
  }`);

      expect(
        transformParametersArray(refSchema, {
          globalParameters: {
            per_page: { in: "query", name: "per_page", required: true, type: "number" },
            page: { in: "query", name: "page", type: "number" },
            since: { in: "query", name: "since", type: "string" },
          },
          immutableTypes: true,
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
    it("basic", () => {
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

      expect(
        transformParametersArray(basicSchema as any, {
          immutableTypes: false,
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

      expect(
        transformParametersArray(basicSchema as any, {
          immutableTypes: true,
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

    it("$ref", () => {
      const refSchema = [
        { $ref: "#/components/parameters/per_page" },
        { $ref: "#/components/parameters/page" },
        { $ref: "#/components/parameters/since" },
      ];

      expect(
        transformParametersArray(refSchema, {
          globalParameters: {
            per_page: { in: "query", name: "per_page", required: true },
            page: { in: "query", name: "page" },
            since: { in: "query", name: "since" },
          },
          immutableTypes: false,
          version: 3,
        }).trim()
      ).toBe(`query: {
    "per_page": components["parameters"]["per_page"];
    "page"?: components["parameters"]["page"];
    "since"?: components["parameters"]["since"];
  }`);

      expect(
        transformParametersArray(refSchema, {
          globalParameters: {
            per_page: { in: "query", name: "per_page", required: true },
            page: { in: "query", name: "page" },
            since: { in: "query", name: "since" },
          },
          immutableTypes: true,
          version: 3,
        }).trim()
      ).toBe(`readonly query: {
    readonly "per_page": components["parameters"]["per_page"];
    readonly "page"?: components["parameters"]["page"];
    readonly "since"?: components["parameters"]["since"];
  }`);
    });

    it("nullable", () => {
      const schema = [
        { in: "query", name: "nullableString", schema: { type: "string", nullable: true } },
        { in: "query", name: "nullableNum", schema: { type: "number", nullable: true } },
      ];

      expect(
        transformParametersArray(schema as any, {
          immutableTypes: false,
          version: 3,
        }).trim()
      ).toBe(`query: {
    "nullableString"?: (string) | null;
    "nullableNum"?: (number) | null;
  }`);
    });
  });
});
