import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HiChevronDown, HiHome, HiOutlineLocationMarker, HiSearch, HiTag, HiX } from "react-icons/hi";
import { BiFilterAlt } from "react-icons/bi";
import { propertiService } from "../services/propertiService";

const isRumahCluster = (kategori, subkategori = "") =>
  String(kategori || "").toLowerCase() === "rumah_cluster" ||
  (String(kategori || "").toLowerCase() === "rumah" && /^cluster(?:\s*[-|:]\s*)?/i.test(String(subkategori || "")));

const kategoriLabel = (kategori, subkategori = "") => {
  if (isRumahCluster(kategori, subkategori)) return "Rumah Cluster";
  return ({
  rumah: "Rumah",
  rumah_cluster: "Rumah Cluster",
  "rumah cluster": "Rumah Cluster",
  }[String(kategori || "").toLowerCase()] || kategori || "Properti");
};
import { getImageUrl } from "../utils/imageUrl";

const badgeStyle = {
  dijual: "bg-red-100 text-red-800",
  disewa: "bg-blue-100 text-blue-800",
  dijual_dan_disewa: "bg-amber-100 text-amber-800",
};

const formatRupiah = (value) => value ? "Rp " + Number(value).toLocaleString("id-ID") : "Harga belum diisi";

function PropertyCard({ property }) {
  const offer = property.jenis_penawaran || "dijual";
  const label = offer === "dijual" ? "Dijual" : offer === "disewa" ? "Sewa" : "Jual/Sewa";
  const address = [property.nama_jalan, property.area_kecamatan, property.kota].filter(Boolean).join(", ");

  return (
    <Link to={"/property/" + property.id} className="group block overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-28 overflow-hidden sm:h-36 md:h-40">
        {property.cover_foto ? (
          <img src={getImageUrl(property.cover_foto)} alt={address || "Properti"} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" onError={(event) => { event.currentTarget.style.display = "none"; }} />
        ) : <div className="h-full w-full bg-gradient-to-br from-red-950 to-red-700" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
        <span className={"absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-bold " + (badgeStyle[offer] || "bg-gray-100 text-gray-700")}>{label}</span>
        {property.no_folder && <span className="absolute right-2 top-2 rounded bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-white/80">{property.no_folder}</span>}
      </div>
      <div className="p-3">
        <p className="mb-1 truncate text-[10px] font-bold uppercase tracking-wide text-red-800 sm:text-xs">{kategoriLabel(property.kategori, property.subkategori)}</p>
        <div className="mb-1.5 flex items-start gap-1 text-red-400"><HiOutlineLocationMarker className="mt-0.5 shrink-0" size={14} /><span className="truncate text-xs font-medium leading-tight text-gray-600">{address || "-"}</span></div>
        <div className="flex items-center gap-1 text-red-500"><HiTag className="shrink-0" size={14} /><p className="truncate text-xs font-bold leading-tight text-red-900">{formatRupiah(property.harga_jual || property.harga_sewa)}</p></div>
        {property.harga_sewa && property.harga_jual && <p className="mt-0.5 text-[10px] font-semibold text-blue-600">Sewa: {formatRupiah(property.harga_sewa)}/tahun</p>}
      </div>
    </Link>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return <label className="text-xs font-semibold text-gray-600">{label}<select value={value} onChange={onChange} className="select mt-1 h-10 w-full rounded-lg border-red-100 bg-white text-sm font-medium text-gray-700 focus:border-red-400 focus:outline-none">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

export default function Dashboard() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatus] = useState("");
  const [typeFilter, setType] = useState("");
  const [locationFilter, setLocation] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const activeFilterCount = [statusFilter, typeFilter, locationFilter].filter(Boolean).length;

  useEffect(() => {
    let active = true;
    propertiService.getAll()
      .then((data) => { if (active) setProperties(Array.isArray(data) ? data : []); })
      .catch(() => { if (active) setLoadError("Data properti belum dapat dimuat."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = properties.filter((property) => {
    const query = search.trim().toLowerCase();
    const searchable = [property.no_folder, property.nama_jalan, property.area_kecamatan, property.kota, property.kategori].join(" ").toLowerCase();
    return (!query || searchable.includes(query)) &&
      (!statusFilter || property.jenis_penawaran === statusFilter) &&
      (!typeFilter || (
        typeFilter === "rumah_cluster"
          ? isRumahCluster(property.kategori, property.subkategori)
          : String(property.kategori || "").toLowerCase() === typeFilter
      )) &&
      (!locationFilter || property.kota === locationFilter);
  });

  const resetFilters = () => { setSearch(""); setStatus(""); setType(""); setLocation(""); };

  useEffect(() => { document.title = filtered.length + " properti tersedia"; }, [filtered.length]);

  return (
    <div className="space-y-4">
      <section className="relative h-44 w-full overflow-hidden rounded-2xl md:h-56 lg:h-64" style={{ background: "linear-gradient(135deg, #7A0000 0%, #3D0000 60%, #1a0000 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative z-10 flex h-full max-w-lg flex-col justify-center px-6 md:px-10 lg:px-14"><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-red-300">Philip Real Estate</p><h1 className="font-serif text-2xl font-bold leading-tight text-white md:text-3xl lg:text-4xl">Build Your<br />Future Home <span className="font-normal italic text-red-300">with us</span></h1><p className="mt-2 max-w-xs text-xs text-red-200 md:mt-3 md:text-sm">Mulai langkah besar dari keputusan hari ini.</p></div>
      </section>

      <section className="rounded-2xl border border-red-100 bg-white p-3 shadow-sm md:p-4">
        <div className="flex items-center gap-2"><div className="relative min-w-0 flex-1"><HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="search" placeholder="Cari folder, alamat, kota..." value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-xl border border-red-100 py-2.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-200" /></div><button type="button" onClick={() => setFilterOpen((open) => !open)} aria-expanded={filterOpen} className={"inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors " + (filterOpen || activeFilterCount ? "border-red-200 bg-red-50 text-red-800" : "border-red-100 bg-white text-red-700 hover:bg-red-50")}><BiFilterAlt size={18} /><span className="hidden sm:inline">Filter</span>{activeFilterCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-800 px-1 text-[11px] text-white">{activeFilterCount}</span>}<HiChevronDown className={"hidden transition-transform sm:block " + (filterOpen ? "rotate-180" : "")} size={15} /></button></div>
        {filterOpen && <div className="mt-3 rounded-xl border border-red-100 bg-red-50/40 p-3"><div className="grid gap-3 sm:grid-cols-3"><FilterSelect label="Penawaran" value={statusFilter} onChange={(event) => setStatus(event.target.value)} options={[{ value: "", label: "Semua penawaran" }, { value: "dijual", label: "Dijual" }, { value: "disewa", label: "Disewakan" }, { value: "dijual_dan_disewa", label: "Jual & sewa" }]} /><FilterSelect label="Tipe properti" value={typeFilter} onChange={(event) => setType(event.target.value)} options={[{ value: "", label: "Semua tipe" }, { value: "rumah", label: "Rumah" }, { value: "rumah_cluster", label: "Rumah Cluster" }, { value: "ruko", label: "Ruko" }, { value: "tanah", label: "Tanah" }, { value: "gudang", label: "Gudang" }, { value: "villa", label: "Villa" }]} /><FilterSelect label="Lokasi" value={locationFilter} onChange={(event) => setLocation(event.target.value)} options={[{ value: "", label: "Semua lokasi" }, { value: "Pekanbaru", label: "Pekanbaru" }, { value: "Kampar", label: "Kampar" }, { value: "Siak", label: "Siak" }, { value: "Pelalawan", label: "Pelalawan" }]} /></div>{(activeFilterCount > 0 || search) && <button type="button" onClick={resetFilters} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-900"><HiX size={15} /> Reset pencarian & filter</button>}</div>}
      </section>

      <section><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold text-red-900">Properti Rekomendasi</h2><span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-400">{filtered.length} properti</span></div>
        {loading ? <div className="flex justify-center py-16"><span className="loading loading-spinner loading-lg text-red-800" /></div>
          : loadError ? <div className="rounded-2xl bg-white py-12 text-center text-sm text-red-700 shadow-sm">{loadError}</div>
            : filtered.length === 0 ? <div className="py-16 text-center text-gray-400"><HiHome className="mx-auto mb-3 opacity-40" /><p className="font-semibold">Properti tidak ditemukan</p></div>
              : <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">{filtered.map((property) => <PropertyCard key={property.id} property={property} />)}</div>}
      </section>
    </div>
  );
}
