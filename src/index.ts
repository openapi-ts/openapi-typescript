import swagger2, { Swagger2, Swagger2Options } from './swagger-2';

export interface Options extends Swagger2Options {
  swagger?: number;
}

export default function(spec: Swagger2, options?: Options) {
  const swagger = (options && options.swagger) || 2;

  if (swagger !== 2) {
    throw new Error(`Swagger version ${swagger} is not supported`);
  }

  return swagger2(spec, options);
}
