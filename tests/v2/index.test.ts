import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import prettier from 'prettier';
import { OpenAPI2, Property, OpenAPI2SchemaObject } from '../../src';
import v2, { PRETTIER_OPTIONS, WARNING_MESSAGE } from '../../src/v2';

// simple snapshot tests with valid schemas to make sure it can generally parse & generate output
describe('parsing & output', () => {
  it('manifold', () => {});

  it('stripe', () => {
    const input = yaml.safeLoad(fs.readFileSync(path.resolve(__dirname, 'stripe.yaml'), 'utf8'));
    const output = fs.readFileSync(path.resolve(__dirname, 'stripe.ts'), 'utf8');
    expect(v2(input)).toBe(output);
  });
});

// test helper: don’t throw the test due to whitespace differences
function format(types: string): string {
  return prettier.format([WARNING_MESSAGE, types.trim()].join('\n'), PRETTIER_OPTIONS);
}

// check individual transformations
describe('transformation', () => {
  describe('types', () => {
    it('string', () => {
      const schema: OpenAPI2 = {
        swagger: '2.0',
        definitions: { User: { properties: { email: { type: 'string' } }, type: 'object' } },
      };
      expect(v2(schema)).toBe(
        format(`
        export interface definitions {
          User: { email?: string }
        }`)
      );
    });

    it('string from top-level', () => {
      const schema: OpenAPI2 = {
        swagger: '2.0',
        definitions: { base_url: { type: 'string' } },
      };
      expect(v2(schema)).toBe(
        format(`
        export interface definitions {
          base_url: string;
        }`)
      );
    });

    it('string with $ref', () => {
      const schema: OpenAPI2 = {
        swagger: '2.0',
        definitions: {
          User: {
            properties: { password: { $ref: '#/definitions/UserPassword' } },
            type: 'object',
          },
          UserPassword: { type: 'string' },
        },
      };

      expect(v2(schema)).toBe(
        format(`
        export interface definitions {
          User: { password?: definitions['UserPassword'] }
          UserPassword: string;
        }`)
      );
    });

    it('number', () => {
      const schema: OpenAPI2 = {
        swagger: '2.0',
        definitions: { User: { properties: { age: { type: 'integer' } }, type: 'object' } },
      };
      expect(v2(schema)).toBe(
        format(`
        export interface definitions {
          User: { age?: number }
        }`)
      );
    });

    it('boolean', () => {
      const schema: OpenAPI2 = {
        swagger: '2.0',
        definitions: { User: { properties: { active: { type: 'boolean' } }, type: 'object' } },
      };
      expect(v2(schema)).toBe(
        format(`
        export interface definitions {
          User: { active?: boolean }
        }`)
      );
    });

    it('array of $refs', () => {
      const schema: OpenAPI2 = {
        swagger: '2.0',
        definitions: {
          Team: { properties: { id: { type: 'string' } }, type: 'object' },
          User: {
            properties: { teams: { type: 'array', items: { $ref: '#/definitions/Team' } } },
            type: 'object',
          },
        },
      };

      expect(v2(schema)).toBe(
        format(`
        export interface definitions {
          Team: { id?: string }
          User: { teams?: definitions['Team'][] }
        }`)
      );
    });

    it('array of strings', () => {
      const schema: OpenAPI2 = {
        swagger: '2.0',
        definitions: {
          Post: {
            properties: {
              tags: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            type: 'object',
          },
        },
      };
      expect(v2(schema)).toBe(
        format(`
        export interface definitions {
          Post: { tags?: string[] }
        }`)
      );
    });

    it('array of objects', () => {
      const schema: OpenAPI2 = {
        swagger: '2.0',
        definitions: {
          User: {
            properties: {
              remote_ids: {
                type: 'array',
                items: { type: 'object', properties: { id: { type: 'string' } } },
              },
            },
            type: 'object',
          },
        },
      };
      expect(v2(schema)).toBe(
        format(`
        export interface definitions {
          User: { remote_ids?: { id?: string }[] }
        }`)
      );
    });

    it('array of arrays', () => {
      const schema: OpenAPI2 = {
        swagger: '2.0',
        definitions: {
          Resource: {
            properties: {
              environments: {
                type: 'array',
                // 3 nested arrays just for good measure
                items: { type: 'array', items: { type: 'array', items: { type: 'string' } } },
              },
            },
            type: 'object',
          },
        },
      };
      expect(v2(schema)).toBe(
        format(`
        export interface definitions {
          Resource: { environments?: string[][][] }
        }`)
      );
    });

    it('object of objects', () => {
      const schema: OpenAPI2 = {
        swagger: '2.0',
        definitions: {
          user: {
            properties: {
              RemoteID: {
                type: 'object',
                properties: { id: { type: 'string' } },
              },
            },
            type: 'object',
          },
        },
      };

      expect(v2(schema)).toBe(
        format(`
        export interface definitions {
          user: { RemoteID?: { id?: string } }
        }`)
      );
    });

    it('object from unknown', () => {
      const schema: OpenAPI2 = {
        swagger: '2.0',
        definitions: {
          BrokerStatus: {
            // missing type
            properties: { address: { type: 'string' }, certifiedFee: { type: 'integer' } },
          },
        },
      };
      expect(v2(schema)).toBe(
        format(`
        export interface definitions {
          BrokerStatus: { address?: string; certifiedFee?: number }
        }`)
      );
    });

    it('union', () => {
      const schema: OpenAPI2 = {
        swagger: '2.0',
        definitions: {
          User: {
            properties: { role: { type: 'string', enum: ['user', 'admin'] } },
            type: 'object',
          },
        },
      };
      expect(v2(schema)).toBe(
        format(`
        export interface definitions {
          User: { role?: 'user' | 'admin' }
        }`)
      );
    });
  });

  describe('OpenAPI2 features', () => {
    describe('additionalProperties', () => {
      it('true', () => {
        const schema: OpenAPI2 = {
          swagger: '2.0',
          definitions: { FeatureMap: { type: 'object', additionalProperties: true } },
        };
        expect(v2(schema)).toBe(
          format(`
          export interface definitions {
            FeatureMap: [key: string]: any;
          }`)
        );
      });

      it('object', () => {
        const schema: OpenAPI2 = {
          swagger: '2.0',
          definitions: {
            CamundaFormField: {
              type: 'object',
              required: ['displayType', 'id', 'label', 'options', 'responseType'],
              properties: {
                displayType: {
                  type: 'string',
                  enum: ['radio', 'date', 'select', 'textfield', 'unknown'],
                },
                id: { type: 'string' },
                label: { type: 'string' },
                options: { type: 'object', additionalProperties: { type: 'string' } },
                responseType: {
                  type: 'string',
                  enum: [
                    'booleanField',
                    'stringField',
                    'longField',
                    'enumField',
                    'dateField',
                    'customTypeField',
                    'unknownFieldType',
                  ],
                },
                value: { type: 'string' },
              },
              title: 'CamundaFormField',
            },
          },
        };

        expect(v2(schema)).toBe(
          format(`
          export interface definitions {
            CamundaFormField: {
              displayType: 'radio' | 'date' | 'select' | 'textfield' | 'unknown';
              id: string;
              label: string;
              options: { [key: string]: string }
              responseType:
                | 'booleanField'
                | 'stringField'
                | 'longField'
                | 'enumField'
                | 'dateField'
                | 'customTypeField'
                | 'unknownFieldType';
              value?: string;
            }
          }`)
        );
      });
    });

    it('allOf', () => {
      const schema: OpenAPI2 = {
        swagger: '2.0',
        definitions: {
          Admin: {
            allOf: [
              { $ref: '#/definitions/User' },
              { properties: { rbac: { type: 'string' } }, type: 'object' },
            ],
            type: 'object',
          },
          User: { properties: { email: { type: 'string' } }, type: 'object' },
        },
      };
      expect(v2(schema)).toBe(
        format(`
        export interface definitions {
          Admin: { rbac?: string }
          User: { email?: string; rbac?: string }
        }`)
      );
    });

    it('description', () => {
      const schema: OpenAPI2 = {
        swagger: '2.0',
        definitions: {
          Post: {
            description: 'A blog post',
            type: 'object',
          }
        }
      }
      expect(v2(schema)).toBe(
        format(`
        export interface definitions {
          Post {
            /* A blog post */
            [key: string]: any;
          }
        }`)
      );
    });

    it('oneOf', () => {
      const schema: OpenAPI2 = {
        swagger: '2.0',
        definitions: {
          Record: {
            properties: {
              rand: { oneOf: [{ type: 'string' }, { type: 'number' }], type: 'array' },
            },
            type: 'object',
          },
        },
      };
      expect(v2(schema)).toBe(
        format(`
        export interface definitions {
          Record { rand?: string | number }
        }`)
      );
    });

    it('required', () => {
      const schema: OpenAPI2 = {
        swagger: '2.0',
        definitions: {
          User: {
            properties: { username: { type: 'string' } },
            required: ['username'],
            type: 'object',
          },
        },
      };
      expect(v2(schema)).toBe(
        format(`
        export interface definitions {
          User: { username: string }
        }`)
      );
    });
  });

  describe('propertyMapper', () => {
    const schema: OpenAPI2 = {
      swagger: '2.0',
      definitions: {
        Name: {
          properties: { first: { type: 'string' }, last: { type: 'string', 'x-nullable': false } },
          type: 'object',
        },
      },
    };

    it('accepts a mapper in options', () => {
      const propertyMapper = (
        swaggerDefinition: OpenAPI2SchemaObject,
        property: Property
      ): Property => property;
      v2(schema, propertyMapper);
    });

    it('passes definition to mapper', () => {
      const propertyMapper = jest.fn((_, prop) => prop);
      v2(schema, propertyMapper);
      if (!schema.definitions || !schema.definitions.Name.properties) {
        throw new Error('properties missing');
      }
      expect(propertyMapper).toBeCalledWith(
        schema.definitions.Name.properties.first,
        expect.any(Object)
      );
    });

    it('uses result of mapper', () => {
      const getNullable = (d: { [key: string]: any }): boolean => {
        const nullable = d['x-nullable'];
        if (typeof nullable === 'boolean') {
          return nullable;
        }
        return true;
      };

      const propertyMapper = (
        swaggerDefinition: OpenAPI2SchemaObject,
        property: Property
      ): Property => ({ ...property, optional: getNullable(swaggerDefinition) });

      v2(schema, propertyMapper);

      expect(v2(schema, propertyMapper)).toBe(
        format(
          `
        export interface definitions {
          Name: { first?: string; last: string }
        }`
        )
      );
    });
  });
});
