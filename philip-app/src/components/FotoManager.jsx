// Komponen FotoManager untuk PropertyDetail.jsx
// Memungkinkan Admin menggeser urutan foto + hapus foto + set cover

import { useState } from "react";
import { propertiService } from "../services/propertiService";
import { useToast } from "../components/ToastContext";
import { getImageUrl } from "../utils/imageUrl";

export function FotoManager({ fotos: initialFotos, propertiId, onUpdate }) {
    const { showToast } = useToast();
    const [fotos, setFotos] = useState(initialFotos || []);
    const [saving, setSaving] = useState(false);
    const [dragIdx, setDragIdx] = useState(null);

    const handleDragStart = (i) => setDragIdx(i);
    const handleDragOver = (e) => e.preventDefault();

    const handleDrop = (targetIdx) => {
        if (dragIdx === null || dragIdx === targetIdx) return;
        const updated = [...fotos];
        const [moved] = updated.splice(dragIdx, 1);
        updated.splice(targetIdx, 0, moved);
        // Update urutan
        const reordered = updated.map((f, i) => ({ ...f, urutan: i + 1, is_cover: i === 0 }));
        setFotos(reordered);
        setDragIdx(null);
    };

    const handleSetCover = (idx) => {
        setFotos(fotos.map((f, i) => ({ ...f, is_cover: i === idx })));
    };

    const handleDeleteFoto = async (fotoId) => {
        try {
            await propertiService.deleteFoto(propertiId, fotoId);
            setFotos(fotos.filter(f => f.id_fotoproperti !== fotoId));
            showToast("Foto berhasil dihapus");
        } catch {
            showToast("Gagal menghapus foto", "error");
        }
    };

    const handleSaveOrder = async () => {
        try {
            setSaving(true);
            const orders = fotos.map((f, i) => ({
                id_fotoproperti: f.id_fotoproperti,
                urutan: i + 1,
                is_cover: i === 0,
            }));
            await propertiService.reorderFotos(propertiId, orders);
            showToast("Urutan foto berhasil disimpan");
            onUpdate?.();
        } catch {
            showToast("Gagal menyimpan urutan foto", "error");
        } finally { setSaving(false); }
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                <p className="text-sm font-bold text-red-900">
                    Atur Urutan Foto (drag untuk menggeser)
                </p>
                <button onClick={handleSaveOrder} disabled={saving}
                    className="btn btn-xs btn-error text-white rounded-lg gap-1">
                    {saving ? <span className="loading loading-spinner loading-xs" /> : "💾"} Simpan Urutan
                </button>
            </div>
            <div className="flex gap-2 flex-wrap">
                {fotos.map((f, i) => (
                    <div key={f.id_fotoproperti}
                        draggable
                        onDragStart={() => handleDragStart(i)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(i)}
                        className="relative w-20 h-16 rounded-lg overflow-hidden border-2 border-transparent
                       hover:border-red-400 cursor-grab active:cursor-grabbing transition-all">
                        <img src={getImageUrl(f.url_foto)} alt="" className="w-full h-full object-cover"
                            onError={e => e.target.src = "https://placehold.co/80x60/7A0000/white?text=."} />
                        {/* Cover badge */}
                        {f.is_cover && (
                            <span className="absolute top-0.5 left-0.5 text-[9px] bg-red-600 text-white px-1 rounded">
                                Cover
                            </span>
                        )}
                        {/* Urutan */}
                        <span className="absolute bottom-0.5 left-0.5 text-[9px] bg-black/50 text-white px-1 rounded">
                            {i + 1}
                        </span>
                        {/* Actions */}
                        <div className="absolute top-0.5 right-0.5 flex flex-col gap-0.5">
                            {!f.is_cover && (
                                <button onClick={() => handleSetCover(i)}
                                    className="w-5 h-5 bg-yellow-500 text-white rounded text-[9px] flex items-center justify-center"
                                    title="Set sebagai cover">★</button>
                            )}
                            <button onClick={() => handleDeleteFoto(f.id_fotoproperti)}
                                className="w-5 h-5 bg-red-600 text-white rounded text-[9px] flex items-center justify-center"
                                title="Hapus foto">×</button>
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-xs text-gray-400">
                Foto pertama (urutan 1) otomatis menjadi cover. Drag untuk mengubah urutan.
            </p>
        </div>
    );
}
