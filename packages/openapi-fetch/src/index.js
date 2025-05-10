// settings & const
const PATH_PARAM_RE = /\{[^{}]+\}/g;

const supportsRequestInitExt = () => {
  return (
    typeof process === "object" &&
    Number.parseInt(process?.versions?.node?.substring(0, 2)) >= 18 &&
    process.versions.undici
  );
};

/**
 * Returns a cheap, non-cryptographically-secure random ID
 * Courtesy of @imranbarbhuiya (https://github.com/imranbarbhuiya)
 */
export function randomID() {
  return Math.random().toString(36).slice(2, 11);
}

/**
 * Create an openapi-fetch client.
 * @type {import("./index.js").default}
 */
export default function createClient(clientOptions) {
  let {
    baseUrl = "",
    Request: CustomRequest = globalThis.Request,
    fetch: baseFetch = globalThis.fetch,
    querySerializer: globalQuerySerializer,
    bodySerializer: globalBodySerializer,
    headers: baseHeaders,
    requestInitExt = undefined,
    ...baseOptions
  } = { ...clientOptions };
  requestInitExt = supportsRequestInitExt() ? requestInitExt : undefined;
  baseUrl = removeTrailingSlash(baseUrl);
  const middlewares = [];

  /**
   * Per-request fetch (keeps settings created in createClient()
   * @param {T} url
   * @param {import('./index.js').FetchOptions<T>} fetchOptions
   */
  async function coreFetch(schemaPath, fetchOptions) {
    const {
      baseUrl: localBaseUrl,
      fetch = baseFetch,
      Request = CustomRequest,
      headers,
      params = {},
      parseAs = "json",
      querySerializer: requestQuerySerializer,
      bodySerializer = globalBodySerializer ?? defaultBodySerializer,
      body,
      ...init
    } = fetchOptions || {};
    let finalBaseUrl = baseUrl;
    if (localBaseUrl) {
      finalBaseUrl = removeTrailingSlash(localBaseUrl) ?? baseUrl;
    }

    let querySerializer =
      typeof globalQuerySerializer === "function"
        ? globalQuerySerializer
        : createQuerySerializer(globalQuerySerializer);
    if (requestQuerySerializer) {
      querySerializer =
        typeof requestQuerySerializer === "function"
          ? requestQuerySerializer
          : createQuerySerializer({
              ...(typeof globalQuerySerializer === "object" ? globalQuerySerializer : {}),
              ...requestQuerySerializer,
            });
    }

    const serializedBody =
      body === undefined
        ? undefined
        : bodySerializer(
            body,
            // Note: we declare mergeHeaders() both here and below because it’s a bit of a chicken-or-egg situation:
            // bodySerializer() needs all headers so we aren’t dropping ones set by the user, however,
            // the result of this ALSO sets the lowest-priority content-type header. So we re-merge below,
            // setting the content-type at the very beginning to be overwritten.
            // Lastly, based on the way headers work, it’s not a simple “present-or-not” check becauase null intentionally un-sets headers.
            mergeHeaders(baseHeaders, headers, params.header),
          );
    const finalHeaders = mergeHeaders(
      // with no body, we should not to set Content-Type
      serializedBody === undefined ||
        // if serialized body is FormData; browser will correctly set Content-Type & boundary expression
        serializedBody instanceof FormData
        ? {}
        : {
            "Content-Type": "application/json",
          },
      baseHeaders,
      headers,
      params.header,
    );

    const requestInit = {
      redirect: "follow",
      ...baseOptions,
      ...init,
      body: serializedBody,
      headers: finalHeaders,
    };

    let id;
    let options;
    let request = new CustomRequest(
      createFinalURL(schemaPath, { baseUrl: finalBaseUrl, params, querySerializer }),
      requestInit,
    );
    let response;

    /** Add custom parameters to Request object */
    for (const key in init) {
      if (!(key in request)) {
        request[key] = init[key];
      }
    }

    if (middlewares.length) {
      id = randomID();

      // middleware (request)
      options = Object.freeze({
        baseUrl: finalBaseUrl,
        fetch,
        parseAs,
        querySerializer,
        bodySerializer,
      });
      for (const m of middlewares) {
        if (m && typeof m === "object" && typeof m.onRequest === "function") {
          const result = await m.onRequest({
            request,
            schemaPath,
            params,
            options,
            id,
          });
          if (result) {
            if (result instanceof CustomRequest) {
              request = result;
            } else if (result instanceof Response) {
              response = result;
              break;
            } else {
              throw new Error("onRequest: must return new Request() or Response() when modifying the request");
            }
          }
        }
      }
    }

    if (!response) {
      // fetch!
      try {
        response = await fetch(request, requestInitExt);
      } catch (error) {
        let errorAfterMiddleware = error;
        // middleware (error)
        // execute in reverse-array order (first priority gets last transform)
        if (middlewares.length) {
          for (let i = middlewares.length - 1; i >= 0; i--) {
            const m = middlewares[i];
            if (m && typeof m === "object" && typeof m.onError === "function") {
              const result = await m.onError({
                request,
                error: errorAfterMiddleware,
                schemaPath,
                params,
                options,
                id,
              });
              if (result) {
                // if error is handled by returning a response, skip remaining middleware
                if (result instanceof Response) {
                  errorAfterMiddleware = undefined;
                  response = result;
                  break;
                }

                if (result instanceof Error) {
                  errorAfterMiddleware = result;
                  continue;
                }

                throw new Error("onError: must return new Response() or instance of Error");
              }
            }
          }
        }

        // rethrow error if not handled by middleware
        if (errorAfterMiddleware) {
          throw errorAfterMiddleware;
        }
      }

      // middleware (response)
      // execute in reverse-array order (first priority gets last transform)
      if (middlewares.length) {
        for (let i = middlewares.length - 1; i >= 0; i--) {
          const m = middlewares[i];
          if (m && typeof m === "object" && typeof m.onResponse === "function") {
            const result = await m.onResponse({
              request,
              response,
              schemaPath,
              params,
              options,
              id,
            });
            if (result) {
              if (!(result instanceof Response)) {
                throw new Error("onResponse: must return new Response() when modifying the response");
              }
              response = result;
            }
          }
        }
      }
    }

    // handle empty content
    if (response.status === 204 || request.method === "HEAD" || response.headers.get("Content-Length") === "0") {
      return response.ok ? { data: undefined, response } : { error: undefined, response };
    }

    // parse response (falling back to .text() when necessary)
    if (response.ok) {
      // if "stream", skip parsing entirely
      if (parseAs === "stream") {
        return { data: response.body, response };
      }
      return { data: await response[parseAs](), response };
    }

    // handle errors
    let error = await response.text();
    try {
      error = JSON.parse(error); // attempt to parse as JSON
    } catch {
      // noop
    }
    return { error, response };
  }

  return {
    request(method, url, init) {
      return coreFetch(url, { ...init, method: method.toUpperCase() });
    },
    /** Call a GET endpoint */
    GET(url, init) {
      return coreFetch(url, { ...init, method: "GET" });
    },
    /** Call a PUT endpoint */
    PUT(url, init) {
      return coreFetch(url, { ...init, method: "PUT" });
    },
    /** Call a POST endpoint */
    POST(url, init) {
      return coreFetch(url, { ...init, method: "POST" });
    },
    /** Call a DELETE endpoint */
    DELETE(url, init) {
      return coreFetch(url, { ...init, method: "DELETE" });
    },
    /** Call a OPTIONS endpoint */
    OPTIONS(url, init) {
      return coreFetch(url, { ...init, method: "OPTIONS" });
    },
    /** Call a HEAD endpoint */
    HEAD(url, init) {
      return coreFetch(url, { ...init, method: "HEAD" });
    },
    /** Call a PATCH endpoint */
    PATCH(url, init) {
      return coreFetch(url, { ...init, method: "PATCH" });
    },
    /** Call a TRACE endpoint */
    TRACE(url, init) {
      return coreFetch(url, { ...init, method: "TRACE" });
    },
    /** Register middleware */
    use(...middleware) {
      for (const m of middleware) {
        if (!m) {
          continue;
        }
        if (typeof m !== "object" || !("onRequest" in m || "onResponse" in m || "onError" in m)) {
          throw new Error("Middleware must be an object with one of `onRequest()`, `onResponse() or `onError()`");
        }
        middlewares.push(m);
      }
    },
    /** Unregister middleware */
    eject(...middleware) {
      for (const m of middleware) {
        const i = middlewares.indexOf(m);
        if (i !== -1) {
          middlewares.splice(i, 1);
        }
      }
    },
  };
}

class PathCallForwarder {
  constructor(client, url) {
    this.client = client;
    this.url = url;
  }

  GET = (init) => {
    return this.client.GET(this.url, init);
  };
  PUT = (init) => {
    return this.client.PUT(this.url, init);
  };
  POST = (init) => {
    return this.client.POST(this.url, init);
  };
  DELETE = (init) => {
    return this.client.DELETE(this.url, init);
  };
  OPTIONS = (init) => {
    return this.client.OPTIONS(this.url, init);
  };
  HEAD = (init) => {
    return this.client.HEAD(this.url, init);
  };
  PATCH = (init) => {
    return this.client.PATCH(this.url, init);
  };
  TRACE = (init) => {
    return this.client.TRACE(this.url, init);
  };
}

class PathClientProxyHandler {
  constructor() {
    this.client = null;
  }

  // Assume the property is an URL.
  get(coreClient, url) {
    const forwarder = new PathCallForwarder(coreClient, url);
    this.client[url] = forwarder;
    return forwarder;
  }
}

/**
 * Wrap openapi-fetch client to support a path based API.
 * @type {import("./index.js").wrapAsPathBasedClient}
 */
export function wrapAsPathBasedClient(coreClient) {
  const handler = new PathClientProxyHandler();
  const proxy = new Proxy(coreClient, handler);

  // Put the proxy on the prototype chain of the actual client.
  // This means if we do not have a memoized PathCallForwarder,
  // we fall back to the proxy to synthesize it.
  // However, the proxy itself is not on the hot-path (if we fetch the same
  // endpoint multiple times, only the first call will hit the proxy).
  function Client() {}
  Client.prototype = proxy;

  const client = new Client();

  // Feed the client back to the proxy handler so it can store the generated
  // PathCallForwarder.
  handler.client = client;

  return client;
}

/**
 * Convenience method to an openapi-fetch path based client.
 * Strictly equivalent to `wrapAsPathBasedClient(createClient(...))`.
 * @type {import("./index.js").createPathBasedClient}
 */
export function createPathBasedClient(clientOptions) {
  return wrapAsPathBasedClient(createClient(clientOptions));
}

// utils

/**
 * Serialize primitive param values
 * @type {import("./index.js").serializePrimitiveParam}
 */
export function serializePrimitiveParam(name, value, options) {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value === "object") {
    throw new Error(
      "Deeply-nested arrays/objects aren’t supported. Provide your own `querySerializer()` to handle these.",
    );
  }
  return `${name}=${options?.allowReserved === true ? value : encodeURIComponent(value)}`;
}

/**
 * Serialize object param (shallow only)
 * @type {import("./index.js").serializeObjectParam}
 */
export function serializeObjectParam(name, value, options) {
  if (!value || typeof value !== "object") {
    return "";
  }
  const values = [];
  const joiner =
    {
      simple: ",",
      label: ".",
      matrix: ";",
    }[options.style] || "&";

  // explode: false
  if (options.style !== "deepObject" && options.explode === false) {
    for (const k in value) {
      values.push(k, options.allowReserved === true ? value[k] : encodeURIComponent(value[k]));
    }
    const final = values.join(","); // note: values are always joined by comma in explode: false (but joiner can prefix)
    switch (options.style) {
      case "form": {
        return `${name}=${final}`;
      }
      case "label": {
        return `.${final}`;
      }
      case "matrix": {
        return `;${name}=${final}`;
      }
      default: {
        return final;
      }
    }
  }

  // explode: true
  for (const k in value) {
    const finalName = options.style === "deepObject" ? `${name}[${k}]` : k;
    values.push(serializePrimitiveParam(finalName, value[k], options));
  }
  const final = values.join(joiner);
  return options.style === "label" || options.style === "matrix" ? `${joiner}${final}` : final;
}

/**
 * Serialize array param (shallow only)
 * @type {import("./index.js").serializeArrayParam}
 */
export function serializeArrayParam(name, value, options) {
  if (!Array.isArray(value)) {
    return "";
  }

  // explode: false
  if (options.explode === false) {
    const joiner = { form: ",", spaceDelimited: "%20", pipeDelimited: "|" }[options.style] || ","; // note: for arrays, joiners vary wildly based on style + explode behavior
    const final = (options.allowReserved === true ? value : value.map((v) => encodeURIComponent(v))).join(joiner);
    switch (options.style) {
      case "simple": {
        return final;
      }
      case "label": {
        return `.${final}`;
      }
      case "matrix": {
        return `;${name}=${final}`;
      }
      // case "spaceDelimited":
      // case "pipeDelimited":
      default: {
        return `${name}=${final}`;
      }
    }
  }

  // explode: true
  const joiner = { simple: ",", label: ".", matrix: ";" }[options.style] || "&";
  const values = [];
  for (const v of value) {
    if (options.style === "simple" || options.style === "label") {
      values.push(options.allowReserved === true ? v : encodeURIComponent(v));
    } else {
      values.push(serializePrimitiveParam(name, v, options));
    }
  }
  return options.style === "label" || options.style === "matrix"
    ? `${joiner}${values.join(joiner)}`
    : values.join(joiner);
}

/**
 * Serialize query params to string
 * @type {import("./index.js").createQuerySerializer}
 */
export function createQuerySerializer(options) {
  return function querySerializer(queryParams) {
    const search = [];
    if (queryParams && typeof queryParams === "object") {
      for (const name in queryParams) {
        const value = queryParams[name];
        if (value === undefined || value === null) {
          continue;
        }
        if (Array.isArray(value)) {
          if (value.length === 0) {
            continue;
          }
          search.push(
            serializeArrayParam(name, value, {
              style: "form",
              explode: true,
              ...options?.array,
              allowReserved: options?.allowReserved || false,
            }),
          );
          continue;
        }
        if (typeof value === "object") {
          search.push(
            serializeObjectParam(name, value, {
              style: "deepObject",
              explode: true,
              ...options?.object,
              allowReserved: options?.allowReserved || false,
            }),
          );
          continue;
        }
        search.push(serializePrimitiveParam(name, value, options));
      }
    }
    return search.join("&");
  };
}

/**
 * Handle different OpenAPI 3.x serialization styles
 * @type {import("./index.js").defaultPathSerializer}
 * @see https://swagger.io/docs/specification/serialization/#path
 */
export function defaultPathSerializer(pathname, pathParams) {
  let nextURL = pathname;
  for (const match of pathname.match(PATH_PARAM_RE) ?? []) {
    let name = match.substring(1, match.length - 1);
    let explode = false;
    let style = "simple";
    if (name.endsWith("*")) {
      explode = true;
      name = name.substring(0, name.length - 1);
    }
    if (name.startsWith(".")) {
      style = "label";
      name = name.substring(1);
    } else if (name.startsWith(";")) {
      style = "matrix";
      name = name.substring(1);
    }
    if (!pathParams || pathParams[name] === undefined || pathParams[name] === null) {
      continue;
    }
    const value = pathParams[name];
    if (Array.isArray(value)) {
      nextURL = nextURL.replace(match, serializeArrayParam(name, value, { style, explode }));
      continue;
    }
    if (typeof value === "object") {
      nextURL = nextURL.replace(match, serializeObjectParam(name, value, { style, explode }));
      continue;
    }
    if (style === "matrix") {
      nextURL = nextURL.replace(match, `;${serializePrimitiveParam(name, value)}`);
      continue;
    }
    nextURL = nextURL.replace(match, style === "label" ? `.${encodeURIComponent(value)}` : encodeURIComponent(value));
  }
  return nextURL;
}

/**
 * Serialize body object to string
 * @type {import("./index.js").defaultBodySerializer}
 */
export function defaultBodySerializer(body, headers) {
  if (body instanceof FormData) {
    return body;
  }
  if (headers) {
    const contentType =
      headers.get instanceof Function
        ? (headers.get("Content-Type") ?? headers.get("content-type"))
        : (headers["Content-Type"] ?? headers["content-type"]);
    if (contentType === "application/x-www-form-urlencoded") {
      return new URLSearchParams(body).toString();
    }
  }
  return JSON.stringify(body);
}

/**
 * Construct URL string from baseUrl and handle path and query params
 * @type {import("./index.js").createFinalURL}
 */
export function createFinalURL(pathname, options) {
  let finalURL = `${options.baseUrl}${pathname}`;
  if (options.params?.path) {
    finalURL = defaultPathSerializer(finalURL, options.params.path);
  }
  let search = options.querySerializer(options.params.query ?? {});
  if (search.startsWith("?")) {
    search = search.substring(1);
  }
  if (search) {
    finalURL += `?${search}`;
  }
  return finalURL;
}

/**
 * Merge headers a and b, with b taking priority
 * @type {import("./index.js").mergeHeaders}
 */
export function mergeHeaders(...allHeaders) {
  const finalHeaders = new Headers();
  for (const h of allHeaders) {
    if (!h || typeof h !== "object") {
      continue;
    }
    const iterator = h instanceof Headers ? h.entries() : Object.entries(h);
    for (const [k, v] of iterator) {
      if (v === null) {
        finalHeaders.delete(k);
      } else if (Array.isArray(v)) {
        for (const v2 of v) {
          finalHeaders.append(k, v2);
        }
      } else if (v !== undefined) {
        finalHeaders.set(k, v);
      }
    }
  }
  return finalHeaders;
}

/**
 * Remove trailing slash from url
 * @type {import("./index.js").removeTrailingSlash}
 */
export function removeTrailingSlash(url) {
  if (url.endsWith("/")) {
    return url.substring(0, url.length - 1);
  }
  return url;
}
