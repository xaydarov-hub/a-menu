// Login.jsx - Yangilangan versiya
// Menyu va Nook Menu sahifalariga parolsiz kirish qo'shilgan

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { dbGet, dbUpdate } from "../firebase";
import { getStoredUser, storeUser } from "../App";

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
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="#D4AF37" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="#D4AF37" strokeWidth="1.8" strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SpinnerIcon = () => (
  <div style={{
    width: 20, height: 20,
    border: "2px solid rgba(10,31,13,0.3)",
    borderTop: "2px solid #0a1f0d",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    display: "inline-block",
  }} />
);

// ─── BOOK ICON ──────────────────────────────────────────────────────────────
const BookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="#D4AF37" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6h16v14H4z" />
    <path d="M4 6v14" />
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
  </svg>
);

// ─── MAIN LOGIN ───────────────────────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [dbStatus, setDbStatus] = useState("checking");

  // ── 1. Agar sessiya mavjud bo'lsa — avtomatik yo'naltir ─────────────────
  useEffect(() => {
    const user = getStoredUser();
    if (!user?.role) return;
    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
      navigate("/superadmin", { replace: true });
    } else if (user.role === "WAITER") {
      navigate("/waiter", { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 2. Firebase ulanishini tekshir ──────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const checkDb = async () => {
      try {
        await dbGet("super_admin");
        if (mounted) setDbStatus("ok");
      } catch {
        if (mounted) setDbStatus("error");
      }
    };
    checkDb();
    return () => { mounted = false; };
  }, []);

  // ── 3. Role bo'yicha yo'naltirish ────────────────────────────────────────
  const redirectByRole = (role) => {
    if (role === "SUPER_ADMIN" || role === "ADMIN") {
      navigate("/superadmin", { replace: true });
    } else if (role === "WAITER") {
      navigate("/waiter", { replace: true });
    }
  };

  // ── 4. Oxirgi kirish vaqtini yangilash ───────────────────────────────────
  const updateLastLogin = async (path) => {
    try {
      await dbUpdate(path, {
        lastLogin: new Date().toLocaleString("uz-UZ"),
      });
    } catch {
      // kritik emas
    }
  };

  // ── 5. Login logikasi ────────────────────────────────────────────────────
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
      // ── A. Super Admin ──────────────────────────────────────────────────
      const saData = await dbGet("super_admin");
      if (
        saData &&
        saData.username == trimUser &&
        saData.password == trimPass
      ) {
        const userData = {
          id:       "super_admin",
          name:     saData.name || "Super Admin",
          username: saData.username,
          role:     "SUPER_ADMIN",
        };
        storeUser(userData);
        await updateLastLogin("super_admin");
        redirectByRole("SUPER_ADMIN");
        return;
      }

      // ── B. Admin tekshiruvi ─────────────────────────────────────────────
      const adminsData = await dbGet("admins");
      if (adminsData) {
        const adminEntry = Object.entries(adminsData).find(
          ([, a]) => a.username === trimUser && a.password === trimPass
        );
        if (adminEntry) {
          const [id, a] = adminEntry;
          if (a.status === "blocked") {
            setError("Bu admin hisob faoliyati to'xtatilgan!");
            setLoading(false);
            return;
          }
          const userData = {
            id,
            name:     a.name,
            username: a.username,
            email:    a.email   || "",
            phone:    a.phone   || "",
            role:     "ADMIN",
          };
          storeUser(userData);
          await updateLastLogin(`admins/${id}`);
          redirectByRole("ADMIN");
          return;
        }
        const blockedAdmin = Object.values(adminsData).find(
          (a) => a.username === trimUser && a.status === "blocked"
        );
        if (blockedAdmin) {
          setError("Bu admin hisob faoliyati to'xtatilgan!");
          setLoading(false);
          return;
        }
      }

      // ── C. Ofitsiant tekshiruvi ─────────────────────────────────────────
      const waitersData = await dbGet("waiters");
      if (waitersData) {
        const waiterEntry = Object.entries(waitersData).find(
          ([, w]) => w.username === trimUser && w.password === trimPass
        );
        if (waiterEntry) {
          const [id, w] = waiterEntry;
          if (w.status === "blocked") {
            setError("Bu ofitsiant hisob bloklangan!");
            setLoading(false);
            return;
          }
          const userData = {
            id,
            name:      w.name,
            username:  w.username,
            email:     w.email  || "",
            phone:     w.phone  || "",
            role:      "WAITER",
            tableZone: w.table  || "",
          };
          storeUser(userData);
          await updateLastLogin(`waiters/${id}`);
          redirectByRole("WAITER");
          return;
        }
        const blockedWaiter = Object.values(waitersData).find(
          (w) => w.username === trimUser && w.status === "blocked"
        );
        if (blockedWaiter) {
          setError("Bu ofitsiant hisob bloklangan!");
          setLoading(false);
          return;
        }
      }

      // ── D. Hech kim topilmadi ───────────────────────────────────────────
      setError("Login yoki parol noto'g'ri.");
    } catch (err) {
      console.error("Login xatosi:", err);
      setError("Server bilan aloqa yo'q. Internetni tekshiring.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !loading) handleLogin();
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #4a6741; opacity: 0.7; }
        input:focus { outline: none; border-color: #D4AF37 !important; box-shadow: 0 0 0 2px rgba(212,175,55,0.18); }
        button:hover { opacity: 0.9; }
        @keyframes spin     { to { transform: rotate(360deg); } }
        @keyframes fadeIn   { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes leafFloat  { 0%,100%{transform:rotate(-8deg) translateY(0);} 50%{transform:rotate(-5deg) translateY(-12px);} }
        @keyframes leafFloat2 { 0%,100%{transform:rotate(12deg) translateY(0);} 50%{transform:rotate(9deg) translateY(-10px);} }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes bookFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(2deg); }
        }
        .menu-link-item {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .menu-link-item:hover {
          transform: translateY(-2px) scale(1.01);
        }
      `}</style>

      {/* Ambient */}
      <div style={S.leafTopLeft} />
      <div style={S.leafBottomRight} />

      <div style={S.card}>
        {/* Logo */}
        <div style={S.logoArea}>
          <div style={S.logoIcon}><LeafIcon /></div>
          <div>
            <div style={S.logoTitle}>AMAZONIA</div>
            <div style={S.logoSub}>— BY ASMALD —</div>
          </div>
        </div>

        <div style={S.divider} />

        {/* Firebase holati */}
        <div style={S.dbStatusRow}>
          <div style={{
            ...S.dbDot,
            background:  dbStatus === "ok" ? "#2ecc71" : dbStatus === "error" ? "#e74c3c" : "#e67e22",
            animation:   dbStatus === "checking" ? "pulse 1.2s infinite" : "none",
          }} />
          <span style={{
            ...S.dbLabel,
            color: dbStatus === "ok" ? "#2ecc71" : dbStatus === "error" ? "#e74c3c" : "#e67e22",
          }}>
            {dbStatus === "ok"    ? "Server bilan ulandi"       :
             dbStatus === "error" ? "Server bilan aloqa yo'q"   :
                                    "Ulanilmoqda..."}
          </span>
        </div>

        <p style={S.tagline}>Xodimlar uchun kirish</p>

        {/* Username */}
        <div style={S.fieldWrap}>
          <label style={S.label}>Login</label>
          <div style={S.inputRow}>
            <span style={S.inputIcon}><UserIcon /></span>
            <input
              style={S.input}
              type="text"
              placeholder="username kiriting"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(""); }}
              onKeyDown={handleKeyDown}
              autoComplete="username"
              autoFocus
              disabled={loading}
            />
          </div>
        </div>

        {/* Parol */}
        <div style={S.fieldWrap}>
          <label style={S.label}>Parol</label>
          <div style={S.inputRow}>
            <span style={S.inputIcon}><LockIcon /></span>
            <input
              style={{ ...S.input, paddingRight: "44px" }}
              type={showPass ? "text" : "password"}
              placeholder="parol kiriting"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
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
        {error && <div style={S.errorBox}>⚠ {error}</div>}

        {/* Kirish tugmasi */}
        <button
          style={{ ...S.loginBtn, opacity: loading || dbStatus === "checking" ? 0.75 : 1 }}
          onClick={handleLogin}
          disabled={loading || dbStatus === "checking"}
        >
          {loading ? <SpinnerIcon /> : "KIRISH"}
        </button>

        {/* ⭐━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⭐ */}
        {/* MENYUGA PAROLSIZ KIRISH - PREMIUM SAHIFA */}
        {/* ⭐━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⭐ */}
        <div style={S.menuDivider}>
          <span style={S.menuDividerText}>YOKI</span>
        </div>

        {/* ─── Premium Menu Link ────────────────────────────────────────── */}
        <Link
          to="/menu"
          className="menu-link-item"
          style={S.menuLink}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(212,175,55,0.2)";
            e.target.style.borderColor = "rgba(212,175,55,0.5)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(212,175,55,0.08)";
            e.target.style.borderColor = "rgba(212,175,55,0.25)";
          }}
        >
          <div style={S.menuLinkContent}>
            <span style={S.menuLinkIcon}>🌿</span>
            <div>
              <div style={S.menuLinkTitle}>Premium Menyuni Ko'rish</div>
              <div style={S.menuLinkSub}>Parolsiz · Barcha mehmonlar uchun</div>
            </div>
            <span style={S.menuLinkArrow}>→</span>
          </div>
        </Link>

        {/* ─── Nook Menu Link ────────────────────────────────────────────── */}
        <Link
          to="/nook"
          className="menu-link-item"
          style={S.menuLink}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(212,175,55,0.2)";
            e.target.style.borderColor = "rgba(212,175,55,0.5)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(212,175,55,0.08)";
            e.target.style.borderColor = "rgba(212,175,55,0.25)";
          }}
        >
          <div style={S.menuLinkContent}>
            <span style={S.menuLinkIcon}>📖</span>
            <div>
              <div style={S.menuLinkTitle}>Nook Menu Kitobi</div>
              <div style={S.menuLinkSub}>Parolsiz · Premium burgerlar</div>
            </div>
            <span style={S.menuLinkArrow}>→</span>
          </div>
        </Link>

        {/* Rol ko'rsatkichlari */}
        <div style={S.hints}>
          <div style={S.hintItem}>
            <span style={{ ...S.hintDot, background: "#9b59b6" }} />
            <span style={{ color:"#7fa86b", fontSize:12 }}>
              <b style={{ color:"#9b59b6" }}>Super Admin</b> — Firebase da yaratiladi
            </span>
          </div>
          <div style={S.hintItem}>
            <span style={{ ...S.hintDot, background: "#D4AF37" }} />
            <span style={{ color:"#7fa86b", fontSize:12 }}>
              <b style={{ color:"#D4AF37" }}>Admin</b> — Super Admin tomonidan qo'shiladi
            </span>
          </div>
          <div style={S.hintItem}>
            <span style={{ ...S.hintDot, background: "#3498db" }} />
            <span style={{ color:"#7fa86b", fontSize:12 }}>
              <b style={{ color:"#3498db" }}>Ofitsiant</b> — Admin tomonidan qo'shiladi
            </span>
          </div>
        </div>

        <p style={S.footerNote}>Hamma ma'lumotlar Firebase Real-time DB da saqlanadi</p>
      </div>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#0a1f0d 0%,#0f2a10 40%,#1a3a1a 70%,#0d2410 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Inter', sans-serif",
    position: "relative", overflow: "hidden",
  },
  leafTopLeft: {
    position: "fixed", top: "-60px", left: "-60px",
    width: "320px", height: "320px",
    background: "radial-gradient(circle at 30% 30%,rgba(86,160,54,0.18) 0%,transparent 70%)",
    animation: "leafFloat 6s ease-in-out infinite",
    pointerEvents: "none",
  },
  leafBottomRight: {
    position: "fixed", bottom: "-80px", right: "-60px",
    width: "360px", height: "360px",
    background: "radial-gradient(circle at 70% 70%,rgba(212,175,55,0.12) 0%,transparent 65%)",
    animation: "leafFloat2 7s ease-in-out infinite",
    pointerEvents: "none",
  },
  card: {
    background: "rgba(10,28,12,0.90)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(212,175,55,0.25)",
    borderRadius: "20px",
    padding: "44px 40px 36px",
    width: "100%", maxWidth: "420px",
    boxShadow: "0 8px 60px rgba(0,0,0,0.6),0 0 0 1px rgba(212,175,55,0.08) inset",
    animation: "fadeIn 0.6s ease",
    position: "relative", zIndex: 10,
  },
  logoArea:  { display:"flex", alignItems:"center", gap:"14px", marginBottom:"4px" },
  logoIcon:  { width:"48px", height:"48px", background:"linear-gradient(135deg,#1a3a1a,#0f2a10)", border:"1px solid rgba(212,175,55,0.3)", borderRadius:"12px", display:"flex", alignItems:"center", justifyContent:"center" },
  logoTitle: { fontFamily:"'Cinzel',serif", fontSize:"22px", fontWeight:"700", letterSpacing:"4px", color:"#D4AF37", lineHeight:1 },
  logoSub:   { fontFamily:"'Cinzel',serif", fontSize:"9px", letterSpacing:"3px", color:"#86B054", marginTop:"3px" },
  divider:   { height:"1px", background:"linear-gradient(90deg,transparent,rgba(212,175,55,0.4),transparent)", margin:"20px 0 14px" },
  dbStatusRow: { display:"flex", alignItems:"center", gap:8, justifyContent:"center", marginBottom:14 },
  dbDot:     { width:7, height:7, borderRadius:"50%", flexShrink:0 },
  dbLabel:   { fontSize:11, letterSpacing:0.5 },
  tagline:   { color:"#7fa86b", fontSize:"13px", letterSpacing:"1px", marginBottom:"24px", textAlign:"center" },
  fieldWrap: { marginBottom:"18px" },
  label:     { display:"block", color:"#D4AF37", fontSize:"11px", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"8px", fontWeight:"500" },
  inputRow:  { position:"relative", display:"flex", alignItems:"center" },
  inputIcon: { position:"absolute", left:"14px", display:"flex", alignItems:"center", pointerEvents:"none" },
  input:     { width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(134,176,84,0.3)", borderRadius:"10px", padding:"13px 14px 13px 44px", color:"#e8f5e0", fontSize:"14px", transition:"border-color 0.2s,box-shadow 0.2s", fontFamily:"'Inter',sans-serif" },
  eyeBtn:    { position:"absolute", right:"12px", background:"none", border:"none", cursor:"pointer", color:"#4a7a40", display:"flex", alignItems:"center", padding:"4px", borderRadius:"6px" },
  errorBox:  { background:"rgba(180,40,40,0.18)", border:"1px solid rgba(220,80,80,0.3)", borderRadius:"8px", color:"#ff8080", fontSize:"13px", padding:"10px 14px", marginBottom:"16px", textAlign:"center", lineHeight:1.5 },
  loginBtn:  { width:"100%", background:"linear-gradient(135deg,#b8931f 0%,#D4AF37 50%,#c9a227 100%)", border:"none", borderRadius:"10px", color:"#0a1f0d", fontFamily:"'Cinzel',serif", fontSize:"14px", fontWeight:"700", letterSpacing:"3px", padding:"14px", cursor:"pointer", transition:"opacity 0.2s", boxShadow:"0 4px 20px rgba(212,175,55,0.25)", display:"flex", alignItems:"center", justifyContent:"center", minHeight:"48px" },

  // ⭐━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⭐
  // MENU LINK STYLES (Parolsiz kirish)
  // ⭐━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⭐
  menuDivider: {
    display: "flex",
    alignItems: "center",
    margin: "12px 0 14px",
    gap: 12,
  },
  menuDividerText: {
    color: "#3d5c38",
    fontSize: 11,
    letterSpacing: 2,
    background: "rgba(10,28,12,0.9)",
    padding: "0 12px",
  },
  menuLink: {
    display: "block",
    background: "rgba(212,175,55,0.08)",
    border: "1px solid rgba(212,175,55,0.25)",
    borderRadius: "12px",
    padding: "12px 16px",
    textDecoration: "none",
    transition: "all 0.3s ease",
    marginBottom: "10px",
    position: "relative",
    overflow: "hidden",
  },
  menuLinkContent: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  menuLinkIcon: {
    fontSize: 24,
    flexShrink: 0,
  },
  menuLinkTitle: {
    color: "#D4AF37",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "Cinzel,serif",
    letterSpacing: 1,
  },
  menuLinkSub: {
    color: "#4a7a40",
    fontSize: 11,
    marginTop: 2,
  },
  menuLinkArrow: {
    color: "#D4AF37",
    fontSize: 18,
    marginLeft: "auto",
    flexShrink: 0,
    transition: "transform 0.3s ease",
  },

  hints: {
    marginTop: "8px",
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