import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HiSearch, HiOutlineLocationMarker, HiTag, HiHome, HiChevronDown } from "react-icons/hi";
import { BiFilterAlt } from "react-icons/bi";


const properties = [
  {
    id: 1, status: "DIJUAL RUMAH", address: "Jl. Limbungan", price: "Rp 7.000.000.000", priceRent: null,
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&q=80", type: "Rumah", location: "Pekanbaru", badge: "dijual"
  },
  {
    id: 2, status: "DIJUAL RUMAH", address: "Komp. Damai Langgeng", price: "Rp 850.000.000", priceRent: null,
    image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&q=80", type: "Rumah", location: "Pekanbaru", badge: "dijual"
  },
  {
    id: 3, status: "DIJUAL/DISEWAKAN RUMAH", address: "Jl. Pramuka", price: "Rp 2.000.000.000", priceRent: "Rp 50.000.000/thn",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80", type: "Rumah", location: "Pekanbaru", badge: "dijual-sewa"
  },
  {
    id: 4, status: "DIJUAL RUMAH", address: "Jl. Melur Permai", price: "Rp 1.050.000.000", priceRent: null,
    image: "https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=400&q=80", type: "Rumah", location: "Pekanbaru", badge: "dijual"
  },
  {
    id: 5, status: "DISEWAKAN RUKO", address: "Jl. Sudirman", price: "Rp 120.000.000/thn", priceRent: null,
    image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80", type: "Ruko", location: "Pekanbaru", badge: "sewa"
  },
  {
    id: 6, status: "DIJUAL TANAH", address: "Jl. HR. Soebrantas", price: "Rp 500.000.000", priceRent: null,
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80", type: "Tanah", location: "Kampar", badge: "dijual"
  },
  {
    id: 7, status: "DIJUAL RUMAH", address: "Jl. Cipta Karya", price: "Rp 680.000.000", priceRent: null,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80", type: "Rumah", location: "Pekanbaru", badge: "dijual"
  },
  {
    id: 8, status: "DISEWAKAN APARTEMEN", address: "Jl. Riau", price: "Rp 25.000.000/thn", priceRent: null,
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80", type: "Apartemen", location: "Pekanbaru", badge: "sewa"
  },
];

const badgeStyle = {
  dijual: "bg-red-100 text-red-800",
  sewa: "bg-blue-100 text-blue-800",
  "dijual-sewa": "bg-amber-100 text-amber-800",
};

function Dropdown({ label, options, value, setValue, open, setOpen, closeOthers }) {
  return (
    <div className="relative">
      <button
        onClick={() => { closeOthers(); setOpen(!open); }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-red-200 bg-white text-xs md:text-sm font-semibold text-red-900 hover:bg-red-50 transition-all"
      >
        <span>{value === "Semua" ? label : value}</span>
        <HiChevronDown
          className={`transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
          size={16}
        />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 bg-white border border-red-100 rounded-xl shadow-xl z-20 min-w-35 overflow-hidden">
          {options.map((opt) => (
            <button key={opt} onClick={() => { setValue(opt); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-red-50 transition-colors ${value === opt ? "text-red-800 bg-red-50" : "text-gray-700"}`}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PropertyCard({ p }) {
  return (
    <Link
      to={`/property/${p.id}`}
      className="block rounded-2xl overflow-hidden bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group"
    >
      <div className="relative h-28 sm:h-36 md:h-40 overflow-hidden">
        <img src={p.image} alt={p.address}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = "https://placehold.co/400x300/8B0000/white?text=Foto"; }} />
        <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
        <div className="absolute top-2 left-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeStyle[p.badge] || "bg-gray-100 text-gray-700"}`}>
            {p.badge === "dijual" ? "Dijual" : p.badge === "sewa" ? "Sewa" : "Jual/Sewa"}
          </span>
        </div>
      </div>
      <div className="p-3">
        <p className="text-[10px] sm:text-xs font-bold text-red-800 uppercase tracking-wide leading-tight mb-1">{p.status}</p>
        <div className="flex items-start gap-1 mb-1.5 text-red-400">
          <span className="mt-0.5 shrink-0"><HiOutlineLocationMarker size={14} /></span>
          <span className="text-xs font-medium text-gray-600 leading-tight truncate">{p.address}</span>
        </div>
        <div className="flex items-center gap-1 text-red-500">
          <span className="shrink-0"><HiTag size={14} /></span>
          <p className="text-xs font-bold text-red-900 leading-tight truncate">{p.price}</p>
        </div>
        {p.priceRent && <p className="text-[10px] text-blue-600 font-semibold mt-0.5">Sewa: {p.priceRent}</p>}
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatus] = useState("Semua");
  const [typeFilter, setType] = useState("Semua");
  const [locationFilter, setLoc] = useState("Semua");
  const [statusOpen, setStatusOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [locOpen, setLocOpen] = useState(false);

  const closeAll = () => { setStatusOpen(false); setTypeOpen(false); setLocOpen(false); };

  const filtered = properties.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.address.toLowerCase().includes(q) || p.status.toLowerCase().includes(q)) &&
      (statusFilter === "Semua" || (statusFilter === "Dijual" && p.badge.includes("dijual")) || (statusFilter === "Disewakan" && p.badge.includes("sewa"))) &&
      (typeFilter === "Semua" || p.type === typeFilter) &&
      (locationFilter === "Semua" || p.location === locationFilter)
    );
  });

  return (
    <div className="space-y-4">
      {/* Hero Banner */}
      <div className="relative w-full rounded-2xl overflow-hidden h-44 md:h-56 lg:h-64"
        style={{ background: "linear-gradient(135deg, #7A0000 0%, #3D0000 60%, #1a0000 100%)" }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-20"
          style={{ background: "radial-gradient(ellipse at right, #ff6b6b, transparent)" }} />
        <div className="relative z-10 flex flex-col justify-center h-full px-6 md:px-10 lg:px-14 max-w-lg">
          <p className="text-red-300 text-xs font-semibold uppercase tracking-widest mb-2">Philip Real Estate</p>
          <h1 className="text-white text-2xl md:text-3xl lg:text-4xl font-bold leading-tight font-serif">
            Build Your<br />Future Home
            <span className="italic font-normal text-red-300"> with us</span>
          </h1>
          <p className="text-red-200 text-xs md:text-sm mt-2 md:mt-3 max-w-xs">Mulai langkah besar dari keputusan hari ini.</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-3 md:p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">

          {/* Search Area */}
          <div className="relative flex-1 w-full">
            <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari properti, alamat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-red-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-200 transition-all"
            />
          </div>

          {/* Filter Area */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Separator */}
            <span className="hidden sm:block text-red-100 font-light text-2xl mx-1">|</span>

            <div className="flex items-center text-red-700 mr-2">
              <BiFilterAlt size={20} className="mr-2 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-tight">Filter</span>
            </div>

            {/* Dropdowns */}
            <div className="flex items-center gap-2">
              <Dropdown label="Status" options={["Semua", "Dijual", "Disewakan"]}
                value={statusFilter} setValue={setStatus} open={statusOpen} setOpen={setStatusOpen}
                closeOthers={() => { setTypeOpen(false); setLocOpen(false); }} />

              <Dropdown label="Tipe" options={["Semua", "Rumah", "Ruko", "Tanah"]}
                value={typeFilter} setValue={setType} open={typeOpen} setOpen={setTypeOpen}
                closeOthers={() => { setStatusOpen(false); setLocOpen(false); }} />

              <Dropdown label="Lokasi" options={["Semua", "Pekanbaru", "Kampar"]}
                value={locationFilter} setValue={setLoc} open={locOpen} setOpen={setLocOpen}
                closeOthers={() => { setStatusOpen(false); setTypeOpen(false); }} />
            </div>
          </div>

        </div>
      </div>

      {/* Property Grid */}
      <div onClick={closeAll}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-red-900">Properti Rekomendasi</h2>
          <span className="text-xs font-semibold text-red-400 bg-red-50 px-3 py-1 rounded-full">{filtered.length} properti</span>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <span className="opacity-40 flex justify-center mb-3"><HiHome /></span>
            <p className="font-semibold">Properti tidak ditemukan</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {filtered.map((p) => <PropertyCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
