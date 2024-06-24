import {
  http,
  HttpResponse,
  type JsonBodyType,
  type StrictRequest,
  type DefaultBodyType,
  type HttpResponseResolver,
  type PathParams,
  type AsyncResponseResolverReturnType,
} from "msw";
import { setupServer } from "msw/node";

/**
 * Mock server instance
 */
export const server = setupServer();

/**
 * Default baseUrl for tests
 */
export const baseUrl = "https://api.example.com" as const;

/**
 * Test path helper, returns an absolute URL based on
 * the given path and base
 */
export function toAbsoluteURL(path: string, base: string = baseUrl) {
  // If we have absolute path
  // if (URL.canParse(path)) {
  //   return new URL(path).toString();
  // }

  // Otherwise we want to support relative paths
  // where base may also contain some part of the path
  // e.g.
  // base = https://api.foo.bar/v1/
  // path = /self
  // should result in https://api.foo.bar/v1/self

  // Construct base URL
  const baseUrlInstance = new URL(base);

  // prepend base url url pathname to path and ensure only one slash between the URL parts
  const newPath = `${baseUrlInstance.pathname}/${path}`.replace(/\/+/g, "/");

  return new URL(newPath, baseUrlInstance).toString();
}

export type MswHttpMethod = keyof typeof http;

export interface MockRequestHandlerOptions<
  // Recreate the generic signature of the HTTP resolver
  // so the arguments passed to http handlers propagate here.
  Params extends PathParams<keyof Params> = PathParams,
  RequestBodyType extends DefaultBodyType = DefaultBodyType,
  ResponseBodyType extends DefaultBodyType = undefined,
> {
  baseUrl?: string;
  method: MswHttpMethod;
  /**
   * Relative or absolute path to match.
   * When relative, baseUrl will be used as base.
   */
  path: string;
  body?: JsonBodyType;
  headers?: Record<string, string>;
  status?: number;

  /**
   * Optional handler which will be called instead of using the body, headers and status
   */
  handler?: HttpResponseResolver<Params, RequestBodyType, ResponseBodyType>;
}

/**
 *  Configures a msw request handler using the provided options.
 */
export function useMockRequestHandler<
  // Recreate the generic signature of the HTTP resolver
  // so the arguments passed to http handlers propagate here.
  Params extends PathParams<keyof Params> = PathParams,
  RequestBodyType extends DefaultBodyType = DefaultBodyType,
  ResponseBodyType extends DefaultBodyType = undefined,
>({
  baseUrl: requestBaseUrl,
  method,
  path,
  body,
  headers,
  status,
  handler,
}: MockRequestHandlerOptions<Params, RequestBodyType, ResponseBodyType>) {
  let requestUrl = "";
  let receivedRequest: StrictRequest<DefaultBodyType>;
  let receivedCookies: Record<string, string> = {};

  const resolvedPath = toAbsoluteURL(path, requestBaseUrl);

  server.use(
    http[method]<Params, RequestBodyType, ResponseBodyType>(resolvedPath, (args) => {
      requestUrl = args.request.url;
      receivedRequest = args.request.clone();
      receivedCookies = { ...args.cookies };

      if (handler) {
        return handler(args);
      }

      return HttpResponse.json(body as any, {
        status: status ?? 200,
        headers,
      }) as AsyncResponseResolverReturnType<ResponseBodyType>;
    }),
  );

  return {
    getRequestCookies: () => receivedCookies,
    getRequest: () => receivedRequest,
    getRequestUrl: () => new URL(requestUrl),
  };
}
