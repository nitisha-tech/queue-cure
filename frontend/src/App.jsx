// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ReceptionistDashboard from "./pages/receptionist/ReceptionistDashboard";
import PatientHome from "./pages/patient/PatientHome";
import WaitingRoom from "./pages/patient/WaitingRoom";

const RoleHome = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === "admin") return <Navigate to="/admin" />;
  if (user.role === "receptionist") return <Navigate to="/receptionist" />;
  if (user.role === "patient") return <Navigate to="/patient" />;
  return <Navigate to="/login" />;
};

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<RoleHome />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/admin" element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="/receptionist" element={
          <ProtectedRoute role="receptionist">
            <ReceptionistDashboard />
          </ProtectedRoute>
        } />

        <Route path="/patient" element={
          <ProtectedRoute role="patient">
            <PatientHome />
          </ProtectedRoute>
        } />

        <Route path="/patient/waiting" element={
          <ProtectedRoute role="patient">
            <WaitingRoom />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}