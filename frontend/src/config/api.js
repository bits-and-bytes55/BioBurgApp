import axios from "axios";

const normalizeBaseUrl = (value) =>
  String(value || "").trim().replace(/\/+$/, "");

const API_TARGETS = {
  local: "http://127.0.0.1:8000",
  live: import.meta.env.VITE_API_BASE_URL,
};

const DEFAULT_TARGET = "local";
const requestedTarget = import.meta.env.VITE_API_TARGET || DEFAULT_TARGET;
const fallbackBaseUrl =
  API_TARGETS[requestedTarget] || API_TARGETS[DEFAULT_TARGET];

export const API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL || fallbackBaseUrl,
);
export const API_URL = `${API_BASE_URL}/api`;

const INTERNAL_ORIGINS = Array.from(
  new Set(
    [API_BASE_URL, ...Object.values(API_TARGETS)]
      .map(normalizeBaseUrl)
      .filter(Boolean),
  ),
);

const buildAbsoluteUrl = (value) =>
  value.startsWith("/") ? `${API_BASE_URL}${value}` : value;

export const resolveApiUrl = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return trimmedValue;
  }

  if (
    trimmedValue.startsWith("/api") ||
    trimmedValue.startsWith("/uploads") ||
    trimmedValue.startsWith("/socket.io")
  ) {
    return buildAbsoluteUrl(trimmedValue);
  }

  try {
    const parsedUrl = new URL(trimmedValue);
    const normalizedOrigin = normalizeBaseUrl(parsedUrl.origin);

    if (INTERNAL_ORIGINS.includes(normalizedOrigin)) {
      return `${API_BASE_URL}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
    }
  } catch {
    if (trimmedValue.startsWith("/")) {
      return buildAbsoluteUrl(trimmedValue);
    }
  }

  return trimmedValue;
};

const attachRequestInterceptor = (client) => {
  client.interceptors.request.use((config) => {
    if (config?.baseURL) {
      config.baseURL = resolveApiUrl(config.baseURL);
    }

    if (config?.url) {
      const isInstanceRelativePath =
        config.baseURL &&
        typeof config.url === "string" &&
        config.url.startsWith("/") &&
        !config.url.startsWith("/api") &&
        !config.url.startsWith("/uploads") &&
        !config.url.startsWith("/socket.io");

      if (!isInstanceRelativePath) {
        config.url = resolveApiUrl(config.url);
      }
    }

    return config;
  });
};

const patchAxios = () => {
  if (axios.__BBLS_API_PATCHED__) {
    return;
  }

  attachRequestInterceptor(axios);

  const originalCreate = axios.create.bind(axios);
  axios.create = (config = {}) => {
    const nextConfig = { ...config };

    if (nextConfig.baseURL) {
      nextConfig.baseURL = resolveApiUrl(nextConfig.baseURL);
    }

    const instance = originalCreate(nextConfig);
    attachRequestInterceptor(instance);
    return instance;
  };

  axios.__BBLS_API_PATCHED__ = true;
};

const patchFetch = () => {
  if (!globalThis.fetch || globalThis.__BBLS_FETCH_PATCHED__) {
    return;
  }

  const nativeFetch = globalThis.fetch.bind(globalThis);

  globalThis.fetch = (input, init) => {
    if (typeof input === "string") {
      return nativeFetch(resolveApiUrl(input), init);
    }

    if (typeof Request !== "undefined" && input instanceof Request) {
      const normalizedUrl = resolveApiUrl(input.url);
      if (normalizedUrl !== input.url) {
        input = new Request(normalizedUrl, input);
      }
    }

    return nativeFetch(input, init);
  };

  globalThis.__BBLS_FETCH_PATCHED__ = true;
};

if (typeof window !== "undefined") {
  patchAxios();
  patchFetch();
  window.__BBLS_API_BASE__ = API_BASE_URL;
  window.__BBLS_API_URL = API_URL;
}
