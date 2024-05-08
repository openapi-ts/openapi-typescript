import { HttpResponse, type StrictResponse } from "msw";
import createClient, { type Middleware, type MiddlewareRequest, type QuerySerializerOptions } from "../src/index.js";
import type { paths } from "./fixtures/api.js";
import { server, baseUrl, useMockRequestHandler, toAbsoluteURL } from "./fixtures/mock-server.js";

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
      const client = createClient<paths>({
        baseUrl,
      });

      // data
      useMockRequestHandler({
        baseUrl,
        method: "get",
        path: "/string-array",
        status: 200,
        body: ["one", "two", "three"],
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
      useMockRequestHandler({
        baseUrl,
        method: "get",
        path: "/string-array",
        status: 500,
        body: { code: 500, message: "Something went wrong" },
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
            baseUrl,
          });

          useMockRequestHandler({
            baseUrl,
            method: "get",
            path: "/blogposts/:post_id",
            status: 200,
            body: { message: "OK" },
          });

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

          // expect error on unknown property in 'params'
          await client.GET("/blogposts/{post_id}", {
            // @ts-expect-error
            TODO: "this should be an error",
          });

          // (no error)
          let calledPostId = "";
          useMockRequestHandler<{ post_id: string }>({
            baseUrl,
            method: "get",
            path: "/blogposts/:post_id",
            handler: ({ params }) => {
              calledPostId = params.post_id;
              return HttpResponse.json({ message: "OK" }, { status: 200 });
            },
          });

          await client.GET("/blogposts/{post_id}", {
            params: { path: { post_id: "1234" } },
          });

          // expect param passed correctly
          expect(calledPostId).toBe("1234");
        });

        it("serializes", async () => {
          const client = createClient<paths>({
            baseUrl,
          });

          const { getRequestUrl } = useMockRequestHandler({
            baseUrl,
            method: "get",
            path: "/path-params/*",
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

          expect(getRequestUrl().pathname).toBe(
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
          const client = createClient<paths>({ baseUrl });
          const { getRequestUrl } = useMockRequestHandler({
            baseUrl,
            method: "get",
            path: "/blogposts/*",
          });

          await client.GET("/blogposts/{post_id}", {
            params: { path: { post_id: "post?id = 🥴" } },
          });

          // expect post_id to be encoded properly
          const url = getRequestUrl();
          expect(url.searchParams.get("id ")).toBe(" 🥴");
          expect(url.pathname + url.search).toBe("/blogposts/post?id%20=%20%F0%9F%A5%B4");
        });
      });

      it("header", async () => {
        const client = createClient<paths>({ baseUrl });

        useMockRequestHandler({
          baseUrl,
          method: "get",
          path: "/header-params",
          handler: ({ request }) => {
            const header = request.headers.get("x-required-header");
            if (header !== "correct") {
              return HttpResponse.json(
                { code: 500, message: "missing correct header" },
                { status: 500 },
              ) as StrictResponse<any>;
            }
            return HttpResponse.json({ status: header }, { status: 200, headers: request.headers });
          },
        });

        // expect error on missing header
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
        const response = await client.GET("/header-params", {
          params: { header: { "x-required-header": "correct" } },
        });

        // expect param passed correctly
        expect(response.response.headers.get("x-required-header")).toBe("correct");
      });

      describe("query", () => {
        describe("querySerializer", () => {
          it("primitives", async () => {
            const client = createClient<paths>({ baseUrl });

            const { getRequestUrl } = useMockRequestHandler({
              baseUrl,
              method: "get",
              path: "/query-params*",
            });

            await client.GET("/query-params", {
              params: {
                query: { string: "string", number: 0, boolean: false },
              },
            });

            expect(getRequestUrl().search).toBe("?string=string&number=0&boolean=false");
          });

          it("array params (empty)", async () => {
            const client = createClient<paths>({ baseUrl });

            const { getRequestUrl } = useMockRequestHandler({
              baseUrl,
              method: "get",
              path: "/query-params*",
            });

            await client.GET("/query-params", {
              params: {
                query: { array: [] },
              },
            });

            const url = getRequestUrl();
            expect(url.pathname).toBe("/query-params");
            expect(url.search).toBe("");
          });

          it("empty/null params", async () => {
            const client = createClient<paths>({ baseUrl });

            const { getRequestUrl } = useMockRequestHandler({
              baseUrl,
              method: "get",
              path: "/query-params*",
            });

            await client.GET("/query-params", {
              params: {
                query: { string: undefined, number: null as any },
              },
            });

            const url = getRequestUrl();
            expect(url.pathname).toBe("/query-params");
            expect(url.search).toBe("");
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
                baseUrl,
                querySerializer: { array: given },
              });

              const { getRequestUrl } = useMockRequestHandler({
                baseUrl,
                method: "get",
                path: "/query-params*",
              });

              await client.GET("/query-params", {
                params: {
                  query: { array: ["1", "2", "3"], boolean: true },
                },
              });

              const url = getRequestUrl();
              // skip leading '?'
              expect(url.search.substring(1)).toBe(want);
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
                baseUrl,
                querySerializer: { object: given },
              });
              const { getRequestUrl } = useMockRequestHandler({
                baseUrl,
                method: "get",
                path: "/query-params*",
              });

              await client.GET("/query-params", {
                params: {
                  query: { object: { foo: "bar", bar: "baz" }, boolean: true },
                },
              });

              const url = getRequestUrl();
              // skip leading '?'
              expect(url.search.substring(1)).toBe(want);
            });
          });

          it("allowReserved", async () => {
            const client = createClient<paths>({
              baseUrl,
              querySerializer: { allowReserved: true },
            });
            const { getRequestUrl } = useMockRequestHandler({
              baseUrl,
              method: "get",
              path: "/query-params*",
            });
            await client.GET("/query-params", {
              params: {
                query: {
                  string: "bad/character🐶",
                },
              },
            });

            expect(getRequestUrl().search).toBe("?string=bad/character%F0%9F%90%B6");
            expect(getRequestUrl().searchParams.get("string")).toBe("bad/character🐶");

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

            expect(getRequestUrl().search).toBe("?string=bad%2Fcharacter%F0%9F%90%B6");
            expect(getRequestUrl().searchParams.get("string")).toBe("bad/character🐶");
          });

          describe("function", () => {
            it("global default", async () => {
              const client = createClient<paths>({
                baseUrl,
                querySerializer: (q) => `alpha=${q.version}&beta=${q.format}`,
              });

              const { getRequestUrl } = useMockRequestHandler({
                baseUrl,
                method: "get",
                path: "/blogposts/:post_id",
              });

              await client.GET("/blogposts/{post_id}", {
                params: {
                  path: { post_id: "my-post" },
                  query: { version: 2, format: "json" },
                },
              });

              const url = getRequestUrl();
              expect(url.pathname + url.search).toBe("/blogposts/my-post?alpha=2&beta=json");
            });

            it("per-request", async () => {
              const client = createClient<paths>({
                baseUrl,
                querySerializer: () => "query",
              });

              const { getRequestUrl } = useMockRequestHandler({
                baseUrl,
                method: "get",
                path: "/blogposts/:post_id",
              });

              await client.GET("/blogposts/{post_id}", {
                params: {
                  path: { post_id: "my-post" },
                  query: { version: 2, format: "json" },
                },
                querySerializer: (q) => `alpha=${q.version}&beta=${q.format}`,
              });

              const url = getRequestUrl();
              expect(url.pathname + url.search).toBe("/blogposts/my-post?alpha=2&beta=json");
            });
          });

          it("ignores leading ? characters", async () => {
            const client = createClient<paths>({
              baseUrl,
              querySerializer: () => "?query",
            });
            const { getRequestUrl } = useMockRequestHandler({
              baseUrl,
              method: "get",
              path: "/blogposts/:post_id",
            });
            await client.GET("/blogposts/{post_id}", {
              params: {
                path: { post_id: "my-post" },
                query: { version: 2, format: "json" },
              },
            });
            const url = getRequestUrl();
            expect(url.pathname + url.search).toBe("/blogposts/my-post?query");
          });
        });
      });
    });

    describe("body", () => {
      // these are pure type tests; no runtime assertions needed
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
        const client = createClient<paths>({ baseUrl });

        useMockRequestHandler({
          baseUrl,
          method: "put",
          path: "/blogposts-optional-inline",
          status: 201,
        });

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

  describe("options", () => {
    it("baseUrl", async () => {
      let client = createClient<paths>({ baseUrl });

      const { getRequestUrl } = useMockRequestHandler({
        baseUrl,
        method: "get",
        path: "/self",
        status: 200,
        body: { message: "OK" },
      });

      await client.GET("/self");

      // assert baseUrl and path mesh as expected
      expect(getRequestUrl().href).toBe(toAbsoluteURL("/self"));

      client = createClient<paths>({ baseUrl });
      await client.GET("/self");
      // assert trailing '/' was removed
      expect(getRequestUrl().href).toBe(toAbsoluteURL("/self"));
    });

    describe("headers", () => {
      it("persist", async () => {
        const headers: HeadersInit = { Authorization: "Bearer secrettoken" };

        const client = createClient<paths>({ headers, baseUrl });

        const { getRequest } = useMockRequestHandler({
          baseUrl,
          method: "get",
          path: "/self",
          status: 200,
          body: { email: "user@user.com" },
        });

        await client.GET("/self");

        // assert default headers were passed
        expect(getRequest().headers).toEqual(
          new Headers({
            ...headers, // assert new header got passed
            "Content-Type": "application/json", //  probably doesn’t need to get tested, but this was simpler than writing lots of code to ignore these
          }),
        );
      });

      it("can be overridden", async () => {
        const client = createClient<paths>({
          baseUrl,
          headers: { "Cache-Control": "max-age=10000000" },
        });

        const { getRequest } = useMockRequestHandler({
          baseUrl,
          method: "get",
          path: "/self",
          status: 200,
          body: { email: "user@user.com" },
        });

        await client.GET("/self", {
          params: {},
          headers: { "Cache-Control": "no-cache" },
        });

        // assert default headers were passed
        expect(getRequest().headers).toEqual(
          new Headers({
            "Cache-Control": "no-cache",
            "Content-Type": "application/json",
          }),
        );
      });

      it("can be unset", async () => {
        const client = createClient<paths>({
          baseUrl,
          headers: { "Content-Type": null },
        });

        const { getRequest } = useMockRequestHandler({
          baseUrl,
          method: "get",
          path: "/self",
          status: 200,
          body: { email: "user@user.com" },
        });

        await client.GET("/self", { params: {} });

        // assert default headers were passed
        expect(getRequest().headers).toEqual(new Headers());
      });

      it("supports arrays", async () => {
        const client = createClient<paths>({ baseUrl });

        const list = ["one", "two", "three"];

        const { getRequest } = useMockRequestHandler({
          baseUrl,
          method: "get",
          path: "/self",
          status: 200,
          body: {},
        });

        await client.GET("/self", { headers: { list } });

        expect(getRequest().headers.get("list")).toEqual(list.join(", "));
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

        const client = createClient<paths>({ fetch: customFetch, baseUrl });
        const { data } = await client.GET("/self");

        // assert data was returned from custom fetcher
        expect(data).toEqual({ works: true });

        // TODO: do we need to assert nothing was called?
        // msw should throw an error if there was an unused handler
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

        const client = createClient<paths>({ fetch: fallbackFetch, baseUrl });

        // assert override function was called
        const fetch1 = await client.GET("/self", { fetch: overrideFetch });
        expect(fetch1.data).toEqual({ fetcher: "override" });

        // assert fallback function still persisted (and wasn’t overridden)
        const fetch2 = await client.GET("/self");
        expect(fetch2.data).toEqual({ fetcher: "fallback" });

        // TODO: do we need to assert nothing was called?
        // msw should throw an error if there was an unused handler
      });
    });

    describe("middleware", () => {
      it("can modify request", async () => {
        const client = createClient<paths>({ baseUrl });
        client.use({
          async onRequest(req) {
            return new Request("https://foo.bar/api/v1", {
              ...req,
              method: "OPTIONS",
              headers: { foo: "bar" },
            });
          },
        });

        const { getRequest } = useMockRequestHandler({
          baseUrl,
          method: "options",
          path: "https://foo.bar/api/v1",
          status: 200,
          body: {},
        });

        await client.GET("/self");

        const req = getRequest();
        expect(req.url).toBe("https://foo.bar/api/v1");
        expect(req.method).toBe("OPTIONS");
        expect(req.headers.get("foo")).toBe("bar");
      });

      it("can attach custom properties to request", async () => {
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
        const client = createClient<paths>({ fetch: customFetch, baseUrl });

        client.GET("/self", {
          customProperty: "value",
        });
      });

      it("can modify response", async () => {
        const toUnix = (date: string) => new Date(date).getTime();

        const rawBody = {
          email: "user123@gmail.com",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-20T00:00:00Z",
        };

        useMockRequestHandler({
          baseUrl,
          method: "get",
          path: "/self",
          status: 200,
          body: rawBody,
          headers: { foo: "bar" },
        });

        const client = createClient<paths>({ baseUrl });
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
              status: 201,
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
        expect(response.status).toBe(201);
        // assert server headers were preserved
        expect(response.headers.get("foo")).toBe("bar");
        // assert middleware heaers were added
        expect(response.headers.get("middleware")).toBe("value");
      });

      it("executes in expected order", async () => {
        const { getRequest } = useMockRequestHandler({
          baseUrl,
          method: "get",
          path: "/self",
          status: 200,
          body: {},
        });

        const client = createClient<paths>({ baseUrl });
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
                const headers = new Headers(res.headers);
                headers.set("step", "A");
                return new Response(res.body, { ...res, headers });
              }
            },
          },
          {
            async onRequest(req) {
              req.headers.set("step", "B");
              return req;
            },
            async onResponse(res) {
              const headers = new Headers(res.headers);
              headers.set("step", "B");
              if (res.headers.get("step") === "C") {
                return new Response(res.body, { ...res, headers });
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
        expect(getRequest().headers.get("step")).toBe("C");

        // assert responses ended up on step A (reverse order)
        expect(response.headers.get("step")).toBe("A");
      });

      it("receives correct options", async () => {
        useMockRequestHandler({
          baseUrl: "https://api.foo.bar/v1/",
          method: "get",
          path: "/self",
          status: 200,
          body: {},
        });

        let requestBaseUrl = "";

        const client = createClient<paths>({
          baseUrl: "https://api.foo.bar/v1/",
        });
        client.use({
          onRequest(_, options) {
            requestBaseUrl = options.baseUrl;
            return undefined;
          },
        });

        await client.GET("/self");
        expect(requestBaseUrl).toBe("https://api.foo.bar/v1");
      });

      it("receives OpenAPI options passed in from parent", async () => {
        useMockRequestHandler({
          method: "put",
          path: "https://api.foo.bar/v1/tag*",
          status: 200,
          body: {},
        });

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
            receivedPath = req.schemaPath;
            receivedParams = req.params;
            return undefined;
          },
        });
        await client.PUT(pathname, tagData);

        expect(receivedPath).toBe(pathname);
        expect(receivedParams).toEqual(tagData.params);
      });

      it("can be skipped without interrupting request", async () => {
        useMockRequestHandler({
          baseUrl: "https://api.foo.bar/v1/",
          method: "get",
          path: "/blogposts",
          status: 200,
          body: { success: true },
        });

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
        useMockRequestHandler({
          baseUrl: "https://api.foo.bar/v1",
          method: "get",
          path: "/blogposts",
          status: 200,
          body: { success: true },
        });

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
      const client = createClient<paths>({ baseUrl });

      const { getRequest } = useMockRequestHandler({
        baseUrl,
        method: "put",
        path: "/contact",
      });

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

      // expect request to contain correct headers and body
      const req = getRequest();
      expect(req.body).toBeInstanceOf(ReadableStream);
      const body = await req.formData();
      expect(body.get("name")).toBe("John Doe");
      expect(req.headers.get("Content-Type")).toMatch(/multipart\/form-data;/);
    });

    it("respects cookie", async () => {
      const client = createClient<paths>({ baseUrl });

      const { getRequestCookies } = useMockRequestHandler({
        baseUrl,
        method: "get",
        path: "/blogposts",
      });

      await client.GET("/blogposts", {
        credentials: "include",
        headers: {
          Cookie: "session=1234",
        },
      });

      const cookies = getRequestCookies();
      expect(cookies).toEqual({ session: "1234" });
    });
  });

  describe("responses", () => {
    it("returns empty object on 204", async () => {
      const client = createClient<paths>({ baseUrl });
      useMockRequestHandler({
        baseUrl,
        method: "delete",
        path: "/tag/*",
        handler: () => new HttpResponse(null, { status: 204 }),
      });

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
        baseUrl,
        headers: { "Cache-Control": "max-age=10000000" },
      });
      useMockRequestHandler({
        baseUrl,
        method: "get",
        path: "/default-as-error",
        status: 500,
        body: {
          code: 500,
          message: "An unexpected error occurred",
        },
      });
      const { error } = await client.GET("/default-as-error");

      // discard `data` object
      if (!error) {
        throw new Error("treats `default` as an error: error response should be present");
      }

      // assert `error.message` doesn’t throw TS error
      expect(error.message).toBe("An unexpected error occurred");
    });

    describe("parseAs", () => {
      it("text", async () => {
        const client = createClient<paths>({ baseUrl });
        useMockRequestHandler({
          baseUrl,
          method: "get",
          path: "/anyMethod",
          body: {},
        });
        const { data, error } = (await client.GET("/anyMethod", {
          parseAs: "text",
        })) satisfies { data?: string };
        if (error) {
          throw new Error("parseAs text: error");
        }
        expect(data).toBe("{}");
      });

      it("arrayBuffer", async () => {
        const client = createClient<paths>({ baseUrl });
        useMockRequestHandler({
          baseUrl,
          method: "get",
          path: "/anyMethod",
          body: {},
        });
        const { data, error } = (await client.GET("/anyMethod", {
          parseAs: "arrayBuffer",
        })) satisfies { data?: ArrayBuffer };
        if (error) {
          throw new Error("parseAs arrayBuffer: error");
        }
        expect(data.byteLength).toBe(2);
      });

      it("blob", async () => {
        const client = createClient<paths>({ baseUrl });
        useMockRequestHandler({
          baseUrl,
          method: "get",
          path: "/anyMethod",
          body: {},
        });
        const { data, error } = (await client.GET("/anyMethod", {
          parseAs: "blob",
        })) satisfies { data?: Blob };
        if (error) {
          throw new Error("parseAs blob: error");
        }

        expect(data.constructor.name).toBe("Blob");
      });

      it("stream", async () => {
        const client = createClient<paths>({ baseUrl });
        useMockRequestHandler({
          baseUrl,
          method: "get",
          path: "/anyMethod",
          body: {},
        });
        const { data } = (await client.GET("/anyMethod", {
          parseAs: "stream",
        })) satisfies { data?: ReadableStream<Uint8Array> | null };
        if (!data) {
          throw new Error("parseAs stream: error");
        }

        expect(data).toBeInstanceOf(ReadableStream);
        const reader = data.getReader();
        const result = await reader.read();
        expect(result.value?.length).toBe(2);
      });

      it("use the selected content", async () => {
        const client = createClient<paths, "application/ld+json">({ baseUrl });

        useMockRequestHandler({
          baseUrl,
          method: "get",
          path: "/multiple-response-content",
          status: 200,
          headers: { "Content-Type": "application/ld+json" },
          body: {
            "@id": "some-resource-identifier",
            email: "foo@bar.fr",
            name: null,
          },
        });

        const { data } = await client.GET("/multiple-response-content", {
          headers: {
            Accept: "application/ld+json",
          },
        });

        data satisfies
          | {
              "@id": string;
              email: string;
              name?: string;
            }
          | undefined;

        if (!data) {
          throw new Error("Missing response");
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
      const client = createClient<paths>({ baseUrl });
      const { getRequest } = useMockRequestHandler({
        baseUrl,
        method: "get",
        path: "/anyMethod",
      });
      await client.GET("/anyMethod");
      expect(getRequest().method).toBe("GET");
    });

    it("sends correct options, returns success", async () => {
      const mockData = {
        title: "My Post",
        body: "<p>This is a very good post</p>",
        publish_date: new Date("2023-03-01T12:00:00Z").getTime(),
      };
      const client = createClient<paths>({ baseUrl });

      const { getRequestUrl } = useMockRequestHandler({
        baseUrl,
        method: "get",
        path: "/blogposts/:post_id",
        status: 200,
        body: mockData,
      });
      const { data, error, response } = await client.GET("/blogposts/{post_id}", {
        params: { path: { post_id: "my-post" } },
      });

      // assert correct URL was called
      expect(getRequestUrl().pathname).toBe("/blogposts/my-post");

      // assert correct data was returned
      expect(data).toEqual(mockData);
      expect(response.status).toBe(200);

      // assert error is empty
      expect(error).toBeUndefined();
    });

    it("sends correct options, returns error", async () => {
      const mockError = { code: 404, message: "Post not found" };
      const client = createClient<paths>({ baseUrl });

      const { getRequest } = useMockRequestHandler({
        baseUrl,
        method: "get",
        path: "/blogposts/:post_id",
        status: 404,
        body: mockError,
      });

      const { data, error, response } = await client.GET("/blogposts/{post_id}", {
        params: { path: { post_id: "my-post" } },
      });

      // assert correct URL was called
      expect(getRequest().url).toBe(`${baseUrl}/blogposts/my-post`);

      // assert correct method was called
      expect(getRequest().method).toBe("GET");

      // assert correct error was returned
      expect(error).toEqual(mockError);
      expect(response.status).toBe(404);

      // assert data is empty
      expect(data).toBeUndefined();
    });

    // note: this was a previous bug in the type inference
    it("handles array-type responses", async () => {
      const client = createClient<paths>({ baseUrl });

      useMockRequestHandler({
        baseUrl,
        method: "get",
        path: "/blogposts",
        status: 200,
        body: [],
      });

      const { data } = await client.GET("/blogposts", { params: {} });
      if (!data) {
        throw new Error("data empty");
      }

      // assert array type (and only array type) was inferred
      expect(data.length).toBe(0);
    });

    it("handles literal 2XX and 4XX codes", async () => {
      const client = createClient<paths>({ baseUrl });

      useMockRequestHandler({
        baseUrl,
        method: "put",
        path: "/media",
        status: 201,
        body: { status: "success" },
      });

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
      const client = createClient<paths>({ baseUrl });

      useMockRequestHandler({
        baseUrl,
        method: "get",
        path: "/blogposts",
        status: 401,
        body: "Unauthorized",
      });

      const { data, error } = await client.GET("/blogposts");

      expect(data).toBeUndefined();
      expect(error).toBe("Unauthorized");
    });
  });

  describe("POST()", () => {
    it("sends the correct method", async () => {
      const client = createClient<paths>({ baseUrl });
      const { getRequest } = useMockRequestHandler({
        baseUrl,
        method: "post",
        path: "/anyMethod",
      });
      await client.POST("/anyMethod");
      expect(getRequest().method).toBe("POST");
    });

    it("sends correct options, returns success", async () => {
      const mockData = { status: "success" };

      const client = createClient<paths>({ baseUrl });
      const { getRequestUrl } = useMockRequestHandler({
        baseUrl,
        method: "put",
        path: "/blogposts",
        status: 201,
        body: mockData,
      });

      const { data, error, response } = await client.PUT("/blogposts", {
        body: {
          title: "New Post",
          body: "<p>Best post yet</p>",
          publish_date: new Date("2023-03-31T12:00:00Z").getTime(),
        },
      });

      // assert correct URL was called
      expect(getRequestUrl().pathname).toBe("/blogposts");

      // assert correct data was returned
      expect(data).toEqual(mockData);
      expect(response.status).toBe(201);

      // assert error is empty
      expect(error).toBeUndefined();
    });

    it("supports sepecifying utf-8 encoding", async () => {
      const mockData = { message: "My reply" };
      const client = createClient<paths>({ baseUrl });
      useMockRequestHandler({
        baseUrl,
        method: "put",
        path: "/comment",
        status: 201,
        body: mockData,
      });

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
      const client = createClient<paths>({ baseUrl });
      const { getRequest } = useMockRequestHandler({
        baseUrl,
        method: "delete",
        path: "/anyMethod",
      });
      await client.DELETE("/anyMethod");
      expect(getRequest().method).toBe("DELETE");
    });

    it("returns empty object on 204", async () => {
      const client = createClient<paths>({ baseUrl });
      useMockRequestHandler({
        baseUrl,
        method: "delete",
        path: "/blogposts/:post_id",
        handler: () => new HttpResponse(null, { status: 204 }),
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

    it("returns empty object on Content-Length: 0", async () => {
      const client = createClient<paths>({ baseUrl });
      useMockRequestHandler({
        baseUrl,
        method: "delete",
        path: "/blogposts/:post_id",
        handler: () =>
          new HttpResponse(null, {
            status: 200,
            headers: {
              "Content-Length": "0",
            },
          }),
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
      const client = createClient<paths>({ baseUrl });
      const { getRequest } = useMockRequestHandler({
        baseUrl,
        method: "options",
        path: "/anyMethod",
      });
      await client.OPTIONS("/anyMethod");
      expect(getRequest().method).toBe("OPTIONS");
    });
  });

  describe("HEAD()", () => {
    it("sends the correct method", async () => {
      const client = createClient<paths>({ baseUrl });
      const { getRequest } = useMockRequestHandler({
        baseUrl,
        method: "head",
        path: "/anyMethod",
      });
      await client.HEAD("/anyMethod");
      expect(getRequest().method).toBe("HEAD");
    });
  });

  describe("PATCH()", () => {
    it("sends the correct method", async () => {
      const client = createClient<paths>({ baseUrl });
      const { getRequest } = useMockRequestHandler({
        baseUrl,
        method: "patch",
        path: "/anyMethod",
      });
      await client.PATCH("/anyMethod");
      expect(getRequest().method).toBe("PATCH");
    });
  });

  // NOTE: msw does not support TRACE method
  // so instead we verify that calling TRACE() with msw throws an error
  describe("TRACE()", () => {
    it("sends the correct method", async () => {
      const client = createClient<paths>({ baseUrl });
      useMockRequestHandler({
        baseUrl,
        method: "all", // note: msw doesn’t support TRACE method
        path: "/anyMethod",
      });

      await expect(async () => await client.TRACE("/anyMethod")).rejects.toThrowError(
        "'TRACE' HTTP method is unsupported",
      );
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

    const client = createClient<paths>({ baseUrl });
    client.use(authMiddleware);

    const { getRequest } = useMockRequestHandler({
      baseUrl,
      method: "get",
      path: "/blogposts/:post_id",
    });

    // assert initial call is unauthenticated
    await client.GET("/blogposts/{post_id}", {
      params: { path: { post_id: "1234" } },
    });
    expect(getRequest().headers.get("authorization")).toBeNull();

    // assert after setting token, client is authenticated
    accessToken = "real_token";
    await client.GET("/blogposts/{post_id}", {
      params: { path: { post_id: "1234" } },
    });
    expect(getRequest().headers.get("authorization")).toBe(`Bearer ${accessToken}`);
  });
});
