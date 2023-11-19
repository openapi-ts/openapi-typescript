import fs from "node:fs";
import { URL } from "node:url";

const AVATAR_RE = /property="og:image" content="([^"]+)/;
const TITLE_RE = /<title>[^(<]*\(([^)<]+)/;

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
  ]),
];

async function main() {
  const openapiTS = Promise.all(
    OPENAPI_TS_CONTRIBUTORS.map(async (username) => ({
      username,
      ...(await fetchUserInfo(username)),
      links: [{ icon: "github", link: `https://github.com/${username}` }],
    })),
  );
  const openapiFetch = Promise.all(
    OPENAPI_FETCH_CONTRIBUTORS.map(async (username) => ({
      username,
      ...(await fetchUserInfo(username)),
      links: [{ icon: "github", link: `https://github.com/${username}` }],
    })),
  );
  const contributors = {
    "openapi-typescript": await openapiTS,
    "openapi-fetch": await openapiFetch,
  };
  fs.writeFileSync(
    new URL("../data/contributors.json", import.meta.url),
    JSON.stringify(contributors),
  );
}

main();
