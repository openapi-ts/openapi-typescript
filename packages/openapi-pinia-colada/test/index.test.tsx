import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { server, baseUrl, useMockRequestHandler } from "./fixtures/mock-server.js";
import type { paths } from "./fixtures/api.js";
import createClient from "../src/index.js";
import createFetchClient from "openapi-fetch";
import { fireEvent, render, renderHook, screen, waitFor, act } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  useQueries,
  useQuery,
  useSuspenseQuery,
  skipToken,
} from "@tanstack/react-query";
import { Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";

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
  });

  describe("useQuery", () => {
    it("should resolve data properly and have error as null when successfull request", async () => {
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

      const { result } = renderHook(() => client.useQuery("get", "/string-array"), { wrapper });

      await waitFor(() => expect(result.current.isFetching).toBe(false));

      const { data, error } = result.current;

      expect(error).toBeInstanceOf(Error);
      expect(data).toBeUndefined();
    });

    it("should infer correct data and error type", async () => {
      const fetchClient = createFetchClient<paths>({ baseUrl, fetch: fetchInfinite });
      const client = createClient(fetchClient);

      const { result } = renderHook(() => client.useQuery("get", "/string-array"), {
        wrapper,
      });

      const { data, error } = result.current;

      expectTypeOf(data).toEqualTypeOf<string[] | undefined>();
      expectTypeOf(error).toEqualTypeOf<{ code: number; message: string } | null>();
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

        expect(result.current.mutateAsync({ body: { message: "Hello", replied_at: 0 } })).rejects.toThrow();
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
});
