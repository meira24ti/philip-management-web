// src/utils/imageUrl.js
import { API_BASE_URL } from "./apiBaseUrl";
const BACKEND_URL = API_BASE_URL.replace(/\/api$/, "");
 
export function getImageUrl(path) {
  if (!path) return null;
  if (/^(https?:|blob:|data:)/.test(path)) return path;
  return BACKEND_URL + (path.startsWith("/") ? path : `/${path}`);
}
