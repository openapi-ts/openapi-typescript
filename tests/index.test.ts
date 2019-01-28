import { readFileSync } from 'fs';
import { resolve, sep } from 'path';
import { execSync } from 'child_process';
import * as glob from 'glob';
import * as yaml from 'js-yaml';
import swaggerToTS from '../src';

describe('TypeScript gen', () => {
  it('matches the snapshots generated', () => {
    execSync('npm run generate');

    const files = glob.sync('./spec/**/*.yaml', {
      root: resolve(__dirname, '..'),
    });

    if (!Array.isArray(files)) return;

    files.forEach(file => {
      const pathname = resolve(__dirname, '..', file);
      const segments = pathname.split(sep);
      const dirname = segments[segments.length - 2];
      const json = yaml.safeLoad(readFileSync(pathname, 'UTF-8'));
      const converted = swaggerToTS(json, dirname);
      const snapshot = pathname
        .replace(`${sep}spec${sep}`, `${sep}types${sep}`)
        .replace(/\.yaml$/i, '.ts');
      expect(converted).toEqual(readFileSync(snapshot, 'UTF-8'));
    });
  });
});
