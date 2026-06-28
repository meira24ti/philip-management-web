// philip-app/src/pages/auth/Login.jsx
// — Update bagian handleSubmit 

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { BsFillExclamationDiamondFill } from "react-icons/bs";
import { ImSpinner2 } from "react-icons/im";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [dataForm, setDataForm] = useState({
        email: "", // Tetap gunakan key 'email' agar sinkron dengan input name
        password: "",
    });

    const handleChange = (evt) => {
        const { name, value } = evt.target;
        setDataForm({
            ...dataForm,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await login(dataForm.email.trim(), dataForm.password.trim());
            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.message || "Email atau password salah!");
        } finally {
            setLoading(false);
        }
    };


    const errorInfo = error ? (
        <div className="bg-red-200 mb-5 p-4 text-sm font-medium text-red-800 rounded-lg flex items-center border border-red-300">
            <BsFillExclamationDiamondFill className="text-red-600 me-2 text-lg flex-shrink-0" />
            {error}
        </div>
    ) : null;

    const loadingInfo = loading ? (
        <div className="bg-gray-200 mb-5 p-4 text-sm rounded-lg flex items-center border border-gray-300">
            <ImSpinner2 className="me-2 animate-spin text-gray-600" />
            Mohon Tunggu...
        </div>
    ) : null;

    return (
        <div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-6 text-center">
                Welcome Back 👋
            </h2>

            {errorInfo}
            {loadingInfo}

            <form onSubmit={handleSubmit}>
                <div className="mb-5">
                    {/* Label diganti menjadi Email Address sesuai request kamu */}
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                    </label>
                    <input
                        type="text"
                        name="email"
                        value={dataForm.email}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 outline-none transition-all"
                        placeholder="Masukkan email (atau emilys)"
                        required
                    />
                </div>

                <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={dataForm.password}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 outline-none transition-all"
                            placeholder="Masukkan password"
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
                </div>

                <div className="text-right mb-6">
                    <Link to="/forgot" className="text-sm text-red-800 hover:underline font-medium">
                        Forgot Password?
                    </Link>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-red-800 hover:bg-red-900 text-white font-semibold py-2.5 rounded-lg shadow-md transition-all disabled:bg-gray-400"
                >
                    {loading ? "Authenticating..." : "Login"}
                </button>

                <p className="text-center text-sm text-gray-500 mt-6">
                    Belum punya akun?{" "}
                    <Link to="/register" className="text-red-800 font-semibold hover:underline">
                        Register
                    </Link>
                </p>
            </form>
        </div>
    );
}