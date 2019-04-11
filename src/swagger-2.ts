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

export interface Swagger2Options {
  camelcase?: boolean;
  namespace?: string;
  export?: boolean;
}

// Primitives only!
const TYPES: { [index: string]: string } = {
  string: 'string',
  integer: 'number',
  number: 'number',
};

function capitalize(str: string): string {
  return `${str[0].toUpperCase()}${str.slice(1)}`;
}

function camelCase(name: string): string {
  return name.replace(/(-|_|\.|\s)+\w/g, letter => letter.toUpperCase().replace(/[^0-9a-z]/gi, ''));
}

function parse(spec: Swagger2, options: Swagger2Options = {}): string {
  const namespace = options.namespace || 'OpenAPI2';
  const shouldCamelCase = options.camelcase || false;
  const shouldExport = options.export || false;

  console.log('shouldExport', shouldExport);

  const queue: [string, Swagger2Definition][] = [];

  const output: string[] = shouldExport ? ['export '] : [];
  output.push(`namespace ${namespace} {`);

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
      }
      queue.push([nestedName, items]);
      return `${nestedName}[]`;
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

  function buildNextInterface(): void {
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

    output.push(`export interface ${shouldCamelCase ? camelCase(ID) : ID}${isExtending} {`);

    // Populate interface
    Object.entries(allProperties).forEach(([key, value]) => {
      const optional = !Array.isArray(required) || required.indexOf(key) === -1;
      const formattedKey = shouldCamelCase ? camelCase(key) : key;
      const name = `${formattedKey}${optional ? '?' : ''}`;
      const newID = `${ID}${capitalize(formattedKey)}`;
      const interfaceType = getType(value, newID);

      if (typeof value.description === 'string') {
        // Print out descriptions as comments, but only if there’s something there (.*)
        output.push(`// ${value.description.replace(/\n$/, '').replace(/\n/g, '\n// ')}`);
      }

      // Handle enums in the same definition
      if (Array.isArray(value.enum)) {
        output.push(`${name}: ${value.enum.map(option => JSON.stringify(option)).join(' | ')};`);
        return;
      }

      output.push(`${name}: ${interfaceType};`);
    });

    if (additionalProperties) {
      if ((additionalProperties as boolean) === true) {
        output.push('[name: string]: any');
      }

      if ((additionalProperties as Swagger2Definition).type) {
        const interfaceType = getType(additionalProperties as Swagger2Definition, '');
        output.push(`[name: string]: ${interfaceType}`);
      }
    }

    // Close interface
    output.push('}');
  }

  // Begin parsing top-level entries
  Object.entries(definitions).forEach(entry => {
    // Ignore top-level array definitions
    if (entry[1].type === 'object') {
      queue.push(entry);
    }
  });
  queue.sort((a, b) => a[0].localeCompare(b[0]));
  while (queue.length > 0) {
    buildNextInterface();
  }

  output.push('}'); // Close namespace

  return prettier.format(output.join('\n'), { parser: 'typescript', singleQuote: true });
}

export default parse;
