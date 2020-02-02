import swagger2, { Swagger2, Swagger2Options } from './swagger-2';
//re-export these from top-level as users may need thrm to create a propert5ymapper
export { Swagger2Definition, Property } from './swagger-2';

export interface Options extends Swagger2Options {
  swagger?: number;
}

export default function(spec: Swagger2, options?: Options): string {
  const swagger = (options && options.swagger) || 2;

  if (swagger !== 2) {
    throw new Error(`Swagger version ${swagger} is not supported`);
  }

  return swagger2(spec, options);
}
