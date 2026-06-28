import { useMemo, useState } from "react";
import {
  HiChevronDown,
  HiOutlineBan,
  HiOutlineMail,
  HiOutlinePencil,
  HiOutlinePhone,
  HiOutlineUserAdd,
  HiOutlineUsers,
  HiSearch,
  HiX,
} from "react-icons/hi";

const CURRENT_ROLE = "admin"; // "admin" | "direktur" | "marketing"

const staffList = [
  { id: 1, nama: "Lorenza Estrada", email: "lorenza@philip.co.id", role: "admin", noHp: "08123456789", isActive: true, foto: null },
  { id: 2, nama: "Rina Wati", email: "rina@philip.co.id", role: "marketing", noHp: "08234567890", isActive: true, foto: null },
  { id: 3, nama: "Budi Santoso", email: "budi@philip.co.id", role: "marketing", noHp: "08345678901", isActive: true, foto: null },
  { id: 4, nama: "Hendra Kurnia", email: "hendra@philip.co.id", role: "direktur", noHp: "08456789012", isActive: true, foto: null },
  { id: 5, nama: "Sari Dewi", email: "sari@philip.co.id", role: "marketing", noHp: "08567890123", isActive: false, foto: null },
  { id: 6, nama: "Ahmad Fauzi", email: "ahmad@philip.co.id", role: "admin", noHp: "08678901234", isActive: false, foto: null },
];

const roleLabel = { admin: "Admin", marketing: "Marketing", direktur: "Direktur" };
const roleTitle = {
  admin: "Administrator Sistem",
  marketing: "Marketing Property",
  direktur: "Direktur",
};
const roleBadge = { admin: "badge-error", marketing: "badge-info", direktur: "badge-warning" };
const roleOrder = ["direktur", "admin", "marketing"];

const normalizePhone = (phone) => phone.replace(/\D/g, "");
const whatsappNumber = (phone) => {
  const normalized = normalizePhone(phone);
  return normalized.startsWith("0") ? `62${normalized.slice(1)}` : normalized;
};

function Avatar({ staff }) {
  const initials = staff.nama
    .split(" ")
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="avatar">
      <div className="w-16 rounded-2xl bg-gradient-to-br from-red-700 to-red-950 text-white shadow-md ring ring-red-100 ring-offset-2">
        {staff.foto ? (
          <img src={staff.foto} alt={staff.nama} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg font-bold">
            {initials}
          </div>
        )}
      </div>
    </div>
  );
}

function StaffCard({ staff, canManage, onDeactivate, compact = false }) {
  const phone = normalizePhone(staff.noHp);
  const wa = whatsappNumber(staff.noHp);

  return (
    <div
      className={[
        "card bg-base-100 border shadow-sm transition-all duration-200",
        "hover:-translate-y-1 hover:shadow-lg",
        staff.isActive ? "border-red-50" : "border-gray-100 opacity-70",
        compact ? "w-72 shrink-0 snap-start" : "w-full",
      ].join(" ")}
    >
      <div className="card-body gap-4 p-4">
        <div className="flex items-start gap-4">
          <Avatar staff={staff} />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-base font-bold text-gray-800">
                  {staff.nama}
                </h3>
                <p className="text-sm font-medium text-red-800">
                  {roleTitle[staff.role]}
                </p>
              </div>

              <span className={`badge badge-sm ${roleBadge[staff.role]} shrink-0 text-white`}>
                {roleLabel[staff.role]}
              </span>
            </div>

            <span className={`badge badge-sm mt-2 ${staff.isActive ? "badge-success" : "badge-ghost"}`}>
              {staff.isActive ? "Aktif" : "Nonaktif"}
            </span>
          </div>
        </div>

        <div className="space-y-2 rounded-2xl bg-red-50/60 p-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <HiOutlinePhone className="shrink-0 text-red-700" size={16} />
            <span className="font-mono text-xs">{staff.noHp}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <HiOutlineMail className="shrink-0 text-red-700" size={16} />
            <span className="truncate text-xs">{staff.email}</span>
          </div>
        </div>

        <div className="card-actions items-center justify-between gap-2">
          <div className="flex gap-2">
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-sm rounded-xl border-green-200 bg-green-50 text-green-700 hover:border-green-300 hover:bg-green-100"
            >
              WhatsApp
            </a>

            <a
              href={`tel:${phone}`}
              className="btn btn-sm rounded-xl border-red-200 bg-white text-red-800 hover:border-red-300 hover:bg-red-50"
            >
              Call
            </a>
          </div>

          {canManage && staff.isActive && (
            <div className="flex gap-1">
              <button className="btn btn-xs btn-ghost rounded-lg text-blue-500 hover:bg-blue-50">
                <HiOutlinePencil size={14} />
              </button>

              <button
                onClick={() => onDeactivate(staff.id)}
                className="btn btn-xs btn-ghost rounded-lg text-red-500 hover:bg-red-50"
              >
                <HiOutlineBan size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RoleSection({ role, staff, canManage, onDeactivate }) {
  const isMarketing = role === "marketing";

  if (staff.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-red-900">{roleLabel[role]}</h2>
          <p className="text-sm text-gray-500">
            {staff.length} staff {roleLabel[role].toLowerCase()}
          </p>
        </div>

        <span className={`badge ${roleBadge[role]} text-white`}>
          {roleLabel[role]}
        </span>
      </div>

      {isMarketing ? (
        <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-3 scroll-smooth">
          {staff.map((member) => (
            <StaffCard
              key={member.id}
              staff={member}
              canManage={canManage}
              onDeactivate={onDeactivate}
              compact
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {staff.map((member) => (
            <StaffCard
              key={member.id}
              staff={member}
              canManage={canManage}
              onDeactivate={onDeactivate}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default function Staff() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("Semua");
  const [statusFilter, setStatus] = useState("Aktif");
  const [showModal, setShowModal] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [staffData, setStaffData] = useState(staffList);
  const [roleOpen, setRoleOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const canManage = ["admin", "direktur"].includes(CURRENT_ROLE);

  const stats = useMemo(() => ({
    total: staffData.length,
    marketing: staffData.filter((staff) => staff.role === "marketing").length,
    admin: staffData.filter((staff) => staff.role === "admin").length,
    direktur: staffData.filter((staff) => staff.role === "direktur").length,
  }), [staffData]);

  const filtered = staffData.filter((staff) => {
    const q = search.toLowerCase();
    const matchQ = staff.nama.toLowerCase().includes(q) || staff.email.toLowerCase().includes(q);
    const matchR = roleFilter === "Semua" || staff.role === roleFilter;
    const matchS = statusFilter === "Semua" || (statusFilter === "Aktif" ? staff.isActive : !staff.isActive);
    return matchQ && matchR && matchS;
  });

  const groupedStaff = roleOrder.reduce((groups, role) => {
    groups[role] = filtered.filter((staff) => staff.role === role);
    return groups;
  }, {});

  const handleConfirmDeactivate = (id) => {
    setConfirmId(id);
    document.getElementById("confirm-modal").showModal();
  };

  const handleDeactivate = (id) => {
    setStaffData((prev) => prev.map((staff) => (
      staff.id === id ? { ...staff, isActive: false } : staff
    )));
    setConfirmId(null);
    document.getElementById("confirm-modal").close();
  };

  return (
    <div
      className="space-y-5"
      onClick={() => {
        setRoleOpen(false);
        setStatusOpen(false);
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-red-900">Direktori Staff</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Informasi kontak tim Philip Real Estate berdasarkan role.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-sm btn-error rounded-xl text-white shadow"
          >
            <HiOutlineUserAdd size={16} /> Tambah Staff
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total Staff", value: stats.total, bg: "bg-red-50", text: "text-red-800" },
          { label: "Total Marketing", value: stats.marketing, bg: "bg-blue-50", text: "text-blue-700" },
          { label: "Total Admin", value: stats.admin, bg: "bg-rose-50", text: "text-rose-800" },
          { label: "Total Direktur", value: stats.direktur, bg: "bg-amber-50", text: "text-amber-700" },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} rounded-2xl border border-white p-4 shadow-sm`}>
            <p className={`text-2xl font-bold ${stat.text}`}>{stat.value}</p>
            <p className="text-xs font-medium text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div
        className="rounded-2xl border border-red-100 bg-white p-3 shadow-sm"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-wrap items-center gap-2">
          <label className="input input-bordered input-sm flex min-w-52 flex-1 items-center gap-2 rounded-xl border-red-100">
            <HiSearch className="text-gray-400" size={15} />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="grow text-sm"
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <HiX size={13} className="text-gray-400" />
              </button>
            )}
          </label>

          <div className="relative">
            <button
              onClick={() => {
                setRoleOpen(!roleOpen);
                setStatusOpen(false);
              }}
              className="btn btn-sm btn-outline rounded-xl border-red-200 text-red-800 hover:bg-red-50"
            >
              {roleFilter === "Semua" ? "Semua Role" : roleLabel[roleFilter]}
              <HiChevronDown size={13} className={roleOpen ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>

            {roleOpen && (
              <div className="absolute left-0 top-full z-20 mt-1 min-w-36 overflow-hidden rounded-xl border border-red-100 bg-white shadow-xl">
                {["Semua", "admin", "marketing", "direktur"].map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      setRoleFilter(role);
                      setRoleOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-red-50 ${
                      roleFilter === role ? "bg-red-50 font-bold text-red-800" : "text-gray-700"
                    }`}
                  >
                    {role === "Semua" ? "Semua Role" : roleLabel[role]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setStatusOpen(!statusOpen);
                setRoleOpen(false);
              }}
              className="btn btn-sm btn-outline rounded-xl border-red-200 text-red-800 hover:bg-red-50"
            >
              {statusFilter}
              <HiChevronDown size={13} className={statusOpen ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>

            {statusOpen && (
              <div className="absolute left-0 top-full z-20 mt-1 min-w-28 overflow-hidden rounded-xl border border-red-100 bg-white shadow-xl">
                {["Semua", "Aktif", "Nonaktif"].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatus(status);
                      setStatusOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-red-50 ${
                      statusFilter === status ? "bg-red-50 font-bold text-red-800" : "text-gray-700"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white py-14 text-center text-gray-400 shadow-sm">
          <HiOutlineUsers size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-semibold">Staff tidak ditemukan</p>
        </div>
      ) : (
        <div className="space-y-8">
          {roleOrder.map((role) => (
            <RoleSection
              key={role}
              role={role}
              staff={groupedStaff[role]}
              canManage={canManage}
              onDeactivate={handleConfirmDeactivate}
            />
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md rounded-2xl">
            <h3 className="mb-4 text-lg font-bold text-red-900">Tambah Staff Baru</h3>

            <div className="space-y-3">
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text text-xs font-semibold text-gray-600">Nama Lengkap *</span>
                </div>
                <input type="text" placeholder="Nama lengkap staff" className="input input-bordered input-sm w-full rounded-xl" />
              </label>

              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text text-xs font-semibold text-gray-600">Email *</span>
                </div>
                <input type="email" placeholder="email@philip.co.id" className="input input-bordered input-sm w-full rounded-xl" />
              </label>

              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text text-xs font-semibold text-gray-600">Nomor HP *</span>
                </div>
                <input type="tel" placeholder="08xxxxxxxxxx" className="input input-bordered input-sm w-full rounded-xl" />
              </label>

              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text text-xs font-semibold text-gray-600">Role *</span>
                </div>
                <select className="select select-bordered select-sm w-full rounded-xl">
                  <option value="">Pilih role</option>
                  <option value="admin">Admin</option>
                  <option value="marketing">Marketing</option>
                  <option value="direktur">Direktur</option>
                </select>
              </label>
            </div>

            <div className="modal-action mt-5">
              <button onClick={() => setShowModal(false)} className="btn btn-sm btn-ghost rounded-xl">
                Batal
              </button>
              <button className="btn btn-sm btn-error rounded-xl text-white">
                Simpan Staff
              </button>
            </div>
          </div>

          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
        </div>
      )}

      <dialog id="confirm-modal" className="modal">
        <div className="modal-box max-w-sm rounded-2xl">
          <h3 className="text-lg font-bold text-red-900">Nonaktifkan Akun?</h3>
          <p className="mt-2 text-sm text-gray-500">
            Akun staff ini tidak akan dapat login setelah dinonaktifkan. Data tetap tersimpan dan dapat diaktifkan kembali.
          </p>

          <div className="modal-action">
            <button
              onClick={() => document.getElementById("confirm-modal").close()}
              className="btn btn-sm btn-ghost rounded-xl"
            >
              Batal
            </button>

            <button
              onClick={() => handleDeactivate(confirmId)}
              className="btn btn-sm btn-error rounded-xl text-white"
            >
              Ya, Nonaktifkan
            </button>
          </div>
        </div>

        <div className="modal-backdrop" onClick={() => document.getElementById("confirm-modal").close()} />
      </dialog>
    </div>
  );
}
