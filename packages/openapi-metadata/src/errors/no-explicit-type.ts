export class NoExplicitTypeError extends Error {
  constructor(
    typeName: string,
    propertyKey: string,
    parameterIndex?: number,
    argName?: string,
  ) {
    let errorMessage =
      "Unable to infer OpenAPI type from TypeScript reflection system. " +
      "You need to provide explicit type for ";
    if (argName) {
      errorMessage += `argument named '${argName}' of `;
    } else if (parameterIndex !== undefined) {
      errorMessage += `parameter #${parameterIndex} of `;
    }
    errorMessage += `'${propertyKey}' of '${typeName}' class.`;
    super(errorMessage);

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
