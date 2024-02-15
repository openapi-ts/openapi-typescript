import type { GlobalContext, ParameterObject, PathItemObject, ReferenceObject } from "../types.js";
import { escStr, getParametersArray, getSchemaObjectComment, indent } from "../utils.js";
import transformOperationObject from "./operation-object.js";

export interface TransformPathItemObjectOptions {
  path: string;
  ctx: GlobalContext;
}

export type Method = "get" | "put" | "post" | "delete" | "options" | "head" | "patch" | "trace";

export default function transformPathItemObject(pathItem: PathItemObject, { path, ctx }: TransformPathItemObjectOptions): string {
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

    // fold top-level PathItem parameters into method-level, with the latter overriding the former
    const keyedParameters: Record<string, ParameterObject | ReferenceObject> = {};
    if (!("$ref" in operationObject)) {
      // important: OperationObject parameters come last, and will override any conflicts with PathItem parameters
      for (const parameter of [...(pathItem.parameters ?? []), ...getParametersArray(operationObject.parameters)]) {
        // note: the actual key doesn’t matter here, as long as it can match between PathItem and OperationObject
        keyedParameters["$ref" in parameter ? parameter.$ref : `${parameter.in}/${parameter.name}`] = parameter;
      }
    }

    if ("$ref" in operationObject) {
      output.push(indent(`${method}: ${operationObject.$ref}`, indentLv));
    }
    // if operationId exists, move into an `operations` export and pass the reference in here
    else if (operationObject.operationId) {
      const operationType = transformOperationObject({ ...operationObject, parameters: Object.values(keyedParameters) }, { path, ctx: { ...ctx, indentLv: 1 } });
      ctx.operations[operationObject.operationId] = {
        operationType,
        comment: getSchemaObjectComment(operationObject, 1),
      };
      output.push(indent(`${method}: operations[${escStr(operationObject.operationId)}];`, indentLv));
    } else {
      const operationType = transformOperationObject({ ...operationObject, parameters: Object.values(keyedParameters) }, { path, ctx: { ...ctx, indentLv } });
      output.push(indent(`${method}: ${operationType};`, indentLv));
    }
  }

  // parameters
  if (pathItem.parameters?.length) {
    output.push(indent(transformOperationObject({ parameters: pathItem.parameters }, { path, ctx, wrapObject: false }).trim(), indentLv));
  }

  indentLv--;
  output.push(indent("}", indentLv));
  return output.join("\n");
}
