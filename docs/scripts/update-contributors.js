import fs from "node:fs";
import { URL } from "node:url";

const CONTRIBUTORS_JSON = new URL("../data/contributors.json", import.meta.url);

const data = JSON.parse(fs.readFileSync(CONTRIBUTORS_JSON, "utf8"));

const ONE_WEEK = 1000 * 60 * 60 * 24;

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
  throw new Error(
    'GITHUB_TOKEN not set! Create a token with "read:user" scope and set as an environment variable.\nhttps://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic',
  );
}

async function fetchUserInfo(username) {
  const res = await fetch(`https://api.github.com/users/${username}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) {
    throw new Error(`${res.url} responded with ${res.status}`);
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

const CONTRIBUTORS = {
  "openapi-typescript": new Set([
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
    "davidleger95",
    "phk422",
    "mzronek",
    "raurfang",
    "JeanRemiDelteil",
    "TzviPM",
    "LucaSchwan",
    "nzapponi",
    "luchsamapparat",
    "nmacmunn",
  ]),
  "openapi-fetch": new Set([
    "drwpow",
    "fergusean",
    "shinzui",
    "ezpuzz",
    "KotoriK",
    "fletchertyler914",
    "nholik",
    "roj1512",
    "nickcaballero",
    "hd-o",
    "kecrily",
    "psychedelicious",
    "muttonchop",
    "marcomuser",
    "HugeLetters",
    "Fumaz",
    "darwish",
    "kaechele",
    "phk422",
    "mikestopcontinues",
    "JE-Lee",
    "vipentti",
    "armandabric",
    "illright",
  ]),
  "openapi-react-query": new Set(["drwpow", "kerwanp", "yoshi2no"]),
  "swr-openapi": new Set(["htunnicliff"])
};

async function main() {
  let i = 0;
  const total = Object.values(CONTRIBUTORS).reduce((total, next) => total + next.size, 0);
  await Promise.all(
    Object.entries(CONTRIBUTORS).map(async ([repo, contributors]) => {
      data[repo] ??= [];
      for (const username of [...contributors]) {
        i++;
        // skip profiles that have been updated within the past week
        const { lastFetch } = data[repo].find((u) => u.username === username) ?? { lastFetch: 0 };
        if (Date.now() - lastFetch < ONE_WEEK) {
          // biome-ignore lint/suspicious/noConsoleLog: this is a script
          console.log(`[${i}/${total}] (Skipped ${username})`);
          continue;
        }
        try {
          const { avatar_url: avatar, name } = await fetchUserInfo(username);
          const userData = {
            username,
            name,
            avatar,
            links: [{ icon: "github", link: `https://github.com/${username}` }],
            lastFetch: new Date().getTime(),
          };
          upsert(data[repo], userData);
          // biome-ignore lint/suspicious/noConsoleLog: this is a script
          console.log(`[${i}/${total}] Updated for ${username}`);
          fs.writeFileSync(new URL("../data/contributors.json", import.meta.url), JSON.stringify(data)); // update file while fetching (sync happens safely in between fetches)
        } catch (err) {
          throw new Error(err);
        }
      }
    }),
  );
}

main();
