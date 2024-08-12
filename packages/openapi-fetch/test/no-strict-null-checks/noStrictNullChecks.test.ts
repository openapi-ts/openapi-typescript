import { afterAll, beforeAll, describe, it } from "vitest";
import createClient from "../../src/index.js";
import { server, baseUrl, useMockRequestHandler } from "../fixtures/mock-server.js";
import type { paths } from "../fixtures/api.js";

beforeAll(() => {
  server.listen({
    onUnhandledRequest: (request) => {
      throw new Error(`No request handler found for ${request.method} ${request.url}`);
    },
  });
});

afterEach(() => server.resetHandlers());

afterAll(() => server.close());

describe("client", () => {
  describe("TypeScript checks", () => {
    describe("params", () => {
      it("is optional if no parameters are defined", async () => {
        const client = createClient<paths>({
          baseUrl,
        });

        useMockRequestHandler({
          baseUrl,
          method: "get",
          path: "/self",
          status: 200,
          body: { message: "OK" },
        });

        // assert no type error
        await client.GET("/self");

        // assert no type error with empty params
        await client.GET("/self", { params: {} });
      });

      it("checks types of optional params", async () => {
        const client = createClient<paths>({
          baseUrl,
        });

        useMockRequestHandler({
          baseUrl,
          method: "get",
          path: "/self",
          status: 200,
          body: { message: "OK" },
        });

        // assert no type error with no params
        await client.GET("/blogposts");

        // assert no type error with empty params
        await client.GET("/blogposts", { params: {} });

        // expect error on incorrect param type
        // @ts-expect-error
        await client.GET("/blogposts", { params: { query: { published: "yes" } } });

        // expect error on extra params
        // @ts-expect-error
        await client.GET("/blogposts", { params: { query: { fake: true } } });
      });
    });

    describe("body", () => {
      it("requires necessary requestBodies", async () => {
        const client = createClient<paths>({ baseUrl });

        useMockRequestHandler({
          baseUrl,
          method: "put",
          path: "/blogposts",
        });

        // expect error on missing `body`
        // @ts-expect-error
        await client.PUT("/blogposts");

        // expect error on missing fields
        // @ts-expect-error
        await client.PUT("/blogposts", { body: { title: "Foo" } });

        // (no error)
        await client.PUT("/blogposts", {
          body: {
            title: "Foo",
            body: "Bar",
            publish_date: new Date("2023-04-01T12:00:00Z").getTime(),
          },
        });
      });

      it("requestBody with required: false", async () => {
        const client = createClient<paths>({ baseUrl });

        useMockRequestHandler({
          baseUrl,
          method: "put",
          path: "/blogposts-optional",
          status: 201,
        });

        // assert missing `body` doesn’t raise a TS error
        await client.PUT("/blogposts-optional");

        // assert error on type mismatch
        // @ts-expect-error
        await client.PUT("/blogposts-optional", { body: { error: true } });

        // (no error)
        await client.PUT("/blogposts-optional", {
          body: {
            title: "",
            publish_date: 3,
            body: "",
          },
        });
      });
    });
  });
});
