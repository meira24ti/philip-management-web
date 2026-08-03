import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BiChevronDown, BiBell } from "react-icons/bi";
import { HiOutlineHome } from "react-icons/hi";
import { useAuth } from "../context/useAuth";
import api from "../services/api";
import { getImageUrl } from "../utils/imageUrl";

const APP_STARTED = Date.now();
 
export default function PageHeader() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifs,      setNotifs]      = useState([]);
  const notifRef   = useRef(null);
  const profileRef = useRef(null);
 
  // Ambil notifikasi dari log_aktivitas terbaru
  useEffect(() => {
    api.get("/auth/notifikasi")
      .then(r => setNotifs(r.data))
      .catch(() => setNotifs([]));
  }, []);
 
  // Tutup dropdown saat klik luar
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
 
  const [avatarError, setAvatarError] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const avatarKey = user?.foto_profil || "no-avatar";

  // Inisial avatar dari nama user
  const initials = user?.nama
    ? user.nama.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()
    : "?";

  // Format waktu relatif
  const relativeTime = (dateStr) => {
    const diff = Math.floor((APP_STARTED - new Date(dateStr)) / 1000);
    if (diff < 60)   return `${diff} detik lalu`;
    if (diff < 3600) return `${Math.floor(diff/60)} menit lalu`;
    if (diff < 86400)return `${Math.floor(diff/3600)} jam lalu`;
    return `${Math.floor(diff/86400)} hari lalu`;
  };
 
  return (
    <header className="h-14 rounded-2xl border border-red-100/70 bg-white/95 pl-14 pr-3 shadow-sm backdrop-blur sm:px-4 md:px-6 mb-4 flex items-center justify-between">
 
      {/* Left */}
      <div className="flex items-center gap-2">
        <HiOutlineHome className="text-red-800" />
        <p className="font-semibold text-red-900">Utama</p>
      </div>
 
      {/* Right */}
      <div className="flex items-center gap-3">
 
        {/* Notifikasi */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
            className="relative p-2 rounded-xl hover:bg-red-50 transition-colors text-red-800"
          >
            <BiBell size={20} />
            {notifs.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            )}
          </button>
 
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] bg-white rounded-2xl shadow-xl border border-red-100 z-50">
              <div className="p-4 border-b border-red-50">
                <p className="font-bold text-red-900 text-sm">Notifikasi</p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifs.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-6">Tidak ada notifikasi</p>
                ) : notifs.map((n, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-red-50 last:border-0 hover:bg-red-50/50">
                    <span className="w-2 h-2 bg-red-400 rounded-full mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{n.aksi_label}</p>
                      <p className="text-xs text-gray-400">{n.detail}</p>
                      <p className="text-xs text-gray-300 mt-0.5">{relativeTime(n.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
 
        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-red-50 transition-colors"
          >
            <div className="w-8 h-8 bg-red-800 rounded-lg flex items-center justify-center text-white overflow-hidden">
              {user?.foto_profil && avatarError !== avatarKey ? (
                <img
                  key={avatarKey}
                  src={getImageUrl(user.foto_profil)}
                  className="w-full h-full object-contain bg-white"
                  onError={() => setAvatarError(avatarKey)}
                  alt={user?.nama || "Avatar"}
                />
              ) : (
                <span className="text-xs font-bold">{initials}</span>
              )}
            </div>
            <span className="hidden md:block text-sm font-semibold text-red-900">
              {user?.nama || "Pengguna"}
            </span>
            <BiChevronDown className={`text-red-700 transition-transform ${profileOpen?"rotate-180":""}`} />
          </button>
 
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-red-100 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-red-50">
                <p className="font-bold text-red-900 text-sm">{user?.nama}</p>
                <p className="text-xs text-gray-400 capitalize">{role}</p>
              </div>
              <Link to="/settings" onClick={() => setProfileOpen(false)}
                className="block w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-red-50 text-gray-700">
                Profil Saya
              </Link>
              <Link to="/settings" onClick={() => setProfileOpen(false)}
                className="block w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-red-50 text-gray-700">
                Pengaturan
              </Link>
              <button onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-red-50 text-red-700">
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
