import fs from "node:fs";
import { URL } from "node:url";

const AVATAR_RE = /property="og:image" content="([^"]+)/;
const TITLE_RE = /<title>[^(<]*\(([^)<]+)/;
const CONTRIBUTORS_JSON = new URL("../data/contributors.json", import.meta.url);

const contributors = JSON.parse(fs.readFileSync(CONTRIBUTORS_JSON, "utf8"));

const ONE_WEEK = 1000 * 60 * 60 * 24 * 7;

async function fetchUserInfo(username) {
  const res = await fetch(`https://github.com/${username}`);
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
    "mmiszy",
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
    "MikeYermolayev",
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
    "Peteck",
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
  ]),
];

async function main() {
  await Promise.all(
    ["openapi-typescript", "openapi-fetch"].map(async (repo) => {
      const userlist =
        repo === "openapi-fetch"
          ? OPENAPI_FETCH_CONTRIBUTORS
          : OPENAPI_TS_CONTRIBUTORS;
      for (const username of userlist) {
        // skip profiles that have been updated within the past week
        const { lastFetch } = contributors[repo].find(
          (u) => u.username === username,
        ) ?? { lastFetch: 0 };
        if (Date.now() - lastFetch < ONE_WEEK) {
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
          console.log(`Updated old contributor data for ${username}`); // eslint-disable-line no-console
          fs.writeFileSync(
            new URL("../data/contributors.json", import.meta.url),
            JSON.stringify(contributors),
          ); // update file while fetching (sync happens safely in between fetches)
        } catch (err) {
          throw new Error(err);
        }
      }
    }),
  );
  fs.writeFileSync(
    new URL("../data/contributors.json", import.meta.url),
    JSON.stringify(contributors),
  );
}

main();
