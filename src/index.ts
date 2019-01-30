import swagger2, { Swagger2 } from './swagger-2';

export default function(
  spec: Swagger2,
  options?: { output?: string; namespace?: string; swagger?: number }
) {
  const swagger = (options && options.swagger) || 2;
  const namespace = (options && options.namespace) || `OpenAPI${swagger}`;

  if (swagger !== 2) {
    throw new Error(`Swagger version ${swagger} is not supported`);
  }

  return swagger2(spec, namespace);
}
