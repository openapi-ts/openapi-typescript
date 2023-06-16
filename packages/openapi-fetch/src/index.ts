// settings & const
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};
const TRAILING_SLASH_RE = /\/*$/;

/** options for each client instance */
interface ClientOptions extends RequestInit {
  /** set the common root URL for all API requests */
  baseUrl?: string;
  /** custom fetch (defaults to globalThis.fetch) */
  fetch?: typeof fetch;
}
export interface BaseParams {
  params?: { query?: Record<string, unknown> };
}

// const

export type PathItemObject = { [M in HttpMethod]: OperationObject } & { parameters?: any };
export type ParseAs = "json" | "text" | "blob" | "arrayBuffer" | "stream";
export interface OperationObject {
  parameters: any;
  requestBody: any; // note: "any" will get overridden in inference
  responses: any;
}
export type HttpMethod = "get" | "put" | "post" | "delete" | "options" | "head" | "patch" | "trace";
export type OkStatus = 200 | 201 | 202 | 203 | 204 | 206 | 207;
// prettier-ignore
export type ErrorStatus = 500 | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 429 | 431 | 444 | 450 | 451 | 497 | 498 | 499 | "default";

// util
/** Get a union of paths which have method */
export type PathsWith<Paths extends Record<string, PathItemObject>, PathnameMethod extends HttpMethod> = {
  [Pathname in keyof Paths]: Paths[Pathname] extends { [K in PathnameMethod]: any } ? Pathname : never;
}[keyof Paths];
/** Find first match of multiple keys */
export type FilterKeys<Obj, Matchers> = { [K in keyof Obj]: K extends Matchers ? Obj[K] : never }[keyof Obj];
/** handle "application/json", "application/vnd.api+json", "appliacation/json;charset=utf-8" and more */
export type JSONLike = `${string}json${string}`;

// general purpose types
export type Params<O> = O extends { parameters: any } ? { params: NonNullable<O["parameters"]> } : BaseParams;
export type RequestBodyObj<O> = O extends { requestBody?: any } ? O["requestBody"] : never;
export type RequestBodyContent<O> = undefined extends RequestBodyObj<O> ? FilterKeys<NonNullable<RequestBodyObj<O>>, "content"> | undefined : FilterKeys<RequestBodyObj<O>, "content">;
export type RequestBodyJSON<O> = FilterKeys<RequestBodyContent<O>, JSONLike> extends never ? FilterKeys<NonNullable<RequestBodyContent<O>>, JSONLike> | undefined : FilterKeys<RequestBodyContent<O>, JSONLike>;
export type RequestBody<O> = undefined extends RequestBodyJSON<O> ? { body?: RequestBodyJSON<O> } : { body: RequestBodyJSON<O> };
export type QuerySerializer<O> = (query: O extends { parameters: any } ? NonNullable<O["parameters"]["query"]> : Record<string, unknown>) => string;
export type RequestOptions<T> = Params<T> & RequestBody<T> & { querySerializer?: QuerySerializer<T>; parseAs?: ParseAs };
export type Success<O> = FilterKeys<FilterKeys<O, OkStatus>, "content">;
export type Error<O> = FilterKeys<FilterKeys<O, ErrorStatus>, "content">;

// fetch types
export type FetchOptions<T> = RequestOptions<T> & Omit<RequestInit, "body">;
export type FetchResponse<T> =
  | { data: T extends { responses: any } ? NonNullable<FilterKeys<Success<T["responses"]>, JSONLike>> : unknown; error?: never; response: Response }
  | { data?: never; error: T extends { responses: any } ? NonNullable<FilterKeys<Error<T["responses"]>, JSONLike>> : unknown; response: Response };

/** Call URLSearchParams() on the object, but remove `undefined` and `null` params */
export function defaultSerializer(q: unknown): string {
  const search = new URLSearchParams();
  if (q && typeof q === "object") {
    for (const [k, v] of Object.entries(q)) {
      if (v === undefined || v === null) continue;
      search.set(k, String(v));
    }
  }
  return search.toString();
}

/** Construct URL string from baseUrl and handle path and query params */
export function createFinalURL<O>(url: string, options: { baseUrl?: string; params: { query?: Record<string, unknown>; path?: Record<string, unknown> }; querySerializer: QuerySerializer<O> }): string {
  let finalURL = `${options.baseUrl ? options.baseUrl.replace(TRAILING_SLASH_RE, "") : ""}${url as string}`;
  if (options.params.path) {
    for (const [k, v] of Object.entries(options.params.path)) finalURL = finalURL.replace(`{${k}}`, encodeURIComponent(String(v)));
  }
  if (options.params.query) {
    const search = options.querySerializer(options.params.query as any);
    if (search) finalURL += `?${search}`;
  }
  return finalURL;
}

export default function createClient<Paths extends {}>(clientOptions: ClientOptions = {}) {
  const { fetch = globalThis.fetch, ...options } = clientOptions;

  const defaultHeaders = new Headers({
    ...DEFAULT_HEADERS,
    ...(options.headers ?? {}),
  });

  async function coreFetch<P extends keyof Paths, M extends HttpMethod>(url: P, fetchOptions: FetchOptions<M extends keyof Paths[P] ? Paths[P][M] : never>): Promise<FetchResponse<M extends keyof Paths[P] ? Paths[P][M] : unknown>> {
    const { headers, body: requestBody, params = {}, parseAs = "json", querySerializer = defaultSerializer, ...init } = fetchOptions || {};

    // URL
    const finalURL = createFinalURL(url as string, { baseUrl: options.baseUrl, params, querySerializer });

    // headers
    const baseHeaders = new Headers(defaultHeaders); // clone defaults (don’t overwrite!)
    const headerOverrides = new Headers(headers);
    for (const [k, v] of headerOverrides.entries()) {
      if (v === undefined || v === null) baseHeaders.delete(k); // allow `undefined` | `null` to erase value
      else baseHeaders.set(k, v);
    }

    // fetch!
    const response = await fetch(finalURL, {
      redirect: "follow",
      ...options,
      ...init,
      headers: baseHeaders,
      body: typeof requestBody === "string" ? requestBody : JSON.stringify(requestBody),
    });

    // handle empty content
    // note: we return `{}` because we want user truthy checks for `.data` or `.error` to succeed
    if (response.status === 204 || response.headers.get("Content-Length") === "0") {
      return response.ok ? { data: {} as any, response } : { error: {} as any, response };
    }

    // parse response (falling back to .text() when necessary)
    if (response.ok) {
      let data: any = response.body;
      if (parseAs !== "stream") {
        try {
          data = await response.clone()[parseAs]();
        } catch {
          data = await response.clone().text();
        }
      }
      return { data, response };
    }

    // handle errors (always parse as .json() or .text())
    let error: any = {};
    try {
      error = await response.clone().json();
    } catch {
      error = await response.clone().text();
    }
    return { error, response };
  }

  return {
    /** Call a GET endpoint */
    async get<P extends PathsWith<Paths, "get">>(url: P, init: FetchOptions<FilterKeys<Paths[P], "get">>) {
      return coreFetch<P, "get">(url, { ...init, method: "GET" } as any);
    },
    /** Call a PUT endpoint */
    async put<P extends PathsWith<Paths, "put">>(url: P, init: FetchOptions<FilterKeys<Paths[P], "put">>) {
      return coreFetch<P, "put">(url, { ...init, method: "PUT" } as any);
    },
    /** Call a POST endpoint */
    async post<P extends PathsWith<Paths, "post">>(url: P, init: FetchOptions<FilterKeys<Paths[P], "post">>) {
      return coreFetch<P, "post">(url, { ...init, method: "POST" } as any);
    },
    /** Call a DELETE endpoint */
    async del<P extends PathsWith<Paths, "delete">>(url: P, init: FetchOptions<FilterKeys<Paths[P], "delete">>) {
      return coreFetch<P, "delete">(url, { ...init, method: "DELETE" } as any);
    },
    /** Call a OPTIONS endpoint */
    async options<P extends PathsWith<Paths, "options">>(url: P, init: FetchOptions<FilterKeys<Paths[P], "options">>) {
      return coreFetch<P, "options">(url, { ...init, method: "OPTIONS" } as any);
    },
    /** Call a HEAD endpoint */
    async head<P extends PathsWith<Paths, "head">>(url: P, init: FetchOptions<FilterKeys<Paths[P], "head">>) {
      return coreFetch<P, "head">(url, { ...init, method: "HEAD" } as any);
    },
    /** Call a PATCH endpoint */
    async patch<P extends PathsWith<Paths, "patch">>(url: P, init: FetchOptions<FilterKeys<Paths[P], "patch">>) {
      return coreFetch<P, "patch">(url, { ...init, method: "PATCH" } as any);
    },
    /** Call a TRACE endpoint */
    async trace<P extends PathsWith<Paths, "trace">>(url: P, init: FetchOptions<FilterKeys<Paths[P], "trace">>) {
      return coreFetch<P, "trace">(url, { ...init, method: "TRACE" } as any);
    },
  };
}
