/**
 * Options for generating the Scalar UI.
 *
 * See: https://guides.scalar.com/scalar/scalar-api-references/configuration
 */
export type GenerateScalarUIOptions = {
  url?: string;
  content?: string | object | (() => object) | null;
  title?: string;
  slug?: string;
  baseServerURL?: string;
  hideClientButton?: boolean;
  proxyUrl?: string;
  searchHotKey?: string;
  servers?: any[];
  showSidebar?: boolean;
  theme?: 
    | 'alternate'
    | 'default'
    | 'moon'
    | 'purple'
    | 'solarized'
    | 'bluePlanet'
    | 'deepSpace'
    | 'saturn'
    | 'kepler'
    | 'elysiajs'
    | 'fastify'
    | 'mars'
    | 'laserwave'
    | 'none';
  persistAuth?: boolean;
  plugins?: any[];
  layout?: 'modern' | 'classic';
  isLoading?: boolean;
  hideModels?: boolean;
  documentDownloadType?: 'yaml' | 'json' | 'both' | 'none';
  hideDownloadButton?: boolean;
  hideTestRequestButton?: boolean;
  hideSearch?: boolean;
  darkMode?: boolean;
  forceDarkModeState?: 'dark' | 'light';
  hideDarkModeToggle?: boolean;
  metaData?: any;
  favicon?: string;
  hiddenClients?: Record<string, boolean | string[]> | string[] | true;
  defaultHttpClient?: { targetKey: string; clientKey: string };
  customCss?: string;
  pathRouting?: { basePath: string };
  withDefaultFonts?: boolean;
  defaultOpenAllTags?: boolean;
  tagsSorter?: 'alpha' | ((a: any, b: any) => number);
  operationsSorter?: 'alpha' | 'method' | ((a: any, b: any) => number);
};

/**
 * Generates HTML to display Scalar UI.
 *
 * @see https://scalar.com/
 */
export function generateScalarUI(url: string, options: Omit<GenerateScalarUIOptions, 'url'> = {}) {
  return `
      <!doctype html>
      <html>
        <head>
          <title>API Reference</title>
          <meta charset="utf-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1" />
        </head>
        <body>
          <div id="app"></div>
          <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
          <script>
            Scalar.createApiReference("#app", {
              url: "${url}",
              proxyUrl: "https://proxy.scalar.com",
              ...${JSON.stringify(options)}
            });
          </script>
        </body>
      </html>
    `;
}
