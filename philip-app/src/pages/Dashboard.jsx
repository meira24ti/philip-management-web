import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  HiSearch, HiOutlineLocationMarker, HiTag, HiHome,
  HiChevronDown, HiX, HiOutlineEye, HiOutlineShare,
  HiOutlinePhotograph, HiOutlineFilter,
  HiTrendingUp, HiCollection, HiCheckCircle, HiClock,
} from "react-icons/hi";
import { BiFilterAlt } from "react-icons/bi";
import { useAuth } from "../context/AuthContext";
import { propertiService } from "../services/propertiService";

// Konfigurasi role (tetap di luar)
const ROLE_CONFIG = {
  admin:    { canAdd: true,  canEdit: true,  canDelete: true,  canShare: true  },
  marketing:{ canAdd: false, canEdit: false, canDelete: false, canShare: true  },
  direktur: { canAdd: false, canEdit: false, canDelete: false, canShare: false },
};

// Mapping badge & status (tetap di luar)
const badgeClass = { dijual: "badge-error", sewa: "badge-info", "dijual-sewa": "badge-warning" };
const badgeLabel = { dijual: "Dijual", sewa: "Sewa", "dijual-sewa": "Jual/Sewa" };
const unitClass  = { tersedia: "badge-success", terjual: "badge-error", tersewa: "badge-info", dalam_negosiasi: "badge-warning" };
const unitLabel  = { tersedia: "Tersedia", terjual: "Terjual", tersewa: "Tersewa", dalam_negosiasi: "Negosiasi" };

// Komponen Dropdown (tidak berubah)
function Dropdown({ label, options, value, setValue, open, setOpen, closeOthers }) {
  return (
    <div className="relative">
      <button
        onClick={() => { closeOthers(); setOpen(!open); }}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 bg-white text-xs font-semibold text-red-900 hover:bg-red-50 transition-all shadow-sm"
      >
        <span>{value === "Semua" ? label : value}</span>
        <HiChevronDown className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} size={13} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 bg-white border border-red-100 rounded-xl shadow-xl z-30 min-w-36 overflow-hidden">
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => { setValue(opt); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 transition-colors ${
                value === opt ? "text-red-800 font-semibold bg-red-50" : "text-gray-700"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Komponen Card Properti (menerima userRole)
function PropertyCard({ p, userRole }) {
  const config = ROLE_CONFIG[userRole] || {};

  const handleShare = async (id) => {
    try {
      const { shareText, waLink } = await propertiService.getShareText(id);
      await navigator.clipboard.writeText(shareText);
      window.open(waLink, "_blank");
    } catch {
      alert("Gagal menyalin info properti");
    }
  };

  // Harga dan sewa
  const hargaDisplay = p.harga_jual
    ? "Rp " + Number(p.harga_jual).toLocaleString("id-ID")
    : (p.harga_sewa ? "Rp " + Number(p.harga_sewa).toLocaleString("id-ID") + "/thn" : "-");

  return (
    <div className="card bg-base-100 shadow hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden group border border-red-50">
      <figure className="relative h-36 overflow-hidden">
        <img
          src={p.cover_foto || "https://placehold.co/400x240/7A0000/white?text=Foto"}
          alt={p.nama_jalan}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => e.target.src = "https://placehold.co/400x240/7A0000/white?text=Foto"}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          <span className={`badge badge-sm ${badgeClass[p.badge] || "badge-ghost"} text-white`}>
            {badgeLabel[p.badge] || p.jenis_penawaran}
          </span>
        </div>
        <div className="absolute top-2 right-2">
          <span className={`badge badge-sm ${unitClass[p.status_unit]}`}>
            {unitLabel[p.status_unit] || p.status_unit}
          </span>
        </div>
        <div className="absolute bottom-2 left-2">
          <span className="text-[10px] text-white/60 font-mono bg-black/30 px-1.5 py-0.5 rounded">
            {p.no_folder || "-"}
          </span>
        </div>
      </figure>

      <div className="card-body p-3 gap-1">
        <p className="text-[10px] font-bold text-red-700 uppercase tracking-wide leading-tight">
          {p.kategori}{p.subkategori ? ` · ${p.subkategori}` : ""}
        </p>
        <div className="flex items-start gap-1">
          <HiOutlineLocationMarker size={13} className="mt-0.5 shrink-0 text-red-400" />
          <span className="text-xs text-gray-600 leading-tight line-clamp-1">
            {p.nama_jalan}, {p.kota}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <HiTag size={13} className="shrink-0 text-red-500" />
          <p className="text-xs font-bold text-red-900 line-clamp-1">{hargaDisplay}</p>
        </div>
        {p.harga_sewa && p.harga_jual && (
          <p className="text-[10px] text-blue-600 font-medium">
            Sewa: Rp {Number(p.harga_sewa).toLocaleString("id-ID")}/thn
          </p>
        )}
        {(p.luas_tanah || p.kamar_tidur) && (
          <div className="flex gap-1.5 flex-wrap mt-0.5">
            {p.luas_tanah && <span className="badge badge-ghost badge-xs">LT {p.luas_tanah}m²</span>}
            {p.luas_bangunan && <span className="badge badge-ghost badge-xs">LB {p.luas_bangunan}m²</span>}
            {p.kamar_tidur && <span className="badge badge-ghost badge-xs">🛏{p.kamar_tidur}</span>}
            {p.kamar_mandi && <span className="badge badge-ghost badge-xs">🚿{p.kamar_mandi}</span>}
          </div>
        )}
        <div className="divider my-0.5" />
        <div className="card-actions justify-between items-center">
          <Link to={`/property/${p.id}`} className="btn btn-xs btn-outline btn-error rounded-lg gap-1">
            <HiOutlineEye size={12} /> Detail
          </Link>
          <div className="flex gap-1">
            {config.canShare && (
              <button
                onClick={() => handleShare(p.id)}
                className="btn btn-xs btn-ghost text-blue-500 hover:bg-blue-50 rounded-lg"
                title="Salin & Share"
              >
                <HiOutlineShare size={13} />
              </button>
            )}
            <Link to={`/property/${p.id}`} className="btn btn-xs btn-ghost text-gray-400 hover:bg-gray-100 rounded-lg" title="Lihat foto">
              <HiOutlinePhotograph size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENT DASHBOARD ───
export default function Dashboard() {
  const { role } = useAuth();

  // State untuk properti dari API
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatus] = useState("Semua");
  const [typeFilter, setType] = useState("Semua");
  const [locFilter, setLoc] = useState("Semua");
  const [unitFilter, setUnit] = useState("Semua");
  const [statusOpen, setStatusOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [locOpen, setLocOpen] = useState(false);
  const [unitOpen, setUnitOpen] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  // Fetch data dari API
  useEffect(() => {
    propertiService.getAll()
      .then(data => {
        setProperties(data);
        setError("");
      })
      .catch(err => {
        console.error(err);
        setError("Gagal memuat data properti.");
      })
      .finally(() => setLoading(false));
  }, []);

  // Hitung statistik dari properties yang sudah di-fetch
  const stats = [
    { label: "Total Listing", value: properties.length, icon: HiCollection, color: "text-red-700", bg: "bg-red-50" },
    { label: "Tersedia", value: properties.filter(p => p.status_unit === "tersedia").length, icon: HiCheckCircle, color: "text-green-700", bg: "bg-green-50" },
    { label: "Terjual/Tersewa", value: properties.filter(p => ["terjual", "tersewa"].includes(p.status_unit)).length, icon: HiTrendingUp, color: "text-blue-700", bg: "bg-blue-50" },
    { label: "Negosiasi", value: properties.filter(p => p.status_unit === "dalam_negosiasi").length, icon: HiClock, color: "text-amber-700", bg: "bg-amber-50" },
  ];

  // Filter properti
  const filtered = properties.filter(p => {
    const q = search.toLowerCase();
    const matchQ =
      (p.nama_jalan?.toLowerCase().includes(q) || false) ||
      (p.kota?.toLowerCase().includes(q) || false) ||
      (p.kategori?.toLowerCase().includes(q) || false);

    // Karena field 'badge' mungkin tidak ada di API, kita buat mapping dari jenis_penawaran
    const badgeMap = (jenis) => {
      if (jenis === "dijual") return "dijual";
      if (jenis === "sewa") return "sewa";
      if (jenis === "dijual_dan_sewa") return "dijual-sewa";
      return "";
    };
    const badge = badgeMap(p.jenis_penawaran);

    const matchS =
      statusFilter === "Semua" ||
      (statusFilter === "Dijual" && (badge === "dijual" || badge === "dijual-sewa")) ||
      (statusFilter === "Sewa" && (badge === "sewa" || badge === "dijual-sewa"));

    const matchT = typeFilter === "Semua" || p.kategori === typeFilter;
    const matchL = locFilter === "Semua" || p.kota === locFilter;
    const matchU = unitFilter === "Semua" || p.status_unit === unitFilter;

    return matchQ && matchS && matchT && matchL && matchU;
  });

  const activeFilters = [
    statusFilter !== "Semua" && { label: `Penawaran: ${statusFilter}`, clear: () => setStatus("Semua") },
    typeFilter !== "Semua" && { label: `Tipe: ${typeFilter}`, clear: () => setType("Semua") },
    locFilter !== "Semua" && { label: `Kota: ${locFilter}`, clear: () => setLoc("Semua") },
    unitFilter !== "Semua" && { label: `Status: ${unitLabel[unitFilter] || unitFilter}`, clear: () => setUnit("Semua") },
  ].filter(Boolean);

  const closeAll = () => {
    setStatusOpen(false);
    setTypeOpen(false);
    setLocOpen(false);
    setUnitOpen(false);
  };

  // Jika loading, tampilkan spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg text-red-800"></span>
      </div>
    );
  }

  // Jika error
  if (error) {
    return (
      <div className="text-center py-16 text-red-600">
        <p className="font-semibold">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 btn btn-sm btn-outline btn-error"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4" onClick={closeAll}>
      {/* ── Hero ── */}
      <div
        className="relative w-full rounded-2xl overflow-hidden h-44 md:h-52"
        style={{ background: "linear-gradient(135deg,#7A0000 0%,#3D0000 60%,#1a0000 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div
          className="absolute right-0 top-0 w-1/2 h-full opacity-15"
          style={{ background: "radial-gradient(ellipse at right,#ff6b6b,transparent)" }}
        />

        {/* Stats desktop */}
        <div className="absolute top-3 right-3 hidden lg:flex gap-2">
          {stats.map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl px-3 py-2 text-center min-w-[68px] shadow-sm`}>
              <p className={`text-lg font-bold leading-tight ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-500 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="relative z-10 flex flex-col justify-center h-full px-6 md:px-10 max-w-lg">
          <p className="text-red-300 text-[10px] font-semibold uppercase tracking-widest mb-1">
            Philip Real Estate · Pekanbaru
          </p>
          <h1 className="text-white text-2xl md:text-3xl font-bold leading-tight font-serif">
            Build Your Future<br />
            <span className="italic font-normal text-red-300">with us</span>
          </h1>
          <p className="text-red-200 text-xs mt-2">Mulai langkah besar dari keputusan hari ini.</p>
        </div>
      </div>

      {/* ── Stats mobile ── */}
      <div className="grid grid-cols-4 gap-2 lg:hidden">
        {stats.map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-2 text-center`}>
            <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-500 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Search & Filter ── */}
      <div
        className="bg-white rounded-2xl border border-red-100 shadow-sm p-3 md:p-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex gap-2 items-center">
          <label className="input input-bordered input-sm flex-1 flex items-center gap-2 rounded-xl border-red-100 focus-within:border-red-300 focus-within:outline-red-200">
            <HiSearch className="text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Cari alamat, tipe, kota..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="grow text-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600">
                <HiX size={14} />
              </button>
            )}
          </label>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`btn btn-sm rounded-xl gap-1.5 ${
              showFilter
                ? "btn-error text-white"
                : "btn-outline border-red-200 text-red-800 hover:bg-red-50 hover:border-red-300"
            }`}
          >
            <HiOutlineFilter size={15} />
            <span className="hidden sm:inline text-xs">Filter</span>
            {activeFilters.length > 0 && (
              <span className="badge badge-xs badge-warning">{activeFilters.length}</span>
            )}
          </button>
        </div>

        {showFilter && (
          <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-red-50">
            <div className="flex items-center gap-1 text-red-700">
              <BiFilterAlt size={14} />
              <span className="text-[11px] font-bold uppercase tracking-wide">Filter:</span>
            </div>
            <Dropdown
              label="Penawaran"
              options={["Semua", "Dijual", "Sewa"]}
              value={statusFilter}
              setValue={setStatus}
              open={statusOpen}
              setOpen={setStatusOpen}
              closeOthers={() => { setTypeOpen(false); setLocOpen(false); setUnitOpen(false); }}
            />
            <Dropdown
              label="Tipe"
              options={["Semua", "Rumah", "Ruko", "Tanah", "Gudang", "Villa", "Kios"]}
              value={typeFilter}
              setValue={setType}
              open={typeOpen}
              setOpen={setTypeOpen}
              closeOthers={() => { setStatusOpen(false); setLocOpen(false); setUnitOpen(false); }}
            />
            <Dropdown
              label="Kota"
              options={["Semua", "Pekanbaru", "Kampar", "Siak", "Pelalawan"]}
              value={locFilter}
              setValue={setLoc}
              open={locOpen}
              setOpen={setLocOpen}
              closeOthers={() => { setStatusOpen(false); setTypeOpen(false); setUnitOpen(false); }}
            />
            <Dropdown
              label="Status Unit"
              options={["Semua", "tersedia", "terjual", "tersewa", "dalam_negosiasi"]}
              value={unitFilter}
              setValue={setUnit}
              open={unitOpen}
              setOpen={setUnitOpen}
              closeOthers={() => { setStatusOpen(false); setTypeOpen(false); setLocOpen(false); }}
            />
            {activeFilters.length > 0 && (
              <button
                onClick={() => {
                  setStatus("Semua");
                  setType("Semua");
                  setLoc("Semua");
                  setUnit("Semua");
                }}
                className="text-xs text-red-400 hover:text-red-600 font-semibold underline"
              >
                Reset
              </button>
            )}
          </div>
        )}

        {activeFilters.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-2">
            {activeFilters.map(f => (
              <span key={f.label} className="badge badge-sm bg-red-100 text-red-800 border-red-200 gap-1">
                {f.label}
                <button onClick={f.clear}><HiX size={11} /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Grid Properti ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-red-900">
            Daftar Properti
            {activeFilters.length > 0 && (
              <span className="text-red-300 font-normal text-sm ml-1">(difilter)</span>
            )}
          </h2>
          <span className="badge badge-ghost text-red-400 font-semibold">
            {filtered.length} properti
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <HiHome size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-sm">Properti tidak ditemukan</p>
            <p className="text-xs mt-1">Coba ubah filter atau kata kunci pencarian</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {filtered.map(p => (
              <PropertyCard key={p.id} p={p} userRole={role} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}