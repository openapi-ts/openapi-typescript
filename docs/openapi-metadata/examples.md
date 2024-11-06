---
title: Examples
---

# Examples

This library is made to be used through an integration with your favorite framework but you can as well use it directly as a document generator.

## Express

```ts
import express from "express";
import { generateDocument } from "openapi-metadata";
import { generateScalarUI } from "openapi-metadata/ui";

const app = express();

app.get("/api", async (req, res) => {
  const document = await generateDocument(yourConfiguration);
  res.send(JSON.stringify(document));
});

app.get("/api/docs", (req, res) => {
  const ui = generateScalarUI("/api");
  res.send(ui);
});
```

## Fastify

```ts
import fastify from "fastify";
import { generateDocument } from "openapi-metadata";
import { generateScalarUI } from "openapi-metadata/ui";

const app = Fastify();

app.get("/api", async () => {
  const document = await generateDocument(yourConfiguration);
  return document;
});

app.get("/api/docs", () => {
  const ui = generateScalarUI("/api");
  return ui;
});
```
