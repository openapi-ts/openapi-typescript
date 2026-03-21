import { unescapePointerFragment } from "@redocly/openapi-core";

/** Parse a $ref string into its URI and JSON Pointer parts */
export function parseRef(ref: string): { uri: string | null; pointer: string[] } {
  const [uri, fragment = ""] = ref.split("#", 2);
  return {
    uri: uri || null,
    pointer: fragment
      .split("/")
      .filter(Boolean)
      .map((segment) => unescapePointerFragment(segment)),
  };
}
