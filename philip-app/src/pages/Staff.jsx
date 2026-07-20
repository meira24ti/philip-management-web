// philip-app/src/pages/Staff.jsx
import { useMemo, useState, useEffect, useCallback } from "react";
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
import { useAuth } from "../context/useAuth";
import { useToast } from "../components/ToastContext";
import { staffService } from "../services/staffService";
import { getImageUrl } from "../utils/imageUrl";
import api from "../services/api";

// ─── CONSTANTS ──────────────────────────────────────────────
const roleLabel = { admin: "Admin", marketing: "Marketing", direktur: "Direktur" };
const roleTitle = {
  admin: "Administrator Sistem",
  marketing: "Marketing Property",
  direktur: "Direktur",
};
const roleBadge = { admin: "badge-error", marketing: "badge-info", direktur: "badge-warning" };
const roleOrder = ["direktur", "admin", "marketing"];

const normalizePhone = (phone) => (phone || "").replace(/\D/g, "");
const whatsappNumber = (phone) => {
  const normalized = normalizePhone(phone);
  return normalized.startsWith("0") ? `62${normalized.slice(1)}` : normalized || "";
};

// ─── AVATAR COMPONENT ──────────────────────────────────────
function Avatar({ staff }) {
  const [fotoError, setFotoError] = useState(false);
  const initials = staff.nama
    ?.split(" ")
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
  const fotoUrl = getImageUrl(staff.foto_profil);

  return (
    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white text-white shadow-md ring ring-red-100 ring-offset-2">
      {fotoUrl && !fotoError ? (
        <img
          src={fotoUrl}
          alt={staff.nama || "Foto staff"}
          className="h-full w-full object-contain"
          onError={() => setFotoError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-red-700 to-red-950 text-lg font-bold">
          {initials}
        </div>
      )}
    </div>
  );
}

// ─── STAFF CARD ─────────────────────────────────────────────
function StaffCard({ staff, canManage, onEdit, onDeactivate, compact = false }) {
  const phone = normalizePhone(staff.no_hp);
  const wa = whatsappNumber(staff.no_hp);

  return (
    <div
      className={[
        "card bg-base-100 border shadow-sm transition-all duration-200",
        "hover:-translate-y-1 hover:shadow-lg",
        staff.is_active ? "border-red-50" : "border-gray-100 opacity-70",
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
                  {roleTitle[staff.role] || staff.role}
                </p>
              </div>

              <span className={`badge badge-sm ${roleBadge[staff.role] || "badge-ghost"} shrink-0 text-white`}>
                {roleLabel[staff.role] || staff.role}
              </span>
            </div>

            <span className={`badge badge-sm mt-2 ${staff.is_active ? "badge-success" : "badge-ghost"}`}>
              {staff.is_active ? "Aktif" : "Nonaktif"}
            </span>
          </div>
        </div>

        <div className="space-y-2 rounded-2xl bg-red-50/60 p-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <HiOutlinePhone className="shrink-0 text-red-700" size={16} />
            <span className="font-mono text-xs">{staff.no_hp || "-"}</span>
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

          {canManage && staff.is_active && (
            <div className="flex gap-1">
              <button
                onClick={() => onEdit(staff)}
                className="btn btn-xs btn-ghost rounded-lg text-blue-500 hover:bg-blue-50"
              >
                <HiOutlinePencil size={14} />
              </button>

              <button
                onClick={() => onDeactivate(staff.id_user)}
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

// ─── ROLE SECTION ──────────────────────────────────────────
function RoleSection({ role, staff, canManage, onEdit, onDeactivate }) {
  const isMarketing = role === "marketing";

  if (staff.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-red-900">{roleLabel[role] || role}</h2>
          <p className="text-sm text-gray-500">
            {staff.length} staff {roleLabel[role]?.toLowerCase() || role}
          </p>
        </div>

        <span className={`badge ${roleBadge[role] || "badge-ghost"} text-white`}>
          {roleLabel[role] || role}
        </span>
      </div>

      {isMarketing ? (
        <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-3 scroll-smooth">
          {staff.map((member) => (
            <StaffCard
              key={member.id_user}
              staff={member}
              canManage={canManage}
              onEdit={onEdit}
              onDeactivate={onDeactivate}
              compact
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {staff.map((member) => (
            <StaffCard
              key={member.id_user}
              staff={member}
              canManage={canManage}
              onEdit={onEdit}
              onDeactivate={onDeactivate}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────
export default function Staff() {
  const { role } = useAuth();
  const { showToast } = useToast();

  // ─── State ──────────────────────────────────────────────
  const [staffData, setStaffData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("Semua");
  const [statusFilter, setStatus] = useState("Aktif");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [roleOpen, setRoleOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  // ─── Edit form + foto ──────────────────────────────────
  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    no_hp: "",
    role: "",
    password: "",
  });
  const [editFotoFile, setEditFotoFile] = useState(null);
  const [editFotoPreview, setEditFotoPreview] = useState(null);

  const canManage = ["admin", "direktur"].includes(role);

  // ─── Fetch data ──────────────────────────────────────────
  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const data = await staffService.getAll();
      setStaffData(data);
    } catch (err) {
      console.error(err);
      showToast("Gagal memuat data staff", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchStaff();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchStaff]);

  // ─── Stats ──────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: staffData.length,
    marketing: staffData.filter((s) => s.role === "marketing").length,
    admin: staffData.filter((s) => s.role === "admin").length,
    direktur: staffData.filter((s) => s.role === "direktur").length,
  }), [staffData]);

  // ─── Filtering ──────────────────────────────────────────
  const filtered = staffData.filter((staff) => {
    const q = search.toLowerCase();
    const matchQ = staff.nama?.toLowerCase().includes(q) || staff.email?.toLowerCase().includes(q) || false;
    const matchR = roleFilter === "Semua" || staff.role === roleFilter;
    const matchS = statusFilter === "Semua" ||
      (statusFilter === "Aktif" ? staff.is_active : !staff.is_active);
    return matchQ && matchR && matchS;
  });

  const groupedStaff = roleOrder.reduce((groups, role) => {
    groups[role] = filtered.filter((staff) => staff.role === role);
    return groups;
  }, {});

  // ─── Handlers ────────────────────────────────────────────
  const handleConfirmDeactivate = (id) => {
    setConfirmId(id);
    document.getElementById("confirm-modal")?.showModal();
  };

  const handleDeactivate = async (id) => {
    try {
      await staffService.deactivate(id);
      await fetchStaff();
      showToast("Staff berhasil dinonaktifkan", "warning");
      setConfirmId(null);
      document.getElementById("confirm-modal")?.close();
    } catch (err) {
      showToast(err.response?.data?.message || "Gagal menonaktifkan staff", "error");
    }
  };

  const handleOpenEdit = (staff) => {
    setSelectedStaff(staff);
    setFormData({
      nama: staff.nama,
      email: staff.email,
      no_hp: staff.no_hp || "",
      role: staff.role,
    });
    setEditFotoFile(null);
    setEditFotoPreview(null);
    setShowEditModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditFotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditFotoFile(file);
    setEditFotoPreview(URL.createObjectURL(file));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await staffService.create(formData);
      showToast("Staff berhasil ditambahkan", "success");
      setShowModal(false);
      setFormData({ nama: "", email: "", no_hp: "", role: "", password: "" });
      await fetchStaff();
    } catch (err) {
      showToast(err.response?.data?.message || "Gagal menambahkan staff", "error");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      // Update data staff
      await staffService.update(selectedStaff.id_user, formData);

      // Upload foto jika ada
      if (editFotoFile) {
        const form = new FormData();
        form.append("foto", editFotoFile);
        await api.post(`/staff/${selectedStaff.id_user}/upload-foto`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      showToast("Data staff berhasil diperbarui", "success");
      setShowEditModal(false);
      setSelectedStaff(null);
      setEditFotoFile(null);
      setEditFotoPreview(null);
      await fetchStaff();
    } catch (err) {
      showToast(err.response?.data?.message || "Gagal memperbarui staff", "error");
    }
  };

  // ─── Loading ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg text-red-800" />
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────
  return (
    <div
      className="space-y-5"
      onClick={() => {
        setRoleOpen(false);
        setStatusOpen(false);
      }}
    >
      {/* ── Header ── */}
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

      {/* ── Stats ── */}
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

      {/* ── Search & Filter ── */}
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
              {roleFilter === "Semua" ? "Semua Role" : roleLabel[roleFilter] || roleFilter}
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
                    {role === "Semua" ? "Semua Role" : roleLabel[role] || role}
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

      {/* ── Staff List ── */}
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
              staff={groupedStaff[role] || []}
              canManage={canManage}
              onEdit={handleOpenEdit}
              onDeactivate={handleConfirmDeactivate}
            />
          ))}
        </div>
      )}

      {/* ── Modal Tambah Staff ── */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md rounded-2xl">
            <h3 className="mb-4 text-lg font-bold text-red-900">Tambah Staff Baru</h3>
``
            <form onSubmit={handleCreate}>
              <div className="space-y-3">
                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text text-xs font-semibold text-gray-600">Nama Lengkap *</span>
                  </div>
                  <input
                    type="text"
                    name="nama"
                    placeholder="Nama lengkap staff"
                    className="input input-bordered input-sm w-full rounded-xl"
                    value={formData.nama}
                    onChange={handleFormChange}
                    required
                  />
                </label>

                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text text-xs font-semibold text-gray-600">Email *</span>
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="email@philip.co.id"
                    className="input input-bordered input-sm w-full rounded-xl"
                    value={formData.email}
                    onChange={handleFormChange}
                    required
                  />
                </label>

                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text text-xs font-semibold text-gray-600">Nomor HP *</span>
                  </div>
                  <input
                    type="tel"
                    name="no_hp"
                    placeholder="08xxxxxxxxxx"
                    className="input input-bordered input-sm w-full rounded-xl"
                    value={formData.no_hp}
                    onChange={handleFormChange}
                    required
                  />
                </label>

                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text text-xs font-semibold text-gray-600">Role *</span>
                  </div>
                  <select
                    name="role"
                    className="select select-bordered select-sm w-full rounded-xl"
                    value={formData.role}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Pilih role</option>
                    <option value="admin">Admin</option>
                    <option value="marketing">Marketing</option>
                    <option value="direktur">Direktur</option>
                  </select>
                </label>

                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text text-xs font-semibold text-gray-600">Password</span>
                  </div>
                  <input
                    type="password"
                    name="password"
                    placeholder="Password staff (opsional)"
                    className="input input-bordered input-sm w-full rounded-xl"
                    value={formData.password}
                    onChange={handleFormChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">Kosongkan untuk generate password otomatis.</p>
                </label>
              </div>

              <div className="modal-action mt-5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-sm btn-ghost rounded-xl"
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-sm btn-error rounded-xl text-white">
                  Simpan Staff
                </button>
              </div>
            </form>
          </div>

          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
        </div>
      )}

      {/* ── Modal Edit Staff ── */}
      {showEditModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md rounded-2xl">
            <h3 className="mb-4 text-lg font-bold text-red-900">Edit Staff</h3>

            <form onSubmit={handleUpdate}>
              <div className="space-y-3">
                {/* Field foto profil */}
                <div className="mb-3">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Foto Profil</label>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100">
                      {editFotoPreview || selectedStaff?.foto_profil ? (
                        <img
                          src={editFotoPreview || getImageUrl(selectedStaff?.foto_profil)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center text-white text-sm font-bold">
                          {selectedStaff?.nama?.[0] || "?"}
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="file-input file-input-sm file-input-error rounded-xl"
                      onChange={handleEditFotoChange}
                    />
                  </div>
                </div>

                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text text-xs font-semibold text-gray-600">Nama Lengkap *</span>
                  </div>
                  <input
                    type="text"
                    name="nama"
                    placeholder="Nama lengkap staff"
                    className="input input-bordered input-sm w-full rounded-xl"
                    value={formData.nama}
                    onChange={handleFormChange}
                    required
                  />
                </label>

                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text text-xs font-semibold text-gray-600">Email *</span>
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="email@philip.co.id"
                    className="input input-bordered input-sm w-full rounded-xl"
                    value={formData.email}
                    onChange={handleFormChange}
                    required
                  />
                </label>

                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text text-xs font-semibold text-gray-600">Nomor HP *</span>
                  </div>
                  <input
                    type="tel"
                    name="no_hp"
                    placeholder="08xxxxxxxxxx"
                    className="input input-bordered input-sm w-full rounded-xl"
                    value={formData.no_hp}
                    onChange={handleFormChange}
                    required
                  />
                </label>

                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text text-xs font-semibold text-gray-600">Role *</span>
                  </div>
                  <select
                    name="role"
                    className="select select-bordered select-sm w-full rounded-xl"
                    value={formData.role}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Pilih role</option>
                    <option value="admin">Admin</option>
                    <option value="marketing">Marketing</option>
                    <option value="direktur">Direktur</option>
                  </select>
                </label>
              </div>

              <div className="modal-action mt-5">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedStaff(null);
                    setEditFotoFile(null);
                    setEditFotoPreview(null);
                  }}
                  className="btn btn-sm btn-ghost rounded-xl"
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-sm btn-error rounded-xl text-white">
                  Update Staff
                </button>
              </div>
            </form>
          </div>

          <div className="modal-backdrop" onClick={() => {
            setShowEditModal(false);
            setSelectedStaff(null);
            setEditFotoFile(null);
            setEditFotoPreview(null);
          }} />
        </div>
      )}

      {/* ── Modal Konfirmasi Nonaktif ── */}
      <dialog id="confirm-modal" className="modal">
        <div className="modal-box max-w-sm rounded-2xl">
          <h3 className="text-lg font-bold text-red-900">Nonaktifkan Akun?</h3>
          <p className="mt-2 text-sm text-gray-500">
            Akun staff ini tidak akan dapat login setelah dinonaktifkan. Data tetap tersimpan dan dapat diaktifkan kembali.
          </p>

          <div className="modal-action">
            <button
              onClick={() => document.getElementById("confirm-modal")?.close()}
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

        <div className="modal-backdrop" onClick={() => document.getElementById("confirm-modal")?.close()} />
      </dialog>
    </div>
  );
}