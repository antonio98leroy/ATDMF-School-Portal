import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./context/AuthContext";

import Layout from "./layouts/Layout";
import Academics from "./pages/Academics";
import Dashboard from "./pages/Dashboard";
import Finance from "./pages/Finance";
import Login from "./pages/Login";
import Notices from "./pages/Notices";
import Staff from "./pages/Staff";
import Students from "./pages/Students";

function Placeholder({ title }) {
  return (
    <div>
      <h1>{title}</h1>
      <p>This module will be completed in the next development stage.</p>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? <Navigate to="/" replace /> : <Login />
        }
      />

      <Route
        element={
          user ? <Layout /> : <Navigate to="/login" replace />
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/students" element={<Students />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/academics" element={<Academics />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/notices" element={<Notices />} />

        <Route
          path="/profile"
          element={<Placeholder title="My Profile" />}
        />

        <Route
          path="/settings"
          element={<Placeholder title="System Settings" />}
        />
      </Route>

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}
