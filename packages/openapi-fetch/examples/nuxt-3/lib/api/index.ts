import type { paths } from "@/lib/api/v1";
import createClient from "openapi-fetch";

const client = createClient<paths>({ baseUrl: "https://catfact.ninja/" });

export default client;
