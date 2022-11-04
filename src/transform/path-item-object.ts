import type { GlobalContext, PathItemObject } from "../types";
import { escStr, getSchemaObjectComment, indent } from "../utils.js";
import transformOperationObject from "./operation-object.js";

export interface TransformPathItemObjectOptions {
  operations: Record<string, string>;
  path: string;
  ctx: GlobalContext;
}

type Method = "get" | "put" | "post" | "delete" | "options" | "head" | "patch" | "trace";

const UNWRAP_OBJ_RE = /^\s*{\s*([^.]+)\s*}\s*$/;

export default function transformPathItemObject(
  pathItem: PathItemObject,
  { operations, path, ctx }: TransformPathItemObjectOptions
): string {
  let { indentLv } = ctx;
  const output: string[] = [];
  output.push("{");
  indentLv++;

  // methods
  for (const method of ["get", "put", "post", "delete", "options", "head", "patch", "trace"] as Method[]) {
    const operationObject = pathItem[method];
    if (!operationObject) continue;
    const c = getSchemaObjectComment(operationObject, indentLv);
    if (c) output.push(indent(c, indentLv));
    // if operationId exists, move into an `operations` export and pass the reference in here
    if (operationObject.operationId) {
      const operationType = transformOperationObject(operationObject, { path, ctx: { ...ctx, indentLv: 1 } });
      operations[operationObject.operationId] = operationType;
      output.push(indent(`${method}: operations[${escStr(operationObject.operationId)}];`, indentLv));
    } else {
      const operationType = transformOperationObject(operationObject, { path, ctx: { ...ctx, indentLv } });
      output.push(indent(`${method}: ${operationType};`, indentLv));
    }
  }

  // parameters
  if (pathItem.parameters && pathItem.parameters.length) {
    output.push(
      indent(
        transformOperationObject({ parameters: pathItem.parameters }, { path, ctx })
          .replace(UNWRAP_OBJ_RE, "$1")
          .trim(),
        indentLv
      )
    );
  }

  indentLv--;
  output.push(indent("}", indentLv));
  return output.join("\n");
}
