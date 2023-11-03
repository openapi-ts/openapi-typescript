import type {
  ErrorResponse,
  SuccessResponse,
  FilterKeys,
  MediaType,
  PathsWithMethod,
  ResponseObjectMap,
  OperationRequestBodyContent,
  HasRequiredKeys,
} from "openapi-typescript-helpers";

// Note: though "any" is considered bad practice in general, this library relies
// on "any" for type inference only it can give. Same goes for the "{}" type.
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types */

/** Options for each client instance */
export interface ClientOptions extends Omit<RequestInit, "headers"> {
  /** set the common root URL for all API requests */
  baseUrl?: string;
  /** custom fetch (defaults to globalThis.fetch) */
  fetch?: typeof fetch;
  /** global querySerializer */
  querySerializer?: QuerySerializer<unknown>;
  /** global bodySerializer */
  bodySerializer?: BodySerializer<unknown>;
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
  params?: {
    query?: Record<string, unknown>;
  };
}

export type ParamsOption<T> = T extends {
  parameters: any;
}
  ? HasRequiredKeys<T["parameters"]> extends never
    ? { params?: T["parameters"] }
    : { params: T["parameters"] }
  : DefaultParamsOption;

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
  clientOptions?: ClientOptions,
): {
  /** Call a GET endpoint */
  GET<P extends PathsWithMethod<Paths, "get">>(
    url: P,
    ...init: HasRequiredKeys<
      FetchOptions<FilterKeys<Paths[P], "get">>
    > extends never
      ? [(FetchOptions<FilterKeys<Paths[P], "get">> | undefined)?]
      : [FetchOptions<FilterKeys<Paths[P], "get">>]
  ): Promise<
    FetchResponse<
      "get" extends infer T
        ? T extends "get"
          ? T extends keyof Paths[P]
            ? Paths[P][T]
            : unknown
          : never
        : never
    >
  >;
  /** Call a PUT endpoint */
  PUT<P extends PathsWithMethod<Paths, "put">>(
    url: P,
    ...init: HasRequiredKeys<
      FetchOptions<FilterKeys<Paths[P], "put">>
    > extends never
      ? [(FetchOptions<FilterKeys<Paths[P], "put">> | undefined)?]
      : [FetchOptions<FilterKeys<Paths[P], "put">>]
  ): Promise<
    FetchResponse<
      "put" extends infer T
        ? T extends "put"
          ? T extends keyof Paths[P]
            ? Paths[P][T]
            : unknown
          : never
        : never
    >
  >;
  /** Call a POST endpoint */
  POST<P extends PathsWithMethod<Paths, "post">>(
    url: P,
    ...init: HasRequiredKeys<
      FetchOptions<FilterKeys<Paths[P], "post">>
    > extends never
      ? [(FetchOptions<FilterKeys<Paths[P], "post">> | undefined)?]
      : [FetchOptions<FilterKeys<Paths[P], "post">>]
  ): Promise<
    FetchResponse<
      "post" extends infer T
        ? T extends "post"
          ? T extends keyof Paths[P]
            ? Paths[P][T]
            : unknown
          : never
        : never
    >
  >;
  /** Call a DELETE endpoint */
  DELETE<P extends PathsWithMethod<Paths, "delete">>(
    url: P,
    ...init: HasRequiredKeys<
      FetchOptions<FilterKeys<Paths[P], "delete">>
    > extends never
      ? [(FetchOptions<FilterKeys<Paths[P], "delete">> | undefined)?]
      : [FetchOptions<FilterKeys<Paths[P], "delete">>]
  ): Promise<
    FetchResponse<
      "delete" extends infer T
        ? T extends "delete"
          ? T extends keyof Paths[P]
            ? Paths[P][T]
            : unknown
          : never
        : never
    >
  >;
  /** Call a OPTIONS endpoint */
  OPTIONS<P extends PathsWithMethod<Paths, "options">>(
    url: P,
    ...init: HasRequiredKeys<
      FetchOptions<FilterKeys<Paths[P], "options">>
    > extends never
      ? [(FetchOptions<FilterKeys<Paths[P], "options">> | undefined)?]
      : [FetchOptions<FilterKeys<Paths[P], "options">>]
  ): Promise<
    FetchResponse<
      "options" extends infer T
        ? T extends "options"
          ? T extends keyof Paths[P]
            ? Paths[P][T]
            : unknown
          : never
        : never
    >
  >;
  /** Call a HEAD endpoint */
  HEAD<P extends PathsWithMethod<Paths, "head">>(
    url: P,
    ...init: HasRequiredKeys<
      FetchOptions<FilterKeys<Paths[P], "head">>
    > extends never
      ? [(FetchOptions<FilterKeys<Paths[P], "head">> | undefined)?]
      : [FetchOptions<FilterKeys<Paths[P], "head">>]
  ): Promise<
    FetchResponse<
      "head" extends infer T
        ? T extends "head"
          ? T extends keyof Paths[P]
            ? Paths[P][T]
            : unknown
          : never
        : never
    >
  >;
  /** Call a PATCH endpoint */
  PATCH<P extends PathsWithMethod<Paths, "patch">>(
    url: P,
    ...init: HasRequiredKeys<
      FetchOptions<FilterKeys<Paths[P], "patch">>
    > extends never
      ? [(FetchOptions<FilterKeys<Paths[P], "patch">> | undefined)?]
      : [FetchOptions<FilterKeys<Paths[P], "patch">>]
  ): Promise<
    FetchResponse<
      "patch" extends infer T
        ? T extends "patch"
          ? T extends keyof Paths[P]
            ? Paths[P][T]
            : unknown
          : never
        : never
    >
  >;
  /** Call a TRACE endpoint */
  TRACE<P extends PathsWithMethod<Paths, "trace">>(
    url: P,
    ...init: HasRequiredKeys<
      FetchOptions<FilterKeys<Paths[P], "trace">>
    > extends never
      ? [(FetchOptions<FilterKeys<Paths[P], "trace">> | undefined)?]
      : [FetchOptions<FilterKeys<Paths[P], "trace">>]
  ): Promise<
    FetchResponse<
      "trace" extends infer T
        ? T extends "trace"
          ? T extends keyof Paths[P]
            ? Paths[P][T]
            : unknown
          : never
        : never
    >
  >;
};

/** Serialize query params to string */
export declare function defaultQuerySerializer<T = unknown>(q: T): string;

/** Serialize query param schema types according to expected default OpenAPI 3.x behavior */
export declare function defaultQueryParamSerializer<T = unknown>(
  key: string[],
  value: T,
): string | undefined;

/** Serialize body object to string */
export declare function defaultBodySerializer<T>(body: T): string;

/** Construct URL string from baseUrl and handle path and query params */
export declare function createFinalURL<O>(
  pathname: string,
  options: {
    baseUrl: string;
    params: {
      query?: Record<string, unknown>;
      path?: Record<string, unknown>;
    };
    querySerializer: QuerySerializer<O>;
  },
): string;

/** Merge headers a and b, with b taking priority */
export declare function mergeHeaders(
  ...allHeaders: (HeadersOptions | undefined)[]
): Headers;

export {};
