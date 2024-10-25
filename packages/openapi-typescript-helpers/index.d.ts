// HTTP types

export type HttpMethod = "get" | "put" | "post" | "delete" | "options" | "head" | "patch" | "trace";
/** 2XX statuses */
export type OkStatus = 200 | 201 | 202 | 203 | 204 | 206 | 207 | "2XX";
/** 4XX and 5XX statuses */
// biome-ignore format: keep on one line
export type ErrorStatus = 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 | '5XX' | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 427 | 428 | 429 | 430 | 431 | 444 | 450 | 451 | 497 | 498 | 499 | '4XX' | "default";

/** Get a union of OK Statuses */
export type OKStatusUnion<T> = FilterKeys<T, OkStatus>;

/** Get first error status, in order */
// biome-ignore format: this is dumb but reliable
export type FirstErrorStatus<T> =
  T extends { 500: any }   ? T[500] :
  T extends { 501: any }   ? T[501] :
  T extends { 502: any }   ? T[502] :
  T extends { 503: any }   ? T[503] :
  T extends { 504: any }   ? T[504] :
  T extends { 505: any }   ? T[505] :
  T extends { 506: any }   ? T[506] :
  T extends { 507: any }   ? T[507] :
  T extends { 508: any }   ? T[508] :
  T extends { 510: any }   ? T[510] :
  T extends { 511: any }   ? T[511] :
  T extends { "5XX": any } ? T["5XX"] :
  T extends { 400: any }   ? T[400] :
  T extends { 401: any }   ? T[401] :
  T extends { 402: any }   ? T[402] :
  T extends { 403: any }   ? T[403] :
  T extends { 404: any }   ? T[404] :
  T extends { 405: any }   ? T[405] :
  T extends { 406: any }   ? T[406] :
  T extends { 407: any }   ? T[407] :
  T extends { 408: any }   ? T[408] :
  T extends { 409: any }   ? T[409] :
  T extends { 410: any }   ? T[410] :
  T extends { 411: any }   ? T[411] :
  T extends { 412: any }   ? T[412] :
  T extends { 413: any }   ? T[413] :
  T extends { 414: any }   ? T[414] :
  T extends { 415: any }   ? T[415] :
  T extends { 416: any }   ? T[416] :
  T extends { 417: any }   ? T[417] :
  T extends { 418: any }   ? T[418] :
  T extends { 420: any }   ? T[420] :
  T extends { 421: any }   ? T[421] :
  T extends { 422: any }   ? T[422] :
  T extends { 423: any }   ? T[423] :
  T extends { 424: any }   ? T[424] :
  T extends { 425: any }   ? T[425] :
  T extends { 426: any }   ? T[426] :
  T extends { 427: any }   ? T[427] :
  T extends { 428: any }   ? T[428] :
  T extends { 429: any }   ? T[429] :
  T extends { 430: any }   ? T[430] :
  T extends { 431: any }   ? T[431] :
  T extends { 444: any }   ? T[444] :
  T extends { 450: any }   ? T[450] :
  T extends { 451: any }   ? T[451] :
  T extends { 497: any }   ? T[497] :
  T extends { 498: any }   ? T[498] :
  T extends { 499: any }   ? T[499] :
  T extends { "4XX": any } ? T["4XX"] :
  T extends { default: any } ? T["default"] : never;

// OpenAPI type helpers

/** Given an OpenAPI **Paths Object**, find all paths that have the given method */
export type PathsWithMethod<Paths extends {}, PathnameMethod extends HttpMethod> = {
  [Pathname in keyof Paths]: Paths[Pathname] extends {
    [K in PathnameMethod]: any;
  }
    ? Pathname
    : never;
}[keyof Paths];

/**
 * DO NOT USE!
 * Only used only for OperationObject type inference
 */
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
export type ResponseObjectMap<T> = T extends { responses: any } ? T["responses"] : unknown;

/** Return `content` for a Response Object */
export type ResponseContent<T> = T extends { content: any } ? T["content"] : unknown;

/** Return type of `requestBody` for an Operation Object */
export type OperationRequestBody<T> = "requestBody" extends keyof T ? T["requestBody"] : never;

/** Internal helper to get object type with only the `requestBody` property */
type PickRequestBody<T> = "requestBody" extends keyof T ? Pick<T, "requestBody"> : never;

/** Resolve to `true` if request body is optional, else `false` */
export type IsOperationRequestBodyOptional<T> = RequiredKeysOf<PickRequestBody<T>> extends never ? true : false;

/** Internal helper used in OperationRequestBodyContent */
export type OperationRequestBodyMediaContent<T> = IsOperationRequestBodyOptional<T> extends true
  ? ResponseContent<NonNullable<OperationRequestBody<T>>> | undefined
  : ResponseContent<OperationRequestBody<T>>;

/** Return first `content` from a Request Object Mapping, allowing any media type */
export type OperationRequestBodyContent<T> = FilterKeys<OperationRequestBodyMediaContent<T>, MediaType> extends never
  ? FilterKeys<NonNullable<OperationRequestBodyMediaContent<T>>, MediaType> | undefined
  : FilterKeys<OperationRequestBodyMediaContent<T>, MediaType>;

/** Return all 2XX responses from a Response Object Map */
export type SuccessResponse<
  T extends Record<string | number, any>,
  Media extends MediaType = MediaType,
> = GetResponseContent<T, Media, OkStatus>;

type GetResponseContent<
  T extends Record<string | number, any>,
  Media extends MediaType = MediaType,
  ResponseCode extends keyof T = keyof T,
> = ResponseCode extends keyof T
  ? {
      [K in ResponseCode]: T[K]["content"] extends Record<string, any>
        ? FilterKeys<T[K]["content"], Media> extends never
          ? T[K]["content"]
          : FilterKeys<T[K]["content"], Media>
        : K extends keyof T
          ? T[K]["content"]
          : never;
    }[ResponseCode]
  : never;

/**
 * Return all 5XX and 4XX responses (in that order) from a Response Object Map
 */
export type ErrorResponse<
  T extends Record<string | number, any>,
  Media extends MediaType = MediaType,
> = GetResponseContent<T, Media, ErrorStatus>;

/** Return first JSON-like 2XX response from a path + HTTP method */
export type SuccessResponseJSON<PathMethod extends Record<string | number, any>> = SuccessResponse<
  ResponseObjectMap<PathMethod>,
  `${string}/json`
>;

/** Return first JSON-like 5XX or 4XX response from a path + HTTP method */
export type ErrorResponseJSON<PathMethod extends Record<string | number, any>> = ErrorResponse<
  ResponseObjectMap<PathMethod>,
  `${string}/json`
>;

/** Return JSON-like request body from a path + HTTP method */
export type RequestBodyJSON<PathMethod> = JSONLike<FilterKeys<OperationRequestBody<PathMethod>, "content">>;

// Generic TS utils

/** Find first match of multiple keys */
export type FilterKeys<Obj, Matchers> = Obj[keyof Obj & Matchers];
/**
 * @deprecated Use `FilterKeys` instead
 * Get the type of a value of an input object with a given key. If the key is
 * not found, return a default type. Works with unions of objects too.
 */
export type GetValueWithDefault<Obj, KeyPattern, Default> = Obj extends any
  ? FilterKeys<Obj, KeyPattern> extends never
    ? Default
    : FilterKeys<Obj, KeyPattern>
  : never;

/** Return any `[string]/[string]` media type (important because openapi-fetch allows any content response, not just JSON-like) */
export type MediaType = `${string}/${string}`;
/** Return any media type containing "json" (works for "application/json", "application/vnd.api+json", "application/vnd.oai.openapi+json") */
export type JSONLike<T> = FilterKeys<T, `${string}/json`>;

/**
 * Filter objects that have required keys
 * @deprecated Use `RequiredKeysOf` instead
 */
export type FindRequiredKeys<T, K extends keyof T> = K extends unknown ? (undefined extends T[K] ? never : K) : K;
/**
 * Does this object contain required keys?
 * @deprecated Use `RequiredKeysOf` instead
 */
export type HasRequiredKeys<T> = FindRequiredKeys<T, keyof T>;

/** Helper to get the required keys of an object. If no keys are required, will be `undefined` with strictNullChecks enabled, else `never` */
type RequiredKeysOfHelper<T> = {
  // biome-ignore lint/complexity/noBannedTypes: `{}` is necessary here
  [K in keyof T]: {} extends Pick<T, K> ? never : K;
}[keyof T];
/** Get the required keys of an object, or `never` if no keys are required */
export type RequiredKeysOf<T> = RequiredKeysOfHelper<T> extends undefined ? never : RequiredKeysOfHelper<T>;
