// philip-app/src/services/api.js
// Semua call ke backend Express.js
import axios from "axios";
import { API_BASE_URL } from "../utils/apiBaseUrl";
import { readSession, clearSession } from "../utils/sessionStorage";
 
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 20000,
});
 
// Otomatis sisipkan token JWT ke setiap request
api.interceptors.request.use((config) => {
  const user = readSession();
  if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
  return config;
});
 
// Redirect ke login jika token expired (401)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && err.config?.headers?.Authorization && !err.config?.url?.endsWith("/login")) {
      clearSession();
      window.location.replace("/login");
    }
    return Promise.reject(err);
  }
);
 
export default api;
