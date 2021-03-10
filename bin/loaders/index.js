const mime = require("mime");
const yaml = require("js-yaml");
const { bold, yellow } = require("kleur");

const loadFromFs = require("./loadFromFs");
const loadFromHttp = require("./loadFromHttp");

async function load(pathToSpec, { auth }) {
  // option 1: remote URL
  if (/^https?:\/\//.test(pathToSpec)) {
    try {
      return loadFromHttp(pathToSpec, { auth });
    } catch (e) {
      if (e.code === "ENOTFOUND") {
        throw new Error(
          `The URL ${pathToSpec} could not be reached. Ensure the URL is correct, that you're connected to the internet and that the URL is reachable via a browser.`
        );
      }
      throw e;
    }
  }

  // option 2: local file
  return {
    body: loadFromFs(pathToSpec),
    contentType: mime.getType(pathToSpec),
  };
}

async function loadSpec(pathToSpec, { auth, log = true }) {
  if (log === true) {
    console.log(yellow(`🔭 Loading spec from ${bold(pathToSpec)}…`)); // only log if not writing to stdout
  }

  const { body, contentType } = await load(pathToSpec, { auth });

  switch (contentType) {
    case "application/openapi+yaml":
    case "text/yaml": {
      try {
        return yaml.load(body);
      } catch (err) {
        throw new Error(`YAML: ${err.toString()}`);
      }
    }
    case "application/json":
    case "application/json5":
    case "application/openapi+json": {
      try {
        return JSON.parse(body);
      } catch (err) {
        throw new Error(`JSON: ${err.toString()}`);
      }
    }
    default: {
      try {
        return JSON.parse(body); // unknown attempt 1: JSON
      } catch (err1) {
        try {
          return yaml.load(body); // unknown attempt 2: YAML
        } catch (err2) {
          // give up: unknown type
          throw new Error(`Unknown format${contentType ? `: "${contentType}"` : ""}. Only YAML or JSON supported.`);
        }
      }
    }
  }
}
exports.loadSpec = loadSpec;
