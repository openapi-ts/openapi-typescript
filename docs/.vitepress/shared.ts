import { defineConfig } from "vitepress";
import { zhSearch } from "./zh";

const HOSTNAME = "https://openapi-ts.pages.dev";

export const shared = defineConfig({
  title: "OpenAPI TypeScript",
  cleanUrls: true,
  srcExclude: ["**/*/CONTRIBUTRING.md", "**/*/README.md"],
  ignoreDeadLinks: [/CODE_OF_CONDUCT/],
  head: [
    ["link", { rel: "shortcut icon", href: "/favicon.svg", type: "image/svg" }],
    [
      "script",
      {
        defer: "",
        src: "https://static.cloudflareinsights.com/beacon.min.js",
        "data-cf-beacon": '{"token": "ea4189cb68024071a5aff8663b3b63f1"}',
      },
    ],
  ],
  sitemap: {
    hostname: HOSTNAME,
  },
  themeConfig: {
    siteTitle: false,
    logo: "/assets/openapi-ts.svg",
    search: {
      provider: "algolia",
      options: {
        appId: "NA92XVKBVS",
        apiKey: "4f3ce9ca7edc3b83c209e6656ab29eb8",
        indexName: "openapi-ts",
        locales: { ...zhSearch },
      },
    },
    socialLinks: [{ icon: "github", link: "https://github.com/drwpow/openapi-typescript" }],
  },
});
