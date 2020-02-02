import { camelCase, capitalize, sanitize, spacesToUnderscores } from '../src/utils';

it('camelCase', () => {
  expect(camelCase('my-test-string')).toBe('myTestString');
});

describe('capitalize', () => {
  it('lowercase', () => {
    expect(capitalize('capitalized')).toBe('Capitalized');
  });
  it('uppercase', () => {
    expect(capitalize('API')).toBe('API');
  });
});

describe('sanitize', () => {
  it('valid', () => {
    expect(sanitize('my_key')).toBe('my_key');
  });
  it('invalid', () => {
    expect(sanitize('0')).toBe("'0'");
    expect(sanitize('bad-key')).toBe("'bad-key'");
  });
});

it('spacesToUnderscores', () => {
  expect(spacesToUnderscores('one space  two  space')).toBe('one_space__two__space');
});
