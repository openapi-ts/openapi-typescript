import { escape, swaggerVersion, unescape, isRootNodeV2 } from '../../src/utils';

describe('escape', () => {
  it('escape', () => {
    expect(escape('string')).toBe('<@string@>');
  });
  it('unescape', () => {
    expect(unescape('"<@string@>"')).toBe('string');
  });
});

describe('isRootNodeV2', () => {
  it('returns true for shallow objects', () => {
    expect(
      isRootNodeV2([
        { type: 'string' },
        { type: 'number' },
        { type: 'boolean' },
        { type: 'array', items: { type: 'string' } },
        "<@definitions['remote_ref']",
      ])
    ).toBe(true);
  });

  it('returns false for nested objects', () => {
    expect(
      isRootNodeV2([
        { type: 'object', properties: { boolean: { type: 'boolean' } } },
        { type: 'array', items: { type: 'object', properties: { string: { type: 'string' } } } },
        { type: 'string' }, // end on shallow type to try and trick it
      ])
    ).toBe(false);
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
