import { swaggerVersion } from './utils/index';
import { OpenAPI2, OpenAPI3 } from './types/index';
import v2 from './v2/index';

// export all types
export * from './types/index';

export default function generateTypes(schema: OpenAPI2 | OpenAPI3) {
  const version = swaggerVersion(schema);

  switch (version) {
    case 2:
      return v2(schema as OpenAPI2);
  }

  return undefined;
}
