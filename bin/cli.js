#!/usr/bin/env node

const fs = require("fs");
const chalk = require("chalk");
const path = require("path");
const meow = require("meow");
const { default: swaggerToTS } = require("../dist-node");
const { loadSpec } = require("./loaders");

const cli = meow(
  `Usage
  $ swagger-to-ts [input] [options]

Options
  --help                display this
  --output, -o          specify output file
  --prettier-config     (optional) specify path to Prettier config file
`,
  {
    flags: {
      output: {
        type: "string",
        alias: "o",
      },
      prettierConfig: {
        type: "string",
      },
    },
  }
);

console.info(chalk.bold(`✨ swagger-to-ts 2.0`));
console.info(
  "This library has been updated to 2.0 with improved generation. If you experience issues you can use the deprecated v1 with `npx @manifoldco/swagger-to-ts@1 …`"
);

const pathToSpec = cli.input[0];
const timeStart = process.hrtime();

(async () => {
  let spec = "";
  try {
    spec = await loadSpec(pathToSpec);
  } catch (e) {
    console.error(chalk.red(`❌ "${e}"`));
    return;
  }

  const result = swaggerToTS(spec, {
    prettierConfig: cli.flags.prettierConfig,
  });

  // Write to file if specifying output
  if (cli.flags.output) {
    const outputFile = path.resolve(process.cwd(), cli.flags.output);

    // recursively create parent directories if they don’t exist
    const parentDirs = cli.flags.output.split(path.sep);
    for (var i = 1; i < parentDirs.length; i++) {
      const dir = path.resolve(process.cwd(), ...parentDirs.slice(0, i));
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
    }

    fs.writeFileSync(outputFile, result, "utf8");

    const timeEnd = process.hrtime(timeStart);
    const time = timeEnd[0] + Math.round(timeEnd[1] / 1e6);
    console.log(
      chalk.green(
        `🚀 ${cli.input[0]} -> ${chalk.bold(cli.flags.output)} [${time}ms]`
      )
    );
    return;
  }

  // Otherwise, return result
  return result;
})();
