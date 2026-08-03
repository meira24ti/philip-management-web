// philip-app/src/pages/Settings.jsx
import { useState, useEffect } from "react";
import {
  HiOutlineOfficeBuilding, HiOutlineUser,
  HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff
} from "react-icons/hi";
import { useAuth } from "../context/useAuth";
import { useToast } from "../components/ToastContext";
import { settingService } from "../services/settingService";
import { authService } from "../services/authService";
import { getImageUrl } from "../utils/imageUrl";

export default function Settings() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const role = user?.role || "";
  const canEditCompany = role === "admin" || role === "direktur";

  // ─── State ──────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(canEditCompany ? "perusahaan" : "profil");
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState({
    company: false,
    profile: false,
    password: false,
    logo: false,
    foto: false,
  });

  // ─── Company state (sesuai key_name di database) ──────
  const [company, setCompany] = useState({
    company_name: "Philip Real Estate",
    company_tagline: "JUAL · BELI · SEWA · KPR",
    company_city: "Pekanbaru, Riau",
    company_phone: "0761-XXXXXXX",
    hero_title: "Build Your Future",
    hero_subtitle: "with us",
    hero_desc: "Mulai langkah besar dari keputusan hari ini.",
    company_logo: null,
  });

  // ─── Profile state ──────────────────────────────────────
  const [profile, setProfile] = useState(() => ({
    nama: user?.nama || "",
    email: user?.email || "",
    no_hp: user?.no_hp || "",
    role: user?.role || "",
    foto_profil: user?.foto_profil || null,
  }));

  // ─── Password state ─────────────────────────────────────
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // ─── File upload refs ──────────────────────────────────
  const [logoFile, setLogoFile] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);

  // ─── Load data ──────────────────────────────────────────
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await settingService.getAll();
        setCompany(prev => ({
          ...prev,
          company_name: data.company_name || prev.company_name,
          company_tagline: data.company_tagline || prev.company_tagline,
          company_city: data.company_city || prev.company_city,
          company_phone: data.company_phone || prev.company_phone,
          hero_title: data.hero_title || prev.hero_title,
          hero_subtitle: data.hero_subtitle || prev.hero_subtitle,
          hero_desc: data.hero_desc || prev.hero_desc,
          company_logo: data.company_logo || null,
        }));
      } catch (err) {
        console.error(err);
        showToast("Gagal memuat pengaturan", "error");
      }
    };
    loadSettings();
  }, [showToast]);

  // ─── Handlers ────────────────────────────────────────────
  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    setCompany(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  const handleFotoFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFotoFile(e.target.files[0]);
    }
  };

  // ─── Save Company ──────────────────────────────────────
  const handleSaveCompany = async () => {
    try {
      setLoading(prev => ({ ...prev, company: true }));

      if (logoFile) {
        await settingService.uploadLogo(logoFile);
        setLogoFile(null);
      }

      // Kirim key yang sesuai dengan database
      await settingService.update({
        company_name: company.company_name,
        company_tagline: company.company_tagline,
        company_city: company.company_city,
        company_phone: company.company_phone,
        hero_title: company.hero_title,
        hero_subtitle: company.hero_subtitle,
        hero_desc: company.hero_desc,
      });

      showToast("Pengaturan perusahaan berhasil disimpan", "success");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      showToast(err.response?.data?.message || "Gagal menyimpan pengaturan", "error");
    } finally {
      setLoading(prev => ({ ...prev, company: false }));
    }
  };

  // ─── Save Profile ──────────────────────────────────────
  const handleSaveProfile = async () => {
    try {
      setLoading(prev => ({ ...prev, profile: true }));

      if (fotoFile) {
        await authService.uploadFoto(fotoFile);
        setFotoFile(null);
      }

      await authService.updateProfile({
        nama: profile.nama,
        no_hp: profile.no_hp,
      });

      showToast("Profil berhasil diperbarui", "success");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      showToast(err.response?.data?.message || "Gagal memperbarui profil", "error");
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  };

  // ─── Change Password ──────────────────────────────────
  const handleChangePassword = async () => {
    try {
      if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        showToast("Semua field password wajib diisi", "error");
        return;
      }
      if (passwordData.newPassword.length < 8) {
        showToast("Password baru minimal 8 karakter", "error");
        return;
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        showToast("Konfirmasi password tidak sesuai", "error");
        return;
      }

      setLoading(prev => ({ ...prev, password: true }));

      await authService.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });

      showToast("Password berhasil diubah", "success");
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      showToast(err.response?.data?.message || "Gagal mengubah password", "error");
    } finally {
      setLoading(prev => ({ ...prev, password: false }));
    }
  };

  // ─── Tabs ──────────────────────────────────────────────
  const tabs = canEditCompany
    ? [
        { id: "perusahaan", label: "Perusahaan", icon: HiOutlineOfficeBuilding },
        { id: "profil", label: "Profil Saya", icon: HiOutlineUser },
        { id: "keamanan", label: "Keamanan", icon: HiOutlineLockClosed },
      ]
    : [
        { id: "profil", label: "Profil Saya", icon: HiOutlineUser },
        { id: "keamanan", label: "Keamanan", icon: HiOutlineLockClosed },
      ];

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-bold text-red-900">Pengaturan</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kelola pengaturan sistem dan profil akun</p>
      </div>

      {/* ── Tabs ── */}
      <div className="tabs tabs-boxed bg-red-50 p-1 rounded-xl w-full sm:w-fit gap-1 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`tab gap-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === t.id ? "tab-active bg-red-800 text-white shadow" : "text-gray-600 hover:text-red-800"
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Perusahaan ── */}
      {activeTab === "perusahaan" && canEditCompany && (
        <div className="card bg-base-100 shadow border border-red-50">
          <div className="card-body p-4 sm:p-5 gap-4">
            <h3 className="font-bold text-red-900">Identitas Perusahaan</h3>
            <p className="text-xs text-gray-400 -mt-2">Data ini akan ditampilkan di sidebar, hero banner, dan flyer properti.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="form-control">
                <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Nama Perusahaan *</span></div>
                <input
                  type="text"
                  name="company_name"
                  className="input input-bordered input-sm rounded-xl"
                  value={company.company_name}
                  onChange={handleCompanyChange}
                />
              </label>
              <label className="form-control">
                <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Tagline</span></div>
                <input
                  type="text"
                  name="company_tagline"
                  className="input input-bordered input-sm rounded-xl"
                  value={company.company_tagline}
                  onChange={handleCompanyChange}
                />
              </label>
              <label className="form-control">
                <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Kota / Lokasi</span></div>
                <input
                  type="text"
                  name="company_city"
                  className="input input-bordered input-sm rounded-xl"
                  value={company.company_city}
                  onChange={handleCompanyChange}
                />
              </label>
              <label className="form-control">
                <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Nomor Telepon</span></div>
                <input
                  type="text"
                  name="company_phone"
                  className="input input-bordered input-sm rounded-xl"
                  value={company.company_phone}
                  onChange={handleCompanyChange}
                />
              </label>
            </div>

            <div className="divider text-xs text-gray-400">Teks Hero Banner</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="form-control">
                <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Judul Hero</span></div>
                <input
                  type="text"
                  name="hero_title"
                  className="input input-bordered input-sm rounded-xl"
                  value={company.hero_title}
                  onChange={handleCompanyChange}
                />
              </label>
              <label className="form-control">
                <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Sub Judul (italic)</span></div>
                <input
                  type="text"
                  name="hero_subtitle"
                  className="input input-bordered input-sm rounded-xl"
                  value={company.hero_subtitle}
                  onChange={handleCompanyChange}
                />
              </label>
              <label className="form-control">
                <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Deskripsi</span></div>
                <input
                  type="text"
                  name="hero_desc"
                  className="input input-bordered input-sm rounded-xl"
                  value={company.hero_desc}
                  onChange={handleCompanyChange}
                />
              </label>
            </div>

            <div className="divider text-xs text-gray-400">Logo Perusahaan</div>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-700 to-red-900 rounded-2xl flex items-center justify-center shadow overflow-hidden">
                {company.company_logo ? (
                  <img
                    src={getImageUrl(company.company_logo)}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-2xl font-serif">P</span>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Upload Logo</p>
                <p className="text-xs text-gray-400 mb-2">Format PNG/JPG, maks 2MB, disarankan 200×200px</p>
                <input
                  type="file"
                  accept="image/*"
                  className="file-input file-input-bordered file-input-sm file-input-error rounded-xl w-full max-w-xs"
                  onChange={handleLogoFileChange}
                />
                {logoFile && (
                  <p className="text-xs text-green-600 mt-1">✓ {logoFile.name} siap diupload</p>
                )}
              </div>
            </div>

            {/* Preview mini */}
            <div className="bg-red-950 rounded-xl p-4 mt-1">
              <p className="text-red-300 text-[10px] uppercase tracking-widest mb-1">
                {company.company_name} · {company.company_city}
              </p>
              <p className="text-white text-lg font-bold font-serif">{company.hero_title}</p>
              <p className="text-red-300 text-sm italic">{company.hero_subtitle}</p>
              <p className="text-red-200 text-xs mt-1">{company.hero_desc}</p>
            </div>

            <div className="flex justify-end mt-2">
              <button
                onClick={handleSaveCompany}
                disabled={loading.company}
                className="btn btn-sm btn-error text-white rounded-xl shadow gap-2 w-full sm:w-auto"
              >
                {loading.company ? (
                  <><span className="loading loading-spinner loading-xs" /> Menyimpan...</>
                ) : saved ? (
                  "✓ Tersimpan!"
                ) : (
                  "Simpan Perubahan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* non-editing users won't see the perusahaan tab, so no access-denied message */}

      {/* ── Profil Saya ── */}
      {activeTab === "profil" && (
        <div className="card bg-base-100 shadow border border-red-50">
          <div className="card-body p-4 sm:p-5 gap-4">
            <h3 className="font-bold text-red-900">Profil Akun Saya</h3>

            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center text-white text-xl font-bold shadow overflow-hidden">
                {profile.foto_profil ? (
                  <img
                    src={getImageUrl(profile.foto_profil)}
                    alt={profile.nama}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile.nama?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U"
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Foto Profil</p>
                <p className="text-xs text-gray-400 mb-2">Format PNG/JPG, maks 2MB</p>
                <input
                  type="file"
                  accept="image/*"
                  className="file-input file-input-bordered file-input-sm file-input-error rounded-xl w-full max-w-xs"
                  onChange={handleFotoFileChange}
                />
                {fotoFile && (
                  <p className="text-xs text-green-600 mt-1">✓ {fotoFile.name} siap diupload</p>
                )}
              </div>
            </div>

            <div className="divider my-0" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="form-control">
                <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Nama Lengkap</span></div>
                <input
                  type="text"
                  name="nama"
                  className="input input-bordered input-sm rounded-xl"
                  value={profile.nama}
                  onChange={handleProfileChange}
                />
              </label>
              <label className="form-control">
                <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Email</span></div>
                <input
                  type="email"
                  className="input input-bordered input-sm rounded-xl bg-gray-50"
                  value={profile.email}
                  disabled
                />
              </label>
              <label className="form-control">
                <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Nomor HP</span></div>
                <input
                  type="tel"
                  name="no_hp"
                  className="input input-bordered input-sm rounded-xl"
                  value={profile.no_hp}
                  onChange={handleProfileChange}
                />
              </label>
              <label className="form-control">
                <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Role</span></div>
                <input
                  type="text"
                  className="input input-bordered input-sm rounded-xl bg-gray-50"
                  value={profile.role}
                  disabled
                />
              </label>
            </div>

            <div className="flex justify-end mt-2">
              <button
                onClick={handleSaveProfile}
                disabled={loading.profile}
                className="btn btn-sm btn-error text-white rounded-xl shadow w-full sm:w-auto"
              >
                {loading.profile ? (
                  <><span className="loading loading-spinner loading-xs" /> Menyimpan...</>
                ) : saved ? (
                  "✓ Tersimpan!"
                ) : (
                  "Simpan Profil"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Keamanan ── */}
      {activeTab === "keamanan" && (
        <div className="card bg-base-100 shadow border border-red-50">
          <div className="card-body p-4 sm:p-5 gap-4 max-w-md">
            <h3 className="font-bold text-red-900">Ganti Password</h3>
            <label className="form-control">
              <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Password Lama</span></div>
              <div className="relative">
                <input
                  type={showOldPw ? "text" : "password"}
                  name="oldPassword"
                  placeholder="••••••••"
                  className="input input-bordered input-sm rounded-xl w-full pr-10"
                  value={passwordData.oldPassword}
                  onChange={handlePasswordChange}
                />
                <button
                  type="button"
                  onClick={() => setShowOldPw(!showOldPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showOldPw ? <HiOutlineEyeOff size={16} /> : <HiOutlineEye size={16} />}
                </button>
              </div>
            </label>
            <label className="form-control">
              <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Password Baru</span></div>
              <div className="relative">
                <input
                  type={showNewPw ? "text" : "password"}
                  name="newPassword"
                  placeholder="Min. 8 karakter"
                  className="input input-bordered input-sm rounded-xl w-full pr-10"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showNewPw ? <HiOutlineEyeOff size={16} /> : <HiOutlineEye size={16} />}
                </button>
              </div>
            </label>
            <label className="form-control">
              <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Konfirmasi Password Baru</span></div>
              <div className="relative">
                <input
                  type={showConfirmPw ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Ulangi password baru"
                  className="input input-bordered input-sm rounded-xl w-full pr-10"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                />
                <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-label="Tampilkan atau sembunyikan konfirmasi password">
                  {showConfirmPw ? <HiOutlineEyeOff size={16} /> : <HiOutlineEye size={16} />}
                </button>
              </div>
            </label>
            <div className="mt-2">
              <button
                onClick={handleChangePassword}
                disabled={loading.password}
                className="btn btn-sm btn-error text-white rounded-xl shadow"
              >
                {loading.password ? (
                  <><span className="loading loading-spinner loading-xs" /> Memproses...</>
                ) : saved ? (
                  "✓ Password diubah!"
                ) : (
                  "Ganti Password"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
