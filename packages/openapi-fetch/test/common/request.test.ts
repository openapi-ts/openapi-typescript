import { describe, expect, test, vi } from "vitest";
import { createObservedClient, headersToObj } from "../helpers.js";
import createClient, { type BodySerializer, type FetchOptions } from "../../src/index.js";
import type { components, paths } from "./schemas/common.js";

type Resource = components["schemas"]["Resource"];

const resource1: Resource = { id: 123 };
const resource2: Resource = { id: 456 };
const resource3: Resource = { id: 789 };

describe("request", () => {
  describe("headers", () => {
    test("default headers are preserved", async () => {
      let headers = new Headers();
      const client = createObservedClient<paths>({ headers: { foo: "bar" } }, async (req) => {
        headers = req.headers;
        return Response.json([resource1, resource2, resource3]);
      });
      await client.GET("/resources");
      expect(headersToObj(headers)).toEqual({ foo: "bar" });
    });

    test("default headers can be overridden", async () => {
      let headers = new Headers();
      const client = createObservedClient<paths>(
        {
          headers: {
            foo: "bar",
            bar: "baz",
            baz: "bat",
            box: "cat",
          },
        },
        async (req) => {
          headers = req.headers;
          return Response.json([resource1, resource2, resource3]);
        },
      );
      await client.GET("/resources", {
        headers: {
          foo: "",
          bar: 0,
          baz: undefined, // keeps original
          box: false,
        },
      });
      expect(headersToObj(headers)).toEqual({ foo: "", bar: "0", baz: "bat", box: "false" });
    });

    test('default headers are unset with "null"', async () => {
      let headers = new Headers();
      const client = createObservedClient<paths>({ headers: { foo: "bar", bar: "baz" } }, async (req) => {
        headers = req.headers;
        return Response.json([resource1, resource2, resource3]);
      });
      await client.GET("/resources", { headers: { foo: null } });
      expect(headersToObj(headers)).toEqual({
        // "foo" removed!
        bar: "baz",
      });
    });

    test("arbitrary headers are allowed on any request", async () => {
      let headers = new Headers();
      const client = createObservedClient<paths>({}, async (req) => {
        headers = req.headers;
        return Response.json([resource1, resource2, resource3]);
      });
      await client.GET("/resources", {
        headers: {
          foo: "bar",
          bar: 123,
          baz: true,
        },
      });
      expect(headersToObj(headers)).toEqual({ foo: "bar", bar: "123", baz: "true" });
    });

    test("supports arrays", async () => {
      let headers = new Headers();
      const client = createObservedClient<paths>({}, async (req) => {
        headers = req.headers;
        return Response.json([resource1, resource2, resource3]);
      });

      const list = ["one", "two", "three"];

      await client.GET("/resources", { headers: { list } });

      expect(headers.get("list")).toEqual(list.join(", "));
    });
  });

  describe("request body", () => {
    const BODY_ACCEPTING_METHODS = [["PUT"], ["POST"], ["DELETE"], ["OPTIONS"], ["PATCH"]] as const;
    const ALL_METHODS = [...BODY_ACCEPTING_METHODS, ["GET"], ["HEAD"]] as const;

    async function fireRequestAndGetBodyInformation(options: {
      bodySerializer?: BodySerializer<unknown>;
      method: (typeof ALL_METHODS)[number][number];
      fetchOptions: FetchOptions<any>;
    }) {
      let actualRequest = new Request("https://fakeurl.example");
      const client = createObservedClient<any>({ bodySerializer: options.bodySerializer }, async (req) => {
        actualRequest = req.clone();
        return Response.json([]);
      });
      await client[options.method]("/blogposts-optional", options.fetchOptions as any);
      const bodyText = await actualRequest.text();
      return { bodyUsed: actualRequest.bodyUsed, bodyText };
    }

    test.each(ALL_METHODS)("missing body (with body serializer) - %s", async (method) => {
      const bodySerializer = vi.fn((body) => `Serialized: ${JSON.stringify(body)}`);
      const { bodyUsed, bodyText } = await fireRequestAndGetBodyInformation({
        bodySerializer,
        method,
        fetchOptions: {},
      });

      expect(bodyUsed).toBe(false);
      expect(bodyText).toBe("");
      expect(bodySerializer).not.toBeCalled();
    });

    test.each(ALL_METHODS)("missing body (without body serializer) - %s", async (method) => {
      const { bodyUsed, bodyText } = await fireRequestAndGetBodyInformation({ method, fetchOptions: {} });

      expect(bodyUsed).toBe(false);
      expect(bodyText).toBe("");
    });

    test.each(ALL_METHODS)("`undefined` body (with body serializer) - %s", async (method) => {
      const bodySerializer = vi.fn((body) => `Serialized: ${JSON.stringify(body)}`);
      const { bodyUsed, bodyText } = await fireRequestAndGetBodyInformation({
        bodySerializer,
        method,
        fetchOptions: {
          body: undefined,
        },
      });

      expect(bodyUsed).toBe(false);
      expect(bodyText).toBe("");
      expect(bodySerializer).not.toBeCalled();
    });

    test.each(ALL_METHODS)("`undefined` body (without body serializer) - %s", async (method) => {
      const { bodyUsed, bodyText } = await fireRequestAndGetBodyInformation({
        method,
        fetchOptions: {
          body: undefined,
        },
      });

      expect(bodyUsed).toBe(false);
      expect(bodyText).toBe("");
    });

    test.each(BODY_ACCEPTING_METHODS)("`null` body (with body serializer) - %s", async (method) => {
      const bodySerializer = vi.fn((body) => `Serialized: ${JSON.stringify(body)}`);
      const { bodyUsed, bodyText } = await fireRequestAndGetBodyInformation({
        bodySerializer,
        method,
        fetchOptions: {
          body: null,
        },
      });

      expect(bodyUsed).toBe(true);
      expect(bodyText).toBe("Serialized: null");
      expect(bodySerializer).toBeCalled();
    });

    test.each(BODY_ACCEPTING_METHODS)("`null` body (without body serializer) - %s", async (method) => {
      const { bodyUsed, bodyText } = await fireRequestAndGetBodyInformation({
        method,
        fetchOptions: {
          body: null,
        },
      });

      expect(bodyUsed).toBe(true);
      expect(bodyText).toBe("null");
    });

    test.each(BODY_ACCEPTING_METHODS)("`false` body (with body serializer) - %s", async (method) => {
      const bodySerializer = vi.fn((body) => `Serialized: ${JSON.stringify(body)}`);
      const { bodyUsed, bodyText } = await fireRequestAndGetBodyInformation({
        bodySerializer,
        method,
        fetchOptions: {
          body: false,
        },
      });

      expect(bodyUsed).toBe(true);
      expect(bodyText).toBe("Serialized: false");
      expect(bodySerializer).toBeCalled();
    });

    test.each(BODY_ACCEPTING_METHODS)("`false` body (without body serializer) - %s", async (method) => {
      const { bodyUsed, bodyText } = await fireRequestAndGetBodyInformation({
        method,
        fetchOptions: {
          body: false,
        },
      });

      expect(bodyUsed).toBe(true);
      expect(bodyText).toBe("false");
    });

    test.each(BODY_ACCEPTING_METHODS)("`''` body (with body serializer) - %s", async (method) => {
      const bodySerializer = vi.fn((body) => `Serialized: ${JSON.stringify(body)}`);
      const { bodyUsed, bodyText } = await fireRequestAndGetBodyInformation({
        bodySerializer,
        method,
        fetchOptions: {
          body: "",
        },
      });

      expect(bodyUsed).toBe(true);
      expect(bodyText).toBe('Serialized: ""');
      expect(bodySerializer).toBeCalled();
    });

    test.each(BODY_ACCEPTING_METHODS)("`''` body (without body serializer) - %s", async (method) => {
      const { bodyUsed, bodyText } = await fireRequestAndGetBodyInformation({
        method,
        fetchOptions: {
          body: "",
        },
      });

      expect(bodyUsed).toBe(true);
      expect(bodyText).toBe('""');
    });

    test.each(BODY_ACCEPTING_METHODS)("`0` body (with body serializer) - %s", async (method) => {
      const bodySerializer = vi.fn((body) => `Serialized: ${JSON.stringify(body)}`);
      const { bodyUsed, bodyText } = await fireRequestAndGetBodyInformation({
        bodySerializer,
        method,
        fetchOptions: {
          body: 0,
        },
      });

      expect(bodyUsed).toBe(true);
      expect(bodyText).toBe("Serialized: 0");
      expect(bodySerializer).toBeCalled();
    });

    test.each(BODY_ACCEPTING_METHODS)("`0` body (without body serializer) - %s", async (method) => {
      const { bodyUsed, bodyText } = await fireRequestAndGetBodyInformation({
        method,
        fetchOptions: {
          body: 0,
        },
      });

      expect(bodyUsed).toBe(true);
      expect(bodyText).toBe("0");
    });

    test("`application/x-www-form-urlencoded` body", async () => {
      const { bodyUsed, bodyText } = await fireRequestAndGetBodyInformation({
        method: "POST",
        fetchOptions: {
          body: { key1: "value1", key2: "value2" },
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        },
      });

      expect(bodyUsed).toBe(true);
      expect(bodyText).toBe("key1=value1&key2=value2");
    });
  });

  test("cookie header is preserved", async () => {
    let headers = new Headers();
    const client = createObservedClient<paths>({}, async (req) => {
      headers = req.headers;
      return Response.json({});
    });
    await client.GET("/resources", {
      credentials: "include",
      headers: {
        Cookie: "session=1234",
      },
    });
    expect(headers.get("cookie")).toEqual("session=1234");
  });

  test("uses provided Request class", async () => {
    // sanity check to make sure the provided fetch function is actually called
    expect.assertions(1);

    class SpecialRequestImplementation extends Request {}

    const specialFetch = async (input: Request) => {
      // make sure that the request is actually an instance of the custom request we provided
      expect(input).instanceOf(SpecialRequestImplementation);
      return Promise.resolve(Response.json({ hello: "world" }));
    };

    const client = createClient<paths>({
      baseUrl: "https://fakeurl.example",
      fetch: specialFetch,
      Request: SpecialRequestImplementation,
    });

    await client.GET("/resources");
  });

  test("Can use custom Request class", async () => {
    // sanity check to make sure the provided fetch function is actually called
    expect.assertions(1);

    class SpecialRequestImplementation extends Request {}

    const customFetch = async (input: Request) => {
      // make sure that the request is actually an instance of the custom request we provided
      expect(input).instanceOf(SpecialRequestImplementation);
      return Promise.resolve(Response.json({ hello: "world" }));
    };

    const client = createClient<paths>({
      baseUrl: "https://fakeurl.example",
      fetch: customFetch,
    });

    await client.GET("/resources", { Request: SpecialRequestImplementation });
  });

  test("can attach custom properties to request", async () => {
    function createCustomFetch(data: any) {
      const response = {
        clone: () => ({ ...response }),
        headers: new Headers(),
        json: async () => data,
        status: 200,
        ok: true,
      } as Response;
      return async (input: Request) => {
        expect(input).toHaveProperty("customProperty", "value");
        return Promise.resolve(response);
      };
    }

    const customFetch = createCustomFetch({});
    const client = createClient<paths>({ baseUrl: "https://fakeurl.example", fetch: customFetch });
    client.GET("/resources", {
      customProperty: "value",
    });
  });
});
