// philip-app/src/utils/generateFlyer.js
import html2canvas from "html2canvas";

export async function generateFlyerPNG(properti) {
    try {
        const el = document.createElement("div");
        el.style.cssText = [
            "width:420px",
            "background:#1a0000",
            "border-radius:16px",
            "overflow:hidden",
            "font-family:Arial,sans-serif",
            "position:fixed",
            "left:-9999px",
            "top:0",
        ].join(";");

        const cover = properti.foto_properti?.find(f => f.is_cover)?.url_foto
            || "https://placehold.co/420x200/7A0000/white?text=Properti";

        const hargaJual = properti.harga_jual
            ? "Rp " + Number(properti.harga_jual).toLocaleString("id-ID")
            : null;
        const hargaSewa = properti.harga_sewa
            ? "Rp " + Number(properti.harga_sewa).toLocaleString("id-ID") + "/thn"
            : null;

        el.innerHTML = `
        <div style="background:linear-gradient(135deg,#7A0000,#3D0000);padding:14px 20px;
                    display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="color:#fff;font-size:13px;font-weight:700;letter-spacing:.5px">
              PHILIP REAL ESTATE</div>
            <div style="color:#ffaaaa;font-size:10px">PEKANBARU · RIAU</div>
          </div>
          <div style="background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);
                      border-radius:20px;padding:4px 12px">
            <span style="color:#fff;font-size:11px;font-weight:600">
              ${(properti.jenis_penawaran || "DIJUAL").toUpperCase()}</span>
          </div>
        </div>
        <img src="${cover}" 
             style="width:100%;height:200px;object-fit:cover"
             crossorigin="anonymous"
             onerror="this.src='https://placehold.co/420x200/7A0000/white?text=Image+Not+Found'" />
        <div style="padding:14px 18px">
          <div style="background:rgba(122,0,0,.4);border-radius:10px;
                      padding:10px 14px;margin-bottom:12px">
            <div style="color:rgba(255,255,255,.5);font-size:10px">HARGA</div>
            <div style="color:#fff;font-size:18px;font-weight:700">
              ${hargaJual || hargaSewa || "-"}</div>
            ${hargaJual && hargaSewa
                ? `<div style="color:#aad4ff;font-size:11px;margin-top:2px">
                   Sewa: ${hargaSewa}</div>` : ""}
          </div>
          <div style="color:#fff;font-size:12px;font-weight:600;margin-bottom:4px">
            ${properti.kategori || ""} ${properti.subkategori || ""}</div>
          <div style="color:rgba(255,255,255,.6);font-size:11px;margin-bottom:10px">
            📍 ${properti.nama_jalan}, ${properti.kota}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
            ${properti.luas_tanah ? `<span style="background:rgba(255,255,255,.08);color:rgba(255,255,255,.7);font-size:10px;padding:3px 8px;border-radius:10px">LT ${properti.luas_tanah}m²</span>` : ""}
            ${properti.luas_bangunan ? `<span style="background:rgba(255,255,255,.08);color:rgba(255,255,255,.7);font-size:10px;padding:3px 8px;border-radius:10px">LB ${properti.luas_bangunan}m²</span>` : ""}
            ${properti.kamar_tidur ? `<span style="background:rgba(255,255,255,.08);color:rgba(255,255,255,.7);font-size:10px;padding:3px 8px;border-radius:10px">🛏 ${properti.kamar_tidur}</span>` : ""}
            ${properti.kamar_mandi ? `<span style="background:rgba(255,255,255,.08);color:rgba(255,255,255,.7);font-size:10px;padding:3px 8px;border-radius:10px">🚿 ${properti.kamar_mandi}</span>` : ""}
            ${properti.sertifikat ? `<span style="background:rgba(255,255,255,.08);color:rgba(255,255,255,.7);font-size:10px;padding:3px 8px;border-radius:10px">${properti.sertifikat}</span>` : ""}
          </div>
          <div style="border-top:1px solid rgba(255,255,255,.1);padding-top:10px;
                      display:flex;justify-content:space-between;align-items:center">
            <div style="color:rgba(255,255,255,.4);font-size:10px">
              Marketing: ${properti.listed_by_nama || "-"}</div>
            <div style="color:#ffaaaa;font-size:10px">No. ${properti.no_folder || "-"}</div>
          </div>
        </div>`;

        document.body.appendChild(el);
        const canvas = await html2canvas(el, {
            scale: 2,
            backgroundColor: "#1a0000",
            useCORS: true,
            logging: false,
        });
        document.body.removeChild(el);

        return new Promise((resolve) =>
            canvas.toBlob((blob) => resolve(blob), "image/png", 1.0)
        );
    } catch (error) {
        console.error("Gagal generate flyer:", error);
        throw error;
    }
}

export function downloadFlyer(blob, nama = "flyer-properti.png") {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nama;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}