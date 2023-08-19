import createClient from "openapi-fetch";
import type { paths } from "./v1";
import type { PageServerLoadEvent } from "../../routes/page-data/$types";

const client = createClient<paths>({ baseUrl: "https://catfact.ninja/" });
export default client;

export const createServerClient = (fetcher: PageServerLoadEvent["fetch"]) =>
  createClient<paths>({
    baseUrl: "https://catfact.ninja/",
    fetch: fetcher,
  });
