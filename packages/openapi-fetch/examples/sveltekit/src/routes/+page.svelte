<script lang="ts">
  import { onMount } from "svelte";
  import client from "$lib/api/index.js";

  let fact: Awaited<ReturnType<typeof getFact>> | undefined;

  async function getFact() {
    return client.GET("/fact", {
      params: {
        query: { max_length: 500 },
      },
    });
  }

  onMount(() => {
    getFact().then((res) => (fact = res));
  });
</script>

<div>
  <p>Example: Client | <a href="/page-data">Page Data</a></p>
  {#if fact}
    {#if fact.error}
      <div>There was an error: {fact.error}</div>
    {:else}
      <pre><code>{JSON.stringify(fact.data, undefined, 2)}</code></pre>
    {/if}
  {/if}
  <button type="button" on:click={() => getFact().then((res) => (fact = res))}>Another fact!</button>
</div>
