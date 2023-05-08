export const SITE = {
  title: "OpenAPI TS",
  description: "Your website description.",
  defaultLanguage: "en-us",
} as const;

export const OPEN_GRAPH = {
  image: {
    src: "https://github.com/drwpow/openapi-typescript/blob/main/.github/assets/banner.png?raw=true",
  },
};

export const GITHUB_EDIT_URL = `https://github.com/drwpow/openapi-typescript/tree/main/docs`;

export const KNOWN_LANGUAGES = {
  English: "en",
} as const;
export const KNOWN_LANGUAGE_CODES = Object.values(KNOWN_LANGUAGES);

export const OPENAPI_TS_CONTRIBUTORS = [
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
  ]),
];

export const OPENAPI_FETCH_CONTRIBUTORS = [
  ...new Set(["drwpow", "fergusean", "shinzui", "ezpuzz", "KotoriK", "fletchertyler914", "nholik", "roj1512"]),
];
