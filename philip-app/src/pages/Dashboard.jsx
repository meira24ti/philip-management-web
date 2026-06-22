import { useState } from "react";
import { Link } from "react-router-dom";
import {
  HiSearch, HiOutlineLocationMarker, HiTag, HiHome,
  HiChevronDown, HiX, HiOutlineEye, HiOutlineShare,
  HiOutlinePhotograph, HiOutlineFilter, HiOutlineOfficeBuilding,
  HiTrendingUp, HiCollection, HiCheckCircle, HiClock,
} from "react-icons/hi";
import { BiFilterAlt } from "react-icons/bi";

const CURRENT_ROLE = "admin"; // "admin" | "marketing" | "direktur"
const ROLE_CONFIG = {
  admin:    { canAdd: true,  canEdit: true,  canDelete: true,  canShare: true  },
  marketing:{ canAdd: false, canEdit: false, canDelete: false, canShare: true  },
  direktur: { canAdd: false, canEdit: false, canDelete: false, canShare: false },
};

const properties = [
  { id:1, noFolder:"PRE-001", status:"DIJUAL RUMAH",           address:"Jl. Limbungan",        kota:"Pekanbaru", price:"Rp 7.000.000.000", priceRent:null,                lt:300, lb:250, kt:5, km:4, image:"https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&q=80", kategori:"Rumah",  subkategori:"Mewah",    badge:"dijual",      statusUnit:"tersedia",        sertifikat:"SHM",  listedBy:"Rina Wati"   },
  { id:2, noFolder:"PRE-002", status:"DIJUAL RUMAH",           address:"Komp. Damai Langgeng", kota:"Pekanbaru", price:"Rp 850.000.000",   priceRent:null,                lt:120, lb:90,  kt:3, km:2, image:"https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&q=80", kategori:"Rumah",  subkategori:"Cluster",  badge:"dijual",      statusUnit:"tersedia",        sertifikat:"SHM",  listedBy:"Rina Wati"   },
  { id:3, noFolder:"PRE-003", status:"DIJUAL/DISEWAKAN RUMAH", address:"Jl. Pramuka",          kota:"Pekanbaru", price:"Rp 2.000.000.000", priceRent:"Rp 50jt/thn",      lt:200, lb:180, kt:4, km:3, image:"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80", kategori:"Rumah",  subkategori:"2 Lantai", badge:"dijual-sewa", statusUnit:"tersedia",        sertifikat:"SHM",  listedBy:"Budi S"      },
  { id:4, noFolder:"PRE-004", status:"DIJUAL RUMAH",           address:"Jl. Melur Permai",     kota:"Pekanbaru", price:"Rp 1.050.000.000", priceRent:null,                lt:150, lb:120, kt:3, km:2, image:"https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=400&q=80", kategori:"Rumah",  subkategori:"Biasa",    badge:"dijual",      statusUnit:"dalam_negosiasi", sertifikat:"SHGB", listedBy:"Rina Wati"   },
  { id:5, noFolder:"PRE-005", status:"DISEWAKAN RUKO",         address:"Jl. Sudirman",         kota:"Pekanbaru", price:"Rp 120jt/thn",     priceRent:null,                lt:80,  lb:200, kt:null, km:2, image:"https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80", kategori:"Ruko",  subkategori:"2 Lantai", badge:"sewa",       statusUnit:"tersedia",        sertifikat:"SHM",  listedBy:"Budi S"      },
  { id:6, noFolder:"PRE-006", status:"DIJUAL TANAH",           address:"Jl. HR. Soebrantas",   kota:"Kampar",    price:"Rp 500.000.000",   priceRent:null,                lt:600, lb:null, kt:null, km:null, image:"https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80", kategori:"Tanah", subkategori:"Kavling", badge:"dijual",     statusUnit:"tersedia",        sertifikat:"SHM",  listedBy:"Rina Wati"   },
  { id:7, noFolder:"PRE-007", status:"DIJUAL RUMAH",           address:"Jl. Cipta Karya",      kota:"Pekanbaru", price:"Rp 680.000.000",   priceRent:null,                lt:130, lb:100, kt:3, km:2, image:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80", kategori:"Rumah",  subkategori:"Biasa",    badge:"dijual",      statusUnit:"terjual",         sertifikat:"SHM",  listedBy:"Budi S"      },
  { id:8, noFolder:"PRE-008", status:"DISEWAKAN RUKO",         address:"Jl. Riau",             kota:"Pekanbaru", price:"Rp 25jt/thn",      priceRent:null,                lt:60,  lb:160, kt:null, km:1, image:"https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80", kategori:"Ruko",  subkategori:"Gandeng",  badge:"sewa",        statusUnit:"tersewa",         sertifikat:"SHGB", listedBy:"Rina Wati"   },
];

const stats = [
  { label:"Total Listing",    value: properties.length,                                                           icon: HiCollection,        color:"text-red-700",   bg:"bg-red-50"    },
  { label:"Tersedia",         value: properties.filter(p=>p.statusUnit==="tersedia").length,                      icon: HiCheckCircle,       color:"text-green-700", bg:"bg-green-50"  },
  { label:"Terjual/Tersewa",  value: properties.filter(p=>["terjual","tersewa"].includes(p.statusUnit)).length,   icon: HiTrendingUp,        color:"text-blue-700",  bg:"bg-blue-50"   },
  { label:"Negosiasi",        value: properties.filter(p=>p.statusUnit==="dalam_negosiasi").length,               icon: HiClock,             color:"text-amber-700", bg:"bg-amber-50"  },
];

const badgeClass = { dijual:"badge-error", sewa:"badge-info", "dijual-sewa":"badge-warning" };
const badgeLabel = { dijual:"Dijual", sewa:"Sewa", "dijual-sewa":"Jual/Sewa" };
const unitClass  = { tersedia:"badge-success", terjual:"badge-error", tersewa:"badge-info", dalam_negosiasi:"badge-warning" };
const unitLabel  = { tersedia:"Tersedia", terjual:"Terjual", tersewa:"Tersewa", dalam_negosiasi:"Negosiasi" };

function Dropdown({ label, options, value, setValue, open, setOpen, closeOthers }) {
  return (
    <div className="relative">
      <button onClick={() => { closeOthers(); setOpen(!open); }}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 bg-white text-xs font-semibold text-red-900 hover:bg-red-50 transition-all shadow-sm">
        <span>{value === "Semua" ? label : value}</span>
        <HiChevronDown className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} size={13} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 bg-white border border-red-100 rounded-xl shadow-xl z-30 min-w-36 overflow-hidden">
          {options.map(opt => (
            <button key={opt} onClick={() => { setValue(opt); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 transition-colors ${value===opt ? "text-red-800 font-semibold bg-red-50" : "text-gray-700"}`}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PropertyCard({ p }) {
  const role = ROLE_CONFIG[CURRENT_ROLE];
  const handleShare = (e) => {
    e.preventDefault();
    const text = `*${p.status}*\n📍 ${p.address}, ${p.kota}\n💰 ${p.price}${p.priceRent ? `\nSewa: ${p.priceRent}` : ""}\n📐 LT: ${p.lt}m²${p.lb ? ` | LB: ${p.lb}m²` : ""}${p.kt ? `\n🛏 ${p.kt} KT | 🚿 ${p.km} KM` : ""}\n📜 ${p.sertifikat}\n🏙 ${p.kota}`;
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="card bg-base-100 shadow hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden group border border-red-50">
      <figure className="relative h-36 overflow-hidden">
        <img src={p.image} alt={p.address}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => e.target.src="https://placehold.co/400x240/7A0000/white?text=Foto"} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          <span className={`badge badge-sm ${badgeClass[p.badge] || "badge-ghost"} text-white`}>
            {badgeLabel[p.badge]}
          </span>
        </div>
        <div className="absolute top-2 right-2">
          <span className={`badge badge-sm ${unitClass[p.statusUnit]}`}>
            {unitLabel[p.statusUnit]}
          </span>
        </div>
        <div className="absolute bottom-2 left-2">
          <span className="text-[10px] text-white/60 font-mono bg-black/30 px-1.5 py-0.5 rounded">{p.noFolder}</span>
        </div>
      </figure>

      <div className="card-body p-3 gap-1">
        <p className="text-[10px] font-bold text-red-700 uppercase tracking-wide leading-tight">
          {p.kategori}{p.subkategori ? ` · ${p.subkategori}` : ""}
        </p>
        <div className="flex items-start gap-1">
          <HiOutlineLocationMarker size={13} className="mt-0.5 shrink-0 text-red-400" />
          <span className="text-xs text-gray-600 leading-tight line-clamp-1">{p.address}, {p.kota}</span>
        </div>
        <div className="flex items-center gap-1">
          <HiTag size={13} className="shrink-0 text-red-500" />
          <p className="text-xs font-bold text-red-900 line-clamp-1">{p.price}</p>
        </div>
        {p.priceRent && <p className="text-[10px] text-blue-600 font-medium">Sewa: {p.priceRent}</p>}
        {(p.lt || p.kt) && (
          <div className="flex gap-1.5 flex-wrap mt-0.5">
            {p.lt  && <span className="badge badge-ghost badge-xs">LT {p.lt}m²</span>}
            {p.lb  && <span className="badge badge-ghost badge-xs">LB {p.lb}m²</span>}
            {p.kt  && <span className="badge badge-ghost badge-xs">🛏{p.kt}</span>}
            {p.km  && <span className="badge badge-ghost badge-xs">🚿{p.km}</span>}
          </div>
        )}
        <div className="divider my-0.5" />
        <div className="card-actions justify-between items-center">
          <Link to={`/property/${p.id}`} className="btn btn-xs btn-outline btn-error rounded-lg gap-1">
            <HiOutlineEye size={12} /> Detail
          </Link>
          <div className="flex gap-1">
            {role.canShare && (
              <button onClick={handleShare} className="btn btn-xs btn-ghost text-blue-500 hover:bg-blue-50 rounded-lg" title="Salin & Share">
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

export default function Dashboard() {
  const [search,       setSearch]    = useState("");
  const [statusFilter, setStatus]    = useState("Semua");
  const [typeFilter,   setType]      = useState("Semua");
  const [locFilter,    setLoc]       = useState("Semua");
  const [unitFilter,   setUnit]      = useState("Semua");
  const [statusOpen,   setStatusOpen]= useState(false);
  const [typeOpen,     setTypeOpen]  = useState(false);
  const [locOpen,      setLocOpen]   = useState(false);
  const [unitOpen,     setUnitOpen]  = useState(false);
  const [showFilter,   setShowFilter]= useState(false);

  const closeAll = () => { setStatusOpen(false); setTypeOpen(false); setLocOpen(false); setUnitOpen(false); };

  const filtered = properties.filter(p => {
    const q = search.toLowerCase();
    const matchQ = p.address.toLowerCase().includes(q) || p.kota.toLowerCase().includes(q) || p.kategori.toLowerCase().includes(q);
    const matchS = statusFilter === "Semua" || (statusFilter==="Dijual" && p.badge.includes("dijual")) || (statusFilter==="Sewa" && p.badge.includes("sewa"));
    const matchT = typeFilter === "Semua" || p.kategori === typeFilter;
    const matchL = locFilter  === "Semua" || p.kota === locFilter;
    const matchU = unitFilter === "Semua" || p.statusUnit === unitFilter;
    return matchQ && matchS && matchT && matchL && matchU;
  });

  const activeFilters = [
    statusFilter !== "Semua" && { label:`Penawaran: ${statusFilter}`, clear:()=>setStatus("Semua") },
    typeFilter   !== "Semua" && { label:`Tipe: ${typeFilter}`,        clear:()=>setType("Semua")   },
    locFilter    !== "Semua" && { label:`Kota: ${locFilter}`,         clear:()=>setLoc("Semua")    },
    unitFilter   !== "Semua" && { label:`Status: ${unitLabel[unitFilter]||unitFilter}`, clear:()=>setUnit("Semua") },
  ].filter(Boolean);

  return (
    <div className="space-y-4" onClick={closeAll}>

      {/* ── Hero ── */}
      <div className="relative w-full rounded-2xl overflow-hidden h-44 md:h-52"
        style={{ background:"linear-gradient(135deg,#7A0000 0%,#3D0000 60%,#1a0000 100%)" }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage:"radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize:"28px 28px" }} />
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-15"
          style={{ background:"radial-gradient(ellipse at right,#ff6b6b,transparent)" }} />

        {/* Stats — desktop top right */}
        <div className="absolute top-3 right-3 hidden lg:flex gap-2">
          {stats.map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl px-3 py-2 text-center min-w-[68px] shadow-sm`}>
              <p className={`text-lg font-bold leading-tight ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-500 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="relative z-10 flex flex-col justify-center h-full px-6 md:px-10 max-w-lg">
          <p className="text-red-300 text-[10px] font-semibold uppercase tracking-widest mb-1">Philip Real Estate · Pekanbaru</p>
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
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-3 md:p-4" onClick={e=>e.stopPropagation()}>
        <div className="flex gap-2 items-center">
          <label className="input input-bordered input-sm flex-1 flex items-center gap-2 rounded-xl border-red-100 focus-within:border-red-300 focus-within:outline-red-200">
            <HiSearch className="text-gray-400" size={16} />
            <input type="text" placeholder="Cari alamat, tipe, kota..." value={search}
              onChange={e=>setSearch(e.target.value)} className="grow text-sm" />
            {search && <button onClick={()=>setSearch("")} className="text-gray-400 hover:text-gray-600"><HiX size={14}/></button>}
          </label>
          <button onClick={()=>setShowFilter(!showFilter)}
            className={`btn btn-sm rounded-xl gap-1.5 ${showFilter ? "btn-error text-white" : "btn-outline border-red-200 text-red-800 hover:bg-red-50 hover:border-red-300"}`}>
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
            <Dropdown label="Penawaran" options={["Semua","Dijual","Sewa"]}
              value={statusFilter} setValue={setStatus} open={statusOpen} setOpen={setStatusOpen}
              closeOthers={()=>{setTypeOpen(false);setLocOpen(false);setUnitOpen(false)}} />
            <Dropdown label="Tipe" options={["Semua","Rumah","Ruko","Tanah","Gudang","Villa","Kios"]}
              value={typeFilter} setValue={setType} open={typeOpen} setOpen={setTypeOpen}
              closeOthers={()=>{setStatusOpen(false);setLocOpen(false);setUnitOpen(false)}} />
            <Dropdown label="Kota" options={["Semua","Pekanbaru","Kampar","Siak","Pelalawan"]}
              value={locFilter} setValue={setLoc} open={locOpen} setOpen={setLocOpen}
              closeOthers={()=>{setStatusOpen(false);setTypeOpen(false);setUnitOpen(false)}} />
            <Dropdown label="Status Unit" options={["Semua","tersedia","terjual","tersewa","dalam_negosiasi"]}
              value={unitFilter} setValue={setUnit} open={unitOpen} setOpen={setUnitOpen}
              closeOthers={()=>{setStatusOpen(false);setTypeOpen(false);setLocOpen(false)}} />
            {activeFilters.length > 0 && (
              <button onClick={()=>{setStatus("Semua");setType("Semua");setLoc("Semua");setUnit("Semua")}}
                className="text-xs text-red-400 hover:text-red-600 font-semibold underline">Reset</button>
            )}
          </div>
        )}

        {activeFilters.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-2">
            {activeFilters.map(f => (
              <span key={f.label} className="badge badge-sm bg-red-100 text-red-800 border-red-200 gap-1">
                {f.label}
                <button onClick={f.clear}><HiX size={11}/></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Grid ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-red-900">
            Daftar Properti
            {activeFilters.length > 0 && <span className="text-red-300 font-normal text-sm ml-1">(difilter)</span>}
          </h2>
          <span className="badge badge-ghost text-red-400 font-semibold">{filtered.length} properti</span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <HiHome size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-sm">Properti tidak ditemukan</p>
            <p className="text-xs mt-1">Coba ubah filter atau kata kunci pencarian</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {filtered.map(p => <PropertyCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}