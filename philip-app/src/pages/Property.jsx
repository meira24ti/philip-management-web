// philip-app/src/pages/Property.jsx — halaman CRUD properti lengkap
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { propertiService } from "../services/propertiService";
import {
  HiOutlinePlus, HiOutlineEye, HiOutlineShare, HiOutlinePencil,
  HiOutlineTrash, HiSearch, HiX, HiOutlineFilter,
  HiOutlineViewGrid, HiOutlineViewList, HiOutlineLocationMarker, HiTag,
} from "react-icons/hi";

// Mapping konstanta
const ROLE_CONFIG = {
  admin: { canAdd: true, canEdit: true, canDelete: true, canShare: true },
  marketing: { canAdd: false, canEdit: false, canDelete: false, canShare: true },
  direktur: { canAdd: false, canEdit: false, canDelete: false, canShare: false },
};
const unitClass = { tersedia: "badge-success", terjual: "badge-error", tersewa: "badge-info", dalam_negosiasi: "badge-warning" };
const unitLabel = { tersedia: "Tersedia", terjual: "Terjual", tersewa: "Tersewa", dalam_negosiasi: "Negosiasi" };

// ── FORM PROPERTI (dipakai untuk tambah DAN edit) ─────────────────────────────
function PropertyForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(initial || {
    no_folder: "", tanggal_listing: "", jenis_penawaran: "dijual",
    harga_jual: "", harga_sewa: "",
    nama_jalan: "", area_kecamatan: "", kota: "Pekanbaru",
    luas_tanah: "", luas_bangunan: "",
    kamar_tidur: "", kamar_mandi: "",
    carport: "", daya_listrik: "", sumber_air: "",
    row_jalan: "", sertifikat: "", keamanan: "",
    daftar_bonus: "", akses_fasilitas: "", keterangan: "",
    spanduk: false, kunci: false, feed: false, sudah_share: false,
    status_unit: "tersedia",
    // tipe
    kategori: "Rumah", subkategori: "", jumlah_unit: 1, jumlah_kapling: "",
    // maps
    latitude: "", longitude: "", gmaps_url: "",
  });
  const [fotos, setFotos] = useState([]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form, fotos);
  };

  const inputCls = "input input-bordered input-sm w-full rounded-xl";
  const selectCls = "select select-bordered select-sm w-full rounded-xl";
  const labelCls = "text-xs font-semibold text-gray-600";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">

      {/* Identitas */}
      <div>
        <p className="text-sm font-bold text-red-900 mb-2">Identitas Unit</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="form-control">
            <div className="label py-0.5"><span className={labelCls}>No. Folder</span></div>
            <input className={inputCls} value={form.no_folder}
              onChange={e => set("no_folder", e.target.value)} placeholder="PRE-001" />
          </label>
          <label className="form-control">
            <div className="label py-0.5"><span className={labelCls}>Tanggal Listing *</span></div>
            <input type="date" className={inputCls} value={form.tanggal_listing}
              onChange={e => set("tanggal_listing", e.target.value)} required />
          </label>
        </div>
      </div>

      {/* Tipe Properti */}
      <div>
        <p className="text-sm font-bold text-red-900 mb-2">Tipe Properti</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="form-control">
            <div className="label py-0.5"><span className={labelCls}>Kategori *</span></div>
            <select className={selectCls} value={form.kategori}
              onChange={e => set("kategori", e.target.value)} required>
              {["Rumah", "Rumah Cluster", "Ruko", "Tanah", "Gudang", "Villa", "Rumah Subsidi", "Kios", "Kombinasi"]
                .map(k => <option key={k}>{k}</option>)}
            </select>
          </label>
          <label className="form-control">
            <div className="label py-0.5"><span className={labelCls}>Subkategori</span></div>
            <select className={selectCls} value={form.subkategori}
              onChange={e => set("subkategori", e.target.value)}>
              <option value="">Pilih subkategori</option>
              {["Biasa", "Mewah", "2 Lantai", "2.5 Lantai", "3 Lantai", "Gandeng", "Kavling", "Second/Bekas"]
                .map(s => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="form-control">
            <div className="label py-0.5"><span className={labelCls}>Jumlah Unit</span></div>
            <input type="number" min="1" className={inputCls} value={form.jumlah_unit}
              onChange={e => set("jumlah_unit", e.target.value)} />
          </label>
          <label className="form-control">
            <div className="label py-0.5"><span className={labelCls}>Jumlah Kapling</span></div>
            <input type="number" min="1" className={inputCls} value={form.jumlah_kapling}
              onChange={e => set("jumlah_kapling", e.target.value)} placeholder="Khusus tanah" />
          </label>
        </div>
      </div>

      {/* Lokasi */}
      <div>
        <p className="text-sm font-bold text-red-900 mb-2">Lokasi</p>
        <div className="grid grid-cols-1 gap-3">
          <label className="form-control">
            <div className="label py-0.5"><span className={labelCls}>Nama Jalan / Alamat *</span></div>
            <input className={inputCls} value={form.nama_jalan}
              onChange={e => set("nama_jalan", e.target.value)} placeholder="Jl. Sudirman No. 10" required />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="form-control">
              <div className="label py-0.5"><span className={labelCls}>Area / Kecamatan</span></div>
              <input className={inputCls} value={form.area_kecamatan}
                onChange={e => set("area_kecamatan", e.target.value)} placeholder="Tampan" />
            </label>
            <label className="form-control">
              <div className="label py-0.5"><span className={labelCls}>Kota *</span></div>
              <select className={selectCls} value={form.kota}
                onChange={e => set("kota", e.target.value)} required>
                {["Pekanbaru", "Kampar", "Siak", "Pelalawan", "Lainnya"].map(k => <option key={k}>{k}</option>)}
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* Harga */}
      <div>
        <p className="text-sm font-bold text-red-900 mb-2">Penawaran & Harga</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="form-control col-span-2">
            <div className="label py-0.5"><span className={labelCls}>Jenis Penawaran *</span></div>
            <select className={selectCls} value={form.jenis_penawaran}
              onChange={e => set("jenis_penawaran", e.target.value)} required>
              <option value="dijual">Dijual</option>
              <option value="sewa">Disewakan</option>
              <option value="dijual_dan_sewa">Dijual & Disewakan</option>
            </select>
          </label>
          {(form.jenis_penawaran === "dijual" || form.jenis_penawaran === "dijual_dan_sewa") && (
            <label className="form-control">
              <div className="label py-0.5"><span className={labelCls}>Harga Jual (Rp)</span></div>
              <input type="number" className={inputCls} value={form.harga_jual}
                onChange={e => set("harga_jual", e.target.value)} placeholder="1500000000" />
            </label>
          )}
          {(form.jenis_penawaran === "sewa" || form.jenis_penawaran === "dijual_dan_sewa") && (
            <label className="form-control">
              <div className="label py-0.5"><span className={labelCls}>Harga Sewa/Thn (Rp)</span></div>
              <input type="number" className={inputCls} value={form.harga_sewa}
                onChange={e => set("harga_sewa", e.target.value)} placeholder="30000000" />
            </label>
          )}
        </div>
      </div>

      {/* Ukuran */}
      <div>
        <p className="text-sm font-bold text-red-900 mb-2">Ukuran</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="form-control">
            <div className="label py-0.5"><span className={labelCls}>Luas Tanah m² *</span></div>
            <input type="number" className={inputCls} value={form.luas_tanah}
              onChange={e => set("luas_tanah", e.target.value)} required />
          </label>
          <label className="form-control">
            <div className="label py-0.5"><span className={labelCls}>Luas Bangunan m²</span></div>
            <input type="number" className={inputCls} value={form.luas_bangunan}
              onChange={e => set("luas_bangunan", e.target.value)} />
          </label>
          <label className="form-control">
            <div className="label py-0.5"><span className={labelCls}>Kamar Tidur</span></div>
            <input type="number" min="0" className={inputCls} value={form.kamar_tidur}
              onChange={e => set("kamar_tidur", e.target.value)} />
          </label>
          <label className="form-control">
            <div className="label py-0.5"><span className={labelCls}>Kamar Mandi</span></div>
            <input type="number" min="0" className={inputCls} value={form.kamar_mandi}
              onChange={e => set("kamar_mandi", e.target.value)} />
          </label>
        </div>
      </div>

      {/* Spesifikasi */}
      <div>
        <p className="text-sm font-bold text-red-900 mb-2">Spesifikasi Teknis</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            ["carport", "Carport", ["Tidak ada", "1 mobil", "2 mobil", "3 mobil", "Lebih dari 3"]],
            ["daya_listrik", "Daya Listrik", ["900 Watt", "1.300 Watt", "2.200 Watt", "3.500 Watt", "4.400 Watt", "5.500 Watt", "Lebih dari 5.500 Watt"]],
            ["sumber_air", "Sumber Air", ["PDAM", "Sumur Bor", "Sumur Galian", "PDAM + Sumur Bor"]],
            ["row_jalan", "Akses Jalan", ["Jalan Tanah", "Paving Block", "Aspal 1 Mobil", "Aspal 2 Mobil", "Aspal 2 Mobil + Trotoar", "Jalan Utama"]],
            ["sertifikat", "Sertifikat", ["SHM", "SHGB", "AJB", "PPJB", "Girik/Letter C", "HGB Induk", "Lainnya"]],
            ["keamanan", "Keamanan", ["Tidak ada", "Security 24 jam", "One Gate System", "CCTV", "Security + One Gate"]],
          ].map(([key, label, opts]) => (
            <label key={key} className="form-control">
              <div className="label py-0.5"><span className={labelCls}>{label}</span></div>
              <select className={selectCls} value={form[key]} onChange={e => set(key, e.target.value)}>
                <option value="">Pilih {label.toLowerCase()}</option>
                {opts.map(o => <option key={o}>{o}</option>)}
              </select>
            </label>
          ))}
        </div>
      </div>

      {/* Bonus & Fasilitas */}
      <div>
        <p className="text-sm font-bold text-red-900 mb-2">Bonus & Fasilitas</p>
        <div className="space-y-3">
          <label className="form-control">
            <div className="label py-0.5"><span className={labelCls}>Daftar Bonus</span></div>
            <textarea className="textarea textarea-bordered textarea-sm w-full rounded-xl" rows={2}
              value={form.daftar_bonus} onChange={e => set("daftar_bonus", e.target.value)}
              placeholder="Kitchen Set, Mesin Air, Kanopi, ..." />
          </label>
          <label className="form-control">
            <div className="label py-0.5"><span className={labelCls}>Akses Fasilitas Terdekat</span></div>
            <textarea className="textarea textarea-bordered textarea-sm w-full rounded-xl" rows={2}
              value={form.akses_fasilitas} onChange={e => set("akses_fasilitas", e.target.value)}
              placeholder="Sekolah, RS, Mall, SPBU, ..." />
          </label>
          <label className="form-control">
            <div className="label py-0.5"><span className={labelCls}>Keterangan Tambahan</span></div>
            <textarea className="textarea textarea-bordered textarea-sm w-full rounded-xl" rows={2}
              value={form.keterangan} onChange={e => set("keterangan", e.target.value)} />
          </label>
        </div>
      </div>

      {/* Status Operasional */}
      <div>
        <p className="text-sm font-bold text-red-900 mb-2">Status Operasional</p>
        <div className="grid grid-cols-2 gap-2">
          {[["spanduk", "Spanduk Terpasang"], ["kunci", "Kunci Dititip"],
          ["feed", "Feed Dibuat"], ["sudah_share", "Sudah Di-share"]].map(([k, l]) => (
            <label key={k} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="toggle toggle-sm toggle-success"
                checked={!!form[k]} onChange={e => set(k, e.target.checked)} />
              <span className="text-sm text-gray-600">{l}</span>
            </label>
          ))}
        </div>
        <div className="mt-3">
          <label className="form-control">
            <div className="label py-0.5"><span className={labelCls}>Status Unit *</span></div>
            <select className={selectCls} value={form.status_unit}
              onChange={e => set("status_unit", e.target.value)} required>
              <option value="tersedia">Tersedia</option>
              <option value="terjual">Terjual</option>
              <option value="tersewa">Tersewa</option>
              <option value="dalam_negosiasi">Dalam Negosiasi</option>
            </select>
          </label>
        </div>
      </div>

      {/* Foto */}
      <div>
        <p className="text-sm font-bold text-red-900 mb-2">Foto Properti</p>
        <input type="file" accept="image/*" multiple
          className="file-input file-input-bordered file-input-sm file-input-error rounded-xl w-full"
          onChange={e => setFotos(Array.from(e.target.files))} />
        <p className="text-xs text-gray-400 mt-1">Foto pertama otomatis jadi cover. Maks 10 foto, 5MB/foto.</p>
        {fotos.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {fotos.map((f, i) => (
              <div key={i} className="relative">
                <img src={URL.createObjectURL(f)} alt="" className="w-16 h-14 object-cover rounded-lg" />
                {i === 0 && <span className="absolute bottom-0 left-0 text-[9px] bg-red-600 text-white px-1 rounded-b-lg">Cover</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Google Maps */}
      <div>
        <p className="text-sm font-bold text-red-900 mb-2">Lokasi Google Maps</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="form-control">
            <div className="label py-0.5"><span className={labelCls}>Latitude</span></div>
            <input className={inputCls} value={form.latitude}
              onChange={e => set("latitude", e.target.value)} placeholder="-0.5071" />
          </label>
          <label className="form-control">
            <div className="label py-0.5"><span className={labelCls}>Longitude</span></div>
            <input className={inputCls} value={form.longitude}
              onChange={e => set("longitude", e.target.value)} placeholder="101.4478" />
          </label>
          <label className="form-control col-span-2">
            <div className="label py-0.5"><span className={labelCls}>Link Google Maps</span></div>
            <input className={inputCls} value={form.gmaps_url}
              onChange={e => set("gmaps_url", e.target.value)} placeholder="https://maps.google.com/..." />
          </label>
        </div>
      </div>

      {/* Tombol */}
      <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-white py-3 border-t border-red-50">
        <button type="button" onClick={onCancel}
          className="btn btn-sm btn-ghost rounded-xl">Batal</button>
        <button type="submit" disabled={loading}
          className="btn btn-sm btn-error text-white rounded-xl gap-1">
          {loading ? <span className="loading loading-spinner loading-xs" /> : null}
          Simpan Properti
        </button>
      </div>
    </form>
  );
}

// ── KOMPONEN UTAMA ─────────────────────────────────────────────────────────────
export default function Property() {
  const { role } = useAuth();
  const { showToast } = useToast();
  const config = ROLE_CONFIG[role] || {};

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);

  // ✅ PERBAIKAN 1: loadData menerima parameter searchTerm
  async function loadData(searchTerm = search) {
    try {
      setLoading(true);
      const data = await propertiService.getAll({ search: searchTerm || undefined });
      setProperties(data);
    } catch {
      showToast("Gagal memuat data properti", "error");
    } finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  // ✅ PERBAIKAN 2: Bersihkan data sebelum kirim
  function cleanFormData(formData) {
    const clean = { ...formData };
    // Ubah string kosong jadi null untuk field number
    const numberFields = ['harga_jual', 'harga_sewa', 'luas_tanah', 'luas_bangunan', 
                          'kamar_tidur', 'kamar_mandi', 'jumlah_unit', 'jumlah_kapling',
                          'latitude', 'longitude'];
    numberFields.forEach(field => {
      if (clean[field] === '' || clean[field] === null || clean[field] === undefined) {
        clean[field] = null;
      } else if (!isNaN(clean[field]) && clean[field] !== '') {
        clean[field] = Number(clean[field]);
      }
    });
    return clean;
  }

  async function handleSubmit(formData, fotoFiles) {
    try {
      setSaving(true);
      const cleanData = cleanFormData(formData); // ✅ Bersihkan data
      
      if (editItem) {
        await propertiService.update(editItem.id, cleanData);
        showToast("Properti berhasil diperbarui");
      } else {
        await propertiService.create(cleanData, fotoFiles);
        showToast("Properti berhasil ditambahkan");
      }
      setShowForm(false);
      setEditItem(null);
      await loadData(); // ✅ Hanya satu kali
    } catch (err) {
      showToast(err.response?.data?.message || "Gagal menyimpan properti", "error");
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    try {
      await propertiService.remove(id);
      showToast("Properti berhasil dihapus");
      setDeleteId(null);
      document.getElementById("delete-modal").close();
      await loadData(); // ✅ Hanya satu kali
    } catch {
      showToast("Gagal menghapus properti", "error");
    }
  }

  async function handleShare(id) {
    try {
      const { shareText, waLink } = await propertiService.getShareText(id);
      await navigator.clipboard.writeText(shareText);
      showToast("Info properti disalin ke clipboard");
      window.open(waLink, "_blank");
    } catch {
      showToast("Gagal menyalin info properti", "error");
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-red-900">Manajemen Properti</h1>
          <p className="text-sm text-gray-500">{properties.length} properti terdaftar</p>
        </div>
        {config.canAdd && (
          <button onClick={() => { setEditItem(null); setShowForm(true) }}
            className="btn btn-sm btn-error text-white rounded-xl gap-1 shadow">
            <HiOutlinePlus size={16} /> Tambah Properti
          </button>
        )}
      </div>

      {/* Search - ✅ PERBAIKAN */}
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-3 flex gap-2">
        <label className="input input-bordered input-sm flex-1 flex items-center gap-2 rounded-xl border-red-100">
          <HiSearch className="text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Cari properti..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { 
              if (e.key === "Enter") {
                loadData(search); // ✅ Kirim search term
              }
            }}
            className="grow text-sm" 
          />
          {search && (
            <button 
              onClick={() => { 
                setSearch(""); 
                loadData(""); // ✅ Kirim empty string
              }}
            >
              <HiX size={14} className="text-gray-400" />
            </button>
          )}
        </label>
        <div className="flex gap-1">
          <button onClick={() => setViewMode("grid")}
            className={`btn btn-sm rounded-xl ${viewMode === "grid" ? "btn-error text-white" : "btn-ghost text-gray-400"}`}>
            <HiOutlineViewGrid size={16} />
          </button>
          <button onClick={() => setViewMode("list")}
            className={`btn btn-sm rounded-xl ${viewMode === "list" ? "btn-error text-white" : "btn-ghost text-gray-400"}`}>
            <HiOutlineViewList size={16} />
          </button>
        </div>
      </div>

      {/* Grid / List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg text-red-800" />
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="font-semibold text-sm">Belum ada properti</p>
          {config.canAdd && (
            <button onClick={() => setShowForm(true)}
              className="btn btn-sm btn-outline btn-error mt-3 rounded-xl">Tambah Properti</button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {properties.map(p => (
            <div key={p.id} className="card bg-base-100 shadow hover:shadow-md transition-all border border-red-50 overflow-hidden group">
              <figure className="relative h-32 overflow-hidden">
                <img src={p.cover_foto || "https://placehold.co/400x200/7A0000/white?text=Foto"}
                  alt={p.nama_jalan} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={e => e.target.src = "https://placehold.co/400x200/7A0000/white?text=Foto"} />
                <div className="absolute top-2 left-2">
                  <span className="badge badge-sm badge-error text-white">{p.jenis_penawaran}</span>
                </div>
                <div className="absolute top-2 right-2">
                  <span className={`badge badge-sm ${unitClass[p.status_unit]}`}>{unitLabel[p.status_unit]}</span>
                </div>
              </figure>
              <div className="card-body p-3 gap-1">
                <p className="text-[10px] font-bold text-red-700 uppercase">{p.kategori} {p.subkategori}</p>
                <div className="flex items-start gap-1">
                  <HiOutlineLocationMarker size={12} className="text-red-400 mt-0.5 shrink-0" />
                  <span className="text-xs text-gray-600 line-clamp-1">{p.nama_jalan}</span>
                </div>
                <div className="flex items-center gap-1">
                  <HiTag size={12} className="text-red-500 shrink-0" />
                  <p className="text-xs font-bold text-red-900 line-clamp-1">
                    {p.harga_jual ? "Rp " + Number(p.harga_jual).toLocaleString("id-ID") : "-"}
                  </p>
                </div>
                <div className="divider my-0.5" />
                <div className="card-actions justify-between items-center">
                  <Link to={`/property/${p.id}`} className="btn btn-xs btn-outline btn-error rounded-lg gap-1">
                    <HiOutlineEye size={12} /> Detail
                  </Link>
                  <div className="flex gap-1">
                    {config.canShare && (
                      <button onClick={() => handleShare(p.id)}
                        className="btn btn-xs btn-ghost text-blue-500 hover:bg-blue-50 rounded-lg">
                        <HiOutlineShare size={12} />
                      </button>
                    )}
                    {config.canEdit && (
                      <button onClick={() => { setEditItem(p); setShowForm(true) }}
                        className="btn btn-xs btn-ghost text-gray-500 hover:bg-gray-100 rounded-lg">
                        <HiOutlinePencil size={12} />
                      </button>
                    )}
                    {config.canDelete && (
                      <button onClick={() => { setDeleteId(p.id); document.getElementById("delete-modal").showModal() }}
                        className="btn btn-xs btn-ghost text-red-400 hover:bg-red-50 rounded-lg">
                        <HiOutlineTrash size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card bg-base-100 shadow border border-red-50 overflow-hidden">
          <table className="table table-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-red-50">
                <th>Properti</th><th>Tipe</th><th>Harga</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {properties.map(p => (
                <tr key={p.id} className="hover:bg-red-50/30 border-b border-red-50">
                  <td>
                    <p className="font-semibold text-sm text-gray-700 truncate max-w-48">{p.nama_jalan}</p>
                    <p className="text-xs text-gray-400">{p.kota}</p>
                  </td>
                  <td><span className="text-xs text-gray-600">{p.kategori}</span></td>
                  <td><span className="text-xs font-bold text-red-800">{p.harga_jual ? "Rp " + Number(p.harga_jual).toLocaleString("id-ID") : "-"}</span></td>
                  <td><span className={`badge badge-sm ${unitClass[p.status_unit]}`}>{unitLabel[p.status_unit]}</span></td>
                  <td>
                    <div className="flex gap-1 justify-end">
                      <Link to={`/property/${p.id}`} className="btn btn-xs btn-ghost text-red-600 rounded-lg"><HiOutlineEye size={13} /></Link>
                      {config.canShare && <button onClick={() => handleShare(p.id)} className="btn btn-xs btn-ghost text-blue-500 rounded-lg"><HiOutlineShare size={13} /></button>}
                      {config.canEdit && <button onClick={() => { setEditItem(p); setShowForm(true) }} className="btn btn-xs btn-ghost text-gray-500 rounded-lg"><HiOutlinePencil size={13} /></button>}
                      {config.canDelete && <button onClick={() => { setDeleteId(p.id); document.getElementById("delete-modal").showModal() }} className="btn btn-xs btn-ghost text-red-400 rounded-lg"><HiOutlineTrash size={13} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form Tambah/Edit */}
      {showForm && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl rounded-2xl">
            <h3 className="font-bold text-lg text-red-900 mb-4">
              {editItem ? "Edit Properti" : "Tambah Properti Baru"}
            </h3>
            <PropertyForm
              initial={editItem || undefined}
              onSubmit={handleSubmit}
              onCancel={() => { setShowForm(false); setEditItem(null) }}
              loading={saving}
            />
          </div>
          <div className="modal-backdrop" onClick={() => { setShowForm(false); setEditItem(null) }} />
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      <dialog id="delete-modal" className="modal">
        <div className="modal-box rounded-2xl max-w-sm">
          <h3 className="font-bold text-lg text-red-900">Hapus Properti?</h3>
          <p className="text-sm text-gray-500 mt-2">Data properti beserta semua foto akan dihapus permanen.</p>
          <div className="modal-action">
            <button onClick={() => document.getElementById("delete-modal").close()}
              className="btn btn-sm btn-ghost rounded-xl">Batal</button>
            <button onClick={() => handleDelete(deleteId)}
              className="btn btn-sm btn-error text-white rounded-xl">Ya, Hapus</button>
          </div>
        </div>
        <div className="modal-backdrop" onClick={() => document.getElementById("delete-modal").close()} />
      </dialog>
    </div>
  );
}