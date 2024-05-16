import fs from "node:fs";
import { URL } from "node:url";

const AVATAR_RE = /property="og:image" content="([^"]+)/;
const TITLE_RE = /<title>[^(<]*\(([^)<]+)/;
const CONTRIBUTORS_JSON = new URL("../data/contributors.json", import.meta.url);

const contributors = JSON.parse(fs.readFileSync(CONTRIBUTORS_JSON, "utf8"));

const ONE_MONTH = 1000 * 60 * 60 * 24 * 7 * 30;

async function fetchUserInfo(username) {
  const res = await fetch(`https://github.com/${username}`, {
    headers: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.5",
      "cache-control": "no-cache",
      connection: "keep-alive",
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:126.0) Gecko/20100101 Firefox/126.0",
    },
  });
  if (!res.ok) {
    throw new Error(`${res.url} responded with ${res.status}`);
  }
  const body = await res.text();
  const avatarMatch = body.match(AVATAR_RE);
  if (!avatarMatch) {
    throw new Error(`Could not find avatar for ${username}`);
  }

  const nameMatch = body.match(TITLE_RE);
  let name = username;
  if (nameMatch?.[1]) {
    name = nameMatch[1];
  }

  return {
    avatar: avatarMatch[1],
    name,
  };
}

function upsert(list, userData) {
  const i = list.findIndex((u) => u.username === userData.username);
  if (i >= 0) {
    list[i] = userData;
  } else {
    list.push(userData);
  }
}

const OPENAPI_TS_CONTRIBUTORS = [
  ...new Set([
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
];

export const OPENAPI_FETCH_CONTRIBUTORS = [
  ...new Set([
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
];

async function main() {
  await Promise.all(
    ["openapi-typescript", "openapi-fetch"].map(async (repo) => {
      const userlist = repo === "openapi-fetch" ? OPENAPI_FETCH_CONTRIBUTORS : OPENAPI_TS_CONTRIBUTORS;
      for (const username of userlist) {
        // skip profiles that have been updated within the past week
        const { lastFetch } = contributors[repo].find((u) => u.username === username) ?? { lastFetch: 0 };
        if (Date.now() - lastFetch < ONE_MONTH) {
          continue;
        }

        // note: fetch sequentially, otherwise GitHub times out (429)
        // also run on every docs build to pick up updated avatars
        try {
          const userData = {
            username,
            ...(await fetchUserInfo(username)),
            links: [{ icon: "github", link: `https://github.com/${username}` }],
            lastFetch: new Date().getTime(),
          };
          upsert(contributors[repo], userData);
          // biome-ignore lint/suspicious/noConsoleLog: this is  a script
          console.log(`Updated old contributor data for ${username}`);
          fs.writeFileSync(new URL("../data/contributors.json", import.meta.url), JSON.stringify(contributors)); // update file while fetching (sync happens safely in between fetches)
          await new Promise((resolve) => setTimeout(resolve, 750)); // sleep to prevent 429
        } catch (err) {
          throw new Error(err);
        }
      }
    }),
  );
}

main();
