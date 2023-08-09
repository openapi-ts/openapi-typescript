// settings & const
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};
const TRAILING_SLASH_RE = /\/*$/;

// Note: though "any" is considered bad practice in general, this library relies
// on "any" for type inference only it can give.  Same goes for the "{}" type.
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types */

/** options for each client instance */
interface ClientOptions extends RequestInit {
  /** set the common root URL for all API requests */
  baseUrl?: string;
  /** custom fetch (defaults to globalThis.fetch) */
  fetch?: typeof fetch;
  /** global querySerializer */
  querySerializer?: QuerySerializer<unknown>;
  /** global bodySerializer */
  bodySerializer?: BodySerializer<unknown>;
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
export type OkStatus = 200 | 201 | 202 | 203 | 204 | 206 | 207 | "2XX";
// prettier-ignore
export type ErrorStatus = 500 | '5XX' | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 429 | 431 | 444 | 450 | 451 | 497 | 498 | 499 | '4XX' | "default";

// util
/** Get a union of paths which have method */
export type PathsWith<Paths extends Record<string, PathItemObject>, PathnameMethod extends HttpMethod> = {
  [Pathname in keyof Paths]: Paths[Pathname] extends { [K in PathnameMethod]: any } ? Pathname : never;
}[keyof Paths];
/** Find first match of multiple keys */
export type FilterKeys<Obj, Matchers> = { [K in keyof Obj]: K extends Matchers ? Obj[K] : never }[keyof Obj];
export type MediaType = `${string}/${string}`;

// general purpose types
export type Params<T> = T extends { parameters: any } ? { params: NonNullable<T["parameters"]> } : BaseParams;
export type RequestBodyObj<T> = T extends { requestBody?: any } ? T["requestBody"] : never;
export type RequestBodyContent<T> = undefined extends RequestBodyObj<T> ? FilterKeys<NonNullable<RequestBodyObj<T>>, "content"> | undefined : FilterKeys<RequestBodyObj<T>, "content">;
export type RequestBodyMedia<T> = FilterKeys<RequestBodyContent<T>, MediaType> extends never ? FilterKeys<NonNullable<RequestBodyContent<T>>, MediaType> | undefined : FilterKeys<RequestBodyContent<T>, MediaType>;
export type RequestBody<T> = RequestBodyMedia<T> extends never ? { body?: never } : undefined extends RequestBodyMedia<T> ? { body?: RequestBodyMedia<T> } : { body: RequestBodyMedia<T> };
export type QuerySerializer<T> = (query: T extends { parameters: any } ? NonNullable<T["parameters"]["query"]> : Record<string, unknown>) => string;
export type BodySerializer<T> = (body: RequestBodyMedia<T>) => any;
export type RequestOptions<T> = Params<T> &
  RequestBody<T> & {
    querySerializer?: QuerySerializer<T>;
    bodySerializer?: BodySerializer<T>;
    parseAs?: ParseAs;
  };
export type Success<T> = FilterKeys<FilterKeys<T, OkStatus>, "content">;
export type Error<T> = FilterKeys<FilterKeys<T, ErrorStatus>, "content">;

// fetch types
export type FetchOptions<T> = RequestOptions<T> & Omit<RequestInit, "body">;
export type FetchResponse<T> =
  | { data: T extends { responses: any } ? NonNullable<FilterKeys<Success<T["responses"]>, MediaType>> : unknown; error?: never; response: Response }
  | { data?: never; error: T extends { responses: any } ? NonNullable<FilterKeys<Error<T["responses"]>, MediaType>> : unknown; response: Response };

export default function createClient<Paths extends {}>(clientOptions: ClientOptions = {}) {
  const { fetch = globalThis.fetch, querySerializer: globalQuerySerializer, bodySerializer: globalBodySerializer, ...options } = clientOptions;

  const defaultHeaders = new Headers({
    ...DEFAULT_HEADERS,
    ...(options.headers ?? {}),
  });

  async function coreFetch<P extends keyof Paths, M extends HttpMethod>(url: P, fetchOptions: FetchOptions<M extends keyof Paths[P] ? Paths[P][M] : never>): Promise<FetchResponse<M extends keyof Paths[P] ? Paths[P][M] : unknown>> {
    const { headers, body: requestBody, params = {}, parseAs = "json", querySerializer = globalQuerySerializer ?? defaultQuerySerializer, bodySerializer = globalBodySerializer ?? defaultBodySerializer, ...init } = fetchOptions || {};

    // URL
    const finalURL = createFinalURL(url as string, { baseUrl: options.baseUrl, params, querySerializer });
    const finalHeaders = mergeHeaders(defaultHeaders as any, headers as any, (params as any).header);

    // fetch!
    const requestInit: RequestInit = { redirect: "follow", ...options, ...init, headers: finalHeaders };
    if (requestBody) requestInit.body = bodySerializer(requestBody as any);
    // remove `Content-Type` if serialized body is FormData; browser will correctly set Content-Type & boundary expression
    if (requestInit.body instanceof FormData) finalHeaders.delete("Content-Type");
    const response = await fetch(finalURL, requestInit);

    // handle empty content
    // note: we return `{}` because we want user truthy checks for `.data` or `.error` to succeed
    if (response.status === 204 || response.headers.get("Content-Length") === "0") {
      return response.ok ? { data: {} as any, response } : { error: {} as any, response };
    }

    // parse response (falling back to .text() when necessary)
    if (response.ok) {
      let data: any = response.body;
      if (parseAs !== "stream") {
        const cloned = response.clone();
        data = typeof cloned[parseAs] === "function" ? await cloned[parseAs]() : await cloned.text();
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
    async GET<P extends PathsWith<Paths, "get">>(url: P, init: FetchOptions<FilterKeys<Paths[P], "get">>) {
      return coreFetch<P, "get">(url, { ...init, method: "GET" } as any);
    },
    /** Call a PUT endpoint */
    async PUT<P extends PathsWith<Paths, "put">>(url: P, init: FetchOptions<FilterKeys<Paths[P], "put">>) {
      return coreFetch<P, "put">(url, { ...init, method: "PUT" } as any);
    },
    /** Call a POST endpoint */
    async POST<P extends PathsWith<Paths, "post">>(url: P, init: FetchOptions<FilterKeys<Paths[P], "post">>) {
      return coreFetch<P, "post">(url, { ...init, method: "POST" } as any);
    },
    /** Call a DELETE endpoint */
    async DELETE<P extends PathsWith<Paths, "delete">>(url: P, init: FetchOptions<FilterKeys<Paths[P], "delete">>) {
      return coreFetch<P, "delete">(url, { ...init, method: "DELETE" } as any);
    },
    /** Call a OPTIONS endpoint */
    async OPTIONS<P extends PathsWith<Paths, "options">>(url: P, init: FetchOptions<FilterKeys<Paths[P], "options">>) {
      return coreFetch<P, "options">(url, { ...init, method: "OPTIONS" } as any);
    },
    /** Call a HEAD endpoint */
    async HEAD<P extends PathsWith<Paths, "head">>(url: P, init: FetchOptions<FilterKeys<Paths[P], "head">>) {
      return coreFetch<P, "head">(url, { ...init, method: "HEAD" } as any);
    },
    /** Call a PATCH endpoint */
    async PATCH<P extends PathsWith<Paths, "patch">>(url: P, init: FetchOptions<FilterKeys<Paths[P], "patch">>) {
      return coreFetch<P, "patch">(url, { ...init, method: "PATCH" } as any);
    },
    /** Call a TRACE endpoint */
    async TRACE<P extends PathsWith<Paths, "trace">>(url: P, init: FetchOptions<FilterKeys<Paths[P], "trace">>) {
      return coreFetch<P, "trace">(url, { ...init, method: "TRACE" } as any);
    },
  };
}

// utils

/** serialize query params to string */
export function defaultQuerySerializer<T = unknown>(q: T): string {
  const search = new URLSearchParams();
  if (q && typeof q === "object") {
    for (const [k, v] of Object.entries(q)) {
      if (v === undefined || v === null) continue;
      search.set(k, v);
    }
  }
  return search.toString();
}

/** serialize body object to string */
export function defaultBodySerializer<T>(body: T): string {
  return JSON.stringify(body);
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

/** merge headers a and b, with b taking priority */
export function mergeHeaders(...allHeaders: (Record<string, unknown> | Headers)[]): Headers {
  const headers = new Headers();
  for (const headerSet of allHeaders) {
    if (!headerSet || typeof headerSet !== "object") continue;
    const iterator = headerSet instanceof Headers ? headerSet.entries() : Object.entries(headerSet);
    for (const [k, v] of iterator) {
      if (v !== undefined && v !== null) {
        headers.set(k, v as any);
      }
    }
  }
  return headers;
}
