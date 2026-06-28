import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  HiOutlineLocationMarker, HiArrowLeft,
  HiOutlineShare, HiOutlineDownload, HiOutlineMap,
  HiOutlineChevronLeft, HiOutlineChevronRight
} from "react-icons/hi";
import { useAuth } from "../context/AuthContext";
import { propertiService } from "../services/propertiService";
import { generateFlyerPNG, downloadFlyer } from "../utils/generateFlyer";

// Konfigurasi role (tetap di luar)
const ROLE_CONFIG = {
  admin:    { canEdit: true, canDelete: true, canShare: true, canFlyer: true },
  marketing:{ canEdit: false, canDelete: false, canShare: true, canFlyer: true },
  direktur: { canEdit: false, canDelete: false, canShare: false, canFlyer: false },
};

// Mapping status unit (untuk badge)
const unitBadge = {
  tersedia: "badge-success",
  terjual: "badge-error",
  tersewa: "badge-info",
  dalam_negosiasi: "badge-warning"
};
const unitLabel = {
  tersedia: "Tersedia",
  terjual: "Terjual",
  tersewa: "Tersewa",
  dalam_negosiasi: "Dalam Negosiasi"
};

// ─── KOMPONEN UTAMA ───
export default function PropertyDetail() {
  const { id } = useParams();
  const { role } = useAuth();
  const config = ROLE_CONFIG[role] || {};

  // State
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fotoIdx, setFotoIdx] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch data properti dari API
  useEffect(() => {
    if (!id) return;
    propertiService.getById(id)
      .then(data => {
        setProperty(data);
        setError("");
      })
      .catch(err => {
        console.error(err);
        setError("Gagal memuat data properti.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Handler share (mirip dengan Dashboard)
  const handleShare = async (id) => {
    try {
      const { shareText, waLink } = await propertiService.getShareText(id);
      await navigator.clipboard.writeText(shareText);
      window.open(waLink, "_blank");
    } catch {
      alert("Gagal menyalin info properti");
    }
  };

  // Handler download flyer
  const handleDownloadFlyer = async () => {
    try {
      const data = await propertiService.getById(id);
      const blob = await generateFlyerPNG(data);
      downloadFlyer(blob, `flyer-${data.no_folder || data.id}.png`);
    } catch (err) {
      console.error("Gagal generate flyer:", err);
    }
  };

  // Jika loading
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg text-red-800"></span>
      </div>
    );
  }

  // Jika error atau properti tidak ditemukan
  if (error || !property) {
    return (
      <div className="text-center py-16 text-red-600">
        <p className="font-semibold">{error || "Properti tidak ditemukan"}</p>
        <Link to="/property" className="mt-4 inline-block btn btn-sm btn-outline btn-error">
          Kembali ke Daftar
        </Link>
      </div>
    );
  }

  // Data properti dari API
  const p = property;

  // Siapkan daftar foto (ambil dari foto_properti)
  const fotoList = p.foto_properti || [];
  const coverFoto = fotoList.find(f => f.is_cover)?.url_foto || fotoList[0]?.url_foto || "https://placehold.co/800x400/7A0000/white?text=Foto";

  // Fungsi format harga
  const formatHarga = (harga) => {
    if (!harga) return "-";
    return "Rp " + Number(harga).toLocaleString("id-ID");
  };

  // Mapping jenis penawaran ke badge label
  const badgeMap = {
    dijual: "Dijual",
    sewa: "Sewa",
    dijual_dan_sewa: "Jual/Sewa"
  };
  const badge = badgeMap[p.jenis_penawaran] || p.jenis_penawaran;

  return (
    <div className="space-y-4">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/property" className="btn btn-sm btn-ghost rounded-xl gap-1 text-gray-500 hover:text-red-800">
            <HiArrowLeft size={15} /> Properti
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-red-900 truncate max-w-48">
            {p.nama_jalan || p.id}
          </span>
        </div>
        <div className="flex gap-2">
          {config.canShare && (
            <button
              onClick={() => handleShare(p.id)}
              className="btn btn-sm btn-outline border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl gap-1"
            >
              <HiOutlineShare size={14} /> Share
            </button>
          )}
          {config.canFlyer && (
            <button
              onClick={handleDownloadFlyer}
              className="btn btn-sm btn-outline border-red-200 text-red-700 gap-1"
            >
              Download Flyer
            </button>
          )}
          {config.canEdit && (
            <Link to={`/property/edit/${p.id}`} className="btn btn-sm btn-error text-white rounded-xl gap-1">
              Edit
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* ── Left: foto + info utama ── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Foto gallery */}
          <div className="card bg-base-100 shadow border border-red-50 overflow-hidden">
            <div className="relative h-64 md:h-80 bg-gray-100">
              <img
                src={fotoList[fotoIdx]?.url_foto || coverFoto}
                alt="foto properti"
                className="w-full h-full object-cover"
                onError={e => e.target.src = "https://placehold.co/800x400/7A0000/white?text=Foto"}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              {fotoList.length > 1 && (
                <>
                  <button
                    onClick={() => setFotoIdx(i => (i - 1 + fotoList.length) % fotoList.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 btn btn-circle btn-sm bg-white/80 border-0 hover:bg-white shadow"
                  >
                    <HiOutlineChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setFotoIdx(i => (i + 1) % fotoList.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-circle btn-sm bg-white/80 border-0 hover:bg-white shadow"
                  >
                    <HiOutlineChevronRight size={16} />
                  </button>
                </>
              )}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {fotoList.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setFotoIdx(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === fotoIdx ? "bg-white w-4" : "bg-white/50"}`}
                  />
                ))}
              </div>
              <div className="absolute top-3 left-3 flex gap-1.5">
                <span className="badge badge-sm badge-error text-white">{badge}</span>
                <span className={`badge badge-sm ${unitBadge[p.status_unit]}`}>
                  {unitLabel[p.status_unit] || p.status_unit}
                </span>
              </div>
              <div className="absolute top-3 right-3">
                <span className="text-[10px] text-white/70 font-mono bg-black/30 px-1.5 py-0.5 rounded">
                  {p.no_folder || "-"}
                </span>
              </div>
            </div>
            {/* thumbnail strip */}
            {fotoList.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {fotoList.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => setFotoIdx(i)}
                    className={`w-16 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${i === fotoIdx ? "border-red-600" : "border-transparent"}`}
                  >
                    <img
                      src={f.url_foto}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={e => e.target.src = "https://placehold.co/80x60/7A0000/white?text=."}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Spesifikasi teknis */}
          <div className="card bg-base-100 shadow border border-red-50">
            <div className="card-body p-4">
              <h3 className="font-bold text-red-900 mb-3">Spesifikasi Teknis</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Luas Tanah", value: p.luas_tanah ? `${p.luas_tanah} m²` : null },
                  { label: "Luas Bangunan", value: p.luas_bangunan ? `${p.luas_bangunan} m²` : null },
                  { label: "Kamar Tidur", value: p.kamar_tidur ? `${p.kamar_tidur} kamar` : null },
                  { label: "Kamar Mandi", value: p.kamar_mandi ? `${p.kamar_mandi} kamar` : null },
                  { label: "Carport", value: p.carport || null },
                  { label: "Daya Listrik", value: p.daya_listrik || null },
                  { label: "Sumber Air", value: p.sumber_air || null },
                  { label: "Akses Jalan", value: p.row_jalan || null },
                  { label: "Sertifikat", value: p.sertifikat || null },
                  { label: "Keamanan", value: p.keamanan || null },
                ].filter(s => s.value).map(s => (
                  <div key={s.label} className="bg-red-50 rounded-xl p-2.5">
                    <p className="text-[10px] text-red-400 font-semibold uppercase tracking-wide">{s.label}</p>
                    <p className="text-sm font-semibold text-gray-700 mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>

              {p.daftar_bonus && (
                <div className="mt-3">
                  <p className="text-xs font-bold text-gray-500 mb-1.5">Bonus & Fasilitas Unit</p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.daftar_bonus.split(",").map(b => (
                      <span key={b} className="badge badge-ghost badge-sm text-gray-600">{b.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
              {p.akses_fasilitas && (
                <div className="mt-2">
                  <p className="text-xs font-bold text-gray-500 mb-1.5">Akses Fasilitas Terdekat</p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.akses_fasilitas.split(",").map(f => (
                      <span key={f} className="badge badge-outline badge-sm text-gray-500">{f.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Keterangan */}
          {p.keterangan && (
            <div className="card bg-base-100 shadow border border-red-50">
              <div className="card-body p-4">
                <h3 className="font-bold text-red-900 mb-2">Keterangan</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{p.keterangan}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: info harga + operasional ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Harga & Identitas */}
          <div className="card bg-base-100 shadow border border-red-50">
            <div className="card-body p-4 gap-2">
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide">
                {p.kategori} {p.subkategori}
              </p>
              <h2 className="text-base font-bold text-gray-800 leading-tight">{p.nama_jalan}</h2>
              <div className="flex items-center gap-1 text-gray-400">
                <HiOutlineLocationMarker size={13} className="text-red-400" />
                <span className="text-xs">{p.area_kecamatan}, {p.kota}</span>
              </div>

              <div className="bg-red-50 rounded-xl p-3 mt-1">
                <p className="text-[10px] text-red-400 font-semibold uppercase tracking-wide">Harga Jual</p>
                <p className="text-xl font-bold text-red-900">{formatHarga(p.harga_jual)}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Negotiable · {p.sertifikat}</p>
              </div>

              {p.harga_sewa && (
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-[10px] text-blue-400 font-semibold uppercase">Harga Sewa</p>
                  <p className="text-lg font-bold text-blue-700">{formatHarga(p.harga_sewa)}/tahun</p>
                </div>
              )}

              <div className="divider my-0" />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><p className="text-gray-400">No. Folder</p><p className="font-bold text-gray-700">{p.no_folder || "-"}</p></div>
                <div><p className="text-gray-400">Tgl Listing</p><p className="font-bold text-gray-700">{p.tanggal_listing}</p></div>
                <div><p className="text-gray-400">Listing oleh</p><p className="font-bold text-gray-700">{p.listed_by_nama || "-"}</p></div>
                <div><p className="text-gray-400">Jumlah Unit</p><p className="font-bold text-gray-700">{p.jumlah_unit || 1} unit</p></div>
              </div>
            </div>
          </div>

          {/* Vendor */}
          {p.nama_vendor && (
            <div className="card bg-base-100 shadow border border-red-50">
              <div className="card-body p-4 gap-1.5">
                <h3 className="font-bold text-red-900 text-sm mb-1">Data Vendor / Pemilik</h3>
                <p className="text-sm font-semibold text-gray-700">{p.nama_vendor}</p>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <span className="text-xs font-mono">{p.vendor_hp || "-"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Status Operasional */}
          <div className="card bg-base-100 shadow border border-red-50">
            <div className="card-body p-4 gap-3">
              <h3 className="font-bold text-red-900 text-sm">Status Operasional</h3>
              {[
                { label: "Spanduk terpasang", val: p.spanduk },
                { label: "Kunci dititip", val: p.kunci },
                { label: "Feed dibuat", val: p.feed },
                { label: "Sudah di-share", val: p.sudah_share },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-sm toggle-success"
                    checked={!!item.val}
                    readOnly={!config.canEdit}
                    onChange={() => {}}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Maps */}
          {p.gmaps_url && (
            <div className="card bg-base-100 shadow border border-red-50">
              <div className="card-body p-4">
                <h3 className="font-bold text-red-900 text-sm mb-2">Lokasi Google Maps</h3>
                <div className="bg-gray-100 rounded-xl h-28 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <HiOutlineMap size={28} className="mx-auto mb-1 opacity-40" />
                    <p className="text-xs">Peta lokasi properti</p>
                  </div>
                </div>
                <a
                  href={p.gmaps_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-outline border-red-200 text-red-700 hover:bg-red-50 rounded-xl gap-1 mt-2 w-full"
                >
                  <HiOutlineMap size={14} /> Buka di Google Maps
                </a>
              </div>
            </div>
          )}

          {/* Actions */}
          {config.canDelete && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn btn-sm btn-ghost text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl w-full border border-red-100"
            >
              Hapus Properti
            </button>
          )}
        </div>
      </div>

      {/* ── Delete Modal ── */}
      {showDeleteModal && (
        <div className="modal modal-open">
          <div className="modal-box rounded-2xl max-w-sm">
            <h3 className="font-bold text-lg text-red-900">Hapus Properti?</h3>
            <p className="text-sm text-gray-500 mt-2">
              Properti <strong>{p.nama_jalan}</strong> akan dihapus permanen beserta seluruh foto. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="modal-action">
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-sm btn-ghost rounded-xl">Batal</button>
              <button
                onClick={async () => {
                  try {
                    await propertiService.remove(p.id);
                    setShowDeleteModal(false);
                    window.location.href = "/property";
                  } catch (err) {
                    alert("Gagal menghapus properti");
                  }
                }}
                className="btn btn-sm btn-error text-white rounded-xl"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowDeleteModal(false)} />
        </div>
      )}
    </div>
  );
}