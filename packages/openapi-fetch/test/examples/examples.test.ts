import { assertType, test } from "vitest";
import { createObservedClient } from "../helpers.js";
import type { paths as GitHub } from "./schemas/github.js";
import type { paths as Stripe } from "./schemas/stripe.js";

test("github", async () => {
  const client = createObservedClient<GitHub>();
  const pathname = "/users/{username}";
  const { data, error } = await client.GET(pathname, {
    params: { path: { username: "octocat" } },
  });
  if (data) {
    assertType<NonNullable<GitHub[typeof pathname]["get"]["responses"]["200"]["content"]["application/json"]>>(data);
  } else {
    assertType<NonNullable<GitHub[typeof pathname]["get"]["responses"]["404"]["content"]["application/json"]>>(error);
  }
});

test("stripe", async () => {
  const client = createObservedClient<Stripe>();
  const pathname = "/v1/accounts/{account}";
  const { data, error } = await client.GET(pathname, {
    params: { path: { account: "acct_1" } },
  });
  if (data) {
    assertType<NonNullable<Stripe[typeof pathname]["get"]["responses"]["200"]["content"]["application/json"]>>(data);
  } else {
    assertType<NonNullable<Stripe[typeof pathname]["get"]["responses"]["default"]["content"]["application/json"]>>(
      error,
    );
  }
});
