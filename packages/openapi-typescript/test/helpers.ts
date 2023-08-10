import fs from "node:fs";

export const CLRF_RE = /\r\n/g;

/** Normalize all linebreaks to \n when reading files (for Windows tests) */
export function readFile(filepath: fs.PathOrFileDescriptor): string {
  const contents = fs.readFileSync(filepath, "utf8"); // Windows hack: fileURLToPath needed :/
  if (process.env.CI_ENV === "windows") {
    return contents.replace(CLRF_RE, "\n"); // only do work on Windows
  }
  return contents;
}
