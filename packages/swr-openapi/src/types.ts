import type { FetchResponse, MaybeOptionalInit } from "openapi-fetch";
import type { HttpMethod, MediaType, PathsWithMethod, RequiredKeysOf } from "openapi-typescript-helpers";
import type { SWRConfiguration, SWRResponse } from "swr";

type MaybeRequired<T> = RequiredKeysOf<T> extends never ? T | undefined : T;

type TryKey<T, K extends PropertyKey> = T extends { [Key in K]?: unknown } ? T[K] : undefined;

/**
 * Provides specific types used within a given request
 */
export type TypesForRequest<
  Paths extends Record<string | number, any>,
  Method extends Extract<HttpMethod, keyof Paths[keyof Paths]>,
  Path extends PathsWithMethod<Paths, Method>,
  // ---
  Init = MaybeOptionalInit<Paths[Path], Method>,
  Params = Init extends { params?: unknown } ? Init["params"] : undefined,
  Res = FetchResponse<Paths[Path][Method], Init, MediaType>,
  Data = Extract<Res, { data: unknown }>["data"],
  Error = Extract<Res, { error: unknown }>["error"],
  PathParams = TryKey<Params, "path">,
  Query = TryKey<Params, "query">,
  Headers = TryKey<Params, "header">,
  Cookies = TryKey<Params, "cookie">,
  SWRConfig = SWRConfiguration<Data, Error>,
> = {
  Init: Init;
  Data: Data;
  Error: Error;
  Path: MaybeRequired<PathParams>;
  Query: MaybeRequired<Query>;
  Headers: MaybeRequired<Headers>;
  Cookies: Cookies;
  SWRConfig: SWRConfig;
  SWRResponse: SWRResponse<Data, Error, SWRConfig>;
};

/**
 * Provides specific types for GET requests
 *
 * Uses {@link TypesForRequest}
 */
export type TypesForGetRequest<
  Paths extends Record<string | number, any>,
  Path extends PathsWithMethod<Paths, Extract<"get", keyof Paths[keyof Paths]>>,
> = TypesForRequest<Paths, Extract<"get", keyof Paths[keyof Paths]>, Path>;
