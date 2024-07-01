import {
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult,
  type UseSuspenseQueryOptions,
  type UseSuspenseQueryResult,
  useMutation,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import type { ClientMethod, FetchResponse, MaybeOptionalInit, Client as FetchClient } from "openapi-fetch";
import type { HasRequiredKeys, HttpMethod, MediaType, PathsWithMethod } from "openapi-typescript-helpers";

export type UseQueryMethod<Paths extends Record<string, Record<HttpMethod, {}>>, Media extends MediaType> = <
  Method extends HttpMethod,
  Path extends PathsWithMethod<Paths, Method>,
  Init extends MaybeOptionalInit<Paths[Path], Method>,
  Response extends Required<FetchResponse<Paths[Path][Method], Init, Media>>, // note: Required is used to avoid repeating NonNullable in UseQuery types
  Options extends Omit<UseQueryOptions<Response["data"], Response["error"]>, "queryKey" | "queryFn">,
>(
  method: Method,
  url: Path,
  ...[init, options]: HasRequiredKeys<Init> extends never
    ? [(Init & { [key: string]: unknown })?, Options?]
    : [Init & { [key: string]: unknown }, Options?]
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
  ...[init, options]: HasRequiredKeys<Init> extends never
    ? [(Init & { [key: string]: unknown })?, Options?]
    : [Init & { [key: string]: unknown }, Options?]
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
) => UseMutationResult<Response["data"], Response["error"], Init>;

export interface OpenapiQueryClient<Paths extends {}, Media extends MediaType = MediaType> {
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
    useQuery: (method, path, ...[init, options]) => {
      return useQuery({
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
      });
    },
    useSuspenseQuery: (method, path, ...[init, options]) => {
      return useSuspenseQuery({
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
      });
    },
    useMutation: (method, path, options) => {
      return useMutation({
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
      });
    },
  };
}
