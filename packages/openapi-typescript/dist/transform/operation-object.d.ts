import ts from "typescript";
import { OperationObject, TransformNodeOptions } from "../types.js";
export default function transformOperationObject(operationObject: OperationObject, options: TransformNodeOptions): ts.TypeElement[];
export declare function injectOperationObject(operationId: string, operationObject: OperationObject, options: TransformNodeOptions): void;
