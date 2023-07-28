import camelCase from "camelcase";
import type { ComponentsObject, GlobalContext } from "../types.js";
import { escObjKey, getEntries, getSchemaObjectComment, indent, tsReadonly } from "../utils.js";
import transformSchemaObject from "./schema-object.js";

export default function transformComponentsObjectToTypes(components: ComponentsObject, ctx: GlobalContext): string {
  const { indentLv } = ctx;
  const output: string[] = [];

  // schemas
  if (components.schemas) {
    for (const [name, schemaObject] of getEntries(components.schemas, ctx.alphabetize, ctx.excludeDeprecated)) {
      const c = getSchemaObjectComment(schemaObject, indentLv);
      if (c) output.push(indent(c, indentLv));
      let key = escObjKey(name);
      if (ctx.immutableTypes || schemaObject.readOnly) key = tsReadonly(key);
      const schemaType = transformSchemaObject(schemaObject, {
        path: `#/components/schemas/${name}`,
        ctx: { ...ctx, indentLv: indentLv },
      });

      output.push(indent(`export type ${camelCase(name, { pascalCase: true })} = ${schemaType};\n`, indentLv));
    }
  } else {
    output.push(indent("schemas: never;", indentLv));
  }

  return output.join("\n");
}
