<script setup>
import { useAsyncData } from '#app';
import client from "@/lib/api";

// ssr fetching example
const { data: catFact, error, pending, refresh } = useAsyncData(
  'catFact',
  async () => {
    const { data, error } = await client.GET("/fact", {
      params: {
        query: {
          max_length: 140,
        },
      },
    });

    if (error) {
      throw error;
    }
    return data;
  }
);

const isRefetching = ref(false);

async function fetchNewFact() {
  isRefetching.value = true;
  await refresh();
  isRefetching.value = false;
}
</script>

<template>
  <div class="cat-fact-container">
    <h1 class="title">Cat Facts</h1>

    <div v-if="pending || isRefetching" class="loading">
      <span class="loader"></span> Loading...
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error.message }}</p>
      <p class="error-code">Error code: {{ error.code }}</p>
    </div>

    <div v-else-if="catFact" class="fact-card">
      <p class="fact">{{ catFact.fact }}</p>
      <span class="fact-length">Character count: {{ catFact.length }}</span>
    </div>

    <button @click="fetchNewFact" class="fetch-button" :disabled="pending || isRefetching">
      {{ (pending || isRefetching) ? 'Fetching...' : 'Get New Cat Fact' }}
    </button>
  </div>
</template>

<style>
:root {
  --color-primary: #00DC82;
  --color-primary-dark: #00C476;
  --color-primary-light: #94E3C9;
  --color-secondary: #F3F4F6;
  --color-text: #374151;
  --color-text-light: #666666;
  --color-error: #EF4444;
  --color-error-bg: #FEE2E2;
  --color-background: #F9FAFB;
}
</style>

<style scoped>
.cat-fact-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--color-text);
}

.title {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: var(--color-primary);
  text-align: center;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 2rem 0;
  color: var(--color-text-light);
}

.loader {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  margin-right: 0.5rem;
  border: 2px solid var(--color-primary);
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error {
  background-color: var(--color-error-bg);
  color: var(--color-error);
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 2rem 0;
}

.error-code {
  font-size: 0.875rem;
  opacity: 0.8;
}

.fact-card {
  background-color: var(--color-secondary);
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin: 2rem 0;
}

.fact {
  font-size: 1.25rem;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.fact-length {
  display: block;
  text-align: right;
  font-size: 0.875rem;
  color: var(--color-text-light);
}

.fetch-button {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.fetch-button:hover {
  background-color: var(--color-primary-dark);
}

.fetch-button:disabled {
  background-color: var(--color-primary-light);
  cursor: not-allowed;
}
</style>