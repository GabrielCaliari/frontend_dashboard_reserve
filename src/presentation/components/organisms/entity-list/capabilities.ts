import type { EntityListCapabilities } from "./types";

export function assertEntityListCapabilities(
  capabilities: EntityListCapabilities,
) {
  const usesLocalOperations =
    capabilities.search === "local" ||
    capabilities.sort === "local" ||
    capabilities.pagination === "local";

  if (
    usesLocalOperations &&
    (!Number.isInteger(capabilities.localItemLimit) ||
      capabilities.localItemLimit === undefined ||
      capabilities.localItemLimit < 1)
  ) {
    throw new Error("Local entity-list operations require localItemLimit");
  }
}
