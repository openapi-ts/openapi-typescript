import openapiTS = require("openapi-typescript");

const result: Promise<string> = openapiTS.default(
  { openapi: "3.1.0", info: { title: "test", version: "1" } },
  { transformProperty: (property) => ({ ...property, readonly: true }) },
);
result.then(openapiTS.astToString);
