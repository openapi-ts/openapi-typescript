<script setup>
import sponsors from "../../data/sponsors.json";
</script>

<template>
  <ul class="sponsors-list">
    <li
      v-for="sponsor in sponsors.gold"
      class="sponsor sponsor--gold"
      :key="sponsor.name"
    >
      <a :href="sponsor.url" target="_blank" :title="sponsor.name">
        <img :src="sponsor.logo" :alt="sponsor.description" />
      </a>
    </li>
  </ul>
  <ul class="sponsors-list">
    <li
      v-for="sponsor in sponsors.silver"
      class="sponsor sponsor--silver"
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
  margin: 0 auto 3rem;
  padding: 0;
}

.sponsor--gold img {
  height: 8rem;
  width: auto;
}

.sponsor--silver img {
  height: 3rem;
  width: auto;
}

.sponsors-list li {
  margin: 0;
  padding: 0;
}
</style>
