import swagger2, { Swagger2 } from './swagger-2';

export default (spec: Swagger2, options?: { namespace?: string; version?: number }) => {
  const version = (options && options.version) || 2;
  const namespace = (options && options.namespace) || `OpenAPI${version}`;

  if (version === 1 || version === 3) {
    console.error('That version is not supported');
    return;
  }

  return swagger2(spec, namespace);
};
