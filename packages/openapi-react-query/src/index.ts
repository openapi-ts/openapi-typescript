import type {
  QueryClient,
  QueryFunctionContext,
  SkipToken,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
  UseSuspenseQueryOptions,
  UseSuspenseQueryResult,
} from "@tanstack/react-query";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import type { ClientMethod, Client as FetchClient, FetchResponse, MaybeOptionalInit } from "openapi-fetch";
import type { HttpMethod, MediaType, PathsWithMethod, RequiredKeysOf } from "openapi-typescript-helpers";

type InitWithUnknowns<Init> = Init & { [key: string]: unknown };

export type QueryKey<
  Prefix,
  Paths extends Record<string, Record<HttpMethod, {}>>,
  Method extends HttpMethod,
  Path extends PathsWithMethod<Paths, Method>,
> = readonly [Prefix, Method, Path, MaybeOptionalInit<Paths[Path], Method>];

export type QueryOptionsFunction<
  Paths extends Record<string, Record<HttpMethod, {}>>,
  Media extends MediaType,
  Prefix = unknown,
> = <
  Method extends HttpMethod,
  Path extends PathsWithMethod<Paths, Method>,
  Init extends MaybeOptionalInit<Paths[Path], Method>,
  Response extends Required<FetchResponse<Paths[Path][Method], Init, Media>>, // note: Required is used to avoid repeating NonNullable in UseQuery types
  Options extends Omit<
    UseQueryOptions<Response["data"], Response["error"], Response["data"], QueryKey<Prefix, Paths, Method, Path>>,
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
    UseQueryOptions<Response["data"], Response["error"], Response["data"], QueryKey<Prefix, Paths, Method, Path>>,
    "queryFn"
  > & {
    queryFn: Exclude<
      UseQueryOptions<
        Response["data"],
        Response["error"],
        Response["data"],
        QueryKey<Prefix, Paths, Method, Path>
      >["queryFn"],
      SkipToken | undefined
    >;
  }
>;

export type UseQueryMethod<
  Paths extends Record<string, Record<HttpMethod, {}>>,
  Media extends MediaType,
  Prefix = unknown,
> = <
  Method extends HttpMethod,
  Path extends PathsWithMethod<Paths, Method>,
  Init extends MaybeOptionalInit<Paths[Path], Method>,
  Response extends Required<FetchResponse<Paths[Path][Method], Init, Media>>, // note: Required is used to avoid repeating NonNullable in UseQuery types
  Options extends Omit<
    UseQueryOptions<Response["data"], Response["error"], Response["data"], QueryKey<Prefix, Paths, Method, Path>>,
    "queryKey" | "queryFn"
  >,
>(
  method: Method,
  url: Path,
  ...[init, options, queryClient]: RequiredKeysOf<Init> extends never
    ? [InitWithUnknowns<Init>?, Options?, QueryClient?]
    : [InitWithUnknowns<Init>, Options?, QueryClient?]
) => UseQueryResult<Response["data"], Response["error"]>;

export type UseSuspenseQueryMethod<
  Paths extends Record<string, Record<HttpMethod, {}>>,
  Media extends MediaType,
  Prefix = unknown,
> = <
  Method extends HttpMethod,
  Path extends PathsWithMethod<Paths, Method>,
  Init extends MaybeOptionalInit<Paths[Path], Method>,
  Response extends Required<FetchResponse<Paths[Path][Method], Init, Media>>, // note: Required is used to avoid repeating NonNullable in UseQuery types
  Options extends Omit<
    UseSuspenseQueryOptions<
      Response["data"],
      Response["error"],
      Response["data"],
      QueryKey<Prefix, Paths, Method, Path>
    >,
    "queryKey" | "queryFn"
  >,
>(
  method: Method,
  url: Path,
  ...[init, options, queryClient]: RequiredKeysOf<Init> extends never
    ? [InitWithUnknowns<Init>?, Options?, QueryClient?]
    : [InitWithUnknowns<Init>, Options?, QueryClient?]
) => UseSuspenseQueryResult<Response["data"], Response["error"]>;

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

export interface OpenapiQueryClient<Paths extends {}, Media extends MediaType = MediaType, Prefix = unknown> {
  queryOptions: QueryOptionsFunction<Paths, Media, Prefix>;
  useQuery: UseQueryMethod<Paths, Media, Prefix>;
  useSuspenseQuery: UseSuspenseQueryMethod<Paths, Media, Prefix>;
  useMutation: UseMutationMethod<Paths, Media>;
}

// TODO: Add the ability to bring queryClient as argument
export default function createClient<Paths extends {}, Media extends MediaType = MediaType, Prefix = unknown>(
  client: FetchClient<Paths, Media>,
  { prefixQueryKey }: { prefixQueryKey?: Prefix } = {},
): OpenapiQueryClient<Paths, Media, Prefix> {
  const queryFn = async <Method extends HttpMethod, Path extends PathsWithMethod<Paths, Method>>({
    queryKey: [, method, path, init],
    signal,
  }: QueryFunctionContext<QueryKey<Prefix, Paths, Method, Path>>) => {
    const mth = method.toUpperCase() as Uppercase<typeof method>;
    const fn = client[mth] as ClientMethod<Paths, typeof method, Media>;
    const { data, error } = await fn(path, { signal, ...(init as any) }); // TODO: find a way to avoid as any
    if (error) {
      throw error;
    }

    return data;
  };

  const queryOptions: QueryOptionsFunction<Paths, Media, Prefix> = (method, path, ...[init, options]) => ({
    queryKey: [prefixQueryKey as Prefix, method, path, init as InitWithUnknowns<typeof init>] as const,
    queryFn,
    ...options,
  });

  return {
    queryOptions,
    useQuery: (method, path, ...[init, options, queryClient]) =>
      useQuery(queryOptions(method, path, init as InitWithUnknowns<typeof init>, options), queryClient),
    useSuspenseQuery: (method, path, ...[init, options, queryClient]) =>
      useSuspenseQuery(queryOptions(method, path, init as InitWithUnknowns<typeof init>, options), queryClient),
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
