import { useState } from "react";
import { HiOutlineHome, HiOutlineOfficeBuilding, HiOutlineUsers, HiOutlineChartBar, HiOutlineCog } from "react-icons/hi";
import { BiMenu, BiX } from "react-icons/bi";
import { Link, NavLink } from "react-router-dom";



const navItems = [
  { label: "Utama",    Icon: HiOutlineHome,           id: "dashboard" },
  { label: "Property", Icon: HiOutlineOfficeBuilding, id: "property"  },
  { label: "Staff",    Icon: HiOutlineUsers,          id: "staff"     },
  { label: "Reports",  Icon: HiOutlineChartBar,       id: "reports"   },
  { label: "Settings", Icon: HiOutlineCog,            id: "settings"  },
];

const sidebarBg = { background: "linear-gradient(180deg, #7A0000 0%, #5c0000 100%)" };

export default function Sidebar() {
  const [active, setActive]         = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  const Logo = () => (
    <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
        <span className="text-red-800 font-bold text-xl font-serif">P</span>
      </div>
      <div>
        <p className="text-white font-bold text-sm leading-tight font-serif tracking-wide">PHILIP REAL ESTATE</p>
        <p className="text-red-200 text-[10px] leading-tight">JUAL | BELI | SEWA | KPR</p>
      </div>
    </div>
  );

  const NavList = () => (
    <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
      {navItems.map(({ label, Icon, id }) => (
        <NavLink
          key={id}
          to={`/${id}`}
          onClick={() => { setMobileOpen(false); }}
          className={({ isActive }) => [
            "flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl",
            "transition-all duration-200 font-semibold text-sm",
            isActive ? "bg-white text-red-900 shadow-sm" : "text-white hover:bg-white/20",
          ].join(" ")}
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );

  const UserFooter = () => (
    <div className="px-3 py-4 border-t border-white/10">
      <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/10 cursor-pointer transition-colors">
        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <HiOutlineUsers size={18} />
        </div>
        <div className="overflow-hidden">
          <p className="text-white font-semibold text-sm truncate">Lorenza Esrada</p>
          <p className="text-red-200 text-xs truncate">Admin</p>
        </div>
      </div>
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
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
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
        <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-white/70 hover:text-white">
          <BiX size={24} />
        </button>
        <Logo />
        <NavList />
        <UserFooter />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col w-56 lg:w-64 min-h-screen flex-shrink-0 rounded-2xl m-4 mr-0"
        style={sidebarBg}
      >
        <Logo />
        <NavList />
        <UserFooter />
      </aside>
    </>
  );
}
