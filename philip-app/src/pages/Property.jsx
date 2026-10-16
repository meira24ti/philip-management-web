import Modal from "../components/Modal";
// philip-app/src/pages/Property.jsx — halaman CRUD properti lengkap
import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useToast } from "../components/ToastContext";
import { propertiService } from "../services/propertiService";
import { getImageUrl } from "../utils/imageUrl";
import PropertyPhotoUpload from "../components/PropertyPhotoUpload";
import { getOfferBadgeClass, getOfferLabel } from "../utils/propertyLabels";
import {
  PROPERTY_TYPE_OPTIONS,
  getPropertySubtypeLabel,
  getPropertyTypeLabel,
  isRumahCluster,
  normalizePropertyType,
} from "../utils/propertyTypes";
import {
  HiOutlinePlus, HiOutlineEye, HiOutlineShare, HiOutlinePencil,
  HiOutlineTrash, HiSearch, HiX,
  HiOutlineViewGrid, HiOutlineViewList, HiOutlineLocationMarker, HiTag,
} from "react-icons/hi";
import { BiFilterAlt } from "react-icons/bi";

// ─── ROLE CONFIG ──────────────────────────────────────────────
const ROLE_CONFIG = {
  admin: { canAdd: true, canEdit: true, canDelete: true, canShare: true },
  marketing: { canAdd: false, canEdit: false, canDelete: false, canShare: true },
  direktur: { canAdd: false, canEdit: false, canDelete: false, canShare: false },
};

const subkategoriLabel = getPropertySubtypeLabel;
const kategoriLabel = getPropertyTypeLabel;

const unitClass = {
  tersedia: "badge-success",
  terjual: "border-0 bg-yellow-400 text-yellow-950",
  tersewa: "border-0 bg-yellow-400 text-yellow-950",
  negosiasi: "badge-warning"
};
const unitLabel = {
  tersedia: "Tersedia",
  terjual: "Terjual",
  tersewa: "Tersewa",
  negosiasi: "Negosiasi"
};

const FORM_LABEL_CLASS = "text-xs font-semibold text-gray-600";

function FieldLabel({ children, required = false }) {
  return (
    <span className={FORM_LABEL_CLASS}>
      {children}
      {required ? <span className="text-error"> *</span> : <span className="font-normal text-gray-600"> (Opsional)</span>}
    </span>
  );
}

// ── FORM ──────────────────────────────────────────────────────
function PropertyForm({ initial, onSubmit, onCancel, loading, marketings }) {
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
    daya_listrik: "",
    sumber_air: "",
    sertifikat: "",
    keamanan: "",
    daftar_bonus: "",
    akses_fasilitas: "",
    keterangan: "",
    spanduk: false,
    kunci: false,
    status_unit: "tersedia",
    kategori: "rumah",
    subkategori: "",
    kategori_kombinasi_1: "",
    kategori_kombinasi_2: "",
    id_vendor: "",
    nama_vendor: "",
    vendor_hp: "",
    listed_by: "",
    gmaps_url: "",
    latitude: "",
    longtitude: "",
  });

  const [form, setForm] = useState(() => ({
    ...getDefaultForm(),
    ...Object.fromEntries(Object.entries(initial || {}).map(([key, value]) => [key, value ?? ""])),
    no_folder: initial?.no_folder || "",
    kategori: isRumahCluster(initial?.kategori, initial?.subkategori)
      ? "rumah_cluster"
      : (normalizePropertyType(initial?.kategori) || "rumah"),
    subkategori: subkategoriLabel(initial?.subkategori),
    tanggal_listing: initial?.tanggal_listing ? String(initial.tanggal_listing).slice(0, 10) : "",
  }));
  const [fotos, setFotos] = useState([]);
  const [cropping, setCropping] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cropping) onSubmit(form, fotos);
  };

  const inputCls = "input input-bordered input-sm w-full rounded-xl";
  const selectCls = "select select-bordered select-sm w-full rounded-xl";

  return (
    <form onSubmit={handleSubmit} className="property-form space-y-6">
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <span className="font-bold text-error">*</span> wajib diisi. Kolom bertanda <span className="font-semibold">(Opsional)</span> boleh dikosongkan.
      </p>
      {/* ─── Identitas ─────────────────────────────────────────── */}
      <div>
        <p className="text-sm font-bold text-red-900 mb-2">Identitas Unit</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="form-control">
            <div className="label py-0.5"><FieldLabel>No. Folder</FieldLabel></div>
            <input className={inputCls} value={form.no_folder}
              onChange={e => set("no_folder", e.target.value)} placeholder="PRE-001" />
          </label>
          <label className="form-control">
            <div className="label py-0.5"><FieldLabel required>Tanggal Listing</FieldLabel></div>
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
            <div className="label py-0.5"><FieldLabel required>Kategori</FieldLabel></div>
            <select className={selectCls} value={form.kategori}
              onChange={e => setForm(f => ({ ...f, kategori: e.target.value, kategori_kombinasi_1: "", kategori_kombinasi_2: "" }))} required>
              {PROPERTY_TYPE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="form-control">
            <div className="label py-0.5"><FieldLabel>Subkategori</FieldLabel></div>
            <select className={selectCls} value={form.subkategori}
              onChange={e => set("subkategori", e.target.value)}>
              <option value="">Pilih subkategori</option>
              {["Biasa", "Mewah", "2 Lantai", "2.5 Lantai", "3 Lantai", "Gandeng", "Kavling", "Second/Bekas"]
                .map(s => <option key={s}>{s}</option>)}
            </select>
          </label>
        </div>
      </div>

      {/* ─── Vendor & Marketing ───────────────────────────────── */}
      {form.kategori === "kombinasi" && <div className="grid grid-cols-1 gap-3 rounded-xl border border-red-200 bg-red-50 p-3 sm:grid-cols-2">
        {[1, 2].map(index => <label key={index} className="form-control">
          <div className="label py-0.5"><FieldLabel required>Jenis kombinasi {index}</FieldLabel></div>
          <select className={selectCls} value={form[`kategori_kombinasi_${index}`] || ""} required
            onChange={event => set(`kategori_kombinasi_${index}`, event.target.value)}>
            <option value="">Pilih jenis properti</option>
            {PROPERTY_TYPE_OPTIONS.filter(option => option.value !== "kombinasi").map(option =>
              <option key={option.value} value={option.value} disabled={option.value === form[`kategori_kombinasi_${index === 1 ? 2 : 1}`]}>{option.label}</option>)}
          </select>
        </label>)}
      </div>}
      <div>
        <p className="text-sm font-bold text-red-900 mb-2">Data Vendor & Marketing</p>
        <div className="grid grid-cols-1 gap-3">
          <label className="form-control">
            <div className="label py-0.5"><FieldLabel required>Vendor / Pemilik Properti</FieldLabel></div>
            <input className={inputCls} value={form.nama_vendor} onChange={e => set("nama_vendor", e.target.value)} placeholder="Nama lengkap pemilik" required />
          </label>
          <label className="form-control">
            <div className="label py-0.5 mt-1"><FieldLabel required>Nomor HP Vendor</FieldLabel></div>
            <input type="tel" className={inputCls} value={form.vendor_hp} onChange={e => set("vendor_hp", e.target.value)} placeholder="Nomor HP vendor" required />
          </label>

          <label className="form-control">
            <div className="label py-0.5"><FieldLabel required>Listing oleh (Marketing)</FieldLabel></div>
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
            <div className="label py-0.5"><FieldLabel required>Nama Jalan / Alamat</FieldLabel></div>
            <input className={inputCls} value={form.nama_jalan}
              onChange={e => set("nama_jalan", e.target.value)} placeholder="Jl. Sudirman No. 10" required />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="form-control">
              <div className="label py-0.5"><FieldLabel>Area / Kecamatan</FieldLabel></div>
              <input className={inputCls} value={form.area_kecamatan}
                onChange={e => set("area_kecamatan", e.target.value)} placeholder="Tampan" />
            </label>
            <label className="form-control">
              <div className="label py-0.5"><FieldLabel required>Kota</FieldLabel></div>
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
            <div className="label py-0.5"><FieldLabel required>Jenis Penawaran</FieldLabel></div>
            <select className={selectCls} value={form.jenis_penawaran}
              onChange={e => set("jenis_penawaran", e.target.value)} required>
              <option value="dijual">Dijual</option>
              <option value="disewa">Disewakan</option>
              <option value="dijual_dan_disewa">Dijual & Disewakan</option>
            </select>
          </label>
          {(form.jenis_penawaran === "dijual" || form.jenis_penawaran === "dijual_dan_disewa") && (
            <label className="form-control">
              <div className="label py-0.5"><FieldLabel required>Harga Jual (Rp)</FieldLabel></div>
              <input type="number" className={inputCls} value={form.harga_jual}
                onChange={e => set("harga_jual", e.target.value)} placeholder="1500000000" required />
            </label>
          )}
          {(form.jenis_penawaran === "disewa" || form.jenis_penawaran === "dijual_dan_disewa") && (
            <label className="form-control">
              <div className="label py-0.5"><FieldLabel required>Harga Sewa/Thn (Rp)</FieldLabel></div>
              <input type="number" className={inputCls} value={form.harga_sewa}
                onChange={e => set("harga_sewa", e.target.value)} placeholder="30000000" required />
            </label>
          )}
        </div>
      </div>

      {/* ─── Ukuran ────────────────────────────────────────────── */}
      <div>
        <p className="text-sm font-bold text-red-900 mb-2">Ukuran</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="form-control">
            <div className="label py-0.5"><FieldLabel>Luas Tanah m²</FieldLabel></div>
            <input type="number" className={inputCls} value={form.luas_tanah}
              onChange={e => set("luas_tanah", e.target.value)} />
          </label>
          <label className="form-control">
            <div className="label py-0.5"><FieldLabel>Luas Bangunan m²</FieldLabel></div>
            <input type="number" className={inputCls} value={form.luas_bangunan}
              onChange={e => set("luas_bangunan", e.target.value)} />
          </label>
          <label className="form-control">
            <div className="label py-0.5"><FieldLabel>Kamar Tidur</FieldLabel></div>
            <input type="number" min="0" className={inputCls} value={form.kamar_tidur}
              onChange={e => set("kamar_tidur", e.target.value)} />
          </label>
          <label className="form-control">
            <div className="label py-0.5"><FieldLabel>Kamar Mandi</FieldLabel></div>
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
            ["daya_listrik", "Daya Listrik", ["900 Watt", "1.300 Watt", "2.200 Watt", "3.500 Watt", "4.400 Watt", "5.500 Watt", "Lebih dari 5.500 Watt"]],
            ["sumber_air", "Sumber Air", ["PDAM", "Sumur Bor", "Sumur Galian", "PDAM + Sumur Bor"]],
            ["sertifikat", "Sertifikat", ["SHM", "SHGB", "AJB", "PPJB", "Girik/Letter C", "HGB Induk", "Lainnya"]],
            ["keamanan", "Keamanan", ["Tidak ada", "Security 24 jam", "One Gate System", "CCTV", "Security + One Gate"]],
          ].map(([key, label, opts]) => (
            <label key={key} className="form-control">
              <div className="label py-0.5"><FieldLabel>{label}</FieldLabel></div>
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
            <div className="label py-0.5"><FieldLabel>Daftar Bonus</FieldLabel></div>
            <textarea className="textarea textarea-bordered textarea-sm w-full rounded-xl" rows={2}
              value={form.daftar_bonus} onChange={e => set("daftar_bonus", e.target.value)}
              placeholder="Kitchen Set, Mesin Air, Kanopi, ..." />
          </label>
          <label className="form-control">
            <div className="label py-0.5"><FieldLabel>Akses Fasilitas Terdekat</FieldLabel></div>
            <textarea className="textarea textarea-bordered textarea-sm w-full rounded-xl" rows={2}
              value={form.akses_fasilitas} onChange={e => set("akses_fasilitas", e.target.value)}
              placeholder="Sekolah, RS, Mall, SPBU, ..." />
          </label>
          <label className="form-control">
            <div className="label py-0.5"><FieldLabel>Keterangan Tambahan</FieldLabel></div>
            <textarea className="textarea textarea-bordered textarea-sm w-full rounded-xl" rows={2}
              value={form.keterangan} onChange={e => set("keterangan", e.target.value)} />
          </label>
        </div>
      </div>

      {/* ─── Status Operasional ───────────────────────────────── */}
      <div>
        <p className="text-sm font-bold text-red-900 mb-2">Status Operasional</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[["spanduk", "Spanduk Terpasang"], ["kunci", "Kunci Dititip"]].map(([k, l]) => (
            <label key={k} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="toggle toggle-sm toggle-success"
                checked={!!form[k]} onChange={e => set(k, e.target.checked)} />
              <span className="text-sm text-gray-600">{l}</span>
            </label>
          ))}
        </div>
        <div className="mt-3">
          <label className="form-control">
            <div className="label py-0.5"><FieldLabel required>Status Unit</FieldLabel></div>
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
        <p className="text-sm font-bold text-red-900 mb-2">Foto Properti <span className="text-xs font-normal text-gray-600">(Opsional)</span></p>
        <PropertyPhotoUpload onChange={setFotos} onBusyChange={setCropping} existingCount={initial?.foto_properti?.length || 0} />
      </div>

      {/* ─── Google Maps ──────────────────────────────────────── */}
      <div>
        <p className="text-sm font-bold text-red-900 mb-2">Lokasi Google Maps</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="hidden">
            <div className="label py-0.5"><FieldLabel>Latitude</FieldLabel></div>
            <input className={inputCls} value={form.latitude}
              onChange={e => set("latitude", e.target.value)} placeholder="-0.5071" />
          </label>
          <label className="hidden">
            <div className="label py-0.5"><FieldLabel>Longitude</FieldLabel></div>
            <input className={inputCls} value={form.longtitude}
              onChange={e => set("longtitude", e.target.value)} placeholder="101.4478" />
          </label>
          <label className="form-control col-span-1 sm:col-span-2">
            <div className="label py-0.5"><FieldLabel>Link Google Maps</FieldLabel></div>
            <input className={inputCls} value={form.gmaps_url}
              onChange={e => set("gmaps_url", e.target.value)} placeholder="https://maps.google.com/..." />
          </label>
        </div>
      </div>

      {/* ─── Tombol ───────────────────────────────────────────── */}
      <div className="dialog-actions property-form-actions">
        <button type="button" onClick={onCancel}
          className="btn btn-sm btn-ghost rounded-xl">Batal</button>
        <button type="submit" disabled={loading || cropping}
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
  const { editId } = useParams();
  const navigate = useNavigate();
  const config = ROLE_CONFIG[role] || {};

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const activeFilterCount = [filterKategori, filterJenis, filterStatusUnit, filterKota, filterDari, filterSampai, filterHargaMin, filterHargaMax, filterLtMin, filterLtMax].filter(Boolean).length;

  // ─── State untuk dropdown vendor & marketing ────────────────
  const [marketings, setMarketings] = useState([]);

  // The detail page opens this same form through /property/edit/:editId.
  // Loading the complete record here keeps direct URLs and browser refreshes
  // working just like editing from the property list.
  useEffect(() => {
    if (!editId) return undefined;

    if (!config.canEdit) {
      showToast("Anda tidak memiliki akses untuk mengedit properti", "error");
      navigate("/property", { replace: true });
      return undefined;
    }

    let isActive = true;
    propertiService.getById(editId)
      .then((fullData) => {
        if (!isActive) return;
        setEditItem(fullData);
        setShowForm(true);
      })
      .catch(() => {
        if (!isActive) return;
        showToast("Gagal memuat data properti untuk diedit", "error");
        navigate("/property", { replace: true });
      });

    return () => {
      isActive = false;
    };
  }, [config.canEdit, editId, navigate, showToast]);

  // ─── Load data vendor & marketing ──────────────────────────
  const loadVendorsAndMarketings = useCallback(async () => {
    if (!config.canEdit) return;
    try {
      const m = await propertiService.getMarketings();
      setMarketings(m);
    } catch {
      // Jika gagal load, tetap bisa lanjut (dropdown kosong)
    }
  }, [config.canEdit]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadVendorsAndMarketings();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadVendorsAndMarketings]);

  // ─── Load data properti ──────────────────────────────────────
  const requestNumber = useRef(0);
  const loadData = useCallback(async (searchTerm = "", kat = "", dari = "", sampai = "", hMin = "", hMax = "", jenis = "", statusUnit = "", kota = "", ltMin = "", ltMax = "") => {
    const currentRequest = ++requestNumber.current;
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
      if (currentRequest !== requestNumber.current) return;
      setProperties(
        kat === "rumah_cluster"
          ? data.filter((item) => isRumahCluster(item.kategori, item.subkategori))
          : data
      );
    } catch {
      if (currentRequest === requestNumber.current) showToast("Gagal memuat data properti", "error");
    } finally {
      if (currentRequest === requestNumber.current) setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData(debouncedSearch, filterKategori, filterDari, filterSampai, filterHargaMin, filterHargaMax, filterJenis, filterStatusUnit, filterKota, filterLtMin, filterLtMax);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData, debouncedSearch, filterKategori, filterDari, filterSampai, filterHargaMin, filterHargaMax, filterJenis, filterStatusUnit, filterKota, filterLtMin, filterLtMax]);

  // ─── Bersihkan data form sebelum kirim ──────────────────────
  function cleanFormData(formData) {
    const clean = { ...formData };
    delete clean.feed;
    const numberFields = [
      'harga_jual', 'harga_sewa', 'luas_tanah', 'luas_bangunan',
      'kamar_tidur', 'kamar_mandi'
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
      let savedPropertyId = null;

      // Konversi boolean ke "1"/"0" untuk FormData
      const processedData = {
        ...formData,
        spanduk:     formData.spanduk     ? "1" : "0",
        kunci:       formData.kunci       ? "1" : "0",
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
        // Sertakan foto baru saat edit. Service akan memakai multipart hanya
        // bila ada file, sehingga edit tanpa foto tetap mengirim JSON biasa.
        await propertiService.update(propertiId, payload, fotoFiles);
        savedPropertyId = propertiId;
        showToast("Properti berhasil diperbarui");
      } else {
        // Tambah baru: pakai FormData untuk upload foto
        await propertiService.create(payload, fotoFiles);
        showToast("Properti berhasil ditambahkan");
      }

      setShowForm(false);
      setEditItem(null);
      await loadData(debouncedSearch, filterKategori, filterDari, filterSampai, filterHargaMin, filterHargaMax, filterJenis, filterStatusUnit, filterKota, filterLtMin, filterLtMax);
      if (savedPropertyId && editId) {
        navigate(`/property/${savedPropertyId}`, { replace: true });
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Gagal menyimpan properti", "error");
    } finally {
      setSaving(false);
    }
  }

  // ─── Tambah vendor baru ──────────────────────────────────────


  // ─── Hapus properti ──────────────────────────────────────────
  async function handleDelete(id) {
    try {
      await propertiService.remove(id);
      showToast("Properti berhasil dihapus");
      setDeleteId(null);
      document.getElementById("delete-modal").close();
      await loadData(debouncedSearch, filterKategori, filterDari, filterSampai, filterHargaMin, filterHargaMax, filterJenis, filterStatusUnit, filterKota, filterLtMin, filterLtMax);
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
      window.open(waLink, "_blank", "noopener,noreferrer");
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
      <div className="rounded-2xl border border-red-100 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2">
        <label className="input input-bordered input-sm flex min-w-0 w-full sm:w-auto flex-1 items-center gap-2 rounded-xl border-red-100">
          <HiSearch className="text-gray-600" size={16} />
          <input
            type="text"
            placeholder="Cari properti..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="grow text-sm"
          />
          {search && (
            <button aria-label="Hapus pencarian" onClick={() => setSearch("")}>
              <HiX size={14} className="text-gray-600" />
            </button>
          )}
        </label>

        <button
          type="button"
          onClick={() => setFilterPanelOpen((open) => !open)}
          aria-label="Filter properti"
          aria-expanded={filterPanelOpen}
          className={`btn btn-sm shrink-0 rounded-xl border-red-200 ${filterPanelOpen || activeFilterCount ? "bg-red-50 text-red-800" : "btn-outline text-red-800 hover:bg-red-50"}`}
        >
          <BiFilterAlt size={16} />
          <span className="hidden sm:inline">Filter</span>
          {activeFilterCount > 0 && <span className="badge badge-sm border-0 bg-red-800 text-white">{activeFilterCount}</span>}
        </button>
        <div className="ml-auto flex shrink-0 gap-1">
          <button onClick={() => setViewMode("grid")} className={`btn btn-sm rounded-xl ${viewMode === "grid" ? "btn-error text-white" : "btn-ghost text-gray-600"}`} aria-label="Tampilan grid"><HiOutlineViewGrid size={16} /></button>
          <button onClick={() => setViewMode("list")} className={`btn btn-sm rounded-xl ${viewMode === "list" ? "btn-error text-white" : "btn-ghost text-gray-600"}`} aria-label="Tampilan daftar"><HiOutlineViewList size={16} /></button>
        </div>
        </div>

        {filterPanelOpen && <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-red-100 bg-red-50/40 p-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="flex items-center justify-between gap-3 pb-1 sm:col-span-2 lg:col-span-5">
          <p className="text-xs font-medium text-gray-600">Pilih kriteria yang diperlukan. Filter dapat dikombinasikan.</p>
          {activeFilterCount > 0 && <span className="shrink-0 text-xs font-semibold text-red-700">{activeFilterCount} aktif</span>}
        </div>

        {/* ─── Filter Kategori ─────────────────────────────────── */}
        <select
          className="select select-bordered select-sm rounded-xl border-red-100 bg-white w-full sm:w-auto"
          aria-label="Filter kategori properti"
          value={filterKategori}
          onChange={e => setFilterKategori(e.target.value)}
        >
          <option value="">Semua Kategori</option>
          {PROPERTY_TYPE_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <select className="select select-bordered select-sm w-full rounded-xl border-red-100 bg-white sm:w-auto" aria-label="Filter jenis penawaran" value={filterJenis} onChange={e => setFilterJenis(e.target.value)}>
          <option value="">Semua Penawaran</option>
          <option value="dijual">Dijual</option>
          <option value="disewa">Disewakan</option>
          <option value="dijual_dan_disewa">Dijual &amp; Disewakan</option>
        </select>

        <select className="select select-bordered select-sm w-full rounded-xl border-red-100 bg-white sm:w-auto" aria-label="Filter status unit" value={filterStatusUnit} onChange={e => setFilterStatusUnit(e.target.value)}>
          <option value="">Semua Status Unit</option>
          <option value="tersedia">Tersedia</option>
          <option value="negosiasi">Negosiasi</option>
          <option value="terjual">Terjual</option>
          <option value="tersewa">Tersewa</option>
        </select>

        <select className="select select-bordered select-sm w-full rounded-xl border-red-100 bg-white sm:w-auto" aria-label="Filter kota" value={filterKota} onChange={e => setFilterKota(e.target.value)}>
          <option value="">Semua Kota</option>
          <option value="Pekanbaru">Pekanbaru</option>
          <option value="Kampar">Kampar</option>
          <option value="Siak">Siak</option>
          <option value="Pelalawan">Pelalawan</option>
        </select>

        {/* ─── Filter Tanggal Dari ─────────────────────────────── */}
        <label className="flex flex-col gap-1 text-[11px] font-semibold text-gray-600">
          Dari tanggal listing
        <input
          type="date"
          className="input input-bordered input-sm rounded-xl border-red-100 bg-white w-full sm:w-auto"
          value={filterDari}
          onChange={e => setFilterDari(e.target.value)}
          placeholder="Dari tanggal"
          title="Dari tanggal"
        />
        </label>

        {/* ─── Filter Tanggal Sampai ───────────────────────────── */}
        <label className="flex flex-col gap-1 text-[11px] font-semibold text-gray-600">
          Sampai tanggal listing
        <input
          type="date"
          className="input input-bordered input-sm rounded-xl border-red-100 bg-white w-full sm:w-auto"
          value={filterSampai}
          onChange={e => setFilterSampai(e.target.value)}
          placeholder="Sampai tanggal"
          title="Sampai tanggal"
        />
        </label>

        {/* ─── Filter Harga Min ────────────────────────────────── */}
        <input
          type="number"
          className="input input-bordered input-sm rounded-xl border-red-100 bg-white w-full sm:w-32"
          value={filterHargaMin}
          onChange={e => setFilterHargaMin(e.target.value)}
          placeholder="Harga min"
          title="Harga minimum (Rp)"
        />

        {/* ─── Filter Harga Max ────────────────────────────────── */}
        <input
          type="number"
          className="input input-bordered input-sm rounded-xl border-red-100 bg-white w-full sm:w-32"
          value={filterHargaMax}
          onChange={e => setFilterHargaMax(e.target.value)}
          placeholder="Harga max"
          title="Harga maksimum (Rp)"
        />

        <input type="number" className="input input-bordered input-sm w-full rounded-xl border-red-100 sm:w-32" value={filterLtMin} onChange={e => setFilterLtMin(e.target.value)} placeholder="LT min (m²)" title="Luas tanah minimum" />
        <input type="number" className="input input-bordered input-sm w-full rounded-xl border-red-100 sm:w-32" value={filterLtMax} onChange={e => setFilterLtMax(e.target.value)} placeholder="LT max (m²)" title="Luas tanah maksimum" />

        {(filterKategori || filterJenis || filterStatusUnit || filterKota || filterDari || filterSampai || filterHargaMin || filterHargaMax || filterLtMin || filterLtMax || search) && (
          <button onClick={() => { setSearch(""); setFilterKategori(""); setFilterJenis(""); setFilterStatusUnit(""); setFilterKota(""); setFilterDari(""); setFilterSampai(""); setFilterHargaMin(""); setFilterHargaMax(""); setFilterLtMin(""); setFilterLtMax(""); }} className="btn btn-sm btn-ghost justify-self-start rounded-xl text-red-700 sm:col-span-2 lg:col-span-5">
            Reset Filter
          </button>
        )}

        </div>}
      </div>

      {/* ─── Grid / List ──────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg text-red-800" />
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
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
                <img loading="lazy" decoding="async"
                  src={getImageUrl(p.cover_foto) || "https://placehold.co/400x200/7A0000/white?text=Foto"}
                  alt={p.nama_jalan}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={e => e.target.src = "https://placehold.co/400x200/7A0000/white?text=Foto"}
                />
                <div className="absolute top-2 left-2">
                  <span className={`badge badge-sm gap-1 ${getOfferBadgeClass(p.jenis_penawaran)}`}>
                    <HiTag size={11} aria-hidden="true" />
                    {getOfferLabel(p.jenis_penawaran)}
                  </span>
                </div>
                <div className="absolute top-2 right-2">
                  <span className={`badge badge-sm ${unitClass[p.status_unit]}`}>{unitLabel[p.status_unit]}</span>
                </div>
              </figure>
              <div className="card-body p-3 gap-1">
                <p className="text-[10px] font-bold text-red-700 uppercase">{kategoriLabel(p.kategori, p.subkategori, p.kategori_kombinasi_1, p.kategori_kombinasi_2)} {subkategoriLabel(p.subkategori)}</p>
                <div className="flex items-start gap-1">
                  <HiOutlineLocationMarker size={12} className="text-red-700 mt-0.5 shrink-0" />
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
                      <button aria-label="Bagikan properti" onClick={() => handleShare(p.id)}
                        className="btn btn-xs btn-ghost text-blue-500 hover:bg-blue-50 rounded-lg">
                        <HiOutlineShare size={12} />
                      </button>
                    )}
                    {config.canEdit && (
                      <button aria-label="Edit properti" onClick={() => handleEditClick(p)}
                        className="btn btn-xs btn-ghost text-gray-500 hover:bg-gray-100 rounded-lg">
                        <HiOutlinePencil size={12} />
                      </button>
                    )}
                    {config.canDelete && (
                      <button aria-label="Hapus properti" onClick={() => { setDeleteId(p.id); document.getElementById("delete-modal").showModal(); }}
                        className="btn btn-xs btn-ghost text-red-700 hover:bg-red-50 rounded-lg">
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
                    <p className="text-xs text-gray-600">{p.kota}</p>
                  </td>
                  <td><span className="text-xs text-gray-600">{kategoriLabel(p.kategori, p.subkategori, p.kategori_kombinasi_1, p.kategori_kombinasi_2)}</span></td>
                  <td><span className="text-xs font-bold text-red-800">{p.harga_jual ? "Rp " + Number(p.harga_jual).toLocaleString("id-ID") : "-"}</span></td>
                  <td><span className={`badge badge-sm ${unitClass[p.status_unit]}`}>{unitLabel[p.status_unit]}</span></td>
                  <td>
                    <div className="flex gap-1 justify-end">
                      <Link to={`/property/${p.id}`} className="btn btn-xs btn-ghost text-red-600 rounded-lg"><HiOutlineEye size={13} /></Link>
                      {config.canShare && <button aria-label="Bagikan properti" onClick={() => handleShare(p.id)} className="btn btn-xs btn-ghost text-blue-500 rounded-lg"><HiOutlineShare size={13} /></button>}
                      {config.canEdit && <button aria-label="Edit properti" onClick={() => handleEditClick(p)} className="btn btn-xs btn-ghost text-gray-500 rounded-lg"><HiOutlinePencil size={13} /></button>}
                      {config.canDelete && <button aria-label="Hapus properti" onClick={() => { setDeleteId(p.id); document.getElementById("delete-modal").showModal(); }} className="btn btn-xs btn-ghost text-red-700 rounded-lg"><HiOutlineTrash size={13} /></button>}
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
        <Modal label={editItem ? "Edit Properti" : "Tambah Properti"} busy={saving} onClose={() => { setShowForm(false); setEditItem(null); if (editId) navigate(`/property/${editId}`, { replace: true }); }}>
          <div className="modal-box property-dialog max-w-3xl rounded-2xl">
            <h3 className="font-bold text-lg text-red-900 mb-4">
              {editItem ? "Edit Properti" : "Tambah Properti Baru"}
            </h3>
            <PropertyForm
              key={editItem?.id || "new"}
              initial={editItem || undefined}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditItem(null);
                if (editId) navigate(`/property/${editId}`, { replace: true });
              }}
              loading={saving}
              marketings={marketings}
            />
          </div>
          <div
            className="modal-backdrop"
            onClick={() => {
              setShowForm(false);
              setEditItem(null);
              if (editId) navigate(`/property/${editId}`, { replace: true });
            }}
          />
        </Modal>
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
