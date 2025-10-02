import fs from "node:fs/promises";
import timers from "node:timers/promises";
import { URL } from "node:url";

const MAINTAINERS = {
  drwpow: "Lead, Creator openapi-typescript/openapi-fetch",
  kerwanp: "Core Contributor, Creator openapi-react-query",
  gzm0: "Core Contributor",
  duncanbeevers: "Core Contributor",
  htunnicliff: "Core Contributor, Creator swr-openapi",
};

// all usernames
const CONTRIBUTORS = new Set([
  "drwpow",
  "psmyrdek",
  "enmand",
  "atlefren",
  "tpdewolf",
  "tombarton",
  "svnv",
  "sorin-davidoi",
  "scvnathan",
  "lbenie",
  "bokub",
  "antonk52",
  "tshelburne",
  "typeofweb",
  "skh-",
  "BlooJeans",
  "selbekk",
  "Mause",
  "henhal",
  "gr2m",
  "samdbmg",
  "rendall",
  "robertmassaioli",
  "jankuca",
  "th-m",
  "asithade",
  "misha-erm",
  "radist2s",
  "FedeBev",
  "yamacent",
  "dnalborczyk",
  "FabioWanner",
  "ashsmith",
  "mehalter",
  "Chrg1001",
  "sharmarajdaksh",
  "shuluster",
  "FDiskas",
  "ericzorn93",
  "mbelsky",
  "techbech",
  "rustyconover",
  "bunkscene",
  "ottomated",
  "sadfsdfdsa",
  "ajaishankar",
  "dominikdosoudil",
  "kgtkr",
  "berzi",
  "PhilipTrauner",
  "Powell-v2",
  "kerwanp",
  "gzm0",
  "htunnicliff",
  "duncanbeevers",
  "tkukushkin",
  "Semigradsky",
  "MrLeebo",
  "axelhzf",
  "imagoiq",
  "BTMPL",
  "HiiiiD",
  "yacinehmito",
  "sajadtorkamani",
  "mvdbeek",
  "sgrimm",
  "Swiftwork",
  "mtth",
  "mitchell-merry",
  "qnp",
  "shoffmeister",
  "liangskyli",
  "happycollision",
  "ysmood",
  "barakalon",
  "horaklukas",
  "pvanagtmaal",
  "toomuchdesign",
  "psychedelicious",
  "tkrotoff",
  "pimveldhuisen",
  "asvishnyakov",
  "SchabaJo",
  "AhsanFazal",
  "ElForastero",
  "msgadi",
  "muttonchop",
  "christoph-fricke",
  "JorrinKievit",
  "WickyNilliams",
  "hrsh7th",
  "phk422",
  "mzronek",
  "raurfang",
  "phk422",
  "JeanRemiDelteil",
  "TzviPM",
  "LucaSchwan",
  "nzapponi",
  "luchsamapparat",
  "nmacmunn",
  "fergusean",
  "shinzui",
  "ezpuzz",
  "KotoriK",
  "yoshi2no",
  "fletchertyler914",
  "nholik",
  "nkt",
  "CodazziS",
  "michalfedyna",
  "roj1512",
  "IGx89",
  "nickcaballero",
  "tcztzy",
  "yukukotani",
  "hd-o",
  "zaru",
  "kecrily",
  "marcomuser",
  "HugeLetters",
  "Fumaz",
  "illright",
  "FreeAoi",
  "zhu-hong",
  "hungify",
  "nmacmunn",
  "luchsamapparat",
  "jaredLunde",
  "armandabric",
  "fitztrev",
  "jonathanmv",
  "darwish",
  "swatcher",
  "Snaylaker",
  "avaly",
  "Mask-MJ",
  "danmichaelo",
  "333fred",
  "thatsprettyfaroutman",
  "kaechele",
  "SebastienGllmt",
  "morleytatro",
  "ngraef",
  "valerijmedvid",
  "brunolca",
  "Gruak",
  "mikestopcontinues",
  "JE-Lee",
  "vipentti",
  "armandabric",
  "goce-cz",
  "BradHacker",
  "crutch12",
  "HHongSeungWoo",
  "yicrotkd",
  "makotot",
  "tommy-ish",
  "BlakeSzabo",
  "ElayGelbart",
  "piousdeer",
  "DjordyKoert",
  "zsugabubus",
  "jo-m",
  "prewk",
  "HugeLetters",
  "sultaniman",
  "luchsamapparat",
  "patzick",
  "mellster2012",
  "mochi-sann",
  "laurenz-glueck",
  "gduliscouet-ubitransport",
  "alikehel",
  "chailandau",
  "bennobuilder",
  "HagenMorano",
  "jungwoo3490",
  "freshgiammi",
  "lukasedw",
  "ViktorPontinen",
  "kevmo314",
]);

const ONE_WEEK = 1000 * 60 * 60 * 24;

const CONTRIBUTORS_JSON = new URL("../data/contributors.json", import.meta.url);

const data = JSON.parse(await fs.readFile(CONTRIBUTORS_JSON, "utf8"));

class UserFetchError extends Error {
  /**
   * @param {string} message
   * @param {Response} response
   */
  constructor(message, response) {
    super(message);
    this.name = "UserFetchError";
    this.response = response;
  }

  /**
   * @returns {boolean}
   */
  get notFound() {
    return this.response.status === 404;
  }
}

async function fetchUserInfo(username) {
  const res = await fetch(`https://api.github.com/users/${username}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!res.ok) {
    const retryAfter = res.headers.get("retry-after"); // seconds
    const ratelimitRemaining = res.headers.get("x-ratelimit-remaining"); // quantity of requests remaining
    const ratelimitReset = res.headers.get("x-ratelimit-reset"); // UTC epoch seconds

    if (retryAfter || ratelimitRemaining === "0" || ratelimitReset) {
      // See https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api?apiVersion=2022-11-28#handle-rate-limit-errors-appropriately
      console.warn("Rate limited by GitHub API");

      let timeoutInMilliseconds = 60 * 1000; // default to 1 minute
      if (retryAfter) {
        timeoutInMilliseconds = retryAfter * 1000;
      } else if (ratelimitRemaining === "0" && ratelimitReset) {
        timeoutInMilliseconds = ratelimitReset * 1000 - Date.now();
      }

      console.warn(`Waiting for ${timeoutInMilliseconds / 1000} seconds...`);

      await timers.setTimeout(timeoutInMilliseconds);

      return await fetchUserInfo(username);
    }

    throw new UserFetchError(`${res.url} responded with ${res.status}`, res);
  }

  return await res.json();
}

function upsert(list, userData) {
  const i = list.findIndex((u) => u.username === userData.username);
  if (i >= 0) {
    list[i] = userData;
  } else {
    list.push(userData);
  }
}

async function main() {
  let i = 0;
  // note: this is sequential, but the GitHub API is fast. It won’t always allow
  // too many simultaneous requests, and a queue is overkill for this amount of data.
  for (const username of CONTRIBUTORS) {
    const group = username in MAINTAINERS ? "maintainers" : "contributors";
    i++;
    // skip profiles that have been updated within the past week
    const { lastFetch } = data[group]?.find((u) => u.username === username) ?? { lastFetch: 0 };
    if (Date.now() - lastFetch < ONE_WEEK) {
      // biome-ignore lint/suspicious/noConsole: this is a script
      console.log(`[${i}/${CONTRIBUTORS.size}] (Skipped ${username})`);
      continue;
    }
    try {
      const { avatar_url: avatar, name } = await fetchUserInfo(username);
      const userData = {
        username,
        name,
        avatar,
        links: [{ icon: "github", link: `https://github.com/${username}` }],
        title: MAINTAINERS[username] ?? "Contributor",
        lastFetch: new Date().getTime(),
      };
      upsert(data[group], userData);
      // biome-ignore lint/suspicious/noConsole: this is a script
      console.log(`[${i}/${CONTRIBUTORS.size}] Updated for ${username}`);
      await fs.writeFile(new URL("../data/contributors.json", import.meta.url), JSON.stringify(data)); // update file while fetching (sync happens safely in between fetches)
      await new Promise((resolve) => setTimeout(resolve, 1_000)); // GitHub 403s with too many rapid requests.
    } catch (err) {
      if (err instanceof UserFetchError && err.notFound) {
        // biome-ignore lint/suspicious/noConsole: this is a script
        console.warn(`[${i}/${total}] (Skipped ${username}, not found)`);
        continue;
      }
      throw new Error(err);
    }
  }
}

if (import.meta.main) {
  main();
}
