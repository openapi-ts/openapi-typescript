---
"openapi-typescript": major
---

Support applications using TypeScript 7 by making the JavaScript compiler a runtime dependency instead of a peer dependency. The application compiler and generator compiler can now be installed independently, without aliases or custom loaders.

The generator's compiler is exported as `ts`. **Breaking:** Node API consumers that create, inspect, or print AST nodes must import `ts` from `openapi-typescript` instead of a separately installed `typescript`. This keeps factories, type guards, AST types, and the printer on the same compiler version. CLI usage and generated types are unchanged.

CommonJS declarations now match the existing runtime: `require("openapi-typescript")` returns named exports (including `ts`) and a `.default` generator function, not a directly callable function.
