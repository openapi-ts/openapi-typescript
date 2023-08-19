<script lang="ts">
  import client from "$lib/api/index.js";

  $: fact = client.GET("/fact", {
    params: {
      query: { max_length: 500 },
    },
  });
</script>

<div>
  <p>Example: Client | <a href="/page-data">Page Data</a></p>
  {#await fact}
    <div>Loading...</div>
  {:then { data, error }}
    {#if error}
      <div>There was an error: {String(error)}</div>
    {:else}
      <pre><code>{JSON.stringify(data, undefined, 2)}</code></pre>
    {/if}
  {/await}
  <button type="button"> Another fact! </button>
</div>
