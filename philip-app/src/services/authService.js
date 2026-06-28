// philip-app/src/services/authService.js
import api from "./api";

export const authService = {
    login: (data) => api.post("/auth/login", data).then(r => r.data),
    logout: () => api.post("/auth/logout").then(r => r.data),
    me: () => api.get("/auth/me").then(r => r.data),
};
