const ABSOLUTE_URL = /^(?:[a-z][a-z\d+.-]*:)?\/\//i;

export function normalizeApiRequestUrl(
  baseURL: string | undefined,
  requestUrl: string | undefined,
): string | undefined {
  if (!baseURL || !requestUrl || ABSOLUTE_URL.test(requestUrl)) return requestUrl;

  const basePath = new URL(baseURL, "http://local.invalid").pathname.replace(/\/+$/, "");
  if (!basePath.endsWith("/api")) return requestUrl;

  return requestUrl.replace(/^\/api(?=[/?#]|$)/, "") || "/";
}
