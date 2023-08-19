<script lang="ts">
  import type { PageData } from "./$types";

  export let data: PageData;
</script>

<div>
  <p>Example: <a href="/">Client</a> | Page Data</p>
  {#if data.fact.error}
    <div>There was an error: {String(data.fact.error)}</div>
  {:else if data.fact.data}
    <pre><code>{JSON.stringify(data.fact.data, undefined, 2)}</code></pre>
  {:else}
    <div>Loading...</div>
  {/if}
  <button type="button"> Another fact! </button>
</div>
