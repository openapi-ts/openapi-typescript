const url = require("url");
const adapters = {
  "http:": require("http"),
  "https:": require("https"),
};

function fetchFrom(inputUrl) {
  return adapters[url.parse(inputUrl).protocol];
}

function buildOptions(pathToSpec) {
  const requestUrl = url.parse(pathToSpec);
  return {
    method: "GET",
    hostname: requestUrl.hostname,
    port: requestUrl.port,
    path: requestUrl.path,
  };
}

module.exports = (pathToSpec) => {
  return new Promise((resolve, reject) => {
    const opts = buildOptions(pathToSpec);
    const req = fetchFrom(pathToSpec).request(opts, (res) => {
      let rawData = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        rawData += chunk;
      });
      res.on("end", () => {
        resolve(rawData);
      });
    });
    req.on("error", (err) => {
      reject(err);
    });
    req.end();
  });
};
