---
"openapi-typescript": major
---

⚠️ **Breaking**: The Node.js API now returns the TypeScript AST for the main method as well as `transform()` and `postTransform()`. To migrate, you’ll have to use the `typescript` compiler API:

```diff
+ import ts from "typescript";

+ const DATE = ts.factory.createIdentifier("Date");
+ const NULL = ts.factory.createLiteralTypeNode(ts.factory.createNull());

  const ast = await openapiTS(mySchema, {
    transform(schemaObject, metadata) {
      if (schemaObject.format === "date-time") {
-       return schemaObject.nullable ? "Date | null" : "Date";
+       return schemaObject.nullable
+         ? ts.factory.createUnionTypeNode([DATE, NULL])
+         : DATE;
      }
    },
  };
```

Though it’s more verbose, it’s also more powerful, as now you have access to additional properties of the generated code you didn’t before (such as injecting comments).

For example syntax, search this codebae to see how the TypeScript AST is used.

Also see [AST Explorer](https://astexplorer.net/)’s `typescript` parser to inspect how TypeScript is interpreted as an AST.
