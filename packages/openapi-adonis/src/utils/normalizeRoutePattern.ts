export const normalizeRoutePattern = (pattern: string) => {
  const segments = pattern.split("/");

  return segments
    .map((s) => {
      if (s.startsWith(":")) {
        return `{${s.replace(":", "")}}`;
      }

      return s;
    })
    .join("/");
};
