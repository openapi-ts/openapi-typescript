import { unescapePointerFragment } from "@redocly/openapi-core";

/** Parse a $ref string into its URI and JSON Pointer parts */
export function parseRef(ref: string): { uri: string | null; pointer: string[] } {
  const hashIndex = ref.indexOf("#");
  const uri = hashIndex === -1 ? ref : ref.slice(0, hashIndex);
  const fragment = hashIndex === -1 ? "" : ref.slice(hashIndex + 1);
  return {
    uri: uri || null,
    pointer: fragment
      .split("/")
      .filter(Boolean)
      .map((segment) => unescapePointerFragment(segment)),
  };
}
