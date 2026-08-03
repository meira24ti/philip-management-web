// philip-app/src/pages/PropertyDetail.jsx
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  HiOutlineLocationMarker, HiArrowLeft,
  HiOutlineShare, HiOutlineMap,
  HiOutlineChevronLeft, HiOutlineChevronRight
} from "react-icons/hi";
import { FotoManager } from "../components/FotoManager";
import { useAuth } from "../context/useAuth";
import { useToast } from "../components/ToastContext";
import { propertiService } from "../services/propertiService";
import { generateFlyerPNG, downloadFlyer } from "../utils/generateFlyer";
import { getImageUrl } from "../utils/imageUrl";

// ─── Konfigurasi role ──────────────────────────────────────────
const ROLE_CONFIG = {
  admin: { canEdit: true, canDelete: true, canShare: false, canFlyer: true },
  marketing: { canEdit: false, canDelete: false, canShare: true, canFlyer: true },
  direktur: { canEdit: false, canDelete: false, canShare: false, canFlyer: false },
};

// ─── Mapping status unit (sesuai database: negosiasi) ────────
const unitClass = {
  tersedia: "badge-success",
  terjual: "badge-error",
  tersewa: "badge-info",
  negosiasi: "badge-warning"
};
const unitLabel = {
  tersedia: "Tersedia",
  terjual: "Terjual",
  tersewa: "Tersewa",
  negosiasi: "Negosiasi"
};

// ─── KOMPONEN UTAMA ────────────────────────────────────────────
export default function PropertyDetail() {
  const { id } = useParams();
  const { role } = useAuth();
  const { showToast } = useToast();
  const config = ROLE_CONFIG[role] || {};

  // ─── State ───────────────────────────────────────────────────
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fotoIdx, setFotoIdx] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ─── Transaksi state ────────────────────────────────────────
  const [showTransaksi, setShowTransaksi] = useState(false);
  const [transaksiList, setTransaksiList] = useState([]);
  const [savingTrx, setSavingTrx] = useState(false);
  const [trxForm, setTrxForm] = useState({
    jenis: "terjual",
    harga_aktual: "",
    komisi_persen: "2",
    catatan: "",
    tanggal_transaksi: new Date().toISOString().slice(0, 10),
  });

  // ─── Fetch data properti ──────────────────────────────────
  useEffect(() => {
    if (!id) return;
    propertiService.getById(id)
      .then(data => {
        setProperty(data);
        setError("");
      })
      .catch(() => {
        setError("Gagal memuat data properti.");
        showToast("Gagal memuat data properti", "error");
      })
      .finally(() => setLoading(false));
  }, [id, showToast]);

  // ─── Load riwayat transaksi (Admin & Direktur) ──────────
  useEffect(() => {
    if (!id || !["admin", "direktur"].includes(role)) return;
    propertiService.getTransaksi(id)
      .then(setTransaksiList)
      .catch(() => {});
  }, [id, role]);

  // ─── Auto set komisi saat jenis berubah ─────────────────
  const handleJenisChange = (jenis) => {
    setTrxForm((f) => ({
      ...f,
      jenis,
      komisi_persen: jenis === "terjual" ? "2" : "5",
    }));
  };

  // ─── Handler share ────────────────────────────────────────
  const handleShare = async (propertiId) => {
    try {
      const { shareText, waLink } = await propertiService.getShareText(propertiId);
      await navigator.clipboard.writeText(shareText);
      window.open(waLink, "_blank");
      showToast("Info properti berhasil disalin ke clipboard", "success");
    } catch {
      showToast("Gagal menyalin info properti", "error");
    }
  };

  // ─── Handler download flyer ──────────────────────────────
  const handleDownloadFlyer = async () => {
    try {
      const data = await propertiService.getById(id);
      const blob = await generateFlyerPNG(data, { scale: 3 });
      if (!blob) throw new Error("Blob flyer kosong");
      downloadFlyer(blob, `flyer-${data.no_folder || data.id}.png`);
      showToast("Flyer berhasil didownload", "success");
    } catch (err) {
      console.error("Gagal generate flyer:", err);
      showToast(err.message || "Gagal membuat flyer", "error");
    }
  };
  // ─── Handler submit transaksi ────────────────────────────
  const handleSubmitTransaksi = async (e) => {
    e.preventDefault();
    try {
      setSavingTrx(true);
      await propertiService.createTransaksi(id, trxForm);
      showToast("Transaksi berhasil dicatat", "success");
      setShowTransaksi(false);
      // Reload properti
      const updated = await propertiService.getById(id);
      setProperty(updated);
      const trx = await propertiService.getTransaksi(id);
      setTransaksiList(trx);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Gagal mencatat transaksi",
        "error"
      );
    } finally {
      setSavingTrx(false);
    }
  };

  // ─── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg text-red-800" />
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────────
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

  const p = property;
  const fotoList = p.foto_properti || [];
  const coverFoto = fotoList.find(f => f.is_cover)?.url_foto || fotoList[0]?.url_foto || "https://placehold.co/800x400/7A0000/white?text=Foto";

  const formatHarga = (harga) => {
    if (!harga) return "-";
    return "Rp " + Number(harga).toLocaleString("id-ID");
  };

  const badgeMap = {
    dijual: "Dijual",
    disewa: "Disewa",
    dijual_dan_disewa: "Jual/Sewa"
  };
  const badge = badgeMap[p.jenis_penawaran] || p.jenis_penawaran;

  return (
    <div className="space-y-4">

      {/* ── Breadcrumb ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Link to="/property" className="btn btn-sm btn-ghost rounded-xl gap-1 text-gray-500 hover:text-red-800">
            <HiArrowLeft size={15} /> Properti
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-red-900 truncate max-w-48">
            {p.nama_jalan || p.id}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
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

          {/* ── Gallery ── */}
          <div className="card bg-base-100 shadow border border-red-50 overflow-hidden">
            <div className="relative h-52 sm:h-64 md:h-80 bg-gray-100">
              <img
                src={getImageUrl(fotoList[fotoIdx]?.url_foto) || coverFoto}
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
                <span className={`badge badge-sm ${unitClass[p.status_unit]}`}>
                  {unitLabel[p.status_unit] || p.status_unit}
                </span>
              </div>
              <div className="absolute top-3 right-3">
                <span className="text-[10px] text-white/70 font-mono bg-black/30 px-1.5 py-0.5 rounded">
                  {p.no_folder || "-"}
                </span>
              </div>
            </div>

            {/* Thumbnail strip */}
            {fotoList.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {fotoList.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => setFotoIdx(i)}
                    className={`w-16 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${i === fotoIdx ? "border-red-600" : "border-transparent"}`}
                  >
                    <img
                      src={getImageUrl(f.url_foto)}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={e => e.target.src = "https://placehold.co/80x60/7A0000/white?text=."}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── FotoManager (Admin only) ── */}
          {config.canEdit && fotoList.length > 0 && (
            <div className="p-3 border-t border-red-50">
              <FotoManager
                fotos={fotoList}
                propertiId={id}
                onUpdate={() => {
                  propertiService.getById(id).then(setProperty);
                }}
              />
            </div>
          )}

          {/* ── Spesifikasi Teknis ── */}
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

          {/* ── Keterangan ── */}
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

          {/* ── Harga & Identitas ── */}
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

          {/* ── Vendor ── */}
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

          {/* ── Status Operasional ── */}
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

          {/* ── Tombol Input Transaksi (Admin only) ── */}
          {config.canEdit &&
            ["tersedia", "negosiasi"].includes(p?.status_unit) && (
              <button
                onClick={() => setShowTransaksi(true)}
                className="btn btn-sm btn-outline border-green-300 text-green-700
                           hover:bg-green-50 rounded-xl w-full gap-1"
              >
                💰 Input Transaksi
              </button>
            )}

          {/* ── Riwayat Transaksi (Admin & Direktur) ── */}
          {["admin", "direktur"].includes(role) && transaksiList.length > 0 && (
            <div className="card bg-base-100 shadow border border-green-100">
              <div className="card-body p-4">
                <h3 className="font-bold text-sm text-green-800 mb-2">Riwayat Transaksi</h3>
                <div className="space-y-2">
                  {transaksiList.map((t) => (
                    <div key={t.id_transaksi} className="bg-green-50 rounded-xl p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span
                          className={`badge badge-sm ${t.jenis === "terjual" ? "badge-error" : "badge-info"} text-white`}
                        >
                          {t.jenis}
                        </span>
                        <span className="text-xs text-gray-400">
                          {t.tanggal_transaksi}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-700">
                        Rp {Number(t.harga_aktual).toLocaleString("id-ID")}
                      </p>
                      <p className="text-xs text-green-700">
                        Komisi {t.komisi_persen}% = Rp{" "}
                        {Number(t.komisi_nominal).toLocaleString("id-ID")}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Dicatat: {t.dicatat_oleh_nama}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Google Maps ── */}
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

          {/* ── Delete Action ── */}
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
                    showToast("Properti berhasil dihapus", "success");
                    setShowDeleteModal(false);
                    window.location.href = "/property";
                  } catch {
                    showToast("Gagal menghapus properti", "error");
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

      {/* ── Modal Input Transaksi ── */}
      {showTransaksi && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md rounded-2xl">
            <h3 className="font-bold text-lg text-red-900 mb-4">Input Transaksi</h3>
            <form onSubmit={handleSubmitTransaksi} className="space-y-3">
              <label className="form-control">
                <div className="label py-0.5">
                  <span className="label-text text-xs font-semibold text-gray-600">Jenis *</span>
                </div>
                <select
                  className="select select-bordered select-sm rounded-xl w-full"
                  value={trxForm.jenis}
                  onChange={(e) => handleJenisChange(e.target.value)}
                >
                  <option value="terjual">Terjual</option>
                  <option value="tersewa">Tersewa</option>
                </select>
              </label>

              <label className="form-control">
                <div className="label py-0.5">
                  <span className="label-text text-xs font-semibold text-gray-600">Harga Aktual (Rp) *</span>
                </div>
                <input
                  type="number"
                  required
                  className="input input-bordered input-sm rounded-xl w-full"
                  placeholder="Harga deal sebenarnya"
                  value={trxForm.harga_aktual}
                  onChange={(e) => setTrxForm(f => ({ ...f, harga_aktual: e.target.value }))}
                />
              </label>

              <label className="form-control">
                <div className="label py-0.5">
                  <span className="label-text text-xs font-semibold text-gray-600">
                    Komisi (%) — default: {trxForm.jenis === "terjual" ? "2%" : "5%"}
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="input input-bordered input-sm rounded-xl w-full"
                  value={trxForm.komisi_persen}
                  onChange={(e) => setTrxForm(f => ({ ...f, komisi_persen: e.target.value }))}
                />
              </label>

              {trxForm.harga_aktual && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                  Estimasi Komisi:{" "}
                  <strong>
                    Rp{" "}
                    {Math.round(
                      Number(trxForm.harga_aktual) *
                      Number(trxForm.komisi_persen) / 100
                    ).toLocaleString("id-ID")}
                  </strong>
                </div>
              )}

              <label className="form-control">
                <div className="label py-0.5">
                  <span className="label-text text-xs font-semibold text-gray-600">Tanggal Transaksi *</span>
                </div>
                <input
                  type="date"
                  required
                  className="input input-bordered input-sm rounded-xl w-full"
                  value={trxForm.tanggal_transaksi}
                  onChange={(e) => setTrxForm(f => ({ ...f, tanggal_transaksi: e.target.value }))}
                />
              </label>

              <label className="form-control">
                <div className="label py-0.5">
                  <span className="label-text text-xs font-semibold text-gray-600">Catatan</span>
                </div>
                <textarea
                  className="textarea textarea-bordered textarea-sm rounded-xl w-full"
                  rows={2}
                  placeholder="Catatan tambahan (opsional)"
                  value={trxForm.catatan}
                  onChange={(e) => setTrxForm(f => ({ ...f, catatan: e.target.value }))}
                />
              </label>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
                ℹ️ Status unit properti akan otomatis berubah menjadi{" "}
                <strong>{trxForm.jenis === "terjual" ? "Terjual" : "Tersewa"}</strong>{" "}
                setelah transaksi disimpan.
              </div>

              <div className="modal-action pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransaksi(false)}
                  className="btn btn-sm btn-ghost rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingTrx}
                  className="btn btn-sm btn-error text-white rounded-xl gap-1"
                >
                  {savingTrx ? (
                    <>
                      <span className="loading loading-spinner loading-xs" /> Menyimpan...
                    </>
                  ) : (
                    "Simpan Transaksi"
                  )}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setShowTransaksi(false)} />
        </div>
      )}
    </div>
  );
}
