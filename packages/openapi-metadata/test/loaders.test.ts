import "reflect-metadata";
import { DocumentBuilder } from "../src/builders/document-builder";
import { OperationBuilder } from "../src/builders/operation-builder";
import { loadApiBody } from "../src/loaders/loadApiBody";
import { loadApiOperation } from "../src/loaders/loadApiOperation";
import { loadApiParam } from "../src/loaders/loadApiParam";
import { loadApiProperty } from "../src/loaders/loadApiProperty";
import { loadApiQuery } from "../src/loaders/loadApiQuery";
import { loadApiResponse } from "../src/loaders/loadApiResponse";
import { loadApiTags } from "../src/loaders/loadApiTags";
import { resolveType } from "../src/loaders/loadType";
import type { OpenAPIV3 } from "openapi-types";
import { apiBody, apiOperation, apiParam, apiQuery, apiResponse, apiTags } from "../src";
import { loadControllerOperation } from "../src/loaders";

describe("loaders", () => {
  describe("loadApiBody", () => {
    it("should properly enrich operation", async () => {
      const document = new DocumentBuilder();
      const operation = new OperationBuilder();

      await loadApiBody(document, operation, {
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

    it("should override method and pattern", () => {
      const operation = new OperationBuilder();
      operation.pattern = "/nop";
      operation.method = "post";

      loadApiOperation(operation, {
        method: "get",
        pattern: "/users",
      });

      expect(operation.method).toBe("get");
      expect(operation.pattern).toBe("/users");
    });
  });

  describe("loadApiParam", () => {
    it("should properly enrich operation", async () => {
      const document = new DocumentBuilder();
      const operation = new OperationBuilder();

      await loadApiParam(document, operation, {
        name: "userId",
      });

      await loadApiParam(document, operation, {
        name: "collectionId",
        type: "number",
      });

      const parameters = operation.build().parameters;
      expect(parameters).toContainEqual({ name: "userId", in: "path", schema: { type: "string" } });
      expect(parameters).toContainEqual({ name: "collectionId", in: "path", schema: { type: "number" } });
    });
  });

  describe("loadApiProperty", () => {
    it("should properly enrich schema", async () => {
      const document = new DocumentBuilder();
      const schema: OpenAPIV3.SchemaObject = {};

      await loadApiProperty(document, schema, "id", {});
      await loadApiProperty(document, schema, "name", { type: "string" });
      await loadApiProperty(document, schema, "notRequired", { type: "number", required: false });

      expect(schema.required).toContainEqual("id");
      expect(schema.required).toContainEqual("name");
      expect(schema.required).not.toContainEqual("notRequired");

      expect(schema.properties?.id).toEqual({});
      expect(schema.properties?.name).toEqual({ type: "string" });
      expect(schema.properties?.notRequired).toEqual({ type: "number" });
    });
  });

  describe("loadApiQuery", () => {
    it("should properly enrich operation", async () => {
      const document = new DocumentBuilder();
      const operation = new OperationBuilder();

      await loadApiQuery(document, operation, {
        name: "userId",
      });

      await loadApiQuery(document, operation, {
        name: "collectionId",
        type: "number",
      });

      const parameters = operation.build().parameters;
      expect(parameters).toContainEqual({ name: "userId", in: "query", schema: { type: "string" } });
      expect(parameters).toContainEqual({ name: "collectionId", in: "query", schema: { type: "number" } });
    });
  });

  describe("loadApiResponse", () => {
    it("should properly enrich operation", async () => {
      const document = new DocumentBuilder();
      const operation = new OperationBuilder();

      await loadApiResponse(document, operation, {
        status: 200,
        type: "string",
      });

      await loadApiResponse(document, operation, {
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

  describe("loadType", () => {
    it("should accept string types", async () => {
      const document = new DocumentBuilder();
      expect(await resolveType(document, "boolean")).toEqual({ type: "boolean" });
      expect(await resolveType(document, "integer")).toEqual({ type: "integer" });
      expect(await resolveType(document, "number")).toEqual({ type: "number" });
      expect(await resolveType(document, "string")).toEqual({ type: "string" });
    });

    it("should accept schema reference", async () => {
      const document = new DocumentBuilder();
      expect(await resolveType(document, { $ref: "#/components/schemas/User" })).toEqual({
        $ref: "#/components/schemas/User",
      });
    });

    it("should accept function types", async () => {
      const document = new DocumentBuilder();
      expect(await resolveType(document, Boolean)).toEqual({ type: "boolean" });
      expect(await resolveType(document, Number)).toEqual({ type: "number" });
      expect(await resolveType(document, String)).toEqual({ type: "string" });
    });

    it("should properly resolve array", async () => {
      const document = new DocumentBuilder();
      expect(await resolveType(document, [Boolean])).toEqual({ type: "array", items: { type: "boolean" } });
    });
  });
});

// TODO: Move (and maybe rename) this elsewhere as it is different of other loaders
describe("loadController", () => {
  it("should load apiOperation", async () => {
    class UsersController {
      @apiOperation({
        method: "post",
        pattern: "/users",
      })
      public create() {}
    }

    const document = new DocumentBuilder();
    const operation = new OperationBuilder();

    await loadControllerOperation(document, operation, UsersController.prototype, "create");

    expect(operation.pattern).toBe("/users");
    expect(operation.method).toBe("post");
  });

  it("should load tags", async () => {
    @apiTags("Hello")
    class UsersController {
      @apiOperation({
        method: "post",
        pattern: "/users",
      })
      @apiTags("World")
      public create() {}
    }

    const document = new DocumentBuilder();
    const operation = new OperationBuilder();

    await loadControllerOperation(document, operation, UsersController.prototype, "create");
    const res = operation.build();

    expect(res.tags).toContain("Hello");
    expect(res.tags).toContain("World");
  });

  it("should load apiBody", async () => {
    class UsersController {
      @apiOperation({
        method: "post",
        pattern: "/users",
      })
      @apiBody({ type: String })
      public create() {}
    }

    const document = new DocumentBuilder();
    const operation = new OperationBuilder();

    await loadControllerOperation(document, operation, UsersController.prototype, "create");

    const res: any = operation.build();

    expect(res.requestBody.content["application/json"].schema).toBeDefined();
  });

  it("should load apiResponse", async () => {
    class UsersController {
      @apiOperation({
        method: "post",
        pattern: "/users",
      })
      @apiResponse({ type: String })
      public create() {}
    }

    const document = new DocumentBuilder();
    const operation = new OperationBuilder();

    await loadControllerOperation(document, operation, UsersController.prototype, "create");

    const res: any = operation.build();

    expect(res.responses[200].content["application/json"].schema).toBeDefined();
  });

  it("should load apiParam", async () => {
    class UsersController {
      @apiOperation({
        method: "post",
        pattern: "/users",
      })
      @apiParam({ name: "userId", type: String })
      @apiParam({ name: "testId", type: String })
      public create() {}
    }

    const document = new DocumentBuilder();
    const operation = new OperationBuilder();

    await loadControllerOperation(document, operation, UsersController.prototype, "create");

    const res: any = operation.build();

    expect(res.parameters).toHaveLength(2);
  });

  it("should load apiQuery", async () => {
    class UsersController {
      @apiOperation({
        method: "post",
        pattern: "/users",
      })
      @apiQuery({ name: "filter", type: String })
      public create() {}
    }

    const document = new DocumentBuilder();
    const operation = new OperationBuilder();

    await loadControllerOperation(document, operation, UsersController.prototype, "create");

    const res: any = operation.build();

    expect(res.parameters).toHaveLength(1);
  });
});
