import type { GlobalContext, PathsObject } from "../types.js";
import { escStr, getEntries, indent } from "../utils.js";
import transformParameterObject from "./parameter-object.js";
import transformPathItemObject from "./path-item-object.js";

export default function transformPathsObject(pathsObject: PathsObject, ctx: GlobalContext): string {
  let { indentLv } = ctx;
  const output: string[] = ["{"];
  indentLv++;
  for (const [url, pathItemObject] of getEntries(pathsObject, ctx.alphabetize)) {
    let path = url;

    // build dynamic string template literal index
    if (ctx.pathParamsAsTypes && pathItemObject.parameters) {
      for (const p of pathItemObject.parameters) {
        if ("in" in p && p.in === "path") {
          const paramType = transformParameterObject(p, { path: `#/paths/${url}/parameters/${p.name}`, ctx });
          path = path.replace(`{${p.name}}`, `\${${paramType}}`);
        }
      }
      path = `[path: \`${path}\`]`;
    } else {
      path = escStr(path);
    }

    output.push(
      indent(
        `${path}: ${transformPathItemObject(pathItemObject, {
          path: `#/paths/${url}`,
          ctx: { ...ctx, indentLv },
        })};`,
        indentLv
      )
    );
  }
  indentLv--;
  output.push(indent("}", indentLv));
  return output.join("\n");
}
