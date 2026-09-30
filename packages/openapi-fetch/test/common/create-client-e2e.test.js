import * as crypto from "node:crypto";
import * as https from "node:https";
import express from "express";
import * as forge from "node-forge";
import { Agent } from "undici";
import { expect, test } from "vitest";
import createClient from "../../src/index.js";

const pki = forge.pki;

const genCACert = async (opts = {}) => {
  const options = {
    ...{
      commonName: "Testing CA - DO NOT TRUST",
      bits: 2048,
    },
    ...opts,
  };

  const keyPair = await new Promise((res, rej) => {
    pki.rsa.generateKeyPair({ bits: options.bits }, (error, pair) => {
      if (error) {
        rej(error);
      } else {
        res(pair);
      }
    });
  });

  const cert = pki.createCertificate();
  cert.publicKey = keyPair.publicKey;
  cert.serialNumber = crypto.randomUUID().replace(/-/g, "");

  cert.validity.notBefore = new Date();
  cert.validity.notBefore.setDate(cert.validity.notBefore.getDate() - 1);
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  cert.setSubject([{ name: "commonName", value: options.commonName }]);
  cert.setExtensions([{ name: "basicConstraints", cA: true }]);

  cert.setIssuer(cert.subject.attributes);
  cert.sign(keyPair.privateKey, forge.md.sha256.create());

  return {
    ca: {
      key: pki.privateKeyToPem(keyPair.privateKey),
      cert: pki.certificateToPem(cert),
    },
    fingerprint: forge.util.encode64(
      pki.getPublicKeyFingerprint(keyPair.publicKey, {
        type: "SubjectPublicKeyInfo",
        md: forge.md.sha256.create(),
        encoding: "binary",
      }),
    ),
  };
};

const caToBuffer = (ca) => {
  return {
    key: Buffer.from(ca.key),
    cert: Buffer.from(ca.cert),
  };
};

const API_PORT = process.env.API_PORT || 4578;

const app = express();
app.get("/v1/foo", (_req, res) => {
  res.send("bar");
});

test("requestInitExt", async () => {
  const cert = await genCACert();
  const buffers = caToBuffer(cert.ca);
  const options = {};
  options.key = buffers.key;
  options.cert = buffers.cert;
  const httpsServer = https.createServer(options, app);
  httpsServer.listen(4578);
  const dispatcher = new Agent({
    connect: {
      rejectUnauthorized: false,
    },
  });
  const client = createClient({ baseUrl: `https://localhost:${API_PORT}`, requestInitExt: { dispatcher } });
  const fetchResponse = await client.GET("/v1/foo", { parseAs: "text" });
  httpsServer.closeAllConnections();
  httpsServer.close();
  expect(fetchResponse.response.ok).toBe(true);
});
