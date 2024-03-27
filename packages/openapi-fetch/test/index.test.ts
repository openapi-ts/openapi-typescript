// @ts-expect-error
import createFetchMock from "vitest-fetch-mock";
import createClient, {
  type Middleware,
  type MiddlewareRequest,
  type QuerySerializerOptions,
} from "../src/index.js";
import type { paths } from "./fixtures/api.js";

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

    expect(client).toHaveProperty("GET");
    expect(client).toHaveProperty("PUT");
    expect(client).toHaveProperty("POST");
    expect(client).toHaveProperty("DELETE");
    expect(client).toHaveProperty("OPTIONS");
    expect(client).toHaveProperty("HEAD");
    expect(client).toHaveProperty("PATCH");
    expect(client).toHaveProperty("TRACE");
  });

  describe("TypeScript checks", () => {
    it("marks data or error as undefined, but never both", async () => {
      const client = createClient<paths>();

      // data
      mockFetchOnce({
        status: 200,
        body: JSON.stringify(["one", "two", "three"]),
      });
      const dataRes = await client.GET("/string-array");

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
      mockFetchOnce({
        status: 500,
        body: JSON.stringify({ code: 500, message: "Something went wrong" }),
      });
      const errorRes = await client.GET("/string-array");

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

    describe("params", () => {
      describe("path", () => {
        it("typechecks", async () => {
          const client = createClient<paths>({
            baseUrl: "https://myapi.com/v1",
          });
          mockFetch({ status: 200, body: JSON.stringify({ message: "OK" }) });

          // expect error on missing 'params'
          // @ts-expect-error
          await client.GET("/blogposts/{post_id}");

          // expect error on empty params
          // @ts-expect-error
          await client.GET("/blogposts/{post_id}", { params: {} });

          // expect error on empty params.path
          // @ts-expect-error
          await client.GET("/blogposts/{post_id}", { params: { path: {} } });

          // expect error on mismatched type (number v string)
          await client.GET("/blogposts/{post_id}", {
            // @ts-expect-error
            params: { path: { post_id: 1234 } },
          });

          // (no error)
          await client.GET("/blogposts/{post_id}", {
            params: { path: { post_id: "1234" } },
          });

          // expect param passed correctly
          const lastCall =
            fetchMocker.mock.calls[fetchMocker.mock.calls.length - 1];
          expect(lastCall[0].url).toBe("https://myapi.com/v1/blogposts/1234");
        });

        it("serializes", async () => {
          const client = createClient<paths>();
          mockFetch({
            status: 200,
            body: JSON.stringify({ status: "success" }),
          });
          await client.GET(
            "/path-params/{simple_primitive}/{simple_obj_flat}/{simple_arr_flat}/{simple_obj_explode*}/{simple_arr_explode*}/{.label_primitive}/{.label_obj_flat}/{.label_arr_flat}/{.label_obj_explode*}/{.label_arr_explode*}/{;matrix_primitive}/{;matrix_obj_flat}/{;matrix_arr_flat}/{;matrix_obj_explode*}/{;matrix_arr_explode*}",
            {
              params: {
                path: {
                  simple_primitive: "simple",
                  simple_obj_flat: { a: "b", c: "d" },
                  simple_arr_flat: [1, 2, 3],
                  simple_obj_explode: { e: "f", g: "h" },
                  simple_arr_explode: [4, 5, 6],
                  label_primitive: "label",
                  label_obj_flat: { a: "b", c: "d" },
                  label_arr_flat: [1, 2, 3],
                  label_obj_explode: { e: "f", g: "h" },
                  label_arr_explode: [4, 5, 6],
                  matrix_primitive: "matrix",
                  matrix_obj_flat: { a: "b", c: "d" },
                  matrix_arr_flat: [1, 2, 3],
                  matrix_obj_explode: { e: "f", g: "h" },
                  matrix_arr_explode: [4, 5, 6],
                },
              },
            },
          );

          const reqURL = fetchMocker.mock.calls[0][0].url;
          expect(reqURL).toBe(
            `/path-params/${[
              // simple
              "simple",
              "a,b,c,d",
              "1,2,3",
              "e=f,g=h",
              "4,5,6",
              // label
              ".label",
              ".a,b,c,d",
              ".1,2,3",
              ".e=f.g=h",
              ".4.5.6",
              // matrix
              ";matrix_primitive=matrix",
              ";matrix_obj_flat=a,b,c,d",
              ";matrix_arr_flat=1,2,3",
              ";e=f;g=h",
              ";matrix_arr_explode=4;matrix_arr_explode=5;matrix_arr_explode=6",
            ].join("/")}`,
          );
        });

        it("allows UTF-8 characters", async () => {
          const client = createClient<paths>();
          mockFetchOnce({ status: 200, body: "{}" });
          await client.GET("/blogposts/{post_id}", {
            params: { path: { post_id: "post?id = 🥴" } },
          });

          // expect post_id to be encoded properly
          expect(fetchMocker.mock.calls[0][0].url).toBe(
            `/blogposts/post?id%20=%20🥴`,
          );
        });
      });

      it("header", async () => {
        const client = createClient<paths>({ baseUrl: "https://myapi.com/v1" });
        mockFetch({ status: 200, body: JSON.stringify({ status: "success" }) });

        // expet error on missing header
        // @ts-expect-error
        await client.GET("/header-params");

        // expect error on incorrect header
        await client.GET("/header-params", {
          // @ts-expect-error
          params: { header: { foo: "bar" } },
        });

        // expect error on mismatched type
        await client.GET("/header-params", {
          // @ts-expect-error
          params: { header: { "x-required-header": true } },
        });

        // (no error)
        await client.GET("/header-params", {
          params: { header: { "x-required-header": "correct" } },
        });

        // expect param passed correctly
        const lastCall =
          fetchMocker.mock.calls[fetchMocker.mock.calls.length - 1][0];
        expect(lastCall.headers.get("x-required-header")).toBe("correct");
      });

      describe("query", () => {
        describe("querySerializer", () => {
          it("primitives", async () => {
            const client = createClient<paths>();
            mockFetchOnce({ status: 200, body: "{}" });
            await client.GET("/query-params", {
              params: {
                query: { string: "string", number: 0, boolean: false },
              },
            });

            expect(fetchMocker.mock.calls[0][0].url).toBe(
              "/query-params?string=string&number=0&boolean=false",
            );
          });

          it("array params (empty)", async () => {
            const client = createClient<paths>();
            mockFetchOnce({ status: 200, body: "{}" });
            await client.GET("/query-params", {
              params: {
                query: { array: [] },
              },
            });

            expect(fetchMocker.mock.calls[0][0].url).toBe("/query-params");
          });

          it("empty/null params", async () => {
            const client = createClient<paths>();
            mockFetchOnce({ status: 200, body: "{}" });
            await client.GET("/query-params", {
              params: {
                query: { string: undefined, number: null as any },
              },
            });

            expect(fetchMocker.mock.calls[0][0].url).toBe("/query-params");
          });

          describe("array", () => {
            it.each([
              [
                "form",
                {
                  given: { style: "form", explode: false },
                  want: "array=1,2,3&boolean=true",
                },
              ],
              [
                "form (explode)",
                {
                  given: { style: "form", explode: true },
                  want: "array=1&array=2&array=3&boolean=true",
                },
              ],
              [
                "spaceDelimited",
                {
                  given: { style: "spaceDelimited", explode: false },
                  want: "array=1%202%203&boolean=true",
                },
              ],
              [
                "spaceDelimited (explode)",
                {
                  given: { style: "spaceDelimited", explode: true },
                  want: "array=1&array=2&array=3&boolean=true",
                },
              ],
              [
                "pipeDelimited",
                {
                  given: { style: "pipeDelimited", explode: false },
                  want: "array=1|2|3&boolean=true",
                },
              ],
              [
                "pipeDelimited (explode)",
                {
                  given: { style: "pipeDelimited", explode: true },
                  want: "array=1&array=2&array=3&boolean=true",
                },
              ],
            ] as [
              string,
              {
                given: NonNullable<QuerySerializerOptions["array"]>;
                want: string;
              },
            ][])("%s", async (_, { given, want }) => {
              const client = createClient<paths>({
                querySerializer: { array: given },
              });
              mockFetch({ status: 200, body: "{}" });
              await client.GET("/query-params", {
                params: {
                  query: { array: ["1", "2", "3"], boolean: true },
                },
              });

              expect(fetchMocker.mock.calls[0][0].url.split("?")[1]).toBe(want);
            });
          });

          describe("object", () => {
            it.each([
              [
                "form",
                {
                  given: { style: "form", explode: false },
                  want: "object=foo,bar,bar,baz&boolean=true",
                },
              ],
              [
                "form (explode)",
                {
                  given: { style: "form", explode: true },
                  want: "foo=bar&bar=baz&boolean=true",
                },
              ],
              [
                "deepObject",
                {
                  given: { style: "deepObject", explode: false }, // note: `false` not supported; same as `true`
                  want: "object[foo]=bar&object[bar]=baz&boolean=true",
                },
              ],
              [
                "deepObject (explode)",
                {
                  given: { style: "deepObject", explode: true },
                  want: "object[foo]=bar&object[bar]=baz&boolean=true",
                },
              ],
            ] as [
              string,
              {
                given: NonNullable<QuerySerializerOptions["object"]>;
                want: string;
              },
            ][])("%s", async (_, { given, want }) => {
              const client = createClient<paths>({
                querySerializer: { object: given },
              });
              mockFetch({ status: 200, body: "{}" });
              await client.GET("/query-params", {
                params: {
                  query: { object: { foo: "bar", bar: "baz" }, boolean: true },
                },
              });

              expect(fetchMocker.mock.calls[0][0].url.split("?")[1]).toBe(want);
            });
          });

          it("allowReserved", async () => {
            const client = createClient<paths>({
              querySerializer: { allowReserved: true },
            });
            mockFetch({ status: 200, body: "{}" });
            await client.GET("/query-params", {
              params: {
                query: {
                  string: "bad/character🐶",
                },
              },
            });
            expect(fetchMocker.mock.calls[0][0].url.split("?")[1]).toBe(
              "string=bad/character🐶",
            );

            await client.GET("/query-params", {
              params: {
                query: {
                  string: "bad/character🐶",
                },
              },
              querySerializer: {
                allowReserved: false,
              },
            });
            expect(fetchMocker.mock.calls[1][0].url.split("?")[1]).toBe(
              "string=bad%2Fcharacter%F0%9F%90%B6",
            );
          });

          describe("function", () => {
            it("global default", async () => {
              const client = createClient<paths>({
                querySerializer: (q) => `alpha=${q.version}&beta=${q.format}`,
              });
              mockFetchOnce({ status: 200, body: "{}" });
              await client.GET("/blogposts/{post_id}", {
                params: {
                  path: { post_id: "my-post" },
                  query: { version: 2, format: "json" },
                },
              });

              expect(fetchMocker.mock.calls[0][0].url).toBe(
                "/blogposts/my-post?alpha=2&beta=json",
              );
            });

            it("per-request", async () => {
              const client = createClient<paths>({
                querySerializer: () => "query",
              });
              mockFetchOnce({ status: 200, body: "{}" });
              await client.GET("/blogposts/{post_id}", {
                params: {
                  path: { post_id: "my-post" },
                  query: { version: 2, format: "json" },
                },
                querySerializer: (q) => `alpha=${q.version}&beta=${q.format}`,
              });

              expect(fetchMocker.mock.calls[0][0].url).toBe(
                "/blogposts/my-post?alpha=2&beta=json",
              );
            });
          });

          it("ignores leading ? characters", async () => {
            const client = createClient<paths>({
              querySerializer: () => "?query",
            });
            mockFetchOnce({ status: 200, body: "{}" });
            await client.GET("/blogposts/{post_id}", {
              params: {
                path: { post_id: "my-post" },
                query: { version: 2, format: "json" },
              },
            });
            expect(fetchMocker.mock.calls[0][0].url).toBe(
              "/blogposts/my-post?query",
            );
          });
        });
      });
    });

    describe("body", () => {
      // these are pure type tests; no runtime assertions needed
      /* eslint-disable vitest/expect-expect */
      it("requires necessary requestBodies", async () => {
        const client = createClient<paths>({ baseUrl: "https://myapi.com/v1" });
        mockFetch({ status: 200, body: JSON.stringify({ message: "OK" }) });

        // expect error on missing `body`
        // @ts-expect-error
        await client.PUT("/blogposts");

        // expect error on missing fields
        // @ts-expect-error
        await client.PUT("/blogposts", { body: { title: "Foo" } });

        // expect present body to be good enough (all fields optional)
        // (no error)
        await client.PUT("/blogposts", {
          body: {
            title: "Foo",
            body: "Bar",
            publish_date: new Date("2023-04-01T12:00:00Z").getTime(),
          },
        });
      });

      it("requestBody (inline)", async () => {
        mockFetch({ status: 201, body: "{}" });
        const client = createClient<paths>();

        // expect error on wrong body type
        await client.PUT("/blogposts-optional-inline", {
          // @ts-expect-error
          body: { error: true },
        });

        // (no error)
        await client.PUT("/blogposts-optional-inline", {
          body: {
            title: "",
            publish_date: 3,
            body: "",
          },
        });
      });

      it("requestBody with required: false", async () => {
        mockFetch({ status: 201, body: "{}" });
        const client = createClient<paths>();

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
    /* eslint-enable vitest/expect-expect */
  });

  describe("options", () => {
    it("baseUrl", async () => {
      let client = createClient<paths>({ baseUrl: "https://myapi.com/v1" });
      mockFetch({ status: 200, body: JSON.stringify({ message: "OK" }) });
      await client.GET("/self");

      // assert baseUrl and path mesh as expected
      expect(fetchMocker.mock.calls[0][0].url).toBe(
        "https://myapi.com/v1/self",
      );

      client = createClient<paths>({ baseUrl: "https://myapi.com/v1/" });
      await client.GET("/self");
      // assert trailing '/' was removed
      expect(fetchMocker.mock.calls[1][0].url).toBe(
        "https://myapi.com/v1/self",
      );
    });

    describe("headers", () => {
      it("persist", async () => {
        const headers: HeadersInit = { Authorization: "Bearer secrettoken" };

        const client = createClient<paths>({ headers });
        mockFetchOnce({
          status: 200,
          body: JSON.stringify({ email: "user@user.com" }),
        });
        await client.GET("/self");

        // assert default headers were passed
        expect(fetchMocker.mock.calls[0][0].headers).toEqual(
          new Headers({
            ...headers, // assert new header got passed
            "Content-Type": "application/json", //  probably doesn’t need to get tested, but this was simpler than writing lots of code to ignore these
          }),
        );
      });

      it("can be overridden", async () => {
        const client = createClient<paths>({
          headers: { "Cache-Control": "max-age=10000000" },
        });
        mockFetchOnce({
          status: 200,
          body: JSON.stringify({ email: "user@user.com" }),
        });
        await client.GET("/self", {
          params: {},
          headers: { "Cache-Control": "no-cache" },
        });

        // assert default headers were passed
        expect(fetchMocker.mock.calls[0][0].headers).toEqual(
          new Headers({
            "Cache-Control": "no-cache",
            "Content-Type": "application/json",
          }),
        );
      });

      it("can be unset", async () => {
        const client = createClient<paths>({
          headers: { "Content-Type": null },
        });
        mockFetchOnce({
          status: 200,
          body: JSON.stringify({ email: "user@user.com" }),
        });
        await client.GET("/self", { params: {} });

        // assert default headers were passed
        expect(fetchMocker.mock.calls[0][0].headers).toEqual(new Headers());
      });

      it("supports arrays", async () => {
        const client = createClient<paths>();

        const list = ["one", "two", "three"];

        mockFetchOnce({ status: 200, body: "{}" });
        await client.GET("/self", { headers: { list } });

        expect(fetchMocker.mock.calls[0][0].headers.get("list")).toEqual(
          list.join(", "),
        );
      });
    });

    describe("fetch", () => {
      it("createClient", async () => {
        function createCustomFetch(data: any) {
          const response = {
            clone: () => ({ ...response }),
            headers: new Headers(),
            json: async () => data,
            status: 200,
            ok: true,
          } as Response;
          return async () => Promise.resolve(response);
        }

        const customFetch = createCustomFetch({ works: true });
        mockFetchOnce({ status: 200, body: "{}" });

        const client = createClient<paths>({ fetch: customFetch });
        const { data } = await client.GET("/self");

        // assert data was returned from custom fetcher
        expect(data).toEqual({ works: true });

        // assert global fetch was never called
        expect(fetchMocker).not.toHaveBeenCalled();
      });

      it("per-request", async () => {
        function createCustomFetch(data: any) {
          const response = {
            clone: () => ({ ...response }),
            headers: new Headers(),
            json: async () => data,
            status: 200,
            ok: true,
          } as Response;
          return async () => Promise.resolve(response);
        }

        const fallbackFetch = createCustomFetch({ fetcher: "fallback" });
        const overrideFetch = createCustomFetch({ fetcher: "override" });

        mockFetchOnce({ status: 200, body: "{}" });

        const client = createClient<paths>({ fetch: fallbackFetch });

        // assert override function was called
        const fetch1 = await client.GET("/self", { fetch: overrideFetch });
        expect(fetch1.data).toEqual({ fetcher: "override" });

        // assert fallback function still persisted (and wasn’t overridden)
        const fetch2 = await client.GET("/self");
        expect(fetch2.data).toEqual({ fetcher: "fallback" });

        // assert global fetch was never called
        expect(fetchMocker).not.toHaveBeenCalled();
      });
    });

    describe("middleware", () => {
      it("can modify request", async () => {
        mockFetchOnce({ status: 200, body: "{}" });

        const client = createClient<paths>();
        client.use({
          async onRequest(req) {
            return new Request("https://foo.bar/api/v1", {
              ...req,
              method: "OPTIONS",
              headers: { foo: "bar" },
            });
          },
        });
        await client.GET("/self");

        const req = fetchMocker.mock.calls[0][0];
        expect(req.url).toBe("https://foo.bar/api/v1");
        expect(req.method).toBe("OPTIONS");
        expect(req.headers.get("foo")).toBe("bar");
      });

      it("can modify response", async () => {
        const toUnix = (date: string) => new Date(date).getTime();

        const rawBody = {
          email: "user123@gmail.com",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-20T00:00:00Z",
        };
        mockFetchOnce({
          status: 200,
          body: JSON.stringify(rawBody),
          headers: { foo: "bar" },
        });

        const client = createClient<paths>();
        client.use({
          // convert date string to unix time
          async onResponse(res) {
            const body = await res.json();
            body.created_at = toUnix(body.created_at);
            body.updated_at = toUnix(body.updated_at);
            const headers = new Headers(res.headers);
            headers.set("middleware", "value");
            return new Response(JSON.stringify(body), {
              ...res,
              status: 205,
              headers,
            });
          },
        });

        const { data, response } = await client.GET("/self");

        // assert body was modified
        expect(data?.created_at).toBe(toUnix(rawBody.created_at));
        expect(data?.updated_at).toBe(toUnix(rawBody.updated_at));
        // assert rest of body was preserved
        expect(data?.email).toBe(rawBody.email);
        // assert status changed
        expect(response.status).toBe(205);
        // assert server headers were preserved
        expect(response.headers.get("foo")).toBe("bar");
        // assert middleware heaers were added
        expect(response.headers.get("middleware")).toBe("value");
      });

      it("executes in expected order", async () => {
        mockFetchOnce({ status: 200, body: "{}" });

        const client = createClient<paths>();
        // this middleware passes along the “step” header
        // for both requests and responses, but first checks if
        // it received the end result of the previous middleware step
        client.use(
          {
            async onRequest(req) {
              req.headers.set("step", "A");
              return req;
            },
            async onResponse(res) {
              if (res.headers.get("step") === "B") {
                return new Response(res.body, {
                  ...res,
                  headers: { ...res.headers, step: "A" },
                });
              }
            },
          },
          {
            async onRequest(req) {
              req.headers.set("step", "B");
              return req;
            },
            async onResponse(res) {
              if (res.headers.get("step") === "C") {
                return new Response(res.body, {
                  ...res,
                  headers: { ...res.headers, step: "B" },
                });
              }
            },
          },
          {
            onRequest(req) {
              req.headers.set("step", "C");
              return req;
            },
            onResponse(res) {
              res.headers.set("step", "C");
              return res;
            },
          },
        );

        const { response } = await client.GET("/self");

        // assert requests ended up on step C (array order)
        expect(fetchMocker.mock.calls[0][0].headers.get("step")).toBe("C");

        // assert responses ended up on step A (reverse order)
        expect(response.headers.get("step")).toBe("A");
      });

      it("receives correct options", async () => {
        mockFetchOnce({ status: 200, body: "{}" });

        let baseUrl = "";

        const client = createClient<paths>({
          baseUrl: "https://api.foo.bar/v1/",
        });
        client.use({
          onRequest(_, options) {
            baseUrl = options.baseUrl;
            return undefined;
          },
        });

        await client.GET("/self");
        expect(baseUrl).toBe("https://api.foo.bar/v1");
      });

      it("receives OpenAPI options passed in from parent", async () => {
        mockFetchOnce({ status: 200, body: "{}" });

        const pathname = "/tag/{name}";
        const tagData = {
          params: {
            path: {
              name: "New Tag",
            },
          },
          body: {
            description: "Tag Description",
          },
          query: {
            foo: "bar",
          },
        };

        let receivedPath = "";
        let receivedParams: MiddlewareRequest["params"] = {};

        const client = createClient<paths>({
          baseUrl: "https://api.foo.bar/v1/",
        });
        client.use({
          onRequest(req) {
            receivedPath = req!.schemaPath;
            receivedParams = req!.params;
            return undefined;
          },
        });
        await client.PUT(pathname, tagData);

        expect(receivedPath).toBe(pathname);
        expect(receivedParams).toEqual(tagData.params);
      });

      it("can be skipped without interrupting request", async () => {
        mockFetchOnce({ status: 200, body: JSON.stringify({ success: true }) });

        const client = createClient<paths>({
          baseUrl: "https://api.foo.bar/v1/",
        });
        client.use({
          onRequest() {
            return undefined;
          },
        });
        const { data } = await client.GET("/blogposts");

        expect(data).toEqual({ success: true });
      });

      it("can be ejected", async () => {
        mockFetchOnce({ status: 200, body: "{}" });

        let called = false;
        const errorMiddleware = {
          onRequest() {
            called = true;
            throw new Error("oops");
          },
        };

        const client = createClient<paths>({
          baseUrl: "https://api.foo.bar/v1",
        });
        client.use(errorMiddleware);
        client.eject(errorMiddleware);

        expect(() => client.GET("/blogposts")).not.toThrow();
        expect(called).toBe(false);
      });
    });
  });

  describe("requests", () => {
    it("multipart/form-data", async () => {
      const client = createClient<paths>();
      mockFetchOnce({ status: 200, body: JSON.stringify({ success: true }) });
      const reqBody = {
        name: "John Doe",
        email: "test@email.email",
        subject: "Test Message",
        message: "This is a test message",
      };
      await client.PUT("/contact", {
        body: reqBody,
        bodySerializer(body) {
          const fd = new FormData();
          for (const name in body) {
            fd.append(name, body[name as keyof typeof body]);
          }
          return fd;
        },
      });

      // expect post_id to be encoded properly
      const req = fetchMocker.mock.calls[0][0];
      // note: this is FormData, but Node.js doesn’t handle new Request() properly with formData bodies. So this is only in tests.
      expect(req.body).toBeInstanceOf(Buffer);
      expect((req.headers as Headers).get("Content-Type")).toBe(
        "text/plain;charset=UTF-8",
      );
    });

    // Node Requests eat credentials (no cookies), but this works in frontend
    // TODO: find a way to reliably test this without too much mocking
    it.skip("respects cookie", async () => {
      const client = createClient<paths>();
      mockFetchOnce({ status: 200, body: "{}" });
      await client.GET("/blogposts", { credentials: "include" });

      const req = fetchMocker.mock.calls[0][0];
      expect(req.credentials).toBe("include");
    });
  });

  describe("responses", () => {
    it("returns empty object on 204", async () => {
      const client = createClient<paths>();
      mockFetchOnce({ status: 204, body: "" });
      const { data, error, response } = await client.DELETE("/tag/{name}", {
        params: { path: { name: "New Tag" } },
      });

      // assert correct data was returned
      expect(data).toEqual({});
      expect(response.status).toBe(204);

      // assert error is empty
      expect(error).toBeUndefined();
    });

    it("treats `default` as an error", async () => {
      const client = createClient<paths>({
        headers: { "Cache-Control": "max-age=10000000" },
      });
      mockFetchOnce({
        status: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: 500,
          message: "An unexpected error occurred",
        }),
      });
      const { error } = await client.GET("/default-as-error");

      // discard `data` object
      if (!error) {
        throw new Error(
          "treats `default` as an error: error response should be present",
        );
      }

      // assert `error.message` doesn’t throw TS error
      expect(error.message).toBe("An unexpected error occurred");
    });

    describe("parseAs", () => {
      it("text", async () => {
        const client = createClient<paths>();
        mockFetchOnce({ status: 200, body: "{}" });
        const { data, error } = (await client.GET("/anyMethod", {
          parseAs: "text",
        })) satisfies { data?: string };
        if (error) {
          throw new Error(`parseAs text: error`);
        }
        expect(data.toLowerCase()).toBe("{}");
      });

      it("arrayBuffer", async () => {
        const client = createClient<paths>();
        mockFetchOnce({ status: 200, body: "{}" });
        const { data, error } = (await client.GET("/anyMethod", {
          parseAs: "arrayBuffer",
        })) satisfies { data?: ArrayBuffer };
        if (error) {
          throw new Error(`parseAs arrayBuffer: error`);
        }
        expect(data.byteLength).toBe(2);
      });

      it("blob", async () => {
        const client = createClient<paths>();
        mockFetchOnce({ status: 200, body: "{}" });
        const { data, error } = (await client.GET("/anyMethod", {
          parseAs: "blob",
        })) satisfies { data?: Blob };
        if (error) {
          throw new Error(`parseAs blob: error`);
        }

        expect(data.constructor.name).toBe("Blob");
      });

      it("stream", async () => {
        const client = createClient<paths>();
        mockFetchOnce({ status: 200, body: "{}" });
        const { data } = (await client.GET("/anyMethod", {
          parseAs: "stream",
        })) satisfies { data?: ReadableStream<Uint8Array> | null };
        if (!data) {
          throw new Error(`parseAs stream: error`);
        }

        expect(data instanceof Buffer).toBe(true);
        if (!(data instanceof Buffer)) {
          throw Error("Data should be an instance of Buffer in Node context");
        }

        expect(data.byteLength).toBe(2);
      });

      it("use the selected content", async () => {
        const client = createClient<paths>();
        mockFetchOnce({
          status: 200,
          headers: { "Content-Type": "application/ld+json" },
          body: JSON.stringify({
            "@id": "some-resource-identifier",
            email: "foo@bar.fr",
            name: null,
          }),
        });
        const query = client.GET("/multiple-response-content", {
          headers: {
            Accept: "application/ld+json",
          },
        });

        const { data } = await query;
        //      ^?

        data satisfies
          | {
              "@id": string;
              email: string;
              name?: string;
            }
          | undefined;

        if (!data) {
          throw new Error(`Missing response`);
        }

        expect(data).toEqual({
          "@id": "some-resource-identifier",
          email: "foo@bar.fr",
          name: null,
        });
      });
    });
  });

  describe("GET()", () => {
    it("sends the correct method", async () => {
      const client = createClient<paths>();
      mockFetchOnce({ status: 200, body: "{}" });
      await client.GET("/anyMethod");
      expect(fetchMocker.mock.calls[0][0].method).toBe("GET");
    });

    it("sends correct options, returns success", async () => {
      const mockData = {
        title: "My Post",
        body: "<p>This is a very good post</p>",
        publish_date: new Date("2023-03-01T12:00:00Z").getTime(),
      };
      const client = createClient<paths>();
      mockFetchOnce({ status: 200, body: JSON.stringify(mockData) });
      const { data, error, response } = await client.GET(
        "/blogposts/{post_id}",
        {
          params: { path: { post_id: "my-post" } },
        },
      );

      // assert correct URL was called
      expect(fetchMocker.mock.calls[0][0].url).toBe("/blogposts/my-post");

      // assert correct data was returned
      expect(data).toEqual(mockData);
      expect(response.status).toBe(200);

      // assert error is empty
      expect(error).toBeUndefined();
    });

    it("sends correct options, returns error", async () => {
      const mockError = { code: 404, message: "Post not found" };
      const client = createClient<paths>();
      mockFetchOnce({ status: 404, body: JSON.stringify(mockError) });
      const { data, error, response } = await client.GET(
        "/blogposts/{post_id}",
        {
          params: { path: { post_id: "my-post" } },
        },
      );

      // assert correct URL was called
      expect(fetchMocker.mock.calls[0][0].url).toBe("/blogposts/my-post");

      // assert correct method was called
      expect(fetchMocker.mock.calls[0][0].method).toBe("GET");

      // assert correct error was returned
      expect(error).toEqual(mockError);
      expect(response.status).toBe(404);

      // assert data is empty
      expect(data).toBeUndefined();
    });

    // note: this was a previous bug in the type inference
    it("handles array-type responses", async () => {
      const client = createClient<paths>();
      mockFetchOnce({ status: 200, body: "[]" });
      const { data } = await client.GET("/blogposts", { params: {} });
      if (!data) {
        throw new Error("data empty");
      }

      // assert array type (and only array type) was inferred
      expect(data.length).toBe(0);
    });

    it("handles literal 2XX and 4XX codes", async () => {
      const client = createClient<paths>();
      mockFetch({ status: 201, body: '{"status": "success"}' });
      const { data, error } = await client.PUT("/media", {
        body: { media: "base64", name: "myImage" },
      });

      if (data) {
        // assert 2XX type inferred correctly
        expect(data.status).toBe("success");
      } else {
        // assert 4XX type inferred correctly
        // (this should be a dead code path but tests TS types)
        expect(error.message).toBe("Error");
      }
    });

    it("gracefully handles invalid JSON for errors", async () => {
      const client = createClient<paths>();
      mockFetchOnce({ status: 401, body: "Unauthorized" });
      const { data, error } = await client.GET("/blogposts");

      expect(data).toBeUndefined();
      expect(error).toBe("Unauthorized");
    });
  });

  describe("POST()", () => {
    it("sends the correct method", async () => {
      const client = createClient<paths>();
      mockFetchOnce({ status: 200, body: "{}" });
      await client.POST("/anyMethod");
      expect(fetchMocker.mock.calls[0][0].method).toBe("POST");
    });

    it("sends correct options, returns success", async () => {
      const mockData = { status: "success" };
      const client = createClient<paths>();
      mockFetchOnce({ status: 201, body: JSON.stringify(mockData) });
      const { data, error, response } = await client.PUT("/blogposts", {
        body: {
          title: "New Post",
          body: "<p>Best post yet</p>",
          publish_date: new Date("2023-03-31T12:00:00Z").getTime(),
        },
      });

      // assert correct URL was called
      expect(fetchMocker.mock.calls[0][0].url).toBe("/blogposts");

      // assert correct data was returned
      expect(data).toEqual(mockData);
      expect(response.status).toBe(201);

      // assert error is empty
      expect(error).toBeUndefined();
    });

    it("supports sepecifying utf-8 encoding", async () => {
      const mockData = { message: "My reply" };
      const client = createClient<paths>();
      mockFetchOnce({ status: 201, body: JSON.stringify(mockData) });
      const { data, error, response } = await client.PUT("/comment", {
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
      expect(error).toBeUndefined();
    });
  });

  describe("DELETE()", () => {
    it("sends the correct method", async () => {
      const client = createClient<paths>();
      mockFetchOnce({ status: 200, body: "{}" });
      await client.DELETE("/anyMethod");
      expect(fetchMocker.mock.calls[0][0].method).toBe("DELETE");
    });

    it("returns empty object on 204", async () => {
      const client = createClient<paths>();
      mockFetchOnce({ status: 204, body: "" });
      const { data, error } = await client.DELETE("/blogposts/{post_id}", {
        params: {
          path: { post_id: "123" },
        },
      });

      // assert correct data was returned
      expect(data).toEqual({});

      // assert error is empty
      expect(error).toBeUndefined();
    });

    it("returns empty object on Content-Length: 0", async () => {
      const client = createClient<paths>();
      mockFetchOnce({
        headers: { "Content-Length": "0" },
        status: 200,
        body: "",
      });
      const { data, error } = await client.DELETE("/blogposts/{post_id}", {
        params: {
          path: { post_id: "123" },
        },
      });

      // assert correct data was returned
      expect(data).toEqual({});

      // assert error is empty
      expect(error).toBeUndefined();
    });
  });

  describe("OPTIONS()", () => {
    it("sends the correct method", async () => {
      const client = createClient<paths>();
      mockFetchOnce({ status: 200, body: "{}" });
      await client.OPTIONS("/anyMethod");
      expect(fetchMocker.mock.calls[0][0].method).toBe("OPTIONS");
    });
  });

  describe("HEAD()", () => {
    it("sends the correct method", async () => {
      const client = createClient<paths>();
      mockFetchOnce({ status: 200, body: "{}" });
      await client.HEAD("/anyMethod");
      expect(fetchMocker.mock.calls[0][0].method).toBe("HEAD");
    });
  });

  describe("PATCH()", () => {
    it("sends the correct method", async () => {
      const client = createClient<paths>();
      mockFetchOnce({ status: 200, body: "{}" });
      await client.PATCH("/anyMethod");
      expect(fetchMocker.mock.calls[0][0].method).toBe("PATCH");
    });
  });

  describe("TRACE()", () => {
    it("sends the correct method", async () => {
      const client = createClient<paths>();
      mockFetchOnce({ status: 200, body: "{}" });
      await client.TRACE("/anyMethod");
      expect(fetchMocker.mock.calls[0][0].method).toBe("TRACE");
    });
  });
});

// test that the library behaves as expected inside commonly-used patterns
describe("examples", () => {
  it("auth middleware", async () => {
    let accessToken: string | undefined = undefined;
    const authMiddleware: Middleware = {
      async onRequest(req) {
        if (accessToken) {
          req.headers.set("Authorization", `Bearer ${accessToken}`);
          return req;
        }
      },
    };

    const client = createClient<paths>();
    client.use(authMiddleware);

    // assert initial call is unauthenticated
    mockFetchOnce({ status: 200, body: "{}" });
    await client.GET("/blogposts/{post_id}", {
      params: { path: { post_id: "1234" } },
    });
    expect(
      fetchMocker.mock.calls[0][0].headers.get("authorization"),
    ).toBeNull();

    // assert after setting token, client is authenticated
    accessToken = "real_token";
    mockFetchOnce({ status: 200, body: "{}" });
    await client.GET("/blogposts/{post_id}", {
      params: { path: { post_id: "1234" } },
    });
    expect(fetchMocker.mock.calls[1][0].headers.get("authorization")).toBe(
      `Bearer ${accessToken}`,
    );
  });
});
