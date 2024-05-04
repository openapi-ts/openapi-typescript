<script setup lang="ts">
import { useCatFactQuery } from "./composables/catfact-query";

const { error, isFetching, isReady, state, execute } = useCatFactQuery({
  params: {
    query: {
      max_length: 140,
    },
  },
});
</script>

<template>
  <div class="demo">
    <button @click="execute">Execute</button>
    <pre class="code-block">{{
      JSON.stringify(
        {
          isReady,
          isFetching,
          error,
          state,
        },
        undefined,
        2
      )
    }}</pre>
  </div>
</template>

<style scoped>
.demo {
  padding: 16px;
  margin: 0 auto;
  width: 800px;
}
.demo .code-block {
  background-color: #202127;
  padding: 4px 8px;
  margin: 12px 0;
  border-radius: 4px;
  word-break: break-all;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
