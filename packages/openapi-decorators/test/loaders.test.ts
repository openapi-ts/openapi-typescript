import "reflect-metadata";
import { DocumentBuilder, apiProperty } from "../src";
import { OperationBuilder } from "../src/builders/operation-builder";
import { loadApiBody } from "../src/loaders/loadApiBody";
import { loadApiOperation } from "../src/loaders/loadApiOperation";
import { loadApiParam } from "../src/loaders/loadApiParam";
import { loadApiProperty } from "../src/loaders/loadApiProperty";
import { loadApiQuery } from "../src/loaders/loadApiQuery";
import { loadApiResponse } from "../src/loaders/loadApiResponse";
import { loadApiTags } from "../src/loaders/loadApiTags";
import { loadSchema } from "../src/loaders/loadSchema";
import { resolveType } from "../src/loaders/loadType";

describe("loaders", () => {
  describe("loadApiBody", () => {
    it("should properly enrich operation", () => {
      const document = new DocumentBuilder();
      const operation = new OperationBuilder();

      loadApiBody(document, operation, {
        type: "string",
      });

      expect(operation.build().requestBody).toEqual({
        content: {
          "application/json": {
            schema: {
              type: "string",
            },
          },
        },
      });
    });
  });

  describe("loadApiOperation", () => {
    it("should properly enrich operation", () => {
      const operation = new OperationBuilder();

      loadApiOperation(operation, {
        summary: "Test summary",
      });

      expect(operation.build()).toEqual({
        summary: "Test summary",
        responses: {},
      });
    });

    it("should properly merge tags", () => {
      const operation = new OperationBuilder().addTags("Hello");

      loadApiOperation(operation, {
        tags: ["World"],
      });

      expect(operation.build()).toEqual({
        tags: ["Hello", "World"],
        responses: {},
      });
    });
  });

  describe("loadApiParam", () => {
    it("should properly enrich operation", () => {
      const document = new DocumentBuilder();
      const operation = new OperationBuilder();

      loadApiParam(document, operation, {
        name: "userId",
      });

      loadApiParam(document, operation, {
        name: "collectionId",
        type: "number",
      });

      const parameters = operation.build().parameters;
      expect(parameters).toContainEqual({ name: "userId", in: "path", schema: { type: "string" } });
      expect(parameters).toContainEqual({ name: "collectionId", in: "path", schema: { type: "number" } });
    });
  });

  describe("loadApiProperty", () => {
    it("should properly enrich schema", () => {
      const document = new DocumentBuilder();
      const schema = document.createSchema("Test");

      loadApiProperty(document, schema, "id", {});
      loadApiProperty(document, schema, "name", { type: "string" });
      loadApiProperty(document, schema, "notRequired", { type: "number", required: false });

      const output = schema.build();

      expect(output.required).toContainEqual("id");
      expect(output.required).toContainEqual("name");
      expect(output.required).not.toContainEqual("notRequired");

      expect(output.properties?.id).toEqual({});
      expect(output.properties?.name).toEqual({ type: "string" });
      expect(output.properties?.notRequired).toEqual({ type: "number" });
    });
  });

  describe("loadApiQuery", () => {
    it("should properly enrich operation", () => {
      const document = new DocumentBuilder();
      const operation = new OperationBuilder();

      loadApiQuery(document, operation, {
        name: "userId",
      });

      loadApiQuery(document, operation, {
        name: "collectionId",
        type: "number",
      });

      const parameters = operation.build().parameters;
      expect(parameters).toContainEqual({ name: "userId", in: "query", schema: { type: "string" } });
      expect(parameters).toContainEqual({ name: "collectionId", in: "query", schema: { type: "number" } });
    });
  });

  describe("loadApiResponse", () => {
    it("should properly enrich operation", () => {
      const document = new DocumentBuilder();
      const operation = new OperationBuilder();

      loadApiResponse(document, operation, {
        status: 200,
        type: "string",
      });

      loadApiResponse(document, operation, {
        status: 500,
        type: "number",
      });

      const responses = operation.build().responses;
      expect(responses[200]).toEqual({
        description: "OK",
        content: {
          "application/json": {
            schema: {
              type: "string",
            },
          },
        },
      });

      expect(responses[500]).toEqual({
        description: "OK", // TODO: Wrong description
        content: {
          "application/json": {
            schema: {
              type: "number",
            },
          },
        },
      });
    });
  });

  describe("loadApiTags", () => {
    it("should properly enrich operation", () => {
      const operation = new OperationBuilder();

      loadApiTags(operation, ["hello"]);

      const tags = operation.build().tags;

      expect(tags).toContain("hello");
    });
  });

  describe("loadSchema", () => {
    it("should properly add the schema to the document", () => {
      const document = new DocumentBuilder();

      class Test {
        @apiProperty()
        declare helloworld: string;
      }

      const ref = loadSchema(document, Test.prototype);
      const build = document.build();

      expect(ref).toEqual({ $ref: "#/components/schemas/Test" });
      expect(build.components?.schemas?.Test).toEqual({
        type: "object",
        properties: { helloworld: { type: "string" } },
        required: ["helloworld"],
      });
    });
  });

  describe("loadType", () => {
    it("should accept string types", () => {
      const document = new DocumentBuilder();
      expect(resolveType(document, "boolean")).toEqual({ type: "boolean" });
      expect(resolveType(document, "integer")).toEqual({ type: "integer" });
      expect(resolveType(document, "number")).toEqual({ type: "number" });
      expect(resolveType(document, "string")).toEqual({ type: "string" });
    });

    it("should accept schema reference", () => {
      const document = new DocumentBuilder();
      expect(resolveType(document, { $ref: "#/components/schemas/User" })).toEqual({
        $ref: "#/components/schemas/User",
      });
    });

    it("should accept function types", () => {
      const document = new DocumentBuilder();
      expect(resolveType(document, Boolean)).toEqual({ type: "boolean" });
      expect(resolveType(document, Number)).toEqual({ type: "number" });
      expect(resolveType(document, String)).toEqual({ type: "string" });
    });
  });
});
