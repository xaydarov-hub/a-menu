import { Routes, Route, Navigate } from "react-router-dom";
import Login      from "./pages/Login";
import SuperAdmin from "./pages/SuperAdmin";
import WaiterPanel from "./pages/WaiterPanel";

// ─── Shared storage helper ────────────────────────────────────────────────────
// Login → localStorage ga yozadi (tab yopilsa ham qoladi)
// Bu helper ikki joydan ham o'qiydi (migration uchun)
export function getStoredUser() {
  try {
    return (
      JSON.parse(localStorage.getItem("amazonia_user")) ||
      JSON.parse(sessionStorage.getItem("amazonia_user")) ||
      null
    );
  } catch {
    return null;
  }
}

export function storeUser(userData) {
  const str = JSON.stringify(userData);
  localStorage.setItem("amazonia_user", str);
  sessionStorage.setItem("amazonia_user", str);
}

export function clearUser() {
  localStorage.removeItem("amazonia_user");
  sessionStorage.removeItem("amazonia_user");
}

// ─── PrivateRoute ─────────────────────────────────────────────────────────────
function PrivateRoute({ element, allowedRoles }) {
  const user = getStoredUser();
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to="/" replace />;
  return element;
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/superadmin"
        element={
          <PrivateRoute
            element={<SuperAdmin />}
            allowedRoles={["SUPER_ADMIN", "ADMIN"]}
          />
        }
      />
      <Route
        path="/admin"
        element={
          <PrivateRoute
            element={<SuperAdmin />}
            allowedRoles={["SUPER_ADMIN", "ADMIN"]}
          />
        }
      />
      <Route
        path="/waiter"
        element={
          <PrivateRoute
            element={<WaiterPanel />}
            allowedRoles={["WAITER"]}
          />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}