import type { Client } from "openapi-fetch";
import type { MediaType, PathsWithMethod } from "openapi-typescript-helpers";
import { useCallback, useDebugValue } from "react";
import { type MutatorCallback, type MutatorOptions, useSWRConfig } from "swr";
import type { PartialDeep } from "type-fest";
import type { TypesForGetRequest } from "./types.js";

// Types are loose here to support ecosystem utilities like `_.isMatch`
export type CompareFn = (init: any, partialInit: any) => boolean;

/**
 * Produces a typed wrapper for [`useSWRConfig#mutate`](https://swr.vercel.app/docs/mutation).
 *
 * ```ts
 * import createClient from "openapi-fetch";
 * import { isMatch } from "lodash";
 *
 * const client = createClient();
 *
 * const useMutate = createMutateHook(client, "<unique-key>", isMatch);
 *
 * const mutate = useMutate();
 *
 * // Revalidate all keys matching this path
 * await mutate(["/pets"]);
 * await mutate(["/pets"], newData);
 * await mutate(["/pets"], undefined, { revalidate: true });
 *
 * // Revlidate all keys matching this path and this subset of options
 * await mutate(
 *   ["/pets", { query: { limit: 10 } }],
 *   newData,
 *   { revalidate: false }
 * );
 * ```
 */
export function createMutateHook<Paths extends {}, IMediaType extends MediaType>(
  client: Client<Paths, IMediaType>,
  prefix: string,
  compare: CompareFn,
) {
  return function useMutate() {
    const { mutate: swrMutate } = useSWRConfig();

    useDebugValue(prefix);

    return useCallback(
      function mutate<
        Path extends PathsWithMethod<Paths, "get">,
        R extends TypesForGetRequest<Paths, Path>,
        Init extends R["Init"],
      >(
        [path, init]: [Path, PartialDeep<Init>?],
        data?: R["Data"] | Promise<R["Data"]> | MutatorCallback<R["Data"]>,
        opts?: boolean | MutatorOptions<R["Data"]>,
      ) {
        return swrMutate<R["Data"], R["Data"]>(
          (key) => {
            if (
              // Must be array
              !Array.isArray(key) ||
              // Must have 2 or 3 elements (prefix, path, optional init)
              ![2, 3].includes(key.length)
            ) {
              return false;
            }

            const [keyPrefix, keyPath, keyOptions] = key as unknown[];

            return (
              // Matching prefix
              keyPrefix === prefix &&
              // Matching path
              keyPath === path &&
              // Matching options
              (init ? compare(keyOptions, init) : true)
            );
          },
          data,
          opts,
        );
      },
      [swrMutate, prefix, compare],
    );
  };
}
