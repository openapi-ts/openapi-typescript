import openapiTS, { astToString, tsComment, type OpenAPITSOptions } from "openapi-typescript";

const options: OpenAPITSOptions = {
  transform(schema) {
    if (schema.format === "date-time") return { schema: "Date", questionToken: false };
  },
  postTransform(type) {
    return type;
  },
  transformProperty(property) {
    return { ...property, readonly: false, comment: tsComment(["@custom"], property.indent) };
  },
};
const result: Promise<string> = openapiTS({ openapi: "3.1.0", info: { title: "test", version: "1" } }, options);
result.then(astToString);
// @ts-expect-error obsolete printer options must require explicit migration
astToString("type T = string;", { formatOptions: { removeComments: true } });
