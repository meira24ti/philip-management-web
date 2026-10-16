export function normalizeApiBaseUrl(value) {
  const base = String(value || "").trim().replace(/\/+$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env?.VITE_API_URL || (import.meta.env?.PROD ? "/api" : "http://localhost:5000/api"));
