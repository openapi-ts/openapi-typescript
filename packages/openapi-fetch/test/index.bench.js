import axios from "axios";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { Fetcher } from "openapi-typescript-fetch";
import { nanoid } from "nanoid";
import superagent from "superagent";
import { afterAll, bench, describe } from "vitest";
import createClient from "../dist/index.js";
import * as openapiTSCodegen from "./fixtures/openapi-typescript-codegen.min.js";

const BASE_URL = "https://api.test.local";

const server = setupServer(
  http.get(`${BASE_URL}/url`, () =>
    HttpResponse.json({
      message: "success",
    }),
  ),

  // Used by openapi-typescript-codegen
  http.get("https://api.github.com/repos/test1/test2/pulls/test3", () =>
    HttpResponse.json({
      message: "success",
    }),
  ),
);

// Ensure we are listening early enough so all the requests are intercepted
server.listen({
  onUnhandledRequest: (request) => {
    throw new Error(`No request handler found for ${request.method} ${request.url}`);
  },
});

afterAll(() => {
  server.close();
});

describe("setup", () => {
  bench("openapi-fetch", async () => {
    createClient({ baseUrl: BASE_URL });
  });

  bench("openapi-typescript-fetch", async () => {
    const fetcher = Fetcher.for();
    fetcher.configure({
      baseUrl: BASE_URL,
    });
    fetcher.path("/pet/findByStatus").method("get").create();
  });

  bench("axios", async () => {
    axios.create({
      baseURL: BASE_URL,
    });
  });

  // superagent: N/A
});

describe("get (only URL)", () => {
  const openapiFetch = createClient({ baseUrl: BASE_URL });
  const openapiTSFetch = Fetcher.for();
  openapiTSFetch.configure({
    baseUrl: BASE_URL,
  });
  const openapiTSFetchGET = openapiTSFetch.path("/url").method("get").create();

  const axiosInstance = axios.create({
    baseURL: BASE_URL,
  });

  bench("openapi-fetch", async () => {
    await openapiFetch.GET("/url");
  });

  bench("openapi-typescript-fetch", async () => {
    await openapiTSFetchGET();
  });

  bench("openapi-typescript-codegen", async () => {
    await openapiTSCodegen.PullsService.pullsGet("test1", "test2", "test3");
  });

  bench("axios", async () => {
    await axiosInstance.get("/url");
  });

  bench("superagent", async () => {
    await superagent.get(`${BASE_URL}/url`);
  });
});

describe("get (headers)", () => {
  const openapiFetch = createClient({
    baseUrl: BASE_URL,
    headers: { "x-base-header": 123 },
  });
  const openapiTSFetch = Fetcher.for();
  openapiTSFetch.configure({
    baseUrl: BASE_URL,
    init: { headers: { "x-base-header": 123 } },
  });
  const openapiTSFetchGET = openapiTSFetch.path("/url").method("get").create();

  const axiosInstance = axios.create({
    baseURL: BASE_URL,
  });

  bench("openapi-fetch", async () => {
    await openapiFetch.GET("/url", {
      headers: { "x-header-1": 123, "x-header-2": 456 },
    });
  });

  bench("openapi-typescript-fetch", async () => {
    await openapiTSFetchGET(null, {
      headers: { "x-header-1": 123, "x-header-2": 456 },
    });
  });

  bench("openapi-typescript-codegen", async () => {
    await openapiTSCodegen.PullsService.pullsGet("test1", "test2", "test3");
  });

  bench("axios", async () => {
    await axiosInstance.get("/url", {
      headers: { "x-header-1": 123, "x-header-2": 456 },
    });
  });

  bench("superagent", async () => {
    await superagent.get(`${BASE_URL}/url`).set("x-header-1", 123).set("x-header-2", 456);
  });
});
