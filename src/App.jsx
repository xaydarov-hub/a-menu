import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import SuperAdmin from "./pages/SuperAdmin";
import WaiterPanel from "./pages/WaiterPanel";
import MenuPage from "./pages/MenuPage";
import NookMenu from "./pages/NookMenu"; // ⭐ YANGI - Nook Menu
import NotFound from "./NotFound";

// ─── Shared storage helper ────────────────────────────────────────────────────
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

// ─── PublicRoute ──────────────────────────────────────────────────────────────
function PublicRoute({ element }) {
  return element;
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      {/* ─── LOGIN ───────────────────────────────────────────────────────── */}
      <Route path="/" element={<Login />} />

      {/* ─── MENU PAGE (PUBLIC - PAROLSIZ) ─────────────────────────────── */}
      <Route
        path="/menu"
        element={<PublicRoute element={<MenuPage />} />}
      />

      {/* ─── NOOK MENU (PUBLIC - PAROLSIZ) ────────────────────────────── */}
      <Route
        path="/nook"
        element={<PublicRoute element={<NookMenu />} />}
      />

      {/* ─── SUPER ADMIN PANEL ──────────────────────────────────────────── */}
      <Route
        path="/superadmin"
        element={
          <PrivateRoute
            element={<SuperAdmin />}
            allowedRoles={["SUPER_ADMIN", "ADMIN"]}
          />
        }
      />

      {/* ─── ADMIN PANEL ────────────────────────────────────────────────── */}
      <Route
        path="/admin"
        element={
          <PrivateRoute
            element={<SuperAdmin />}
            allowedRoles={["SUPER_ADMIN", "ADMIN"]}
          />
        }
      />

      {/* ─── WAITER PANEL ────────────────────────────────────────────────── */}
      <Route
        path="/waiter"
        element={
          <PrivateRoute
            element={<WaiterPanel />}
            allowedRoles={["WAITER"]}
          />
        }
      />

      {/* ─── 404 NOT FOUND ────────────────────────────────────────────────── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}