import { useState } from "react";
import { Link } from "react-router-dom";
import { authService } from "../../services/authService";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      setLoading(true);
      await authService.forgotPassword({ email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Gagal mengirim tautan reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="mb-2 text-center text-2xl font-semibold text-gray-800">Lupa Password?</h2>
      <p className="mb-6 text-center text-sm text-gray-500">Masukkan email akun Anda. Kami akan mengirimkan tautan untuk membuat password baru.</p>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {sent && <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">Jika email terdaftar, tautan reset telah dikirim. Periksa inbox dan folder spam.</div>}

      {!sent && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="form-control">
            <span className="mb-1 text-sm font-medium text-gray-700">Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="input input-bordered w-full rounded-xl" placeholder="nama@perusahaan.com" autoComplete="email" required />
          </label>
          <button type="submit" disabled={loading} className="btn btn-error w-full rounded-xl text-white">
            {loading ? <span className="loading loading-spinner loading-sm" /> : "Kirim Tautan Reset"}
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-gray-500">Sudah ingat password? <Link to="/login" className="font-semibold text-red-800 hover:underline">Masuk</Link></p>
    </div>
  );
}
