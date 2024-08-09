import "reflect-metadata";
import {
  apiBody,
  apiOperation,
  apiParam,
  apiProperty,
  apiQuery,
  apiResponse,
  apiTags,
  getApiBody,
  getApiOperation,
  getApiParams,
  getApiProperties,
  getApiQueries,
  getApiResponses,
  getApiTags,
} from "../src/decorators";

describe("decorators", () => {
  describe("apiBody", () => {
    it("should apply decorator properly", () => {
      class TestController {
        @apiBody({ type: "string" })
        public index() {}
      }

      expect(getApiBody(TestController.prototype, "index")).toEqual({ type: "string" });
    });
  });

  describe("apiOperation", () => {
    it("should apply decorator properly", () => {
      class TestController {
        @apiOperation({ summary: "TEST", tags: ["Test"] })
        public index() {}
      }

      expect(getApiOperation(TestController.prototype, "index")).toEqual({ summary: "TEST", tags: ["Test"] });
    });
  });

  describe("apiParam", () => {
    it("should apply decorator properly", () => {
      class TestController {
        @apiParam({ name: "test", type: "string" })
        @apiParam({ name: "hello" })
        public index() {}
      }

      const apiParams = getApiParams(TestController.prototype, "index");
      expect(apiParams).toContainEqual({ name: "test", type: "string" });
      expect(apiParams).toContainEqual({ name: "hello" });
    });
  });

  describe("apiProperty", () => {
    it("should apply decorator properly", () => {
      class User {
        @apiProperty({ type: String })
        exampleProperty = "test";

        @apiProperty()
        declare exampleDeclared: number;

        @apiProperty()
        public exampleMethod(): string {
          return this.exampleProperty;
        }

        @apiProperty()
        public get exampleGetter(): number {
          return this.exampleDeclared;
        }
      }

      expect(getApiProperties(User.prototype)).toEqual({
        exampleProperty: { type: String },
        exampleDeclared: { type: Number },
        exampleMethod: { type: String },
        exampleGetter: { type: Number },
      });
    });
  });

  describe("apiQuery", () => {
    it("should apply decorator properly", () => {
      class TestController {
        @apiQuery({ name: "query" })
        @apiQuery({ name: "filter" })
        public index() {}
      }

      const apiQueries = getApiQueries(TestController.prototype, "index");
      expect(apiQueries).toContainEqual({ name: "query" });
      expect(apiQueries).toContainEqual({ name: "filter" });
    });
  });

  describe("apiResponse", () => {
    it("should apply decorator properly", () => {
      class TestController {
        @apiResponse({ status: 200, type: String })
        @apiResponse({ status: 400 })
        public index() {}
      }

      const apiResponses = getApiResponses(TestController.prototype, "index");
      expect(apiResponses).toContainEqual({ status: 200, type: String });
      expect(apiResponses).toContainEqual({ status: 400 });
    });
  });

  describe("apiTags", () => {
    it("should apply decorator on methods", () => {
      class TestController {
        @apiTags("test")
        public index() {}
      }

      expect(getApiTags(TestController.prototype, "index")).toContainEqual("test");
    });

    it("should apply decorator on classes", () => {
      @apiTags("test")
      class TestController {
        public index() {}
      }

      expect(getApiTags(TestController)).toContainEqual("test");
    });
  });
});
