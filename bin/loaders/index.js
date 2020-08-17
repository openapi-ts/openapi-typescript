const yaml = require("js-yaml");
const chalk = require("chalk");

const loadFromFs = require("./loadFromFs");
const loadFromHttp = require("./loadFromHttp");

async function load(pathToSpec) {
  let rawSpec;
  if (/^https?:\/\//.test(pathToSpec)) {
    try {
      rawSpec = await loadFromHttp(pathToSpec);
    } catch (e) {
      if (e.code === 'ENOTFOUND') {
        throw new Error(`The URL ${pathToSpec} could not be reached. Ensure the URL is correct, that you're connected to the internet and that the URL is reachable via a browser.`)
      }
      throw e;
    }
  } else {
    rawSpec = await loadFromFs(pathToSpec);
  }
  return rawSpec;
}

function isYamlSpec(rawSpec, pathToSpec) {
  return /\.ya?ml$/i.test(pathToSpec) || rawSpec[0] !== "{";
}

module.exports.loadSpec = async (pathToSpec) => {
  console.log(chalk.yellow(`🤞 Loading spec from ${chalk.bold(pathToSpec)}…`));
  const rawSpec = await load(pathToSpec);

  try {
    if (isYamlSpec(rawSpec, pathToSpec)) {
      return yaml.safeLoad(rawSpec);
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
    throw new Error(
      `The spec under ${pathToSpec} couldn’t be parsed neither as YAML nor JSON.`
    );
  }
};
