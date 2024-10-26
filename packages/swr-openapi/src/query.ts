import useSWR from "swr";
import { configureBaseQueryHook } from "./query-base.js";

/**
 * Produces a typed wrapper for [`useSWR`](https://swr.vercel.app/docs/api).
 *
 * ```ts
 * import createClient from "openapi-fetch";
 *
 * const client = createClient();
 *
 * const useQuery = createQueryHook(client, "<unique-key>");
 *
 * // Fetch the query
 * useQuery("/pets");
 *
 * // Skip the query
 * useQuery("/pets", null);
 *
 * // Fetch the query with parameters
 * useQuery("/pets", {
 *   params: { query: { limit: 10 } }
 * });
 *
 * // Fetch the query with parameters and SWR configuration
 * useQuery(
 *   "/pets",
 *   { params: { query: { limit: 10 } } },
 *   { errorRetryCount: 2 },
 * );
 *
 * // Fetch the query with no parameters and SWR configuration
 * useQuery(
 *   "/pets",
 *   {},
 *   { errorRetryCount: 2 },
 * );
 * ```
 */
export const createQueryHook = configureBaseQueryHook(useSWR);
