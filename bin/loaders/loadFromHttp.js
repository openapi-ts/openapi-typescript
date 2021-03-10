const http = require("http");
const https = require("https");
const { parse } = require("url");

// config
const MAX_REDIRECT_COUNT = 10;

function fetch(url, opts, { redirectCount = 0 } = {}) {
  return new Promise((resolve, reject) => {
    const { protocol } = parse(url);

    if (protocol !== "http:" && protocol !== "https:") {
      throw new Error(`Unsupported protocol: "${protocol}". URL must start with "http://" or "https://".`);
    }

    const fetchMethod = protocol === "https:" ? https : http;
    const req = fetchMethod.request(url, opts, (res) => {
      let rawData = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        rawData += chunk;
      });
      res.on("end", () => {
        // 2xx: OK
        if (res.statusCode >= 200 && res.statusCode < 300) {
          return resolve({
            body: rawData,
            contentType: res.headers["content-type"].split(";")[0].trim(),
          });
        }

        // 3xx: follow redirect (if given)
        if (res.statusCode >= 300 && res.headers.location) {
          redirectCount += 1;
          if (redirectCount >= MAX_REDIRECT_COUNT) {
            reject(`Max redirects exceeded`);
            return;
          }
          console.log(`🚥 Redirecting to ${res.headers.location}…`);
          return fetch(res.headers.location, opts).then(resolve);
        }

        // everything else: throw
        return reject(rawData || `${res.statusCode} ${res.statusMessage}`);
      });
    });
    req.on("error", (err) => {
      reject(err);
    });
    req.end();
  });
}

function loadFromHttp(pathToSpec, { auth }) {
  return fetch(pathToSpec, { method: "GET", auth });
}
module.exports = loadFromHttp;
