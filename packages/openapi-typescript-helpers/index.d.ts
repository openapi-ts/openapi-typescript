/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types */

// HTTP types

export type HttpMethod =
  | "get"
  | "put"
  | "post"
  | "delete"
  | "options"
  | "head"
  | "patch"
  | "trace";
/** 2XX statuses */
export type OkStatus = 200 | 201 | 202 | 203 | 204 | 206 | 207 | "2XX";
// prettier-ignore
/** 4XX and 5XX statuses */
export type ErrorStatus = 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 | '5XX' | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 429 | 431 | 444 | 450 | 451 | 497 | 498 | 499 | '4XX' | "default";

// OpenAPI type helpers

/** Given an OpenAPI **Paths Object**, find all paths that have the given method */
export type PathsWithMethod<
  Paths extends {},
  PathnameMethod extends HttpMethod,
> = {
  [Pathname in keyof Paths]: Paths[Pathname] extends {
    [K in PathnameMethod]: any;
  }
    ? Pathname
    : never;
}[keyof Paths];
/** DO NOT USE! Only used only for OperationObject type inference */
export interface OperationObject {
  parameters: any;
  requestBody: any; // note: "any" will get overridden in inference
  responses: any;
}
/** Internal helper used in PathsWithMethod */
export type PathItemObject = {
  [M in HttpMethod]: OperationObject;
} & { parameters?: any };
/** Return `responses` for an Operation Object */
export type ResponseObjectMap<T> = T extends { responses: any }
  ? T["responses"]
  : unknown;
/** Return `content` for a Response Object */
export type ResponseContent<T> = T extends { content: any }
  ? T["content"]
  : unknown;
/** Return `requestBody` for an Operation Object */
export type OperationRequestBody<T> = T extends { requestBody?: any }
  ? T["requestBody"]
  : never;
/** Internal helper used in OperationRequestBodyContent */
export type OperationRequestBodyMediaContent<T> =
  undefined extends OperationRequestBody<T>
    ? FilterKeys<NonNullable<OperationRequestBody<T>>, "content"> | undefined
    : FilterKeys<OperationRequestBody<T>, "content">;
/** Return first `content` from a Request Object Mapping, allowing any media type */
export type OperationRequestBodyContent<T> =
  FilterKeys<OperationRequestBodyMediaContent<T>, MediaType> extends never
    ?
        | FilterKeys<
            NonNullable<OperationRequestBodyMediaContent<T>>,
            MediaType
          >
        | undefined
    : FilterKeys<OperationRequestBodyMediaContent<T>, MediaType>;
/** Return first 2XX response from a Response Object Map */
export type SuccessResponse<T> = ResponseContent<FilterKeys<T, OkStatus>>;
/** Return first 5XX or 4XX response (in that order) from a Response Object Map */
export type ErrorResponse<T> = ResponseContent<FilterKeys<T, ErrorStatus>>;
/** Return first JSON-like 2XX response from a path + HTTP method */
export type SuccessResponseJSON<PathMethod> = JSONLike<
  SuccessResponse<ResponseObjectMap<PathMethod>>
>;
/** Return first JSON-like 5XX or 4XX response from a path + HTTP method */
export type ErrorResponseJSON<PathMethod> = JSONLike<
  ErrorResponse<ResponseObjectMap<PathMethod>>
>;
/** Return JSON-like request body from a path + HTTP method */
export type RequestBodyJSON<PathMethod> = JSONLike<
  ResponseContent<OperationRequestBody<PathMethod>>
>;

// Generic TS utils

/** Find first match of multiple keys */
export type FilterKeys<Obj, Matchers> = Obj[keyof Obj & Matchers];
/** Get the type of a value of an input object with a given key. If the key is not found, return a default type. Works with unions of objects too. */
export type GetValueWithDefault<Obj, KeyPattern, Default> = Obj extends any ? (FilterKeys<Obj, KeyPattern> extends never ? Default : FilterKeys<Obj, KeyPattern>) : never;

/** Return any `[string]/[string]` media type (important because openapi-fetch allows any content response, not just JSON-like) */
export type MediaType = `${string}/${string}`;
/** Return any media type containing "json" (works for "application/json", "application/vnd.api+json", "application/vnd.oai.openapi+json") */
export type JSONLike<T> = FilterKeys<T, `${string}/json`>;
/** Filter objects that have required keys */
export type FindRequiredKeys<T, K extends keyof T> = K extends unknown
  ? undefined extends T[K]
    ? never
    : K
  : K;
/** Does this object contain required keys? */
export type HasRequiredKeys<T> = FindRequiredKeys<T, keyof T>;
