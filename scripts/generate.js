const { resolve } = require('path');
const { exec } = require('child_process');

const swaggerToTS = resolve(__dirname, '..', 'bin', 'cli.js');

// Settings
const INPUT = resolve(__dirname, '..', 'example', 'input.yaml');
const OUTPUT = resolve(__dirname, '..', 'example', 'output.ts');

// Generate
exec(`node ${swaggerToTS} ${INPUT} -o ${OUTPUT}`);
