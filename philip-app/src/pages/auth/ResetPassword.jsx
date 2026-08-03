import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";
import { authService } from "../../services/authService";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const token = params.get("token");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!token) return setError("Tautan reset tidak lengkap. Silakan minta tautan baru.");
    if (newPassword.length < 8) return setError("Password baru minimal 8 karakter.");
    if (newPassword !== confirmPassword) return setError("Konfirmasi password tidak sesuai.");

    try {
      setLoading(true);
      await authService.resetPassword({ token, newPassword });
      navigate("/login", { replace: true, state: { message: "Password berhasil direset. Silakan masuk." } });
    } catch (err) {
      setError(err.response?.data?.message || "Gagal mereset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="mb-2 text-center text-2xl font-semibold text-gray-800">Buat Password Baru</h2>
      <p className="mb-6 text-center text-sm text-gray-500">Gunakan password minimal 8 karakter yang belum pernah digunakan.</p>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <form onSubmit={submit} className="space-y-4">
        <label className="form-control">
          <span className="mb-1 text-sm font-medium text-gray-700">Password baru</span>
          <div className="relative">
            <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input input-bordered w-full rounded-xl pr-11" autoComplete="new-password" required />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-800" aria-label="Tampilkan atau sembunyikan password">
              {showPassword ? <HiOutlineEyeOff size={19} /> : <HiOutlineEye size={19} />}
            </button>
          </div>
        </label>
        <label className="form-control">
          <span className="mb-1 text-sm font-medium text-gray-700">Konfirmasi password baru</span>
          <div className="relative">
            <input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input input-bordered w-full rounded-xl pr-11" autoComplete="new-password" required />
            <button type="button" onClick={() => setShowConfirm((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-800" aria-label="Tampilkan atau sembunyikan konfirmasi password">
              {showConfirm ? <HiOutlineEyeOff size={19} /> : <HiOutlineEye size={19} />}
            </button>
          </div>
        </label>
        <button type="submit" disabled={loading} className="btn btn-error w-full rounded-xl text-white">
          {loading ? <span className="loading loading-spinner loading-sm" /> : "Simpan Password Baru"}
        </button>
      </form>
      <Link to="/login" className="mt-5 block text-center text-sm font-semibold text-red-800 hover:underline">Kembali ke login</Link>
    </div>
  );
}
