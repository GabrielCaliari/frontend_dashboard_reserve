const developmentApiUrl =
  process.env.NEXT_PUBLIC_LOCAL_API_URL ??
  process.env.NEXT_LOCAL_API_URL ??
  "http://localhost:3002";

const apiUrl =
  process.env.NEXT_PUBLIC_RESERVE_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  developmentApiUrl;

const normalizedApiUrl = apiUrl.replace(/\/$/, "");

/** @type {import('nextjs-openapi-codegen').CodegenConfig[]} */
export default [
  {
    name: "reserve-admin-api",
    spec:
      process.env.OPENAPI_SPEC_URL ??
      `${normalizedApiUrl}/api/docs-json`,
    // The application consumes generated services directly. Route handlers are
    // generated into npm's ignored cache to avoid exposing a second API proxy.
    routesOut: "node_modules/.cache/nextjs-openapi-codegen/routes",
    servicesOut: "src/infraestructure/server/services",
    apiEnvVar: "NEXT_PUBLIC_RESERVE_API_URL",
    apiFallback: normalizedApiUrl,
    stripPathPrefix: "/api",
    apiClientPath: "@/src/infraestructure/axios/api",
    apiClient: false,
    fetchBackend: false,
  },
];
