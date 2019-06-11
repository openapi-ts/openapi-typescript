import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as yaml from 'js-yaml';
import * as prettier from 'prettier';
import swaggerToTS from '../src';
import { Swagger2 } from '../src/swagger-2';

/* eslint-disable @typescript-eslint/explicit-function-return-type */

// Let Prettier handle formatting, not the test expectations
function format(spec: string, wrapper: string = 'declare namespace OpenAPI2'): string {
  return prettier.format(`${wrapper} { ${spec} }`, { parser: 'typescript', singleQuote: true });
}

describe('Swagger 2 spec', () => {
  describe('core Swagger types', () => {
    it('string -> string', () => {
      const swagger: Swagger2 = {
        definitions: {
          User: {
            properties: {
              email: { type: 'string' },
            },
            type: 'object',
          },
        },
      };

      const ts = format(`
      export interface User {
        email?: string;
      }`);

      expect(swaggerToTS(swagger)).toBe(ts);
    });

    it('integer -> number', () => {
      const swagger: Swagger2 = {
        definitions: {
          User: {
            properties: {
              age: { type: 'integer' },
            },
            type: 'object',
          },
        },
      };

      const ts = format(`
      export interface User {
        age?: number;
      }`);

      expect(swaggerToTS(swagger)).toBe(ts);
    });

    it('number -> number', () => {
      const swagger: Swagger2 = {
        definitions: {
          User: {
            properties: {
              lat: { type: 'number', format: 'float' },
            },
            type: 'object',
          },
        },
      };

      const ts = format(`
      export interface User {
        lat?: number;
      }`);

      expect(swaggerToTS(swagger)).toBe(ts);
    });

    it('boolean -> boolean', () => {
      const swagger: Swagger2 = {
        definitions: {
          User: {
            properties: {
              active: { type: 'boolean' },
            },
            type: 'object',
          },
        },
      };

      const ts = format(`
      export interface User {
        active?: boolean;
      }`);

      expect(swaggerToTS(swagger)).toBe(ts);
    });
  });

  describe('complex structures', () => {
    it('handles arrays of primitive structures', () => {
      const swagger: Swagger2 = {
        definitions: {
          User: {
            properties: {
              teams: { type: 'array', items: { type: 'string' } },
            },
            type: 'object',
          },
        },
      };

      const ts = format(`
      export interface User {
        teams?: string[];
      }`);

      expect(swaggerToTS(swagger)).toBe(ts);
    });

    it('handles arrays of complex items', () => {
      const swagger: Swagger2 = {
        definitions: {
          Team: {
            properties: {
              id: { type: 'string' },
            },
            type: 'object',
          },
          User: {
            properties: {
              teams: { type: 'array', items: { $ref: '#/definitions/Team' } },
            },
            type: 'object',
          },
        },
      };

      const ts = format(`
      export interface User {
        teams?: Team[];
      }
      export interface Team {
        id?: string;
      }`);

      expect(swaggerToTS(swagger)).toBe(ts);
    });

    it('handles allOf', () => {
      const swagger: Swagger2 = {
        definitions: {
          Admin: {
            allOf: [
              { $ref: '#/definitions/User' },
              {
                properties: {
                  rbac: { type: 'string' },
                },
                type: 'object',
              },
            ],
            type: 'object',
          },
          User: {
            properties: {
              email: { type: 'string' },
            },
            type: 'object',
          },
        },
      };

      const ts = format(`
      export interface User {
        email?: string;
      }
      export interface Admin extends User {
        rbac?: string;
      }`);

      expect(swaggerToTS(swagger)).toBe(ts);
    });

    it('handles oneOf', () => {
      const swagger: Swagger2 = {
        definitions: {
          Record: {
            properties: {
              rand: {
                oneOf: [{ type: 'string' }, { type: 'number' }],
                type: 'array',
              },
            },
            type: 'object',
          },
        },
      };

      const ts = format(`
      export interface Record {
        rand?: string | number;
      }`);

      expect(swaggerToTS(swagger)).toBe(ts);
    });

    it('handles enum', () => {
      const swagger: Swagger2 = {
        definitions: {
          User: {
            properties: {
              role: { type: 'string', enum: ['user', 'admin'] },
            },
            type: 'object',
          },
        },
      };

      const ts = format(`
      export interface User {
        role?: 'user' | 'admin';
      }`);

      expect(swaggerToTS(swagger)).toBe(ts);
    });
  });

  describe('property names', () => {
    it('preserves snake_case keys by default', () => {
      const swagger: Swagger2 = {
        definitions: {
          User: {
            properties: {
              profile_image: { type: 'string' },
              address_line_1: { type: 'string' },
            },
            type: 'object',
          },
        },
      };

      const ts = format(`
      export interface User {
        profile_image?: string;
        address_line_1?: string;
      }`);

      expect(swaggerToTS(swagger)).toBe(ts);
    });

    it('converts snake_case to camelCase if specified', () => {
      const swagger: Swagger2 = {
        definitions: {
          User: {
            properties: {
              profile_image: { type: 'string' },
              address_line_1: { type: 'string' },
            },
            type: 'object',
          },
        },
      };

      const ts = format(`
      export interface User {
        profileImage?: string;
        addressLine1?: string;
      }`);

      expect(swaggerToTS(swagger, { camelcase: true })).toBe(ts);
    });

    it('handles kebab-case property names', () => {
      const swagger: Swagger2 = {
        definitions: {
          User: {
            properties: {
              'profile-image': { type: 'string' },
              'address-line-1': { type: 'string' },
            },
            type: 'object',
          },
        },
      };

      const ts = format(`
      export interface User {
        'profile-image'?: string;
        'address-line-1'?: string;
      }`);

      expect(swaggerToTS(swagger)).toBe(ts);
    });
  });

  describe('TS features', () => {
    it('specifies required types', () => {
      const swagger: Swagger2 = {
        definitions: {
          User: {
            properties: {
              username: { type: 'string' },
            },
            required: ['username'],
            type: 'object',
          },
        },
      };

      const ts = format(`
      export interface User {
        username: string;
      }`);

      expect(swaggerToTS(swagger)).toBe(ts);
    });

    it('flattens single-type $refs', () => {
      const swagger: Swagger2 = {
        definitions: {
          User: {
            properties: {
              password: { $ref: '#/definitions/UserPassword' },
            },
            type: 'object',
          },
          UserPassword: {
            type: 'string',
          },
        },
      };

      const ts = format(`
      export interface User {
        password?: string;
      }`);

      expect(swaggerToTS(swagger)).toBe(ts);
    });
  });

  it('can deal with additionalProperties: true', () => {
    const swagger: Swagger2 = {
      definitions: {
        FeatureMap: {
          type: 'object',
          additionalProperties: true,
        },
      },
    };

    const ts = format(`
    export interface FeatureMap {
      [name: string]: any;
    }`);

    expect(swaggerToTS(swagger)).toBe(ts);
  });

  it('can deal with additionalProperties of type', () => {
    const swagger: Swagger2 = {
      definitions: {
        Credentials: {
          type: 'object',
          additionalProperties: {
            type: 'string',
          },
        },
      },
    };

    const ts = format(`
    export interface Credentials {
      [name: string]: string;
    }`);

    expect(swaggerToTS(swagger)).toBe(ts);
  });

  describe('other output', () => {
    // Basic snapshot test.
    // If changes are all good, run `npm run generate` to update (⚠️ This will cement your changes so be sure they’re 100% correct!)
    it('generates the example output correctly', () => {
      const input = yaml.safeLoad(
        readFileSync(resolve(__dirname, '..', 'example', 'input.yaml'), 'UTF-8')
      );
      const output = readFileSync(resolve(__dirname, '..', 'example', 'output.d.ts'), 'UTF-8');

      expect(swaggerToTS(input)).toBe(output);
    });

    it('skips top-level array definitions', () => {
      const swagger: Swagger2 = {
        definitions: {
          Colors: {
            type: 'array',
            items: { $ref: '#/definitions/Color' },
          },
          Color: { type: 'string' },
        },
      };

      const ts = format('');

      expect(swaggerToTS(swagger)).toBe(ts);
    });
  });

  describe('wrapper option', () => {
    it('has a default wrapper', () => {
      const swagger: Swagger2 = {
        definitions: {
          Name: {
            properties: {
              first: { type: 'string' },
              last: { type: 'string' },
            },
            type: 'object',
          },
        },
      };

      const ts = format(`
      export interface Name {
        first?: string;
        last?: string;
      }`);

      expect(swaggerToTS(swagger)).toBe(ts);
    });

    it('allows namespace wrappers', () => {
      const wrapper = 'export namespace MyNamespace';

      const swagger: Swagger2 = {
        definitions: {
          Name: {
            properties: {
              first: { type: 'string' },
              last: { type: 'string' },
            },
            type: 'object',
          },
        },
      };

      const ts = format(
        `
      export interface Name {
        first?: string;
        last?: string;
      }`,
        wrapper
      );

      expect(swaggerToTS(swagger, { wrapper })).toBe(ts);
    });

    it('allows module wrappers', () => {
      const wrapper = 'declare module MyNamespace';

      const swagger: Swagger2 = {
        definitions: {
          Name: {
            properties: {
              first: { type: 'string' },
              last: { type: 'string' },
            },
            type: 'object',
          },
        },
      };

      const ts = format(
        `
      export interface Name {
        first?: string;
        last?: string;
      }`,
        wrapper
      );

      expect(swaggerToTS(swagger, { wrapper })).toBe(ts);
    });
  });
});
