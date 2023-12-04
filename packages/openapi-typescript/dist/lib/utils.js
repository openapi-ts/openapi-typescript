import { escapePointer, parseRef, } from "@redocly/openapi-core/lib/ref-utils.js";
import c from "ansi-colors";
import supportsColor from "supports-color";
import ts from "typescript";
import { tsLiteral, tsModifiers, tsPropertyIndex } from "./ts.js";
if (!supportsColor.stdout || supportsColor.stdout.hasBasic === false) {
    c.enabled = false;
}
const DEBUG_GROUPS = {
    redoc: c.cyanBright,
    lint: c.yellowBright,
    bundle: c.magentaBright,
    ts: c.blueBright,
};
export { c };
export function createDiscriminatorProperty(discriminator, { path, readonly = false }) {
    let value = parseRef(path).pointer.pop();
    if (discriminator.mapping) {
        const matchedValue = Object.entries(discriminator.mapping).find(([, v]) => (!v.startsWith("#") && v === value) ||
            (v.startsWith("#") && parseRef(v).pointer.pop() === value));
        if (matchedValue) {
            value = matchedValue[0];
        }
    }
    return ts.factory.createPropertySignature(tsModifiers({
        readonly,
    }), tsPropertyIndex(discriminator.propertyName), undefined, tsLiteral(value));
}
export function createRef(parts) {
    let pointer = "#";
    for (const part of parts) {
        if (!part) {
            continue;
        }
        const maybeRef = parseRef(String(part)).pointer;
        if (maybeRef.length) {
            for (const refPart of maybeRef) {
                pointer += `/${escapePointer(refPart)}`;
            }
        }
        else {
            pointer += `/${escapePointer(part)}`;
        }
    }
    return pointer;
}
export function debug(msg, group, time) {
    if (process.env.DEBUG &&
        (!group ||
            process.env.DEBUG === "*" ||
            process.env.DEBUG === "openapi-ts:*" ||
            process.env.DEBUG.toLocaleLowerCase() ===
                `openapi-ts:${group.toLocaleLowerCase()}`)) {
        const groupColor = (group && DEBUG_GROUPS[group]) || c.whiteBright;
        const groupName = groupColor(`openapi-ts:${group ?? "info"}`);
        let timeFormatted = "";
        if (typeof time === "number") {
            timeFormatted = c.green(` ${formatTime(time)} `);
        }
        console.debug(`  ${c.bold(groupName)}${timeFormatted}${msg}`);
    }
}
export function error(msg) {
    console.error(c.red(` ✘  ${msg}`));
}
export function formatTime(t) {
    if (typeof t === "number") {
        if (t < 1000) {
            return `${Math.round(10 * t) / 10}ms`;
        }
        else if (t < 60000) {
            return `${Math.round(t / 100) / 10}s`;
        }
        return `${Math.round(t / 6000) / 10}m`;
    }
    return t;
}
export function getEntries(obj, options) {
    let entries = Object.entries(obj);
    if (options?.alphabetize) {
        entries.sort(([a], [b]) => a.localeCompare(b, "en-us", { numeric: true }));
    }
    if (options?.excludeDeprecated) {
        entries = entries.filter(([, v]) => !(v && typeof v === "object" && "deprecated" in v && v.deprecated));
    }
    return entries;
}
export function resolveRef(schema, $ref, { silent = false, visited = [] }) {
    const { pointer } = parseRef($ref);
    if (!pointer.length) {
        return undefined;
    }
    let node = schema;
    for (const key of pointer) {
        if (node && typeof node === "object" && node[key]) {
            node = node[key];
        }
        else {
            warn(`Could not resolve $ref "${$ref}"`, silent);
            return undefined;
        }
    }
    if (node && typeof node === "object" && node.$ref) {
        if (visited.includes(node.$ref)) {
            warn(`Could not resolve circular $ref "${$ref}"`, silent);
            return undefined;
        }
        return resolveRef(schema, node.$ref, {
            silent,
            visited: [...visited, node.$ref],
        });
    }
    return node;
}
export function scanDiscriminators(schema) {
    const discriminators = {};
    walk(schema, (obj, path) => {
        if (obj?.discriminator?.propertyName) {
            discriminators[createRef(path)] =
                obj.discriminator;
        }
    });
    walk(schema, (obj, path) => {
        for (const key of ["oneOf", "anyOf", "allOf"]) {
            if (obj && Array.isArray(obj[key])) {
                for (const item of obj[key]) {
                    if ("$ref" in item) {
                        if (discriminators[item.$ref]) {
                            discriminators[createRef(path)] = {
                                ...discriminators[item.$ref],
                            };
                        }
                    }
                    else if (item.discriminator?.propertyName) {
                        discriminators[createRef(path)] = { ...item.discriminator };
                    }
                }
            }
        }
    });
    return discriminators;
}
export function walk(obj, cb, path = []) {
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
export function warn(msg, silent = false) {
    if (!silent) {
        console.warn(c.yellow(` ⚠  ${msg}`));
    }
}
//# sourceMappingURL=utils.js.map