import type { Client } from "openapi-fetch";
import type { HttpMethod, MediaType, PathsWithMethod } from "openapi-typescript-helpers";
import useSWRMutation, { type SWRMutationConfiguration, type SWRMutationResponse } from "swr/mutation";
import type { TypesForRequest } from "./types.js";
import { useMemo } from "react";

/**
 * Produces a typed wrapper for [`useSWRMutation`](https://swr.vercel.app/docs/mutation).
 *
 * ```ts
 * import createClient from "openapi-fetch";
 * import type { paths } from "./my-openapi-3-schema"; // generated types
 *
 * const client = createClient<paths>({ baseUrl: "https://my-api.com" });
 * const useMutation = createMutationHook(client, "my-api");
 *
 * function MyComponent() {
 *   const { trigger, data, isMutating } = useMutation("/users", "post");
 *
 *   return (
 *     <button
 *       disabled={isMutating}
 *       onClick={() => {
 *         trigger({ body: { name: "New User" } });
 *       }}
 *     >
 *       Create User
 *     </button>
 *   );
 * }
 * ```
 */
export function createMutationHook<Paths extends {}, IMediaType extends MediaType>(
  client: Client<Paths, IMediaType>,
  prefix: string,
) {
  return function useMutation<
    Method extends Extract<HttpMethod, keyof Paths[keyof Paths]>,
    Path extends PathsWithMethod<Paths, Method>,
    T extends TypesForRequest<Paths, Method, Path> = TypesForRequest<Paths, Method, Path>,
    Data = T["Data"],
    Error = T["Error"],
    Init = T["Init"],
  >(
    path: Path,
    method: Method,
    init: Init | null,
    config?: SWRMutationConfiguration<Data, Error, readonly [string, Path, Init], Init>,
  ): SWRMutationResponse<Data, Error, readonly [string, Path, Init], Init> {
    const key = useMemo(() => (init !== null ? ([prefix, path, init] as const) : null), [prefix, path, init]);

    return useSWRMutation(
      key,
      async (_key, { arg }) => {
        const m = method.toUpperCase() as Uppercase<Method>;

        const res = await (client as any)[m](path, arg);
        if (res.error) {
          throw res.error;
        }
        return res.data;
      },
      config,
    );
  };
}
