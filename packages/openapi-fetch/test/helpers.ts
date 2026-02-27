import type { MediaType } from "openapi-typescript-helpers";
import createClient, { type ClientOptions } from "../src/index.js";

/**
 * Create a client instance where all requests use a custom fetch implementation.
 * This avoids:
 *  - Test implementation footguns
 *  - Shared state/leakage between tests (most mocking libraries including msw)
 *  - Any additional runtime, really—it only processes what you give it
 *
 * ⚠️ YOU MUST MOCK ALL RESPONSES!
 * If you have too much going on in one handler, just make another instance. These are cheap.
 */
// Note: this isn’t called “createMockedClient” because ✨ nothing is mocked 🌈! It’s only calling the handler you pass in.
export function createObservedClient<T extends {}, M extends MediaType = MediaType, Markers extends boolean = false>(
  options?: ClientOptions,
  onRequest: (input: Request) => Promise<Response> = async () => Response.json({ status: 200, message: "OK" }),
) {
  return createClient<T, M, Markers>({
    ...options,
    baseUrl: options?.baseUrl || "https://fake-api.example", // Node.js requires a domain for Request(). This restriction doesn’t exist in browsers, but we are using `e2e.test.ts` for that..
    fetch: (input) => onRequest(input),
  });
}

/**
 * Convert a Headers object to a plain object for easier comparison
 */
export function headersToObj(headers: Headers | Record<string, string>): Record<string, string> {
  const iter =
    headers instanceof Headers
      ? headers
          // @ts-expect-error FIXME: this is a missing "lib" in tsconfig.json but dunno what
          .entries()
      : Object.entries(headers);
  const result: Record<string, string> = {};
  for (const [k, v] of iter) {
    result[k] = v;
  }
  return result;
}
