const { resolve } = require('path');
const { existsSync, readFile } = require('fs');

module.exports = (pathToSpec) => {
  const pathname = resolve(process.cwd(), pathToSpec);
  const pathExists = existsSync(pathname);

  return new Promise((resolve, reject) => {
    if (pathExists) {
      readFile(pathname, 'UTF-8', (err, data) => {
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
