import {
  camelCase,
  capitalize,
  descriptionToComment,
  findRef,
  pascalCase,
  snakeCase,
  swaggerVersion,
} from '../../src/utils';

describe('camelCase', () => {
  it('hyphenated', () => {
    expect(camelCase('my-test-string')).toBe('myTestString');
  });
});

describe('capitalize', () => {
  it('lowercase', () => {
    expect(capitalize('capitalized')).toBe('Capitalized');
  });
  it('uppercase', () => {
    expect(capitalize('API')).toBe('API');
  });
});

describe('descriptionToComment', () => {
  it('single-line', () => {
    expect(descriptionToComment('Single-line comment')).toBe('/**\n * Single-line comment\n */');
  });
  it('multi-line', () => {
    expect(descriptionToComment('Multi\nLine\nComment')).toBe(
      '/**\n * Multi\n * Line\n * Comment\n */'
    );
  });
});

describe('findRef', () => {
  it('shallow', () => {
    expect(findRef('#/definitions/user', { definitions: { user: { type: 'object' } } })).toEqual({
      type: 'object',
    });
  });

  it('deep', () => {
    expect(
      findRef('#/components/schemas/user', {
        components: { schemas: { user: { type: 'object' } } },
      })
    ).toEqual({ type: 'object' });
  });
});

describe('pascalCase', () => {
  it('snake_case', () => {
    expect(pascalCase('my_key')).toBe('MyKey');
  });
});

describe('snakeCase', () => {
  it('spaces', () => {
    expect(snakeCase('one space  two  space')).toBe('one_space__two__space');
  });
  it('period', () => {
    expect(snakeCase('terminal.register')).toBe('terminal_register');
  });
});

describe('swaggerVersion', () => {
  const v2: any = { swagger: '2.0' };
  const v3: any = { openapi: '3.0.0' };

  it('v2', () => {
    expect(swaggerVersion(v2)).toBe(2);
  });
  it('v3', () => {
    expect(swaggerVersion(v3)).toBe(3);
  });
  it('errs', () => {
    expect(() => swaggerVersion({} as any)).toThrow();
  });
});
