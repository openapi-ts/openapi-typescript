// settings
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

/** Options for each client instance */
interface ClientOptions extends RequestInit {
  /** Set the common root URL for all API requests */
  baseUrl?: string;
  /** Custom fetch (defaults to globalThis.fetch) */
  fetch?: typeof fetch;
}

export interface BaseParams {
  params?: { query?: Record<string, unknown> };
}

// General purpose types
export type HttpMethod = "get" | "put" | "post" | "delete" | "options" | "head" | "patch" | "trace";
export type OkStatus = 200 | 201 | 202 | 203 | 204 | 206 | 207;
export type ErrorStatus =
  | 500
  | 400
  | 401
  | 402
  | 403
  | 404
  | 405
  | 406
  | 407
  | 408
  | 409
  | 410
  | 411
  | 412
  | 413
  | 414
  | 415
  | 416
  | 417
  | 418
  | 420
  | 421
  | 422
  | 423
  | 424
  | 425
  | 426
  | 429
  | 431
  | 444
  | 450
  | 451
  | 497
  | 498
  | 499
  | "default";

// Utility types
/** Get a union of paths which have a specific HTTP method */
export type PathsWithMethod<Paths extends Record<string, PathItemObject>, Method extends HttpMethod> = {
  [Pathname in keyof Paths]: Paths[Pathname] extends Record<Method, any> ? Pathname : never;
}[keyof Paths];

/** Find first match of multiple keys */
export type FilterKeys<Obj, Matchers> = { [K in keyof Obj]: K extends Matchers ? Obj[K] : never }[keyof Obj];

// Fetch types
export type FetchOptions<T> = RequestOptions<T> & Omit<RequestInit, "body">;
export type FetchResponse<T> =
  | {
      data: T extends { responses: any } ? NonNullable<FilterKeys<Success<T["responses"]>, JSONLike>> : unknown;
      error?: never;
      response: Response;
    }
  | {
      data?: never;
      error: T extends { responses: any } ? NonNullable<FilterKeys<Error<T["responses"]>, JSONLike>> : unknown;
      response: Response;
    };

export default function createClient<Paths extends {}>(clientOptions: ClientOptions = {}) {
  const { fetch = globalThis.fetch, ...options } = clientOptions;

  const defaultHeaders = new Headers({
    ...DEFAULT_HEADERS,
    ...(options.headers ?? {}),
  });

  async function coreFetch<P extends keyof Paths, M extends HttpMethod>(
    url: P,
    fetchOptions: FetchOptions<M extends keyof Paths[P] ? Paths[P][M] : never>
  ): Promise<FetchResponse<M extends keyof Paths[P] ? Paths[P][M] : unknown>> {
    const { headers, body: requestBody, params = {}, querySerializer = defaultQuerySerializer, ...init } = fetchOptions || {};

    // URL
    let finalURL = `${options.baseUrl ?? ""}${url as string}`;
    if (params.path) {
      for (const [k, v] of Object.entries(params.path)) finalURL = finalURL.replace(`{${k}}`, encodeURIComponent(String(v)));
    }
    if (params.query && Object.keys(params.query).length) {
      finalURL += `?${querySerializer(params.query)}`;
    }

    // Headers
    const baseHeaders = new Headers(defaultHeaders);
    const headerOverrides = new Headers(headers);
    for (const [k, v] of headerOverrides.entries()) {
      if (v === undefined || v === null) {
        baseHeaders.delete(k);
      } else {
        baseHeaders.set(k, v);
      }
    }

    // Fetch!
    const response = await fetch(finalURL, {
      redirect: "follow",
      ...options,
      ...init,
      headers: baseHeaders,
      body: typeof requestBody === "string" ? requestBody : JSON.stringify(requestBody),
    });

    // Don't parse JSON if status is 204 or Content-Length is '0'
    const body = response.status === 204 || response.headers.get("Content-Length") === "0" ? {} : await response.json();
    return response.ok ? { data: body, response } : { error: body, response };
  }

  const defaultQuerySerializer: QuerySerializer<any> = (query) => new URLSearchParams(query as any).toString();

  // HTTP method functions
  function createMethodFunction<P extends PathsWithMethod<Paths, Method>, Method extends HttpMethod>(method: Method) {
    return async function <T extends FilterKeys<Paths[P], Method>>(
      url: P,
      init: FetchOptions<FilterKeys<Paths[P], Method>>
    ): Promise<FetchResponse<FilterKeys<Paths[P], Method>>> {
      return coreFetch<P, Method>(url, { ...init, method } as any);
    };
  }

  return {
    get: createMethodFunction<PathsWithMethod<Paths, "get">, "get">("get"),
    put: createMethodFunction<PathsWithMethod<Paths, "put">, "put">("put"),
    post: createMethodFunction<PathsWithMethod<Paths, "post">, "post">("post"),
    del: createMethodFunction<PathsWithMethod<Paths, "delete">, "delete">("delete"),
    options: createMethodFunction<PathsWithMethod<Paths, "options">, "options">("options"),
    head: createMethodFunction<PathsWithMethod<Paths, "head">, "head">("head"),
    patch: createMethodFunction<PathsWithMethod<Paths, "patch">, "patch">("patch"),
    trace: createMethodFunction<PathsWithMethod<Paths, "trace">, "trace">("trace"),
  };
}
