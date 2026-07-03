// philip-app/src/services/settingService.js (BARU)
import api from "./api";

export const settingService = {
    getAll: () => api.get("/setting").then(r => r.data),
    update: (data) => api.put("/setting", data).then(r => r.data),
    uploadLogo: (file) => {
        const form = new FormData();
        form.append("logo", file);
        return api.post("/setting/logo", form, {
            headers: { "Content-Type": "multipart/form-data" }
        }).then(r => r.data);
    },
};
