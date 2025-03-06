import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { server, baseUrl, useMockRequestHandler } from "./fixtures/mock-server.js";
import type { paths } from "./fixtures/api.js";
import createClient, { type MethodResponse } from "../src/index.js";
import createFetchClient from "openapi-fetch";
import { defineComponent } from "vue";
import { fireEvent, render, waitFor } from "@testing-library/vue";
import { QueryClient, useQueries, useQuery, skipToken } from "@tanstack/vue-query";
import { renderHook } from "./helpers/render-hook.js";

type minimalGetPaths = {
  // Without parameters.
  "/foo": {
    get: {
      responses: {
        200: { content: { "application/json": true } };
        500: { content: { "application/json": false } };
      };
    };
  };
  // With some parameters (makes init required) and different responses.
  "/bar": {
    get: {
      parameters: { query: {} };
      responses: {
        200: { content: { "application/json": "bar 200" } };
        500: { content: { "application/json": "bar 500" } };
      };
    };
  };
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const fetchInfinite = async () => {
  await new Promise(() => {});
  return Response.error();
};

beforeAll(() => {
  server.listen({
    onUnhandledRequest: "error",
  });
});

afterEach(() => {
  server.resetHandlers();
  queryClient.removeQueries();
});

afterAll(() => server.close());

describe("client", () => {
  it("generates all proper functions", () => {
    const fetchClient = createFetchClient<paths>({ baseUrl });
    const client = createClient<paths>(fetchClient);
    expect(client).toHaveProperty("queryOptions");
    expect(client).toHaveProperty("useQuery");
    expect(client).toHaveProperty("useInfiniteQuery");
    expect(client).toHaveProperty("useMutation");
  });

  describe("queryOptions", () => {
    it("has correct parameter types", async () => {
      const fetchClient = createFetchClient<paths>({ baseUrl });
      const client = createClient(fetchClient);

      client.queryOptions("get", "/string-array");
      // @ts-expect-error: Wrong method.
      client.queryOptions("put", "/string-array");
      // @ts-expect-error: Wrong path.
      client.queryOptions("get", "/string-arrayX");
      // @ts-expect-error: Missing 'post_id' param.
      client.queryOptions("get", "/blogposts/{post_id}", {});
    });

    it("returns query options that can resolve data correctly with fetchQuery", async () => {
      const response = { title: "title", body: "body" };
      const fetchClient = createFetchClient<paths>({ baseUrl });
      const client = createClient(fetchClient);

      useMockRequestHandler({
        baseUrl,
        method: "get",
        path: "/blogposts/1",
        status: 200,
        body: response,
      });

      const data = await queryClient.fetchQuery(
        client.queryOptions("get", "/blogposts/{post_id}", {
          params: {
            path: {
              post_id: "1",
            },
          },
        }),
      );

      expectTypeOf(data).toEqualTypeOf<{
        title: string;
        body: string;
        publish_date?: number;
      }>();

      expect(data).toEqual(response);
    });

    it("returns query options that can be passed to useQueries", async () => {
      const fetchClient = createFetchClient<paths>({
        baseUrl,
        fetch: fetchInfinite,
      });
      const client = createClient(fetchClient);

      const { result } = renderHook(() =>
        useQueries(
          {
            queries: [
              client.queryOptions("get", "/string-array"),
              client.queryOptions("get", "/string-array", {}),
              client.queryOptions("get", "/blogposts/{post_id}", {
                params: {
                  path: {
                    post_id: "1",
                  },
                },
              }),
              client.queryOptions("get", "/blogposts/{post_id}", {
                params: {
                  path: {
                    post_id: "2",
                  },
                },
              }),
            ],
          },
          queryClient,
        ),
      );

      expectTypeOf(result.value[0].data).toEqualTypeOf<string[] | undefined>();
      expectTypeOf(result.value[0].error).toEqualTypeOf<{
        code: number;
        message: string;
      } | null>();

      expectTypeOf(result.value[1]).toEqualTypeOf<(typeof result.value)[0]>();

      expectTypeOf(result.value[2].data).toEqualTypeOf<
        | {
            title: string;
            body: string;
            publish_date?: number;
          }
        | undefined
      >();
      expectTypeOf(result.value[2].error).toEqualTypeOf<{
        code: number;
        message: string;
      } | null>();

      expectTypeOf(result.value[3]).toEqualTypeOf<(typeof result.value)[2]>();

      // Generated different queryKey for each query.
      expect(queryClient.isFetching()).toBe(4);
    });

    it("returns query options that can be passed to useQuery", async () => {
      const SKIP = { queryKey: [] as any, queryFn: skipToken } as const;

      const fetchClient = createFetchClient<minimalGetPaths>({ baseUrl });
      const client = createClient(fetchClient);

      const { result } = renderHook(() =>
        useQuery(
          // biome-ignore lint/correctness/noConstantCondition: it's just here to test types
          false
            ? {
                ...client.queryOptions("get", "/foo"),
                select: (data) => {
                  expectTypeOf(data).toEqualTypeOf<true>();

                  return "select(true)" as const;
                },
              }
            : SKIP,
        ),
      );

      expectTypeOf(result.data.value).toEqualTypeOf<"select(true)" | undefined>();
      // TODO: fix this
      // expectTypeOf(result.error.value).toEqualTypeOf<false | null>();
    });

    it("returns query options without an init", async () => {
      const fetchClient = createFetchClient<minimalGetPaths>({
        baseUrl,
        fetch: () => Promise.resolve(Response.json(true)),
      });
      const client = createClient(fetchClient);

      expect(client.queryOptions("get", "/foo").queryKey.length).toBe(2);
    });
  });

  describe("useQuery", () => {
    it("should resolve data properly and have error as null when successful request", async () => {
      const response = ["one", "two", "three"];
      const fetchClient = createFetchClient<paths>({ baseUrl });
      const client = createClient(fetchClient);

      useMockRequestHandler({
        baseUrl,
        method: "get",
        path: "/string-array",
        status: 200,
        body: response,
      });

      const { result } = renderHook(() => client.useQuery("get", "/string-array"));

      await waitFor(() => expect(result.isFetching.value).toBe(false));

      const { data, error } = result;

      expect(data.value).toEqual(response);
      expect(error.value).toBeNull();
    });

    it("should resolve error properly and have undefined data when failed request", async () => {
      const fetchClient = createFetchClient<paths>({ baseUrl });
      const client = createClient(fetchClient);

      useMockRequestHandler({
        baseUrl,
        method: "get",
        path: "/string-array",
        status: 500,
        body: { code: 500, message: "Something went wrong" },
      });

      const { result } = renderHook(() => client.useQuery("get", "/string-array"));

      await waitFor(() => expect(result.isFetching.value).toBe(false));

      const { data, error } = result;

      expect(error?.value?.message).toBe("Something went wrong");
      expect(data.value).toBeUndefined();
    });

    it("should resolve data properly and have error as null when queryFn returns null", async () => {
      const fetchClient = createFetchClient<paths>({ baseUrl });
      const client = createClient(fetchClient);

      useMockRequestHandler({
        baseUrl,
        method: "get",
        path: "/string-array",
        status: 200,
        body: null,
      });

      const { result } = renderHook(() => client.useQuery("get", "/string-array"));

      await waitFor(() => expect(result.isFetching.value).toBe(false));

      const { data, error } = result;

      expect(data.value).toBeNull();
      expect(error.value).toBeNull();
    });

    it("should resolve error properly and have undefined data when queryFn returns undefined", async () => {
      const fetchClient = createFetchClient<paths>({ baseUrl });
      const client = createClient(fetchClient);

      useMockRequestHandler({
        baseUrl,
        method: "get",
        path: "/string-array",
        status: 200,
        body: undefined,
      });

      const { result } = renderHook(() => client.useQuery("get", "/string-array"));

      await waitFor(() => expect(result.isFetching.value).toBe(false));

      const { data, error } = result;

      expect(error.value).toBeInstanceOf(Error);
      expect(data.value).toBeUndefined();
    });

    it("should infer correct data and error type", async () => {
      const fetchClient = createFetchClient<paths>({
        baseUrl,
        fetch: fetchInfinite,
      });
      const client = createClient(fetchClient);

      const { result } = renderHook(() => client.useQuery("get", "/string-array"));

      const { data, error } = result;

      expectTypeOf(data.value).toEqualTypeOf<MethodResponse<typeof client, "get", "/string-array"> | undefined>();
      expectTypeOf(data.value).toEqualTypeOf<string[] | undefined>();
      expectTypeOf(error.value).toEqualTypeOf<{
        code: number;
        message: string;
      } | null>();
    });

    it("should infer correct data when used with select property", async () => {
      const fetchClient = createFetchClient<paths>({ baseUrl, fetch: fetchInfinite });
      const client = createClient(fetchClient);

      const { result } = renderHook(() =>
        client.useQuery(
          "get",
          "/string-array",
          {},
          {
            select: (data) => ({
              originalData: data,
              customData: 1,
            }),
          },
        ),
      );

      const { data } = result;

      expectTypeOf(data.value).toEqualTypeOf<
        | {
            originalData: string[];
            customData: number;
          }
        | undefined
      >();
    });

    it("passes abort signal to fetch", async () => {
      let signalPassedToFetch: AbortSignal | undefined;

      const fetchClient = createFetchClient<paths>({
        baseUrl,
        fetch: async ({ signal }) => {
          signalPassedToFetch = signal;
          return await fetchInfinite();
        },
      });
      const client = createClient(fetchClient);

      const { unmount } = renderHook(() => client.useQuery("get", "/string-array"));

      unmount();

      expect(signalPassedToFetch?.aborted).toBeTruthy();
    });

    describe("params", () => {
      it.skip("should be required if OpenAPI schema requires params", async () => {
        const fetchClient = createFetchClient<paths>({ baseUrl });
        const client = createClient(fetchClient);

        useMockRequestHandler({
          baseUrl,
          method: "get",
          path: "/blogposts/:post_id",
          status: 200,
          body: { message: "OK" },
        });

        // expect error on missing 'params'
        // @ts-expect-error
        const { result } = renderHook(() => client.useQuery("get", "/blogposts/{post_id}"));
        await waitFor(() => expect(result.isSuccess.value).toBe(true));
      });
    });

    it("should use provided custom queryClient", async () => {
      const fetchClient = createFetchClient<paths>({ baseUrl });
      const client = createClient(fetchClient);
      const customQueryClient = new QueryClient({});

      const Page = defineComponent({
        setup() {
          const { data } = client.useQuery(
            "get",
            "/blogposts/{post_id}",
            {
              params: {
                path: {
                  post_id: "1",
                },
              },
            },
            {},
            customQueryClient,
          );

          return () => <div>data: {data.value?.title}</div>;
        },
      });

      useMockRequestHandler({
        baseUrl,
        method: "get",
        path: "/blogposts/:post_id",
        status: 200,
        body: { title: "hello" },
      });

      const rendered = render(Page);

      await waitFor(() => expect(rendered.getByText("data: hello")));
    });

    it("uses provided options", async () => {
      const initialData = ["initial", "data"];
      const fetchClient = createFetchClient<paths>({ baseUrl });
      const client = createClient(fetchClient);

      const { result } = renderHook(() => client.useQuery("get", "/string-array", {}, { enabled: false, initialData }));

      const { data, error } = result;

      expect(data.value).toEqual(initialData);
      expect(error.value).toBeNull();
    });
  });

  describe("useMutation", () => {
    describe("mutate", () => {
      it("should resolve data properly and have error as null when successfull request", async () => {
        const fetchClient = createFetchClient<paths>({ baseUrl });
        const client = createClient(fetchClient);

        useMockRequestHandler({
          baseUrl,
          method: "put",
          path: "/comment",
          status: 200,
          body: { message: "Hello" },
        });

        const { result } = renderHook(() => client.useMutation("put", "/comment"));

        result.mutate({ body: { message: "Hello", replied_at: 0 } });

        await waitFor(() => expect(result.isPending.value).toBe(false));

        const { data, error } = result;

        expect(data?.value?.message).toBe("Hello");
        expect(error.value).toBeNull();
      });

      it("should resolve error properly and have undefined data when failed request", async () => {
        const fetchClient = createFetchClient<paths>({ baseUrl });
        const client = createClient(fetchClient);

        useMockRequestHandler({
          baseUrl,
          method: "put",
          path: "/comment",
          status: 500,
          body: { code: 500, message: "Something went wrong" },
        });

        const { result } = renderHook(() => client.useMutation("put", "/comment"));

        result.mutate({ body: { message: "Hello", replied_at: 0 } });

        await waitFor(() => expect(result.isPending.value).toBe(false));

        const { data, error } = result;

        expect(data.value).toBeUndefined();
        expect(error?.value?.message).toBe("Something went wrong");
      });

      it("should resolve data properly and have error as null when mutationFn returns null", async () => {
        const fetchClient = createFetchClient<paths>({ baseUrl });
        const client = createClient(fetchClient);

        useMockRequestHandler({
          baseUrl,
          method: "put",
          path: "/comment",
          status: 200,
          body: null,
        });

        const { result } = renderHook(() => client.useMutation("put", "/comment"));

        result.mutate({ body: { message: "Hello", replied_at: 0 } });

        await waitFor(() => expect(result.isPending.value).toBe(false));

        const { data, error } = result;

        expect(data.value).toBeNull();
        expect(error.value).toBeNull();
      });

      it("should resolve data properly and have error as null when mutationFn returns undefined", async () => {
        const fetchClient = createFetchClient<paths>({ baseUrl });
        const client = createClient(fetchClient);

        useMockRequestHandler({
          baseUrl,
          method: "put",
          path: "/comment",
          status: 200,
          body: undefined,
        });

        const { result } = renderHook(() => client.useMutation("put", "/comment"));

        result.mutate({ body: { message: "Hello", replied_at: 0 } });

        await waitFor(() => expect(result.isPending.value).toBe(false));

        const { data, error } = result;

        expect(error.value).toBeNull();
        expect(data.value).toBeUndefined();
      });

      it("should use provided custom queryClient", async () => {
        const fetchClient = createFetchClient<paths>({ baseUrl });
        const client = createClient(fetchClient);
        const customQueryClient = new QueryClient({});

        const Page = defineComponent({
          setup() {
            const mutation = client.useMutation("put", "/comment", {}, customQueryClient);

            return () => (
              <div>
                <button
                  type="button"
                  onClick={() =>
                    mutation.mutate({
                      body: {
                        message: "Hello",
                        replied_at: 0,
                      },
                    })
                  }
                >
                  mutate
                </button>
                <div>
                  data: {mutation.data?.value?.message ?? "null"}, status: {mutation.status.value}
                </div>
              </div>
            );
          },
        });

        useMockRequestHandler({
          baseUrl,
          method: "put",
          path: "/comment",
          status: 200,
          body: { message: "Hello" },
        });

        const rendered = render(Page);

        await rendered.findByText("data: null, status: idle");

        fireEvent.click(rendered.getByRole("button", { name: /mutate/i }));

        await waitFor(() => rendered.findByText("data: Hello, status: success"));
      });
    });

    describe("mutateAsync", () => {
      it("should resolve data properly", async () => {
        const fetchClient = createFetchClient<paths>({ baseUrl });
        const client = createClient(fetchClient);

        useMockRequestHandler({
          baseUrl,
          method: "put",
          path: "/comment",
          status: 200,
          body: { message: "Hello" },
        });

        const { result } = renderHook(() => client.useMutation("put", "/comment"));

        const data = await result.mutateAsync({
          body: { message: "Hello", replied_at: 0 },
        });

        expect(data.message).toBe("Hello");
      });

      it("should throw an error when failed request", async () => {
        const fetchClient = createFetchClient<paths>({ baseUrl });
        const client = createClient(fetchClient);

        useMockRequestHandler({
          baseUrl,
          method: "put",
          path: "/comment",
          status: 500,
          body: { code: 500, message: "Something went wrong" },
        });

        const { result } = renderHook(() => client.useMutation("put", "/comment"));

        expect(
          result.mutateAsync({
            body: { message: "Hello", replied_at: 0 },
          }),
        ).rejects.toThrow();
      });

      it("should use provided custom queryClient", async () => {
        const fetchClient = createFetchClient<paths>({ baseUrl });
        const client = createClient(fetchClient);
        const customQueryClient = new QueryClient({});

        const Page = defineComponent({
          setup() {
            const mutation = client.useMutation("put", "/comment", {}, customQueryClient);

            return () => (
              <div>
                <button
                  type="button"
                  onClick={() =>
                    mutation.mutateAsync({
                      body: {
                        message: "Hello",
                        replied_at: 0,
                      },
                    })
                  }
                >
                  mutate
                </button>
                <div>
                  data: {mutation.data?.value?.message ?? "null"}, status: {mutation.status.value}
                </div>
              </div>
            );
          },
        });

        useMockRequestHandler({
          baseUrl,
          method: "put",
          path: "/comment",
          status: 200,
          body: { message: "Hello" },
        });

        const rendered = render(Page);

        await rendered.findByText("data: null, status: idle");

        fireEvent.click(rendered.getByRole("button", { name: /mutate/i }));

        await waitFor(() => rendered.findByText("data: Hello, status: success"));
      });
    });
  });

  describe("useInfiniteQuery", () => {
    it("should fetch data correctly with pagination and include cursor", async () => {
      const fetchClient = createFetchClient<paths>({ baseUrl });
      const client = createClient(fetchClient);

      // First page request handler
      const firstRequestHandler = useMockRequestHandler({
        baseUrl,
        method: "get",
        path: "/paginated-data",
        status: 200,
        body: { items: [1, 2, 3], nextPage: 1 },
      });

      const { result } = renderHook(() =>
        client.useInfiniteQuery(
          "get",
          "/paginated-data",
          {
            params: {
              query: {
                limit: 3,
              },
            },
          },
          {
            getNextPageParam: (lastPage) => lastPage.nextPage,
            initialPageParam: 0,
          },
        ),
      );

      // Wait for initial query to complete
      await waitFor(() => expect(result.isSuccess.value).toBe(true));

      // Verify first request
      const firstRequestUrl = firstRequestHandler.getRequestUrl();
      expect(firstRequestUrl?.searchParams.get("limit")).toBe("3");
      expect(firstRequestUrl?.searchParams.get("cursor")).toBe("0");

      // Set up mock for second page before triggering next page fetch
      const secondRequestHandler = useMockRequestHandler({
        baseUrl,
        method: "get",
        path: "/paginated-data",
        status: 200,
        body: { items: [4, 5, 6], nextPage: 2 },
      });

      // Fetch next page
      // TODO: replace with act equivalent
      await waitFor(async () => {
        await result.fetchNextPage();
        // Force a rerender to ensure state is updated
        // TODO: implement renderHook rerender equivalent
        // rerender();
      });

      // Wait for second page to be fetched and verify loading states
      await waitFor(() => {
        expect(result.isFetching.value).toBe(false);
        expect(result.hasNextPage.value).toBe(true);
        expect(result.data?.value?.pages).toHaveLength(2);
      });

      // // Verify second request
      const secondRequestUrl = secondRequestHandler.getRequestUrl();
      expect(secondRequestUrl?.searchParams.get("limit")).toBe("3");
      expect(secondRequestUrl?.searchParams.get("cursor")).toBe("1");

      expect(result.data.value).toBeDefined();
      expect(result.data?.value?.pages[0].nextPage).toBe(1);

      expect(result.data.value).toBeDefined();
      expect(result.data?.value?.pages[1].nextPage).toBe(2);

      // Verify the complete data structure
      expect(result.data?.value?.pages).toEqual([
        { items: [1, 2, 3], nextPage: 1 },
        { items: [4, 5, 6], nextPage: 2 },
      ]);

      // Verify we can access all items through pages
      const allItems = result.data?.value?.pages.flatMap((page) => page.items);
      expect(allItems).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it("should reverse pages and pageParams when using the select option", async () => {
      const fetchClient = createFetchClient<paths>({ baseUrl });
      const client = createClient(fetchClient);

      // First page request handler
      const firstRequestHandler = useMockRequestHandler({
        baseUrl,
        method: "get",
        path: "/paginated-data",
        status: 200,
        body: { items: [1, 2, 3], nextPage: 1 },
      });

      const { result } = renderHook(() =>
        client.useInfiniteQuery(
          "get",
          "/paginated-data",
          {
            params: {
              query: {
                limit: 3,
              },
            },
          },
          {
            getNextPageParam: (lastPage) => lastPage.nextPage,
            initialPageParam: 0,
            select: (data) => ({
              pages: [...data.pages].reverse(),
              pageParams: [...data.pageParams].reverse(),
            }),
          },
        ),
      );

      // Wait for initial query to complete
      await waitFor(() => expect(result.isSuccess.value).toBe(true));

      // Verify first request
      const firstRequestUrl = firstRequestHandler.getRequestUrl();
      expect(firstRequestUrl?.searchParams.get("limit")).toBe("3");
      expect(firstRequestUrl?.searchParams.get("cursor")).toBe("0");

      // Set up mock for second page before triggering next page fetch
      const secondRequestHandler = useMockRequestHandler({
        baseUrl,
        method: "get",
        path: "/paginated-data",
        status: 200,
        body: { items: [4, 5, 6], nextPage: 2 },
      });

      // Fetch next page
      // TODO: replace with act equivalent
      await waitFor(async () => {
        await result.fetchNextPage();
        // TODO: implement renderHook rerender equivalent
        // Force a rerender to ensure state is updated
        // rerender();
      });

      // Wait for second page to complete
      await waitFor(() => {
        expect(result.isFetching.value).toBe(false);
        expect(result.hasNextPage.value).toBe(true);
      });

      // Verify reversed pages and pageParams
      expect(result.data.value).toBeDefined();

      // Since pages are reversed, the second page will now come first
      expect(result.data?.value?.pages).toEqual([
        { items: [4, 5, 6], nextPage: 2 },
        { items: [1, 2, 3], nextPage: 1 },
      ]);

      // Verify reversed pageParams
      expect(result.data?.value?.pageParams).toEqual([1, 0]);

      // Verify all items from reversed pages
      const allItems = result.data?.value?.pages.flatMap((page) => page.items);
      expect(allItems).toEqual([4, 5, 6, 1, 2, 3]);
    });

    it("should use custom cursor params", async () => {
      const fetchClient = createFetchClient<paths>({ baseUrl });
      const client = createClient(fetchClient);

      // First page request handler
      const firstRequestHandler = useMockRequestHandler({
        baseUrl,
        method: "get",
        path: "/paginated-data",
        status: 200,
        body: { items: [1, 2, 3], nextPage: 1 },
      });

      const { result } = renderHook(() =>
        client.useInfiniteQuery(
          "get",
          "/paginated-data",
          {
            params: {
              query: {
                limit: 3,
              },
            },
          },
          {
            getNextPageParam: (lastPage) => lastPage.nextPage,
            initialPageParam: 0,
            pageParamName: "follow_cursor",
          },
        ),
      );

      // Wait for initial query to complete
      await waitFor(() => expect(result.isSuccess.value).toBe(true));

      // Verify first request
      const firstRequestUrl = firstRequestHandler.getRequestUrl();
      expect(firstRequestUrl?.searchParams.get("limit")).toBe("3");
      expect(firstRequestUrl?.searchParams.get("follow_cursor")).toBe("0");

      // Set up mock for second page before triggering next page fetch
      const secondRequestHandler = useMockRequestHandler({
        baseUrl,
        method: "get",
        path: "/paginated-data",
        status: 200,
        body: { items: [4, 5, 6], nextPage: 2 },
      });

      // Fetch next page
      // TODO: replace with act equivalent
      await waitFor(async () => {
        await result.fetchNextPage();
        // Force a rerender to ensure state is updated
        // TODO: implement renderHook rerender equivalent
        // rerender();
      });

      // Wait for second page to be fetched and verify loading states
      await waitFor(() => {
        expect(result.isFetching.value).toBe(false);
        expect(result.hasNextPage.value).toBe(true);
        expect(result.data?.value?.pages).toHaveLength(2);
      });

      // Verify second request
      const secondRequestUrl = secondRequestHandler.getRequestUrl();
      expect(secondRequestUrl?.searchParams.get("limit")).toBe("3");
      expect(secondRequestUrl?.searchParams.get("follow_cursor")).toBe("1");

      expect(result.data.value).toBeDefined();
      expect(result.data?.value?.pages[0].nextPage).toBe(1);

      expect(result.data.value).toBeDefined();
      expect(result.data?.value?.pages[1].nextPage).toBe(2);

      // Verify the complete data structure
      expect(result.data?.value?.pages).toEqual([
        { items: [1, 2, 3], nextPage: 1 },
        { items: [4, 5, 6], nextPage: 2 },
      ]);

      // Verify we can access all items through pages
      const allItems = result.data?.value?.pages.flatMap((page) => page.items);
      expect(allItems).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });
});
