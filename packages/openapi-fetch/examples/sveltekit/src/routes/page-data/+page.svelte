<script lang="ts">
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<div>
  <p>Example: <a href="/">Client</a> | Page Data</p>
  {#if data.fact.error}
    <div>There was an error: {data.fact.error.message}</div>
  {:else if data.fact.data}
    <pre><code>{JSON.stringify(data.fact.data, undefined, 2)}</code></pre>
  {:else}
    <div>Loading...</div>
  {/if}
  <button type="button" onclick={() => location.reload()}>Another fact!</button>
</div>
