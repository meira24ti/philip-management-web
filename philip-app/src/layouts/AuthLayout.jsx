import { Outlet, useLocation } from "react-router-dom";

export default function AuthLayout() {
  const location = useLocation();

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[radial-gradient(circle_at_top,_#fee2e2,_#fff7f7_42%,_#fef2f2)] p-4 sm:px-5">
      <div className="w-full max-w-md rounded-2xl border border-red-100/80 bg-white/95 p-5 shadow-xl shadow-red-950/10 backdrop-blur sm:rounded-3xl sm:p-8">

        <div className="flex items-center justify-center mb-6">
          <h1 className="text-4xl font-extrabold text-red-900">
            Philip<span className="text-red-500">.</span>
          </h1>
        </div>

        <div key={location.pathname} className="page-transition">
          <Outlet />
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          © 2025 Philip Property Dashboard
        </p>
      </div>
    </div>
  );
}
