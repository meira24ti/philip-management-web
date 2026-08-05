// philip-app/src/services/statistikService.js
import api from "./api";

export const statistikService = {
    getRingkasan: (params) => api.get("/statistik", { params }).then(r => r.data),
    getByPeriode: (params) => api.get("/statistik/by-periode", { params }).then(r => r.data),
};
