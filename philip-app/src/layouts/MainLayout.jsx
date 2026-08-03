import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function MainLayout() {
  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top_right,_rgba(122,0,0,0.08),_transparent_28rem)]">
      <div className="flex min-h-dvh min-w-0">

        <Sidebar />

        <main className="min-w-0 flex-1 p-3 pt-16 sm:p-4 sm:pt-16 md:pt-4">
          <Header />

          <Outlet />
        </main>

      </div>
    </div>
  );
}
