import { transformParametersArray } from "../src/transform/parameters";

describe.only("transformParametersArray()", () => {
  describe("v2", () => {
    it("basic", () => {
      expect(
        transformParametersArray(
          [
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
          ],
          2
        ).trim()
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
    it("$ref", () => {
      expect(
        transformParametersArray(
          [{ $ref: "#/parameters/per_page" }, { $ref: "#/parameters/page" }, { $ref: "#/parameters/since" }],
          2,
          {
            per_page: { in: "query", name: "per_page", required: true, type: "number" },
            page: { in: "query", name: "page", type: "number" },
            since: { in: "query", name: "since", type: "string" },
          }
        ).trim()
      ).toBe(`query: {
    "per_page": parameters["per_page"];
    "page"?: parameters["page"];
    "since"?: parameters["since"];
  }`);
    });
  });
  describe("v3", () => {
    it("basic", () => {
      expect(
        transformParametersArray(
          [
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
          ],
          3
        ).trim()
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

    it("$ref", () => {
      expect(
        transformParametersArray(
          [
            { $ref: "#/components/parameters/per_page" },
            { $ref: "#/components/parameters/page" },
            { $ref: "#/components/parameters/since" },
          ],
          3,
          {
            per_page: { in: "query", name: "per_page", required: true },
            page: { in: "query", name: "page" },
            since: { in: "query", name: "since" },
          }
        ).trim()
      ).toBe(`query: {
    "per_page": components["parameters"]["per_page"];
    "page"?: components["parameters"]["page"];
    "since"?: components["parameters"]["since"];
  }`);
    });
  });
});
