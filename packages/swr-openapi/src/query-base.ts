import type { Client } from "openapi-fetch";
import type {HttpMethod, MediaType, PathsWithMethod, RequiredKeysOf} from "openapi-typescript-helpers";
import { useCallback, useDebugValue, useMemo } from "react";
import type { Fetcher, SWRHook } from "swr";
import type { Exact } from "type-fest";
import type { TypesForRequest } from "./types.js";

export type DataHttpMethod = Extract<HttpMethod, "get" | "post" | "put">;

/**
 * @private
 */
export function configureBaseQueryHook(useHook: SWRHook) {
  return function createQueryBaseHook<
    Paths extends {},
    IMediaType extends MediaType,
    Prefix extends string,
    FetcherError = never,
  >(client: Client<Paths, IMediaType>, prefix: Prefix) {
    return function useQuery<
      Path extends PathsWithMethod<Paths, M>,
      R extends TypesForRequest<Paths, Extract<M, keyof Paths[keyof Paths]>, Path>,
      Init extends Exact<R["Init"], Init>,
      Data extends R["Data"],
      Error extends R["Error"] | FetcherError,
      Config extends R["SWRConfig"],
      M extends DataHttpMethod = "get",
    >(
      path: Path,
      ...[init, config]: RequiredKeysOf<Init> extends never
        ? [((Init & { method?: M }) | null)?, Config?]
        : [(Init & { method?: M }) | null, Config?]
    ) {
      useDebugValue(`${prefix} - ${path as string}`);

      const key = useMemo(
        () => (init !== null ? ([prefix, path, init] as const) : null), // @ts-ignore
        [prefix, path, init],
      );

      type Key = typeof key;

      const fetcher: Fetcher<Data, Key> = useCallback(
        async ([, path, init]) => {
          // runtime method default to 'get'
          const method = ((init as any)?.method ?? "get") as HttpMethod;
          const fn = client[method.toUpperCase() as Uppercase<HttpMethod>] as any;
          if (!fn) {
            throw new Error(`Unsupported method: ${method}`);
          }

          const res = await fn(path, init);
          if (res.error) {
            throw res.error;
          }
          return res.data as Data;
        },
        [client],
      );

      // @ts-expect-error TODO: Improve internal config types
      return useHook<Data, Error, Key>(key, fetcher, config);
    };
  };
}
