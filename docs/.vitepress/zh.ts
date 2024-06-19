import { defineConfig, type DefaultTheme } from "vitepress";

export const zh = defineConfig({
  lang: "zh-Hans",
  description: "在 TypeScript 中使用 OpenAPI 3.0 和 3.1 的模式。",
  themeConfig: {
    nav: [
      {
        text: "版本",
        items: [
          { text: "7.x", link: "/zh/introduction" },
          { text: "6.x", link: "/6.x/introduction" },
        ],
      },
    ],
    sidebar: {
      "/zh/": [
        {
          text: "openapi-typescript",
          items: [
            { text: "介绍", link: "/zh/introduction" },
            { text: "命令行（CLI）", link: "/zh/cli" },
            { text: "Node.js API", link: "/zh/node" },
            { text: "示例", link: "/zh/examples" },
            { text: "高级功能", link: "/zh/advanced" },
            { text: "关于", link: "/zh/about" },
          ],
        },
        {
          text: "openapi-fetch",
          items: [
            { text: "快速上手", link: "/zh/openapi-fetch/" },
            {
              text: "中间件 & 身份认证",
              link: "/zh/openapi-fetch/middleware-auth",
            },
            { text: "测试", link: "/zh/openapi-fetch/testing" },
            { text: "示例", link: "/zh/openapi-fetch/examples" },
            { text: "API", link: "/zh/openapi-fetch/api" },
            { text: "关于", link: "/zh/openapi-fetch/about" },
          ],
        },
      ],
    },

    docFooter: {
      prev: "上一页",
      next: "下一页",
    },

    outline: {
      label: "页面导航",
    },

    footer: {
      message:
        '基于 <a href="https://github.com/openapi-ts/openapi-typescript/blob/main/packages/openapi-typescript/LICENSE">MIT</a> 许可发布',
    },
  },
});

export const zhSearch: DefaultTheme.AlgoliaSearchOptions["locales"] = {
  zh: {
    placeholder: "搜索文档",
    translations: {
      button: {
        buttonText: "搜索文档",
        buttonAriaLabel: "搜索文档",
      },
      modal: {
        searchBox: {
          resetButtonTitle: "清除查询条件",
          resetButtonAriaLabel: "清除查询条件",
          cancelButtonText: "取消",
          cancelButtonAriaLabel: "取消",
        },
        startScreen: {
          recentSearchesTitle: "搜索历史",
          noRecentSearchesText: "没有搜索历史",
          saveRecentSearchButtonTitle: "保存至搜索历史",
          removeRecentSearchButtonTitle: "从搜索历史中移除",
          favoriteSearchesTitle: "收藏",
          removeFavoriteSearchButtonTitle: "从收藏中移除",
        },
        errorScreen: {
          titleText: "无法获取结果",
          helpText: "你可能需要检查你的网络连接",
        },
        footer: {
          selectText: "选择",
          navigateText: "切换",
          closeText: "关闭",
          searchByText: "搜索提供者",
        },
        noResultsScreen: {
          noResultsText: "无法找到相关结果",
          suggestedQueryText: "你可以尝试查询",
          reportMissingResultsText: "你认为该查询应该有结果？",
          reportMissingResultsLinkText: "点击反馈",
        },
      },
    },
  },
};
