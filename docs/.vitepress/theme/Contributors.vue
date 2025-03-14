<script setup lang="ts">
defineProps<{
  contributors: {
    username: string;
    avatar: string;
    links: { icon: string; link: string }[];
    title?: string;
  }[];
}>();
</script>

<style scoped>
.contributor-list {
  gap: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  list-style: none;
  margin: 0;
  padding: 0;
}

.contributor-list li {
  border-radius: 50%;
  margin: 0;
  overflow: hidden;
  padding: 0;
}

.contributor-avatar {
  display: block;
  height: 3rem;
  width: 3rem;
}
</style>

<template>
  <ul class="contributor-list">
    <li v-for="contributor in contributors" :key="contributor.username">
      <a :href="contributor.links[0].link" :title="contributor.name">
        <img class="contributor-avatar" width="48" height="48" :src="contributor.avatar" :alt="contributor.name" />
      </a>
    </li>
  </ul>
</template>
