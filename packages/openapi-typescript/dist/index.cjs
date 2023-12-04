"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../../node_modules/.pnpm/ansi-colors@4.1.3/node_modules/ansi-colors/symbols.js
var require_symbols = __commonJS({
  "../../node_modules/.pnpm/ansi-colors@4.1.3/node_modules/ansi-colors/symbols.js"(exports, module2) {
    "use strict";
    var isHyper = typeof process !== "undefined" && process.env.TERM_PROGRAM === "Hyper";
    var isWindows = typeof process !== "undefined" && process.platform === "win32";
    var isLinux = typeof process !== "undefined" && process.platform === "linux";
    var common = {
      ballotDisabled: "\u2612",
      ballotOff: "\u2610",
      ballotOn: "\u2611",
      bullet: "\u2022",
      bulletWhite: "\u25E6",
      fullBlock: "\u2588",
      heart: "\u2764",
      identicalTo: "\u2261",
      line: "\u2500",
      mark: "\u203B",
      middot: "\xB7",
      minus: "\uFF0D",
      multiplication: "\xD7",
      obelus: "\xF7",
      pencilDownRight: "\u270E",
      pencilRight: "\u270F",
      pencilUpRight: "\u2710",
      percent: "%",
      pilcrow2: "\u2761",
      pilcrow: "\xB6",
      plusMinus: "\xB1",
      question: "?",
      section: "\xA7",
      starsOff: "\u2606",
      starsOn: "\u2605",
      upDownArrow: "\u2195"
    };
    var windows = Object.assign({}, common, {
      check: "\u221A",
      cross: "\xD7",
      ellipsisLarge: "...",
      ellipsis: "...",
      info: "i",
      questionSmall: "?",
      pointer: ">",
      pointerSmall: "\xBB",
      radioOff: "( )",
      radioOn: "(*)",
      warning: "\u203C"
    });
    var other = Object.assign({}, common, {
      ballotCross: "\u2718",
      check: "\u2714",
      cross: "\u2716",
      ellipsisLarge: "\u22EF",
      ellipsis: "\u2026",
      info: "\u2139",
      questionFull: "\uFF1F",
      questionSmall: "\uFE56",
      pointer: isLinux ? "\u25B8" : "\u276F",
      pointerSmall: isLinux ? "\u2023" : "\u203A",
      radioOff: "\u25EF",
      radioOn: "\u25C9",
      warning: "\u26A0"
    });
    module2.exports = isWindows && !isHyper ? windows : other;
    Reflect.defineProperty(module2.exports, "common", { enumerable: false, value: common });
    Reflect.defineProperty(module2.exports, "windows", { enumerable: false, value: windows });
    Reflect.defineProperty(module2.exports, "other", { enumerable: false, value: other });
  }
});

// ../../node_modules/.pnpm/ansi-colors@4.1.3/node_modules/ansi-colors/index.js
var require_ansi_colors = __commonJS({
  "../../node_modules/.pnpm/ansi-colors@4.1.3/node_modules/ansi-colors/index.js"(exports, module2) {
    "use strict";
    var isObject = (val) => val !== null && typeof val === "object" && !Array.isArray(val);
    var ANSI_REGEX = /[\u001b\u009b][[\]#;?()]*(?:(?:(?:[^\W_]*;?[^\W_]*)\u0007)|(?:(?:[0-9]{1,4}(;[0-9]{0,4})*)?[~0-9=<>cf-nqrtyA-PRZ]))/g;
    var hasColor = () => {
      if (typeof process !== "undefined") {
        return process.env.FORCE_COLOR !== "0";
      }
      return false;
    };
    var create = () => {
      const colors = {
        enabled: hasColor(),
        visible: true,
        styles: {},
        keys: {}
      };
      const ansi = (style2) => {
        let open = style2.open = `\x1B[${style2.codes[0]}m`;
        let close = style2.close = `\x1B[${style2.codes[1]}m`;
        let regex = style2.regex = new RegExp(`\\u001b\\[${style2.codes[1]}m`, "g");
        style2.wrap = (input, newline) => {
          if (input.includes(close))
            input = input.replace(regex, close + open);
          let output = open + input + close;
          return newline ? output.replace(/\r*\n/g, `${close}$&${open}`) : output;
        };
        return style2;
      };
      const wrap = (style2, input, newline) => {
        return typeof style2 === "function" ? style2(input) : style2.wrap(input, newline);
      };
      const style = (input, stack) => {
        if (input === "" || input == null)
          return "";
        if (colors.enabled === false)
          return input;
        if (colors.visible === false)
          return "";
        let str = "" + input;
        let nl = str.includes("\n");
        let n = stack.length;
        if (n > 0 && stack.includes("unstyle")) {
          stack = [.../* @__PURE__ */ new Set(["unstyle", ...stack])].reverse();
        }
        while (n-- > 0)
          str = wrap(colors.styles[stack[n]], str, nl);
        return str;
      };
      const define = (name, codes, type) => {
        colors.styles[name] = ansi({ name, codes });
        let keys = colors.keys[type] || (colors.keys[type] = []);
        keys.push(name);
        Reflect.defineProperty(colors, name, {
          configurable: true,
          enumerable: true,
          set(value) {
            colors.alias(name, value);
          },
          get() {
            let color = (input) => style(input, color.stack);
            Reflect.setPrototypeOf(color, colors);
            color.stack = this.stack ? this.stack.concat(name) : [name];
            return color;
          }
        });
      };
      define("reset", [0, 0], "modifier");
      define("bold", [1, 22], "modifier");
      define("dim", [2, 22], "modifier");
      define("italic", [3, 23], "modifier");
      define("underline", [4, 24], "modifier");
      define("inverse", [7, 27], "modifier");
      define("hidden", [8, 28], "modifier");
      define("strikethrough", [9, 29], "modifier");
      define("black", [30, 39], "color");
      define("red", [31, 39], "color");
      define("green", [32, 39], "color");
      define("yellow", [33, 39], "color");
      define("blue", [34, 39], "color");
      define("magenta", [35, 39], "color");
      define("cyan", [36, 39], "color");
      define("white", [37, 39], "color");
      define("gray", [90, 39], "color");
      define("grey", [90, 39], "color");
      define("bgBlack", [40, 49], "bg");
      define("bgRed", [41, 49], "bg");
      define("bgGreen", [42, 49], "bg");
      define("bgYellow", [43, 49], "bg");
      define("bgBlue", [44, 49], "bg");
      define("bgMagenta", [45, 49], "bg");
      define("bgCyan", [46, 49], "bg");
      define("bgWhite", [47, 49], "bg");
      define("blackBright", [90, 39], "bright");
      define("redBright", [91, 39], "bright");
      define("greenBright", [92, 39], "bright");
      define("yellowBright", [93, 39], "bright");
      define("blueBright", [94, 39], "bright");
      define("magentaBright", [95, 39], "bright");
      define("cyanBright", [96, 39], "bright");
      define("whiteBright", [97, 39], "bright");
      define("bgBlackBright", [100, 49], "bgBright");
      define("bgRedBright", [101, 49], "bgBright");
      define("bgGreenBright", [102, 49], "bgBright");
      define("bgYellowBright", [103, 49], "bgBright");
      define("bgBlueBright", [104, 49], "bgBright");
      define("bgMagentaBright", [105, 49], "bgBright");
      define("bgCyanBright", [106, 49], "bgBright");
      define("bgWhiteBright", [107, 49], "bgBright");
      colors.ansiRegex = ANSI_REGEX;
      colors.hasColor = colors.hasAnsi = (str) => {
        colors.ansiRegex.lastIndex = 0;
        return typeof str === "string" && str !== "" && colors.ansiRegex.test(str);
      };
      colors.alias = (name, color) => {
        let fn = typeof color === "string" ? colors[color] : color;
        if (typeof fn !== "function") {
          throw new TypeError("Expected alias to be the name of an existing color (string) or a function");
        }
        if (!fn.stack) {
          Reflect.defineProperty(fn, "name", { value: name });
          colors.styles[name] = fn;
          fn.stack = [name];
        }
        Reflect.defineProperty(colors, name, {
          configurable: true,
          enumerable: true,
          set(value) {
            colors.alias(name, value);
          },
          get() {
            let color2 = (input) => style(input, color2.stack);
            Reflect.setPrototypeOf(color2, colors);
            color2.stack = this.stack ? this.stack.concat(fn.stack) : fn.stack;
            return color2;
          }
        });
      };
      colors.theme = (custom) => {
        if (!isObject(custom))
          throw new TypeError("Expected theme to be an object");
        for (let name of Object.keys(custom)) {
          colors.alias(name, custom[name]);
        }
        return colors;
      };
      colors.alias("unstyle", (str) => {
        if (typeof str === "string" && str !== "") {
          colors.ansiRegex.lastIndex = 0;
          return str.replace(colors.ansiRegex, "");
        }
        return "";
      });
      colors.alias("noop", (str) => str);
      colors.none = colors.clear = colors.noop;
      colors.stripColor = colors.unstyle;
      colors.symbols = require_symbols();
      colors.define = define;
      return colors;
    };
    module2.exports = create();
    module2.exports.create = create;
  }
});

// src/index.ts
var src_exports = {};
__export(src_exports, {
  BOOLEAN: () => BOOLEAN,
  COMMENT_HEADER: () => COMMENT_HEADER,
  FALSE: () => FALSE,
  JS_ENUM_INVALID_CHARS_RE: () => JS_ENUM_INVALID_CHARS_RE,
  JS_PROPERTY_INDEX_INVALID_CHARS_RE: () => JS_PROPERTY_INDEX_INVALID_CHARS_RE,
  JS_PROPERTY_INDEX_RE: () => JS_PROPERTY_INDEX_RE,
  NEVER: () => NEVER,
  NULL: () => NULL,
  NUMBER: () => NUMBER,
  QUESTION_TOKEN: () => QUESTION_TOKEN,
  STRING: () => STRING,
  TRUE: () => TRUE,
  UNDEFINED: () => UNDEFINED,
  UNKNOWN: () => UNKNOWN,
  addJSDocComment: () => addJSDocComment,
  astToString: () => astToString,
  c: () => import_ansi_colors.default,
  createDiscriminatorProperty: () => createDiscriminatorProperty,
  createRef: () => createRef,
  debug: () => debug,
  default: () => openapiTS,
  error: () => error,
  formatTime: () => formatTime,
  getEntries: () => getEntries,
  injectOperationObject: () => injectOperationObject,
  oapiRef: () => oapiRef,
  resolveRef: () => resolveRef,
  scanDiscriminators: () => scanDiscriminators,
  stringToAST: () => stringToAST,
  transformSchemaObjectWithComposition: () => transformSchemaObjectWithComposition,
  tsDedupe: () => tsDedupe,
  tsEnum: () => tsEnum,
  tsEnumMember: () => tsEnumMember,
  tsIntersection: () => tsIntersection,
  tsIsPrimitive: () => tsIsPrimitive,
  tsLiteral: () => tsLiteral,
  tsModifiers: () => tsModifiers,
  tsNullable: () => tsNullable,
  tsOmit: () => tsOmit,
  tsPropertyIndex: () => tsPropertyIndex,
  tsRecord: () => tsRecord,
  tsUnion: () => tsUnion,
  tsWithRequired: () => tsWithRequired,
  walk: () => walk,
  warn: () => warn
});
module.exports = __toCommonJS(src_exports);
var import_openapi_core2 = require("@redocly/openapi-core");

// src/lib/redoc.ts
var import_openapi_core = require("@redocly/openapi-core");
var import_node_stream = require("stream");
var import_node_url = require("url");

// src/lib/utils.ts
var import_ref_utils2 = require("@redocly/openapi-core/lib/ref-utils.js");
var import_ansi_colors = __toESM(require_ansi_colors(), 1);

// ../../node_modules/.pnpm/supports-color@9.4.0/node_modules/supports-color/index.js
var import_node_process = __toESM(require("process"), 1);
var import_node_os = __toESM(require("os"), 1);
var import_node_tty = __toESM(require("tty"), 1);
function hasFlag(flag, argv = globalThis.Deno ? globalThis.Deno.args : import_node_process.default.argv) {
  const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
  const position = argv.indexOf(prefix + flag);
  const terminatorPosition = argv.indexOf("--");
  return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
}
var { env } = import_node_process.default;
var flagForceColor;
if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never")) {
  flagForceColor = 0;
} else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) {
  flagForceColor = 1;
}
function envForceColor() {
  if ("FORCE_COLOR" in env) {
    if (env.FORCE_COLOR === "true") {
      return 1;
    }
    if (env.FORCE_COLOR === "false") {
      return 0;
    }
    return env.FORCE_COLOR.length === 0 ? 1 : Math.min(Number.parseInt(env.FORCE_COLOR, 10), 3);
  }
}
function translateLevel(level) {
  if (level === 0) {
    return false;
  }
  return {
    level,
    hasBasic: true,
    has256: level >= 2,
    has16m: level >= 3
  };
}
function _supportsColor(haveStream, { streamIsTTY, sniffFlags = true } = {}) {
  const noFlagForceColor = envForceColor();
  if (noFlagForceColor !== void 0) {
    flagForceColor = noFlagForceColor;
  }
  const forceColor = sniffFlags ? flagForceColor : noFlagForceColor;
  if (forceColor === 0) {
    return 0;
  }
  if (sniffFlags) {
    if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) {
      return 3;
    }
    if (hasFlag("color=256")) {
      return 2;
    }
  }
  if ("TF_BUILD" in env && "AGENT_NAME" in env) {
    return 1;
  }
  if (haveStream && !streamIsTTY && forceColor === void 0) {
    return 0;
  }
  const min = forceColor || 0;
  if (env.TERM === "dumb") {
    return min;
  }
  if (import_node_process.default.platform === "win32") {
    const osRelease = import_node_os.default.release().split(".");
    if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
      return Number(osRelease[2]) >= 14931 ? 3 : 2;
    }
    return 1;
  }
  if ("CI" in env) {
    if ("GITHUB_ACTIONS" in env || "GITEA_ACTIONS" in env) {
      return 3;
    }
    if (["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "BUILDKITE", "DRONE"].some((sign) => sign in env) || env.CI_NAME === "codeship") {
      return 1;
    }
    return min;
  }
  if ("TEAMCITY_VERSION" in env) {
    return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
  }
  if (env.COLORTERM === "truecolor") {
    return 3;
  }
  if (env.TERM === "xterm-kitty") {
    return 3;
  }
  if ("TERM_PROGRAM" in env) {
    const version = Number.parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
    switch (env.TERM_PROGRAM) {
      case "iTerm.app": {
        return version >= 3 ? 3 : 2;
      }
      case "Apple_Terminal": {
        return 2;
      }
    }
  }
  if (/-256(color)?$/i.test(env.TERM)) {
    return 2;
  }
  if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
    return 1;
  }
  if ("COLORTERM" in env) {
    return 1;
  }
  return min;
}
function createSupportsColor(stream, options = {}) {
  const level = _supportsColor(stream, {
    streamIsTTY: stream && stream.isTTY,
    ...options
  });
  return translateLevel(level);
}
var supportsColor = {
  stdout: createSupportsColor({ isTTY: import_node_tty.default.isatty(1) }),
  stderr: createSupportsColor({ isTTY: import_node_tty.default.isatty(2) })
};
var supports_color_default = supportsColor;

// src/lib/utils.ts
var import_typescript2 = __toESM(require("typescript"), 1);

// src/lib/ts.ts
var import_ref_utils = require("@redocly/openapi-core/lib/ref-utils.js");
var import_typescript = __toESM(require("typescript"), 1);
var JS_PROPERTY_INDEX_RE = /^[A-Za-z_$][A-Za-z_$0-9]*$/;
var JS_ENUM_INVALID_CHARS_RE = /[^A-Za-z_$0-9]+(.)?/g;
var JS_PROPERTY_INDEX_INVALID_CHARS_RE = /[^A-Za-z_$0-9]+/g;
var BOOLEAN = import_typescript.default.factory.createKeywordTypeNode(
  import_typescript.default.SyntaxKind.BooleanKeyword
);
var FALSE = import_typescript.default.factory.createLiteralTypeNode(import_typescript.default.factory.createFalse());
var NEVER = import_typescript.default.factory.createKeywordTypeNode(
  import_typescript.default.SyntaxKind.NeverKeyword
);
var NULL = import_typescript.default.factory.createLiteralTypeNode(import_typescript.default.factory.createNull());
var NUMBER = import_typescript.default.factory.createKeywordTypeNode(
  import_typescript.default.SyntaxKind.NumberKeyword
);
var QUESTION_TOKEN = import_typescript.default.factory.createToken(
  import_typescript.default.SyntaxKind.QuestionToken
);
var STRING = import_typescript.default.factory.createKeywordTypeNode(
  import_typescript.default.SyntaxKind.StringKeyword
);
var TRUE = import_typescript.default.factory.createLiteralTypeNode(import_typescript.default.factory.createTrue());
var UNDEFINED = import_typescript.default.factory.createKeywordTypeNode(
  import_typescript.default.SyntaxKind.UndefinedKeyword
);
var UNKNOWN = import_typescript.default.factory.createKeywordTypeNode(
  import_typescript.default.SyntaxKind.UnknownKeyword
);
var LB_RE = /\r?\n/g;
var COMMENT_RE = /\*\//g;
function addJSDocComment(schemaObject, node) {
  if (!schemaObject || typeof schemaObject !== "object" || Array.isArray(schemaObject)) {
    return;
  }
  const output = [];
  if (schemaObject.title) {
    output.push(schemaObject.title.replace(LB_RE, "\n *     "));
  }
  if (schemaObject.summary) {
    output.push(schemaObject.summary.replace(LB_RE, "\n *     "));
  }
  if (schemaObject.format) {
    output.push(`Format: ${schemaObject.format}`);
  }
  if (schemaObject.deprecated) {
    output.push("@deprecated");
  }
  const supportedJsDocTags = ["description", "default", "example"];
  for (const field of supportedJsDocTags) {
    const allowEmptyString = field === "default" || field === "example";
    if (schemaObject[field] === void 0) {
      continue;
    }
    if (schemaObject[field] === "" && !allowEmptyString) {
      continue;
    }
    const serialized = typeof schemaObject[field] === "object" ? JSON.stringify(schemaObject[field], null, 2) : schemaObject[field];
    output.push(`@${field} ${String(serialized).replace(LB_RE, "\n *     ")}`);
  }
  if ("const" in schemaObject) {
    output.push("@constant");
  }
  if (schemaObject.enum) {
    let type = "unknown";
    if (Array.isArray(schemaObject.type)) {
      type = schemaObject.type.join("|");
    } else if (typeof schemaObject.type === "string") {
      type = schemaObject.type;
    }
    output.push(`@enum {${type}${schemaObject.nullable ? `|null` : ""}}`);
  }
  if (output.length) {
    let text = output.length === 1 ? `* ${output.join("\n")} ` : `*
 * ${output.join("\n * ")}
 `;
    text = text.replace(COMMENT_RE, "*\\/");
    import_typescript.default.addSyntheticLeadingComment(
      /* node               */
      node,
      /* kind               */
      import_typescript.default.SyntaxKind.MultiLineCommentTrivia,
      // note: MultiLine just refers to a "/* */" comment
      /* text               */
      text,
      /* hasTrailingNewLine */
      true
    );
  }
}
function oapiRef(path) {
  const { pointer } = (0, import_ref_utils.parseRef)(path);
  if (pointer.length === 0) {
    throw new Error(`Error parsing $ref: ${path}. Is this a valid $ref?`);
  }
  let t = import_typescript.default.factory.createTypeReferenceNode(
    import_typescript.default.factory.createIdentifier(String(pointer[0]))
  );
  if (pointer.length > 1) {
    for (let i = 1; i < pointer.length; i++) {
      t = import_typescript.default.factory.createIndexedAccessTypeNode(
        t,
        import_typescript.default.factory.createLiteralTypeNode(
          typeof pointer[i] === "number" ? import_typescript.default.factory.createNumericLiteral(pointer[i]) : import_typescript.default.factory.createStringLiteral(pointer[i])
        )
      );
    }
  }
  return t;
}
function astToString(ast, options) {
  var _a, _b;
  const sourceFile = import_typescript.default.createSourceFile(
    (_a = options == null ? void 0 : options.fileName) != null ? _a : "openapi-ts.ts",
    (_b = options == null ? void 0 : options.sourceText) != null ? _b : "",
    import_typescript.default.ScriptTarget.ESNext,
    false,
    import_typescript.default.ScriptKind.TS
  );
  sourceFile.statements = import_typescript.default.factory.createNodeArray(
    Array.isArray(ast) ? ast : [ast]
  );
  const printer = import_typescript.default.createPrinter({
    newLine: import_typescript.default.NewLineKind.LineFeed,
    removeComments: false,
    ...options == null ? void 0 : options.formatOptions
  });
  return printer.printFile(sourceFile);
}
function stringToAST(source) {
  return import_typescript.default.createSourceFile(
    /* fileName        */
    "stringInput",
    /* sourceText      */
    source,
    /* languageVersion */
    import_typescript.default.ScriptTarget.ESNext,
    /* setParentNodes  */
    void 0,
    /* scriptKind      */
    void 0
  ).statements;
}
function tsDedupe(types) {
  var _a, _b;
  const encounteredTypes = /* @__PURE__ */ new Set();
  const filteredTypes = [];
  for (const t of types) {
    if (!("text" in ((_a = t.literal) != null ? _a : t))) {
      const { kind } = (_b = t.literal) != null ? _b : t;
      if (encounteredTypes.has(kind)) {
        continue;
      }
      if (tsIsPrimitive(t)) {
        encounteredTypes.add(kind);
      }
    }
    filteredTypes.push(t);
  }
  return filteredTypes;
}
function tsEnum(name, members, metadata, options) {
  var _a, _b;
  let enumName = name.replace(JS_ENUM_INVALID_CHARS_RE, (c2) => {
    const last = c2[c2.length - 1];
    return JS_PROPERTY_INDEX_INVALID_CHARS_RE.test(last) ? "" : last.toUpperCase();
  });
  if (Number(name[0]) >= 0) {
    enumName = `Value${name}`;
  }
  enumName = `${enumName[0].toUpperCase()}${enumName.substring(1)}`;
  return import_typescript.default.factory.createEnumDeclaration(
    /* modifiers */
    options ? tsModifiers({
      readonly: (_a = options.readonly) != null ? _a : false,
      export: (_b = options.export) != null ? _b : false
    }) : void 0,
    /* name      */
    enumName,
    /* members   */
    members.map(
      (value, i) => tsEnumMember(value, metadata == null ? void 0 : metadata[i])
    )
  );
}
function tsEnumMember(value, metadata = {}) {
  var _a;
  let name = (_a = metadata.name) != null ? _a : String(value);
  if (!JS_PROPERTY_INDEX_RE.test(name)) {
    if (Number(name[0]) >= 0) {
      name = `Value${name}`.replace(".", "_");
    }
    name = name.replace(JS_PROPERTY_INDEX_INVALID_CHARS_RE, "_");
  }
  let member;
  if (typeof value === "number") {
    member = import_typescript.default.factory.createEnumMember(
      name,
      import_typescript.default.factory.createNumericLiteral(value)
    );
  } else {
    member = import_typescript.default.factory.createEnumMember(
      name,
      import_typescript.default.factory.createStringLiteral(value)
    );
  }
  if (metadata.description == void 0) {
    return member;
  }
  return import_typescript.default.addSyntheticLeadingComment(
    member,
    import_typescript.default.SyntaxKind.SingleLineCommentTrivia,
    " ".concat(metadata.description.trim()),
    true
  );
}
function tsIntersection(types) {
  if (types.length === 0) {
    return NEVER;
  }
  if (types.length === 1) {
    return types[0];
  }
  return import_typescript.default.factory.createIntersectionTypeNode(tsDedupe(types));
}
function tsIsPrimitive(type) {
  if (!type) {
    return true;
  }
  return import_typescript.default.SyntaxKind[type.kind] === "BooleanKeyword" || import_typescript.default.SyntaxKind[type.kind] === "NeverKeyword" || import_typescript.default.SyntaxKind[type.kind] === "NullKeyword" || import_typescript.default.SyntaxKind[type.kind] === "NumberKeyword" || import_typescript.default.SyntaxKind[type.kind] === "StringKeyword" || import_typescript.default.SyntaxKind[type.kind] === "UndefinedKeyword" || "literal" in type && tsIsPrimitive(type.literal);
}
function tsLiteral(value) {
  if (typeof value === "string") {
    return import_typescript.default.factory.createLiteralTypeNode(
      import_typescript.default.factory.createStringLiteral(value)
    );
  }
  if (typeof value === "number") {
    return import_typescript.default.factory.createLiteralTypeNode(
      import_typescript.default.factory.createNumericLiteral(value)
    );
  }
  if (typeof value === "boolean") {
    return value === true ? TRUE : FALSE;
  }
  if (value === null) {
    return NULL;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return import_typescript.default.factory.createArrayTypeNode(NEVER);
    }
    return import_typescript.default.factory.createTupleTypeNode(
      value.map((v) => tsLiteral(v))
    );
  }
  if (typeof value === "object") {
    const keys = [];
    for (const [k, v] of Object.entries(value)) {
      keys.push(
        import_typescript.default.factory.createPropertySignature(
          /* modifiers     */
          void 0,
          /* name          */
          tsPropertyIndex(k),
          /* questionToken */
          void 0,
          /* type          */
          tsLiteral(v)
        )
      );
    }
    return keys.length ? import_typescript.default.factory.createTypeLiteralNode(keys) : tsRecord(STRING, NEVER);
  }
  return UNKNOWN;
}
function tsModifiers(modifiers) {
  const typeMods = [];
  if (modifiers.export) {
    typeMods.push(import_typescript.default.factory.createModifier(import_typescript.default.SyntaxKind.ExportKeyword));
  }
  if (modifiers.readonly) {
    typeMods.push(import_typescript.default.factory.createModifier(import_typescript.default.SyntaxKind.ReadonlyKeyword));
  }
  return typeMods;
}
function tsNullable(types) {
  return import_typescript.default.factory.createUnionTypeNode([...types, NULL]);
}
function tsOmit(type, keys) {
  return import_typescript.default.factory.createTypeReferenceNode(
    import_typescript.default.factory.createIdentifier("Omit"),
    [type, import_typescript.default.factory.createUnionTypeNode(keys.map((k) => tsLiteral(k)))]
  );
}
function tsRecord(key, value) {
  return import_typescript.default.factory.createTypeReferenceNode(
    import_typescript.default.factory.createIdentifier("Record"),
    [key, value]
  );
}
function tsPropertyIndex(index) {
  if (typeof index === "number" && !(index < 0) || typeof index === "string" && String(Number(index)) === index && index[0] !== "-") {
    return import_typescript.default.factory.createNumericLiteral(index);
  }
  return typeof index === "string" && JS_PROPERTY_INDEX_RE.test(index) ? import_typescript.default.factory.createIdentifier(index) : import_typescript.default.factory.createStringLiteral(String(index));
}
function tsUnion(types) {
  if (types.length === 0) {
    return NEVER;
  }
  if (types.length === 1) {
    return types[0];
  }
  return import_typescript.default.factory.createUnionTypeNode(tsDedupe(types));
}
function tsWithRequired(type, keys, injectFooter) {
  if (keys.length === 0) {
    return type;
  }
  if (!injectFooter.some(
    (node) => {
      var _a;
      return import_typescript.default.isTypeAliasDeclaration(node) && ((_a = node == null ? void 0 : node.name) == null ? void 0 : _a.escapedText) === "WithRequired";
    }
  )) {
    const helper = stringToAST(
      `type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };`
    )[0];
    injectFooter.push(helper);
  }
  return import_typescript.default.factory.createTypeReferenceNode(
    import_typescript.default.factory.createIdentifier("WithRequired"),
    [type, tsUnion(keys.map((k) => tsLiteral(k)))]
  );
}

// src/lib/utils.ts
if (!supports_color_default.stdout || supports_color_default.stdout.hasBasic === false) {
  import_ansi_colors.default.enabled = false;
}
var DEBUG_GROUPS = {
  redoc: import_ansi_colors.default.cyanBright,
  lint: import_ansi_colors.default.yellowBright,
  bundle: import_ansi_colors.default.magentaBright,
  ts: import_ansi_colors.default.blueBright
};
function createDiscriminatorProperty(discriminator, { path, readonly = false }) {
  let value = (0, import_ref_utils2.parseRef)(path).pointer.pop();
  if (discriminator.mapping) {
    const matchedValue = Object.entries(discriminator.mapping).find(
      ([, v]) => !v.startsWith("#") && v === value || v.startsWith("#") && (0, import_ref_utils2.parseRef)(v).pointer.pop() === value
    );
    if (matchedValue) {
      value = matchedValue[0];
    }
  }
  return import_typescript2.default.factory.createPropertySignature(
    /* modifiers     */
    tsModifiers({
      readonly
    }),
    /* name          */
    tsPropertyIndex(discriminator.propertyName),
    /* questionToken */
    void 0,
    /* type          */
    tsLiteral(value)
  );
}
function createRef(parts) {
  let pointer = "#";
  for (const part of parts) {
    if (!part) {
      continue;
    }
    const maybeRef = (0, import_ref_utils2.parseRef)(String(part)).pointer;
    if (maybeRef.length) {
      for (const refPart of maybeRef) {
        pointer += `/${(0, import_ref_utils2.escapePointer)(refPart)}`;
      }
    } else {
      pointer += `/${(0, import_ref_utils2.escapePointer)(part)}`;
    }
  }
  return pointer;
}
function debug(msg, group, time) {
  if (process.env.DEBUG && (!group || process.env.DEBUG === "*" || process.env.DEBUG === "openapi-ts:*" || process.env.DEBUG.toLocaleLowerCase() === `openapi-ts:${group.toLocaleLowerCase()}`)) {
    const groupColor = group && DEBUG_GROUPS[group] || import_ansi_colors.default.whiteBright;
    const groupName = groupColor(`openapi-ts:${group != null ? group : "info"}`);
    let timeFormatted = "";
    if (typeof time === "number") {
      timeFormatted = import_ansi_colors.default.green(` ${formatTime(time)} `);
    }
    console.debug(`  ${import_ansi_colors.default.bold(groupName)}${timeFormatted}${msg}`);
  }
}
function error(msg) {
  console.error(import_ansi_colors.default.red(` \u2718  ${msg}`));
}
function formatTime(t) {
  if (typeof t === "number") {
    if (t < 1e3) {
      return `${Math.round(10 * t) / 10}ms`;
    } else if (t < 6e4) {
      return `${Math.round(t / 100) / 10}s`;
    }
    return `${Math.round(t / 6e3) / 10}m`;
  }
  return t;
}
function getEntries(obj, options) {
  let entries = Object.entries(obj);
  if (options == null ? void 0 : options.alphabetize) {
    entries.sort(([a], [b]) => a.localeCompare(b, "en-us", { numeric: true }));
  }
  if (options == null ? void 0 : options.excludeDeprecated) {
    entries = entries.filter(
      ([, v]) => !(v && typeof v === "object" && "deprecated" in v && v.deprecated)
    );
  }
  return entries;
}
function resolveRef(schema, $ref, { silent = false, visited = [] }) {
  const { pointer } = (0, import_ref_utils2.parseRef)($ref);
  if (!pointer.length) {
    return void 0;
  }
  let node = schema;
  for (const key of pointer) {
    if (node && typeof node === "object" && node[key]) {
      node = node[key];
    } else {
      warn(`Could not resolve $ref "${$ref}"`, silent);
      return void 0;
    }
  }
  if (node && typeof node === "object" && node.$ref) {
    if (visited.includes(node.$ref)) {
      warn(`Could not resolve circular $ref "${$ref}"`, silent);
      return void 0;
    }
    return resolveRef(schema, node.$ref, {
      silent,
      visited: [...visited, node.$ref]
    });
  }
  return node;
}
function scanDiscriminators(schema) {
  const discriminators = {};
  walk(schema, (obj, path) => {
    var _a;
    if ((_a = obj == null ? void 0 : obj.discriminator) == null ? void 0 : _a.propertyName) {
      discriminators[createRef(path)] = obj.discriminator;
    }
  });
  walk(schema, (obj, path) => {
    var _a;
    for (const key of ["oneOf", "anyOf", "allOf"]) {
      if (obj && Array.isArray(obj[key])) {
        for (const item of obj[key]) {
          if ("$ref" in item) {
            if (discriminators[item.$ref]) {
              discriminators[createRef(path)] = {
                ...discriminators[item.$ref]
              };
            }
          } else if ((_a = item.discriminator) == null ? void 0 : _a.propertyName) {
            discriminators[createRef(path)] = { ...item.discriminator };
          }
        }
      }
    }
  });
  return discriminators;
}
function walk(obj, cb, path = []) {
  if (!obj || typeof obj !== "object") {
    return;
  }
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      walk(obj[i], cb, path.concat(i));
    }
    return;
  }
  cb(obj, path);
  for (const k of Object.keys(obj)) {
    walk(obj[k], cb, path.concat(k));
  }
}
function warn(msg, silent = false) {
  if (!silent) {
    console.warn(import_ansi_colors.default.yellow(` \u26A0  ${msg}`));
  }
}

// src/lib/redoc.ts
async function parseSchema(schema, { absoluteRef, resolver }) {
  if (!schema) {
    throw new Error(`Can\u2019t parse empty schema`);
  }
  if (schema instanceof URL) {
    const result = await resolver.resolveDocument(null, absoluteRef, true);
    if ("parsed" in result) {
      return result;
    }
    throw result.originalError;
  }
  if (schema instanceof import_node_stream.Readable) {
    const contents = await new Promise((resolve) => {
      schema.resume();
      schema.setEncoding("utf8");
      let content = "";
      schema.on("data", (chunk) => {
        content += chunk;
      });
      schema.on("end", () => {
        resolve(content.trim());
      });
    });
    return parseSchema(contents, { absoluteRef, resolver });
  }
  if (schema instanceof Buffer) {
    return parseSchema(schema.toString("utf8"), { absoluteRef, resolver });
  }
  if (typeof schema === "string") {
    if (schema.startsWith("http://") || schema.startsWith("https://") || schema.startsWith("file://")) {
      const url = new URL(schema);
      return parseSchema(url, {
        absoluteRef: url.protocol === "file:" ? (0, import_node_url.fileURLToPath)(url) : url.href,
        resolver
      });
    }
    if (schema[0] === "{") {
      return {
        source: new import_openapi_core.Source(absoluteRef, schema, "application/json"),
        parsed: JSON.parse(schema)
      };
    }
    return (0, import_openapi_core.makeDocumentFromString)(schema, absoluteRef);
  }
  if (typeof schema === "object" && !Array.isArray(schema)) {
    return {
      source: new import_openapi_core.Source(
        absoluteRef,
        JSON.stringify(schema),
        "application/json"
      ),
      parsed: schema
    };
  }
  throw new Error(
    `Expected string, object, or Buffer. Got ${Array.isArray(schema) ? "Array" : typeof schema}`
  );
}
async function validateAndBundle(source, options) {
  var _a;
  const redocConfigT = performance.now();
  debug("Loaded Redoc config", "redoc", performance.now() - redocConfigT);
  const redocParseT = performance.now();
  let absoluteRef = (0, import_node_url.fileURLToPath)(
    new URL((_a = options == null ? void 0 : options.cwd) != null ? _a : `file://${process.cwd()}/`)
  );
  if (source instanceof URL) {
    absoluteRef = source.protocol === "file:" ? (0, import_node_url.fileURLToPath)(source) : source.href;
  }
  const resolver = new import_openapi_core.BaseResolver(options.redoc.resolve);
  const document = await parseSchema(source, {
    absoluteRef,
    resolver
  });
  debug("Parsed schema", "redoc", performance.now() - redocParseT);
  const openapiVersion = parseFloat(document.parsed.openapi);
  if (document.parsed.swagger || !document.parsed.openapi || Number.isNaN(openapiVersion) || openapiVersion < 3 || openapiVersion >= 4) {
    if (document.parsed.swagger) {
      throw new Error(
        "Unsupported Swagger version: 2.x. Use OpenAPI 3.x instead."
      );
    } else if (document.parsed.openapi || openapiVersion < 3 || openapiVersion >= 4) {
      throw new Error(
        `Unsupported OpenAPI version: ${document.parsed.openapi}`
      );
    }
    throw new Error("Unsupported schema format, expected `openapi: 3.x`");
  }
  const redocLintT = performance.now();
  const problems = await (0, import_openapi_core.lintDocument)({
    document,
    config: options.redoc.styleguide,
    externalRefResolver: resolver
  });
  if (problems.length) {
    let errorMessage = void 0;
    for (const problem of problems) {
      if (problem.severity === "error") {
        errorMessage = problem.message;
        error(problem.message);
      } else {
        warn(problem.message, options.silent);
      }
    }
    if (errorMessage) {
      throw new Error(errorMessage);
    }
  }
  debug("Linted schema", "lint", performance.now() - redocLintT);
  const redocBundleT = performance.now();
  const bundled = await (0, import_openapi_core.bundle)({
    config: options.redoc,
    dereference: false,
    doc: document
  });
  if (bundled.problems.length) {
    let errorMessage = void 0;
    for (const problem of bundled.problems) {
      if (problem.severity === "error") {
        errorMessage = problem.message;
        error(problem.message);
        throw new Error(problem.message);
      } else {
        warn(problem.message, options.silent);
      }
    }
    if (errorMessage) {
      throw new Error(errorMessage);
    }
  }
  debug("Bundled schema", "bundle", performance.now() - redocBundleT);
  return bundled.bundle.parsed;
}

// src/transform/index.ts
var import_typescript14 = __toESM(require("typescript"), 1);

// src/transform/components-object.ts
var import_typescript11 = __toESM(require("typescript"), 1);

// src/transform/header-object.ts
var import_ref_utils4 = require("@redocly/openapi-core/lib/ref-utils.js");
var import_typescript4 = __toESM(require("typescript"), 1);

// src/transform/schema-object.ts
var import_ref_utils3 = require("@redocly/openapi-core/lib/ref-utils.js");
var import_typescript3 = __toESM(require("typescript"), 1);
function transformSchemaObject(schemaObject, options) {
  const type = transformSchemaObjectWithComposition(schemaObject, options);
  if (typeof options.ctx.postTransform === "function") {
    const postTransformResult = options.ctx.postTransform(type, options);
    if (postTransformResult) {
      return postTransformResult;
    }
  }
  return type;
}
function transformSchemaObjectWithComposition(schemaObject, options) {
  var _a, _b, _c;
  if (!schemaObject) {
    return NEVER;
  }
  if (schemaObject === true) {
    return UNKNOWN;
  }
  if (Array.isArray(schemaObject) || typeof schemaObject !== "object") {
    throw new Error(
      `Expected SchemaObject, received ${Array.isArray(schemaObject) ? "Array" : typeof schemaObject}`
    );
  }
  if ("$ref" in schemaObject) {
    return oapiRef(schemaObject.$ref);
  }
  if (schemaObject.const !== null && schemaObject.const !== void 0) {
    return tsLiteral(schemaObject.const);
  }
  if (Array.isArray(schemaObject.enum) && (!("type" in schemaObject) || schemaObject.type !== "object") && !("properties" in schemaObject) && !("additionalProperties" in schemaObject)) {
    if (options.ctx.enum && schemaObject.enum.every(
      (v) => typeof v === "string" || typeof v === "number"
    )) {
      let enumName = (0, import_ref_utils3.parseRef)((_a = options.path) != null ? _a : "").pointer.join("/");
      enumName = enumName.replace("components/schemas", "");
      const metadata = schemaObject.enum.map((_, i) => {
        var _a2, _b2;
        return {
          name: (_a2 = schemaObject["x-enum-varnames"]) == null ? void 0 : _a2[i],
          description: (_b2 = schemaObject["x-enum-descriptions"]) == null ? void 0 : _b2[i]
        };
      });
      const enumType = tsEnum(
        enumName,
        schemaObject.enum,
        metadata,
        { export: true, readonly: options.ctx.immutable }
      );
      options.ctx.injectFooter.push(enumType);
      return import_typescript3.default.factory.createTypeReferenceNode(enumType.name);
    }
    return tsUnion(schemaObject.enum.map(tsLiteral));
  }
  function collectCompositions(items, required) {
    const output = [];
    for (const item of items) {
      let itemType;
      if ("$ref" in item) {
        itemType = transformSchemaObject(item, options);
        const resolved = options.ctx.resolve(item.$ref);
        if (resolved && typeof resolved === "object" && "properties" in resolved) {
          const validRequired = (required != null ? required : []).filter(
            (key) => !!resolved.properties[key]
          );
          if (validRequired.length) {
            itemType = tsWithRequired(
              itemType,
              validRequired,
              options.ctx.injectFooter
            );
          }
        }
      } else {
        const itemRequired = [...required != null ? required : []];
        if (typeof item === "object" && Array.isArray(item.required)) {
          itemRequired.push(...item.required);
        }
        itemType = transformSchemaObject(
          { ...item, required: itemRequired },
          options
        );
      }
      const discriminator = "$ref" in item && options.ctx.discriminators[item.$ref] || item.discriminator;
      if (discriminator) {
        output.push(tsOmit(itemType, [discriminator.propertyName]));
      } else {
        output.push(itemType);
      }
    }
    return output;
  }
  let finalType = void 0;
  const coreObjectType = transformSchemaObjectCore(schemaObject, options);
  const allOfType = collectCompositions(
    (_b = schemaObject.allOf) != null ? _b : [],
    schemaObject.required
  );
  if (coreObjectType || allOfType.length) {
    const allOf = allOfType.length ? tsIntersection(allOfType) : void 0;
    finalType = tsIntersection([
      ...coreObjectType ? [coreObjectType] : [],
      ...allOf ? [allOf] : []
    ]);
  }
  const anyOfType = collectCompositions(
    (_c = schemaObject.anyOf) != null ? _c : [],
    schemaObject.required
  );
  if (anyOfType.length) {
    finalType = tsUnion([...finalType ? [finalType] : [], ...anyOfType]);
  }
  const oneOfType = collectCompositions(
    schemaObject.oneOf || "type" in schemaObject && schemaObject.type === "object" && schemaObject.enum || [],
    schemaObject.required
  );
  if (oneOfType.length) {
    if (oneOfType.every(tsIsPrimitive)) {
      finalType = tsUnion([...finalType ? [finalType] : [], ...oneOfType]);
    } else {
      finalType = tsIntersection([
        ...finalType ? [finalType] : [],
        tsUnion(oneOfType)
      ]);
    }
  }
  if (finalType) {
    if (schemaObject.nullable) {
      return tsNullable([finalType]);
    }
    return finalType;
  } else {
    if (!("type" in schemaObject)) {
      return UNKNOWN;
    }
    return tsRecord(STRING, options.ctx.emptyObjectsUnknown ? UNKNOWN : NEVER);
  }
}
function transformSchemaObjectCore(schemaObject, options) {
  var _a, _b, _c, _d, _e, _f, _g;
  if ("type" in schemaObject && schemaObject.type) {
    if (schemaObject.type === "null") {
      return NULL;
    }
    if (schemaObject.type === "string") {
      return STRING;
    }
    if (schemaObject.type === "number" || schemaObject.type === "integer") {
      return NUMBER;
    }
    if (schemaObject.type === "boolean") {
      return BOOLEAN;
    }
    if (schemaObject.type === "array") {
      let itemType = UNKNOWN;
      if (schemaObject.prefixItems || Array.isArray(schemaObject.items)) {
        const prefixItems = (_a = schemaObject.prefixItems) != null ? _a : schemaObject.items;
        itemType = import_typescript3.default.factory.createTupleTypeNode(
          prefixItems.map((item) => transformSchemaObject(item, options))
        );
      } else if (schemaObject.items) {
        itemType = transformSchemaObject(schemaObject.items, options);
      }
      const min = typeof schemaObject.minItems === "number" && schemaObject.minItems >= 0 ? schemaObject.minItems : 0;
      const max = typeof schemaObject.maxItems === "number" && schemaObject.maxItems >= 0 && min <= schemaObject.maxItems ? schemaObject.maxItems : void 0;
      const estimateCodeSize = typeof max !== "number" ? min : (max * (max + 1) - min * (min - 1)) / 2;
      if (options.ctx.arrayLength && (min !== 0 || max !== void 0) && estimateCodeSize < 30) {
        if (schemaObject.maxItems > 0) {
          const members = [];
          for (let i = 0; i <= (max != null ? max : 0) - min; i++) {
            const elements = [];
            for (let j = min; j < i + min; j++) {
              elements.push(itemType);
            }
            members.push(import_typescript3.default.factory.createTupleTypeNode(elements));
          }
          return tsUnion(members);
        } else {
          const elements = [];
          for (let i = 0; i < min; i++) {
            elements.push(itemType);
          }
          elements.push(
            import_typescript3.default.factory.createRestTypeNode(
              import_typescript3.default.factory.createArrayTypeNode(itemType)
            )
          );
          return import_typescript3.default.factory.createTupleTypeNode(elements);
        }
      }
      return import_typescript3.default.isTupleTypeNode(itemType) ? itemType : import_typescript3.default.factory.createArrayTypeNode(itemType);
    }
    if (Array.isArray(schemaObject.type) && !Array.isArray(schemaObject)) {
      let uniqueTypes = [];
      if (Array.isArray(schemaObject.oneOf)) {
        for (const t of schemaObject.type) {
          if ((t === "boolean" || t === "string" || t === "number" || t === "integer" || t === "null") && schemaObject.oneOf.find(
            (o) => typeof o === "object" && "type" in o && o.type === t
          )) {
            continue;
          }
          uniqueTypes.push(
            t === "null" || t === null ? NULL : transformSchemaObject(
              { ...schemaObject, type: t, oneOf: void 0 },
              // don’t stack oneOf transforms
              options
            )
          );
        }
      } else {
        uniqueTypes = schemaObject.type.map(
          (t) => t === "null" || t === null ? NULL : transformSchemaObject({ ...schemaObject, type: t }, options)
        );
      }
      return tsUnion(uniqueTypes);
    }
  }
  const coreObjectType = [];
  for (const k of ["oneOf", "allOf", "anyOf"]) {
    if (!schemaObject[k]) {
      continue;
    }
    const discriminator = !schemaObject.discriminator && options.ctx.discriminators[options.path];
    if (discriminator) {
      coreObjectType.unshift(
        createDiscriminatorProperty(discriminator, {
          path: options.path,
          readonly: options.ctx.immutable
        })
      );
      break;
    }
  }
  if ("properties" in schemaObject && schemaObject.properties && Object.keys(schemaObject.properties).length || "additionalProperties" in schemaObject && schemaObject.additionalProperties || "$defs" in schemaObject && schemaObject.$defs) {
    if (Object.keys((_b = schemaObject.properties) != null ? _b : {}).length) {
      for (const [k, v] of getEntries(
        (_c = schemaObject.properties) != null ? _c : {},
        options.ctx
      )) {
        if (typeof v !== "object" || Array.isArray(v)) {
          throw new Error(
            `${options.path}: invalid property ${k}. Expected Schema Object, got ${Array.isArray(v) ? "Array" : typeof v}`
          );
        }
        if (options.ctx.excludeDeprecated) {
          const resolved = "$ref" in v ? options.ctx.resolve(v.$ref) : v;
          if (resolved == null ? void 0 : resolved.deprecated) {
            continue;
          }
        }
        let optional = ((_d = schemaObject.required) == null ? void 0 : _d.includes(k)) || "default" in v && options.ctx.defaultNonNullable && !((_e = options.path) == null ? void 0 : _e.includes("parameters")) ? void 0 : QUESTION_TOKEN;
        let type = "$ref" in v ? oapiRef(v.$ref) : transformSchemaObject(v, {
          ...options,
          path: createRef([(_f = options.path) != null ? _f : "", k])
        });
        if (typeof options.ctx.transform === "function") {
          const result = options.ctx.transform(v, options);
          if (result) {
            if ("schema" in result) {
              type = result.schema;
              optional = result.questionToken ? QUESTION_TOKEN : optional;
            } else {
              type = result;
            }
          }
        }
        const property = import_typescript3.default.factory.createPropertySignature(
          /* modifiers     */
          tsModifiers({
            readonly: options.ctx.immutable || "readOnly" in v && !!v.readOnly
          }),
          /* name          */
          tsPropertyIndex(k),
          /* questionToken */
          optional,
          /* type          */
          type
        );
        addJSDocComment(v, property);
        coreObjectType.push(property);
      }
    }
    if (schemaObject.$defs && typeof schemaObject.$defs === "object" && Object.keys(schemaObject.$defs).length) {
      const defKeys = [];
      for (const [k, v] of Object.entries(schemaObject.$defs)) {
        const property = import_typescript3.default.factory.createPropertySignature(
          /* modifiers    */
          tsModifiers({
            readonly: options.ctx.immutable || "readonly" in v && !!v.readOnly
          }),
          /* name          */
          tsPropertyIndex(k),
          /* questionToken */
          void 0,
          /* type          */
          transformSchemaObject(v, {
            ...options,
            path: createRef([(_g = options.path) != null ? _g : "", "$defs", k])
          })
        );
        addJSDocComment(v, property);
        defKeys.push(property);
      }
      coreObjectType.push(
        import_typescript3.default.factory.createPropertySignature(
          /* modifiers     */
          void 0,
          /* name          */
          tsPropertyIndex("$defs"),
          /* questionToken */
          void 0,
          /* type          */
          import_typescript3.default.factory.createTypeLiteralNode(defKeys)
        )
      );
    }
    if (schemaObject.additionalProperties || options.ctx.additionalProperties) {
      const hasExplicitAdditionalProperties = typeof schemaObject.additionalProperties === "object" && Object.keys(schemaObject.additionalProperties).length;
      let addlType = hasExplicitAdditionalProperties ? transformSchemaObject(
        schemaObject.additionalProperties,
        options
      ) : UNKNOWN;
      if (addlType.kind !== import_typescript3.default.SyntaxKind.UnknownKeyword) {
        addlType = tsUnion([addlType, UNDEFINED]);
      }
      coreObjectType.push(
        import_typescript3.default.factory.createIndexSignature(
          /* modifiers  */
          tsModifiers({
            readonly: options.ctx.immutable
          }),
          /* parameters */
          [
            import_typescript3.default.factory.createParameterDeclaration(
              /* modifiers      */
              void 0,
              /* dotDotDotToken */
              void 0,
              /* name           */
              import_typescript3.default.factory.createIdentifier("key"),
              /* questionToken  */
              void 0,
              /* type           */
              STRING
            )
          ],
          /* type       */
          addlType
        )
      );
    }
  }
  return coreObjectType.length ? import_typescript3.default.factory.createTypeLiteralNode(coreObjectType) : void 0;
}

// src/transform/media-type-object.ts
function transformMediaTypeObject(mediaTypeObject, options) {
  if (!mediaTypeObject.schema) {
    return UNKNOWN;
  }
  return transformSchemaObject(mediaTypeObject.schema, options);
}

// src/transform/header-object.ts
function transformHeaderObject(headerObject, options) {
  var _a;
  if (headerObject.schema) {
    return transformSchemaObject(headerObject.schema, options);
  }
  if (headerObject.content) {
    const type = [];
    for (const [contentType, mediaTypeObject] of getEntries(
      headerObject.content,
      options.ctx
    )) {
      const nextPath = `${(_a = options.path) != null ? _a : "#"}/${(0, import_ref_utils4.escapePointer)(contentType)}`;
      const mediaType = "$ref" in mediaTypeObject ? transformSchemaObject(mediaTypeObject, {
        ...options,
        path: nextPath
      }) : transformMediaTypeObject(mediaTypeObject, {
        ...options,
        path: nextPath
      });
      const property = import_typescript4.default.factory.createPropertySignature(
        /* modifiers     */
        tsModifiers({ readonly: options.ctx.immutable }),
        /* name          */
        tsPropertyIndex(contentType),
        /* questionToken */
        void 0,
        /* type          */
        mediaType
      );
      addJSDocComment(mediaTypeObject, property);
      type.push(property);
    }
    return import_typescript4.default.factory.createTypeLiteralNode(type);
  }
  return UNKNOWN;
}

// src/transform/parameter-object.ts
function transformParameterObject(parameterObject, options) {
  return parameterObject.schema ? transformSchemaObject(parameterObject.schema, options) : STRING;
}

// src/transform/path-item-object.ts
var import_typescript10 = __toESM(require("typescript"), 1);

// src/transform/operation-object.ts
var import_typescript9 = __toESM(require("typescript"), 1);

// src/transform/parameters-array.ts
var import_typescript5 = __toESM(require("typescript"), 1);
function transformParametersArray(parametersArray, options) {
  var _a;
  const type = [];
  const paramType = [];
  for (const paramIn of [
    "query",
    "header",
    "path",
    "cookie"
  ]) {
    const paramLocType = [];
    const operationParameters = parametersArray.map((param) => ({
      original: param,
      resolved: "$ref" in param ? options.ctx.resolve(param.$ref) : param
    }));
    if (options.ctx.alphabetize) {
      operationParameters.sort(
        (a, b) => {
          var _a2, _b, _c, _d;
          return ((_b = (_a2 = a.resolved) == null ? void 0 : _a2.name) != null ? _b : "").localeCompare((_d = (_c = b.resolved) == null ? void 0 : _c.name) != null ? _d : "");
        }
      );
    }
    for (const { original, resolved } of operationParameters) {
      if ((resolved == null ? void 0 : resolved.in) !== paramIn) {
        continue;
      }
      let optional = void 0;
      if (paramIn !== "path" && !resolved.required) {
        optional = QUESTION_TOKEN;
      }
      const subType = "$ref" in original ? oapiRef(original.$ref) : transformParameterObject(resolved, {
        ...options,
        path: createRef([
          (_a = options.path) != null ? _a : "",
          "parameters",
          resolved.in,
          resolved.name
        ])
      });
      const property = import_typescript5.default.factory.createPropertySignature(
        /* modifiers     */
        tsModifiers({ readonly: options.ctx.immutable }),
        /* name          */
        tsPropertyIndex(resolved == null ? void 0 : resolved.name),
        /* questionToken */
        optional,
        /* type          */
        subType
      );
      addJSDocComment(resolved, property);
      paramLocType.push(property);
    }
    const allOptional = paramLocType.every((node) => !!node.questionToken);
    paramType.push(
      import_typescript5.default.factory.createPropertySignature(
        /* modifiers     */
        tsModifiers({ readonly: options.ctx.immutable }),
        /* name          */
        tsPropertyIndex(paramIn),
        /* questionToken */
        allOptional || !paramLocType.length ? QUESTION_TOKEN : void 0,
        /* type          */
        paramLocType.length ? import_typescript5.default.factory.createTypeLiteralNode(paramLocType) : NEVER
      )
    );
  }
  type.push(
    import_typescript5.default.factory.createPropertySignature(
      /* modifiers     */
      tsModifiers({ readonly: options.ctx.immutable }),
      /* name          */
      tsPropertyIndex("parameters"),
      /* questionToken */
      !paramType.length ? QUESTION_TOKEN : void 0,
      /* type          */
      paramType.length ? import_typescript5.default.factory.createTypeLiteralNode(paramType) : NEVER
    )
  );
  return type;
}

// src/transform/request-body-object.ts
var import_typescript6 = __toESM(require("typescript"), 1);
function transformRequestBodyObject(requestBodyObject, options) {
  const type = [];
  for (const [contentType, mediaTypeObject] of getEntries(
    requestBodyObject.content,
    options.ctx
  )) {
    const nextPath = createRef([options.path, contentType]);
    const mediaType = "$ref" in mediaTypeObject ? transformSchemaObject(mediaTypeObject, {
      ...options,
      path: nextPath
    }) : transformMediaTypeObject(mediaTypeObject, {
      ...options,
      path: nextPath
    });
    const property = import_typescript6.default.factory.createPropertySignature(
      /* modifiers     */
      tsModifiers({ readonly: options.ctx.immutable }),
      /* name          */
      tsPropertyIndex(contentType),
      /* questionToken */
      void 0,
      /* type          */
      mediaType
    );
    addJSDocComment(mediaTypeObject, property);
    type.push(property);
  }
  return import_typescript6.default.factory.createTypeLiteralNode([
    import_typescript6.default.factory.createPropertySignature(
      /* modifiers     */
      tsModifiers({ readonly: options.ctx.immutable }),
      /* name          */
      tsPropertyIndex("content"),
      /* questionToken */
      void 0,
      /* type          */
      import_typescript6.default.factory.createTypeLiteralNode(
        type.length ? type : (
          // add `"*/*": never` if no media types are defined
          [
            import_typescript6.default.factory.createPropertySignature(
              /* modifiers     */
              void 0,
              /* name          */
              tsPropertyIndex("*/*"),
              /* questionToken */
              QUESTION_TOKEN,
              /* type          */
              NEVER
            )
          ]
        )
      )
    )
  ]);
}

// src/transform/responses-object.ts
var import_typescript8 = __toESM(require("typescript"), 1);

// src/transform/response-object.ts
var import_typescript7 = __toESM(require("typescript"), 1);
function transformResponseObject(responseObject, options) {
  var _a, _b;
  const type = [];
  const headersObject = [];
  if (responseObject.headers) {
    for (const [name, headerObject] of getEntries(
      responseObject.headers,
      options.ctx
    )) {
      const optional = "$ref" in headerObject || headerObject.required ? void 0 : QUESTION_TOKEN;
      const subType = "$ref" in headerObject ? oapiRef(headerObject.$ref) : transformHeaderObject(headerObject, {
        ...options,
        path: createRef([(_a = options.path) != null ? _a : "", "headers", name])
      });
      const property = import_typescript7.default.factory.createPropertySignature(
        /* modifiers     */
        tsModifiers({ readonly: options.ctx.immutable }),
        /* name          */
        tsPropertyIndex(name),
        /* questionToken */
        optional,
        /* type          */
        subType
      );
      addJSDocComment(headerObject, property);
      headersObject.push(property);
    }
  }
  headersObject.push(
    import_typescript7.default.factory.createIndexSignature(
      /* modifiers     */
      tsModifiers({ readonly: options.ctx.immutable }),
      /* parameters */
      [
        import_typescript7.default.factory.createParameterDeclaration(
          /* modifiers      */
          void 0,
          /* dotDotDotToken */
          void 0,
          /* name           */
          import_typescript7.default.factory.createIdentifier("name"),
          /* questionToken  */
          void 0,
          /* type           */
          STRING
        )
      ],
      /* type          */
      UNKNOWN
    )
  );
  type.push(
    import_typescript7.default.factory.createPropertySignature(
      /* modifiers     */
      void 0,
      /* name          */
      tsPropertyIndex("headers"),
      /* questionToken */
      void 0,
      /* type          */
      import_typescript7.default.factory.createTypeLiteralNode(headersObject)
    )
  );
  const contentObject = [];
  if (responseObject.content) {
    for (const [contentType, mediaTypeObject] of getEntries(
      responseObject.content,
      options.ctx
    )) {
      const property = import_typescript7.default.factory.createPropertySignature(
        /* modifiers     */
        tsModifiers({ readonly: options.ctx.immutable }),
        /* name          */
        tsPropertyIndex(contentType),
        /* questionToken */
        void 0,
        /* type          */
        transformMediaTypeObject(mediaTypeObject, {
          ...options,
          path: createRef([(_b = options.path) != null ? _b : "", "content", contentType])
        })
      );
      contentObject.push(property);
    }
  }
  if (contentObject.length) {
    type.push(
      import_typescript7.default.factory.createPropertySignature(
        /* modifiers     */
        void 0,
        /* name          */
        tsPropertyIndex("content"),
        /* questionToken */
        void 0,
        /* type          */
        import_typescript7.default.factory.createTypeLiteralNode(contentObject)
      )
    );
  } else {
    type.push(
      import_typescript7.default.factory.createPropertySignature(
        /* modifiers     */
        void 0,
        /* name          */
        tsPropertyIndex("content"),
        /* questionToken */
        QUESTION_TOKEN,
        /* type          */
        NEVER
      )
    );
  }
  return import_typescript7.default.factory.createTypeLiteralNode(type);
}

// src/transform/responses-object.ts
function transformResponsesObject(responsesObject, options) {
  var _a;
  const type = [];
  for (const [responseCode, responseObject] of getEntries(
    responsesObject,
    options.ctx
  )) {
    const responseType = "$ref" in responseObject ? oapiRef(responseObject.$ref) : transformResponseObject(responseObject, {
      ...options,
      path: createRef([(_a = options.path) != null ? _a : "", "responses", responseCode])
    });
    const property = import_typescript8.default.factory.createPropertySignature(
      /* modifiers     */
      tsModifiers({ readonly: options.ctx.immutable }),
      /* name          */
      tsPropertyIndex(responseCode),
      /* questionToken */
      void 0,
      /* type          */
      responseType
    );
    addJSDocComment(responseObject, property);
    type.push(property);
  }
  return type.length ? import_typescript8.default.factory.createTypeLiteralNode(type) : NEVER;
}

// src/transform/operation-object.ts
function transformOperationObject(operationObject, options) {
  var _a, _b, _c;
  const type = [];
  type.push(
    ...transformParametersArray((_a = operationObject.parameters) != null ? _a : [], options)
  );
  if (operationObject.requestBody) {
    const requestBodyType = "$ref" in operationObject.requestBody ? oapiRef(operationObject.requestBody.$ref) : transformRequestBodyObject(operationObject.requestBody, {
      ...options,
      path: createRef([options.path, "requestBody"])
    });
    const required = !!((_b = "$ref" in operationObject.requestBody ? options.ctx.resolve(
      operationObject.requestBody.$ref
    ) : operationObject.requestBody) == null ? void 0 : _b.required);
    const property = import_typescript9.default.factory.createPropertySignature(
      /* modifiers     */
      tsModifiers({ readonly: options.ctx.immutable }),
      /* name          */
      tsPropertyIndex("requestBody"),
      /* questionToken */
      required ? void 0 : QUESTION_TOKEN,
      /* type          */
      requestBodyType
    );
    addJSDocComment(operationObject.requestBody, property);
    type.push(property);
  } else {
    type.push(
      import_typescript9.default.factory.createPropertySignature(
        /* modifiers     */
        tsModifiers({ readonly: options.ctx.immutable }),
        /* name          */
        tsPropertyIndex("requestBody"),
        /* questionToken */
        QUESTION_TOKEN,
        /* type          */
        NEVER
      )
    );
  }
  type.push(
    import_typescript9.default.factory.createPropertySignature(
      /* modifiers     */
      tsModifiers({ readonly: options.ctx.immutable }),
      /* name          */
      tsPropertyIndex("responses"),
      /* questionToken */
      void 0,
      /* type          */
      transformResponsesObject(
        (_c = operationObject.responses) != null ? _c : {},
        options
      )
    )
  );
  return type;
}
function injectOperationObject(operationId, operationObject, options) {
  let operations = options.ctx.injectFooter.find(
    (node) => import_typescript9.default.isInterfaceDeclaration(node) && node.name.text === "operations"
  );
  if (!operations) {
    operations = import_typescript9.default.factory.createInterfaceDeclaration(
      /* modifiers       */
      tsModifiers({
        export: true
        // important: do NOT make this immutable
      }),
      /* name            */
      import_typescript9.default.factory.createIdentifier("operations"),
      /* typeParameters  */
      void 0,
      /* heritageClauses */
      void 0,
      /* members         */
      []
    );
    options.ctx.injectFooter.push(operations);
  }
  const type = transformOperationObject(operationObject, options);
  operations.members = import_typescript9.default.factory.createNodeArray([
    ...operations.members,
    import_typescript9.default.factory.createPropertySignature(
      /* modifiers     */
      tsModifiers({ readonly: options.ctx.immutable }),
      /* name          */
      tsPropertyIndex(operationId),
      /* questionToken */
      void 0,
      /* type          */
      import_typescript9.default.factory.createTypeLiteralNode(type)
    )
  ]);
}

// src/transform/path-item-object.ts
function transformPathItemObject(pathItem, options) {
  var _a, _b, _c, _d, _e;
  const type = [];
  type.push(
    ...transformParametersArray((_a = pathItem.parameters) != null ? _a : [], {
      ...options,
      path: createRef([options.path, "parameters"])
    })
  );
  for (const method of [
    "get",
    "put",
    "post",
    "delete",
    "options",
    "head",
    "patch",
    "trace"
  ]) {
    const operationObject = pathItem[method];
    if (!operationObject || options.ctx.excludeDeprecated && ((_b = "$ref" in operationObject ? options.ctx.resolve(operationObject.$ref) : operationObject) == null ? void 0 : _b.deprecated)) {
      type.push(
        import_typescript10.default.factory.createPropertySignature(
          /* modifiers     */
          tsModifiers({ readonly: options.ctx.immutable }),
          /* name          */
          tsPropertyIndex(method),
          /* questionToken */
          QUESTION_TOKEN,
          /* type          */
          NEVER
        )
      );
      continue;
    }
    const keyedParameters = {};
    if (!("$ref" in operationObject)) {
      for (const parameter of [
        ...(_c = pathItem.parameters) != null ? _c : [],
        ...(_d = operationObject.parameters) != null ? _d : []
      ]) {
        const name = "$ref" in parameter ? (_e = options.ctx.resolve(parameter.$ref)) == null ? void 0 : _e.name : parameter.name;
        if (name) {
          keyedParameters[name] = parameter;
        }
      }
    }
    let operationType;
    if ("$ref" in operationObject) {
      operationType = oapiRef(operationObject.$ref);
    } else if (operationObject.operationId) {
      operationType = oapiRef(
        createRef(["operations", operationObject.operationId])
      );
      injectOperationObject(
        operationObject.operationId,
        { ...operationObject, parameters: Object.values(keyedParameters) },
        { ...options, path: createRef([options.path, method]) }
      );
    } else {
      operationType = import_typescript10.default.factory.createTypeLiteralNode(
        transformOperationObject(
          { ...operationObject, parameters: Object.values(keyedParameters) },
          { ...options, path: createRef([options.path, method]) }
        )
      );
    }
    const property = import_typescript10.default.factory.createPropertySignature(
      /* modifiers     */
      tsModifiers({ readonly: options.ctx.immutable }),
      /* name          */
      tsPropertyIndex(method),
      /* questionToken */
      void 0,
      /* type          */
      operationType
    );
    addJSDocComment(operationObject, property);
    type.push(property);
  }
  return import_typescript10.default.factory.createTypeLiteralNode(type);
}

// src/transform/components-object.ts
var transformers = {
  schemas: transformSchemaObject,
  responses: transformResponseObject,
  parameters: transformParameterObject,
  requestBodies: transformRequestBodyObject,
  headers: transformHeaderObject,
  pathItems: transformPathItemObject
};
function transformComponentsObject(componentsObject, ctx) {
  const type = [];
  for (const key of Object.keys(transformers)) {
    const componentT = performance.now();
    const items = [];
    if (componentsObject[key]) {
      for (const [name, item] of getEntries(componentsObject[key], ctx)) {
        let subType = transformers[key](item, {
          path: createRef(["components", key, name]),
          ctx
        });
        let hasQuestionToken = false;
        if (ctx.transform) {
          const result = ctx.transform(item, {
            path: createRef(["components", key, name]),
            ctx
          });
          if (result) {
            if ("schema" in result) {
              subType = result.schema;
              hasQuestionToken = result.questionToken;
            } else {
              subType = result;
            }
          }
        }
        const property = import_typescript11.default.factory.createPropertySignature(
          /* modifiers     */
          tsModifiers({ readonly: ctx.immutable }),
          /* name          */
          tsPropertyIndex(name),
          /* questionToken */
          hasQuestionToken ? QUESTION_TOKEN : void 0,
          /* type          */
          subType
        );
        addJSDocComment(item, property);
        items.push(property);
      }
    }
    type.push(
      import_typescript11.default.factory.createPropertySignature(
        /* modifiers     */
        void 0,
        /* name          */
        tsPropertyIndex(key),
        /* questionToken */
        void 0,
        /* type          */
        items.length ? import_typescript11.default.factory.createTypeLiteralNode(items) : NEVER
      )
    );
    debug(
      `Transformed components \u2192 ${key}`,
      "ts",
      performance.now() - componentT
    );
  }
  return import_typescript11.default.factory.createTypeLiteralNode(type);
}

// src/transform/paths-object.ts
var import_typescript12 = __toESM(require("typescript"), 1);
var PATH_PARAM_RE = /\{[^}]+\}/g;
function transformPathsObject(pathsObject, ctx) {
  var _a, _b, _c;
  const type = [];
  for (const [url, pathItemObject] of getEntries(pathsObject, ctx)) {
    if (!pathItemObject || typeof pathItemObject !== "object") {
      continue;
    }
    const pathT = performance.now();
    if ("$ref" in pathItemObject) {
      const property = import_typescript12.default.factory.createPropertySignature(
        /* modifiers     */
        tsModifiers({ readonly: ctx.immutable }),
        /* name          */
        tsPropertyIndex(url),
        /* questionToken */
        void 0,
        /* type          */
        oapiRef(pathItemObject.$ref)
      );
      addJSDocComment(pathItemObject, property);
    } else {
      const pathItemType = transformPathItemObject(pathItemObject, {
        path: createRef(["paths", url]),
        ctx
      });
      if (ctx.pathParamsAsTypes && url.includes("{")) {
        const pathParams = extractPathParams(pathItemObject, ctx);
        const matches = url.match(PATH_PARAM_RE);
        let rawPath = `\`${url}\``;
        if (matches) {
          for (const match of matches) {
            const paramName = match.slice(1, -1);
            const param = pathParams[paramName];
            if (!param) {
              rawPath = rawPath.replace(match, "${string}");
            } else {
              rawPath = rawPath.replace(
                match,
                `\${${(_b = (_a = param.schema) == null ? void 0 : _a.type) != null ? _b : "string"}}`
              );
            }
          }
          const pathType = (_c = stringToAST(rawPath)[0]) == null ? void 0 : _c.expression;
          if (pathType) {
            type.push(
              import_typescript12.default.factory.createIndexSignature(
                /* modifiers     */
                tsModifiers({ readonly: ctx.immutable }),
                /* parameters    */
                [
                  import_typescript12.default.factory.createParameterDeclaration(
                    /* modifiers      */
                    void 0,
                    /* dotDotDotToken */
                    void 0,
                    /* name           */
                    "path",
                    /* questionToken  */
                    void 0,
                    /* type           */
                    pathType,
                    /* initializer    */
                    void 0
                  )
                ],
                /* type          */
                pathItemType
              )
            );
            continue;
          }
        }
      }
      type.push(
        import_typescript12.default.factory.createPropertySignature(
          /* modifiers     */
          tsModifiers({ readonly: ctx.immutable }),
          /* name          */
          tsPropertyIndex(url),
          /* questionToken */
          void 0,
          /* type          */
          pathItemType
        )
      );
      debug(`Transformed path "${url}"`, "ts", performance.now() - pathT);
    }
  }
  return import_typescript12.default.factory.createTypeLiteralNode(type);
}
function extractPathParams(pathItemObject, ctx) {
  var _a;
  const params = {};
  for (const p of (_a = pathItemObject.parameters) != null ? _a : []) {
    const resolved = "$ref" in p && p.$ref ? ctx.resolve(p.$ref) : p;
    if (resolved && resolved.in === "path") {
      params[resolved.name] = resolved;
    }
  }
  for (const method of [
    "get",
    "put",
    "post",
    "delete",
    "options",
    "head",
    "patch",
    "trace"
  ]) {
    if (!(method in pathItemObject)) {
      continue;
    }
    const resolvedMethod = pathItemObject[method].$ref ? ctx.resolve(
      pathItemObject[method].$ref
    ) : pathItemObject[method];
    if (resolvedMethod == null ? void 0 : resolvedMethod.parameters) {
      for (const p of resolvedMethod.parameters) {
        const resolvedParam = "$ref" in p && p.$ref ? ctx.resolve(p.$ref) : p;
        if (resolvedParam && resolvedParam.in === "path") {
          params[resolvedParam.name] = resolvedParam;
        }
      }
    }
  }
  return params;
}

// src/transform/webhooks-object.ts
var import_typescript13 = __toESM(require("typescript"), 1);
function transformWebhooksObject(webhooksObject, options) {
  const type = [];
  for (const [name, pathItemObject] of getEntries(webhooksObject, options)) {
    type.push(
      import_typescript13.default.factory.createPropertySignature(
        /* modifiers     */
        tsModifiers({
          readonly: options.immutable
        }),
        /* name          */
        tsPropertyIndex(name),
        /* questionToken */
        void 0,
        /* type          */
        transformPathItemObject(pathItemObject, {
          path: createRef(["webhooks", name]),
          ctx: options
        })
      )
    );
  }
  return import_typescript13.default.factory.createTypeLiteralNode(type);
}

// src/transform/index.ts
var transformers2 = {
  paths: transformPathsObject,
  webhooks: transformWebhooksObject,
  components: transformComponentsObject,
  $defs: (node, options) => transformSchemaObject(node, { path: createRef(["$defs"]), ctx: options })
};
function transformSchema(schema, ctx) {
  var _a, _b;
  const type = [];
  for (const root of Object.keys(transformers2)) {
    const emptyObj = import_typescript14.default.factory.createTypeAliasDeclaration(
      /* modifiers      */
      tsModifiers({ export: true }),
      /* name           */
      root,
      /* typeParameters */
      void 0,
      /* type           */
      tsRecord(STRING, NEVER)
    );
    if (schema[root] && typeof schema[root] === "object") {
      const rootT = performance.now();
      const subType = transformers2[root](schema[root], ctx);
      if ((_a = subType.members) == null ? void 0 : _a.length) {
        type.push(
          ctx.exportType ? import_typescript14.default.factory.createTypeAliasDeclaration(
            /* modifiers      */
            tsModifiers({ export: true }),
            /* name           */
            root,
            /* typeParameters */
            void 0,
            /* type           */
            subType
          ) : import_typescript14.default.factory.createInterfaceDeclaration(
            /* modifiers       */
            tsModifiers({ export: true }),
            /* name            */
            root,
            /* typeParameters  */
            void 0,
            /* heritageClauses */
            void 0,
            /* members         */
            subType.members
          )
        );
        debug(`${root} done`, "ts", performance.now() - rootT);
      } else {
        type.push(emptyObj);
        debug(`${root} done (skipped)`, "ts", 0);
      }
    } else {
      type.push(emptyObj);
      debug(`${root} done (skipped)`, "ts", 0);
    }
  }
  let hasOperations = false;
  for (const injectedType of ctx.injectFooter) {
    if (!hasOperations && ((_b = injectedType == null ? void 0 : injectedType.name) == null ? void 0 : _b.escapedText) === "operations") {
      hasOperations = true;
    }
    type.push(injectedType);
  }
  if (!hasOperations) {
    type.push(
      import_typescript14.default.factory.createTypeAliasDeclaration(
        /* modifiers      */
        tsModifiers({ export: true }),
        /* name           */
        "operations",
        /* typeParameters */
        void 0,
        /* type           */
        tsRecord(STRING, NEVER)
      )
    );
  }
  return type;
}

// src/index.ts
var COMMENT_HEADER = `/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

`;
async function openapiTS(source, options = {}) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
  if (!source) {
    throw new Error(
      "Empty schema. Please specify a URL, file path, or Redocly Config"
    );
  }
  const redoc = (_a = options.redocly) != null ? _a : await (0, import_openapi_core2.createConfig)(
    {
      // @ts-expect-error This is OK
      styleguide: {
        rules: {
          "operation-operationId-unique": { severity: "error" }
          // throw error on duplicate operationIDs
        }
      }
    },
    { extends: ["minimal"] }
  );
  const schema = await validateAndBundle(source, {
    redoc,
    cwd: options.cwd instanceof URL ? options.cwd : new URL(`file://${(_b = options.cwd) != null ? _b : process.cwd()}/`),
    silent: (_c = options.silent) != null ? _c : false
  });
  const ctx = {
    additionalProperties: (_d = options.additionalProperties) != null ? _d : false,
    alphabetize: (_e = options.alphabetize) != null ? _e : false,
    defaultNonNullable: (_f = options.defaultNonNullable) != null ? _f : true,
    discriminators: scanDiscriminators(schema),
    emptyObjectsUnknown: (_g = options.emptyObjectsUnknown) != null ? _g : false,
    enum: (_h = options.enum) != null ? _h : false,
    excludeDeprecated: (_i = options.excludeDeprecated) != null ? _i : false,
    exportType: (_j = options.exportType) != null ? _j : false,
    immutable: (_k = options.immutable) != null ? _k : false,
    injectFooter: [],
    pathParamsAsTypes: (_l = options.pathParamsAsTypes) != null ? _l : false,
    postTransform: typeof options.postTransform === "function" ? options.postTransform : void 0,
    redoc,
    silent: (_m = options.silent) != null ? _m : false,
    arrayLength: (_n = options.arrayLength) != null ? _n : false,
    transform: typeof options.transform === "function" ? options.transform : void 0,
    resolve($ref) {
      var _a2;
      return resolveRef(schema, $ref, { silent: (_a2 = options.silent) != null ? _a2 : false });
    }
  };
  const transformT = performance.now();
  const result = transformSchema(schema, ctx);
  debug(
    "Completed AST transformation for entire document",
    "ts",
    performance.now() - transformT
  );
  return result;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BOOLEAN,
  COMMENT_HEADER,
  FALSE,
  JS_ENUM_INVALID_CHARS_RE,
  JS_PROPERTY_INDEX_INVALID_CHARS_RE,
  JS_PROPERTY_INDEX_RE,
  NEVER,
  NULL,
  NUMBER,
  QUESTION_TOKEN,
  STRING,
  TRUE,
  UNDEFINED,
  UNKNOWN,
  addJSDocComment,
  astToString,
  c,
  createDiscriminatorProperty,
  createRef,
  debug,
  error,
  formatTime,
  getEntries,
  injectOperationObject,
  oapiRef,
  resolveRef,
  scanDiscriminators,
  stringToAST,
  transformSchemaObjectWithComposition,
  tsDedupe,
  tsEnum,
  tsEnumMember,
  tsIntersection,
  tsIsPrimitive,
  tsLiteral,
  tsModifiers,
  tsNullable,
  tsOmit,
  tsPropertyIndex,
  tsRecord,
  tsUnion,
  tsWithRequired,
  walk,
  warn
});
module.exports = module.exports.default;
