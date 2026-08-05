import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top_right,_rgba(122,0,0,0.08),_transparent_28rem)]">
      <div className="flex min-h-dvh min-w-0">
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onMobileOpenChange={setMobileMenuOpen}
        />

        <main className="min-w-0 flex-1 p-3 pb-5 sm:p-4 sm:pb-6 lg:pr-5">
          <Header
            menuOpen={mobileMenuOpen}
            onOpenMenu={() => setMobileMenuOpen(true)}
          />

          <div key={location.pathname} className="page-transition">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
