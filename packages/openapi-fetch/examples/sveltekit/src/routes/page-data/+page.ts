import client from "$lib/api/index.js";

// Note: this uses Svelte’s custom fetcher as an example, but Node’s
// native fetch works, too. See Svelte’s docs to learn the difference:
// @see https://kit.svelte.dev/docs/load#making-fetch-requests
export async function load({ fetch }) {
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
}
