import { AiOutlineUser } from "react-icons/ai"; 
import { BiChevronDown } from "react-icons/bi";
import { BiBell } from "react-icons/bi";
import { AiOutlineHome } from "react-icons/ai";
import { useState } from "react";


export default function PageHeader() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="h-14 bg-white rounded-2xl flex items-center justify-between px-4 md:px-6 shadow-sm mb-4">

      <div className="flex items-center gap-2">
        <AiOutlineHome />
        <p className="font-semibold text-red-900">Utama</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
            className="relative p-2 rounded-xl hover:bg-red-50 transition-colors text-red-800"
          >
            <BiBell />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-red-100 p-4 z-50">
              <p className="font-bold text-red-900 mb-3 text-sm">Notifikasi</p>
              {[
                { msg: "Properti baru ditambahkan", time: "5 menit lalu" },
                { msg: "Laporan bulanan siap", time: "1 jam lalu" },
                { msg: "Staff baru terdaftar", time: "3 jam lalu" },
              ].map((n, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-red-50 last:border-0">
                  <span className="w-2 h-2 bg-red-400 rounded-full mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{n.msg}</p>
                    <p className="text-xs text-gray-400">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-red-50 transition-colors"
          >
            <div className="w-8 h-8 bg-red-800 rounded-lg flex items-center justify-center text-white">
              <AiOutlineUser />
            </div>
            <span className="hidden md:block text-sm font-semibold text-red-900">Admin</span>
            <span className="text-red-700"><BiChevronDown
              className={`transition-transform duration-200 ${profileOpen ? 'rotate-180' : 'rotate-0'}`}
            /></span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-red-100 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-red-50">
                <p className="font-bold text-red-900 text-sm">Lorenza Esrada</p>
                <p className="text-xs text-gray-400">Administrator</p>
              </div>
              {["Profil Saya", "Pengaturan", "Keluar"].map((item, i) => (
                <button key={i} className="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-red-50 text-gray-700 hover:text-red-800 transition-colors">
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
