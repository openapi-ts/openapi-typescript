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

  // if key contains hyphen
  if (name.includes('-')) {
    return sanitized;
  }

  // if key contains at sign
  if (name.includes('@')) {
    return sanitized;
  }

  return name;
}

export function spacesToUnderscores(name: string): string {
  return name.replace(/\s/g, '_');
}
