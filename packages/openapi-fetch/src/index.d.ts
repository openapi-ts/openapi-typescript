import type {
  ErrorResponse,
  FilterKeys,
  HttpMethod,
  IsOperationRequestBodyOptional,
  MediaType,
  OperationRequestBodyContent,
  PathsWithMethod,
  RequiredKeysOf,
  ResponseObjectMap,
  SuccessResponse,
} from "openapi-typescript-helpers";

/** Options for each client instance */
export interface ClientOptions extends Omit<RequestInit, "headers"> {
  /** set the common root URL for all API requests */
  baseUrl?: string;
  /** custom fetch (defaults to globalThis.fetch) */
  fetch?: (input: Request) => Promise<Response>;
  /** custom Request (defaults to globalThis.Request) */
  Request?: typeof Request;
  /** global querySerializer */
  querySerializer?: QuerySerializer<unknown> | QuerySerializerOptions;
  /** global bodySerializer */
  bodySerializer?: BodySerializer<unknown>;
  headers?: HeadersOptions;
  /** RequestInit extension object to pass as 2nd argument to fetch when supported (defaults to undefined) */
  requestInitExt?: Record<string, unknown>;
}

export type HeadersOptions =
  | Required<RequestInit>["headers"]
  | Record<string, string | number | boolean | (string | number | boolean)[] | null | undefined>;

export type QuerySerializer<T> = (
  query: T extends { parameters: any } ? NonNullable<T["parameters"]["query"]> : Record<string, unknown>,
) => string;

/** @see https://swagger.io/docs/specification/serialization/#query */
export type QuerySerializerOptions = {
  /** Set serialization for arrays. @see https://swagger.io/docs/specification/serialization/#query */
  array?: {
    /** default: "form" */
    style: "form" | "spaceDelimited" | "pipeDelimited";
    /** default: true */
    explode: boolean;
  };
  /** Set serialization for objects. @see https://swagger.io/docs/specification/serialization/#query */
  object?: {
    /** default: "deepObject" */
    style: "form" | "deepObject";
    /** default: true */
    explode: boolean;
  };
  /**
   * The `allowReserved` keyword specifies whether the reserved characters
   * `:/?#[]@!$&'()*+,;=` in parameter values are allowed to be sent as they
   * are, or should be percent-encoded. By default, allowReserved is `false`,
   * and reserved characters are percent-encoded.
   * @see https://swagger.io/docs/specification/serialization/#query
   */
  allowReserved?: boolean;
};

export type BodySerializer<T> = (body: OperationRequestBodyContent<T>) => any;

type BodyType<T = unknown> = {
  json: T;
  text: Awaited<ReturnType<Response["text"]>>;
  blob: Awaited<ReturnType<Response["blob"]>>;
  arrayBuffer: Awaited<ReturnType<Response["arrayBuffer"]>>;
  stream: Response["body"];
};
export type ParseAs = keyof BodyType;
export type ParseAsResponse<T, Options> = Options extends {
  parseAs: ParseAs;
}
  ? BodyType<T>[Options["parseAs"]]
  : T;

export interface DefaultParamsOption {
  params?: {
    query?: Record<string, unknown>;
  };
}

export type ParamsOption<T> = T extends {
  parameters: any;
}
  ? RequiredKeysOf<T["parameters"]> extends never
    ? { params?: T["parameters"] }
    : { params: T["parameters"] }
  : DefaultParamsOption;

export type RequestBodyOption<T> = OperationRequestBodyContent<T> extends never
  ? { body?: never }
  : IsOperationRequestBodyOptional<T> extends true
    ? { body?: OperationRequestBodyContent<T> }
    : { body: OperationRequestBodyContent<T> };

export type FetchOptions<T> = RequestOptions<T> & Omit<RequestInit, "body" | "headers">;

export type FetchResponse<T extends Record<string | number, any>, Options, Media extends MediaType> =
  | {
      data: ParseAsResponse<SuccessResponse<ResponseObjectMap<T>, Media>, Options>;
      error?: never;
      response: Response;
    }
  | {
      data?: never;
      error: ErrorResponse<ResponseObjectMap<T>, Media>;
      response: Response;
    };

export type RequestOptions<T> = ParamsOption<T> &
  RequestBodyOption<T> & {
    baseUrl?: string;
    querySerializer?: QuerySerializer<T> | QuerySerializerOptions;
    bodySerializer?: BodySerializer<T>;
    parseAs?: ParseAs;
    fetch?: ClientOptions["fetch"];
    headers?: HeadersOptions;
  };

export type MergedOptions<T = unknown> = {
  baseUrl: string;
  parseAs: ParseAs;
  querySerializer: QuerySerializer<T>;
  bodySerializer: BodySerializer<T>;
  fetch: typeof globalThis.fetch;
};

export interface MiddlewareCallbackParams {
  /** Current Request object */
  request: Request;
  /** The original OpenAPI schema path (including curly braces) */
  readonly schemaPath: string;
  /** OpenAPI parameters as provided from openapi-fetch */
  readonly params: {
    query?: Record<string, unknown>;
    header?: Record<string, unknown>;
    path?: Record<string, unknown>;
    cookie?: Record<string, unknown>;
  };
  /** Unique ID for this request */
  readonly id: string;
  /** createClient options (read-only) */
  readonly options: MergedOptions;
}

type MiddlewareOnRequest = (
  options: MiddlewareCallbackParams,
) => void | Request | Response | undefined | Promise<Request | Response | undefined | void>;
type MiddlewareOnResponse = (
  options: MiddlewareCallbackParams & { response: Response },
) => void | Response | undefined | Promise<Response | undefined | void>;
type MiddlewareOnError = (
  options: MiddlewareCallbackParams & { error: unknown },
) => void | Response | Error | Promise<void | Response | Error>;

export type Middleware =
  | {
      onRequest: MiddlewareOnRequest;
      onResponse?: MiddlewareOnResponse;
      onError?: MiddlewareOnError;
    }
  | {
      onRequest?: MiddlewareOnRequest;
      onResponse: MiddlewareOnResponse;
      onError?: MiddlewareOnError;
    }
  | {
      onRequest?: MiddlewareOnRequest;
      onResponse?: MiddlewareOnResponse;
      onError: MiddlewareOnError;
    };

/** This type helper makes the 2nd function param required if params/requestBody are required; otherwise, optional */
export type MaybeOptionalInit<Params, Location extends keyof Params> = RequiredKeysOf<
  FetchOptions<FilterKeys<Params, Location>>
> extends never
  ? FetchOptions<FilterKeys<Params, Location>> | undefined
  : FetchOptions<FilterKeys<Params, Location>>;

// The final init param to accept.
// - Determines if the param is optional or not.
// - Performs arbitrary [key: string] addition.
// Note: the addition MUST happen after all the inference happens (otherwise TS can’t infer if init is required or not).
type InitParam<Init> = RequiredKeysOf<Init> extends never
  ? [(Init & { [key: string]: unknown })?]
  : [Init & { [key: string]: unknown }];

export type ClientMethod<
  Paths extends Record<string, Record<HttpMethod, {}>>,
  Method extends HttpMethod,
  Media extends MediaType,
> = <Path extends PathsWithMethod<Paths, Method>, Init extends MaybeOptionalInit<Paths[Path], Method>>(
  url: Path,
  ...init: InitParam<Init>
) => Promise<FetchResponse<Paths[Path][Method], Init, Media>>;

export type ClientRequestMethod<Paths extends Record<string, Record<HttpMethod, {}>>, Media extends MediaType> = <
  Method extends HttpMethod,
  Path extends PathsWithMethod<Paths, Method>,
  Init extends MaybeOptionalInit<Paths[Path], Method>,
>(
  method: Method,
  url: Path,
  ...init: InitParam<Init>
) => Promise<FetchResponse<Paths[Path][Method], Init, Media>>;

export type ClientForPath<PathInfo extends Record<string | number, any>, Media extends MediaType> = {
  [Method in keyof PathInfo as Uppercase<string & Method>]: <Init extends MaybeOptionalInit<PathInfo, Method>>(
    ...init: InitParam<Init>
  ) => Promise<FetchResponse<PathInfo[Method], Init, Media>>;
};

export interface Client<Paths extends {}, Media extends MediaType = MediaType> {
  request: ClientRequestMethod<Paths, Media>;
  /** Call a GET endpoint */
  GET: ClientMethod<Paths, "get", Media>;
  /** Call a PUT endpoint */
  PUT: ClientMethod<Paths, "put", Media>;
  /** Call a POST endpoint */
  POST: ClientMethod<Paths, "post", Media>;
  /** Call a DELETE endpoint */
  DELETE: ClientMethod<Paths, "delete", Media>;
  /** Call a OPTIONS endpoint */
  OPTIONS: ClientMethod<Paths, "options", Media>;
  /** Call a HEAD endpoint */
  HEAD: ClientMethod<Paths, "head", Media>;
  /** Call a PATCH endpoint */
  PATCH: ClientMethod<Paths, "patch", Media>;
  /** Call a TRACE endpoint */
  TRACE: ClientMethod<Paths, "trace", Media>;
  /** Register middleware */
  use(...middleware: Middleware[]): void;
  /** Unregister middleware */
  eject(...middleware: Middleware[]): void;
}

export type ClientPathsWithMethod<
  CreatedClient extends Client<any, any>,
  Method extends HttpMethod,
> = CreatedClient extends Client<infer Paths, infer _Media> ? PathsWithMethod<Paths, Method> : never;

export type MethodResponse<
  CreatedClient extends Client<any, any>,
  Method extends HttpMethod,
  Path extends ClientPathsWithMethod<CreatedClient, Method>,
  Options = {},
> = CreatedClient extends Client<infer Paths extends { [key: string]: any }, infer Media extends MediaType>
  ? NonNullable<FetchResponse<Paths[Path][Method], Options, Media>["data"]>
  : never;

export default function createClient<Paths extends {}, Media extends MediaType = MediaType>(
  clientOptions?: ClientOptions,
): Client<Paths, Media>;

export type PathBasedClient<Paths extends Record<string | number, any>, Media extends MediaType = MediaType> = {
  [Path in keyof Paths]: ClientForPath<Paths[Path], Media>;
};

export declare function wrapAsPathBasedClient<Paths extends {}, Media extends MediaType = MediaType>(
  client: Client<Paths, Media>,
): PathBasedClient<Paths, Media>;

export declare function createPathBasedClient<Paths extends {}, Media extends MediaType = MediaType>(
  clientOptions?: ClientOptions,
): PathBasedClient<Paths, Media>;

/** Serialize primitive params to string */
export declare function serializePrimitiveParam(
  name: string,
  value: string,
  options?: { allowReserved?: boolean },
): string;

/** Serialize object param to string */
export declare function serializeObjectParam(
  name: string,
  value: Record<string, unknown>,
  options: {
    style: "simple" | "label" | "matrix" | "form" | "deepObject";
    explode: boolean;
    allowReserved?: boolean;
  },
): string;

/** Serialize array param to string */
export declare function serializeArrayParam(
  name: string,
  value: unknown[],
  options: {
    style: "simple" | "label" | "matrix" | "form" | "spaceDelimited" | "pipeDelimited";
    explode: boolean;
    allowReserved?: boolean;
  },
): string;

/** Serialize query params to string */
export declare function createQuerySerializer<T = unknown>(
  options?: QuerySerializerOptions,
): (queryParams: T) => string;

/**
 * Handle different OpenAPI 3.x serialization styles
 * @type {import("./index.js").defaultPathSerializer}
 * @see https://swagger.io/docs/specification/serialization/#path
 */
export declare function defaultPathSerializer(pathname: string, pathParams: Record<string, unknown>): string;

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
export declare function mergeHeaders(...allHeaders: (HeadersOptions | undefined)[]): Headers;

/** Remove trailing slash from url */
export declare function removeTrailingSlash(url: string): string;
