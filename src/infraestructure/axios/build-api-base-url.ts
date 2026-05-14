const trimTrailingSlashes = (value: string): string =>
  value.replace(/\/+$/, "");

const trimLeadingAndTrailingSlashes = (value: string): string =>
  value.replace(/^\/+|\/+$/g, "");

const removeApiSuffix = (value: string): string =>
  value.replace(/\/api\/?$/i, "");

export const buildApiBaseUrl = (
  rawBaseUrl: string | undefined,
  path: string = "api",
): string => {
  const normalizedPath = trimLeadingAndTrailingSlashes(path);
  const normalizedBaseUrl = removeApiSuffix(
    trimTrailingSlashes(rawBaseUrl ?? ""),
  );

  if (!normalizedBaseUrl) {
    return `/${normalizedPath}`;
  }

  return `${normalizedBaseUrl}/${normalizedPath}`;
};
