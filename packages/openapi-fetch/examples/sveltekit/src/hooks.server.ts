import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      // SvelteKit doesn't serialize any headers on server-side fetches by default but openapi-fetch uses this header for empty responses.
      return name === "content-length";
    },
  });
};
