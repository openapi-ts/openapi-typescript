import axios from "axios";
import { Fetcher } from "openapi-typescript-fetch";
import superagent from "superagent";
import { afterAll, bench, describe, vi } from "vitest";
import createFetchMock from "vitest-fetch-mock";
import createClient from "../dist/index.js";
import * as openapiTSCodegen from "./openapi-typescript-codegen.min.js";

const BASE_URL = "https://api.test.local";

const fetchMocker = createFetchMock(vi);

fetchMocker.enableMocks();
fetchMocker.mockResponse("{}");
afterAll(() => {
  fetchMocker.resetMocks();
});

describe("setup", () => {
  bench("openapi-fetch", async () => {
    createClient();
  });

  bench("openapi-typescript-fetch", async () => {
    const fetcher = Fetcher.for();
    fetcher.path("/pet/findByStatus").method("get").create();
  });

  bench("axios", async () => {
    axios.create({
      baseURL: "https://api.test.local",
    });
  });

  // superagent: N/A
});

describe("get (only URL)", () => {
  let openapiFetch = createClient({ baseUrl: BASE_URL });
  let openapiTSFetch = Fetcher.for();
  openapiTSFetch.configure({
    init: { baseUrl: BASE_URL },
  });

  bench("openapi-fetch", async () => {
    await openapiFetch.GET("/url");
  });

  bench("openapi-typescript-fetch", async () => {
    await openapiTSFetch.path("/url").method("get").create()();
  });

  bench("openapi-typescript-codegen", async () => {
    await openapiTSCodegen.PullsService.pullsGet();
  });

  bench("axios", async () => {
    await axios.get("/url", {
      async adapter() {
        return { data: {} };
      },
    });
  });

  bench("superagent", async () => {
    await superagent.get("/url").end();
  });
});

describe("get (headers)", () => {
  let openapiFetch = createClient({
    baseUrl: BASE_URL,
    headers: { "x-base-header": 123 },
  });
  let openapiTSFetch = Fetcher.for();
  openapiTSFetch.configure({
    init: { baseUrl: BASE_URL, headers: { "x-base-header": 123 } },
  });

  bench("openapi-fetch", async () => {
    await openapiFetch.GET("/url", {
      headers: { "x-header-1": 123, "x-header-2": 456 },
    });
  });

  bench("openapi-typescript-fetch", async () => {
    await openapiTSFetch.path("/url").method("get").create()(null, {
      headers: { "x-header-1": 123, "x-header-2": 456 },
    });
  });

  bench("openapi-typescript-codegen", async () => {
    await openapiTSCodegen.PullsService.pullsGet();
  });

  bench("axios", async () => {
    await axios.get(`${BASE_URL}/url`, {
      headers: { "x-header-1": 123, "x-header-2": 456 },
      async adapter() {
        return { data: {} };
      },
    });
  });

  bench("superagent", async () => {
    await superagent
      .get(`${BASE_URL}/url`)
      .set("x-header-1", 123)
      .set("x-header-2", 456)
      .end();
  });
});
