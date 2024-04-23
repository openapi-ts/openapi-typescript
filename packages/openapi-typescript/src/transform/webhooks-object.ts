import ts from "typescript";
import { tsModifiers, tsPropertyIndex } from "../lib/ts.js";
import { createRef, getEntries } from "../lib/utils.js";
import type { GlobalContext, WebhooksObject } from "../types.js";
import transformPathItemObject from "./path-item-object.js";

export default function transformWebhooksObject(webhooksObject: WebhooksObject, options: GlobalContext): ts.TypeNode {
  const type: ts.TypeElement[] = [];

  for (const [name, pathItemObject] of getEntries(webhooksObject, options)) {
    type.push(
      ts.factory.createPropertySignature(
        /* modifiers     */ tsModifiers({
          readonly: options.immutable,
        }),
        /* name          */ tsPropertyIndex(name),
        /* questionToken */ undefined,
        /* type          */ transformPathItemObject(pathItemObject, {
          path: createRef(["webhooks", name]),
          ctx: options,
        }),
      ),
    );
  }

  return ts.factory.createTypeLiteralNode(type);
}
