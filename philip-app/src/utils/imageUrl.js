// src/utils/imageUrl.js
const BACKEND_URL = import.meta.env.VITE_API_URL?.replace("/api","") || "http://localhost:5000";
 
export function getImageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;    // sudah URL lengkap
  return BACKEND_URL + path;                   // tambahkan base URL backend
}
