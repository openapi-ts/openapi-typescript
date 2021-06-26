export function sanitizeLB(code: string): string {
  return code.replace(/\r\n/g, "\n");
}
