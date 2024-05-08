import type { paths } from "#/generated/catfact";
import createClient from "openapi-fetch";

const client = createClient<paths>({ baseUrl: "https://catfact.ninja/" });

export default client;
