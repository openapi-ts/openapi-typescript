export class SymbolKeysNotSupportedError extends Error {
  constructor() {
    super("Symbol keys are not supported yet!");
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
