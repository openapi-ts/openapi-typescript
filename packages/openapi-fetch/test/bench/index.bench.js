import axios from "axios";
import { createApiFetchClient } from "feature-fetch";
import { Fetcher } from "openapi-typescript-fetch";
import superagent from "superagent";
import { afterAll, bench, describe, vi } from "vitest";
import createClient, { createPathBasedClient } from "../../dist/index.mjs";
import * as openapiTSCodegen from "./openapi-typescript-codegen.min.js";

const BASE_URL = "https://api.test.local";

const fetchMock = vi.fn(
  () =>
    new Promise((resolve) => {
      process.nextTick(() => {
        resolve(Response.json({}, { status: 200 }));
      });
    }),
);
vi.stubGlobal("fetch", fetchMock);

afterAll(() => {
  vi.unstubAllGlobals();
});

describe("setup", () => {
  bench("openapi-fetch", async () => {
    createClient({ baseUrl: BASE_URL });
  });

  bench("openapi-fetch (path based)", async () => {
    createPathBasedClient({ baseUrl: BASE_URL });
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

  bench("feature-fetch", async () => {
    createApiFetchClient({ prefixUrl: BASE_URL });
  });

  // superagent: N/A
});

describe("get (only URL)", () => {
  const openapiFetch = createClient({ baseUrl: BASE_URL });
  const openapiFetchPath = createPathBasedClient({ baseUrl: BASE_URL });
  const openapiTSFetch = Fetcher.for();
  openapiTSFetch.configure({
    baseUrl: BASE_URL,
  });
  const openapiTSFetchGET = openapiTSFetch.path("/url").method("get").create();
  const axiosInstance = axios.create({
    baseURL: BASE_URL,
  });
  const featureFetch = createApiFetchClient({ prefixUrl: BASE_URL });

  bench("openapi-fetch", async () => {
    await openapiFetch.GET("/url");
  });

  bench("openapi-fetch (path based)", async () => {
    await openapiFetchPath["/url"].GET();
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

  bench("feature-fetch", async () => {
    await featureFetch.get("/url");
  });
});

describe("get (headers)", () => {
  const openapiFetch = createClient({
    baseUrl: BASE_URL,
    headers: { "x-base-header": 123 },
  });
  const openapiFetchPath = createPathBasedClient({
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
  const featureFetch = createApiFetchClient({
    prefixUrl: BASE_URL,
    headers: { "x-base-header": "123" },
  });

  bench("openapi-fetch", async () => {
    await openapiFetch.GET("/url", {
      headers: { "x-header-1": 123, "x-header-2": 456 },
    });
  });

  bench("openapi-fetch (path based)", async () => {
    await openapiFetchPath["/url"].GET({
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

  bench("feature-fetch", async () => {
    await featureFetch.get("/url", {
      headers: { "x-header-1": "123", "x-header-2": "456" },
    });
  });
});
