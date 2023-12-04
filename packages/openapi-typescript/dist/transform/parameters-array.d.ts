import ts from "typescript";
import { ParameterObject, ReferenceObject, TransformNodeOptions } from "../types.js";
export declare function transformParametersArray(parametersArray: (ParameterObject | ReferenceObject)[], options: TransformNodeOptions): ts.TypeElement[];
