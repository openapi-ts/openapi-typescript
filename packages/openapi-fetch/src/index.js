// settings & const
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

const PATH_PARAM_RE = /\{[^{}]+\}/g;

/**
 * Create an openapi-fetch client.
 * @type {import("./index.js").default}
 */
export default function createClient(clientOptions) {
  const {
    fetch: baseFetch = globalThis.fetch,
    querySerializer: globalQuerySerializer,
    bodySerializer: globalBodySerializer,
    middleware,
    ...baseOptions
  } = clientOptions ?? {};
  let baseUrl = baseOptions.baseUrl ?? "";
  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.substring(0, baseUrl.length - 1);
  }

  /**
   * Per-request fetch (keeps settings created in createClient()
   * @param {T} url
   * @param {import('./index.js').FetchOptions<T>} fetchOptions
   */
  async function coreFetch(url, fetchOptions) {
    let {
      fetch = baseFetch,
      headers,
      params = {},
      parseAs = "json",
      querySerializer: requestQuerySerializer,
      bodySerializer = globalBodySerializer ?? defaultBodySerializer,
      ...init
    } = fetchOptions || {};

    let querySerializer =
      typeof globalQuerySerializer === "function"
        ? globalQuerySerializer
        : createQuerySerializer(globalQuerySerializer);
    if (requestQuerySerializer) {
      querySerializer =
        typeof requestQuerySerializer === "function"
          ? requestQuerySerializer
          : createQuerySerializer({
              ...(typeof globalQuerySerializer === "object"
                ? globalQuerySerializer
                : {}),
              ...requestQuerySerializer,
            });
    }

    let request = new Request(
      createFinalURL(url, { baseUrl, params, querySerializer }),
      {
        redirect: "follow",
        ...baseOptions,
        ...init,
        headers: mergeHeaders(
          DEFAULT_HEADERS,
          clientOptions?.headers,
          headers,
          params.header,
        ),
      },
    );

    // middleware (request)
    const mergedOptions = {
      baseUrl,
      fetch,
      parseAs,
      querySerializer,
      bodySerializer,
    };
    if (Array.isArray(middleware)) {
      for (const m of middleware) {
        const req = new Request(request.url, request);
        req.schemaPath = url; // (re)attach original URL
        req.params = params; // (re)attach params
        const result = await m({
          type: "request",
          req,
          options: Object.freeze({ ...mergedOptions }),
        });
        if (result) {
          if (!(result instanceof Request)) {
            throw new Error(
              `Middleware must return new Request() when modifying the request`,
            );
          }
          request = result;
        }
      }
    }

    // fetch!
    // if (init.body) {
    //   request = new Request(request.url, {
    //     ...request,
    //     body: bodySerializer(init.body),
    //   });
    // }
    // remove `Content-Type` if serialized body is FormData; browser will correctly set Content-Type & boundary expression
    // if (request.body instanceof FormData) {
    //   request.headers.delete("Content-Type");
    // }

    let response = await fetch(request);

    // middleware (response)
    if (Array.isArray(middleware)) {
      // execute in reverse-array order (first priority gets last transform)
      for (let i = middleware.length - 1; i >= 0; i--) {
        const result = await middleware[i]({
          type: "response",
          res: response,
          options: Object.freeze({ ...mergedOptions }),
        });
        if (result) {
          if (!(result instanceof Response)) {
            throw new Error(
              `Middleware must return new Response() when modifying the response`,
            );
          }
          response = result;
        }
      }
    }

    // handle empty content
    // note: we return `{}` because we want user truthy checks for `.data` or `.error` to succeed
    if (
      response.status === 204 ||
      response.headers.get("Content-Length") === "0"
    ) {
      return response.ok ? { data: {}, response } : { error: {}, response };
    }

    // parse response (falling back to .text() when necessary)
    if (response.ok) {
      // if "stream", skip parsing entirely
      if (parseAs === "stream") {
        // fix for bun: bun consumes response.body, therefore clone before accessing
        // TODO: test this?
        return { data: response.clone().body, response };
      }
      const cloned = response.clone();
      return {
        data:
          typeof cloned[parseAs] === "function"
            ? await cloned[parseAs]()
            : await cloned.text(),
        response,
      };
    }

    // handle errors (always parse as .json() or .text())
    let error = {};
    try {
      error = await response.clone().json();
    } catch {
      error = await response.clone().text();
    }
    return { error, response };
  }

  return {
    /** Call a GET endpoint */
    async GET(url, init) {
      return coreFetch(url, { ...init, method: "GET" });
    },
    /** Call a PUT endpoint */
    async PUT(url, init) {
      return coreFetch(url, { ...init, method: "PUT" });
    },
    /** Call a POST endpoint */
    async POST(url, init) {
      return coreFetch(url, { ...init, method: "POST" });
    },
    /** Call a DELETE endpoint */
    async DELETE(url, init) {
      return coreFetch(url, { ...init, method: "DELETE" });
    },
    /** Call a OPTIONS endpoint */
    async OPTIONS(url, init) {
      return coreFetch(url, { ...init, method: "OPTIONS" });
    },
    /** Call a HEAD endpoint */
    async HEAD(url, init) {
      return coreFetch(url, { ...init, method: "HEAD" });
    },
    /** Call a PATCH endpoint */
    async PATCH(url, init) {
      return coreFetch(url, { ...init, method: "PATCH" });
    },
    /** Call a TRACE endpoint */
    async TRACE(url, init) {
      return coreFetch(url, { ...init, method: "TRACE" });
    },
  };
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
      `Deeply-nested arrays/objects aren’t supported. Provide your own \`querySerializer()\` to handle these.`,
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
      values.push(
        k,
        options.allowReserved === true
          ? value[k]
          : encodeURIComponent(value[k]),
      );
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
  return options.style === "label" || options.style === "matrix"
    ? `${joiner}${final}`
    : final;
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
    const joiner =
      { form: ",", spaceDelimited: "%20", pipeDelimited: "|" }[options.style] ||
      ","; // note: for arrays, joiners vary wildly based on style + explode behavior
    const final = (
      options.allowReserved === true
        ? value
        : value.map((v) => encodeURIComponent(v))
    ).join(joiner);
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
      case "spaceDelimited":
      case "pipeDelimited":
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
    if (
      !pathParams ||
      pathParams[name] === undefined ||
      pathParams[name] === null
    ) {
      continue;
    }
    const value = pathParams[name];
    if (Array.isArray(value)) {
      nextURL = nextURL.replace(
        match,
        serializeArrayParam(name, value, { style, explode }),
      );
      continue;
    }
    if (typeof value === "object") {
      nextURL = nextURL.replace(
        match,
        serializeObjectParam(name, value, { style, explode }),
      );
      continue;
    }
    if (style === "matrix") {
      nextURL = nextURL.replace(
        match,
        `;${serializePrimitiveParam(name, value)}`,
      );
      continue;
    }
    nextURL = nextURL.replace(match, style === "label" ? `.${value}` : value);
    continue;
  }
  return nextURL;
}

/**
 * Serialize body object to string
 * @type {import("./index.js").defaultBodySerializer}
 */
export function defaultBodySerializer(body) {
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
  const headers = new Headers();
  for (const headerSet of allHeaders) {
    if (!headerSet || typeof headerSet !== "object") {
      continue;
    }
    const iterator =
      headerSet instanceof Headers
        ? headerSet.entries()
        : Object.entries(headerSet);
    for (const [k, v] of iterator) {
      if (v === null) {
        headers.delete(k);
      } else if (v !== undefined) {
        headers.set(k, v);
      }
    }
  }
  return headers;
}
