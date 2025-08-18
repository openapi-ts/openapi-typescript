import type { Client } from "openapi-fetch";
import type { MediaType, PathsWithMethod, RequiredKeysOf } from "openapi-typescript-helpers";
import type { Fetcher, SWRHook } from "swr";
import type { TypesForGetRequest } from "./types.js";
import { useCallback, useDebugValue, useMemo } from "react";
import type { Exact } from "type-fest";

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
      Path extends PathsWithMethod<Paths, "get">,
      R extends TypesForGetRequest<Paths, Path>,
      Init extends Exact<R["Init"], Init>,
      Data extends R["Data"],
      Error extends R["Error"] | FetcherError,
      Config extends R["SWRConfig"],
    >(
      path: Path,
      ...[init, config]: RequiredKeysOf<Init> extends never ? [(Init | null)?, Config?] : [Init | null, Config?]
    ) {
      useDebugValue(`${prefix} - ${path as string}`);

      const key = useMemo(() => (init !== null ? ([prefix, path, init] as const) : null), [prefix, path, init]);

      type Key = typeof key;

      // TODO: Lift up fetcher to and remove useCallback
      const fetcher: Fetcher<Data, Key> = useCallback(
        async ([_, path, init]) => {
          // @ts-expect-error TODO: Improve internal init types
          const res = await client.GET(path, init);
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
