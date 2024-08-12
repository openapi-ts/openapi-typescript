<script setup>
import sponsors from "../../data/sponsors.json";
</script>

<template>
  <ul class="sponsors-list">
    <li
      v-for="sponsor in [...sponsors.gold, ...sponsors.silver]"
      :key="sponsor.name"
    >
      <a :href="sponsor.url" target="_blank" :title="sponsor.name">
        <img :src="sponsor.logo" :alt="sponsor.description" />
      </a>
    </li>
  </ul>
</template>

<style scoped>
.sponsors-list {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  list-style: none;
  justify-content: center;
  gap: 1.5rem;
  margin: 0;
  padding: 0;
}

.sponsors-list li {
  margin: 0;
  padding: 0;
}

.sponsors-list img {
  height: 3rem;
  width: auto;
}
</style>
