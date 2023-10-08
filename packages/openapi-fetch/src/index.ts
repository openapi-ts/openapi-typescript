import type {
  ErrorResponse,
  HttpMethod,
  SuccessResponse,
  FilterKeys,
  MediaType,
  PathsWithMethod,
  ResponseObjectMap,
  OperationRequestBodyContent,
  HasRequiredKeys,
} from "openapi-typescript-helpers";

// settings & const
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

// Note: though "any" is considered bad practice in general, this library relies
// on "any" for type inference only it can give.  Same goes for the "{}" type.
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types */

/** options for each client instance */
interface ClientOptions extends Omit<RequestInit, "headers"> {
  /** set the common root URL for all API requests */
  baseUrl?: string;
  /** custom fetch (defaults to globalThis.fetch) */
  fetch?: typeof fetch;
  /** global querySerializer */
  querySerializer?: QuerySerializer<unknown>;
  /** global bodySerializer */
  bodySerializer?: BodySerializer<unknown>;
  // headers override to make typing friendlier
  headers?: HeadersOptions;
}

export type HeadersOptions =
  | HeadersInit
  | Record<string, string | number | boolean | null | undefined>;

export type QuerySerializer<T> = (
  query: T extends { parameters: any }
    ? NonNullable<T["parameters"]["query"]>
    : Record<string, unknown>,
) => string;

export type BodySerializer<T> = (body: OperationRequestBodyContent<T>) => any;

export type ParseAs = "json" | "text" | "blob" | "arrayBuffer" | "stream";

export interface DefaultParamsOption {
  params?: { query?: Record<string, unknown> };
}

export type ParamsOption<T> = T extends { parameters: any }
  ? HasRequiredKeys<T["parameters"]> extends never
    ? { params?: T["parameters"] }
    : { params: T["parameters"] }
  : DefaultParamsOption;
// v7 breaking change: TODO uncomment for openapi-typescript@7 support
// : never;

export type RequestBodyOption<T> = OperationRequestBodyContent<T> extends never
  ? { body?: never }
  : undefined extends OperationRequestBodyContent<T>
  ? { body?: OperationRequestBodyContent<T> }
  : { body: OperationRequestBodyContent<T> };

export type FetchOptions<T> = RequestOptions<T> & Omit<RequestInit, "body">;

export type FetchResponse<T> =
  | {
      data: FilterKeys<SuccessResponse<ResponseObjectMap<T>>, MediaType>;
      error?: never;
      response: Response;
    }
  | {
      data?: never;
      error: FilterKeys<ErrorResponse<ResponseObjectMap<T>>, MediaType>;
      response: Response;
    };

export type RequestOptions<T> = ParamsOption<T> &
  RequestBodyOption<T> & {
    querySerializer?: QuerySerializer<T>;
    bodySerializer?: BodySerializer<T>;
    parseAs?: ParseAs;
    fetch?: ClientOptions["fetch"];
  };

export default function createClient<Paths extends {}>(
  clientOptions: ClientOptions = {},
) {
  const {
    fetch: baseFetch = globalThis.fetch,
    querySerializer: globalQuerySerializer,
    bodySerializer: globalBodySerializer,
    ...options
  } = clientOptions;
  let baseUrl = options.baseUrl ?? "";
  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1); // remove trailing slash
  }

  async function coreFetch<P extends keyof Paths, M extends HttpMethod>(
    url: P,
    fetchOptions: FetchOptions<M extends keyof Paths[P] ? Paths[P][M] : never>,
  ): Promise<FetchResponse<M extends keyof Paths[P] ? Paths[P][M] : unknown>> {
    const {
      fetch = baseFetch,
      headers,
      body: requestBody,
      params = {},
      parseAs = "json",
      querySerializer = globalQuerySerializer ?? defaultQuerySerializer,
      bodySerializer = globalBodySerializer ?? defaultBodySerializer,
      ...init
    } = fetchOptions || {};

    // URL
    const finalURL = createFinalURL(url as string, {
      baseUrl,
      params,
      querySerializer,
    });
    const finalHeaders = mergeHeaders(
      DEFAULT_HEADERS,
      clientOptions?.headers,
      headers,
      (params as any).header,
    );

    // fetch!
    const requestInit: RequestInit = {
      redirect: "follow",
      ...options,
      ...init,
      headers: finalHeaders,
    };
    if (requestBody) {
      requestInit.body = bodySerializer(requestBody as any);
    }
    // remove `Content-Type` if serialized body is FormData; browser will correctly set Content-Type & boundary expression
    if (requestInit.body instanceof FormData) {
      finalHeaders.delete("Content-Type");
    }
    const response = await fetch(finalURL, requestInit);

    // handle empty content
    // note: we return `{}` because we want user truthy checks for `.data` or `.error` to succeed
    if (
      response.status === 204 ||
      response.headers.get("Content-Length") === "0"
    ) {
      return response.ok
        ? { data: {} as any, response: response as any }
        : { error: {} as any, response: response as any };
    }

    // parse response (falling back to .text() when necessary)
    if (response.ok) {
      let data: any; // we have to leave this empty here so that we don't consume the body
      if (parseAs !== "stream") {
        const cloned = response.clone();
        data =
          typeof cloned[parseAs] === "function"
            ? await cloned[parseAs]()
            : await cloned.text();
      } else {
        // bun consumes the body when calling response.body, therefore we need to clone the response before accessing it
        data = response.clone().body;
      }
      return { data, response: response as any };
    }

    // handle errors (always parse as .json() or .text())
    let error: any = {};
    try {
      error = await response.clone().json();
    } catch {
      error = await response.clone().text();
    }
    return { error, response: response as any };
  }

  type GetPaths = PathsWithMethod<Paths, "get">;
  type PutPaths = PathsWithMethod<Paths, "put">;
  type PostPaths = PathsWithMethod<Paths, "post">;
  type DeletePaths = PathsWithMethod<Paths, "delete">;
  type OptionsPaths = PathsWithMethod<Paths, "options">;
  type HeadPaths = PathsWithMethod<Paths, "head">;
  type PatchPaths = PathsWithMethod<Paths, "patch">;
  type TracePaths = PathsWithMethod<Paths, "trace">;
  type GetFetchOptions<P extends GetPaths> = FetchOptions<
    FilterKeys<Paths[P], "get">
  >;
  type PutFetchOptions<P extends PutPaths> = FetchOptions<
    FilterKeys<Paths[P], "put">
  >;
  type PostFetchOptions<P extends PostPaths> = FetchOptions<
    FilterKeys<Paths[P], "post">
  >;
  type DeleteFetchOptions<P extends DeletePaths> = FetchOptions<
    FilterKeys<Paths[P], "delete">
  >;
  type OptionsFetchOptions<P extends OptionsPaths> = FetchOptions<
    FilterKeys<Paths[P], "options">
  >;
  type HeadFetchOptions<P extends HeadPaths> = FetchOptions<
    FilterKeys<Paths[P], "head">
  >;
  type PatchFetchOptions<P extends PatchPaths> = FetchOptions<
    FilterKeys<Paths[P], "patch">
  >;
  type TraceFetchOptions<P extends TracePaths> = FetchOptions<
    FilterKeys<Paths[P], "trace">
  >;

  return {
    /** Call a GET endpoint */
    async GET<P extends GetPaths>(
      url: P,
      ...init: HasRequiredKeys<GetFetchOptions<P>> extends never
        ? [GetFetchOptions<P>?]
        : [GetFetchOptions<P>]
    ) {
      return coreFetch<P, "get">(url, { ...init[0], method: "GET" } as any);
    },
    /** Call a PUT endpoint */
    async PUT<P extends PutPaths>(
      url: P,
      ...init: HasRequiredKeys<PutFetchOptions<P>> extends never
        ? [PutFetchOptions<P>?]
        : [PutFetchOptions<P>]
    ) {
      return coreFetch<P, "put">(url, { ...init[0], method: "PUT" } as any);
    },
    /** Call a POST endpoint */
    async POST<P extends PostPaths>(
      url: P,
      ...init: HasRequiredKeys<PostFetchOptions<P>> extends never
        ? [PostFetchOptions<P>?]
        : [PostFetchOptions<P>]
    ) {
      return coreFetch<P, "post">(url, { ...init[0], method: "POST" } as any);
    },
    /** Call a DELETE endpoint */
    async DELETE<P extends DeletePaths>(
      url: P,
      ...init: HasRequiredKeys<DeleteFetchOptions<P>> extends never
        ? [DeleteFetchOptions<P>?]
        : [DeleteFetchOptions<P>]
    ) {
      return coreFetch<P, "delete">(url, {
        ...init[0],
        method: "DELETE",
      } as any);
    },
    /** Call a OPTIONS endpoint */
    async OPTIONS<P extends OptionsPaths>(
      url: P,
      ...init: HasRequiredKeys<OptionsFetchOptions<P>> extends never
        ? [OptionsFetchOptions<P>?]
        : [OptionsFetchOptions<P>]
    ) {
      return coreFetch<P, "options">(url, {
        ...init[0],
        method: "OPTIONS",
      } as any);
    },
    /** Call a HEAD endpoint */
    async HEAD<P extends HeadPaths>(
      url: P,
      ...init: HasRequiredKeys<HeadFetchOptions<P>> extends never
        ? [HeadFetchOptions<P>?]
        : [HeadFetchOptions<P>]
    ) {
      return coreFetch<P, "head">(url, { ...init[0], method: "HEAD" } as any);
    },
    /** Call a PATCH endpoint */
    async PATCH<P extends PatchPaths>(
      url: P,
      ...init: HasRequiredKeys<PatchFetchOptions<P>> extends never
        ? [PatchFetchOptions<P>?]
        : [PatchFetchOptions<P>]
    ) {
      return coreFetch<P, "patch">(url, { ...init[0], method: "PATCH" } as any);
    },
    /** Call a TRACE endpoint */
    async TRACE<P extends TracePaths>(
      url: P,
      ...init: HasRequiredKeys<TraceFetchOptions<P>> extends never
        ? [TraceFetchOptions<P>?]
        : [TraceFetchOptions<P>]
    ) {
      return coreFetch<P, "trace">(url, { ...init[0], method: "TRACE" } as any);
    },
  };
}

// utils

/** serialize query params to string */
export function defaultQuerySerializer<T = unknown>(q: T): string {
  const search = new URLSearchParams();
  if (q && typeof q === "object") {
    for (const [k, v] of Object.entries(q)) {
      if (v === undefined || v === null) {
        continue;
      }
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
export function createFinalURL<O>(
  pathname: string,
  options: {
    baseUrl: string;
    params: { query?: Record<string, unknown>; path?: Record<string, unknown> };
    querySerializer: QuerySerializer<O>;
  },
): string {
  let finalURL = `${options.baseUrl}${pathname}`;
  if (options.params.path) {
    for (const [k, v] of Object.entries(options.params.path)) {
      finalURL = finalURL.replace(`{${k}}`, encodeURIComponent(String(v)));
    }
  }
  const search = options.querySerializer((options.params.query as any) ?? {});
  if (search) {
    finalURL += `?${search}`;
  }
  return finalURL;
}

/** merge headers a and b, with b taking priority */
export function mergeHeaders(
  ...allHeaders: (HeadersOptions | undefined)[]
): Headers {
  const headers = new Headers();
  for (const headerSet of allHeaders) {
    if (!headerSet || typeof headerSet !== "object") {
      continue;
    }
    const iterator =
      headerSet instanceof Headers
        ? // @ts-expect-error Headers definitely have entries()
          headerSet.entries()
        : Object.entries(headerSet);
    for (const [k, v] of iterator) {
      if (v === null) {
        headers.delete(k);
      } else if (v !== undefined) {
        headers.set(k, v as any);
      }
    }
  }
  return headers;
}
