import type { ComponentsObject, GlobalContext } from "../types.js";
import { escObjKey, getEntries, getSchemaObjectComment, indent, tsOptionalProperty, tsReadonly } from "../utils.js";
import transformHeaderObject from "./header-object.js";
import transformParameterObject from "./parameter-object.js";
import transformPathItemObject from "./path-item-object.js";
import transformRequestBodyObject from "./request-body-object.js";
import transformResponseObject from "./response-object.js";
import transformSchemaObjectMap from "./schema-object-map.js";
import transformSchemaObject from "./schema-object.js";

export default function transformComponentsObject(components: ComponentsObject, ctx: GlobalContext): string {
  let { indentLv } = ctx;
  const output: string[] = ["{"];
  indentLv++;

  // schemas
  if (components.schemas) {
    const schemas = transformSchemaObjectMap(components.schemas, { path: "#/components/schemas/", ctx: { ...ctx, indentLv } });
    output.push(indent(`schemas: ${schemas};`, indentLv));
  } else {
    output.push(indent("schemas: never;", indentLv));
  }

  // responses
  if (components.responses) {
    output.push(indent("responses: {", indentLv));
    indentLv++;
    for (const [name, responseObject] of getEntries(components.responses, ctx.alphabetize, ctx.excludeDeprecated)) {
      const c = getSchemaObjectComment(responseObject, indentLv);
      if (c) output.push(indent(c, indentLv));
      let key = escObjKey(name);
      if (ctx.immutableTypes) key = tsReadonly(key);
      if ("$ref" in responseObject) {
        output.push(indent(`${key}: ${transformSchemaObject(responseObject, { path: `#/components/responses/${name}`, ctx })};`, indentLv));
      } else {
        const responseType = transformResponseObject(responseObject, {
          path: `#/components/responses/${name}`,
          ctx: { ...ctx, indentLv },
        });
        output.push(indent(`${key}: ${responseType};`, indentLv));
      }
    }
    indentLv--;
    output.push(indent("};", indentLv));
  } else {
    output.push(indent("responses: never;", indentLv));
  }

  // parameters
  if (components.parameters) {
    const parameters: string[] = [];
    indentLv++;

    for (const [name, parameterObject] of getEntries(components.parameters, ctx.alphabetize, ctx.excludeDeprecated)) {
      const c = getSchemaObjectComment(parameterObject, indentLv);
      if (c) parameters.push(indent(c, indentLv));
      let key = escObjKey(name);
      if (ctx.immutableTypes) key = tsReadonly(key);
      if ("$ref" in parameterObject) {
        parameters.push(indent(`${key}: ${transformSchemaObject(parameterObject, { path: `#/components/parameters/${name}`, ctx })};`, indentLv));
      } else {
        if (parameterObject.in !== "path" && !parameterObject.required) {
          key = tsOptionalProperty(key);
        }
        const parameterType = transformParameterObject(parameterObject, {
          path: `#/components/parameters/${name}`,
          ctx: { ...ctx, indentLv },
        });
        parameters.push(indent(`${key}: ${parameterType};`, indentLv));
      }
    }
    indentLv--;
    output.push(indent(`parameters: {`, indentLv), ...parameters, indent("};", indentLv));
  } else {
    output.push(indent("parameters: never;", indentLv));
  }

  // requestBodies
  if (components.requestBodies) {
    output.push(indent("requestBodies: {", indentLv));
    indentLv++;
    for (const [name, requestBodyObject] of getEntries(components.requestBodies, ctx.alphabetize, ctx.excludeDeprecated)) {
      const c = getSchemaObjectComment(requestBodyObject, indentLv);
      if (c) output.push(indent(c, indentLv));
      let key = escObjKey(name);
      if ("$ref" in requestBodyObject) {
        if (ctx.immutableTypes) key = tsReadonly(key);
        output.push(
          indent(
            `${key}: ${transformSchemaObject(requestBodyObject, {
              path: `#/components/requestBodies/${name}`,
              ctx: { ...ctx, indentLv },
            })};`,
            indentLv,
          ),
        );
      } else {
        if (!requestBodyObject.required) key = tsOptionalProperty(key);
        if (ctx.immutableTypes) key = tsReadonly(key);
        const requestBodyType = transformRequestBodyObject(requestBodyObject, {
          path: `#/components/requestBodies/${name}`,
          ctx: { ...ctx, indentLv },
        });
        output.push(indent(`${key}: ${requestBodyType};`, indentLv));
      }
    }
    indentLv--;
    output.push(indent("};", indentLv));
  } else {
    output.push(indent("requestBodies: never;", indentLv));
  }

  // headers
  if (components.headers) {
    output.push(indent("headers: {", indentLv));
    indentLv++;
    for (const [name, headerObject] of getEntries(components.headers, ctx.alphabetize, ctx.excludeDeprecated)) {
      const c = getSchemaObjectComment(headerObject, indentLv);
      if (c) output.push(indent(c, indentLv));
      let key = escObjKey(name);
      if (ctx.immutableTypes) key = tsReadonly(key);
      if ("$ref" in headerObject) {
        output.push(indent(`${key}: ${transformSchemaObject(headerObject, { path: `#/components/headers/${name}`, ctx })};`, indentLv));
      } else {
        const headerType = transformHeaderObject(headerObject, {
          path: `#/components/headers/${name}`,
          ctx: { ...ctx, indentLv },
        });
        output.push(indent(`${key}: ${headerType};`, indentLv));
      }
    }
    indentLv--;
    output.push(indent("};", indentLv));
  } else {
    output.push(indent("headers: never;", indentLv));
  }

  // pathItems
  if (components.pathItems) {
    output.push(indent("pathItems: {", indentLv));
    indentLv++;
    for (const [name, pathItemObject] of getEntries(components.pathItems, ctx.alphabetize, ctx.excludeDeprecated)) {
      let key = escObjKey(name);
      if (ctx.immutableTypes) key = tsReadonly(key);
      if ("$ref" in pathItemObject) {
        const c = getSchemaObjectComment(pathItemObject, indentLv);
        if (c) output.push(indent(c, indentLv));
        output.push(indent(`${key}: ${transformSchemaObject(pathItemObject, { path: `#/components/pathItems/${name}`, ctx })};`, indentLv));
      } else {
        output.push(
          indent(
            `${key}: ${transformPathItemObject(pathItemObject, {
              path: `#/components/pathItems/${name}`,
              ctx: { ...ctx, indentLv },
            })};`,
            indentLv,
          ),
        );
      }
    }
    indentLv--;
    output.push(indent("};", indentLv));
  } else {
    output.push(indent("pathItems: never;", indentLv));
  }

  indentLv--;
  output.push(indent("}", indentLv));
  return output.join("\n");
}
