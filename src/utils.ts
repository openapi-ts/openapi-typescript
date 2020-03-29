export function capitalize(str: string): string {
  return `${str[0].toUpperCase()}${str.slice(1)}`;
}

export function camelCase(name: string): string {
  return name.replace(/(-|_|\.|\s)+\w/g, (letter): string =>
    letter.toUpperCase().replace(/[^0-9a-z]/gi, '')
  );
}

export function sanitize(name: string): string {
  const sanitized = `'${name}'`;

  // if key starts with number
  if (/^\d/.test(name)) {
    return sanitized;
  }

  // if key contains invalid charactors
  if (/[-@./\\]/.test(name)) {
    return sanitized;
  }

  return name;
}

export function snakeCase(name: string): string {
  return name.replace(/[-\.\s]/g, '_');
}
