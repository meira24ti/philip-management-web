import React, { Suspense, useState, useEffect } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import "./assets/tailwind.css";

// Layout
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";

// Components
import Loading from "./components/Loading";

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

function App() {

  const [isLogin, setIsLogin] = useState(localStorage.getItem("user"));

  useEffect(() => {
    const handleStorageChange = () => {
      setIsLogin(localStorage.getItem("user"));
    };


    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Default Redirect */}
        <Route
          path="/"
          element={isLogin ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
        />

        {/* Auth Layout */}
        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={isLogin ? <Navigate to="/dashboard" replace /> : <Login />}
          />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot" element={<Forgot />} />
        </Route>

        {/* Main Layout */}
        <Route
          element={isLogin ? <MainLayout /> : <Navigate to="/login" replace />}
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/property" element={<Property />} />
          <Route path="/property/:id" element={<PropertyDetail />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;