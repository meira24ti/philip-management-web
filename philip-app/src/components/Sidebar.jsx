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
import { BiMenu, BiX } from "react-icons/bi";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { settingService } from "../services/settingService";
import { getImageUrl } from "../utils/imageUrl";

const sidebarBg = { background: "linear-gradient(180deg, #7A0000 0%, #5c0000 100%)" };

export default function Sidebar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
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
          className="w-10 h-10 rounded-xl object-cover shadow-md flex-shrink-0"
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
          onClick={() => setMobileOpen(false)}
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
        {user?.foto_profil ? (
          <img
            src={user.foto_profil}
            alt="profil"
            className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
            onError={(e) => (e.target.style.display = "none")}
          />
        ) : (
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
            {initials}
          </div>
        )}
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
      {/* Hamburger — mobile only */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden bg-red-800 text-white p-2 rounded-xl shadow-lg"
      >
        <BiMenu size={24} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={[
          "fixed top-0 left-0 h-full w-64 z-50 flex flex-col md:hidden",
          "transform transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        style={sidebarBg}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-white/70 hover:text-white"
        >
          <BiX size={24} />
        </button>
        {logoElement}
        {navList}
        {userFooter}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col w-56 lg:w-64 min-h-screen flex-shrink-0 rounded-2xl m-4 mr-0"
        style={sidebarBg}
      >
        {logoElement}
        {navList}
        {userFooter}
      </aside>
    </>
  );
}
