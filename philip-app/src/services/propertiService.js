// philip-app/src/services/propertiService.js — VERSI LENGKAP
import api from "./api";

const buildPropertyFormData = (data, fotoFiles = [], { replaceFotos = false } = {}) => {
    const form = new FormData();
    Object.entries(data || {}).forEach(([key, value]) => {
        // Only form fields belong in multipart data. Detail responses also
        // contain nested arrays (such as foto_properti) that are not fields.
        if (value === undefined || typeof value === "object") return;
        form.append(key, value === null ? "" : String(value));
    });
    Array.from(fotoFiles || []).forEach((file) => form.append("fotos", file));
    if (replaceFotos) form.append("replace_fotos", "1");
    return form;
};

export const propertiService = {
    getAll: (params = {}) => api.get("/properti", { params }).then(r => r.data),
    getById: (id) => api.get(`/properti/${id}`).then(r => r.data),
    getShareText: (id) => api.get(`/properti/${id}/share`).then(r => r.data),
    getVendors: () => api.get("/properti/vendors").then(r => r.data),
    getMarketings: () => api.get("/properti/marketing").then(r => r.data),
    createVendor: (data) => api.post("/properti/vendors", data).then(r => r.data),

    create(data, fotoFiles = []) {
        return api.post("/properti", buildPropertyFormData(data, fotoFiles)).then(r => r.data);
    },

    update(id, data, fotoFiles = [], options = {}) {
        const files = Array.from(fotoFiles || []);
        if (files.length === 0 && !options.replaceFotos) {
            return api.put(`/properti/${id}`, data).then(r => r.data);
        }
        return api.put(
            `/properti/${id}`,
            buildPropertyFormData(data, files, options)
        ).then(r => r.data);
    },
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
