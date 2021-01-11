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

function isYamlSpec(rawSpec, pathToSpec) {
  return /\.ya?ml$/i.test(pathToSpec) || rawSpec[0] !== "{";
}

module.exports.loadSpec = async (pathToSpec, { log = true }) => {
  if (log === true) {
    console.log(yellow(`🤞 Loading spec from ${bold(pathToSpec)}…`)); // only log if not writing to stdout
  }
  const rawSpec = await load(pathToSpec);

  try {
    if (isYamlSpec(rawSpec, pathToSpec)) {
      return yaml.load(rawSpec);
    }
  } catch (err) {
    let message = `The spec under ${pathToSpec} seems to be YAML, but it couldn’t be parsed.`;

    if (err.message) {
      message += `\n${err.message}`;
    }

    throw new Error(message);
  }

  try {
    return JSON.parse(rawSpec);
  } catch {
    throw new Error(`The spec under ${pathToSpec} couldn’t be parsed neither as YAML nor JSON.`);
  }
};
