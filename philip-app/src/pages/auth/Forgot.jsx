// philip-app/src/pages/auth/Forgot.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../../components/Toast";
import { BsFillExclamationDiamondFill } from "react-icons/bs";
import { ImSpinner2 } from "react-icons/im";
import { HiCheckCircle } from "react-icons/hi";

export default function Forgot() {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validasi email
    if (!email.trim()) {
      setError("Email wajib diisi");
      return;
    }

    // Validasi format email sederhana
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Format email tidak valid");
      return;
    }

    setLoading(true);

    try {
      // Panggil API forgot password
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: email.trim() }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengirim link reset password");
      }

      setSuccess(true);
      showToast(
        "Link reset password telah dikirim ke email Anda",
        "success"
      );
      setEmail("");
    } catch (err) {
      setError(err.message || "Terjadi kesalahan, silakan coba lagi");
      showToast(err.message || "Gagal mengirim link reset password", "error");
    } finally {
      setLoading(false);
    }
  };

  const errorInfo = error ? (
    <div className="bg-red-200 mb-4 p-4 text-sm font-medium text-red-800 rounded-lg flex items-center border border-red-300">
      <BsFillExclamationDiamondFill className="text-red-600 me-2 text-lg flex-shrink-0" />
      {error}
    </div>
  ) : null;

  const successInfo = success ? (
    <div className="bg-green-200 mb-4 p-4 text-sm font-medium text-green-800 rounded-lg flex items-center border border-green-300">
      <HiCheckCircle className="text-green-600 me-2 text-lg flex-shrink-0" />
      Link reset password telah dikirim ke email Anda. Silakan cek inbox atau folder spam.
    </div>
  ) : null;

  const loadingInfo = loading ? (
    <div className="bg-gray-200 mb-4 p-4 text-sm rounded-lg flex items-center border border-gray-300">
      <ImSpinner2 className="me-2 animate-spin text-gray-600" />
      Mengirim link reset password...
    </div>
  ) : null;

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-700 mb-2 text-center">
        Forgot Your Password?
      </h2>

      <p className="text-sm text-gray-500 mb-6 text-center">
        Enter your email address and we'll send you a link to reset your
        password.
      </p>

      {errorInfo}
      {successInfo}
      {loadingInfo}

      <form onSubmit={handleSubmit}>
        <div className="mb-5">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email Address
          </label>

          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || success}
            className={`w-full px-4 py-2 bg-gray-50 border rounded-lg shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-red-800 outline-none transition-all ${
              error
                ? "border-red-300 focus:border-red-500"
                : success
                ? "border-green-300 focus:border-green-500"
                : "border-gray-300 focus:border-red-500"
            }`}
            placeholder="you@example.com"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className={`w-full font-semibold py-2.5 px-4 rounded-lg transition duration-300 ${
            loading || success
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-red-800 hover:bg-red-900 text-white"
          }`}
        >
          {loading ? "Mengirim..." : success ? "Link Terkirim ✓" : "Send Reset Link"}
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          Sudah ingat password?{" "}
          <Link to="/login" className="text-red-800 font-semibold hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}