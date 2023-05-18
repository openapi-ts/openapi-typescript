import type { GlobalContext, OperationObject, ParameterObject, PathItemObject, PathsObject, ReferenceObject, RequestBodyObject } from "../types.js";
import { indent } from "../utils.js";
import transformSchemaObject from "./schema-object.js";

const httpMethods = ["get", "put", "post", "delete", "options", "head", "patch", "trace"] as const;

function getResponseTypes(operationId: string, responsesObj?: Record<string, any>): string {
  if (!responsesObj) return "void";

  const responses = Object.keys(responsesObj)
    .map(
      (httpStatusCode) => {
        if (responsesObj[httpStatusCode]?.content?.["application/json"]) {
          return `operations["${operationId}"]["responses"]["${httpStatusCode}"]["content"]["application/json"]`;
        }
        return `operations["${operationId}"]["responses"]["${httpStatusCode}"]`;
      }
    );
  if (responses?.length) {
    return responses.join(" | ");
  }
  return "void";
}

function getRequestBody(ctx: GlobalContext, operationId: string, body?: ReferenceObject | RequestBodyObject) {
  if (!body) return "never";
  console.log('op', operationId, body);
  const realBody = '$ref' in body ? ctx.parameters[body.$ref] : body;
  if (realBody.required) {
    return `operations["${operationId}"]["requestBody"]["content"]["application/json"]`;
  }
  return `Required<operations["${operationId}"]>["requestBody"]["content"]["application/json"] | void`;
}

function operationRequestType(spec: OperationObject, pathItem: PathItemObject, ctx: GlobalContext) {
  let hasQuery = false;
  let hasPath = false;

  function resolveParam(param: ReferenceObject | ParameterObject) {
    const finalParam = "$ref" in param ? ctx.parameters[param.$ref] : param;
    if (finalParam.in === "path") {
      hasPath = true;
    } else if (finalParam.in === "query") {
      hasQuery = true;
    }
  }

  spec.parameters?.forEach(resolveParam);
  pathItem.parameters?.forEach(resolveParam);

  /*
        P = core.ParamsDictionary,
        ResBody = any,
        ReqBody = any,
        ReqQuery = core.Query,
        Locals extends Record<string, any> = Record<string, any>
  */
  const params: string[] = [];
  if (hasPath) {
    params.push(`operations["${spec.operationId}"]["parameters"]["path"]`);
  } else {
    params.push("never");
  }

  if (spec.responses) {
    params.push(`express<AppLocals, RequestLocals>["${spec.operationId}"]["responses"] | void`);
  } else {
    params.push("void");
  }

  params.push(`express<AppLocals, RequestLocals>["${spec.operationId}"]["requestBody"]`);

  // Query handled in a different way, so just ignore it here
  params.push("Query");

  // Request locals
  params.push("RequestLocals");

  const parts = [
    indent('Request<', 3),
    params.map((p) => indent(p, 4)).join(', \n'),
    indent('>,', 3),
  ];

  parts.push(indent('AppLocals,', 3));

  if (hasQuery) {
    parts.push(indent(`operations["${spec.operationId}"]["parameters"]["query"]`, 3));
  } else {
    parts.push(indent('never', 3));
  }
  return parts.join('\n');
}

export function buildExpressObject(pathsObject: PathsObject, ctx: GlobalContext) {
  const output = ['{'];

  if (Object.keys(pathsObject).length) {
    for (const id of Object.keys(pathsObject)) {
      const detail = pathsObject[id];
      httpMethods.filter((method) => detail[method]).forEach((method) => {
        const spec = detail[method] as OperationObject;
        output.push(indent(`${spec.operationId}: {`, 1));
        output.push(indent(`requestBody: ${getRequestBody(ctx, spec.operationId!, spec.requestBody)};`, 2));
        output.push(indent(`responses: ${getResponseTypes(spec.operationId!, spec.responses)};`, 2));
        output.push(indent(`response: Response<express<AppLocals, RequestLocals>['${spec.operationId}']['responses']>;`, 2));
        output.push(indent(`request: ExpressRequest<\n${operationRequestType(spec, detail, ctx)}>;`, 2));
        output.push(indent(`handler: (`, 2));
        output.push(indent(`req: express<AppLocals, RequestLocals>['${spec.operationId}']['request'],`, 3));
        output.push(indent(`res: express<AppLocals, RequestLocals>['${spec.operationId}']['response'],`, 3));
        output.push(indent(') => void | Promise<void>;', 2));
        output.push(indent('}', 1));
      });
    }
  }

  output.push('}');
  return output.join('\n');
}

export function transformHandlers(pathsObject: PathsObject, ctx: GlobalContext) {
  const output = ['{'];

  if (Object.keys(pathsObject).length) {
    for (const id of Object.keys(pathsObject)) {
      const detail = pathsObject[id];
      output.push(indent(`'${id}': {`, 1));
      httpMethods.filter((method) => detail[method]).forEach((method) => {
        const spec = detail[method] as OperationObject;
        output.push(indent(`${method}: express<AppLocals, RequestLocals>['${spec.operationId}']['handler'];`, 2));
      });
      output.push(indent(`};`, 1));
    }
  }
  output.push('}');
  return output.join('\n');
}

export function transformHandlersByOperation(pathsObject: PathsObject, ctx: GlobalContext) {
  const output = ['{'];

  if (Object.keys(pathsObject).length) {
    for (const id of Object.keys(pathsObject)) {
      const detail = pathsObject[id];
      httpMethods.filter((method) => detail[method]).forEach((method) => {
        const spec = detail[method] as OperationObject;
        if (spec.operationId) {
          output.push(indent(`${spec.operationId}: express<AppLocals, RequestLocals>['${spec.operationId}']['handler'];`, 2));
        }
      });
    }
  }
  output.push('}');
  return output.join('\n');
}

export function transformExpress(pathsObject: PathsObject, ctx: GlobalContext) {
  return {
    express: buildExpressObject(pathsObject, ctx),
    pathHandlers: transformHandlers(pathsObject, ctx),
    operationHandlers: transformHandlersByOperation(pathsObject, ctx),
  }
}