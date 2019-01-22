const { readFileSync } = require('fs');
const { resolve } = require('path');
const yaml = require('js-yaml');

const swaggerToTS = require('../dist/swaggerToTS');

describe('swagger-to-ts', () => {
  it('matches the snapshot', () => {
    const test = readFileSync(resolve(__dirname, 'spec.yaml'), 'UTF-8');
    const snapshot = readFileSync(resolve(__dirname, 'snapshot.ts'), 'UTF-8');
    expect(swaggerToTS(yaml.safeLoad(test), 'Catalog')).toBe(snapshot);
  });
});
