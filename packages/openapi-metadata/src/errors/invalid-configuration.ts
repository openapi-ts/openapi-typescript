export class InvalidConfigurationError extends Error {
  constructor(message: string) {
    super(`Invalid configuration: ${message}`);

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
