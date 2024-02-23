import { defineConfig } from 'vitepress'

export const zh = defineConfig({
  lang: 'zh-Hans',
  description: '在 TypeScript 中使用 OpenAPI 3.0 和 3.1 的模式。',
  themeConfig: {
    nav: [
      {
        text: "版本",
        items: [
          { text: "7.x", link: "/zh/introduction" },
          { text: "6.x", link: "/6.x/introduction" },
        ],
      }
    ],
    sidebar: {
      "/zh/": [
        {
          text: "openapi-typescript",
          items: [
            { text: "Introduction", link: "/zh/introduction" },
            { text: "CLI", link: "/zh/cli" },
            { text: "Node.js API", link: "/zh/node" },
            { text: "Examples", link: "/zh/examples" },
            { text: "Advanced", link: "/zh/advanced" },
            { text: "About", link: "/zh/about" },
          ],
        },
        {
          text: "openapi-fetch",
          items: [
            { text: "Getting Started", link: "/zh/openapi-fetch/" },
            {
              text: "Middleware & Auth",
              link: "/zh/openapi-fetch/middleware-auth",
            },
            { text: "Testing", link: "/zh/openapi-fetch/testing" },
            { text: "Examples", link: "/zh/openapi-fetch/examples" },
            { text: "API", link: "/zh/openapi-fetch/api" },
            { text: "About", link: "/zh/openapi-fetch/about" },
          ],
        },
      ],
    },
    
    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    outline: {
      label: '页面导航'
    },

    footer: {
      message:
        '基于 <a href="https://github.com/drwpow/openapi-typescript/blob/main/packages/openapi-typescript/LICENSE">MIT</a> 许可发布',
    },
  }
})