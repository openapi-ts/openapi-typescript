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

type BodyType<T = unknown> = {
  json: T;
  text: Awaited<ReturnType<Response["text"]>>;
  blob: Awaited<ReturnType<Response["blob"]>>;
  arrayBuffer: Awaited<ReturnType<Response["arrayBuffer"]>>;
  stream: Response["body"];
};
export type ParseAs = keyof BodyType;
export type ParseAsResponse<T, O extends FetchOptions> = O extends {
  parseAs: ParseAs;
}
  ? BodyType<T>[O["parseAs"]]
  : T;

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

export type RequestBodyOption<T> =
  OperationRequestBodyContent<T> extends never
    ? { body?: never }
    : undefined extends OperationRequestBodyContent<T>
      ? { body?: OperationRequestBodyContent<T> }
      : { body: OperationRequestBodyContent<T> };

export type FetchOptions<T> = RequestOptions<T> & Omit<RequestInit, "body">;

/** This type helper makes the 2nd function param required if params/requestBody are required; otherwise, optional */
export type MaybeOptionalInit<P extends {}, M extends keyof P> =
  HasRequiredKeys<FetchOptions<FilterKeys<P, M>>> extends never
    ? [(FetchOptions<FilterKeys<P, M>> | undefined)?]
    : [FetchOptions<FilterKeys<P, M>>];

export type FetchResponse<T, O extends FetchOptions> =
  | {
      data: ParseAsResponse<
        FilterKeys<SuccessResponse<ResponseObjectMap<T>>, MediaType>,
        O
      >;
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
  GET<
    P extends PathsWithMethod<Paths, "get">,
    I extends MaybeOptionalInit<Paths[P], "get">,
  >(
    url: P,
    ...init: I
  ): Promise<FetchResponse<Paths[P]["get"], I[0]>>;
  /** Call a PUT endpoint */
  PUT<
    P extends PathsWithMethod<Paths, "put">,
    I extends MaybeOptionalInit<Paths[P], "put">,
  >(
    url: P,
    ...init: I
  ): Promise<FetchResponse<Paths[P]["put"], I[0]>>;
  /** Call a POST endpoint */
  POST<
    P extends PathsWithMethod<Paths, "post">,
    I extends MaybeOptionalInit<Paths[P], "post">,
  >(
    url: P,
    ...init: I
  ): Promise<FetchResponse<Paths[P]["post"], I[0]>>;
  /** Call a DELETE endpoint */
  DELETE<
    P extends PathsWithMethod<Paths, "delete">,
    I extends MaybeOptionalInit<Paths[P], "delete">,
  >(
    url: P,
    ...init: I
  ): Promise<FetchResponse<Paths[P]["delete"], I[0]>>;
  /** Call a OPTIONS endpoint */
  OPTIONS<
    P extends PathsWithMethod<Paths, "options">,
    I extends MaybeOptionalInit<Paths[P], "options">,
  >(
    url: P,
    ...init: I
  ): Promise<FetchResponse<Paths[P]["options"], I[0]>>;
  /** Call a HEAD endpoint */
  HEAD<
    P extends PathsWithMethod<Paths, "head">,
    I extends MaybeOptionalInit<Paths[P], "head">,
  >(
    url: P,
    ...init: I
  ): Promise<FetchResponse<Paths[P]["head"], I[0]>>;
  /** Call a PATCH endpoint */
  PATCH<
    P extends PathsWithMethod<Paths, "patch">,
    I extends MaybeOptionalInit<Paths[P], "patch">,
  >(
    url: P,
    ...init: I
  ): Promise<FetchResponse<Paths[P]["patch"], I[0]>>;
  /** Call a TRACE endpoint */
  TRACE<
    P extends PathsWithMethod<Paths, "trace">,
    I extends MaybeOptionalInit<Paths[P], "trace">,
  >(
    url: P,
    ...init: I
  ): Promise<FetchResponse<Paths[P]["trace"], I[0]>>;
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
