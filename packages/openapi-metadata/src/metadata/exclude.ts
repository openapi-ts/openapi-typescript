import { createMetadataStorage } from "./factory";

export const ExcludeMetadataKey = Symbol("Exclude");

export const ExcludeMetadataStorage = createMetadataStorage<boolean>(ExcludeMetadataKey, false);
