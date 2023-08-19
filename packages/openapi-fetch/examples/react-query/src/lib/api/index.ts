import createClient from "openapi-fetch";
import type { paths } from "./v1";

const client = createClient<paths>({ baseUrl: "https://catfact.ninja/" });
export default client;
