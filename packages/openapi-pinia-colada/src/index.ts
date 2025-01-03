import { type MaybeRef, unref } from "vue";
import {
  type UseMutationOptions,
  type UseMutationReturn,
  type UseQueryOptions,
  type UseQueryReturn,
  useMutation as piniaColadaUseMutation,
  useQuery as piniaColadaUseQuery,
} from "@pinia/colada";
import type { ClientMethod, FetchResponse, MaybeOptionalInit, Client as FetchClient } from "openapi-fetch";
import type { HttpMethod, MediaType, PathsWithMethod, RequiredKeysOf } from "openapi-typescript-helpers";

type InitWithUnknowns<Init> = Init & { [key: string]: unknown };

export const useQuery = <
  Method extends HttpMethod,
  Paths extends Record<string, Record<HttpMethod, {}>>,
  Media extends MediaType,
  Path extends PathsWithMethod<Paths, Method>,
  Init extends MaybeOptionalInit<Paths[Path], Method>,
  Response extends Required<FetchResponse<Paths[Path][Method], Init, Media>>,
  Options extends Omit<UseQueryOptions<Response["data"], Response["error"], Response["data"]>, "key" | "query">,
>(
  fetchClient: MaybeRef<FetchClient<Paths, Media>>,
  method: MaybeRef<Method>,
  url: MaybeRef<PathsWithMethod<Paths, Method>>,
  ...[init, options]: RequiredKeysOf<Init> extends never
    ? [MaybeRef<InitWithUnknowns<Init>>?, MaybeRef<Options>?]
    : [MaybeRef<InitWithUnknowns<Init>>, MaybeRef<Options>?]
): UseQueryReturn<Response["data"], Response["error"], Init> => {
  const fetchClientValue = unref(fetchClient);
  const methodValue = unref(method);
  const urlValue = unref(url);
  const initValue = unref(init);
  const optionsValue = unref(options);
  const mth = methodValue.toUpperCase() as Uppercase<typeof methodValue>;
  const fn = fetchClientValue[mth] as ClientMethod<Paths, typeof method, Media>;

  return piniaColadaUseQuery({
    key: [methodValue, urlValue as string, initValue as InitWithUnknowns<typeof initValue>],
    query: () => fn(urlValue, optionsValue),
    ...optionsValue,
  });
};

export const useMutation = <
  Method extends HttpMethod,
  Paths extends Record<string, Record<HttpMethod, {}>>,
  Media extends MediaType,
  Path extends PathsWithMethod<Paths, Method>,
  Init extends MaybeOptionalInit<Paths[Path], Method>,
  Response extends Required<FetchResponse<Paths[Path][Method], Init, Media>>, // note: Required is used to avoid repeating NonNullable in UseQuery types
  Options extends Omit<UseMutationOptions<Response["data"], Response["error"], Init>, "key" | "mutation">,
  Vars,
>(
  fetchClient: MaybeRef<FetchClient<Paths, Media>>,
  method: MaybeRef<Method>,
  url: MaybeRef<PathsWithMethod<Paths, Method>>,
  options?: Options,
): UseMutationReturn<Response["data"], Vars, Response["error"]> => {
  const fetchClientValue = unref(fetchClient);
  const methodValue = unref(method);
  const urlValue = unref(url);
  const optionsValue = unref(options);
  const mth = methodValue.toUpperCase() as Uppercase<typeof methodValue>;
  const fn = fetchClientValue[mth] as ClientMethod<Paths, typeof method, Media>;

  return piniaColadaUseMutation({ mutation: () => fn(urlValue, optionsValue), ...optionsValue });
};
