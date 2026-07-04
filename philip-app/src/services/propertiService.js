// philip-app/src/services/propertiService.js — VERSI LENGKAP
import api from "./api";

export const propertiService = {
    getAll: (params = {}) => api.get("/properti", { params }).then(r => r.data),
    getById: (id) => api.get(`/properti/${id}`).then(r => r.data),
    getShareText: (id) => api.get(`/properti/${id}/share`).then(r => r.data),
    getVendors: () => api.get("/properti/vendors").then(r => r.data),
    getMarketings: () => api.get("/properti/marketing").then(r => r.data),
    createVendor: (data) => api.post("/properti/vendors", data).then(r => r.data),

    create(data, fotoFiles = []) {
        const form = new FormData();
        Object.entries(data).forEach(([k, v]) => {
            if (v !== null && v !== undefined) form.append(k, v);
        });
        fotoFiles.forEach(f => form.append("fotos", f));
        return api.post("/properti", form, {
            headers: { "Content-Type": "multipart/form-data" }
        }).then(r => r.data);
    },

    update: (id, data) => api.put(`/properti/${id}`, data).then(r => r.data),
    remove: (id) => api.delete(`/properti/${id}`).then(r => r.data),

    // Transaksi
    createTransaksi: (id, data) => api.post(`/properti/${id}/transaksi`, data).then(r => r.data),
    getTransaksi: (id) => api.get(`/properti/${id}/transaksi`).then(r => r.data),

    // Foto
    reorderFotos: (id, orders) =>
        api.put(`/properti/${id}/fotos/reorder`, { orders }).then(r => r.data),
    deleteFoto: (propertiId, fotoId) =>
        api.delete(`/properti/${propertiId}/fotos/${fotoId}`).then(r => r.data),
};
