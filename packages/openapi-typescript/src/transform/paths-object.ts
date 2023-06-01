import type { GlobalContext, PathsObject, PathItemObject, ParameterObject, ReferenceObject, OperationObject } from "../types.js";
import { escStr, getEntries, indent } from "../utils.js";
import transformParameterObject from "./parameter-object.js";
import transformPathItemObject from "./path-item-object.js";

const OPERATIONS = ["get", "post", "put", "delete", "options", "head", "patch", "trace"];

function extractPathParams(obj?: ReferenceObject | PathItemObject | OperationObject | undefined): Map<string, ParameterObject> {
  const params = new Map<string, ParameterObject>();
  if (obj && "parameters" in obj) {
    for (const p of obj.parameters ?? []) {
      if ("in" in p && p.in === "path") params.set(p.name, p);
    }
  }
  return params;
}

export default function transformPathsObject(pathsObject: PathsObject, ctx: GlobalContext): string {
  let { indentLv } = ctx;
  const output: string[] = ["{"];
  indentLv++;
  for (const [url, pathItemObject] of getEntries(pathsObject, ctx.alphabetize, ctx.excludeDeprecated)) {
    let path = url;

    const pathParams = new Map([...extractPathParams(pathItemObject), ...OPERATIONS.flatMap((op) => Array.from(extractPathParams(pathItemObject[op as keyof PathItemObject])))]);

    // build dynamic string template literal index
    if (ctx.pathParamsAsTypes && pathParams.size) {
      for (const p of pathParams.values()) {
        const paramType = transformParameterObject(p, { path: `#/paths/${url}/parameters/${p.name}`, ctx });
        path = path.replace(`{${p.name}}`, `\${${paramType}}`);
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
