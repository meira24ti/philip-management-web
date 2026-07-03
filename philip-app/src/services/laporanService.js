// philip-app/src/services/laporanService.js (BARU)
import api from "./api";
export const laporanService = {
    getAll: () => api.get("/laporan").then(r => r.data),
    generate: (data) => api.post("/laporan/generate", data).then(r => r.data),
    download: (id) => api.get(`/laporan/${id}/download`).then(r => r.data),
};
