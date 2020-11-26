const fs = require("fs");
const path = require("path");

module.exports = (pathToSpec) => {
  const pathname = path.resolve(process.cwd(), pathToSpec);
  const pathExists = fs.existsSync(pathname);

  if (!pathExists) {
    throw new Error(`Cannot find spec under the following path: ${pathname}`);
  }

  return fs.readFileSync(pathname, "utf8");
};
