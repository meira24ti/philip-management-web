// philip-app/src/services/api.js
// Semua call ke backend Express.js
import axios from "axios";
 
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});
 
// Otomatis sisipkan token JWT ke setiap request
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (user.token) config.headers.Authorization = `Bearer ${user.token}`;
  return config;
});
 
// Redirect ke login jika token expired (401)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
 
export default api;
