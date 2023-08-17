import pluginSass from "@cobalt-ui/plugin-sass";

/** @type {import('@cobalt-ui/core').Config} */
export default {
  tokens: "./tokens.yaml",
  outDir: "./src/tokens/",
  plugins: [
    pluginSass({
      pluginCSS: {
        modeSelectors: {
          "color#light": ["@media (prefers-color-scheme: light)", 'body[data-color-mode="light"]'],
          "color#dark": ["@media (prefers-color-scheme: dark)", 'body[data-color-mode="dark"]'],
          "transition#reduced": ["@media (prefers-reduced-motion)"],
        },
      },
    }),
  ],
};
