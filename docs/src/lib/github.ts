const AVATAR_RE = /property="og:image" content="([^"]+)/;

export async function fetchAvatar(username: string): Promise<string> {
  const res = await fetch(`https://github.com/${username}`);
  if (!res.ok) throw new Error(`${res.url} responded with ${res.status}`);
  const body = await res.text();
  const match = body.match(AVATAR_RE);
  if (!match) throw new Error(`Could not find avatar for ${username}`);
  return match[1];
}
