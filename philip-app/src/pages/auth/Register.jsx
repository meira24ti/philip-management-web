// philip-app/src/pages/auth/Register.jsx — GANTI SELURUH ISI
// Saat ini masih memanggil /auth/register yang tidak ada di backend!
// Staff didaftarkan oleh Admin atau Direktur melalui staffService.create().
 
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useToast } from "../../components/ToastContext";
import { staffService } from "../../services/staffService";
import { BsFillExclamationDiamondFill } from "react-icons/bs";
import { ImSpinner2 } from "react-icons/im";
 
export default function Register() {
  const { role } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    nama: "", email: "", no_hp: "", role: "marketing",
  });
 
  if (role && !["admin", "direktur"].includes(role)) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="font-semibold text-red-700 mb-2">Akses Ditolak</p>
        <p className="text-sm">Halaman ini hanya untuk Admin atau Direktur.</p>
        <Link to="/dashboard" className="text-red-800 font-semibold hover:underline text-sm mt-3 block">
          ← Kembali ke Dashboard
        </Link>
      </div>
    );
  }
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await staffService.create(form);
      setSuccess(
        `Staff "${form.nama}" berhasil didaftarkan.\nPassword default: ${res.defaultPassword}\n(Sampaikan ke staff untuk diganti segera)`
      );
      showToast("Staff berhasil ditambahkan", "success");
      setForm({ nama:"", email:"", no_hp:"", role:"marketing" });
    } catch (err) {
      setError(err.response?.data?.message || "Gagal mendaftarkan staff");
    } finally { setLoading(false); }
  };
 
  const inputCls = "w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg " +
    "focus:ring-2 focus:ring-red-800 outline-none transition-all text-sm";
 
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-700 mb-2 text-center">
        Daftarkan Staff Baru
      </h2>
      <p className="text-xs text-gray-400 text-center mb-6">
        Admin dan Direktur dapat mendaftarkan staff baru ke sistem
      </p>
 
      {error && (
        <div className="bg-red-200 mb-4 p-3 text-sm font-medium text-red-800 rounded-lg flex items-center border border-red-300">
          <BsFillExclamationDiamondFill className="me-2 flex-shrink-0" />{error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 mb-4 p-3 text-sm font-medium text-green-800 rounded-lg border border-green-300 whitespace-pre-line">
          ✅ {success}
        </div>
      )}
      {loading && (
        <div className="bg-gray-100 mb-4 p-3 text-sm rounded-lg flex items-center">
          <ImSpinner2 className="me-2 animate-spin text-gray-600" />Mendaftarkan staff...
        </div>
      )}
 
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
          <input type="text" className={inputCls} placeholder="Nama lengkap staff"
            value={form.nama} onChange={e=>setForm(f=>({...f,nama:e.target.value}))} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input type="email" className={inputCls} placeholder="email@philip.co.id"
            value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nomor HP *</label>
          <input type="tel" className={inputCls} placeholder="08xxxxxxxxxx"
            value={form.no_hp} onChange={e=>setForm(f=>({...f,no_hp:e.target.value}))} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
          <select className={inputCls} value={form.role}
            onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
            <option value="direktur">Direktur</option>
            <option value="admin">Admin</option>
            <option value="marketing">Marketing</option>
          </select>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
          ⚠️ Password akan di-generate acak dan ditampilkan setelah pendaftaran. 
          Sampaikan password tersebut ke staff untuk diganti melalui Settings → Keamanan.
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-red-800 hover:bg-red-900 text-white font-semibold py-2.5 rounded-lg shadow-md transition-all disabled:bg-gray-400 text-sm">
          {loading ? "Mendaftarkan..." : "Daftarkan Staff"}
        </button>
        <p className="text-center text-sm text-gray-500">
          <Link to="/dashboard" className="text-red-800 font-semibold hover:underline">
            ← Kembali ke Dashboard
          </Link>
        </p>
      </form>
    </div>
  );
}
