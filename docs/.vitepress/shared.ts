import type { UserConfig, DefaultTheme } from "vitepress";
import { zhSearch } from "./zh";
import { jaSearch } from "./ja";

const HOSTNAME = "https://openapi-ts.dev";

const shared: UserConfig = {
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
        "data-cf-beacon": '{"token": "a2adac3f69344a25a38525e84400dd6c"}',
      },
    ],
  ],
  sitemap: {
    hostname: HOSTNAME,
  },
  themeConfig: {
    siteTitle: false,
    logo: "/assets/openapi-ts.svg",
    outline: 'deep',
    search: {
      provider: "algolia",
      options: {
        appId: "NA92XVKBVS",
        apiKey: "4f3ce9ca7edc3b83c209e6656ab29eb8",
        indexName: "openapi-ts",
        locales: { ...zhSearch, ...jaSearch },
      },
    },
    socialLinks: [
      {
        icon: {
          svg: '<svg fill="#202020" viewBox="0 0 16 16" height="16" width="16" xmlns="http://www.w3.org/2000/svg"><path fill-opacity=".4" d="M12.995 8.195c0 .937-.312 1.912-.78 2.693l1.99 1.99c.976-1.327 1.6-2.966 1.6-4.683 0-1.795-.624-3.434-1.561-4.76l-2.068 2.028c.468.781.78 1.679.78 2.732z"></path><path d="M8 13.151a4.995 4.995 0 1 1 0-9.99c1.015 0 1.951.273 2.732.82l1.95-2.03a7.805 7.805 0 1 0 .04 12.449l-1.951-2.03a5.07 5.07 0 0 1-2.732.781z"></path></svg>',
        },
        link: "https://opencollective.com/openapi-ts",
      },
      { icon: "github", link: "https://github.com/openapi-ts/openapi-typescript" },
    ],
  } satisfies DefaultTheme.Config,
  transformPageData({ relativePath, frontmatter }) {
    frontmatter.head ??= [];
    frontmatter.head.push([
      "link",
      { rel: "canonical", href: `${HOSTNAME}/${relativePath.replace(/(index\.md|\.md)$/, "")}` },
    ]);
  },
};

export default shared;
