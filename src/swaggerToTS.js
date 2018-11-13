const { format } = require('prettier'); // eslint-disable-line import/no-extraneous-dependencies

const DEFAULT_OPTIONS = {
  enum: false,
};

// Primitives only!
const TYPES = {
  string: 'string',
  integer: 'number',
  number: 'number',
};

const capitalize = str => `${str[0].toUpperCase()}${str.slice(1)}`;

const camelCase = name =>
  name.replace(/(-|_|\.|\s)+[a-z]/g, letter => letter.toUpperCase().replace(/[^0-9a-z]/gi, ''));

const buildTypes = (spec, options) => {
  const { definitions } = spec;

  const queue = [];
  const enumQueue = [];
  const output = [];

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
    output.push(`enum ${ID} {`);
    options.forEach(option => {
      const name = typeof option === 'string' ? capitalize(camelCase(option)) : option;
      output.push(`${name}: ${option};`);
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
    output.push(`interface ${camelCase(ID)} {`);

    // Populate interface
    Object.entries(properties).forEach(([key, value]) => {
      const optional = !Array.isArray(required) || required.indexOf(key) === -1;
      const name = `${camelCase(key)}${optional ? '?' : ''}`;
      const type = getType(value);

      // If this is a nested object, let’s add it to the stack for later
      if (type === 'object') {
        const newID = camelCase(`${ID}_${key}`);
        queue.push([newID, value]);
        output.push(`${name}: ${newID};`);
        return;
      } else if (options.enum === true && Array.isArray(value.enum)) {
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

  // console.log(output.join('\n'));

  return output.join('\n');
};

module.exports = (input, userOptions = {}) => {
  const options = { ...DEFAULT_OPTIONS, ...userOptions };

  return format(buildTypes(input, options), {
    parser: 'typescript',
    printWidth: 100,
    singleQuote: true,
    trailingComma: 'es5',
  });
};
