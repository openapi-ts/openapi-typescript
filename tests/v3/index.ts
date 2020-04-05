// placeholder test file

/*
import prettier from 'prettier';

// test helper: don’t throw the test due to whitespace differences
function format(types: string): string {
  return prettier.format([WARNING_MESSAGE, types.trim()].join('\n'), PRETTIER_OPTIONS);
}

describe.skip('OpenAPI3 features', () => {
  it('oneOf', () => {
    const schema: OpenAPI2 = {
      swagger: '2.0',
      definitions: {
        one_of: {
          properties: {
            options: {
              oneOf: [{ type: 'string' }, { type: 'number' }, { ref: '#/definitions/one_of_ref' }],
              type: 'array',
            },
          },
          type: 'object',
        },
        one_of_ref: {
          properties: {
            boolean: { type: 'boolean' },
          },
          type: 'object',
        },
      },
    };
    expect(v2(schema)).toBe(
      format(`
    export interface definitions {
      one_of: { options?: string | number | definitions['one_of_ref'] };
      one_of_ref: { boolean?: boolean };
    }`)
    );
  });
});

*/
