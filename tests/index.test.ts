import graphqlGen from '../src';

describe('graphqlGen', () => {
  it('is able to parse a Swagger 2 spec', () => {
    const spec = { definitions: {} };
    const options = { swagger: 2 };

    expect(graphqlGen(spec, options)).toBe('namespace OpenAPI2 {}\n');
  });

  it('errs on other options', () => {
    const spec = { definitions: {} };
    const options = { swagger: 1 };
    expect(() => graphqlGen(spec, options)).toThrowError();
  });
});
