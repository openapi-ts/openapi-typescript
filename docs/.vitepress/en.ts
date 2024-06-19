import { defineConfig } from "vitepress";

export const en = defineConfig({
  description: "Consume OpenAPI 3.0 & 3.1 schemas in TypeScript",
  themeConfig: {
    nav: [
      {
        text: "Version",
        items: [
          { text: "7.x", link: "/introduction" },
          { text: "6.x", link: "/6.x/introduction" },
        ],
      },
    ],
    sidebar: {
      // 6.x docs
      "/6.x/": [
        {
          text: "openapi-typescript (6.x)",
          items: [
            { text: "Introduction", link: "/6.x/introduction" },
            { text: "CLI", link: "/6.x/cli" },
            { text: "Node.js API", link: "/6.x/node" },
            { text: "Advanced", link: "/6.x/advanced" },
            { text: "About", link: "/6.x/about" },
          ],
        },
        {
          text: "openapi-fetch",
          items: [
            { text: "Getting Started", link: "/openapi-fetch/" },
            {
              text: "Middleware & Auth",
              link: "/openapi-fetch/middleware-auth",
            },
            { text: "Testing", link: "/openapi-fetch/testing" },
            { text: "Examples", link: "/openapi-fetch/examples" },
            { text: "API", link: "/openapi-fetch/api" },
            { text: "About", link: "/openapi-fetch/about" },
          ],
        },
      ],
      // default (7.x) docs
      "/": [
        {
          text: "openapi-typescript (7.x)",
          items: [
            { text: "Introduction", link: "/introduction" },
            { text: "CLI", link: "/cli" },
            { text: "Node.js API", link: "/node" },
            { text: "Examples", link: "/examples" },
            { text: "Migrating from 6.x", link: "/migration-guide" },
            { text: "Advanced", link: "/advanced" },
            { text: "About", link: "/about" },
          ],
        },
        {
          text: "openapi-fetch",
          items: [
            { text: "Getting Started", link: "/openapi-fetch/" },
            {
              text: "Middleware & Auth",
              link: "/openapi-fetch/middleware-auth",
            },
            { text: "Testing", link: "/openapi-fetch/testing" },
            { text: "Examples", link: "/openapi-fetch/examples" },
            { text: "API", link: "/openapi-fetch/api" },
            { text: "About", link: "/openapi-fetch/about" },
          ],
        },
      ],
    },
    search: {
      provider: "algolia",
      options: {
        appId: "NA92XVKBVS",
        apiKey: "4f3ce9ca7edc3b83c209e6656ab29eb8",
        indexName: "openapi-ts",
      },
    },
    socialLinks: [{ icon: "github", link: "https://github.com/openapi-ts/openapi-typescript" }],
    footer: {
      message:
        'Released under the <a href="https://github.com/openapi-ts/openapi-typescript/blob/main/packages/openapi-typescript/LICENSE">MIT License</a>.',
    },
  },
});
