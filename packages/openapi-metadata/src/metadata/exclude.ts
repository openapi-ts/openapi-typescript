import { createMetadataStorage } from "./factory.js";

export const ExcludeMetadataKey = Symbol("Exclude");

export const ExcludeMetadataStorage = createMetadataStorage<boolean>(ExcludeMetadataKey, false);
