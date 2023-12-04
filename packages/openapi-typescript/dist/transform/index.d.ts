import ts from "typescript";
import { GlobalContext, OpenAPI3 } from "../types.js";
export default function transformSchema(schema: OpenAPI3, ctx: GlobalContext): ts.Node[];
