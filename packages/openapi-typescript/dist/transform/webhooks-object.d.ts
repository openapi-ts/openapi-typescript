import ts from "typescript";
import type { GlobalContext, WebhooksObject } from "../types.js";
export default function transformWebhooksObject(webhooksObject: WebhooksObject, options: GlobalContext): ts.TypeNode;
