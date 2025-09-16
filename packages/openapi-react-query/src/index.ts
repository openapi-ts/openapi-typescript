import {
  type InfiniteData,
  type QueryClient,
  type QueryFunctionContext,
  type SkipToken,
  type UseInfiniteQueryOptions,
  type UseInfiniteQueryResult,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult,
  type UseSuspenseQueryOptions,
  type UseSuspenseQueryResult,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import type {
  ClientMethod,
  DefaultParamsOption,
  Client as FetchClient,
  FetchResponse,
  MaybeOptionalInit,
} from "openapi-fetch";
import type { HttpMethod, MediaType, PathsWithMethod, RequiredKeysOf } from "openapi-typescript-helpers";

// Helper type to dynamically infer the type from the `select` property
type InferSelectReturnType<TData, TSelect> = TSelect extends (data: TData) => infer R ? R : TData;

type InitWithUnknowns<Init> = Init & { [key: string]: unknown };

export type QueryKey<
  Paths extends Record<string, Record<HttpMethod, {}>>,
  Method extends HttpMethod,
  Path extends PathsWithMethod<Paths, Method>,
  Init = MaybeOptionalInit<Paths[Path], Method>,
> = Init extends undefined ? readonly [Method, Path] : readonly [Method, Path, Init];

export type QueryOptionsFunction<Paths extends Record<string, Record<HttpMethod, {}>>, Media extends MediaType> = <
  Method extends HttpMethod,
  Path extends PathsWithMethod<Paths, Method>,
  Init extends MaybeOptionalInit<Paths[Path], Method>,
  Response extends Required<FetchResponse<Paths[Path][Method], Init, Media>>, // note: Required is used to avoid repeating NonNullable in UseQuery types
  Options extends Omit<
    UseQueryOptions<
      Response["data"],
      Response["error"],
      InferSelectReturnType<Response["data"], Options["select"]>,
      QueryKey<Paths, Method, Path>
    >,
    "queryKey" | "queryFn"
  >,
>(
  method: Method,
  path: Path,
  ...[init, options]: RequiredKeysOf<Init> extends never
    ? [InitWithUnknowns<Init>?, Options?]
    : [InitWithUnknowns<Init>, Options?]
) => NoInfer<
  Omit<
    UseQueryOptions<
      Response["data"],
      Response["error"],
      InferSelectReturnType<Response["data"], Options["select"]>,
      QueryKey<Paths, Method, Path>
    >,
    "queryFn"
  > & {
    queryFn: Exclude<
      UseQueryOptions<
        Response["data"],
        Response["error"],
        InferSelectReturnType<Response["data"], Options["select"]>,
        QueryKey<Paths, Method, Path>
      >["queryFn"],
      SkipToken | undefined
    >;
  }
>;

export type UseQueryMethod<Paths extends Record<string, Record<HttpMethod, {}>>, Media extends MediaType> = <
  Method extends HttpMethod,
  Path extends PathsWithMethod<Paths, Method>,
  Init extends MaybeOptionalInit<Paths[Path], Method>,
  Response extends Required<FetchResponse<Paths[Path][Method], Init, Media>>, // note: Required is used to avoid repeating NonNullable in UseQuery types
  Options extends Omit<
    UseQueryOptions<
      Response["data"],
      Response["error"],
      InferSelectReturnType<Response["data"], Options["select"]>,
      QueryKey<Paths, Method, Path>
    >,
    "queryKey" | "queryFn"
  >,
>(
  method: Method,
  url: Path,
  ...[init, options, queryClient]: RequiredKeysOf<Init> extends never
    ? [InitWithUnknowns<Init>?, Options?, QueryClient?]
    : [InitWithUnknowns<Init>, Options?, QueryClient?]
) => UseQueryResult<InferSelectReturnType<Response["data"], Options["select"]>, Response["error"]>;

export type UseInfiniteQueryMethod<Paths extends Record<string, Record<HttpMethod, {}>>, Media extends MediaType> = <
  Method extends HttpMethod,
  Path extends PathsWithMethod<Paths, Method>,
  Init extends MaybeOptionalInit<Paths[Path], Method>,
  Response extends Required<FetchResponse<Paths[Path][Method], Init, Media>>,
  Options extends Omit<
    UseInfiniteQueryOptions<
      Response["data"],
      Response["error"],
      InferSelectReturnType<InfiniteData<Response["data"]>, Options["select"]>,
      QueryKey<Paths, Method, Path>,
      unknown
    >,
    "queryKey" | "queryFn"
  > & {
    pageParamName?: string;
  },
>(
  method: Method,
  url: Path,
  init: InitWithUnknowns<Init>,
  options: Options,
  queryClient?: QueryClient,
) => UseInfiniteQueryResult<
  InferSelectReturnType<InfiniteData<Response["data"]>, Options["select"]>,
  Response["error"]
>;

export type UseSuspenseQueryMethod<Paths extends Record<string, Record<HttpMethod, {}>>, Media extends MediaType> = <
  Method extends HttpMethod,
  Path extends PathsWithMethod<Paths, Method>,
  Init extends MaybeOptionalInit<Paths[Path], Method>,
  Response extends Required<FetchResponse<Paths[Path][Method], Init, Media>>, // note: Required is used to avoid repeating NonNullable in UseQuery types
  Options extends Omit<
    UseSuspenseQueryOptions<
      Response["data"],
      Response["error"],
      InferSelectReturnType<Response["data"], Options["select"]>,
      QueryKey<Paths, Method, Path>
    >,
    "queryKey" | "queryFn"
  >,
>(
  method: Method,
  url: Path,
  ...[init, options, queryClient]: RequiredKeysOf<Init> extends never
    ? [InitWithUnknowns<Init>?, Options?, QueryClient?]
    : [InitWithUnknowns<Init>, Options?, QueryClient?]
) => UseSuspenseQueryResult<InferSelectReturnType<Response["data"], Options["select"]>, Response["error"]>;

export type UseMutationMethod<Paths extends Record<string, Record<HttpMethod, {}>>, Media extends MediaType> = <
  Method extends HttpMethod,
  Path extends PathsWithMethod<Paths, Method>,
  Init extends MaybeOptionalInit<Paths[Path], Method>,
  Response extends Required<FetchResponse<Paths[Path][Method], Init, Media>>, // note: Required is used to avoid repeating NonNullable in UseQuery types
  Options extends Omit<UseMutationOptions<Response["data"], Response["error"], Init>, "mutationKey" | "mutationFn">,
>(
  method: Method,
  url: Path,
  options?: Options,
  queryClient?: QueryClient,
) => UseMutationResult<Response["data"], Response["error"], Init>;

export interface OpenapiQueryClient<Paths extends {}, Media extends MediaType = MediaType> {
  queryOptions: QueryOptionsFunction<Paths, Media>;
  useQuery: UseQueryMethod<Paths, Media>;
  useSuspenseQuery: UseSuspenseQueryMethod<Paths, Media>;
  useInfiniteQuery: UseInfiniteQueryMethod<Paths, Media>;
  useMutation: UseMutationMethod<Paths, Media>;
}

export type MethodResponse<
  CreatedClient extends OpenapiQueryClient<any, any>,
  Method extends HttpMethod,
  Path extends CreatedClient extends OpenapiQueryClient<infer Paths, infer _Media>
    ? PathsWithMethod<Paths, Method>
    : never,
  Options = object,
> = CreatedClient extends OpenapiQueryClient<infer Paths extends { [key: string]: any }, infer Media extends MediaType>
  ? NonNullable<FetchResponse<Paths[Path][Method], Options, Media>["data"]>
  : never;

// TODO: Add the ability to bring queryClient as argument
export default function createClient<Paths extends {}, Media extends MediaType = MediaType>(
  client: FetchClient<Paths, Media>,
): OpenapiQueryClient<Paths, Media> {
  const queryFn = async <Method extends HttpMethod, Path extends PathsWithMethod<Paths, Method>>({
    queryKey: [method, path, init],
    signal,
  }: QueryFunctionContext<QueryKey<Paths, Method, Path>>) => {
    const mth = method.toUpperCase() as Uppercase<typeof method>;
    const fn = client[mth] as ClientMethod<Paths, typeof method, Media>;
    const { data, error, response } = await fn(path, { signal, ...(init as any) }); // TODO: find a way to avoid as any
    if (error) {
      throw error;
    }
    if (response.status === 204 || response.headers.get("Content-Length") === "0") {
      return data ?? null;
    }

    return data;
  };

  const queryOptions: QueryOptionsFunction<Paths, Media> = (method, path, ...[init, options]) => ({
    queryKey: (init === undefined ? ([method, path] as const) : ([method, path, init] as const)) as QueryKey<
      Paths,
      typeof method,
      typeof path
    >,
    queryFn,
    ...options,
  });

  return {
    queryOptions,
    useQuery: (method, path, ...[init, options, queryClient]) =>
      useQuery(queryOptions(method, path, init as InitWithUnknowns<typeof init>, options), queryClient),
    useSuspenseQuery: (method, path, ...[init, options, queryClient]) =>
      useSuspenseQuery(queryOptions(method, path, init as InitWithUnknowns<typeof init>, options), queryClient),
    useInfiniteQuery: (method, path, init, options, queryClient) => {
      const { pageParamName = "cursor", ...restOptions } = options;
      const { queryKey } = queryOptions(method, path, init);
      return useInfiniteQuery(
        {
          queryKey,
          queryFn: async ({ queryKey: [method, path, init], pageParam = 0, signal }) => {
            const mth = method.toUpperCase() as Uppercase<typeof method>;
            const fn = client[mth] as ClientMethod<Paths, typeof method, Media>;
            const mergedInit = {
              ...init,
              signal,
              params: {
                ...(init?.params || {}),
                query: {
                  ...(init?.params as { query?: DefaultParamsOption })?.query,
                  [pageParamName]: pageParam,
                },
              },
            };

            const { data, error } = await fn(path, mergedInit as any);
            if (error) {
              throw error;
            }
            return data;
          },
          ...restOptions,
        },
        queryClient,
      );
    },
    useMutation: (method, path, options, queryClient) =>
      useMutation(
        {
          mutationKey: [method, path],
          mutationFn: async (init) => {
            const mth = method.toUpperCase() as Uppercase<typeof method>;
            const fn = client[mth] as ClientMethod<Paths, typeof method, Media>;
            const { data, error } = await fn(path, init as InitWithUnknowns<typeof init>);
            if (error) {
              throw error;
            }

            return data as Exclude<typeof data, undefined>;
          },
          ...options,
        },
        queryClient,
      ),
  };
}
