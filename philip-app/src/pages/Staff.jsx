import { useState } from "react";
import { HiOutlineUsers, HiOutlinePhone, HiSearch, HiX,
  HiOutlineUserAdd, HiOutlineBan, HiOutlinePencil, HiChevronDown } from "react-icons/hi";

const CURRENT_ROLE = "admin"; // "admin" | "direktur" | "marketing"

const staffList = [
  { id:1, nama:"Lorenza Estrada", email:"lorenza@philip.co.id", role:"admin",     noHp:"08123456789", isActive:true,  foto:null },
  { id:2, nama:"Rina Wati",       email:"rina@philip.co.id",    role:"marketing", noHp:"08234567890", isActive:true,  foto:null },
  { id:3, nama:"Budi Santoso",    email:"budi@philip.co.id",    role:"marketing", noHp:"08345678901", isActive:true,  foto:null },
  { id:4, nama:"Hendra Kurnia",   email:"hendra@philip.co.id",  role:"direktur",  noHp:"08456789012", isActive:true,  foto:null },
  { id:5, nama:"Sari Dewi",       email:"sari@philip.co.id",    role:"marketing", noHp:"08567890123", isActive:false, foto:null },
  { id:6, nama:"Ahmad Fauzi",     email:"ahmad@philip.co.id",   role:"admin",     noHp:"08678901234", isActive:false, foto:null },
];

const roleLabel  = { admin:"Admin", marketing:"Marketing", direktur:"Direktur" };
const roleBadge  = { admin:"badge-error", marketing:"badge-info", direktur:"badge-warning" };
const roleColors = { admin:"#7A0000", marketing:"#1d4ed8", direktur:"#b45309" };

function Avatar({ nama, size = "md" }) {
  const initials = nama.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase();
  const sz = size === "lg" ? "w-14 h-14 text-lg" : "w-10 h-10 text-sm";
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

export default function Staff() {
  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState("Semua");
  const [statusFilter, setStatus]   = useState("Aktif");
  const [showModal, setShowModal]   = useState(false);
  const [confirmId, setConfirmId]   = useState(null);
  const [staffData, setStaffData]   = useState(staffList);
  const [roleOpen, setRoleOpen]     = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const canManage = ["admin", "direktur"].includes(CURRENT_ROLE);

  const filtered = staffData.filter(s => {
    const q = search.toLowerCase();
    const matchQ = s.nama.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    const matchR  = roleFilter   === "Semua" || s.role === roleFilter;
    const matchS  = statusFilter === "Semua" || (statusFilter === "Aktif" ? s.isActive : !s.isActive);
    return matchQ && matchR && matchS;
  });

  const handleDeactivate = (id) => {
    setStaffData(prev => prev.map(s => s.id === id ? {...s, isActive: false} : s));
    setConfirmId(null);
    document.getElementById("confirm-modal").close();
  };

  return (
    <div className="space-y-4" onClick={() => { setRoleOpen(false); setStatusOpen(false); }}>

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-red-900">Direktori Staff</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola akun dan informasi tim Philip Real Estate</p>
        </div>
        {canManage && (
          <button onClick={() => setShowModal(true)}
            className="btn btn-sm btn-error text-white gap-1.5 rounded-xl shadow">
            <HiOutlineUserAdd size={16} /> Tambah Staff
          </button>
        )}
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:"Total Staff",   value: staffData.length,                        color:"text-red-700",   bg:"bg-red-50"   },
          { label:"Aktif",         value: staffData.filter(s=>s.isActive).length,  color:"text-green-700", bg:"bg-green-50" },
          { label:"Nonaktif",      value: staffData.filter(s=>!s.isActive).length, color:"text-gray-500",  bg:"bg-gray-50"  },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center border border-white`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Search & Filter ── */}
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-3" onClick={e=>e.stopPropagation()}>
        <div className="flex gap-2 flex-wrap items-center">
          <label className="input input-bordered input-sm flex-1 min-w-48 flex items-center gap-2 rounded-xl border-red-100">
            <HiSearch className="text-gray-400" size={15} />
            <input type="text" placeholder="Cari nama atau email..." value={search}
              onChange={e=>setSearch(e.target.value)} className="grow text-sm" />
            {search && <button onClick={()=>setSearch("")}><HiX size={13} className="text-gray-400"/></button>}
          </label>

          {/* Role filter */}
          <div className="relative">
            <button onClick={()=>{setRoleOpen(!roleOpen);setStatusOpen(false)}}
              className="btn btn-sm btn-outline border-red-200 text-red-800 hover:bg-red-50 rounded-xl gap-1">
              {roleFilter === "Semua" ? "Semua Role" : roleLabel[roleFilter]}
              <HiChevronDown size={13} className={roleOpen?"rotate-180 transition-transform":"transition-transform"} />
            </button>
            {roleOpen && (
              <div className="absolute top-full mt-1 left-0 bg-white border border-red-100 rounded-xl shadow-xl z-20 min-w-36 overflow-hidden">
                {["Semua","admin","marketing","direktur"].map(r => (
                  <button key={r} onClick={()=>{setRoleFilter(r);setRoleOpen(false)}}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-red-50 ${roleFilter===r?"text-red-800 font-bold bg-red-50":"text-gray-700"}`}>
                    {r==="Semua" ? "Semua Role" : roleLabel[r]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status filter */}
          <div className="relative">
            <button onClick={()=>{setStatusOpen(!statusOpen);setRoleOpen(false)}}
              className="btn btn-sm btn-outline border-red-200 text-red-800 hover:bg-red-50 rounded-xl gap-1">
              {statusFilter}
              <HiChevronDown size={13} className={statusOpen?"rotate-180 transition-transform":"transition-transform"} />
            </button>
            {statusOpen && (
              <div className="absolute top-full mt-1 left-0 bg-white border border-red-100 rounded-xl shadow-xl z-20 min-w-28 overflow-hidden">
                {["Semua","Aktif","Nonaktif"].map(s => (
                  <button key={s} onClick={()=>{setStatus(s);setStatusOpen(false)}}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-red-50 ${statusFilter===s?"text-red-800 font-bold bg-red-50":"text-gray-700"}`}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Staff grid ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-14 text-gray-400">
          <HiOutlineUsers size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-sm">Staff tidak ditemukan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(s => (
            <div key={s.id} className={`card bg-base-100 shadow hover:shadow-md transition-all border ${s.isActive ? "border-red-50" : "border-gray-100 opacity-70"}`}>
              <div className="card-body p-4 gap-3">
                <div className="flex items-center gap-3">
                  <Avatar nama={s.nama} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-800 truncate">{s.nama}</p>
                    <p className="text-xs text-gray-400 truncate">{s.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`badge badge-sm ${roleBadge[s.role]} text-white`}>
                      {roleLabel[s.role]}
                    </span>
                    <span className={`badge badge-sm ${s.isActive ? "badge-success" : "badge-ghost"}`}>
                      {s.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                </div>

                <div className="divider my-0" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <HiOutlinePhone size={14} className="text-red-400" />
                    <span className="text-xs font-mono">{s.noHp}</span>
                  </div>
                  {canManage && s.isActive && (
                    <div className="flex gap-1">
                      <button className="btn btn-xs btn-ghost text-blue-500 hover:bg-blue-50 rounded-lg">
                        <HiOutlinePencil size={13} />
                      </button>
                      <button onClick={() => { setConfirmId(s.id); document.getElementById("confirm-modal").showModal(); }}
                        className="btn btn-xs btn-ghost text-red-400 hover:bg-red-50 rounded-lg">
                        <HiOutlineBan size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal Tambah Staff ── */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box rounded-2xl max-w-md">
            <h3 className="font-bold text-lg text-red-900 mb-4">Tambah Staff Baru</h3>
            <div className="space-y-3">
              <label className="form-control w-full">
                <div className="label"><span className="label-text text-xs font-semibold text-gray-600">Nama Lengkap *</span></div>
                <input type="text" placeholder="Nama lengkap staff" className="input input-bordered input-sm w-full rounded-xl" />
              </label>
              <label className="form-control w-full">
                <div className="label"><span className="label-text text-xs font-semibold text-gray-600">Email *</span></div>
                <input type="email" placeholder="email@philip.co.id" className="input input-bordered input-sm w-full rounded-xl" />
              </label>
              <label className="form-control w-full">
                <div className="label"><span className="label-text text-xs font-semibold text-gray-600">Nomor HP *</span></div>
                <input type="tel" placeholder="08xxxxxxxxxx" className="input input-bordered input-sm w-full rounded-xl" />
              </label>
              <label className="form-control w-full">
                <div className="label"><span className="label-text text-xs font-semibold text-gray-600">Role *</span></div>
                <select className="select select-bordered select-sm w-full rounded-xl">
                  <option value="">Pilih role</option>
                  <option value="admin">Admin</option>
                  <option value="marketing">Marketing</option>
                  <option value="direktur">Direktur</option>
                </select>
              </label>
            </div>
            <div className="modal-action mt-5">
              <button onClick={() => setShowModal(false)} className="btn btn-sm btn-ghost rounded-xl">Batal</button>
              <button className="btn btn-sm btn-error text-white rounded-xl">Simpan Staff</button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
        </div>
      )}

      {/* ── Confirm Deactivate Modal ── */}
      <dialog id="confirm-modal" className="modal">
        <div className="modal-box rounded-2xl max-w-sm">
          <h3 className="font-bold text-lg text-red-900">Nonaktifkan Akun?</h3>
          <p className="text-sm text-gray-500 mt-2">
            Akun staff ini tidak akan dapat login setelah dinonaktifkan. Data tetap tersimpan dan dapat diaktifkan kembali.
          </p>
          <div className="modal-action">
            <button onClick={() => document.getElementById("confirm-modal").close()}
              className="btn btn-sm btn-ghost rounded-xl">Batal</button>
            <button onClick={() => handleDeactivate(confirmId)}
              className="btn btn-sm btn-error text-white rounded-xl">Ya, Nonaktifkan</button>
          </div>
        </div>
        <div className="modal-backdrop" onClick={() => document.getElementById("confirm-modal").close()} />
      </dialog>
    </div>
  );
}
