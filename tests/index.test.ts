import swaggerToTS, { Options } from '../src';

describe('swaggerToTS', () => {
  it('is able to parse a Swagger 2 spec', () => {
    const spec = { definitions: {} };
    const options: Options = { swagger: 2 };

    expect(swaggerToTS(spec, options)).toBe('namespace OpenAPI2 {}\n');
  });

  it('errs on other options', () => {
    const spec = { definitions: {} };
    const options: Options = { swagger: 1 };
    expect(() => swaggerToTS(spec, options)).toThrowError();
  });
});
