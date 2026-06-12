import type { MediaType } from "openapi-typescript-helpers";
import createClient from "../src/index.js";

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
export function createObservedClient<T extends {}, M extends MediaType = MediaType>(
  options?: Parameters<typeof createClient<T>>[0],
  onRequest: (input: Request) => Promise<Response> = async () => Response.json({ status: 200, message: "OK" }),
) {
  return createClient<T, M>({
    ...options,
    baseUrl: options?.baseUrl || "https://fake-api.example", // Node.js requires a domain for Request(). This restriction doesn’t exist in browsers, but we are using `e2e.test.ts` for that..
    fetch: (input) => onRequest(input),
  });
}

/**
 * Convert a Headers object to a plain object for easier comparison.
 * Uses Headers.forEach rather than Headers.entries because forEach is in base
 * lib.dom with an identical signature in both TS 5.x and 6.x, while entries
 * requires DOM.Iterable in TS 5.x.
 */
export function headersToObj(headers: Headers | Record<string, string>): Record<string, string> {
  if (!(headers instanceof Headers)) {
    return { ...headers };
  }
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}
