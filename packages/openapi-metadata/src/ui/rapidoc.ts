/**
 * Generates HTML to display Rapidoc UI.
 *
 * @see https://rapidocweb.com/
 */
export function generateRapidocUI(url: string) {
  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <script
      type="module"
      src="https://unpkg.com/rapidoc/dist/rapidoc-min.js"
    ></script>
    <title>Documentation</title>
  </head>
  <body>
    <rapi-doc
      spec-url="${url}"
      theme="dark"
      bg-color="#24283b"
      schema-style="tree"
      schema-expand-level="10"
      header-color="#1a1b26"
      allow-try="true"
      nav-hover-bg-color="#1a1b26"
      nav-bg-color="#24283b"
      text-color="#c0caf5"
      nav-text-color="#c0caf5"
      primary-color="#9aa5ce"
      heading-text="Documentation"
      sort-tags="true"
      default-schema-tab="example"
      show-components="true"
      allow-spec-url-load="false"
      allow-spec-file-load="false"
      sort-endpoints-by="path"
    >
    </rapi-doc>
  </body>
</html>
    `;
}
