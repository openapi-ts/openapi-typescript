"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.js
var src_exports = {};
__export(src_exports, {
  createFinalURL: () => createFinalURL,
  default: () => createClient,
  defaultBodySerializer: () => defaultBodySerializer,
  defaultQueryParamSerializer: () => defaultQueryParamSerializer,
  defaultQuerySerializer: () => defaultQuerySerializer,
  mergeHeaders: () => mergeHeaders
});
module.exports = __toCommonJS(src_exports);
var DEFAULT_HEADERS = {
  "Content-Type": "application/json"
};
function createClient(clientOptions) {
  const {
    fetch: baseFetch = globalThis.fetch,
    querySerializer: globalQuerySerializer,
    bodySerializer: globalBodySerializer,
    ...baseOptions
  } = clientOptions ?? {};
  let baseUrl = baseOptions.baseUrl ?? "";
  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  }
  async function coreFetch(url, fetchOptions) {
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
    const finalURL = createFinalURL(url, {
      baseUrl,
      params,
      querySerializer
    });
    const finalHeaders = mergeHeaders(
      DEFAULT_HEADERS,
      clientOptions?.headers,
      headers,
      params.header
    );
    const requestInit = {
      redirect: "follow",
      ...baseOptions,
      ...init,
      headers: finalHeaders
    };
    if (requestBody && !(requestBody instanceof FormData)) {
      requestInit.body = bodySerializer(requestBody);
    }
    if (requestBody instanceof FormData) {
      requestInit.body = requestBody;
      finalHeaders.delete("Content-Type");
    }
    const response = await fetch(finalURL, requestInit);
    if (response.status === 204 || response.headers.get("Content-Length") === "0") {
      return response.ok ? { data: {}, response } : { error: {}, response };
    }
    if (response.ok) {
      if (parseAs === "stream") {
        return { data: response.clone().body, response };
      }
      const cloned = response.clone();
      return {
        data: typeof cloned[parseAs] === "function" ? await cloned[parseAs]() : await cloned.text(),
        response
      };
    }
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
    }
  };
}
function defaultQuerySerializer(q) {
  const search = [];
  if (q && typeof q === "object") {
    for (const [k, v] of Object.entries(q)) {
      const value = defaultQueryParamSerializer([k], v);
      if (value) {
        search.push(value);
      }
    }
  }
  return search.join("&");
}
function defaultQueryParamSerializer(key, value) {
  if (value === null || value === void 0) {
    return void 0;
  }
  if (typeof value === "string") {
    return `${deepObjectPath(key)}=${encodeURIComponent(value)}`;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return `${deepObjectPath(key)}=${String(value)}`;
  }
  if (Array.isArray(value)) {
    if (!value.length) {
      return void 0;
    }
    const nextValue = [];
    for (const item of value) {
      const next = defaultQueryParamSerializer(key, item);
      if (next !== void 0) {
        nextValue.push(next);
      }
    }
    return nextValue.join(`&`);
  }
  if (typeof value === "object") {
    if (!Object.keys(value).length) {
      return void 0;
    }
    const nextValue = [];
    for (const [k, v] of Object.entries(value)) {
      if (v !== void 0 && v !== null) {
        const next = defaultQueryParamSerializer([...key, k], v);
        if (next !== void 0) {
          nextValue.push(next);
        }
      }
    }
    return nextValue.join("&");
  }
  return encodeURIComponent(`${deepObjectPath(key)}=${String(value)}`);
}
function deepObjectPath(path) {
  let output = path[0];
  for (const k of path.slice(1)) {
    output += `[${k}]`;
  }
  return output;
}
function defaultBodySerializer(body) {
  return JSON.stringify(body);
}
function createFinalURL(pathname, options) {
  let finalURL = `${options.baseUrl}${pathname}`;
  if (options.params.path) {
    for (const [k, v] of Object.entries(options.params.path)) {
      finalURL = finalURL.replace(`{${k}}`, encodeURIComponent(String(v)));
    }
  }
  const search = options.querySerializer(options.params.query ?? {});
  if (search) {
    finalURL += `?${search}`;
  }
  return finalURL;
}
function mergeHeaders(...allHeaders) {
  const headers = new Headers();
  for (const headerSet of allHeaders) {
    if (!headerSet || typeof headerSet !== "object") {
      continue;
    }
    const iterator = headerSet instanceof Headers ? headerSet.entries() : Object.entries(headerSet);
    for (const [k, v] of iterator) {
      if (v === null) {
        headers.delete(k);
      } else if (v !== void 0) {
        headers.set(k, v);
      }
    }
  }
  return headers;
}
