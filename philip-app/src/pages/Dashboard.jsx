import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HiChevronDown, HiHome, HiOutlineLocationMarker, HiSearch, HiTag, HiX } from "react-icons/hi";
import { BiFilterAlt } from "react-icons/bi";

const properties = [
  { id: 1, status: "DIJUAL RUMAH", address: "Jl. Limbungan", price: "Rp 7.000.000.000", image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&q=80", type: "Rumah", location: "Pekanbaru", badge: "dijual" },
  { id: 2, status: "DIJUAL RUMAH", address: "Komp. Damai Langgeng", price: "Rp 850.000.000", image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&q=80", type: "Rumah", location: "Pekanbaru", badge: "dijual" },
  { id: 3, status: "DIJUAL/DISEWAKAN RUMAH", address: "Jl. Pramuka", price: "Rp 2.000.000.000", priceRent: "Rp 50.000.000/thn", image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80", type: "Rumah", location: "Pekanbaru", badge: "dijual-sewa" },
  { id: 4, status: "DIJUAL RUMAH", address: "Jl. Melur Permai", price: "Rp 1.050.000.000", image: "https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=400&q=80", type: "Rumah", location: "Pekanbaru", badge: "dijual" },
  { id: 5, status: "DISEWAKAN RUKO", address: "Jl. Sudirman", price: "Rp 120.000.000/thn", image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80", type: "Ruko", location: "Pekanbaru", badge: "sewa" },
  { id: 6, status: "DIJUAL TANAH", address: "Jl. HR. Soebrantas", price: "Rp 500.000.000", image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80", type: "Tanah", location: "Kampar", badge: "dijual" },
  { id: 7, status: "DIJUAL RUMAH", address: "Jl. Cipta Karya", price: "Rp 680.000.000", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80", type: "Rumah", location: "Pekanbaru", badge: "dijual" },
  { id: 8, status: "DISEWAKAN APARTEMEN", address: "Jl. Riau", price: "Rp 25.000.000/thn", image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80", type: "Apartemen", location: "Pekanbaru", badge: "sewa" },
];

const badgeStyle = { dijual: "bg-red-100 text-red-800", sewa: "bg-blue-100 text-blue-800", "dijual-sewa": "bg-amber-100 text-amber-800" };

function PropertyCard({ property }) {
  const label = property.badge === "dijual" ? "Dijual" : property.badge === "sewa" ? "Sewa" : "Jual/Sewa";
  return (
    <Link to={`/property/${property.id}`} className="group block overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-28 overflow-hidden sm:h-36 md:h-40">
        <img src={property.image} alt={property.address} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" onError={(event) => { event.currentTarget.src = "https://placehold.co/400x300/8B0000/white?text=Foto"; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-bold ${badgeStyle[property.badge]}`}>{label}</span>
      </div>
      <div className="p-3">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-red-800 sm:text-xs">{property.status}</p>
        <div className="mb-1.5 flex items-start gap-1 text-red-400"><HiOutlineLocationMarker className="mt-0.5 shrink-0" size={14} /><span className="truncate text-xs font-medium leading-tight text-gray-600">{property.address}</span></div>
        <div className="flex items-center gap-1 text-red-500"><HiTag className="shrink-0" size={14} /><p className="truncate text-xs font-bold leading-tight text-red-900">{property.price}</p></div>
        {property.priceRent && <p className="mt-0.5 text-[10px] font-semibold text-blue-600">Sewa: {property.priceRent}</p>}
      </div>
    </Link>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="text-xs font-semibold text-gray-600">
      {label}
      <select value={value} onChange={onChange} className="select mt-1 h-10 w-full rounded-lg border-red-100 bg-white text-sm font-medium text-gray-700 focus:border-red-400 focus:outline-none">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatus] = useState("Semua");
  const [typeFilter, setType] = useState("Semua");
  const [locationFilter, setLocation] = useState("Semua");
  const [filterOpen, setFilterOpen] = useState(false);
  const activeFilterCount = [statusFilter, typeFilter, locationFilter].filter((value) => value !== "Semua").length;

  const filtered = properties.filter((property) => {
    const query = search.toLowerCase();
    return (
      (property.address.toLowerCase().includes(query) || property.status.toLowerCase().includes(query)) &&
      (statusFilter === "Semua" || (statusFilter === "Dijual" && property.badge.includes("dijual")) || (statusFilter === "Disewakan" && property.badge.includes("sewa"))) &&
      (typeFilter === "Semua" || property.type === typeFilter) &&
      (locationFilter === "Semua" || property.location === locationFilter)
    );
  });

  const resetFilters = () => {
    setSearch("");
    setStatus("Semua");
    setType("Semua");
    setLocation("Semua");
  };

  useEffect(() => {
    document.title = `${filtered.length} properti tersedia`;
  }, [filtered.length]);

  return (
    <div className="space-y-4">
      <section className="relative h-44 w-full overflow-hidden rounded-2xl md:h-56 lg:h-64" style={{ background: "linear-gradient(135deg, #7A0000 0%, #3D0000 60%, #1a0000 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative z-10 flex h-full max-w-lg flex-col justify-center px-6 md:px-10 lg:px-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-red-300">Philip Real Estate</p>
          <h1 className="font-serif text-2xl font-bold leading-tight text-white md:text-3xl lg:text-4xl">Build Your<br />Future Home <span className="font-normal italic text-red-300">with us</span></h1>
          <p className="mt-2 max-w-xs text-xs text-red-200 md:mt-3 md:text-sm">Mulai langkah besar dari keputusan hari ini.</p>
        </div>
      </section>

      <section className="rounded-2xl border border-red-100 bg-white p-3 shadow-sm md:p-4">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="search" placeholder="Cari properti atau alamat..." value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-xl border border-red-100 py-2.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-200" />
          </div>
          <button type="button" onClick={() => setFilterOpen((open) => !open)} aria-expanded={filterOpen} className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${filterOpen || activeFilterCount ? "border-red-200 bg-red-50 text-red-800" : "border-red-100 bg-white text-red-700 hover:bg-red-50"}`}>
            <BiFilterAlt size={18} />
            <span className="hidden sm:inline">Filter</span>
            {activeFilterCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-800 px-1 text-[11px] text-white">{activeFilterCount}</span>}
            <HiChevronDown className={`hidden transition-transform sm:block ${filterOpen ? "rotate-180" : ""}`} size={15} />
          </button>
        </div>

        {filterOpen && (
          <div className="mt-3 border-t border-red-100 pt-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <FilterSelect label="Status transaksi" value={statusFilter} onChange={(event) => setStatus(event.target.value)} options={["Semua", "Dijual", "Disewakan"]} />
              <FilterSelect label="Tipe properti" value={typeFilter} onChange={(event) => setType(event.target.value)} options={["Semua", "Rumah", "Ruko", "Tanah", "Apartemen"]} />
              <FilterSelect label="Lokasi" value={locationFilter} onChange={(event) => setLocation(event.target.value)} options={["Semua", "Pekanbaru", "Kampar"]} />
            </div>
            {(activeFilterCount > 0 || search) && <button type="button" onClick={resetFilters} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-900"><HiX size={15} /> Reset pencarian & filter</button>}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-red-900">Properti Rekomendasi</h2>
          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-400">{filtered.length} properti</span>
        </div>
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400"><HiHome className="mx-auto mb-3 opacity-40" /><p className="font-semibold">Properti tidak ditemukan</p></div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((property) => <PropertyCard key={property.id} property={property} />)}
          </div>
        )}
      </section>
    </div>
  );
}
