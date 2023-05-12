export const SITE = {
  title: "OpenAPI TS",
  description: "Your website description.",
  defaultLanguage: "en-us",
} as const;

export const OPEN_GRAPH = {
  image: {
    src: "https://github.com/drwpow/openapi-typescript/blob/main/.github/assets/banner.png?raw=true",
  },
};

export const GITHUB_EDIT_URL = `https://github.com/drwpow/openapi-typescript/tree/main/docs`;

export const KNOWN_LANGUAGES = {
  English: "en",
} as const;
export const KNOWN_LANGUAGE_CODES = Object.values(KNOWN_LANGUAGES);
