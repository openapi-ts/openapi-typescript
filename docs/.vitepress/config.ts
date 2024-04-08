import { defineConfig } from "vitepress";
import { en } from "./en";
import { zh } from "./zh";
import { shared } from "./shared";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  ...shared,
  locales: {
    root: { label: "English", ...en },
    zh: { label: "简体中文", ...zh },
  },
});
