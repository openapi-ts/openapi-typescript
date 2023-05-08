import type { GlobalContext, ParameterObject, ReferenceObject } from "../types.js";
import { escObjKey, indent, tsOptionalProperty, tsReadonly } from "../utils.js";
import transformParameterObject from "./parameter-object.js";

export interface TransformParameterArrayOptions {
  path: string;
  ctx: GlobalContext;
}

export default function transformParameterObjectArray(parameterObjectArray: (ParameterObject | ReferenceObject)[] | Record<string, ParameterObject | ReferenceObject>, { path, ctx }: TransformParameterArrayOptions): string {
  const output: string[] = [];
  const parameters: [string, ParameterObject | ReferenceObject][] = Array.isArray(parameterObjectArray) ? parameterObjectArray.map((p) => [(p as ParameterObject).name!, p]) : Object.entries(parameterObjectArray);

  for (const [id, param] of parameters) {
    let key = escObjKey(id);
    if (ctx.immutableTypes) key = tsReadonly(key);
    const node: ParameterObject | undefined = "$ref" in param ? ctx.parameters[param.$ref] : param;
    if (!node) continue;
    if (node.in !== "path" && !node.required) key = tsOptionalProperty(key);
    output.push(
      indent(
        `${key}: ${transformParameterObject(node, {
          path: `${path}/${node.name}`,
          ctx: { ...ctx, indentLv: ctx.indentLv + 1 },
        })};`,
        ctx.indentLv
      )
    );
  }
  return output.join("\n");
}
