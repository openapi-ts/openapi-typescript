import type { Client } from "openapi-fetch";
import type { MediaType, PathsWithMethod } from "openapi-typescript-helpers";
import useSWRInfinite, {
  type SWRInfiniteConfiguration,
  type SWRInfiniteFetcher,
  type SWRInfiniteKeyLoader,
} from "swr/infinite";
import type { TypesForGetRequest } from "./types.js";
import { useCallback, useDebugValue } from "react";

/**
 * Produces a typed wrapper for [`useSWRInfinite`](https://swr.vercel.app/docs/pagination#useswrinfinite).
 *
 * ```ts
 * import createClient from "openapi-fetch";
 * const client = createClient();
 *
 * const useInfinite = createInfiniteHook(client, "<unique-key>");
 *
 * useInfinite("/pets", (index, previousPage) => {
 *   if (previousPage && !previousPage.hasMore) {
 *     return null;
 *   }
 *
 *   return {
 *     params: {
 *       query: {
 *         limit: 10,
 *         offset: index * 10,
 *       },
 *     },
 *   };
 * });
 * ```
 */
export function createInfiniteHook<
  Paths extends {},
  IMediaType extends MediaType,
  Prefix extends string,
  FetcherError = never,
>(client: Client<Paths, IMediaType>, prefix: Prefix) {
  return function useInfinite<
    Path extends PathsWithMethod<Paths, "get">,
    R extends TypesForGetRequest<Paths, Path>,
    Init extends R["Init"],
    Data extends R["Data"],
    Error extends R["Error"] | FetcherError,
    Config extends SWRInfiniteConfiguration<Data, Error>,
  >(path: Path, getInit: SWRInfiniteKeyLoader<Data, Init | null>, config?: Config) {
    type Key = [Prefix, Path, Init | undefined] | null;
    type KeyLoader = SWRInfiniteKeyLoader<Data, Key>;

    useDebugValue(`${prefix} - ${path as string}`);

    const fetcher: SWRInfiniteFetcher<Data, KeyLoader> = useCallback(
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

    const getKey: KeyLoader = (index, previousPageData) => {
      const init = getInit(index, previousPageData);
      if (init === null) {
        return null;
      }
      const key: Key = [prefix, path, init];
      return key;
    };

    return useSWRInfinite<Data, Error, KeyLoader>(getKey, fetcher, config);
  };
}
