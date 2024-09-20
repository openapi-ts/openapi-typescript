export const normalizeRoutePattern = (pattern: string) => {
  const segments = pattern.split("/");

  const params: string[] = [];
  const path = segments
    .map((s) => {
      if (s.startsWith(":")) {
        const param = s.replace(":", "");
        params.push(param);
        return `{${param}}`;
      }

      return s;
    })
    .join("/");

  return { pattern: path, params };
};
