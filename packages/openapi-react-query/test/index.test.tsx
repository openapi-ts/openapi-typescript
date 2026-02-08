import {
  QueryClient,
  QueryClientProvider,
  skipToken,
  useQueries,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import createFetchClient from "openapi-fetch";
import { type ReactNode, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import createClient, { type MethodResponse } from "../src/index.js";
import type { paths } from "./fixtures/api.js";
import { baseUrl, server, useMockRequestHandler } from "./fixtures/mock-server.js";

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

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

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
    expect(client).toHaveProperty("useSuspenseQuery");
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
      const fetchClient = createFetchClient<paths>({ baseUrl, fetch: fetchInfinite });
      const client = createClient(fetchClient);

      const { result } = renderHook(
        () =>
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
        {
          wrapper,
        },
      );

      expectTypeOf(result.current[0].data).toEqualTypeOf<string[] | undefined>();
      expectTypeOf(result.current[0].error).toEqualTypeOf<{ code: number; message: string } | null>();

      expectTypeOf(result.current[1]).toEqualTypeOf<(typeof result.current)[0]>();

      expectTypeOf(result.current[2].data).toEqualTypeOf<
        | {
            title: string;
            body: string;
            publish_date?: number;
          }
        | undefined
      >();
      expectTypeOf(result.current[2].error).toEqualTypeOf<{ code: number; message: string } | null>();

      expectTypeOf(result.current[3]).toEqualTypeOf<(typeof result.current)[2]>();

      // Generated different queryKey for each query.
      expect(queryClient.isFetching()).toBe(4);
    });

    it("returns query options that can be passed to useQuery", async () => {
      const SKIP = { queryKey: [] as any, queryFn: skipToken } as const;

      const fetchClient = createFetchClient<minimalGetPaths>({ baseUrl });
      const client = createClient(fetchClient);

      const { result } = renderHook(
        () =>
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
        { wrapper },
      );

      expectTypeOf(result.current.data).toEqualTypeOf<"select(true)" | undefined>();
      expectTypeOf(result.current.error).toEqualTypeOf<false | null>();
    });

    it("returns query options that can be passed to useSuspenseQuery", async () => {
      const fetchClient = createFetchClient<minimalGetPaths>({
        baseUrl,
        fetch: () => Promise.resolve(Response.json(true)),
      });
      const client = createClient(fetchClient);

      const { result } = renderHook(
        () =>
          useSuspenseQuery({
            ...client.queryOptions("get", "/foo"),
            select: (data) => {
              expectTypeOf(data).toEqualTypeOf<true>();

              return "select(true)" as const;
            },
          }),
        { wrapper },
      );

      await waitFor(() => expect(result.current).not.toBeNull());

      expectTypeOf(result.current.data).toEqualTypeOf<"select(true)">();
      expectTypeOf(result.current.error).toEqualTypeOf<false | null>();
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

      const { result } = renderHook(() => client.useQuery("get", "/string-array"), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isFetching).toBe(false));

      const { data, error } = result.current;

      expect(data).toEqual(response);
      expect(error).toBeNull();
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

      const { result } = renderHook(() => client.useQuery("get", "/string-array"), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isFetching).toBe(false));

      const { data, error } = result.current;

      expect(error?.message).toBe("Something went wrong");
      expect(data).toBeUndefined();
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

      const { result } = renderHook(() => client.useQuery("get", "/string-array"), { wrapper });

      await waitFor(() => expect(result.current.isFetching).toBe(false));

      const { data, error } = result.current;

      expect(data).toBeNull();
      expect(error).toBeNull();
    });

    it("handles undefined response with non-zero Content-Length (status 200) by setting error and undefined data", async () => {
      const fetchClient = createFetchClient<paths>({ baseUrl });
      const client = createClient(fetchClient);

      useMockRequestHandler({
        baseUrl,
        method: "get",
        path: "/string-array",
        status: 200,
        headers: {
          "Content-Length": "10",
        },
        body: undefined,
      });

      const { result } = renderHook(() => client.useQuery("get", "/string-array"), { wrapper });

      await waitFor(() => expect(result.current.isFetching).toBe(false));

      const { data, error } = result.current;

      expect(error).toBeInstanceOf(Error);
      expect(data).toBeUndefined();
    });

    it("handles undefined response with zero Content-Length by setting data and error to null", async () => {
      const fetchClient = createFetchClient<paths>({ baseUrl });
      const client = createClient(fetchClient);

      useMockRequestHandler({
        baseUrl,
        method: "get",
        path: "/string-array",
        status: 200,
        headers: {
          "Content-Length": "0",
        },
        body: undefined,
      });

      const { result } = renderHook(() => client.useQuery("get", "/string-array"), { wrapper });

      await waitFor(() => expect(result.current.isFetching).toBe(false));

      const { data, error } = result.current;

      expect(error).toBeNull();
      expect(data).toBeNull();
    });

    it("handles undefined response with 204 No Content status by setting data and error to null", async () => {
      const fetchClient = createFetchClient<paths>({ baseUrl });
      const client = createClient(fetchClient);

      useMockRequestHandler({
        baseUrl,
        method: "get",
        path: "/string-array",
        status: 204,
        body: undefined,
      });

      const { result } = renderHook(() => client.useQuery("get", "/string-array"), { wrapper });

      await waitFor(() => expect(result.current.isFetching).toBe(false));

      const { data, error } = result.current;

      expect(error).toBeNull();
      expect(data).toBeNull();
    });

    it("should infer correct data and error type", async () => {
      const fetchClient = createFetchClient<paths>({ baseUrl, fetch: fetchInfinite });
      const client = createClient(fetchClient);

      const { result } = renderHook(() => client.useQuery("get", "/string-array"), {
        wrapper,
      });

      const { data, error } = result.current;

      expectTypeOf(data).toEqualTypeOf<MethodResponse<typeof client, "get", "/string-array"> | undefined>();
      expectTypeOf(data).toEqualTypeOf<string[] | undefined>();
      expectTypeOf(error).toEqualTypeOf<{ code: number; message: string } | null>();
    });

    it("should infer correct data when used with select property", async () => {
      const fetchClient = createFetchClient<paths>({ baseUrl, fetch: fetchInfinite });
      const client = createClient(fetchClient);

      const { result } = renderHook(
        () =>
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
        {
          wrapper,
        },
      );

      const { data } = result.current;

      expectTypeOf(data).toEqualTypeOf<
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

      const { unmount } = renderHook(() => client.useQuery("get", "/string-array"), { wrapper });

      unmount();

      expect(signalPassedToFetch?.aborted).toBeTruthy();
    });

    describe("params", () => {
      it("should be required if OpenAPI schema requires params", async () => {
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
        const { result } = renderHook(() => client.useQuery("get", "/blogposts/{post_id}"), {
          wrapper,
        });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
      });
    });

    it("should use provided custom queryClient", async () => {
      const fetchClient = createFetchClient<paths>({ baseUrl });
      const client = createClient(fetchClient);
      const customQueryClient = new QueryClient({});

      function Page() {
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
        return <div>data: {data?.title}</div>;
      }

      useMockRequestHandler({
        baseUrl,
        method: "get",
        path: "/blogposts/:post_id",
        status: 200,
        body: { title: "hello" },
      });

      const rendered = render(<Page />);

      await waitFor(() => expect(rendered.getByText("data: hello")));
    });

    it("uses provided options", async () => {
      const initialData = ["initial", "data"];
      const fetchClient = createFetchClient<paths>({ baseUrl });
      const client = createClient(fetchClient);

      const { result } = renderHook(
        () => client.useQuery("get", "/string-array", {}, { enabled: false, initialData }),
        { wrapper },
      );

      const { data, error } = result.current;

      expect(data).toBe(initialData);
      expect(error).toBeNull();
    });
  });

  describe("useSuspenseQuery", () => {
    it("should resolve data properly and have error as null when successfull request", async () => {
      const fetchClient = createFetchClient<paths>({ baseUrl });
      const client = createClient(fetchClient);

      useMockRequestHandler({
        baseUrl,
        method: "get",
        path: "/string-array",
        status: 200,
        body: ["one", "two", "three"],
      });

      const { result } = renderHook(() => client.useSuspenseQuery("get", "/string-array"), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isFetching).toBe(false));

      const { data, error } = result.current;

      expect(data[0]).toBe("one");
      expect(error).toBeNull();
    });

    it("should properly propagate error to suspense with a failed http request", async () => {
      const fetchClient = createFetchClient<paths>({ baseUrl });
      const client = createClient(fetchClient);
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {}); // to avoid sending errors to console

      useMockRequestHandler({
        baseUrl,
        method: "get",
        path: "/string-array",
        status: 500,
        body: { code: 500, message: "Something went wrong" },
      });

      const TestComponent = () => {
        client.useSuspenseQuery("get", "/string-array");
        return <div />;
      };

      render(
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary fallbackRender={({ error }) => <p>{error.message}</p>}>
            <Suspense fallback={<p>loading</p>}>
              <TestComponent />
            </Suspense>
          </ErrorBoundary>
        </QueryClientProvider>,
      );

      expect(await screen.findByText("Something went wrong")).toBeDefined();
      errorSpy.mockRestore();
    });

    it("should use provided custom queryClient", async () => {
      const fetchClient = createFetchClient<paths>({ baseUrl });
      const client = createClient(fetchClient);
      const customQueryClient = new QueryClient({});

      function Page() {
        const { data } = client.useSuspenseQuery(
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
        return <div>data: {data?.title}</div>;
      }

      useMockRequestHandler({
        baseUrl,
        method: "get",
        path: "/blogposts/:post_id",
        status: 200,
        body: { title: "Hello" },
      });

      const rendered = render(<Page />);

      await waitFor(() => rendered.findByText("data: Hello"));
    });

    it("passes abort signal to fetch", async () => {
      let signalPassedToFetch: AbortSignal | undefined;

      const fetchClient = createFetchClient<paths>({
        baseUrl,
        fetch: async ({ signal }) => {
          signalPassedToFetch = signal;
          await new Promise(() => {});
          return Response.error();
        },
      });
      const client = createClient(fetchClient);
      const queryClient = new QueryClient({});

      const { unmount } = renderHook(() => client.useSuspenseQuery("get", "/string-array", {}, {}, queryClient));

      unmount();

      await act(() => queryClient.cancelQueries());

      expect(signalPassedToFetch?.aborted).toBeTruthy();
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

        const { result } = renderHook(() => client.useMutation("put", "/comment"), {
          wrapper,
        });

        result.current.mutate({ body: { message: "Hello", replied_at: 0 } });

        await waitFor(() => expect(result.current.isPending).toBe(false));

        const { data, error } = result.current;

        expect(data?.message).toBe("Hello");
        expect(error).toBeNull();
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

        const { result } = renderHook(() => client.useMutation("put", "/comment"), {
          wrapper,
        });

        result.current.mutate({ body: { message: "Hello", replied_at: 0 } });

        await waitFor(() => expect(result.current.isPending).toBe(false));

        const { data, error } = result.current;

        expect(data).toBeUndefined();
        expect(error?.message).toBe("Something went wrong");
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

        const { result } = renderHook(() => client.useMutation("put", "/comment"), { wrapper });

        result.current.mutate({ body: { message: "Hello", replied_at: 0 } });

        await waitFor(() => expect(result.current.isPending).toBe(false));

        const { data, error } = result.current;

        expect(data).toBeNull();
        expect(error).toBeNull();
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

        const { result } = renderHook(() => client.useMutation("put", "/comment"), { wrapper });

        result.current.mutate({ body: { message: "Hello", replied_at: 0 } });

        await waitFor(() => expect(result.current.isPending).toBe(false));

        const { data, error } = result.current;

        expect(error).toBeNull();
        expect(data).toBeUndefined();
      });

      it("should use provided custom queryClient", async () => {
        const fetchClient = createFetchClient<paths>({ baseUrl });
        const client = createClient(fetchClient);
        const customQueryClient = new QueryClient({});

        function Page() {
          const mutation = client.useMutation("put", "/comment", {}, customQueryClient);

          return (
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
                data: {mutation.data?.message ?? "null"}, status: {mutation.status}
              </div>
            </div>
          );
        }

        useMockRequestHandler({
          baseUrl,
          method: "put",
          path: "/comment",
          status: 200,
          body: { message: "Hello" },
        });

        const rendered = render(<Page />);

        await rendered.findByText("data: null, status: idle");

        fireEvent.click(rendered.getByRole("button", { name: /mutate/i }));

        await waitFor(() => rendered.findByText("data: Hello, status: success"));
      });

      it("should type mutate results properly", async () => {
        const fetchClient = createFetchClient<paths>({ baseUrl });
        const client = createClient(fetchClient);

        const onMutateReturnValue = { someArray: [1, 2, 3], someString: "abc" };
        type expectedOnMutateResultType = typeof onMutateReturnValue | undefined;

        const result = renderHook(
          () =>
            client.useMutation("put", "/comment", {
              onMutate: () => onMutateReturnValue,
              onError: (err, _, onMutateResult, context) => {
                assertType<expectedOnMutateResultType>(onMutateResult);
              },
              onSettled: (_data, _error, _variables, onMutateResult, context) => {
                assertType<expectedOnMutateResultType>(onMutateResult);
              },
            }),
          { wrapper },
        );

        assertType<expectedOnMutateResultType>(result.result.current.context);
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

        const { result } = renderHook(() => client.useMutation("put", "/comment"), {
          wrapper,
        });

        const data = await result.current.mutateAsync({ body: { message: "Hello", replied_at: 0 } });

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

        const { result } = renderHook(() => client.useMutation("put", "/comment"), {
          wrapper,
        });

        await expect(result.current.mutateAsync({ body: { message: "Hello", replied_at: 0 } })).rejects.toThrow();
      });

      it("should use provided custom queryClient", async () => {
        const fetchClient = createFetchClient<paths>({ baseUrl });
        const client = createClient(fetchClient);
        const customQueryClient = new QueryClient({});

        function Page() {
          const mutation = client.useMutation("put", "/comment", {}, customQueryClient);

          return (
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
                data: {mutation.data?.message ?? "null"}, status: {mutation.status}
              </div>
            </div>
          );
        }

        useMockRequestHandler({
          baseUrl,
          method: "put",
          path: "/comment",
          status: 200,
          body: { message: "Hello" },
        });

        const rendered = render(<Page />);

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

      const { result, rerender } = renderHook(
        () =>
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
        { wrapper },
      );

      // Wait for initial query to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

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
      await act(async () => {
        await result.current.fetchNextPage();
        // Force a rerender to ensure state is updated
        rerender();
      });

      // Wait for second page to be fetched and verify loading states
      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
        expect(result.current.hasNextPage).toBe(true);
        expect(result.current.data?.pages).toHaveLength(2);
      });

      // Verify second request
      const secondRequestUrl = secondRequestHandler.getRequestUrl();
      expect(secondRequestUrl?.searchParams.get("limit")).toBe("3");
      expect(secondRequestUrl?.searchParams.get("cursor")).toBe("1");

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.pages[0].nextPage).toBe(1);

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.pages[1].nextPage).toBe(2);

      // Verify the complete data structure
      expect(result.current.data?.pages).toEqual([
        { items: [1, 2, 3], nextPage: 1 },
        { items: [4, 5, 6], nextPage: 2 },
      ]);

      // Verify we can access all items through pages
      const allItems = result.current.data?.pages.flatMap((page) => page.items);
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

      const { result, rerender } = renderHook(
        () =>
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
        { wrapper },
      );

      // Wait for initial query to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

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
      await act(async () => {
        await result.current.fetchNextPage();
        rerender();
      });

      // Wait for second page to complete
      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
        expect(result.current.hasNextPage).toBe(true);
      });

      // Verify reversed pages and pageParams
      expect(result.current.data).toBeDefined();

      // Since pages are reversed, the second page will now come first
      expect(result.current.data?.pages).toEqual([
        { items: [4, 5, 6], nextPage: 2 },
        { items: [1, 2, 3], nextPage: 1 },
      ]);

      // Verify reversed pageParams
      expect(result.current.data?.pageParams).toEqual([1, 0]);

      // Verify all items from reversed pages
      const allItems = result.current.data?.pages.flatMap((page) => page.items);
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

      const { result, rerender } = renderHook(
        () =>
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
        { wrapper },
      );

      // Wait for initial query to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

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
      await act(async () => {
        await result.current.fetchNextPage();
        // Force a rerender to ensure state is updated
        rerender();
      });

      // Wait for second page to be fetched and verify loading states
      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
        expect(result.current.hasNextPage).toBe(true);
        expect(result.current.data?.pages).toHaveLength(2);
      });

      // Verify second request
      const secondRequestUrl = secondRequestHandler.getRequestUrl();
      expect(secondRequestUrl?.searchParams.get("limit")).toBe("3");
      expect(secondRequestUrl?.searchParams.get("follow_cursor")).toBe("1");

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.pages[0].nextPage).toBe(1);

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.pages[1].nextPage).toBe(2);

      // Verify the complete data structure
      expect(result.current.data?.pages).toEqual([
        { items: [1, 2, 3], nextPage: 1 },
        { items: [4, 5, 6], nextPage: 2 },
      ]);

      // Verify we can access all items through pages
      const allItems = result.current.data?.pages.flatMap((page) => page.items);
      expect(allItems).toEqual([1, 2, 3, 4, 5, 6]);
    });
    it("should use return type from select option", async () => {
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

      const { result, rerender } = renderHook(
        () =>
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
              select: (data) => data.pages.flatMap((page) => page.items).filter((item) => item !== undefined),
            },
          ),
        { wrapper },
      );

      // Wait for initial query to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expectTypeOf(result.current.data).toEqualTypeOf<number[] | undefined>();
      expect(result.current.data).toEqual([1, 2, 3]);

      // Set up mock for second page before triggering next page fetch
      const secondRequestHandler = useMockRequestHandler({
        baseUrl,
        method: "get",
        path: "/paginated-data",
        status: 200,
        body: { items: [4, 5, 6], nextPage: 2 },
      });

      // Fetch next page
      await act(async () => {
        await result.current.fetchNextPage();
        // Force a rerender to ensure state is updated
        rerender();
      });

      // Wait for second page to be fetched and verify loading states
      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
        expect(result.current.hasNextPage).toBe(true);
      });

      expect(result.current.data).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });
});
