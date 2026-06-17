import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { dbGet, dbSet } from "../Firebase";
import { getStoredUser } from "../App";
// ─── SUPER ADMIN (har doim statik) ──────────────────────────────────────────
const SUPER_ADMIN = {
  username: "superadmin",
  password: "Amazonia@2024",
  role: "SUPER_ADMIN",
  name: "Super Admin",
  label: "Super Administrator",
};

// ─── ICONS ───────────────────────────────────────────────────────────────────
const LeafIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path
      d="M17 8C8 10 5.9 16.17 3.82 19.92C3.82 19.92 6.5 19 8 17C8 17 4 22 12 22C16 22 21 19 21 13C21 8 17 8 17 8Z"
      fill="#D4AF37"
      opacity="0.9"
    />
    <path
      d="M3 22C3 22 7 16 12 14"
      stroke="#86B054"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const EyeIcon = ({ open }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
  >
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

const LockIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#D4AF37"
    strokeWidth="1.8"
    strokeLinecap="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

const UserIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#D4AF37"
    strokeWidth="1.8"
    strokeLinecap="round"
  >
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SpinnerIcon = () => (
  <div
    style={{
      width: 20,
      height: 20,
      border: "2px solid rgba(10,31,13,0.3)",
      borderTop: "2px solid #0a1f0d",
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
      display: "inline-block",
    }}
  />
);

// ─── MAIN LOGIN ───────────────────────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState("checking"); // "checking" | "ok" | "error"

  // ─── Sessiya mavjud bo'lsa avtomatik yo'naltir ──────────────────────────
// 1. App.jsx dagi helper funksiyani Login.jsx ga ham import qilib oling:
  // import { getStoredUser } from "../App"; // (Fayl yo'lini to'g'rilab qo'yasiz)

  useEffect(() => {
    // App.jsx bilan bir xil kalitdan ma'lumotni o'qiymiz
    const user = getStoredUser(); 
    
    if (user && user.role) {
      // Kelayotgan rolni tekshirib, xavfsiz yo'naltiramiz
      if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
        navigate("/superadmin", { replace: true });
      } else if (user.role === "WAITER") {
        navigate("/waiter", { replace: true });
      }
    }
  }, [navigate]); // Faqat bir marta tekshiradi

  // ─── Firebase ulanishini tekshir ────────────────────────────────────────
  useEffect(() => {
    const checkDb = async () => {
      try {
        // Oddiy ping — mavjud bo'lmasa ham null qaytaradi, xato bermaydi
        await dbGet("_ping");
        setDbStatus("ok");
      } catch (err) {
        console.error("Firebase ulanish xatosi:", err);
        setDbStatus("error");
      }
    };
    checkDb();
  }, []);

  // Navigatsiya faqat bir marta ishlashi uchun flag (blokirofka) o'rnatamiz
  let hasRedirected = false;

  const redirectByRole = (role) => {
    // Agar allaqachon yo'naltirish bajarilgan bo'lsa, qayta ishlatmaymiz
    if (hasRedirected) return;
    
    if (role === "SUPER_ADMIN" || role === "ADMIN") {
      hasRedirected = true;
      navigate("/superadmin", { replace: true });
    } else if (role === "WAITER") {
      hasRedirected = true;
      navigate("/waiter", { replace: true });
    }
  };

  // ─── LOGIN LOGIKASI ──────────────────────────────────────────────────────
  const handleLogin = async () => {
    setError("");
    const trimUser = username.trim();
    const trimPass = password.trim();

    if (!trimUser || !trimPass) {
      setError("Login va parolni kiriting.");
      return;
    }

    setLoading(true);

    try {
      // 1. SUPER_ADMIN — statik, Firebase talab qilmaydi
      if (
        trimUser === SUPER_ADMIN.username &&
        trimPass === SUPER_ADMIN.password
      ) {
        saveSession(SUPER_ADMIN);
        redirectByRole(SUPER_ADMIN.role);
        return;
      }

      // 2. Firebase dan admins ni o'qi
      const adminsData = await dbGet("admins");
      if (adminsData) {
        const adminsList = Object.values(adminsData);
        const foundAdmin = adminsList.find(
          (a) => a.username === trimUser && a.password === trimPass
        );
        if (foundAdmin) {
          if (foundAdmin.status === "blocked") {
            setError("Bu admin hisob faoliyati to'xtatilgan!");
            setLoading(false);
            return;
          }
          const sessionUser = {
            id: foundAdmin.id,
            username: foundAdmin.username,
            name: foundAdmin.name,
            email: foundAdmin.email || "",
            phone: foundAdmin.phone || "",
            role: "ADMIN",
            label: "Administrator",
          };
          saveSession(sessionUser);
          // Oxirgi kirish vaqtini yangilaymiz
          await updateLastLogin("admins", foundAdmin.id);
          redirectByRole("ADMIN");
          return;
        }
      }

      // 3. Firebase dan waiters ni o'qi
      const waitersData = await dbGet("waiters");
      if (waitersData) {
        const waitersList = Object.values(waitersData);
        const foundWaiter = waitersList.find(
          (w) => w.username === trimUser && w.password === trimPass
        );
        if (foundWaiter) {
          if (foundWaiter.status === "blocked") {
            setError("Bu ofitsiant hisob bloklangan!");
            setLoading(false);
            return;
          }
          const sessionUser = {
            id: foundWaiter.id,
            username: foundWaiter.username,
            name: foundWaiter.name,
            email: foundWaiter.email || "",
            phone: foundWaiter.phone || "",
            role: "WAITER",
            label: "Ofitsiant",
            tableZone: foundWaiter.table || "",
          };
          saveSession(sessionUser);
          await updateLastLogin("waiters", foundWaiter.id);
          redirectByRole("WAITER");
          return;
        }
      }

      // Hech kim topilmadi
      setError("Login yoki parol noto'g'ri.");
    } catch (err) {
      console.error("Login xatosi:", err);
      setError("Server bilan aloqa yo'q. Internetni tekshiring.");
    } finally {
      setLoading(false);
    }
  };

  // ─── SESSIYANI SAQLASH ──────────────────────────────────────────────────
  const saveSession = (user) => {
    // Eski localStorage kalitlarini ham saqlaymiz (SuperAdmin.jsx backwards compat)
    localStorage.setItem("amazonia_session", JSON.stringify(user));
    localStorage.setItem("user", JSON.stringify(user)); // SuperAdmin.jsx uchun
  };

  // ─── OXIRGI KIRISH VAQTINI YANGILASH ────────────────────────────────────
  const updateLastLogin = async (collection, id) => {
    try {
      const now = new Date();
      const formatted =
        now.toLocaleDateString("uz-UZ") +
        " " +
        now.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
      await dbSet(`${collection}/${id}/lastLogin`, formatted);
    } catch {
      // Kritik emas, xato bo'lsa ham login davom etadi
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #4a6741; opacity: 0.7; }
        input:focus { outline: none; border-color: #D4AF37 !important; box-shadow: 0 0 0 2px rgba(212,175,55,0.18); }
        button:hover { opacity: 0.9; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes leafFloat {
          0%, 100% { transform: rotate(-8deg) translateY(0px); }
          50% { transform: rotate(-5deg) translateY(-12px); }
        }
        @keyframes leafFloat2 {
          0%, 100% { transform: rotate(12deg) translateY(0px); }
          50% { transform: rotate(9deg) translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Ambient backgrounds */}
      <div style={S.leafTopLeft} />
      <div style={S.leafBottomRight} />

      <div style={S.card}>
        {/* Logo */}
        <div style={S.logoArea}>
          <div style={S.logoIcon}>
            <LeafIcon />
          </div>
          <div>
            <div style={S.logoTitle}>AMAZONIA</div>
            <div style={S.logoSub}>— BY ASMALD —</div>
          </div>
        </div>

        <div style={S.divider} />

        {/* Firebase holati */}
        <div style={S.dbStatusRow}>
          <div
            style={{
              ...S.dbDot,
              background:
                dbStatus === "ok"
                  ? "#2ecc71"
                  : dbStatus === "error"
                  ? "#e74c3c"
                  : "#e67e22",
              animation:
                dbStatus === "checking" ? "pulse 1.2s infinite" : "none",
            }}
          />
          <span
            style={{
              ...S.dbLabel,
              color:
                dbStatus === "ok"
                  ? "#2ecc71"
                  : dbStatus === "error"
                  ? "#e74c3c"
                  : "#e67e22",
            }}
          >
            {dbStatus === "ok"
              ? "Server bilan ulandi"
              : dbStatus === "error"
              ? "Server bilan aloqa yo'q"
              : "Ulanilmoqda..."}
          </span>
        </div>

        <p style={S.tagline}>Xodimlar uchun kirish</p>

        {/* Username */}
        <div style={S.fieldWrap}>
          <label style={S.label}>Login</label>
          <div style={S.inputRow}>
            <span style={S.inputIcon}>
              <UserIcon />
            </span>
            <input
              style={S.input}
              type="text"
              placeholder="username kiriting"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              onKeyDown={handleKeyDown}
              autoComplete="username"
              disabled={loading}
            />
          </div>
        </div>

        {/* Password */}
        <div style={S.fieldWrap}>
          <label style={S.label}>Parol</label>
          <div style={S.inputRow}>
            <span style={S.inputIcon}>
              <LockIcon />
            </span>
            <input
              style={{ ...S.input, paddingRight: "44px" }}
              type={showPass ? "text" : "password"}
              placeholder="parol kiriting"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              onKeyDown={handleKeyDown}
              autoComplete="current-password"
              disabled={loading}
            />
            <button
              style={S.eyeBtn}
              onClick={() => setShowPass((v) => !v)}
              tabIndex={-1}
              type="button"
            >
              <EyeIcon open={showPass} />
            </button>
          </div>
        </div>

        {/* Xato */}
        {error && <div style={S.errorBox}>{error}</div>}

        {/* Kirish tugmasi */}
        <button
          style={{ ...S.loginBtn, opacity: loading || dbStatus === "checking" ? 0.75 : 1 }}
          onClick={handleLogin}
          disabled={loading || dbStatus === "checking"}
        >
          {loading ? <SpinnerIcon /> : "KIRISH"}
        </button>

        {/* Hint — faqat superadmin */}
        <div style={S.hints}>
          <div style={S.hintItem}>
            <span style={{ ...S.hintDot, background: "#D4AF37" }} />
            <span>
              <b style={{ color: "#D4AF37" }}>Super Admin:</b>{" "}
              <span style={{ color: "#7fa86b" }}>
                superadmin / Amazonia@2024
              </span>
            </span>
          </div>
          <div style={S.hintItem}>
            <span style={{ ...S.hintDot, background: "#86B054" }} />
            <span style={{ color: "#4a7a40", fontSize: 11 }}>
              Admin va ofitsiant loginlari Firebase'dan yuklanadi
            </span>
          </div>
        </div>

        <p style={S.footerNote}>
          Ofitsiant va admin hisoblarini Super Admin yaratadi
        </p>
      </div>
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #0a1f0d 0%, #0f2a10 40%, #1a3a1a 70%, #0d2410 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  leafTopLeft: {
    position: "fixed",
    top: "-60px",
    left: "-60px",
    width: "320px",
    height: "320px",
    background:
      "radial-gradient(circle at 30% 30%, rgba(86,160,54,0.18) 0%, transparent 70%)",
    animation: "leafFloat 6s ease-in-out infinite",
    pointerEvents: "none",
  },
  leafBottomRight: {
    position: "fixed",
    bottom: "-80px",
    right: "-60px",
    width: "360px",
    height: "360px",
    background:
      "radial-gradient(circle at 70% 70%, rgba(212,175,55,0.12) 0%, transparent 65%)",
    animation: "leafFloat2 7s ease-in-out infinite",
    pointerEvents: "none",
  },
  card: {
    background: "rgba(10, 28, 12, 0.88)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(212,175,55,0.25)",
    borderRadius: "20px",
    padding: "44px 40px 36px",
    width: "100%",
    maxWidth: "420px",
    boxShadow:
      "0 8px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,55,0.08) inset",
    animation: "fadeIn 0.6s ease",
    position: "relative",
    zIndex: 10,
  },
  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "4px",
  },
  logoIcon: {
    width: "48px",
    height: "48px",
    background: "linear-gradient(135deg, #1a3a1a, #0f2a10)",
    border: "1px solid rgba(212,175,55,0.3)",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoTitle: {
    fontFamily: "'Cinzel', serif",
    fontSize: "22px",
    fontWeight: "700",
    letterSpacing: "4px",
    color: "#D4AF37",
    lineHeight: 1,
  },
  logoSub: {
    fontFamily: "'Cinzel', serif",
    fontSize: "9px",
    letterSpacing: "3px",
    color: "#86B054",
    marginTop: "3px",
  },
  divider: {
    height: "1px",
    background:
      "linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)",
    margin: "20px 0 14px",
  },
  dbStatusRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    marginBottom: 14,
  },
  dbDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    flexShrink: 0,
  },
  dbLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
    fontFamily: "'Inter', sans-serif",
  },
  tagline: {
    color: "#7fa86b",
    fontSize: "13px",
    letterSpacing: "1px",
    marginBottom: "24px",
    textAlign: "center",
  },
  fieldWrap: {
    marginBottom: "18px",
  },
  label: {
    display: "block",
    color: "#D4AF37",
    fontSize: "11px",
    letterSpacing: "2px",
    textTransform: "uppercase",
    marginBottom: "8px",
    fontWeight: "500",
  },
  inputRow: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    display: "flex",
    alignItems: "center",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(134,176,84,0.3)",
    borderRadius: "10px",
    padding: "13px 14px 13px 44px",
    color: "#e8f5e0",
    fontSize: "14px",
    transition: "border-color 0.2s, box-shadow 0.2s",
    fontFamily: "'Inter', sans-serif",
  },
  eyeBtn: {
    position: "absolute",
    right: "12px",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#4a7a40",
    display: "flex",
    alignItems: "center",
    padding: "4px",
    borderRadius: "6px",
  },
  errorBox: {
    background: "rgba(180,40,40,0.18)",
    border: "1px solid rgba(220,80,80,0.3)",
    borderRadius: "8px",
    color: "#ff8080",
    fontSize: "13px",
    padding: "10px 14px",
    marginBottom: "16px",
    textAlign: "center",
    lineHeight: 1.5,
  },
  loginBtn: {
    width: "100%",
    background: "linear-gradient(135deg, #b8931f 0%, #D4AF37 50%, #c9a227 100%)",
    border: "none",
    borderRadius: "10px",
    color: "#0a1f0d",
    fontFamily: "'Cinzel', serif",
    fontSize: "14px",
    fontWeight: "700",
    letterSpacing: "3px",
    padding: "14px",
    cursor: "pointer",
    transition: "opacity 0.2s",
    boxShadow: "0 4px 20px rgba(212,175,55,0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "48px",
  },
  hints: {
    marginTop: "24px",
    padding: "14px 16px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(134,176,84,0.15)",
    borderRadius: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  hintItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#7fa86b",
    fontSize: "12px",
  },
  hintDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  footerNote: {
    textAlign: "center",
    color: "#3d5c38",
    fontSize: "11px",
    marginTop: "16px",
    letterSpacing: "0.5px",
  },
};