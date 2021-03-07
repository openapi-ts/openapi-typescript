const mime = require("mime");
const yaml = require("js-yaml");
const { bold, yellow } = require("kleur");

const loadFromFs = require("./loadFromFs");
const loadFromHttp = require("./loadFromHttp");

async function load(pathToSpec) {
  // option 1: remote URL
  if (/^https?:\/\//.test(pathToSpec)) {
    try {
      const rawSpec = await loadFromHttp(pathToSpec);
      return rawSpec;
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
  return loadFromFs(pathToSpec);
}

module.exports.loadSpec = async (pathToSpec, { log = true }) => {
  if (log === true) {
    console.log(yellow(`🤞 Loading spec from ${bold(pathToSpec)}…`)); // only log if not writing to stdout
  }

  const rawSpec = await load(pathToSpec);

  switch (mime.getType(pathToSpec)) {
    case "text/yaml": {
      try {
        return yaml.load(rawSpec);
      } catch (err) {
        throw new Error(`YAML: ${err.toString()}`);
      }
    }
    case "application/json":
    case "application/json5": {
      try {
        return JSON.parse(rawSpec);
      } catch (err) {
        throw new Error(`JSON: ${err.toString()}`);
      }
    }
    default: {
      throw new Error(`Unknown format: ${contentType}. Only YAML or JSON supported.`);
    }
  }
};
