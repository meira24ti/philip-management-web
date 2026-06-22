import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { HiOutlineLocationMarker, HiOutlineHome, HiArrowLeft,
  HiOutlineShare, HiOutlineDownload, HiOutlineMap,
  HiOutlineTag, HiOutlineOfficeBuilding, HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi";
import { BiArea } from "react-icons/bi";

const CURRENT_ROLE = "admin";
const ROLE_CONFIG = {
  admin:    { canEdit:true,  canDelete:true,  canShare:true, canFlyer:true },
  marketing:{ canEdit:false, canDelete:false, canShare:true, canFlyer:true },
  direktur: { canEdit:false, canDelete:false, canShare:false,canFlyer:false},
};

const dummyProperty = {
  id:1, noFolder:"PRE-001", tanggalListing:"2024-11-15",
  status:"DIJUAL RUMAH", statusUnit:"tersedia",
  badge:"dijual", jenisPenawaran:"dijual",
  address:"Jl. Limbungan No. 45, Rumbai", kota:"Pekanbaru", area:"Rumbai",
  price:"Rp 7.000.000.000", priceRent:null,
  kategori:"Rumah", subkategori:"Mewah", jumlahUnit:1,
  lt:300, lb:250, kt:5, km:4,
  carport:"2 mobil", dayaListrik:"3.500 Watt", sumberAir:"PDAM",
  rowJalan:"Aspal 2 mobil + trotoar", sertifikat:"SHM", keamanan:"Security 24 jam + CCTV",
  bonus:"Kitchen Set, Mesin Air, Tangki Air, Kanopi, Taman",
  fasilitas:"Mall, RS, Sekolah, SPBU, Universitas",
  keterangan:"Rumah mewah lokasi strategis, akses mudah ke pusat kota.",
  spanduk:true, kunci:true, feed:true, sudahShare:false,
  listedBy:"Rina Wati",
  vendor:{ nama:"Bapak Hendra", noHp:"08123456789" },
  gmapsUrl:"https://maps.google.com",
  latitude:-0.5071, longitude:101.4478,
  fotos:[
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
    "https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=800&q=80",
  ]
};

const unitBadge = { tersedia:"badge-success", terjual:"badge-error", tersewa:"badge-info", dalam_negosiasi:"badge-warning" };
const unitLabel = { tersedia:"Tersedia", terjual:"Terjual", tersewa:"Tersewa", dalam_negosiasi:"Dalam Negosiasi" };

export default function PropertyDetail() {
  const { id } = useParams();
  const p = dummyProperty;
  const role = ROLE_CONFIG[CURRENT_ROLE];
  const [fotoIdx, setFotoIdx] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleShare = () => {
    const text = `*${p.status}*\n📍 ${p.address}\n💰 ${p.price}\n📐 LT: ${p.lt}m² | LB: ${p.lb}m²\n🛏 ${p.kt} KT | 🚿 ${p.km} KM\n📜 ${p.sertifikat}\n🏙 ${p.kota}`;
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-4">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/property" className="btn btn-sm btn-ghost rounded-xl gap-1 text-gray-500 hover:text-red-800">
            <HiArrowLeft size={15} /> Properti
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-red-900 truncate max-w-48">{p.address}</span>
        </div>
        <div className="flex gap-2">
          {role.canShare && (
            <button onClick={handleShare} className="btn btn-sm btn-outline border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl gap-1">
              <HiOutlineShare size={14}/> Share
            </button>
          )}
          {role.canFlyer && (
            <button className="btn btn-sm btn-outline border-red-200 text-red-700 hover:bg-red-50 rounded-xl gap-1">
              <HiOutlineDownload size={14}/> Flyer
            </button>
          )}
          {role.canEdit && (
            <button className="btn btn-sm btn-error text-white rounded-xl gap-1">
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* ── Left: foto + info utama ── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Foto gallery */}
          <div className="card bg-base-100 shadow border border-red-50 overflow-hidden">
            <div className="relative h-64 md:h-80 bg-gray-100">
              <img src={p.fotos[fotoIdx]} alt="foto"
                className="w-full h-full object-cover"
                onError={e=>e.target.src="https://placehold.co/800x400/7A0000/white?text=Foto"} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              {/* nav arrows */}
              {p.fotos.length > 1 && (<>
                <button onClick={()=>setFotoIdx(i=>(i-1+p.fotos.length)%p.fotos.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 btn btn-circle btn-sm bg-white/80 border-0 hover:bg-white shadow">
                  <HiOutlineChevronLeft size={16}/>
                </button>
                <button onClick={()=>setFotoIdx(i=>(i+1)%p.fotos.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-circle btn-sm bg-white/80 border-0 hover:bg-white shadow">
                  <HiOutlineChevronRight size={16}/>
                </button>
              </>)}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {p.fotos.map((_,i) => (
                  <button key={i} onClick={()=>setFotoIdx(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i===fotoIdx?"bg-white w-4":"bg-white/50"}`} />
                ))}
              </div>
              {/* badges */}
              <div className="absolute top-3 left-3 flex gap-1.5">
                <span className="badge badge-sm badge-error text-white">Dijual</span>
                <span className={`badge badge-sm ${unitBadge[p.statusUnit]}`}>{unitLabel[p.statusUnit]}</span>
              </div>
              <div className="absolute top-3 right-3">
                <span className="text-[10px] text-white/70 font-mono bg-black/30 px-1.5 py-0.5 rounded">{p.noFolder}</span>
              </div>
            </div>
            {/* thumbnail strip */}
            {p.fotos.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {p.fotos.map((f,i) => (
                  <button key={i} onClick={()=>setFotoIdx(i)}
                    className={`w-16 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${i===fotoIdx?"border-red-600":"border-transparent"}`}>
                    <img src={f} alt="" className="w-full h-full object-cover"
                      onError={e=>e.target.src="https://placehold.co/80x60/7A0000/white?text=."} />
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
                  { label:"Luas Tanah",    value:`${p.lt} m²`     },
                  { label:"Luas Bangunan", value:`${p.lb} m²`     },
                  { label:"Kamar Tidur",   value:`${p.kt} kamar`  },
                  { label:"Kamar Mandi",   value:`${p.km} kamar`  },
                  { label:"Carport",       value:p.carport        },
                  { label:"Daya Listrik",  value:p.dayaListrik    },
                  { label:"Sumber Air",    value:p.sumberAir      },
                  { label:"Akses Jalan",   value:p.rowJalan       },
                  { label:"Sertifikat",    value:p.sertifikat     },
                  { label:"Keamanan",      value:p.keamanan       },
                ].filter(s=>s.value).map(s => (
                  <div key={s.label} className="bg-red-50 rounded-xl p-2.5">
                    <p className="text-[10px] text-red-400 font-semibold uppercase tracking-wide">{s.label}</p>
                    <p className="text-sm font-semibold text-gray-700 mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>

              {p.bonus && (
                <div className="mt-3">
                  <p className="text-xs font-bold text-gray-500 mb-1.5">Bonus & Fasilitas Unit</p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.bonus.split(",").map(b => (
                      <span key={b} className="badge badge-ghost badge-sm text-gray-600">{b.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
              {p.fasilitas && (
                <div className="mt-2">
                  <p className="text-xs font-bold text-gray-500 mb-1.5">Akses Fasilitas Terdekat</p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.fasilitas.split(",").map(f => (
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
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide">{p.kategori} {p.subkategori}</p>
              <h2 className="text-base font-bold text-gray-800 leading-tight">{p.address}</h2>
              <div className="flex items-center gap-1 text-gray-400">
                <HiOutlineLocationMarker size={13} className="text-red-400" />
                <span className="text-xs">{p.area}, {p.kota}</span>
              </div>

              <div className="bg-red-50 rounded-xl p-3 mt-1">
                <p className="text-[10px] text-red-400 font-semibold uppercase tracking-wide">Harga Jual</p>
                <p className="text-xl font-bold text-red-900">{p.price}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Negotiable · {p.sertifikat}</p>
              </div>

              {p.priceRent && (
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-[10px] text-blue-400 font-semibold uppercase">Harga Sewa</p>
                  <p className="text-lg font-bold text-blue-700">{p.priceRent}</p>
                </div>
              )}

              <div className="divider my-0" />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><p className="text-gray-400">No. Folder</p><p className="font-bold text-gray-700">{p.noFolder}</p></div>
                <div><p className="text-gray-400">Tgl Listing</p><p className="font-bold text-gray-700">{p.tanggalListing}</p></div>
                <div><p className="text-gray-400">Listing oleh</p><p className="font-bold text-gray-700">{p.listedBy}</p></div>
                <div><p className="text-gray-400">Jumlah Unit</p><p className="font-bold text-gray-700">{p.jumlahUnit} unit</p></div>
              </div>
            </div>
          </div>

          {/* Vendor */}
          <div className="card bg-base-100 shadow border border-red-50">
            <div className="card-body p-4 gap-1.5">
              <h3 className="font-bold text-red-900 text-sm mb-1">Data Vendor / Pemilik</h3>
              <p className="text-sm font-semibold text-gray-700">{p.vendor.nama}</p>
              <div className="flex items-center gap-1.5 text-gray-500">
                <span className="text-xs font-mono">{p.vendor.noHp}</span>
              </div>
            </div>
          </div>

          {/* Status Operasional */}
          <div className="card bg-base-100 shadow border border-red-50">
            <div className="card-body p-4 gap-3">
              <h3 className="font-bold text-red-900 text-sm">Status Operasional</h3>
              {[
                { label:"Spanduk terpasang", val:p.spanduk },
                { label:"Kunci dititip",     val:p.kunci   },
                { label:"Feed dibuat",       val:p.feed    },
                { label:"Sudah di-share",    val:p.sudahShare },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <input type="checkbox" className="toggle toggle-sm toggle-success"
                    checked={item.val} readOnly={!role.canEdit} onChange={()=>{}} />
                </div>
              ))}
            </div>
          </div>

          {/* Maps */}
          {p.gmapsUrl && (
            <div className="card bg-base-100 shadow border border-red-50">
              <div className="card-body p-4">
                <h3 className="font-bold text-red-900 text-sm mb-2">Lokasi Google Maps</h3>
                <div className="bg-gray-100 rounded-xl h-28 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <HiOutlineMap size={28} className="mx-auto mb-1 opacity-40" />
                    <p className="text-xs">Peta lokasi properti</p>
                  </div>
                </div>
                <a href={p.gmapsUrl} target="_blank" rel="noreferrer"
                  className="btn btn-sm btn-outline border-red-200 text-red-700 hover:bg-red-50 rounded-xl gap-1 mt-2 w-full">
                  <HiOutlineMap size={14}/> Buka di Google Maps
                </a>
              </div>
            </div>
          )}

          {/* Actions */}
          {role.canDelete && (
            <button onClick={() => setShowDeleteModal(true)}
              className="btn btn-sm btn-ghost text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl w-full border border-red-100">
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
              Properti <strong>{p.address}</strong> akan dihapus permanen beserta seluruh foto. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="modal-action">
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-sm btn-ghost rounded-xl">Batal</button>
              <button className="btn btn-sm btn-error text-white rounded-xl">Ya, Hapus</button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowDeleteModal(false)} />
        </div>
      )}
    </div>
  );
}
