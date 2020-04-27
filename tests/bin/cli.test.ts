import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

// Note(drew): OpenAPI support is already well-tested in v2/index.test.ts and
// v3/index.test.ts. So this file is mainly for testing other flags.

describe('cli', () => {
  it('--prettier-config (JSON)', () => {
    execSync(`../../pkg/bin/cli.js specs/petstore.yaml -o generated/petstore.ts --prettier-config .prettierrc`, {
      cwd: path.resolve(__dirname),
    })
    expect(fs.readFileSync(path.resolve(__dirname, 'expected/petstore.ts'), 'utf8')).toBe(
      fs.readFileSync(path.resolve(__dirname, 'generated/petstore.ts'), 'utf8'),
    )
  })

  it('--prettier-config (.js)', () => {
    execSync(`../../pkg/bin/cli.js specs/petstore.yaml -o generated/petstore.ts --prettier-config prettier.config.js`, {
      cwd: path.resolve(__dirname),
    })
    expect(fs.readFileSync(path.resolve(__dirname, 'expected/petstore.ts'), 'utf8')).toBe(
      fs.readFileSync(path.resolve(__dirname, 'generated/petstore.ts'), 'utf8'),
    )
  })
})
