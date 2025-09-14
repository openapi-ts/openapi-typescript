// Copyright 2019 Redocly Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
export type Falsy = undefined | null | false | '' | 0;

export function isTruthy<Truthy>(value: Truthy | Falsy): value is Truthy {
  return !!value;
}

export function parseRef(ref: string): { uri: string | null; pointer: string[] } {
  const [uri, pointer = ''] = ref.split('#/');
  return {
    uri: (uri.endsWith('#') ? uri.slice(0, -1) : uri) || null,
    pointer: parsePointer(pointer),
  };
}

export function parsePointer(pointer: string) {
  return pointer.split('/').map(unescapePointer).filter(isTruthy);
}

export function unescapePointer(fragment: string): string {
  return decodeURIComponent(fragment.replace(/~1/g, '/').replace(/~0/g, '~'));
}

export function escapePointer<T extends string | number>(fragment: T): T {
  if (typeof fragment === 'number') return fragment;
  return (fragment as string).replace(/~/g, '~0').replace(/\//g, '~1') as T;
}
