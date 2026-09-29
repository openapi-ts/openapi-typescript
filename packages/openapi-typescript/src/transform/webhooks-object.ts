import { INDENT, propertySignature, type TSNode, tsPropertyIndex, typeLiteral } from "../lib/ts.js";
import { createRef, getEntries } from "../lib/utils.js";
import type { GlobalContext, WebhooksObject } from "../types.js";
import transformPathItemObject from "./path-item-object.js";

export default function transformWebhooksObject(
  webhooksObject: WebhooksObject,
  options: GlobalContext,
  indent = "",
): TSNode {
  const memberIndent = `${indent}${INDENT}`;
  const type: TSNode[] = [];

  for (const [name, pathItemObject] of getEntries(webhooksObject, options)) {
    type.push(
      propertySignature({
        /* name          */ name: tsPropertyIndex(name),
        /* type          */ type: transformPathItemObject(
          pathItemObject,
          {
            path: createRef(["webhooks", name]),
            ctx: options,
          },
          memberIndent,
        ),
        /* modifiers     */ readonly: options.immutable,
        indent: memberIndent,
      }),
    );
  }

  return typeLiteral(type, indent);
}
