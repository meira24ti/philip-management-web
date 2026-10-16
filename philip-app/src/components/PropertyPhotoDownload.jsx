import { useState } from "react";
import { zipSync } from "fflate";
import { propertiService } from "../services/propertiService";
import { getImageUrl } from "../utils/imageUrl";
import { downloadFlyer } from "../utils/generateFlyer";
import { useToast } from "./ToastContext";

export default function PropertyPhotoDownload({ photos, propertyId }) {
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();
  const chosen = photos.filter(photo => selected.includes(photo.id_fotoproperti));
  const download = async () => {
    setBusy(true);
    try {
      const files = [];
      // Two at a time bounds decoding work on the API and download bursts on mobile.
      for (let offset = 0; offset < chosen.length; offset += 2) {
        files.push(...await Promise.all(chosen.slice(offset, offset + 2).map(async photo => ({
          name: `foto-${photos.indexOf(photo) + 1}.jpg`,
          blob: await propertiService.downloadFoto(propertyId, photo.id_fotoproperti),
        }))));
      }
      if (files.length === 1) downloadFlyer(files[0].blob, files[0].name);
      else {
        const entries = await Promise.all(files.map(async file => [file.name, new Uint8Array(await file.blob.arrayBuffer())]));
        downloadFlyer(new Blob([zipSync(Object.fromEntries(entries), { level: 0 })], { type: "application/zip" }), `foto-properti-${propertyId}.zip`);
      }
      showToast(`${files.length} foto berhasil diunduh`);
    } catch { showToast("Gagal mengunduh foto. Silakan coba lagi.", "error"); }
    finally { setBusy(false); }
  };
  return <section className="rounded-2xl border border-red-100 bg-white p-4 space-y-3" aria-label="Download foto properti">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-sm font-bold text-red-900">Download foto properti</h2>
      <button type="button" disabled={busy} className="btn btn-xs btn-ghost text-red-700"
        onClick={() => setSelected(chosen.length === photos.length ? [] : photos.map(photo => photo.id_fotoproperti))}>
        {chosen.length === photos.length ? "Batalkan pilihan" : "Pilih semua"}
      </button>
    </div>
    <div className="flex flex-wrap gap-3">{photos.map((photo, index) => <label key={photo.id_fotoproperti} className="w-20 cursor-pointer space-y-1">
      <img src={getImageUrl(photo.url_foto)} alt={`Foto properti ${index + 1}`} className="aspect-square w-full rounded-lg object-cover" />
      <span className="flex items-center gap-1 text-xs">
        <input type="checkbox" className="checkbox checkbox-xs checkbox-error" disabled={busy} checked={selected.includes(photo.id_fotoproperti)}
          onChange={event => setSelected(ids => event.target.checked ? [...ids, photo.id_fotoproperti] : ids.filter(id => id !== photo.id_fotoproperti))} />
        Foto {index + 1}
      </span>
    </label>)}</div>
    <p className="text-xs text-gray-500">Foto diunduh dengan watermark perusahaan. Beberapa foto digabung dalam file ZIP.</p>
    <button type="button" className="btn btn-sm bg-red-700 text-white" disabled={busy || !chosen.length} onClick={download}>
      {busy ? "Menyiapkan foto…" : `Download ${chosen.length ? `${chosen.length} foto terpilih` : "foto terpilih"}`}
    </button>
  </section>;
}
