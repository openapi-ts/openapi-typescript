const url = require("url");

function loadFromHttp(pathToSpec, { auth }) {
  const { protocol } = url.parse(pathToSpec);

  if (protocol !== "http:" && protocol !== "https:") {
    throw new Error(`Unsupported protocol: "${protocol}". URL must start with "http://" or "https://".`);
  }

  const fetch = require(protocol === "https:" ? "https" : "http");
  return new Promise((resolve, reject) => {
    const req = fetch.request(
      pathToSpec,
      {
        method: "GET",
        auth,
      },
      (res) => {
        let rawData = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          rawData += chunk;
        });
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(rawData);
          } else {
            reject(rawData || `${res.statusCode} ${res.statusMessage}`);
          }
        });
      }
    );
    req.on("error", (err) => {
      reject(err);
    });
    req.end();
  });
}
module.exports = loadFromHttp;
