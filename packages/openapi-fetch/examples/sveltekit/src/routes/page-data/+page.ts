import type { PageLoad } from "./$types";

import client from "$lib/api/index.js";

// Note: this uses Svelte’s custom fetcher as an example, but Node’s
// native fetch works, too. See Svelte’s docs to learn the difference:
// @see https://svelte.dev/docs/kit/load#Making-fetch-requests
export const load: PageLoad = async ({ fetch }) => {
  const fact = await client.GET("/fact", {
    params: { query: { max_length: 500 } },
    fetch,
  });

  return {
    fact: {
      data: fact.data,
      error: fact.error,
    },
  };
};
