import { defineConfig } from "vitepress";
import en from "./en";
import zh from "./zh";
import ja from "./ja";
import shared from "./shared";
import { transformerTwoslash } from "@shikijs/vitepress-twoslash";
import { ModuleKind, ModuleResolutionKind } from "typescript";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  ...shared,
  locales: {
    root: { label: "English", ...en },
    zh: { label: "简体中文", ...zh },
    ja: { label: "日本語", ...ja },
  },
  markdown: {
    codeTransformers: [
      transformerTwoslash({
        twoslashOptions: {
          compilerOptions: {
            experimentalDecorators: true,
            moduleResolution: ModuleResolutionKind.Bundler,
          },
        },
      }),
    ],
  },
});
