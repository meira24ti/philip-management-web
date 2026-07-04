// philip-app/src/services/staffService.js
import api from "./api";

export const staffService = {
    getAll: (params = {}) => api.get("/staff", { params }).then(r => r.data),
    create: (data) => api.post("/staff", data).then(r => r.data),
    update: (id, data) => api.put(`/staff/${id}`, data).then(r => r.data), // ← TAMBAHKAN
    deactivate: (id) => api.patch(`/staff/${id}/deactivate`).then(r => r.data),
};

