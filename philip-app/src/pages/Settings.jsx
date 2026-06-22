import { useState } from "react";
import { HiOutlineCog, HiOutlineOfficeBuilding, HiOutlineUser,
  HiOutlineLockClosed, HiOutlinePhotograph, HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";

const CURRENT_ROLE = "admin";

export default function Settings() {
  const [activeTab,    setActiveTab]    = useState("perusahaan");
  const [showOldPw,    setShowOldPw]    = useState(false);
  const [showNewPw,    setShowNewPw]    = useState(false);
  const [saved,        setSaved]        = useState(false);

  // Company data state
  const [company, setCompany] = useState({
    name:    "Philip Real Estate",
    tagline: "JUAL · BELI · SEWA · KPR",
    city:    "Pekanbaru, Riau",
    phone:   "0761-XXXXXXX",
    heroTitle:"Build Your Future",
    heroSub: "with us",
    heroDesc:"Mulai langkah besar dari keputusan hari ini.",
  });

  // Profile state
  const [profile, setProfile] = useState({
    nama:  "Lorenza Estrada",
    email: "lorenza@philip.co.id",
    noHp:  "08123456789",
    role:  "Admin",
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const tabs = [
    { id:"perusahaan", label:"Perusahaan",  icon: HiOutlineOfficeBuilding },
    { id:"profil",     label:"Profil Saya", icon: HiOutlineUser           },
    { id:"keamanan",   label:"Keamanan",    icon: HiOutlineLockClosed     },
  ];

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-bold text-red-900">Pengaturan</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kelola pengaturan sistem dan profil akun</p>
      </div>

      {/* ── Tabs ── */}
      <div className="tabs tabs-boxed bg-red-50 p-1 rounded-xl w-fit gap-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`tab gap-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab===t.id ? "tab-active bg-red-800 text-white shadow" : "text-gray-600 hover:text-red-800"}`}>
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Perusahaan ── */}
      {activeTab === "perusahaan" && (
        <div className="card bg-base-100 shadow border border-red-50">
          <div className="card-body p-5 gap-4">
            <h3 className="font-bold text-red-900">Identitas Perusahaan</h3>
            <p className="text-xs text-gray-400 -mt-2">Data ini akan ditampilkan di sidebar, hero banner, dan flyer properti.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="form-control">
                <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Nama Perusahaan *</span></div>
                <input type="text" className="input input-bordered input-sm rounded-xl"
                  value={company.name} onChange={e=>setCompany({...company,name:e.target.value})} />
              </label>
              <label className="form-control">
                <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Tagline</span></div>
                <input type="text" className="input input-bordered input-sm rounded-xl"
                  value={company.tagline} onChange={e=>setCompany({...company,tagline:e.target.value})} />
              </label>
              <label className="form-control">
                <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Kota / Lokasi</span></div>
                <input type="text" className="input input-bordered input-sm rounded-xl"
                  value={company.city} onChange={e=>setCompany({...company,city:e.target.value})} />
              </label>
              <label className="form-control">
                <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Nomor Telepon</span></div>
                <input type="text" className="input input-bordered input-sm rounded-xl"
                  value={company.phone} onChange={e=>setCompany({...company,phone:e.target.value})} />
              </label>
            </div>

            <div className="divider text-xs text-gray-400">Teks Hero Banner</div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="form-control">
                <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Judul Hero</span></div>
                <input type="text" className="input input-bordered input-sm rounded-xl"
                  value={company.heroTitle} onChange={e=>setCompany({...company,heroTitle:e.target.value})} />
              </label>
              <label className="form-control">
                <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Sub Judul (italic)</span></div>
                <input type="text" className="input input-bordered input-sm rounded-xl"
                  value={company.heroSub} onChange={e=>setCompany({...company,heroSub:e.target.value})} />
              </label>
              <label className="form-control">
                <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Deskripsi</span></div>
                <input type="text" className="input input-bordered input-sm rounded-xl"
                  value={company.heroDesc} onChange={e=>setCompany({...company,heroDesc:e.target.value})} />
              </label>
            </div>

            <div className="divider text-xs text-gray-400">Logo Perusahaan</div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-red-700 to-red-900 rounded-2xl flex items-center justify-center shadow">
                <span className="text-white font-bold text-2xl font-serif">P</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Upload Logo</p>
                <p className="text-xs text-gray-400 mb-2">Format PNG/JPG, maks 2MB, disarankan 200×200px</p>
                <input type="file" accept="image/*" className="file-input file-input-bordered file-input-sm file-input-error rounded-xl w-full max-w-xs" />
              </div>
            </div>

            {/* Preview mini */}
            <div className="bg-red-950 rounded-xl p-4 mt-1">
              <p className="text-red-300 text-[10px] uppercase tracking-widest mb-1">{company.name} · {company.city}</p>
              <p className="text-white text-lg font-bold font-serif">{company.heroTitle}</p>
              <p className="text-red-300 text-sm italic">{company.heroSub}</p>
              <p className="text-red-200 text-xs mt-1">{company.heroDesc}</p>
            </div>

            <div className="flex justify-end mt-2">
              <button onClick={handleSave} className="btn btn-sm btn-error text-white rounded-xl shadow gap-2">
                {saved ? "✓ Tersimpan!" : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Profil Saya ── */}
      {activeTab === "profil" && (
        <div className="card bg-base-100 shadow border border-red-50">
          <div className="card-body p-5 gap-4">
            <h3 className="font-bold text-red-900">Profil Akun Saya</h3>

            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center text-white text-xl font-bold shadow">
                LE
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Foto Profil</p>
                <p className="text-xs text-gray-400 mb-2">Format PNG/JPG, maks 2MB</p>
                <input type="file" accept="image/*" className="file-input file-input-bordered file-input-sm file-input-error rounded-xl w-full max-w-xs" />
              </div>
            </div>

            <div className="divider my-0" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="form-control">
                <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Nama Lengkap</span></div>
                <input type="text" className="input input-bordered input-sm rounded-xl"
                  value={profile.nama} onChange={e=>setProfile({...profile,nama:e.target.value})} />
              </label>
              <label className="form-control">
                <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Email</span></div>
                <input type="email" className="input input-bordered input-sm rounded-xl"
                  value={profile.email} onChange={e=>setProfile({...profile,email:e.target.value})} />
              </label>
              <label className="form-control">
                <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Nomor HP</span></div>
                <input type="tel" className="input input-bordered input-sm rounded-xl"
                  value={profile.noHp} onChange={e=>setProfile({...profile,noHp:e.target.value})} />
              </label>
              <label className="form-control">
                <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Role</span></div>
                <input type="text" className="input input-bordered input-sm rounded-xl bg-gray-50"
                  value={profile.role} disabled />
              </label>
            </div>

            <div className="flex justify-end mt-2">
              <button onClick={handleSave} className="btn btn-sm btn-error text-white rounded-xl shadow">
                {saved ? "✓ Tersimpan!" : "Simpan Profil"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Keamanan ── */}
      {activeTab === "keamanan" && (
        <div className="card bg-base-100 shadow border border-red-50">
          <div className="card-body p-5 gap-4 max-w-md">
            <h3 className="font-bold text-red-900">Ganti Password</h3>
            <label className="form-control">
              <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Password Lama</span></div>
              <div className="relative">
                <input type={showOldPw ? "text" : "password"} placeholder="••••••••"
                  className="input input-bordered input-sm rounded-xl w-full pr-10" />
                <button type="button" onClick={()=>setShowOldPw(!showOldPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showOldPw ? <HiOutlineEyeOff size={16}/> : <HiOutlineEye size={16}/>}
                </button>
              </div>
            </label>
            <label className="form-control">
              <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Password Baru</span></div>
              <div className="relative">
                <input type={showNewPw ? "text" : "password"} placeholder="Min. 8 karakter"
                  className="input input-bordered input-sm rounded-xl w-full pr-10" />
                <button type="button" onClick={()=>setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showNewPw ? <HiOutlineEyeOff size={16}/> : <HiOutlineEye size={16}/>}
                </button>
              </div>
            </label>
            <label className="form-control">
              <div className="label py-0.5"><span className="label-text text-xs font-semibold text-gray-600">Konfirmasi Password Baru</span></div>
              <input type="password" placeholder="Ulangi password baru"
                className="input input-bordered input-sm rounded-xl w-full" />
            </label>
            <div className="mt-2">
              <button onClick={handleSave} className="btn btn-sm btn-error text-white rounded-xl shadow">
                {saved ? "✓ Password diubah!" : "Ganti Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
