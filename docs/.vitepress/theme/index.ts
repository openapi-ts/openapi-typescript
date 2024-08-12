// https://vitepress.dev/guide/custom-theme
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import CustomLayout from "./CustomLayout.vue";
import SponsorList from "./SponsorList.vue";
import "./style.css";

export default {
  extends: DefaultTheme,
  Layout: CustomLayout,
  enhanceApp({ app, router, siteData }) {
    app.component("SponsorList", SponsorList);
  },
} satisfies Theme;
