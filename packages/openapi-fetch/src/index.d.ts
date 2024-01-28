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
  querySerializer?: QuerySerializer<unknown> | QuerySerializerOptions;
  /** global bodySerializer */
  bodySerializer?: BodySerializer<unknown>;
  headers?: HeadersOptions;
}

export type HeadersOptions =
  | HeadersInit
  | Record<
      string,
      | string
      | number
      | boolean
      | (string | number | boolean)[]
      | null
      | undefined
    >;

export type QuerySerializer<T> = (
  query: T extends { parameters: any }
    ? NonNullable<T["parameters"]["query"]>
    : Record<string, unknown>,
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

export type FetchOptions<T> = RequestOptions<T> &
  Omit<RequestInit, "body" | "headers">;

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

export interface MiddlewareRequest extends Request {
  /** The original OpenAPI schema path (including curly braces) */
  schemaPath: string;
  /** OpenAPI parameters as provided from openapi-fetch */
  params: {
    query?: Record<string, unknown>;
    header?: Record<string, unknown>;
    path?: Record<string, unknown>;
    cookie?: Record<string, unknown>;
  };
}

export function onRequest(
  req: MiddlewareRequest,
  options: MergedOptions,
): Request | undefined | Promise<Request | undefined>;
export function onResponse(
  res: Response,
  options: MergedOptions,
): Response | undefined | Promise<Response | undefined>;

export interface Middleware {
  onRequest?: typeof onRequest;
  onResponse?: typeof onResponse;
}

export type ClientMethod<Paths extends {}, M> = <
  P extends PathsWithMethod<Paths, M>,
  I extends MaybeOptionalInit<Paths[P], M>,
>(
  url: P,
  ...init: I
) => Promise<FetchResponse<Paths[P][M], I[0]>>;

export default function createClient<Paths extends {}>(
  clientOptions?: ClientOptions,
): {
  /** Call a GET endpoint */
  GET: ClientMethod<Paths, "get">;
  /** Call a PUT endpoint */
  PUT: ClientMethod<Paths, "put">;
  /** Call a POST endpoint */
  POST: ClientMethod<Paths, "post">;
  /** Call a DELETE endpoint */
  DELETE: ClientMethod<Paths, "delete">;
  /** Call a OPTIONS endpoint */
  OPTIONS: ClientMethod<Paths, "options">;
  /** Call a HEAD endpoint */
  HEAD: ClientMethod<Paths, "head">;
  /** Call a PATCH endpoint */
  PATCH: ClientMethod<Paths, "patch">;
  /** Call a TRACE endpoint */
  TRACE: ClientMethod<Paths, "trace">;
  /** Register middleware */
  use(...middleware: Middleware[]): void;
  /** Unregister middleware */
  eject(...middleware: Middleware[]): void;
};

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
    style:
      | "simple"
      | "label"
      | "matrix"
      | "form"
      | "spaceDelimited"
      | "pipeDelimited";
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
export declare function defaultPathSerializer(
  pathname: string,
  pathParams: Record<string, unknown>,
): string;

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
