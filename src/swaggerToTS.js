const { format } = require('prettier'); // eslint-disable-line import/no-extraneous-dependencies

// Primitives only!
const TYPES = {
  string: 'string',
  integer: 'number',
  number: 'number',
};

const capitalize = str => `${str[0].toUpperCase()}${str.slice(1)}`;

const camelCase = name =>
  name.replace(/(-|_|\.|\s)+[a-z]/g, letter =>
    letter.toUpperCase().replace(/[^0-9a-z]/gi, '')
  );

const buildTypes = (spec, namespace) => {
  const { definitions } = spec;

  const queue = [];
  const enumQueue = [];
  const output = [`namespace ${namespace} {`];

  const getRef = lookup => {
    const ref = lookup.replace('#/definitions/', '');
    return [ref, definitions[ref]];
  };

  // Returns primitive type, or 'object' or 'any'
  const getType = ({ $ref, items, type }) => {
    if ($ref) {
      const [refName, refProperties] = getRef($ref);
      return TYPES[refProperties.type] || refName || 'any';
    } else if (type === 'array') {
      if (items.$ref) {
        const [refName, refProperties] = getRef(items.$ref);
        return `${TYPES[refProperties.type] || refName || 'any'}[]`;
      }
      return `${TYPES[items.type] || 'any'}[]`;
    }

    return TYPES[type] || type || 'any';
  };

  const buildNextEnum = ([ID, options]) => {
    output.push(`export enum ${ID} {`);
    options.forEach(option => {
      if (typeof option === 'number') {
        const lastWord = ID.search(/[A-Z](?=[^A-Z]*$)/);
        const name = ID.substr(lastWord, ID.length);
        output.push(`${name}${option} = ${option},`);
      } else {
        const name = capitalize(camelCase(option));
        output.push(`${name} = ${JSON.stringify(option)},`);
      }
    });
    output.push('}');
  };

  const buildNextInterface = () => {
    const [ID, { properties, required }] = queue.pop();

    // We can skip making an interface if it’s a primitive or array of something else
    if (typeof properties !== 'object') {
      return;
    }

    // Open interface
    output.push(`export interface ${camelCase(ID)} {`);

    // Populate interface
    Object.entries(properties).forEach(([key, value]) => {
      const optional = !Array.isArray(required) || required.indexOf(key) === -1;
      const name = `${camelCase(key)}${optional ? '?' : ''}`;
      const type = getType(value);

      if (typeof value.description === 'string') {
        // Print out descriptions as comments, but only if there’s something there (.*)
        output.push(
          `// ${value.description.replace(/\n$/, '').replace(/\n/g, '\n// ')}`
        );
      }

      // If this is a nested object, let’s add it to the stack for later
      if (type === 'object') {
        const newID = camelCase(`${ID}_${key}`);
        queue.push([newID, value]);
        output.push(`${name}: ${newID};`);
        return;
      } else if (Array.isArray(value.enum)) {
        const newID = camelCase(`${ID}_${key}`);
        enumQueue.push([newID, value.enum]);
        output.push(`${name}: ${newID};`);
        return;
      }

      output.push(`${name}: ${type};`);
    });

    // Close interface
    output.push(`}`);

    // Clean up enumQueue
    while (enumQueue.length > 0) {
      buildNextEnum(enumQueue.pop());
    }
  };

  // Begin parsing top-level entries
  Object.entries(definitions).forEach(entry => queue.push(entry));
  queue.sort((a, b) => a[0].localeCompare(b[0]));
  while (queue.length > 0) {
    buildNextInterface();
  }

  output.push('}'); // Close namespace
  return output.join('\n');
};

module.exports = (filename, namespace) => {
  return format(buildTypes(filename, namespace), {
    parser: 'typescript',
    printWidth: 100,
    singleQuote: true,
    trailingComma: 'es5',
  });
};
