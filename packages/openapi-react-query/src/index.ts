import {
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult,
  type UseSuspenseQueryOptions,
  type UseSuspenseQueryResult,
  type QueryClient,
  useMutation,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import type { ClientMethod, FetchResponse, MaybeOptionalInit, Client as FetchClient } from "openapi-fetch";
import type { HttpMethod, MediaType, PathsWithMethod, RequiredKeysOf } from "openapi-typescript-helpers";

export type UseQueryMethod<Paths extends Record<string, Record<HttpMethod, {}>>, Media extends MediaType> = <
  Method extends HttpMethod,
  Path extends PathsWithMethod<Paths, Method>,
  Init extends MaybeOptionalInit<Paths[Path], Method>,
  Response extends Required<FetchResponse<Paths[Path][Method], Init, Media>>, // note: Required is used to avoid repeating NonNullable in UseQuery types
  Options extends Omit<UseQueryOptions<Response["data"], Response["error"]>, "queryKey" | "queryFn">,
>(
  method: Method,
  url: Path,
  ...[init, options, queryClient]: RequiredKeysOf<Init> extends never
    ? [(Init & { [key: string]: unknown })?, Options?, QueryClient?]
    : [Init & { [key: string]: unknown }, Options?, QueryClient?]
) => UseQueryResult<Response["data"], Response["error"]>;

export type UseSuspenseQueryMethod<Paths extends Record<string, Record<HttpMethod, {}>>, Media extends MediaType> = <
  Method extends HttpMethod,
  Path extends PathsWithMethod<Paths, Method>,
  Init extends MaybeOptionalInit<Paths[Path], Method>,
  Response extends Required<FetchResponse<Paths[Path][Method], Init, Media>>, // note: Required is used to avoid repeating NonNullable in UseQuery types
  Options extends Omit<UseSuspenseQueryOptions<Response["data"], Response["error"]>, "queryKey" | "queryFn">,
>(
  method: Method,
  url: Path,
  ...[init, options, queryClient]: RequiredKeysOf<Init> extends never
    ? [(Init & { [key: string]: unknown })?, Options?, QueryClient?]
    : [Init & { [key: string]: unknown }, Options?, QueryClient?]
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

export type GetKeyMethod<Paths extends Record<string, Record<HttpMethod, {}>> = Record<string, Record<HttpMethod, {}>>> = <
  Method extends HttpMethod,
  Path extends PathsWithMethod<Paths, Method>,
  Init extends MaybeOptionalInit<Paths[Path], Method>,
>(
  method: Method,
  url: Path,
  init?: Init,
) => [Method, Path, Init | undefined];

export interface OpenapiQueryClient<Paths extends {}, Media extends MediaType = MediaType> {
  client: FetchClient<Paths, Media>;
  getKey: GetKeyMethod<Paths>;
  useQuery: UseQueryMethod<Paths, Media>;
  useSuspenseQuery: UseSuspenseQueryMethod<Paths, Media>;
  useMutation: UseMutationMethod<Paths, Media>;
}

// TODO: Move the client[method]() fn outside for reusability
// TODO: Add the ability to bring queryClient as argument
export default function createClient<Paths extends {}, Media extends MediaType = MediaType>(
  client: FetchClient<Paths, Media>,
): OpenapiQueryClient<Paths, Media> {
  return {
    client,
    getKey: (method, path, init) => [method, path, init],
    useQuery: (method, path, ...[init, options, queryClient]) => {
      return useQuery(
        {
          queryKey: [method, path, init],
          queryFn: async () => {
            const mth = method.toUpperCase() as keyof typeof client;
            const fn = client[mth] as ClientMethod<Paths, typeof method, Media>;
            const { data, error } = await fn(path, init as any); // TODO: find a way to avoid as any
            if (error || !data) {
              throw error;
            }
            return data;
          },
          ...options,
        },
        queryClient,
      );
    },
    useSuspenseQuery: (method, path, ...[init, options, queryClient]) => {
      return useSuspenseQuery(
        {
          queryKey: [method, path, init],
          queryFn: async () => {
            const mth = method.toUpperCase() as keyof typeof client;
            const fn = client[mth] as ClientMethod<Paths, typeof method, Media>;
            const { data, error } = await fn(path, init as any); // TODO: find a way to avoid as any
            if (error || !data) {
              throw error;
            }
            return data;
          },
          ...options,
        },
        queryClient,
      );
    },
    useMutation: (method, path, options, queryClient) => {
      return useMutation(
        {
          mutationKey: [method, path],
          mutationFn: async (init) => {
            // TODO: Put in external fn for reusability
            const mth = method.toUpperCase() as keyof typeof client;
            const fn = client[mth] as ClientMethod<Paths, typeof method, Media>;
            const { data, error } = await fn(path, init as any); // TODO: find a way to avoid as any
            if (error || !data) {
              throw error;
            }
            return data;
          },
          ...options,
        },
        queryClient,
      );
    },
  };
}
