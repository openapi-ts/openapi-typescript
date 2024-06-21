import {
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
  UseSuspenseQueryOptions,
  UseSuspenseQueryResult,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import {
  ClientMethod,
  FetchResponse,
  MaybeOptionalInit,
  OpenapiClient,
} from "openapi-fetch";
import {
  HasRequiredKeys,
  HttpMethod,
  MediaType,
  PathsWithMethod,
} from "openapi-typescript-helpers";

export type UseQueryMethod<
  Paths extends Record<string, Record<HttpMethod, {}>>,
  Media extends MediaType,
> = {
  <
    Method extends HttpMethod,
    Path extends PathsWithMethod<Paths, Method>,
    Init extends MaybeOptionalInit<Paths[Path], Method>,
    Response extends Required<FetchResponse<Paths[Path][Method], Init, Media>>, // note: Required is used to avoid repeating NonNullable in UseQuery types
    Options extends Omit<
      UseQueryOptions<Response["data"], Response["error"]>,
      "queryKey" | "queryFn"
    >,
  >(
    method: Method,
    url: Path,
    ...[init, options]: HasRequiredKeys<Init> extends never
      ? [(Init & { [key: string]: unknown })?, Options?]
      : [Init & { [key: string]: unknown }, Options?]
  ): UseQueryResult<Response["data"], Response["error"]>;
};

export type UseSuspenseQueryMethod<
  Paths extends Record<string, Record<HttpMethod, {}>>,
  Media extends MediaType,
> = {
  <
    Method extends HttpMethod,
    Path extends PathsWithMethod<Paths, Method>,
    Init extends MaybeOptionalInit<Paths[Path], Method>,
    Response extends Required<FetchResponse<Paths[Path][Method], Init, Media>>, // note: Required is used to avoid repeating NonNullable in UseQuery types
    Options extends Omit<
      UseSuspenseQueryOptions<Response["data"], Response["error"]>,
      "queryKey" | "queryFn"
    >,
  >(
    method: Method,
    url: Path,
    ...[init, options]: HasRequiredKeys<Init> extends never
      ? [(Init & { [key: string]: unknown })?, Options?]
      : [Init & { [key: string]: unknown }, Options?]
  ): UseSuspenseQueryResult<Response["data"], Response["error"]>;
};

export type UseMutationMethod<
  Paths extends Record<string, Record<HttpMethod, {}>>,
  Media extends MediaType,
> = {
  <
    Method extends HttpMethod,
    Path extends PathsWithMethod<Paths, Method>,
    Init extends MaybeOptionalInit<Paths[Path], Method>,
    Response extends Required<FetchResponse<Paths[Path][Method], Init, Media>>, // note: Required is used to avoid repeating NonNullable in UseQuery types
    Options extends Omit<
      UseMutationOptions<Response["data"], Response["error"], Init>,
      "mutationKey" | "mutationFn"
    >,
  >(
    method: Method,
    url: Path,
    options?: Options,
    // TODO: Add support for Partial request options that become optional in UseMutationResult Context
  ): UseMutationResult<Response["data"], Response["error"], Init>;
};

export interface OpenapiQueryClient<
  Paths extends {},
  Media extends MediaType = MediaType,
> {
  useQuery: UseQueryMethod<Paths, Media>;
  useSuspenseQery: any;
  useMutation: UseMutationMethod<Paths, Media>;
}

export default function createClient<
  Paths extends {},
  Media extends MediaType = MediaType,
>(client: OpenapiClient<Paths, Media>): OpenapiQueryClient<Paths, Media> {
  return {
    useQuery: (method, path, ...[init, options]) => {
      return useQuery({
        queryKey: [method, path, init],
        queryFn: async () => {
          const mth = method.toUpperCase() as keyof typeof client;
          const fn = client[mth] as ClientMethod<Paths, typeof method, Media>;
          const { data, error } = await fn(path, init as any); // TODO: find a way to avoid as any
          if (error || !data) throw error;
          return data;
        },
        ...options,
      });
    },
    useSuspenseQery: () => {},
    useMutation: (method, path, options) => {
      return useMutation({
        mutationKey: [method, path],
        mutationFn: async (init) => {
          const mth = method.toUpperCase() as keyof typeof client;
          const fn = client[mth] as ClientMethod<Paths, typeof method, Media>;
          const { data, error } = await fn(path, init as any); // TODO: find a way to avoid as any
          if (error || !data) throw error;
          return data;
        },
        ...options,
      });
    },
  };
}
