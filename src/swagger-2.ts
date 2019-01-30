import * as prettier from 'prettier';

export interface Swagger2Definition {
  $ref?: string;
  allOf?: Swagger2Definition[];
  enum?: string[];
  description?: string;
  items?: Swagger2Definition;
  properties?: { [key: string]: Swagger2Definition };
  required?: boolean;
  type: 'array' | 'boolean' | 'integer' | 'number' | 'object' | 'string';
}

export interface Swagger2 {
  definitions: {
    [id: string]: Swagger2Definition;
  };
}

// Primitives only!
const TYPES: { [index: string]: string } = {
  string: 'string',
  integer: 'number',
  number: 'number',
};

const capitalize = (str: string) => `${str[0].toUpperCase()}${str.slice(1)}`;

const camelCase = (name: string) =>
  name.replace(/(-|_|\.|\s)+[a-z]/g, letter => letter.toUpperCase().replace(/[^0-9a-z]/gi, ''));

const buildTypes = (spec: Swagger2, namespace: string) => {
  const queue: [string, Swagger2Definition][] = [];
  const enumQueue: [string, (string | number)[]][] = [];
  const output: string[] = [`namespace ${namespace} {`];

  const { definitions } = spec;

  function getRef(lookup: string): [string, Swagger2Definition] {
    const ID = lookup.replace('#/definitions/', '');
    const ref = definitions[ID];
    return [ID, ref];
  }

  // Returns primitive type, or 'object' or 'any'
  function getType(definition: Swagger2Definition, nestedName: string): string {
    const { $ref, items, type, ...value } = definition;

    if ($ref) {
      const [refName, refProperties] = getRef($ref);
      // If a shallow array interface, return that instead
      if (refProperties.items && refProperties.items.$ref) {
        return getType(refProperties, refName);
      }
      return TYPES[refProperties.type] || refName || 'any';
    }

    if (type === 'array' && items) {
      if (items.$ref) {
        const [refName, refProperties] = getRef(items.$ref);
        return `${TYPES[refProperties.type] || refName || 'any'}[]`;
      }
      return `${TYPES[items.type] || 'any'}[]`;
    }

    if (value.properties) {
      // If this is a nested object, let’s add it to the stack for later
      queue.push([nestedName, { $ref, items, type, ...value }]);
      return nestedName;
    }

    return TYPES[type] || type || 'any';
  }

  function buildNextEnum([ID, options]: [string, (string | number)[]]) {
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
  }

  function buildNextInterface() {
    const nextObject = queue.pop();
    if (!nextObject) return; // Geez TypeScript it’s going to be OK
    const [ID, { allOf, properties, required }] = nextObject;

    let allProperties = properties || {};
    const includes: string[] = [];

    // Include allOf, if specified
    if (Array.isArray(allOf)) {
      allOf.forEach(item => {
        // Add “implements“ if this references other items
        if (item.$ref) {
          const [refName] = getRef(item.$ref);
          includes.push(refName);
        } else if (item.properties) {
          allProperties = { ...allProperties, ...item.properties };
        }
      });
    }

    // If nothing’s here, let’s skip this one.
    if (!Object.keys(allProperties).length) {
      return;
    }
    // Open interface
    const isExtending = includes.length ? ` extends ${includes.join(', ')}` : '';

    output.push(`export interface ${camelCase(ID)}${isExtending} {`);

    // Populate interface
    Object.entries(allProperties).forEach(([key, value]) => {
      const optional = !Array.isArray(required) || required.indexOf(key) === -1;
      const name = `${camelCase(key)}${optional ? '?' : ''}`;
      const newID = camelCase(`${ID}_${key}`);
      const type = getType(value, newID);

      if (typeof value.description === 'string') {
        // Print out descriptions as comments, but only if there’s something there (.*)
        output.push(`// ${value.description.replace(/\n$/, '').replace(/\n/g, '\n// ')}`);
      }

      // Save enums for later
      if (Array.isArray(value.enum)) {
        enumQueue.push([newID, value.enum]);
        output.push(`${name}: ${newID};`);
        return;
      }

      output.push(`${name}: ${type};`);
    });

    // Close interface
    output.push('}');

    // Clean up enumQueue
    while (enumQueue.length > 0) {
      const nextEnum = enumQueue.pop();
      if (nextEnum) buildNextEnum(nextEnum);
    }
  }

  // Begin parsing top-level entries
  Object.entries(definitions).forEach(entry => queue.push(entry));
  queue.sort((a, b) => a[0].localeCompare(b[0]));
  while (queue.length > 0) {
    buildNextInterface();
  }

  output.push('}'); // Close namespace

  return prettier.format(output.join('\n'), {
    parser: 'typescript',
    printWidth: 100,
    singleQuote: true,
    trailingComma: 'es5',
  });
};

export default buildTypes;
