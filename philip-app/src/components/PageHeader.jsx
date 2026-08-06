import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BiBell, BiChevronDown, BiMenu, BiRefresh } from "react-icons/bi";
import { HiOutlineHome } from "react-icons/hi";
import { useAuth } from "../context/useAuth";
import api from "../services/api";
import { getImageUrl } from "../utils/imageUrl";

const APP_STARTED = Date.now();

export default function PageHeader({ menuOpen = false, onOpenMenu }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [avatarError, setAvatarError] = useState(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    try {
      setLoadingNotifs(true);
      const { data } = await api.get("/auth/notifikasi");
      setNotifs(Array.isArray(data) ? data : []);
    } catch {
      setNotifs([]);
    } finally {
      setLoadingNotifs(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(loadNotifications, 0);
    return () => window.clearTimeout(timer);
  }, [loadNotifications]);

  useEffect(() => {
    const handler = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const relativeTime = (date) => {
    const seconds = Math.max(0, Math.floor((APP_STARTED - new Date(date).getTime()) / 1000));
    if (seconds < 60) return "Baru saja";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
    return `${Math.floor(seconds / 86400)} hari lalu`;
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const avatarKey = user?.foto_profil || "no-avatar";
  const initials = user?.nama ? user.nama.split(" ").map((name) => name[0]).join("").slice(0, 2).toUpperCase() : "?";
  const pageTitle = (() => {
    if (location.pathname.startsWith("/property/edit/")) return "Edit Properti";
    if (location.pathname.startsWith("/property/")) return "Detail Properti";
    if (location.pathname === "/property") return "Properti";
    if (location.pathname === "/staff") return "Staff";
    if (location.pathname === "/reports") return "Laporan";
    if (location.pathname === "/settings") return "Pengaturan";
    return "Dashboard";
  })();

  return (
    <header className="relative z-30 mb-4 flex h-14 items-center justify-between rounded-2xl border border-red-100/70 bg-white/95 px-3 shadow-sm backdrop-blur sm:px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        {onOpenMenu && (
          <button
            type="button"
            onClick={onOpenMenu}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-red-800 transition-colors hover:bg-red-50 md:hidden"
            aria-label="Buka menu navigasi"
            aria-controls="mobile-navigation"
            aria-expanded={menuOpen}
          >
            <BiMenu size={23} />
          </button>
        )}
        <HiOutlineHome className="text-red-800" />
        <p className="truncate font-semibold text-red-900">{pageTitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative" ref={notifRef}>
          <button onClick={() => { setNotifOpen((open) => !open); setProfileOpen(false); }} className="relative rounded-xl p-2 text-red-800 transition-colors hover:bg-red-50" aria-label="Buka notifikasi">
            <BiBell size={20} />
          </button>

          {notifOpen && (
            <div className="fixed inset-x-3 top-16 z-[60] max-h-[calc(100dvh-5rem)] overflow-hidden rounded-2xl border border-red-100 bg-white shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[22rem] sm:max-h-none">
              <div className="flex items-center justify-between border-b border-red-50 p-3">
                <div><p className="text-sm font-bold text-red-900">Notifikasi</p><p className="text-xs text-gray-400">Aktivitas terkini</p></div>
                <div className="flex items-center gap-1">
                  <button onClick={loadNotifications} className="btn btn-ghost btn-xs btn-square text-red-700" title="Muat ulang" aria-label="Muat ulang notifikasi"><BiRefresh size={16} className={loadingNotifs ? "animate-spin" : ""} /></button>
                </div>
              </div>
              <div className="max-h-[calc(100dvh-8.5rem)] overflow-y-auto sm:max-h-80">
                {loadingNotifs && notifs.length === 0 ? <div className="flex justify-center py-8"><span className="loading loading-spinner loading-sm text-red-800" /></div>
                  : notifs.length === 0 ? <p className="py-8 text-center text-sm text-gray-400">Belum ada notifikasi</p>
                  : notifs.map((notification) => <div key={notification.id_log} className="border-b border-red-50 px-4 py-3 last:border-0">
                    <p className="text-sm font-semibold text-gray-800">{notification.aksi_label}</p><p className="mt-1 whitespace-pre-wrap break-words text-xs leading-relaxed text-gray-600">{notification.detail}</p><p className="mt-1.5 text-xs text-gray-400">{relativeTime(notification.created_at)}</p>
                  </div>)}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button onClick={() => { setProfileOpen((open) => !open); setNotifOpen(false); }} className="flex items-center gap-2 rounded-xl p-1.5 pr-3 transition-colors hover:bg-red-50">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-red-800 text-white">
              {user?.foto_profil && avatarError !== avatarKey ? <img key={avatarKey} src={getImageUrl(user.foto_profil)} className="h-full w-full bg-white object-contain p-0.5" onError={() => setAvatarError(avatarKey)} alt={user?.nama || "Avatar"} /> : <span className="text-xs font-bold">{initials}</span>}
            </div>
            <span className="hidden text-sm font-semibold text-red-900 md:block">{user?.nama || "Pengguna"}</span>
            <BiChevronDown className={`text-red-700 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
          </button>
          {profileOpen && <div className="absolute right-0 z-[60] mt-2 w-52 overflow-hidden rounded-2xl border border-red-100 bg-white shadow-xl">
            <div className="border-b border-red-50 px-4 py-3"><p className="text-sm font-bold text-red-900">{user?.nama}</p><p className="text-xs capitalize text-gray-400">{role}</p></div>
            <Link to="/settings" onClick={() => setProfileOpen(false)} className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-red-50">Profil Saya</Link>
            <Link to="/settings" onClick={() => setProfileOpen(false)} className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-red-50">Pengaturan</Link>
            <button onClick={handleLogout} className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-700 hover:bg-red-50">Keluar</button>
          </div>}
        </div>
      </div>
    </header>
  );
}
