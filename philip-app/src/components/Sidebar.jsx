// philip-app/src/components/Sidebar.jsx
import { useState, useEffect } from "react";
import {
  HiOutlineHome,
  HiOutlineOfficeBuilding,
  HiOutlineUsers,
  HiOutlineChartBar,
  HiOutlineCog,
  HiOutlineLogout,
} from "react-icons/hi";
import { BiX } from "react-icons/bi";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { settingService } from "../services/settingService";
import { getImageUrl } from "../utils/imageUrl";

const sidebarBg = { background: "linear-gradient(180deg, #7A0000 0%, #5c0000 100%)" };

function SidebarProfileAvatar({ fotoProfil, initials, name }) {
  const [hasError, setHasError] = useState(false);
  const fotoUrl = getImageUrl(fotoProfil);
  const hasPhoto = fotoUrl && !hasError;

  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-bold ${
        hasPhoto ? "bg-white" : "bg-white/20 text-white"
      }`}
    >
      {hasPhoto ? (
        <img
          src={fotoUrl}
          alt={name ? `Foto profil ${name}` : "Foto profil"}
          className="h-full w-full object-contain p-0.5"
          onError={() => setHasError(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
}

export default function Sidebar({ mobileOpen = false, onMobileOpenChange }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [logoError, setLogoError] = useState(false);

  // ─── State untuk data perusahaan dari settingService ──────
  const [company, setCompany] = useState({
    name: "Philip Real Estate",
    tagline: "JUAL | BELI | SEWA | KPR",
    logo: null,
  });

  // ─── Load data perusahaan ──────────────────────────────────
  useEffect(() => {
    settingService
      .getAll()
      .then((data) =>
        setCompany({
          name: data.company_name || "Philip Real Estate",
          tagline: data.tagline || data.company_tagline || "JUAL | BELI | SEWA | KPR",
          logo: data.company_logo || null,
        })
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    onMobileOpenChange?.(false);
  }, [location.pathname, onMobileOpenChange]);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onMobileOpenChange?.(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen, onMobileOpenChange]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => {
      if (mediaQuery.matches) onMobileOpenChange?.(false);
    };

    mediaQuery.addEventListener("change", closeOnDesktop);
    return () => mediaQuery.removeEventListener("change", closeOnDesktop);
  }, [onMobileOpenChange]);

  // ─── Navigasi berdasarkan role ─────────────────────────────
  const allNavItems = [
    {
      label: "Utama",
      Icon: HiOutlineHome,
      id: "dashboard",
      roles: ["admin", "marketing", "direktur"],
    },
    {
      label: "Property",
      Icon: HiOutlineOfficeBuilding,
      id: "property",
      roles: ["admin", "marketing", "direktur"],
    },
    {
      label: "Staff",
      Icon: HiOutlineUsers,
      id: "staff",
      roles: ["admin", "marketing", "direktur"],
    },
    {
      label: "Reports",
      Icon: HiOutlineChartBar,
      id: "reports",
      roles: ["admin", "direktur"],
    },
    {
      label: "Settings",
      Icon: HiOutlineCog,
      id: "settings",
      roles: ["admin", "marketing", "direktur"],
    },
  ];

  // Filter menu berdasarkan role user
  const navItems = allNavItems.filter((item) => item.roles.includes(role));

  // ─── Inisial nama untuk avatar ─────────────────────────────
  const initials =
    user?.nama
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  // ─── Handle Logout ──────────────────────────────────────────
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // ─── Komponen Logo ──────────────────────────────────────────
  const logoUrl = getImageUrl(company.logo);

  const logoElement = (
    <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
      {logoUrl && !logoError ? (
        <img
          src={logoUrl}
          alt="logo"
          className="w-10 h-10 rounded-xl bg-white object-contain p-1 shadow-md flex-shrink-0"
          onError={() => setLogoError(true)}
        />
      ) : (
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
          <span className="text-red-800 font-bold text-xl font-serif">P</span>
        </div>
      )}
      <div className="overflow-hidden">
        <p className="text-white font-bold text-sm leading-tight font-serif tracking-wide truncate">
          {company.name}
        </p>
        <p className="text-red-200 text-[10px] leading-tight truncate">
          {company.tagline}
        </p>
      </div>
    </div>
  );

  // ─── Komponen NavList ───────────────────────────────────────
  const navList = (
    <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
      {navItems.map(({ label, Icon, id }) => (
        <NavLink
          key={id}
          to={`/${id}`}
          onClick={() => onMobileOpenChange?.(false)}
          className={({ isActive }) =>
            [
              "flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl",
              "transition-all duration-200 font-semibold text-sm",
              isActive
                ? "bg-white text-red-900 shadow-sm"
                : "text-white hover:bg-white/20",
            ].join(" ")
          }
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );

  // ─── Komponen Footer User ───────────────────────────────────
  const userFooter = (
    <div className="px-3 py-4 border-t border-white/10 space-y-1">
      {/* Info user */}
      <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
        <SidebarProfileAvatar
          key={user?.foto_profil || "profile-fallback"}
          fotoProfil={user?.foto_profil}
          initials={initials}
          name={user?.nama}
        />
        <div className="overflow-hidden flex-1">
          <p className="text-white font-semibold text-sm truncate">
            {user?.nama || "Pengguna"}
          </p>
          <p className="text-red-200 text-xs capitalize">{role || "-"}</p>
        </div>
      </div>

      {/* Tombol Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-red-200
                   hover:bg-white/10 hover:text-white transition-all text-sm font-medium"
      >
        <HiOutlineLogout size={18} />
        <span>Keluar</span>
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={[
          "fixed inset-0 z-40 bg-slate-950/45 transition-opacity duration-300 ease-out md:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        aria-hidden={!mobileOpen}
        onClick={() => onMobileOpenChange?.(false)}
      />

      {/* Mobile drawer */}
      <aside
        id="mobile-navigation"
        aria-label="Navigasi utama"
        aria-hidden={!mobileOpen}
        className={[
          "fixed inset-y-0 left-0 z-50 flex h-dvh w-72 max-w-[calc(100vw-2rem)] flex-col shadow-2xl shadow-black/25 md:hidden",
          "transform-gpu transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        style={sidebarBg}
      >
        <button
          type="button"
          onClick={() => onMobileOpenChange?.(false)}
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-xl text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Tutup menu navigasi"
        >
          <BiX size={24} />
        </button>
        {logoElement}
        {navList}
        {userFooter}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="m-4 mr-0 hidden w-56 flex-shrink-0 flex-col rounded-2xl border border-white/10 shadow-xl shadow-red-950/20 md:sticky md:top-4 md:flex md:h-[calc(100dvh-2rem)] md:self-start lg:w-64"
        style={sidebarBg}
      >
        {logoElement}
        {navList}
        {userFooter}
      </aside>
    </>
  );
}
