import { atom, computed } from "nanostores";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
// @ts-expect-error
import createFetchMock from "vitest-fetch-mock";
import createClient from "./index.js";
import type { paths } from "../test/v1.js";

const fetchMocker = createFetchMock(vi);

beforeAll(() => {
  fetchMocker.enableMocks();
});
afterEach(() => {
  fetchMocker.resetMocks();
});

interface MockResponse {
  headers?: Record<string, string>;
  status: number;
  body: any;
}

function mockFetch(res: MockResponse) {
  fetchMocker.mockResponse(() => res);
}

function mockFetchOnce(res: MockResponse) {
  fetchMocker.mockResponseOnce(() => res);
}

describe("client", () => {
  it("generates all proper functions", () => {
    const client = createClient<paths>();

    expect(client).toHaveProperty("get");
    expect(client).toHaveProperty("put");
    expect(client).toHaveProperty("post");
    expect(client).toHaveProperty("del");
    expect(client).toHaveProperty("options");
    expect(client).toHaveProperty("head");
    expect(client).toHaveProperty("patch");
    expect(client).toHaveProperty("trace");
  });

  describe("TypeScript checks", () => {
    it("marks data or error as undefined, but never both", async () => {
      const client = createClient<paths>();

      // data
      mockFetchOnce({ status: 200, body: JSON.stringify(["one", "two", "three"]) });
      const dataRes = await client.get("/string-array", {});

      // … is initially possibly undefined
      // @ts-expect-error
      expect(dataRes.data[0]).toBe("one");

      // … is present if error is undefined
      if (!dataRes.error) {
        expect(dataRes.data[0]).toBe("one");
      }

      // … means data is undefined
      if (dataRes.data) {
        // @ts-expect-error
        expect(() => dataRes.error.message).toThrow();
      }

      // error
      mockFetchOnce({ status: 500, body: JSON.stringify({ code: 500, message: "Something went wrong" }) });
      const errorRes = await client.get("/string-array", {});

      // … is initially possibly undefined
      // @ts-expect-error
      expect(errorRes.error.message).toBe("Something went wrong");

      // … is present if error is undefined
      if (!errorRes.data) {
        expect(errorRes.error.message).toBe("Something went wrong");
      }

      // … means data is undefined
      if (errorRes.error) {
        // @ts-expect-error
        expect(() => errorRes.data[0]).toThrow();
      }
    });

    it("requires path params", async () => {
      const client = createClient<paths>({ baseUrl: "https://myapi.com/v1" });
      mockFetch({ status: 200, body: JSON.stringify({ message: "OK" }) });

      // expect error on missing 'params'
      // @ts-expect-error
      await client.get("/blogposts/{post_id}", {});

      // expect error on empty params
      // @ts-expect-error
      await client.get("/blogposts/{post_id}", { params: {} });

      // expect error on empty params.path
      // @ts-expect-error
      await client.get("/blogposts/{post_id}", { params: { path: {} } });

      // expect error on mismatched type (number v string)
      // @ts-expect-error
      await client.get("/blogposts/{post_id}", { params: { path: { post_id: 1234 } }, query: {} });

      // (no error)
      await client.get("/blogposts/{post_id}", { params: { path: { post_id: "1234" }, query: {} } });
    });

    it("requires necessary requestBodies", async () => {
      const client = createClient<paths>({ baseUrl: "https://myapi.com/v1" });
      mockFetch({ status: 200, body: JSON.stringify({ message: "OK" }) });

      // expect error on missing `body`
      // @ts-expect-error
      await client.get("/blogposts", {});

      // expect error on missing fields
      // @ts-expect-error
      await client.put("/blogposts", { body: { title: "Foo" } });

      // expect present body to be good enough (all fields optional)
      // (no error)
      await client.put("/blogposts", {
        body: { title: "Foo", body: "Bar", publish_date: new Date("2023-04-01T12:00:00Z").getTime() },
      });
    });

    it("allows optional requestBody", async () => {
      const mockData = { status: "success" };
      const client = createClient<paths>();
      mockFetch({ status: 201, body: JSON.stringify(mockData) });

      // assert omitting `body` doesn’t raise a TS error (testing the response isn’t necessary)
      await client.put("/tag/{name}", {
        params: { path: { name: "New Tag" } },
      });

      // assert providing `body` with correct schema doesn’t raise a TS error
      await client.put("/tag/{name}", {
        params: { path: { name: "New Tag" } },
        body: { description: "This is a new tag" },
      });

      // assert providing `body` with bad schema WILL raise a TS error
      await client.put("/tag/{name}", {
        params: { path: { name: "New Tag" } },
        // @ts-expect-error
        body: { foo: "Bar" },
      });
    });

    it("request body type when optional", async () => {
      mockFetch({ status: 201, body: "{}" });
      const client = createClient<paths>();

      // expect error on wrong body type
      // @ts-expect-error
      await client.put("/blogposts-optional", { body: { error: true } });

      // (no error)
      await client.put("/blogposts-optional", {
        body: {
          title: "",
          publish_date: 3,
          body: "",
        },
      });
    });

    it("request body type when optional inline", async () => {
      mockFetch({ status: 201, body: "{}" });
      const client = createClient<paths>();

      // expect error on wrong body type
      // @ts-expect-error
      await client.put("/blogposts-optional-inline", { body: { error: true } });

      // (no error)
      await client.put("/blogposts-optional-inline", {
        body: {
          title: "",
          publish_date: 3,
          body: "",
        },
      });
    });
  });

  describe("options", () => {
    it("respects baseUrl", async () => {
      let client = createClient<paths>({ baseUrl: "https://myapi.com/v1" });
      mockFetch({ status: 200, body: JSON.stringify({ message: "OK" }) });
      await client.get("/self", {});

      // assert baseUrl and path mesh as expected
      expect(fetchMocker.mock.calls[0][0]).toBe("https://myapi.com/v1/self");

      client = createClient<paths>({ baseUrl: "https://myapi.com/v1/" });
      await client.get("/self", {});
      // assert trailing '/' was removed
      expect(fetchMocker.mock.calls[1][0]).toBe("https://myapi.com/v1/self");
    });

    it("preserves default headers", async () => {
      const headers: HeadersInit = { Authorization: "Bearer secrettoken" };

      const client = createClient<paths>({ headers });
      mockFetchOnce({ status: 200, body: JSON.stringify({ email: "user@user.com" }) });
      await client.get("/self", {});

      // assert default headers were passed
      const options = fetchMocker.mock.calls[0][1];
      expect(options?.headers).toEqual(
        new Headers({
          ...headers, // assert new header got passed
          "Content-Type": "application/json", //  probably doesn’t need to get tested, but this was simpler than writing lots of code to ignore these
        })
      );
    });

    it("allows override headers", async () => {
      const client = createClient<paths>({ headers: { "Cache-Control": "max-age=10000000" } });
      mockFetchOnce({ status: 200, body: JSON.stringify({ email: "user@user.com" }) });
      await client.get("/self", { params: {}, headers: { "Cache-Control": "no-cache" } });

      // assert default headers were passed
      const options = fetchMocker.mock.calls[0][1];
      expect(options?.headers).toEqual(
        new Headers({
          "Cache-Control": "no-cache",
          "Content-Type": "application/json",
        })
      );
    });

    it("accepts a custom fetch function", async () => {
      const data = { works: true };
      const customFetch = {
        clone: () => ({ ...customFetch }),
        headers: new Headers(),
        json: async () => data,
        status: 200,
        ok: true,
      };
      const client = createClient<paths>({
        fetch: async () => Promise.resolve(customFetch as Response),
      });
      expect((await client.get("/self", {})).data).toBe(data);
    });
  });

  describe("requests", () => {
    it("escapes URLs properly", async () => {
      const client = createClient<paths>();
      mockFetchOnce({ status: 200, body: "{}" });
      await client.get("/blogposts/{post_id}", {
        params: {
          path: {
            post_id: "post?id = 🥴",
          },
        },
      });

      // expect post_id to be encoded properly
      expect(fetchMocker.mock.calls[0][0]).toBe("/blogposts/post%3Fid%20%3D%20%F0%9F%A5%B4");
    });

    it("multipart/form-data", async () => {
      const client = createClient<paths>();
      mockFetchOnce({ status: 200, body: "{}" });
      const { data } = await client.put("/contact", {
        body: {
          name: "John Doe",
          email: "test@email.email",
          subject: "Test Message",
          message: "This is a test message",
        },
        bodySerializer(body) {
          const fd = new FormData();
          for (const [k, v] of Object.entries(body)) {
            fd.append(k, v);
          }
          return fd;
        },
      });

      // expect post_id to be encoded properly
      const req = fetchMocker.mock.calls[0][1];
      expect(req.body).toBeInstanceOf(FormData);

      // TODO: `vitest-fetch-mock` does not add the boundary to the Content-Type header like browsers do, so we expect the header to be null instead
      expect((req.headers as Headers).get("Content-Type")).toBeNull();
    });
  });

  describe("responses", () => {
    it("returns empty object on 204", async () => {
      const client = createClient<paths>();
      mockFetchOnce({ status: 204, body: "" });
      const { data, error, response } = await client.put("/tag/{name}", {
        params: { path: { name: "New Tag" } },
        body: { description: "This is a new tag" },
      });

      // assert correct data was returned
      expect(data).toEqual({});
      expect(response.status).toBe(204);

      // assert error is empty
      expect(error).toBe(undefined);
    });

    it("treats `default` as an error", async () => {
      const client = createClient<paths>({ headers: { "Cache-Control": "max-age=10000000" } });
      mockFetchOnce({ status: 500, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: 500, message: "An unexpected error occurred" }) });
      const { error } = await client.get("/default-as-error", {});

      // discard `data` object
      if (!error) throw new Error("treats `default` as an error: error response should be present");

      // assert `error.message` doesn’t throw TS error
      expect(error.message).toBe("An unexpected error occurred");
    });

    describe("parseAs", () => {
      it("text", async () => {
        const client = createClient<paths>();
        mockFetchOnce({ status: 200, body: "{}" });
        const { data } = await client.get("/anyMethod", { parseAs: "text" });
        expect(data).toBe("{}");
      });

      it("arrayBuffer", async () => {
        const client = createClient<paths>();
        mockFetchOnce({ status: 200, body: "{}" });
        const { data } = await client.get("/anyMethod", { parseAs: "arrayBuffer" });
        expect(data instanceof ArrayBuffer).toBe(true);
      });

      it("blob", async () => {
        const client = createClient<paths>();
        mockFetchOnce({ status: 200, body: "{}" });
        const { data } = await client.get("/anyMethod", { parseAs: "blob" });
        expect((data as any).constructor.name).toBe("Blob");
      });

      it("stream", async () => {
        const client = createClient<paths>();
        mockFetchOnce({ status: 200, body: "{}" });
        const { data } = await client.get("/anyMethod", { parseAs: "stream" });
        expect(data instanceof Buffer).toBe(true);
      });
    });

    describe("querySerializer", () => {
      it("default", async () => {
        const client = createClient<paths>();
        mockFetchOnce({ status: 200, body: "{}" });
        await client.get("/blogposts/{post_id}", {
          params: {
            path: { post_id: "my-post" },
            query: { version: 2, format: "json" },
          },
        });

        expect(fetchMocker.mock.calls[0][0]).toBe("/blogposts/my-post?version=2&format=json");
      });

      it("default (array params)", async () => {
        const client = createClient<paths>();
        mockFetchOnce({ status: 200, body: "{}" });
        await client.get("/blogposts", {
          params: {
            query: { tags: ["one", "two", "three"] },
          },
        });

        expect(fetchMocker.mock.calls[0][0]).toBe("/blogposts?tags=one%2Ctwo%2Cthree");
      });

      it("default (with empty params)", async () => {
        const client = createClient<paths>();
        mockFetchOnce({ status: 200, body: "{}" });
        await client.get("/blogposts/{post_id}", {
          params: {
            path: { post_id: "my-post" },
            query: { version: undefined, format: null as any },
          },
        });

        expect(fetchMocker.mock.calls[0][0]).toBe("/blogposts/my-post");
      });

      it("custom", async () => {
        const client = createClient<paths>();
        mockFetchOnce({ status: 200, body: "{}" });
        await client.get("/blogposts/{post_id}", {
          params: {
            path: { post_id: "my-post" },
            query: { version: 2, format: "json" },
          },
          querySerializer: (q) => `alpha=${q.version}&beta=${q.format}`,
        });

        expect(fetchMocker.mock.calls[0][0]).toBe("/blogposts/my-post?alpha=2&beta=json");
      });

      it("applies global serializer", async () => {
        const client = createClient<paths>({
          querySerializer: (q) => `alpha=${q.version}&beta=${q.format}`,
        });
        mockFetchOnce({ status: 200, body: "{}" });
        await client.get("/blogposts/{post_id}", {
          params: {
            path: { post_id: "my-post" },
            query: { version: 2, format: "json" },
          },
        });

        expect(fetchMocker.mock.calls[0][0]).toBe("/blogposts/my-post?alpha=2&beta=json");
      });

      it("overrides global serializer if provided", async () => {
        const client = createClient<paths>({
          querySerializer: () => "query",
        });
        mockFetchOnce({ status: 200, body: "{}" });
        await client.get("/blogposts/{post_id}", {
          params: {
            path: { post_id: "my-post" },
            query: { version: 2, format: "json" },
          },
          querySerializer: (q) => `alpha=${q.version}&beta=${q.format}`,
        });

        expect(fetchMocker.mock.calls[0][0]).toBe("/blogposts/my-post?alpha=2&beta=json");
      });
    });
  });

  describe("get()", () => {
    it("sends the correct method", async () => {
      const client = createClient<paths>();
      mockFetchOnce({ status: 200, body: "{}" });
      await client.get("/anyMethod", {});
      expect(fetchMocker.mock.calls[0][1]?.method).toBe("GET");
    });

    it("sends correct options, returns success", async () => {
      const mockData = { title: "My Post", body: "<p>This is a very good post</p>", publish_date: new Date("2023-03-01T12:00:00Z").getTime() };
      const client = createClient<paths>();
      mockFetchOnce({ status: 200, body: JSON.stringify(mockData) });
      const { data, error, response } = await client.get("/blogposts/{post_id}", {
        params: { path: { post_id: "my-post" }, query: {} },
      });

      // assert correct URL was called
      expect(fetchMocker.mock.calls[0][0]).toBe("/blogposts/my-post");

      // assert correct data was returned
      expect(data).toEqual(mockData);
      expect(response.status).toBe(200);

      // assert error is empty
      expect(error).toBe(undefined);
    });

    it("sends correct options, returns error", async () => {
      const mockError = { code: 404, message: "Post not found" };
      const client = createClient<paths>();
      mockFetchOnce({ status: 404, body: JSON.stringify(mockError) });
      const { data, error, response } = await client.get("/blogposts/{post_id}", {
        params: {
          path: { post_id: "my-post" },
          query: {},
        },
      });

      // assert correct URL was called
      expect(fetchMocker.mock.calls[0][0]).toBe("/blogposts/my-post");

      // assert correct method was called
      expect(fetchMocker.mock.calls[0][1]?.method).toBe("GET");

      // assert correct error was returned
      expect(error).toEqual(mockError);
      expect(response.status).toBe(404);

      // assert data is empty
      expect(data).toBe(undefined);
    });

    // note: this was a previous bug in the type inference
    it("handles array-type responses", async () => {
      const client = createClient<paths>();
      mockFetchOnce({ status: 200, body: "[]" });
      const { data } = await client.get("/blogposts", { params: {} });
      if (!data) throw new Error("data empty");

      // assert array type (and only array type) was inferred
      expect(data.length).toBe(0);
    });
  });

  describe("post()", () => {
    it("sends the correct method", async () => {
      const client = createClient<paths>();
      mockFetchOnce({ status: 200, body: "{}" });
      await client.post("/anyMethod", {});
      expect(fetchMocker.mock.calls[0][1]?.method).toBe("POST");
    });

    it("sends correct options, returns success", async () => {
      const mockData = { status: "success" };
      const client = createClient<paths>();
      mockFetchOnce({ status: 201, body: JSON.stringify(mockData) });
      const { data, error, response } = await client.put("/blogposts", {
        body: {
          title: "New Post",
          body: "<p>Best post yet</p>",
          publish_date: new Date("2023-03-31T12:00:00Z").getTime(),
        },
      });

      // assert correct URL was called
      expect(fetchMocker.mock.calls[0][0]).toBe("/blogposts");

      // assert correct data was returned
      expect(data).toEqual(mockData);
      expect(response.status).toBe(201);

      // assert error is empty
      expect(error).toBe(undefined);
    });

    it("supports sepecifying utf-8 encoding", async () => {
      const mockData = { message: "My reply" };
      const client = createClient<paths>();
      mockFetchOnce({ status: 201, body: JSON.stringify(mockData) });
      const { data, error, response } = await client.put("/comment", {
        params: {},
        body: {
          message: "My reply",
          replied_at: new Date("2023-03-31T12:00:00Z").getTime(),
        },
      });

      // assert correct data was returned
      expect(data).toEqual(mockData);
      expect(response.status).toBe(201);

      // assert error is empty
      expect(error).toBe(undefined);
    });
  });

  describe("delete()", () => {
    it("sends the correct method", async () => {
      const client = createClient<paths>();
      mockFetchOnce({ status: 200, body: "{}" });
      await client.del("/anyMethod", {});
      expect(fetchMocker.mock.calls[0][1]?.method).toBe("DELETE");
    });

    it("returns empty object on 204", async () => {
      const client = createClient<paths>();
      mockFetchOnce({ status: 204, body: "" });
      const { data, error } = await client.del("/blogposts/{post_id}", {
        params: {
          path: { post_id: "123" },
        },
      });

      // assert correct data was returned
      expect(data).toEqual({});

      // assert error is empty
      expect(error).toBe(undefined);
    });

    it("returns empty object on Content-Length: 0", async () => {
      const client = createClient<paths>();
      mockFetchOnce({ headers: { "Content-Length": "0" }, status: 200, body: "" });
      const { data, error } = await client.del("/blogposts/{post_id}", {
        params: {
          path: { post_id: "123" },
        },
      });

      // assert correct data was returned
      expect(data).toEqual({});

      // assert error is empty
      expect(error).toBe(undefined);
    });
  });

  describe("options()", () => {
    it("sends the correct method", async () => {
      const client = createClient<paths>();
      mockFetchOnce({ status: 200, body: "{}" });
      await client.options("/anyMethod", {});
      expect(fetchMocker.mock.calls[0][1]?.method).toBe("OPTIONS");
    });
  });

  describe("head()", () => {
    it("sends the correct method", async () => {
      const client = createClient<paths>();
      mockFetchOnce({ status: 200, body: "{}" });
      await client.head("/anyMethod", {});
      expect(fetchMocker.mock.calls[0][1]?.method).toBe("HEAD");
    });
  });

  describe("patch()", () => {
    it("sends the correct method", async () => {
      const client = createClient<paths>();
      mockFetchOnce({ status: 200, body: "{}" });
      await client.patch("/anyMethod", {});
      expect(fetchMocker.mock.calls[0][1]?.method).toBe("PATCH");
    });
  });

  describe("trace()", () => {
    it("sends the correct method", async () => {
      const client = createClient<paths>();
      mockFetchOnce({ status: 200, body: "{}" });
      await client.trace("/anyMethod", {});
      expect(fetchMocker.mock.calls[0][1]?.method).toBe("TRACE");
    });
  });
});

// test that the library behaves as expected inside commonly-used patterns
describe("examples", () => {
  it("nanostores", async () => {
    const token = atom<string | undefined>();
    const client = computed([token], (currentToken) => createClient<paths>({ headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : {} }));

    // assert initial call is unauthenticated
    mockFetchOnce({ status: 200, body: "{}" });
    await client.get().get("/blogposts/{post_id}", { params: { path: { post_id: "1234" }, query: {} } });
    expect(fetchMocker.mock.calls[0][1].headers.get("authorization")).toBeNull();

    // assert after setting token, client is authenticated
    const tokenVal = "abcd";
    mockFetchOnce({ status: 200, body: "{}" });
    await new Promise<void>((resolve) =>
      setTimeout(() => {
        token.set(tokenVal); // simulate promise-like token setting
        resolve();
      }, 0)
    );
    await client.get().get("/blogposts/{post_id}", { params: { path: { post_id: "1234" }, query: {} } });
    expect(fetchMocker.mock.calls[1][1].headers.get("authorization")).toBe(`Bearer ${tokenVal}`);
  });

  it("proxies", async () => {
    let token: string | undefined = undefined;

    const baseClient = createClient<paths>();
    const client = new Proxy(baseClient, {
      get(_, key: keyof typeof baseClient) {
        const newClient = createClient<paths>({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
        return newClient[key];
      },
    });

    // assert initial call is unauthenticated
    mockFetchOnce({ status: 200, body: "{}" });
    await client.get("/blogposts/{post_id}", { params: { path: { post_id: "1234" }, query: {} } });
    expect(fetchMocker.mock.calls[0][1].headers.get("authorization")).toBeNull();

    // assert after setting token, client is authenticated
    const tokenVal = "abcd";
    mockFetchOnce({ status: 200, body: "{}" });
    await new Promise<void>((resolve) =>
      setTimeout(() => {
        token = tokenVal; // simulate promise-like token setting
        resolve();
      }, 0)
    );
    await client.get("/blogposts/{post_id}", { params: { path: { post_id: "1234" }, query: {} } });
    expect(fetchMocker.mock.calls[1][1].headers.get("authorization")).toBe(`Bearer ${tokenVal}`);
  });
});
