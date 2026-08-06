import React, { Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import "./assets/tailwind.css";

// Layout
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";

// Components
import Loading from "./components/Loading";

// Auth
import { useAuth } from "./context/useAuth";

// Lazy Pages
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Property = React.lazy(() => import("./pages/Property"));
const PropertyDetail = React.lazy(() => import("./pages/PropertyDetail"));
const Staff = React.lazy(() => import("./pages/Staff"));
const Reports = React.lazy(() => import("./pages/Reports"));
const Settings = React.lazy(() => import("./pages/Settings"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

const Login = React.lazy(() => import("./pages/auth/Login"));
const Register = React.lazy(() => import("./pages/auth/Register"));
const Forgot = React.lazy(() => import("./pages/auth/Forgot"));
const ResetPassword = React.lazy(() => import("./pages/auth/ResetPassword"));

// ─── Guard: harus login ────────────────────────────────────────
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// ─── Guard: harus role tertentu ────────────────────────────────
function RequireRole({ roles, children }) {
  const { user, role, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(role)) return <Navigate to="/dashboard" replace />;
  return children;
}

// ─── Guard: guest (belum login) ────────────────────────────────
function RequireGuest({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Auth Layout — hanya guest yang bisa akses */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={
            <RequireGuest>
              <Login />
            </RequireGuest>
          } />
          <Route path="/forgot" element={
            <RequireGuest>
              <Forgot />
            </RequireGuest>
          } />
          <Route path="/reset-password" element={
            <RequireGuest>
              <ResetPassword />
            </RequireGuest>
          } />
          {/* Register: hanya Admin yang bisa akses */}
          <Route path="/register" element={
            <RequireRole roles={["admin"]}>
              <Register />
            </RequireRole>
          } />
        </Route>

        {/* Main Layout — harus login */}
        <Route element={
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        }>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/property" element={<Property />} />
          {/* Keep the edit URL explicit so it is not treated as a property ID. */}
          <Route path="/property/edit/:editId" element={<Property />} />
          <Route path="/property/:id" element={<PropertyDetail />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/settings" element={<Settings />} />

          {/* Reports: hanya Admin & Direktur */}
          <Route path="/reports" element={
            <RequireRole roles={["admin", "direktur"]}>
              <Reports />
            </RequireRole>
          } />
        </Route>

        {/* Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
