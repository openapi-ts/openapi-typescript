---
title: Examples
---

# Examples

This library is made to be used through an integration with your favorite framework but you can as well use it directly as a document generator.

## Express

```ts twoslash
// @noErrors
import express from "express";
import { generateDocument } from "openapi-metadata";
import { generateScalarUI } from "openapi-metadata/ui";

const app = express();

const document = await generateDocument(yourConfiguration);

app.get("/api", async (req, res) => {
  res.send(JSON.stringify(document));
});

app.get("/api/docs", (req, res) => {
  const ui = generateScalarUI("/api");
  res.send(ui);
});
```

## Fastify

```ts twoslash
// @noErrors
import fastify from "fastify";
import { generateDocument } from "openapi-metadata";
import { generateScalarUI } from "openapi-metadata/ui";

const app = Fastify();

const document = await generateDocument(yourConfiguration);

app.get("/api", async () => {
  return document;
});

app.get("/api/docs", () => {
  const ui = generateScalarUI("/api");
  return ui;
});
```
