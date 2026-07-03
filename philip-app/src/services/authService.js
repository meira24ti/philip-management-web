// philip-app/src/services/authService.js
import api from "./api";

export const authService = {
    login: (data) => api.post("/auth/login", data).then(r => r.data),
    logout: () => api.post("/auth/logout").then(r => r.data),
    me: () => api.get("/auth/me").then(r => r.data),
    updateProfile: (data) => api.put("/auth/profile", data).then(r => r.data),
    changePassword: (data) => api.put("/auth/password", data).then(r => r.data),
    uploadFoto: (file) => {
        const form = new FormData();
        form.append("foto", file);
        return api.post("/auth/upload-foto", form, {
            headers: { "Content-Type": "multipart/form-data" }
        }).then(r => r.data);
    },

};
