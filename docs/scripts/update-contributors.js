import fs from "node:fs";
import { URL } from "node:url";

const AVATAR_RE = /property="og:image" content="([^"]+)/;

async function fetchAvatar(username) {
  const res = await fetch(`https://github.com/${username}`);
  if (!res.ok) throw new Error(`${res.url} responded with ${res.status}`);
  const body = await res.text();
  const match = body.match(AVATAR_RE);
  if (!match) throw new Error(`Could not find avatar for ${username}`);
  return match[1];
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
    "barakalon",
    "pvanagtmaal",
  ]),
];

export const OPENAPI_FETCH_CONTRIBUTORS = [...new Set(["drwpow", "fergusean", "shinzui", "ezpuzz", "KotoriK", "fletchertyler914", "nholik", "roj1512", "nickcaballero", "hd-o", "kecrily", "psychedelicious"])];

async function main() {
  const openapiTS = Promise.all(OPENAPI_TS_CONTRIBUTORS.map(async (username) => ({ username, avatar: await fetchAvatar(username) })));
  const openapiFetch = Promise.all(OPENAPI_FETCH_CONTRIBUTORS.map(async (username) => ({ username, avatar: await fetchAvatar(username) })));
  const contributors = {
    "openapi-typescript": await openapiTS,
    "openapi-fetch": await openapiFetch,
  };
  fs.writeFileSync(new URL("../src/data/contributors.json", import.meta.url), JSON.stringify(contributors));
}

main();
