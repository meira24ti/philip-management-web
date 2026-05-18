import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 px-5">
      <div className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-md">

        <div className="flex items-center justify-center mb-6">
          <h1 className="text-4xl font-extrabold text-red-900">
            Philip<span className="text-red-500">.</span>
          </h1>
        </div>

        <Outlet />

        <p className="text-center text-sm text-gray-500 mt-6">
          © 2025 Philip Property Dashboard
        </p>
      </div>
    </div>
  );
}