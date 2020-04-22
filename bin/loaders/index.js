const yaml = require("js-yaml");
const chalk = require("chalk");

const loadFromFs = require("./loadFromFs");
const loadFromHttp = require("./loadFromHttp");

async function load(pathToSpec) {
  let rawSpec;
  if (/^https?:\/\//.test(pathToSpec)) {
    rawSpec = await loadFromHttp(pathToSpec);
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
  } catch {
    throw new Error(
      `The spec under ${pathToSpec} seems to be YAML, but it couldn’t be parsed.`
    );
  }

  try {
    return JSON.parse(rawSpec);
  } catch {
    throw new Error(
      `The spec under ${pathToSpec} couldn’t be parsed neither as YAML nor JSON.`
    );
  }
};
