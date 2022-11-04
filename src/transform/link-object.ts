import type { GlobalContext, LinkObject } from "../types";
import { escStr } from "../utils.js";

export default function transformLinkObject(linkObject: LinkObject, ctx: GlobalContext): string {
  if (linkObject.operationRef) return linkObject.operationRef;
  if (linkObject.operationId) return `operations[${escStr(linkObject.operationId)}]`;
  return "";
}
