import swagger2, { Swagger2, Swagger2Options } from './swagger-2';
//re-export these from top-level as users may need thrm to create a propert5ymapper
export { Swagger2Definition, Property } from './swagger-2';

export type Options = Swagger2Options;

export default function (spec: Swagger2, options?: Swagger2Options): string {
  let version: number | undefined;

  if (spec.swagger && parseInt(spec.swagger, 10) === 2) {
    version = 2; // identify v3
  } else if (spec.openapi && parseInt(spec.openapi, 10) === 3) {
    version = 3; // identify v3
  }

  switch (version) {
    case undefined: {
      console.warn(`Could not determine Swagger version. Assuming 2.0.`);
      break;
    }
    case 2: {
      // continue
      break;
    }
    case 3: {
      console.warn(
        `Swagger version 3 is in beta. Please report any bugs you find to github.com/manifoldco/swagger-to-ts 🙏!`
      );
      break;
    }
    default: {
      throw new Error(`Swagger version ${version} is not supported`);
    }
  }

  return swagger2(spec, options);
}
