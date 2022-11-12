import type { GlobalContext, PathItemObject } from "../types";
import { escStr, getSchemaObjectComment, indent } from "../utils.js";
import transformOperationObject from "./operation-object.js";

export interface TransformPathItemObjectOptions {
  path: string;
  ctx: GlobalContext;
}

type Method = "get" | "put" | "post" | "delete" | "options" | "head" | "patch" | "trace";

export default function transformPathItemObject(
  pathItem: PathItemObject,
  { path, ctx }: TransformPathItemObjectOptions
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
    if ("$ref" in operationObject) {
      output.push(indent(`${method}: ${operationObject.$ref}`, indentLv));
    }
    // if operationId exists, move into an `operations` export and pass the reference in here
    else if (operationObject.operationId) {
      const operationType = transformOperationObject(operationObject, { path, ctx: { ...ctx, indentLv: 1 } });
      ctx.operations[operationObject.operationId] = operationType;
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
        transformOperationObject({ parameters: pathItem.parameters }, { path, ctx, wrapObject: false }).trim(),
        indentLv
      )
    );
  }

  indentLv--;
  output.push(indent("}", indentLv));
  return output.join("\n");
}
