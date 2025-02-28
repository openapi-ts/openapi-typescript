import { defineConfig, type DefaultTheme } from "vitepress";

export default defineConfig({
  lang: "ja",
  description: "OpenAPI 3.0および3.1のスキーマをTypeScriptで使用する方法。",
  themeConfig: {
    nav: [
      {
        text: "バージョン",
        items: [
          { text: "7.x", link: "/ja/introduction" },
          { text: "6.x", link: "/6.x/introduction" },
        ],
      },
    ],
    sidebar: {
      "/ja/": [
        {
          text: "openapi-typescript (7.x)",
          items: [
            { text: "イントロダクション", link: "/ja/introduction" },
            { text: "CLI", link: "/ja/cli" },
            { text: "Node.js API", link: "/ja/node" },
            { text: "使用例", link: "/ja/examples" },
            { text: "6.xからのマイグレーション", link: "/ja/migration-guide" },
            { text: "高度な機能", link: "/ja/advanced" },
          ],
        },
        {
          text: "openapi-fetch",
          items: [
            { text: "始める", link: "/ja/openapi-fetch/" },
            {
              text: "ミドルウェア & 認証",
              link: "/ja/openapi-fetch/middleware-auth",
            },
            { text: "テスト", link: "/ja/openapi-fetch/testing" },
            { text: "使用例", link: "/ja/openapi-fetch/examples" },
            { text: "API", link: "/ja/openapi-fetch/api" },
          ],
        },
        {
          text: "openapi-react-query",
          items: [
            { text: "始める", link: "/ja/openapi-react-query/" },
            { text: "useQuery", link: "/ja/openapi-react-query/use-query" },
            { text: "useMutation", link: "/ja/openapi-react-query/use-mutation" },
            { text: "useSuspenseQuery", link: "/ja/openapi-react-query/use-suspense-query" },
          ],
        },
      ],
    },

    docFooter: {
      prev: "前のページ",
      next: "次のページ",
    },
    outline: {
      label: "目次",
    },
    sidebarMenuLabel: "メニュー",
    returnToTopLabel: "最上部に戻る",
    footer: {
      message:
        '<a href="https://github.com/openapi-ts/openapi-typescript/blob/main/packages/openapi-typescript/LICENSE">MITライセンス</a> に基づいて配布されています。',
    },
  },
});

export const jaSearch: DefaultTheme.AlgoliaSearchOptions["locales"] = {
  ja: {
    placeholder: "ドキュメントを検索",
    translations: {
      button: {
        buttonText: "検索",
        buttonAriaLabel: "検索",
      },
      modal: {
        searchBox: {
          resetButtonTitle: "クエリをクリア",
          resetButtonAriaLabel: "クエリをクリア",
          cancelButtonText: "キャンセル",
          cancelButtonAriaLabel: "キャンセル",
        },
        startScreen: {
          recentSearchesTitle: "最近の検索",
          noRecentSearchesText: "最近の検索履歴はありません",
          saveRecentSearchButtonTitle: "最近の検索に保存",
          removeRecentSearchButtonTitle: "最近の検索から削除",
          favoriteSearchesTitle: "お気に入り",
          removeFavoriteSearchButtonTitle: "お気に入りから削除",
        },
        errorScreen: {
          titleText: "結果を取得できません",
          helpText: "ネットワーク接続を確認してください",
        },
        footer: {
          selectText: "選択",
          navigateText: "移動",
          closeText: "閉じる",
        },
        noResultsScreen: {
          noResultsText: "関連する結果が見つかりません",
          suggestedQueryText: "別のクエリを試してみてください",
          reportMissingResultsText: "このクエリに結果があるべきだと思いますか？",
          reportMissingResultsLinkText: "フィードバックを送信",
        },
      },
    },
  },
};
