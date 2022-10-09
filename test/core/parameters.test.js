import { expect } from "chai";
import { transformParametersArray } from "../../dist/transform/parameters.js";

const defaults = {
  additionalProperties: false,
  immutableTypes: false,
  defaultNonNullable: false,
  rawSchema: false,
};

describe("transformParametersArray()", () => {
  describe("v2", () => {
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

    it("basic", () => {
      expect(
        transformParametersArray(basicSchema, {
          ...defaults,
          version: 2,
        }).trim()
      ).to.equal(
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
        transformParametersArray(basicSchema, {
          ...defaults,
          immutableTypes: true,
          rawSchema: false,
          version: 2,
        }).trim()
      ).to.equal(
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

    it("basic (alphabetize)", () => {
      const schema = [
        { in: "query", name: "delta", required: true, type: "string" },
        { in: "query", name: "charlie", required: true, type: "string" },
        { in: "query", name: "alpha", required: true, type: "string" },
        { in: "query", name: "bravo", required: true, type: "string" },
      ];

      const actual = transformParametersArray(schema, {
        ...defaults,
        version: 2,
        alphabetize: true,
        globalParameters: {
          per_page: { in: "query", name: "per_page", required: true, type: "number" },
          page: { in: "query", name: "page", type: "number" },
          since: { in: "query", name: "since", type: "string" },
        },
      }).trim();
      expect(actual).to.equal(`query: {
    "alpha": string;
    "bravo": string;
    "charlie": string;
    "delta": string;
  }`);
    });

    it("numeric (alphabetize)", () => {
      const schema = [
        { in: "query", name: "1000", required: true, type: "string" },
        { in: "query", name: "123", required: true, type: "string" },
        { in: "query", name: "1001", required: true, type: "string" },
        { in: "query", name: "111", required: true, type: "string" },
      ];

      const actual = transformParametersArray(schema, {
        ...defaults,
        version: 2,
        alphabetize: true,
        globalParameters: {
          per_page: { in: "query", name: "per_page", required: true, type: "number" },
          page: { in: "query", name: "page", type: "number" },
          since: { in: "query", name: "since", type: "string" },
        },
      }).trim();
      expect(actual).to.equal(`query: {
    "111": string;
    "123": string;
    "1000": string;
    "1001": string;
  }`);
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
      ).to.equal(`query: {
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
      ).to.equal(`readonly query: {
    readonly "per_page": parameters["per_page"];
    readonly "page"?: parameters["page"];
    readonly "since"?: parameters["since"];
  }`);
    });

    it("$ref (alphabetize)", () => {
      const actual = transformParametersArray(refSchema, {
        ...defaults,
        version: 2,
        alphabetize: true,
        globalParameters: {
          per_page: { in: "query", name: "per_page", required: true, type: "number" },
          page: { in: "query", name: "page", type: "number" },
          since: { in: "query", name: "since", type: "string" },
        },
      }).trim();
      expect(actual).to.equal(`query: {
    "page"?: parameters["page"];
    "per_page": parameters["per_page"];
    "since"?: parameters["since"];
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
        transformParametersArray(basicSchema, {
          ...defaults,
          version: 3,
        }).trim()
      ).to.equal(
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
        transformParametersArray(basicSchema, {
          ...defaults,
          immutableTypes: true,
          rawSchema: false,
          version: 3,
        }).trim()
      ).to.equal(
        `readonly query: {
/** Specifies which fields in the response should be expanded. */
    readonly "expand"?: readonly (string)[];
  }
  readonly path: {
    readonly "three_d_secure": string;
  }`
      );
    });

    it("basic (alphabetize)", () => {
      const schema = [
        { in: "query", name: "delta", required: true, schema: { type: "string" } },
        { in: "query", name: "charlie", required: true, schema: { type: "string" } },
        { in: "query", name: "alpha", required: true, schema: { type: "string" } },
        { in: "query", name: "bravo", required: true, schema: { type: "string" } },
      ];

      const actual = transformParametersArray(schema, {
        ...defaults,
        version: 3,
        alphabetize: true,
        globalParameters: {
          per_page: { in: "query", name: "per_page", required: true, type: "number" },
          page: { in: "query", name: "page", type: "number" },
          since: { in: "query", name: "since", type: "string" },
        },
      }).trim();
      expect(actual).to.equal(`query: {
    "alpha": string;
    "bravo": string;
    "charlie": string;
    "delta": string;
  }`);
    });

    it("numeric (alphabetize)", () => {
      const schema = [
        { in: "query", name: "1000", required: true, schema: { type: "string" } },
        { in: "query", name: "123", required: true, schema: { type: "string" } },
        { in: "query", name: "1001", required: true, schema: { type: "string" } },
        { in: "query", name: "111", required: true, schema: { type: "string" } },
      ];

      const actual = transformParametersArray(schema, {
        ...defaults,
        version: 3,
        alphabetize: true,
        globalParameters: {
          per_page: { in: "query", name: "per_page", required: true, type: "number" },
          page: { in: "query", name: "page", type: "number" },
          since: { in: "query", name: "since", type: "string" },
        },
      }).trim();
      expect(actual).to.equal(`query: {
    "111": string;
    "123": string;
    "1000": string;
    "1001": string;
  }`);
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
      ).to.equal(`query: {
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
      ).to.equal(`readonly query: {
    readonly "per_page": components["parameters"]["per_page"];
    readonly "page"?: components["parameters"]["page"];
    readonly "since"?: components["parameters"]["since"];
  }`);
    });

    it("$ref (alphabetize)", () => {
      const actual = transformParametersArray(refSchema, {
        ...defaults,
        version: 3,
        alphabetize: true,
        globalParameters: {
          per_page: { in: "query", name: "per_page", required: true, type: "number" },
          page: { in: "query", name: "page", type: "number" },
          since: { in: "query", name: "since", type: "string" },
        },
      }).trim();
      expect(actual).to.equal(`query: {
    "page"?: components["parameters"]["page"];
    "per_page": components["parameters"]["per_page"];
    "since"?: components["parameters"]["since"];
  }`);
    });

    it("nullable", () => {
      const schema = [
        { in: "query", name: "nullableString", schema: { type: "string", nullable: true } },
        { in: "query", name: "nullableNum", schema: { type: "number", nullable: true } },
      ];

      expect(
        transformParametersArray(schema, {
          ...defaults,
          version: 3,
        }).trim()
      ).to.equal(`query: {
    "nullableString"?: (string) | null;
    "nullableNum"?: (number) | null;
  }`);
    });
  });
});
