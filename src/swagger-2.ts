import * as prettier from 'prettier';

export interface Swagger2Definition {
  $ref?: string;
  allOf?: Swagger2Definition[];
  description?: string;
  enum?: string[];
  format?: string;
  items?: Swagger2Definition;
  oneOf?: Swagger2Definition[];
  properties?: { [index: string]: Swagger2Definition };
  additionalProperties?: boolean | Swagger2Definition;
  required?: string[];
  type?: 'array' | 'boolean' | 'integer' | 'number' | 'object' | 'string';
}

export interface Swagger2 {
  definitions: {
    [index: string]: Swagger2Definition;
  };
}

// Primitives only!
const TYPES: { [index: string]: string } = {
  string: 'string',
  integer: 'number',
  number: 'number',
};

function capitalize(str: string) {
  return `${str[0].toUpperCase()}${str.slice(1)}`;
}

function camelCase(name: string) {
  return name.replace(/(-|_|\.|\s)+\w/g, letter => letter.toUpperCase().replace(/[^0-9a-z]/gi, ''));
}

function parse(spec: Swagger2, namespace: string) {
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

    const DEFAULT_TYPE = 'any';

    if ($ref) {
      const [refName, refProperties] = getRef($ref);
      // If a shallow array interface, return that instead
      if (refProperties.items && refProperties.items.$ref) {
        return getType(refProperties, refName);
      }
      if (refProperties.type && TYPES[refProperties.type]) {
        return TYPES[refProperties.type];
      }
      return refName || DEFAULT_TYPE;
    }

    if (items && items.$ref) {
      const [refName] = getRef(items.$ref);
      return `${getType(items, refName)}[]`;
    }
    if (items && items.type) {
      if (TYPES[items.type]) {
        return `${TYPES[items.type]}[]`;
      } else {
        queue.push([nestedName, items]);
        return `${nestedName}[]`;
      }
    }

    if (Array.isArray(value.oneOf)) {
      return value.oneOf.map(def => getType(def, '')).join(' | ');
    }

    if (value.properties) {
      // If this is a nested object, let’s add it to the stack for later
      queue.push([nestedName, { $ref, items, type, ...value }]);
      return nestedName;
    }

    if (type) {
      return TYPES[type] || type || DEFAULT_TYPE;
    }

    return DEFAULT_TYPE;
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
    const [ID, { allOf, properties, required, additionalProperties, type }] = nextObject;

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
    if (
      !Object.keys(allProperties).length &&
      additionalProperties !== true &&
      type &&
      TYPES[type]
    ) {
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

    if (additionalProperties) {
      if (<boolean>additionalProperties === true) {
        output.push(`[name: string]: ${ID}`);
      }

      if ((<Swagger2Definition>additionalProperties).type) {
        const type = getType(<Swagger2Definition>additionalProperties, '');
        output.push(`[name: string]: ${type}`);
      }
    }

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

  return prettier.format(output.join('\n'), { parser: 'typescript', singleQuote: true });
}

export default parse;
