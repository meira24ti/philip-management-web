// philip-app/src/pages/Property.jsx — halaman CRUD properti lengkap
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useToast } from "../components/ToastContext";
import { propertiService } from "../services/propertiService";
import { getImageUrl } from "../utils/imageUrl";
import {
  HiOutlinePlus, HiOutlineEye, HiOutlineShare, HiOutlinePencil,
  HiOutlineTrash, HiSearch, HiX,
  HiOutlineViewGrid, HiOutlineViewList, HiOutlineLocationMarker, HiTag,
} from "react-icons/hi";

// ─── ROLE CONFIG ──────────────────────────────────────────────
const ROLE_CONFIG = {
  admin: { canAdd: true, canEdit: true, canDelete: true, canShare: false },
  marketing: { canAdd: false, canEdit: false, canDelete: false, canShare: true },
  direktur: { canAdd: false, canEdit: false, canDelete: false, canShare: false },
};

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

// ── FORM ──────────────────────────────────────────────────────
function PropertyForm({ initial, onSubmit, onCancel, loading, vendors, marketings, onCreateVendor }) {
  const getDefaultForm = () => ({
    no_folder: "",
    tanggal_listing: "",
    jenis_penawaran: "dijual",
    harga_jual: "",
    harga_sewa: "",
    nama_jalan: "",
    area_kecamatan: "",
    kota: "Pekanbaru",
    luas_tanah: "",
    luas_bangunan: "",
    kamar_tidur: "",
    kamar_mandi: "",
    carport: "",
    daya_listrik: "",
    sumber_air: "",
    row_jalan: "",
    sertifikat: "",
    keamanan: "",
    daftar_bonus: "",
    akses_fasilitas: "",
    keterangan: "",
    spanduk: false,
    kunci: false,
    feed: false,
    sudah_share: false,
    status_unit: "tersedia",
    kategori: "Rumah",
    subkategori: "",
    jumlah_unit: 1,
    jumlah_kapling: "",
    id_vendor: "",
    listed_by: "",
    latitude: "",
    longtitude: "",
    gmaps_url: "",
  });

  const [form, setForm] = useState(() => ({ ...getDefaultForm(), ...(initial || {}) }));
  const [fotos, setFotos] = useState([]);
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [vendorDraft, setVendorDraft] = useState({ nama_vendor: "", no_hp: "" });
  const [vendorSaving, setVendorSaving] = useState(false);
  const [vendorError, setVendorError] = useState("");
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
      {/* ─── Identitas ─────────────────────────────────────────── */}
      <div>
        <p className="text-sm font-bold text-red-900 mb-2">Identitas Unit</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

      {/* ─── Tipe Properti ────────────────────────────────────── */}
      <div>
        <p className="text-sm font-bold text-red-900 mb-2">Tipe Properti</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

      {/* ─── Vendor & Marketing ───────────────────────────────── */}
      <div>
        <p className="text-sm font-bold text-red-900 mb-2">Data Vendor & Marketing</p>
        <div className="grid grid-cols-1 gap-3">
          <label className="form-control">
            <div className="label py-0.5"><span className={labelCls}>Vendor / Pemilik Properti *</span></div>
            <select className={selectCls} value={form.id_vendor}
              onChange={e => set("id_vendor", e.target.value)} required>
              <option value="">Pilih vendor...</option>
              {vendors.map(v => (
                <option key={v.id_vendor} value={v.id_vendor}>
                  {v.nama_vendor} — {v.no_hp || "-"}
                </option>
              ))}
            </select>
            <div className="label py-0.5">
              <span className="label-text-alt text-xs text-gray-400">
                Vendor belum ada?{" "}
                <button type="button" className="text-red-600 underline"
                  onClick={() => {
                    setVendorError("");
                    setShowVendorForm(v => !v);
                  }}>
                  {showVendorForm ? "Batal tambah vendor" : "Tambah vendor baru"}
                </button>
              </span>
            </div>
            {showVendorForm && (
              <div className="rounded-xl border border-red-100 bg-red-50/50 p-3 space-y-2">
                <div className="grid grid-cols-1 gap-2">
                  <label className="form-control">
                    <div className="label py-0.5"><span className={labelCls}>Nama Vendor *</span></div>
                    <input
                      className={inputCls}
                      value={vendorDraft.nama_vendor}
                      onChange={e => setVendorDraft(d => ({ ...d, nama_vendor: e.target.value }))}
                      placeholder="Nama Lengkap Vendor"
                      required
                    />
                  </label>
                  <label className="form-control">
                    <div className="label py-0.5"><span className={labelCls}>Nomor HP</span></div>
                    <input
                      className={inputCls}
                      value={vendorDraft.no_hp}
                      onChange={e => setVendorDraft(d => ({ ...d, no_hp: e.target.value }))}
                      placeholder="0812xxxx"
                    />
                  </label>
                </div>
                {vendorError && <p className="text-xs text-red-600">{vendorError}</p>}
                <div className="flex justify-end gap-2">
                  <button type="button" className="btn btn-xs btn-ghost rounded-lg" onClick={() => setShowVendorForm(false)}>
                    Batal
                  </button>
                  <button
                    type="button"
                    className="btn btn-xs btn-error text-white rounded-lg"
                    disabled={vendorSaving}
                    onClick={async () => {
                      setVendorError("");
                      setVendorSaving(true);
                      try {
                        const created = await onCreateVendor(vendorDraft);
                        set("id_vendor", created.id_vendor);
                        setVendorDraft({ nama_vendor: "", no_hp: "" });
                        setShowVendorForm(false);
                      } catch (err) {
                        setVendorError(err.response?.data?.message || "Gagal menambahkan vendor");
                      } finally {
                        setVendorSaving(false);
                      }
                    }}
                  >
                    {vendorSaving ? "Menyimpan..." : "Simpan Vendor"}
                  </button>
                </div>
              </div>
            )}
          </label>

          <label className="form-control">
            <div className="label py-0.5"><span className={labelCls}>Listing oleh (Marketing) *</span></div>
            <select className={selectCls} value={form.listed_by}
              onChange={e => set("listed_by", e.target.value)} required>
              <option value="">Pilih marketing...</option>
              {marketings.map(m => (
                <option key={m.id_user} value={m.id_user}>{m.nama}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* ─── Lokasi ────────────────────────────────────────────── */}
      <div>
        <p className="text-sm font-bold text-red-900 mb-2">Lokasi</p>
        <div className="grid grid-cols-1 gap-3">
          <label className="form-control">
            <div className="label py-0.5"><span className={labelCls}>Nama Jalan / Alamat *</span></div>
            <input className={inputCls} value={form.nama_jalan}
              onChange={e => set("nama_jalan", e.target.value)} placeholder="Jl. Sudirman No. 10" required />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

      {/* ─── Penawaran & Harga ────────────────────────────────── */}
      <div>
        <p className="text-sm font-bold text-red-900 mb-2">Penawaran & Harga</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="form-control col-span-1 sm:col-span-2">
            <div className="label py-0.5"><span className={labelCls}>Jenis Penawaran *</span></div>
            <select className={selectCls} value={form.jenis_penawaran}
              onChange={e => set("jenis_penawaran", e.target.value)} required>
              <option value="dijual">Dijual</option>
              <option value="disewa">Disewakan</option>
              <option value="dijual_dan_disewa">Dijual & Disewakan</option>
            </select>
          </label>
          {(form.jenis_penawaran === "dijual" || form.jenis_penawaran === "dijual_dan_disewa") && (
            <label className="form-control">
              <div className="label py-0.5"><span className={labelCls}>Harga Jual (Rp)</span></div>
              <input type="number" className={inputCls} value={form.harga_jual}
                onChange={e => set("harga_jual", e.target.value)} placeholder="1500000000" />
            </label>
          )}
          {(form.jenis_penawaran === "disewa" || form.jenis_penawaran === "dijual_dan_disewa") && (
            <label className="form-control">
              <div className="label py-0.5"><span className={labelCls}>Harga Sewa/Thn (Rp)</span></div>
              <input type="number" className={inputCls} value={form.harga_sewa}
                onChange={e => set("harga_sewa", e.target.value)} placeholder="30000000" />
            </label>
          )}
        </div>
      </div>

      {/* ─── Ukuran ────────────────────────────────────────────── */}
      <div>
        <p className="text-sm font-bold text-red-900 mb-2">Ukuran</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

      {/* ─── Spesifikasi ───────────────────────────────────────── */}
      <div>
        <p className="text-sm font-bold text-red-900 mb-2">Spesifikasi Teknis</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

      {/* ─── Bonus & Fasilitas ────────────────────────────────── */}
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

      {/* ─── Status Operasional ───────────────────────────────── */}
      <div>
        <p className="text-sm font-bold text-red-900 mb-2">Status Operasional</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
              <option value="negosiasi">Dalam Negosiasi</option>
            </select>
          </label>
        </div>
      </div>

      {/* ─── Foto ────────────────────────────────────────────── */}
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

      {/* ─── Google Maps ──────────────────────────────────────── */}
      <div>
        <p className="text-sm font-bold text-red-900 mb-2">Lokasi Google Maps</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="form-control">
            <div className="label py-0.5"><span className={labelCls}>Latitude</span></div>
            <input className={inputCls} value={form.latitude}
              onChange={e => set("latitude", e.target.value)} placeholder="-0.5071" />
          </label>
          <label className="form-control">
            <div className="label py-0.5"><span className={labelCls}>Longitude</span></div>
            <input className={inputCls} value={form.longtitude}
              onChange={e => set("longtitude", e.target.value)} placeholder="101.4478" />
          </label>
          <label className="form-control col-span-1 sm:col-span-2">
            <div className="label py-0.5"><span className={labelCls}>Link Google Maps</span></div>
            <input className={inputCls} value={form.gmaps_url}
              onChange={e => set("gmaps_url", e.target.value)} placeholder="https://maps.google.com/..." />
          </label>
        </div>
      </div>

      {/* ─── Tombol ───────────────────────────────────────────── */}
      <div className="flex flex-wrap justify-end gap-2 pt-2 sticky bottom-0 bg-white py-3 border-t border-red-50">
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

// ── KOMPONEN UTAMA ─────────────────────────────────────────────
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

  // ─── State untuk filter ──────────────────────────────────────
  const [filterKategori, setFilterKategori] = useState("");
  const [filterDari, setFilterDari] = useState("");
  const [filterSampai, setFilterSampai] = useState("");
  const [filterHargaMin, setFilterHargaMin] = useState("");
  const [filterHargaMax, setFilterHargaMax] = useState("");
  const [filterJenis, setFilterJenis] = useState("");
  const [filterStatusUnit, setFilterStatusUnit] = useState("");
  const [filterKota, setFilterKota] = useState("");
  const [filterLtMin, setFilterLtMin] = useState("");
  const [filterLtMax, setFilterLtMax] = useState("");

  // ─── State untuk dropdown vendor & marketing ────────────────
  const [vendors, setVendors] = useState([]);
  const [marketings, setMarketings] = useState([]);

  // ─── Load data vendor & marketing ──────────────────────────
  const loadVendorsAndMarketings = useCallback(async () => {
    try {
      const [v, m] = await Promise.all([
        propertiService.getVendors(),
        propertiService.getMarketings(),
      ]);
      setVendors(v);
      setMarketings(m);
    } catch {
      // Jika gagal load, tetap bisa lanjut (dropdown kosong)
    }
  }, []);

  useEffect(() => {
    loadVendorsAndMarketings();
  }, [loadVendorsAndMarketings]);

  // ─── Load data properti ──────────────────────────────────────
  const loadData = useCallback(async (searchTerm = "", kat = "", dari = "", sampai = "", hMin = "", hMax = "", jenis = "", statusUnit = "", kota = "", ltMin = "", ltMax = "") => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (kat) params.kategori = kat;
      if (dari) params.dari = dari;
      if (sampai) params.sampai = sampai;
      if (hMin) params.hargaMin = hMin;
      if (hMax) params.hargaMax = hMax;
      if (jenis) params.jenis = jenis;
      if (statusUnit) params.statusUnit = statusUnit;
      if (kota) params.kota = kota;
      if (ltMin) params.ltMin = ltMin;
      if (ltMax) params.ltMax = ltMax;
      
      const data = await propertiService.getAll(params);
      setProperties(data);
    } catch {
      showToast("Gagal memuat data properti", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData(search, filterKategori, filterDari, filterSampai, filterHargaMin, filterHargaMax, filterJenis, filterStatusUnit, filterKota, filterLtMin, filterLtMax);
  }, [loadData, search, filterKategori, filterDari, filterSampai, filterHargaMin, filterHargaMax, filterJenis, filterStatusUnit, filterKota, filterLtMin, filterLtMax]);

  // ─── Bersihkan data form sebelum kirim ──────────────────────
  function cleanFormData(formData) {
    const clean = { ...formData };
    const numberFields = [
      'harga_jual', 'harga_sewa', 'luas_tanah', 'luas_bangunan',
      'kamar_tidur', 'kamar_mandi', 'jumlah_unit', 'jumlah_kapling',
      'latitude', 'longtitude'
    ];
    numberFields.forEach(field => {
      if (clean[field] === '' || clean[field] === null || clean[field] === undefined) {
        clean[field] = null;
      } else if (!isNaN(clean[field]) && clean[field] !== '') {
        clean[field] = Number(clean[field]);
      }
    });
    return clean;
  }

  // ─── Submit tambah / edit ────────────────────────────────────
  // ✅ Perbaikan handleSubmit: konversi boolean ke "1"/"0"
  async function handleSubmit(formData, fotoFiles) {
    try {
      setSaving(true);

      // Konversi boolean ke "1"/"0" untuk FormData
      const processedData = {
        ...formData,
        spanduk:     formData.spanduk     ? "1" : "0",
        kunci:       formData.kunci       ? "1" : "0",
        feed:        formData.feed        ? "1" : "0",
        sudah_share: formData.sudah_share ? "1" : "0",
      };
      // Normalize numeric/empty fields to null or numbers
      const payload = cleanFormData(processedData);

      if (editItem) {
        // Edit: kirim JSON biasa
        const propertiId = editItem.id_properti || editItem.id;
        if (!propertiId) {
          showToast("ID properti tidak ditemukan", "error");
          return;
        }
        await propertiService.update(propertiId, payload);
        showToast("Properti berhasil diperbarui");
      } else {
        // Tambah baru: pakai FormData untuk upload foto
        await propertiService.create(payload, fotoFiles);
        showToast("Properti berhasil ditambahkan");
      }

      setShowForm(false);
      setEditItem(null);
      await loadData(search, filterKategori, filterDari, filterSampai, filterHargaMin, filterHargaMax, filterJenis, filterStatusUnit, filterKota, filterLtMin, filterLtMax);
    } catch (err) {
      showToast(err.response?.data?.message || "Gagal menyimpan properti", "error");
    } finally {
      setSaving(false);
    }
  }

  // ─── Tambah vendor baru ──────────────────────────────────────
  const handleCreateVendor = async (data) => {
    const result = await propertiService.createVendor(data);
    await loadVendorsAndMarketings();
    return result.vendor;
  };

  // ─── Hapus properti ──────────────────────────────────────────
  async function handleDelete(id) {
    try {
      await propertiService.remove(id);
      showToast("Properti berhasil dihapus");
      setDeleteId(null);
      document.getElementById("delete-modal").close();
      await loadData(search, filterKategori, filterDari, filterSampai, filterHargaMin, filterHargaMax, filterJenis, filterStatusUnit, filterKota, filterLtMin, filterLtMax);
    } catch {
      showToast("Gagal menghapus properti", "error");
    }
  }

  // ─── Share properti ──────────────────────────────────────────
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

  // ─── Handle edit: ambil ID dengan fallback ──────────────────
  const handleEditClick = async (property) => {
    try {
      const propertiId = property.id || property.id_properti;
      if (!propertiId) {
        console.error("❌ Property without ID:", property);
        showToast("ID properti tidak ditemukan", "error");
        return;
      }
      console.log("🟢 Editing property with ID:", propertiId);
      const fullData = await propertiService.getById(propertiId);
      setEditItem(fullData);
      setShowForm(true);
    } catch (err) {
      console.error("❌ Failed to fetch property:", err);
      showToast("Gagal memuat data properti", "error");
    }
  };

  return (
    <div className="space-y-4">
      {/* ─── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-red-900">Manajemen Properti</h1>
          <p className="text-sm text-gray-500">{properties.length} properti terdaftar</p>
        </div>
        {config.canAdd && (
          <button
            onClick={() => { setEditItem(null); setShowForm(true); }}
            className="btn btn-sm btn-error text-white rounded-xl gap-1 shadow w-full sm:w-auto"
          >
            <HiOutlinePlus size={16} /> Tambah Properti
          </button>
        )}
      </div>

      {/* ─── Search ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-3 flex gap-2 flex-wrap items-end">
        <label className="input input-bordered input-sm flex min-w-0 w-full sm:w-auto flex-1 items-center gap-2 rounded-xl border-red-100">
          <HiSearch className="text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Cari properti..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="grow text-sm"
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <HiX size={14} className="text-gray-400" />
            </button>
          )}
        </label>

        {/* ─── Filter Kategori ─────────────────────────────────── */}
        <select
          className="select select-bordered select-sm rounded-xl border-red-100 w-full sm:w-auto"
          value={filterKategori}
          onChange={e => setFilterKategori(e.target.value)}
        >
          <option value="">Semua Kategori</option>
          <option value="Rumah">Rumah</option>
          <option value="Rumah Cluster">Rumah Cluster</option>
          <option value="Ruko">Ruko</option>
          <option value="Tanah">Tanah</option>
          <option value="Gudang">Gudang</option>
          <option value="Villa">Villa</option>
          <option value="Rumah Subsidi">Rumah Subsidi</option>
          <option value="Kios">Kios</option>
          <option value="Kombinasi">Kombinasi</option>
        </select>

        <select className="select select-bordered select-sm w-full rounded-xl border-red-100 sm:w-auto" value={filterJenis} onChange={e => setFilterJenis(e.target.value)}>
          <option value="">Semua Penawaran</option>
          <option value="dijual">Dijual</option>
          <option value="disewa">Disewakan</option>
          <option value="dijual_dan_disewa">Jual &amp; Sewa</option>
        </select>

        <select className="select select-bordered select-sm w-full rounded-xl border-red-100 sm:w-auto" value={filterStatusUnit} onChange={e => setFilterStatusUnit(e.target.value)}>
          <option value="">Semua Status Unit</option>
          <option value="tersedia">Tersedia</option>
          <option value="negosiasi">Negosiasi</option>
          <option value="terjual">Terjual</option>
          <option value="tersewa">Tersewa</option>
        </select>

        <select className="select select-bordered select-sm w-full rounded-xl border-red-100 sm:w-auto" value={filterKota} onChange={e => setFilterKota(e.target.value)}>
          <option value="">Semua Kota</option>
          <option value="Pekanbaru">Pekanbaru</option>
          <option value="Kampar">Kampar</option>
          <option value="Siak">Siak</option>
          <option value="Pelalawan">Pelalawan</option>
        </select>

        {/* ─── Filter Tanggal Dari ─────────────────────────────── */}
        <input
          type="date"
          className="input input-bordered input-sm rounded-xl border-red-100 w-full sm:w-auto"
          value={filterDari}
          onChange={e => setFilterDari(e.target.value)}
          placeholder="Dari tanggal"
          title="Dari tanggal"
        />

        {/* ─── Filter Tanggal Sampai ───────────────────────────── */}
        <input
          type="date"
          className="input input-bordered input-sm rounded-xl border-red-100 w-full sm:w-auto"
          value={filterSampai}
          onChange={e => setFilterSampai(e.target.value)}
          placeholder="Sampai tanggal"
          title="Sampai tanggal"
        />

        {/* ─── Filter Harga Min ────────────────────────────────── */}
        <input
          type="number"
          className="input input-bordered input-sm rounded-xl border-red-100 w-full sm:w-32"
          value={filterHargaMin}
          onChange={e => setFilterHargaMin(e.target.value)}
          placeholder="Harga min"
          title="Harga minimum (Rp)"
        />

        {/* ─── Filter Harga Max ────────────────────────────────── */}
        <input
          type="number"
          className="input input-bordered input-sm rounded-xl border-red-100 w-full sm:w-32"
          value={filterHargaMax}
          onChange={e => setFilterHargaMax(e.target.value)}
          placeholder="Harga max"
          title="Harga maksimum (Rp)"
        />

        <input type="number" className="input input-bordered input-sm w-full rounded-xl border-red-100 sm:w-32" value={filterLtMin} onChange={e => setFilterLtMin(e.target.value)} placeholder="LT min (m²)" title="Luas tanah minimum" />
        <input type="number" className="input input-bordered input-sm w-full rounded-xl border-red-100 sm:w-32" value={filterLtMax} onChange={e => setFilterLtMax(e.target.value)} placeholder="LT max (m²)" title="Luas tanah maksimum" />

        {(filterKategori || filterJenis || filterStatusUnit || filterKota || filterDari || filterSampai || filterHargaMin || filterHargaMax || filterLtMin || filterLtMax || search) && (
          <button onClick={() => { setSearch(""); setFilterKategori(""); setFilterJenis(""); setFilterStatusUnit(""); setFilterKota(""); setFilterDari(""); setFilterSampai(""); setFilterHargaMin(""); setFilterHargaMax(""); setFilterLtMin(""); setFilterLtMax(""); }} className="btn btn-sm btn-ghost rounded-xl text-red-700">
            Reset Filter
          </button>
        )}

        <div className="flex gap-1 sm:ml-auto">
          <button
            onClick={() => setViewMode("grid")}
            className={`btn btn-sm rounded-xl ${viewMode === "grid" ? "btn-error text-white" : "btn-ghost text-gray-400"}`}
          >
            <HiOutlineViewGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`btn btn-sm rounded-xl ${viewMode === "list" ? "btn-error text-white" : "btn-ghost text-gray-400"}`}
          >
            <HiOutlineViewList size={16} />
          </button>
        </div>
      </div>

      {/* ─── Grid / List ──────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg text-red-800" />
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="font-semibold text-sm">Belum ada properti</p>
          {config.canAdd && (
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-sm btn-outline btn-error mt-3 rounded-xl"
            >
              Tambah Properti
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {properties.map(p => (
            <div key={p.id} className="card bg-base-100 shadow hover:shadow-md transition-all border border-red-50 overflow-hidden group">
              <figure className="relative h-32 overflow-hidden">
                <img
                  src={getImageUrl(p.cover_foto) || "https://placehold.co/400x200/7A0000/white?text=Foto"}
                  alt={p.nama_jalan}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={e => e.target.src = "https://placehold.co/400x200/7A0000/white?text=Foto"}
                />
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
                      <button onClick={() => handleEditClick(p)}
                        className="btn btn-xs btn-ghost text-gray-500 hover:bg-gray-100 rounded-lg">
                        <HiOutlinePencil size={12} />
                      </button>
                    )}
                    {config.canDelete && (
                      <button onClick={() => { setDeleteId(p.id); document.getElementById("delete-modal").showModal(); }}
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
          <div className="overflow-x-auto">
          <table className="table table-sm min-w-[40rem]">
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
                      {config.canEdit && <button onClick={() => handleEditClick(p)} className="btn btn-xs btn-ghost text-gray-500 rounded-lg"><HiOutlinePencil size={13} /></button>}
                      {config.canDelete && <button onClick={() => { setDeleteId(p.id); document.getElementById("delete-modal").showModal(); }} className="btn btn-xs btn-ghost text-red-400 rounded-lg"><HiOutlineTrash size={13} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* ─── Modal Form ───────────────────────────────────────── */}
      {showForm && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl rounded-2xl">
            <h3 className="font-bold text-lg text-red-900 mb-4">
              {editItem ? "Edit Properti" : "Tambah Properti Baru"}
            </h3>
            <PropertyForm
              key={editItem?.id || "new"}
              initial={editItem || undefined}
              onSubmit={handleSubmit}
              onCancel={() => { setShowForm(false); setEditItem(null); }}
              loading={saving}
              vendors={vendors}
              marketings={marketings}
              onCreateVendor={handleCreateVendor}
            />
          </div>
          <div className="modal-backdrop" onClick={() => { setShowForm(false); setEditItem(null); }} />
        </div>
      )}

      {/* ─── Modal Hapus ──────────────────────────────────────── */}
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
