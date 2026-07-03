// philip-app/src/pages/auth/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../../components/Toast";
import { BsFillExclamationDiamondFill } from "react-icons/bs";
import { ImSpinner2 } from "react-icons/im";
import { HiCheckCircle } from "react-icons/hi";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

export default function Register() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    confirmPassword: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const validateForm = () => {
    const { email, password, confirmPassword } = formData;

    // Validasi email
    if (!email.trim()) {
      setError("Email wajib diisi");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Format email tidak valid");
      return false;
    }

    // Validasi password
    if (!password) {
      setError("Password wajib diisi");
      return false;
    }

    if (password.length < 8) {
      setError("Password minimal 8 karakter");
      return false;
    }

    // Validasi confirm password
    if (!confirmPassword) {
      setError("Konfirmasi password wajib diisi");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak sesuai");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email.trim(),
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal mendaftar");
      }

      setSuccess(true);
      showToast(
        "Akun berhasil dibuat! Silakan login.",
        "success"
      );

      // Reset form
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
      });

      // Redirect ke login setelah 2 detik
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan, silakan coba lagi");
      showToast(err.message || "Gagal mendaftar", "error");
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
      Akun berhasil dibuat! Mengalihkan ke halaman login...
    </div>
  ) : null;

  const loadingInfo = loading ? (
    <div className="bg-gray-200 mb-4 p-4 text-sm rounded-lg flex items-center border border-gray-300">
      <ImSpinner2 className="me-2 animate-spin text-gray-600" />
      Mendaftarkan akun...
    </div>
  ) : null;

  const getFieldClass = (fieldName) => {
    const baseClass =
      "w-full px-4 py-2 bg-gray-50 border rounded-lg shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-red-800 outline-none transition-all";

    if (touched[fieldName]) {
      if (fieldName === "email" && formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        return `${baseClass} border-red-300 focus:border-red-500`;
      }
      if (fieldName === "password" && formData.password && formData.password.length < 8) {
        return `${baseClass} border-red-300 focus:border-red-500`;
      }
      if (fieldName === "confirmPassword" && formData.confirmPassword && formData.confirmPassword !== formData.password) {
        return `${baseClass} border-red-300 focus:border-red-500`;
      }
      if (fieldName === "confirmPassword" && formData.confirmPassword && formData.confirmPassword === formData.password) {
        return `${baseClass} border-green-300 focus:border-green-500`;
      }
    }

    if (success) {
      return `${baseClass} border-green-300 focus:border-green-500`;
    }

    return baseClass;
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-700 mb-6 text-center">
        Create Your Account ✨
      </h2>

      {errorInfo}
      {successInfo}
      {loadingInfo}

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-5">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email Address <span className="text-red-500">*</span>
          </label>

          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={loading || success}
            className={getFieldClass("email")}
            placeholder="you@example.com"
            required
          />
          {touched.email && formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
            <p className="text-xs text-red-500 mt-1">Masukkan email yang valid</p>
          )}
        </div>

        <div className="mb-5">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password <span className="text-red-500">*</span>
          </label>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={loading || success}
              className={getFieldClass("password")}
              placeholder="Min. 8 karakter"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-800"
            >
              {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
            </button>
          </div>
          {touched.password && formData.password && formData.password.length < 8 && (
            <p className="text-xs text-red-500 mt-1">Password minimal 8 karakter</p>
          )}
          {touched.password && formData.password && formData.password.length >= 8 && (
            <p className="text-xs text-green-500 mt-1">✓ Password kuat</p>
          )}
        </div>

        <div className="mb-6">
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Confirm Password <span className="text-red-500">*</span>
          </label>

          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={loading || success}
              className={getFieldClass("confirmPassword")}
              placeholder="Ulangi password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-800"
            >
              {showConfirmPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
            </button>
          </div>
          {touched.confirmPassword && formData.confirmPassword && formData.confirmPassword !== formData.password && (
            <p className="text-xs text-red-500 mt-1">Password tidak sesuai</p>
          )}
          {touched.confirmPassword && formData.confirmPassword && formData.confirmPassword === formData.password && formData.password.length >= 8 && (
            <p className="text-xs text-green-500 mt-1">✓ Password sesuai</p>
          )}
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
          {loading ? "Mendaftar..." : success ? "Berhasil ✓" : "Register"}
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          Sudah punya akun?{" "}
          <Link to="/login" className="text-red-800 font-semibold hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}