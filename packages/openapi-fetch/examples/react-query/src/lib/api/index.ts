import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./v1";

const throwOnError: Middleware = {
  async onResponse({ response }) {
    if (response.status >= 400) {
      const body = response.headers.get("content-type")?.includes("json")
        ? await response.clone().json()
        : await response.clone().text();
      throw new Error(body);
    }
    return undefined;
  },
};

const client = createClient<paths>({ baseUrl: "https://catfact.ninja/" });

client.use(throwOnError);

export default client;
