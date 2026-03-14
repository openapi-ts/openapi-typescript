import { test } from "vitest";
import createClient from "../../src/index.js";
import type { paths } from "./schemas/common.js";

test("GET rejects undefined query params", () => {
  const client = createClient<paths>();

  client.GET("/query-params", {
    params: {
      query: {
        array: [],
        // Regression test: extra query params should be rejected.
        // @ts-expect-error
        undefined_property: [],
      },
    },
  });
});

test("client.request rejects undefined query params", () => {
  const client = createClient<paths>();

  client.request("get", "/query-params", {
    params: {
      query: {
        array: [],
        // Regression test: extra query params should be rejected via client.request().
        // @ts-expect-error
        undefined_property: [],
      },
    },
  });
});

test("GET rejects undefined path params", () => {
  const client = createClient<paths>();

  client.GET("/resources/{id}", {
    params: {
      path: {
        id: 123,
        // Regression test: extra path params should be rejected.
        // @ts-expect-error
        undefined_property: 456,
      },
    },
  });
});

test("client.request rejects undefined path params", () => {
  const client = createClient<paths>();

  client.request("get", "/resources/{id}", {
    params: {
      path: {
        id: 123,
        // Regression test: extra path params should be rejected via client.request().
        // @ts-expect-error
        undefined_property: 456,
      },
    },
  });
});
