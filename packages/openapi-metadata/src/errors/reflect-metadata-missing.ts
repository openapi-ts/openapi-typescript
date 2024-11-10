export class ReflectMetadataMissingError extends Error {
  constructor() {
    super(
      "Looks like you've forgot to provide experimental metadata API polyfill. " +
        "Please read the installation instruction for more details.",
    );
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
