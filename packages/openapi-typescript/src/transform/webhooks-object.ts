import type { GlobalContext, WebhooksObject } from "../types.js";
import { escStr, getEntries, indent } from "../utils.js";
import transformPathItemObject from "./path-item-object.js";

export default function transformWebhooksObject(webhooksObject: WebhooksObject, ctx: GlobalContext): string {
  let { indentLv } = ctx;
  const output: string[] = ["{"];
  indentLv++;
  for (const [name, pathItemObject] of getEntries(webhooksObject, ctx.alphabetize, ctx.excludeDeprecated)) {
    output.push(
      indent(
        `${escStr(name)}: ${transformPathItemObject(pathItemObject, {
          path: `#/webhooks/${name}`,
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
