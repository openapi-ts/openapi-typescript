import swaggerToTS, { Options } from '../src';

describe('swaggerToTS', () => {
  it('is able to parse a Swagger 2 spec', () => {
    const spec = { swagger: '2.0', definitions: {} };
    const options: Options = { warning: false };
    expect(swaggerToTS(spec, options)).toBe('declare namespace OpenAPI2 {}\n');
  });

  it('assumes Swagger 2 if version missing', () => {
    const spec = { definitions: {} };
    const options: Options = { warning: false };
    expect(swaggerToTS(spec, options)).toBe('declare namespace OpenAPI2 {}\n');
  });

  it('should not render a wrapper when passing false', () => {
    const spec = { swagger: '2.0', definitions: {} };
    const options: Options = { wrapper: false, warning: false };
    expect(swaggerToTS(spec, options)).toBe('');
  });
});
