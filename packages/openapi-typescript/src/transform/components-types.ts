import type { ComponentsObject, GlobalContext } from "../types.js";
import { escObjKey, getEntries, getSchemaObjectComment, indent, tsReadonly } from "../utils.js";
import transformResponseObject from "./response-object.js";
import transformSchemaObject from "./schema-object.js";

export default function transformComponentsObjectToTypes(components: ComponentsObject, ctx: GlobalContext): string {
  let { indentLv } = ctx;
  const output: string[] = [];
  indentLv++;

  // schemas
  if (components.schemas) {
    output.push(indent("schemas: {", indentLv));
    indentLv++;
    for (const [name, schemaObject] of getEntries(components.schemas, ctx.alphabetize, ctx.excludeDeprecated)) {
      const c = getSchemaObjectComment(schemaObject, indentLv);
      if (c) output.push(indent(c, indentLv));
      let key = escObjKey(name);
      if (ctx.immutableTypes || schemaObject.readOnly) key = tsReadonly(key);
      const schemaType = transformSchemaObject(schemaObject, {
        path: `#/components/schemas/${name}`,
        ctx: { ...ctx, indentLv: indentLv },
      });

      output.push(indent(`${key}: ${schemaType};`, indentLv));
    }
    indentLv--;
    output.push(indent("};", indentLv));
  } else {
    output.push(indent("schemas: never;", indentLv));
  }

  indentLv--;
  output.push(indent("}", indentLv));
  return output.join("\n");
}
