<script setup>
import DefaultTheme from "vitepress/theme";

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <template #layout-top
      ><a
        class="banner"
        href="https://zuplo.link/openapi-ts-web"
        target="_blank"
      >
        <svg
          class="banner-logo"
          xmlns="http://www.w3.org/2000/svg"
          aria-role="img"
          aria-title="Zuplo"
          fill="#ff00bd"
          viewBox="0 0 147 33"
        >
          <path
            d="M27.142 19.978H16.62L27.83 8.746a.758.758 0 0 0-.534-1.293H9.488V0h19.534a7.573 7.573 0 0 1 4.065 1.125 7.591 7.591 0 0 1 2.836 3.126 7.402 7.402 0 0 1-1.461 8.398l-7.32 7.328z"
          ></path>
          <path
            d="M9.489 11.042h10.524l-11.19 11.21a.772.772 0 0 0 .543 1.316h17.759v7.452H7.61a7.574 7.574 0 0 1-4.065-1.125A7.593 7.593 0 0 1 .71 26.768a7.403 7.403 0 0 1 1.462-8.397zm73.297 5.728c0 2.657-1.034 4.283-3.46 4.244-2.227-.04-3.38-1.666-3.38-4.283V6.696h-5.488v10.43c0 5.038 3.142 8.607 8.868 8.647 5.25.04 8.948-3.807 8.948-8.606V6.697h-5.488zm53.306-10.512c-5.925 0-10.098 4.204-10.098 9.757 0 5.552 4.175 9.756 10.098 9.756 5.923 0 10.099-4.204 10.099-9.756 0-5.553-4.173-9.757-10.099-9.757m0 14.794c-2.744 0-4.69-2.063-4.69-5.037 0-2.975 1.948-5.038 4.69-5.038 2.743 0 4.691 2.063 4.691 5.038 0 2.974-1.947 5.037-4.691 5.037M101.966 6.258c-5.926 0-10.099 4.204-10.099 9.757 0 .073.009.144.01.22h-.01v15.772h5.408V24.75a10.911 10.911 0 0 0 4.691 1.02c5.926 0 10.099-4.204 10.099-9.756 0-5.553-4.173-9.756-10.099-9.756m0 14.794c-2.744 0-4.69-2.063-4.69-5.037 0-2.975 1.948-5.038 4.69-5.038 2.742 0 4.691 2.063 4.691 5.038 0 2.974-1.947 5.037-4.691 5.037M49.868 11.41h10.814l-10.814 8.452v5.473h17.514v-4.716h-10.84l10.84-8.473V6.694H49.868zm74.501 13.925h-1.831a7.462 7.462 0 0 1-5.262-2.177 7.421 7.421 0 0 1-2.183-5.248V.005h5.518V17.91a1.927 1.927 0 0 0 1.927 1.921h1.831z"
          ></path>
        </svg>
        <span>
          Sponsored by Zuplo<span class="banner-mobile"
            >, a managed API platform powered by OpenAPI</span
          >
        </span>
        <span class="banner-pseudo-link">Start Free →</span>
      </a></template
    >
  </Layout>
</template>

<style scoped>
.banner {
  --zuplo-brand: #ff00bd;

  background-color: var(--vp-c-bg);
  border-bottom: 1px solid var(--vp-c-divider);
  color: inherit;
  display: flex;
  font-size: var(--banner-font-size);
  font-weight: 500;
  gap: var(--banner-gap);
  height: var(--banner-height);
  line-height: 1;
  justify-content: center;
  align-items: center;
  min-height: 1rem;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  text-decoration: none;
  z-index: 100;
}

.banner-logo {
  line-height: 1;
  height: calc(0.4375 * var(--banner-height));
  min-height: calc(0.4375 * var(--banner-height));
  min-width: 3.5rem;
  width: auto;
}

.banner-mobile {
  display: none;
}

@media (width >= 720px) {
  .banner-mobile {
    display: inline;
  }
}

.banner-pseudo-link {
  background-color: var(--zuplo-brand);
  border-radius: 0.375rem;
  color: #fff;
  display: inline-flex;
  font-size: 0.875em;
  font-weight: 600;
  line-height: calc(0.625 * var(--banner-height));
  padding: 0 0.75em;
  white-space: nowrap;
}
</style>

<style>
:root {
  --banner-gap: 1.5rem;
  --banner-height: 2.25rem;
  --banner-font-size: 0.875rem;
  --vp-layout-top-height: var(
    --banner-height
  ); /* Vitepress’ variable that allows for banners */
}

@media (width >= 720px) {
  :root {
    --banner-gap: 2rem;
  }
}

@media (width >= 1200px) {
  :root {
    --banner-gap: 2.5rem;
    --banner-height: 2.5rem;
    --banner-font-size: 1rem;
  }
}

/** tighten up nav a scootch */
.Layout {
  --vp-nav-height: 56px;
}
</style>
