const fs = require("fs");
const path = require("path");

module.exports = (pathToSpec) => {
  const pathname = path.resolve(process.cwd(), pathToSpec);
  const pathExists = fs.existsSync(pathname);

  return new Promise((resolve, reject) => {
    if (pathExists) {
      fs.readFile(pathname, "UTF-8", (err, data) => {
        if (err) {
          reject(err);
        }
        resolve(data);
      });
    } else {
      reject(`Cannot find spec under the following path: ${pathname}`);
    }
  });
};
