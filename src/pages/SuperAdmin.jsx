import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { dbGet, dbSet, dbUpdate, dbRemove, dbListen } from "../firebase";
import { getStoredUser, clearUser } from "../App";

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt    = (n) => (n || 0).toLocaleString("uz-UZ") + " so'm";
const uid    = () => Math.random().toString(36).slice(2, 9);
const today  = () => new Date().toISOString().slice(0, 10);
const nowStr = () => new Date().toLocaleString("uz-UZ");

// ─── LIVE CLOCK ──────────────────────────────────────────────────────────────
function LiveClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(i);
  }, []);
  const pad = (n) => String(n).padStart(2, "0");
  const DAYS   = ["Yak","Dush","Sesh","Chor","Pay","Jum","Shan"];
  const MONTHS = ["Yan","Fev","Mar","Apr","May","Iyn","Iyl","Avg","Sen","Okt","Noy","Dek"];
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <span style={{ fontFamily:"Cinzel,serif", color:"#D4AF37", fontSize:15, letterSpacing:2 }}>
        {pad(t.getHours())}:{pad(t.getMinutes())}:{pad(t.getSeconds())}
      </span>
      <span style={{ color:"#4a7a40", fontSize:11 }}>
        {DAYS[t.getDay()]}, {t.getDate()} {MONTHS[t.getMonth()]} {t.getFullYear()}
      </span>
    </div>
  );
}

// ─── ICON ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const IC = {
  dashboard: ["M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z","M9 22V12h6v10"],
  admin:     ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"],
  waiter:    ["M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2","M12 11a4 4 0 100-8 4 4 0 000 8"],
  category:  ["M4 6h16","M4 12h16","M4 18h7"],
  food:      "M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3",
  table:     ["M3 3h18v18H3z","M3 9h18","M3 15h18","M9 3v18","M15 3v18"],
  stats:     ["M18 20V10","M12 20V4","M6 20v-6"],
  settings:  ["M12 15a3 3 0 100-6 3 3 0 000 6z","M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"],
  logout:    ["M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4","M16 17l5-5-5-5","M21 12H9"],
  search:    ["M11 19a8 8 0 100-16 8 8 0 000 16z","M21 21l-4.35-4.35"],
  money:     ["M12 1v22","M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"],
  order:     ["M9 11l3 3L22 4","M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"],
  star:      "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  trash:     ["M3 6h18","M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"],
  edit:      ["M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7","M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"],
  lock:      ["M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z","M7 11V7a5 5 0 0110 0v4"],
  refresh:   ["M23 4v6h-6","M1 20v-6h6","M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"],
  plus:      "M12 5v14M5 12h14",
  kitchen:   ["M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z","M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"],
  eye:       ["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z","M12 9a3 3 0 100 6 3 3 0 000-6z"],
  check:     "M20 6L9 17l-5-5",
  bell:      ["M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9","M13.73 21a2 2 0 01-3.46 0"],
  monitor:   ["M2 3h20a1 1 0 011 1v14a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1z","M8 21h8","M12 17v4"],
};

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const BTN = {
  gold:   { background:"linear-gradient(135deg,#b8931f,#D4AF37)", border:"none", borderRadius:8, color:"#0a1f0d", fontFamily:"Cinzel,serif", fontSize:12, fontWeight:700, letterSpacing:1, padding:"10px 20px", cursor:"pointer" },
  ghost:  { background:"transparent", border:"1px solid rgba(134,176,84,0.4)", borderRadius:8, color:"#86B054", fontFamily:"Inter,sans-serif", fontSize:12, padding:"10px 20px", cursor:"pointer" },
  danger: { background:"rgba(192,57,43,0.85)", border:"1px solid rgba(192,57,43,0.5)", borderRadius:8, color:"#fff", fontFamily:"Inter,sans-serif", fontSize:12, padding:"10px 20px", cursor:"pointer" },
  warn:   { background:"rgba(230,126,34,0.3)", border:"1px solid rgba(230,126,34,0.5)", borderRadius:8, color:"#e67e22", fontFamily:"Inter,sans-serif", fontSize:12, padding:"10px 20px", cursor:"pointer" },
  blue:   { background:"rgba(41,128,185,0.3)", border:"1px solid rgba(41,128,185,0.5)", borderRadius:8, color:"#3498db", fontFamily:"Inter,sans-serif", fontSize:12, padding:"10px 20px", cursor:"pointer" },
  green:  { background:"rgba(39,174,96,0.3)", border:"1px solid rgba(39,174,96,0.5)", borderRadius:8, color:"#2ecc71", fontFamily:"Inter,sans-serif", fontSize:12, padding:"10px 20px", cursor:"pointer" },
  orange: { background:"rgba(230,126,34,0.25)", border:"1px solid rgba(230,126,34,0.45)", borderRadius:8, color:"#e67e22", fontFamily:"Inter,sans-serif", fontSize:12, padding:"6px 12px", cursor:"pointer" },
};
const CARD     = { background:"rgba(255,255,255,0.03)", border:"1px solid rgba(134,176,84,0.12)", borderRadius:14, padding:"20px 22px" };
const CARD_HDR = { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 };
const CARD_TTL = { fontFamily:"Cinzel,serif", color:"#D4AF37", fontSize:13, letterSpacing:1 };
const LBL      = { display:"block", color:"#D4AF37", fontSize:10, letterSpacing:2, textTransform:"uppercase", marginBottom:6 };
const INP      = { width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(134,176,84,0.3)", borderRadius:8, padding:"10px 14px", color:"#e8f5e0", fontSize:13, fontFamily:"Inter,sans-serif", outline:"none", boxSizing:"border-box" };
const SELECT_S = { ...INP, cursor:"pointer" };

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({ toasts, remove }) {
  const colors = {
    success: "rgba(39,174,96,0.95)",
    error:   "rgba(192,57,43,0.95)",
    info:    "rgba(41,128,185,0.95)",
    warn:    "rgba(230,126,34,0.95)",
  };
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, display:"flex", flexDirection:"column", gap:8 }}>
      {toasts.map((t) => (
        <div key={t.id} onClick={() => remove(t.id)}
          style={{ background:colors[t.type]||colors.info, color:"#fff", padding:"12px 20px", borderRadius:10, fontSize:13, fontFamily:"Inter,sans-serif", boxShadow:"0 4px 20px rgba(0,0,0,0.4)", display:"flex", alignItems:"center", gap:10, minWidth:260, maxWidth:360, cursor:"pointer", animation:"slideIn 0.3s ease" }}>
          <span style={{ flexShrink:0 }}>{t.type==="success"?"✓":t.type==="error"?"✗":t.type==="warn"?"⚠":"ℹ"}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ─── MODAL ───────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.78)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#0a1f0d", border:"1px solid rgba(212,175,55,0.3)", borderRadius:16, width:"100%", maxWidth:wide?720:500, maxHeight:"92vh", overflow:"auto", boxShadow:"0 24px 70px rgba(0,0,0,0.7)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 24px 16px", borderBottom:"1px solid rgba(212,175,55,0.15)" }}>
          <span style={{ fontFamily:"Cinzel,serif", color:"#D4AF37", fontSize:15, letterSpacing:1 }}>{title}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#7fa86b", cursor:"pointer", fontSize:22, lineHeight:1 }}>✕</button>
        </div>
        <div style={{ padding:24 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── FIELD ───────────────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = "text", options, placeholder, required }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={LBL}>{label}{required ? " *" : ""}</label>
      {options ? (
        <select style={SELECT_S} value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => (
            <option key={o.value} value={o.value} style={{ background:"#0a1f0d" }}>{o.label}</option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea style={{ ...INP, minHeight:84, resize:"vertical" }} value={value}
          onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <input style={INP} type={type} value={value}
          onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}

// ─── BADGE ───────────────────────────────────────────────────────────────────
function Badge({ status }) {
  const M = {
    active:    { bg:"rgba(39,174,96,0.2)",   bd:"rgba(39,174,96,0.5)",   c:"#2ecc71", l:"Faol" },
    blocked:   { bg:"rgba(192,57,43,0.2)",   bd:"rgba(192,57,43,0.5)",   c:"#e74c3c", l:"Bloklangan" },
    hidden:    { bg:"rgba(100,100,100,0.2)", bd:"rgba(100,100,100,0.5)", c:"#95a5a6", l:"Yashirin" },
    stop:      { bg:"rgba(230,126,34,0.2)",  bd:"rgba(230,126,34,0.5)",  c:"#e67e22", l:"To'xtatilgan" },
    free:      { bg:"rgba(39,174,96,0.15)",  bd:"rgba(39,174,96,0.4)",   c:"#2ecc71", l:"Bo'sh" },
    busy:      { bg:"rgba(230,126,34,0.2)",  bd:"rgba(230,126,34,0.5)",  c:"#e67e22", l:"Band" },
    bill:      { bg:"rgba(212,175,55,0.2)",  bd:"rgba(212,175,55,0.5)",  c:"#D4AF37", l:"Hisob" },
    new:       { bg:"rgba(41,128,185,0.2)",  bd:"rgba(41,128,185,0.5)",  c:"#3498db", l:"Yangi" },
    preparing: { bg:"rgba(230,126,34,0.2)",  bd:"rgba(230,126,34,0.5)",  c:"#e67e22", l:"Tayyorlanmoqda" },
    ready:     { bg:"rgba(39,174,96,0.2)",   bd:"rgba(39,174,96,0.5)",   c:"#2ecc71", l:"Tayyor" },
    delivered: { bg:"rgba(100,100,100,0.2)", bd:"rgba(100,100,100,0.4)", c:"#7f8c8d", l:"Yetkazildi" },
  };
  const s = M[status] || M.active;
  return (
    <span style={{ background:s.bg, border:`1px solid ${s.bd}`, color:s.c, borderRadius:6, padding:"2px 10px", fontSize:11, fontWeight:600, flexShrink:0 }}>
      {s.l}
    </span>
  );
}

// ─── STAT CARD ───────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${color}25`, borderRadius:14, padding:"18px 20px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:color, opacity:0.6 }} />
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ color:"#7fa86b", fontSize:10, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>{label}</div>
          <div style={{ color:"#fff", fontSize:20, fontWeight:700, fontFamily:"Cinzel,serif" }}>{value}</div>
          {sub && <div style={{ color:"#4a7a40", fontSize:11, marginTop:4 }}>{sub}</div>}
        </div>
        <div style={{ width:40, height:40, borderRadius:10, background:`${color}20`, border:`1px solid ${color}40`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <Icon d={icon} color={color} size={20} />
        </div>
      </div>
    </div>
  );
}

// ─── CONFIRM ─────────────────────────────────────────────────────────────────
function Confirm({ msg, onYes, onNo }) {
  return (
    <Modal title="Tasdiqlash" onClose={onNo}>
      <p style={{ color:"#e8f5e0", marginBottom:24, lineHeight:1.7, fontSize:14 }}>{msg}</p>
      <div style={{ display:"flex", gap:12 }}>
        <button onClick={onYes} style={{ ...BTN.danger, flex:1 }}>Ha, tasdiqlash</button>
        <button onClick={onNo}  style={{ ...BTN.ghost,  flex:1 }}>Bekor qilish</button>
      </div>
    </Modal>
  );
}

// ─── SEARCH BAR ──────────────────────────────────────────────────────────────
function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ position:"relative", flex:1, maxWidth:300 }}>
      <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", opacity:0.5, pointerEvents:"none" }}>
        <Icon d={IC.search} color="#D4AF37" size={14} />
      </span>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Qidirish..."}
        style={{ ...INP, padding:"9px 12px 9px 34px" }} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════════════════════
function Dashboard({ admins, waiters, categories, menu, orders, tables }) {
  const aCount     = Object.keys(admins).length;
  const wActive    = Object.values(waiters).filter((w) => w.status === "active").length;
  const mActive    = Object.values(menu).filter((m) => m.status === "active").length;
  const cCount     = Object.keys(categories).length;
  const oList      = Object.values(orders);
  const todayList  = oList.filter((o) => o.date === today());
  const todayTotal = todayList.reduce((s, o) => s + (o.total || 0), 0);

  // Stol statistikasi
  const tList    = Object.values(tables);
  const tFree    = tList.filter((t) => t.status === "free").length;
  const tBusy    = tList.filter((t) => t.status === "busy").length;
  const tBill    = tList.filter((t) => t.status === "bill").length;

  // Aktiv shotlar (hozir tayyorlanayotgan)
  const activeShots = tList.flatMap((t) => (t.shots || []).filter((s) => s.status === "new" || s.status === "preparing"));

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:14, marginBottom:22 }}>
        <StatCard icon={IC.money}   label="Bugungi tushum"    value={fmt(todayTotal)}                  sub={`${todayList.length} ta buyurtma`}          color="#D4AF37"/>
        <StatCard icon={IC.order}   label="Jami buyurtmalar"  value={oList.length + " ta"}             sub={`Bugun: ${todayList.length} ta`}             color="#27ae60"/>
        <StatCard icon={IC.admin}   label="Adminlar"          value={aCount + " ta"}                   sub="Ro'yxatdagi adminlar"                        color="#9b59b6"/>
        <StatCard icon={IC.waiter}  label="Ofitsiantlar"      value={wActive + " faol"}                sub={`Jami: ${Object.keys(waiters).length} ta`}   color="#3498db"/>
        <StatCard icon={IC.food}    label="Faol menyu"        value={mActive + " ta"}                  sub={`${cCount} ta kategoriya`}                  color="#e67e22"/>
        <StatCard icon={IC.table}   label="Stollar holati"    value={`${tBusy} band / ${tFree} bo'sh`} sub={`${tBill} ta hisob kutmoqda`}               color="#e91e63"/>
        <StatCard icon={IC.kitchen} label="Aktiv shotlar"     value={activeShots.length + " ta"}       sub="Tayyorlanmoqda / Yangi"                     color="#1abc9c"/>
        <StatCard icon={IC.stats}   label="Jami tushum"       value={fmt(oList.reduce((s,o)=>s+(o.total||0),0))} sub="Barcha vaqt uchun"               color="#f39c12"/>
      </div>

      {/* Stol monitoring */}
      <div style={{ ...CARD, marginBottom:16 }}>
        <div style={CARD_HDR}>
          <span style={CARD_TTL}>Stollar real-time holati</span>
          <div style={{ display:"flex", gap:12 }}>
            {[["Bo'sh","#2ecc71",tFree],["Band","#e67e22",tBusy],["Hisob","#D4AF37",tBill]].map(([l,c,v])=>(
              <span key={l} style={{ background:`${c}15`, border:`1px solid ${c}40`, borderRadius:20, padding:"3px 12px", color:c, fontSize:11 }}>{l}: {v}</span>
            ))}
          </div>
        </div>
       <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(72px,1fr))",
    gap: 8,
  }}
>
  {[...tList]
    .sort((a, b) =>
      String(a?.id || "").localeCompare(
        String(b?.id || ""),
        undefined,
        { numeric: true }
      )
    )
    .map((t, index) => {
      const c =
        t?.status === "free"
          ? "#2ecc71"
          : t?.status === "busy"
          ? "#e67e22"
          : "#D4AF37";

      const shots = Array.isArray(t?.shots) ? t.shots : [];

      return (
        <div
          key={t?.id || index}
          style={{
            height: 70,
            borderRadius: 10,
            background: `${c}10`,
            border: `2px solid ${c}40`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            position: "relative",
          }}
        >
          <span
            style={{
              color: "#e8f5e0",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "Cinzel, serif",
            }}
          >
            {t?.id || "N/A"}
          </span>

          <span
            style={{
              color: c,
              fontSize: 9,
              fontWeight: 600,
            }}
          >
            {t?.status === "free"
              ? "Bo'sh"
              : t?.status === "busy"
              ? "Band"
              : "Hisob"}
          </span>

          {shots.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "#D4AF37",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  color: "#0a1f0d",
                  fontSize: 9,
                  fontWeight: 700,
                }}
              >
                {shots.length}
              </span>
            </div>
          )}
        </div>
      );
    })}
</div>
      </div>

      <div style={CARD}>
        <div style={CARD_HDR}><span style={CARD_TTL}>So'nggi 10 ta buyurtma</span></div>
        {oList.length === 0 ? (
          <div style={{ color:"#3d5c38", textAlign:"center", padding:40, fontSize:14 }}>Hali buyurtma yo'q</div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:500 }}>
              <thead>
                <tr>
                  {["#","Stol","Ofitsiant","Jami","Sana","Vaqt"].map((h) => (
                    <th key={h} style={{ color:"#4a7a40", fontSize:10, textTransform:"uppercase", letterSpacing:1, padding:"0 12px 10px", textAlign:"left", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...oList].reverse().slice(0, 10).map((o, i) => (
                  <tr key={i} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding:"10px 12px", color:"#D4AF37", fontSize:11, fontFamily:"Cinzel,serif" }}>#{i + 1}</td>
                    <td style={{ padding:"10px 12px", color:"#e8f5e0", fontSize:13 }}>{o.table || "—"}</td>
                    <td style={{ padding:"10px 12px", color:"#86B054", fontSize:13 }}>{o.waiterName || "—"}</td>
                    <td style={{ padding:"10px 12px", color:"#D4AF37", fontSize:13, fontWeight:600 }}>{fmt(o.total)}</td>
                    <td style={{ padding:"10px 12px", color:"#4a7a40", fontSize:11 }}>{o.date || "—"}</td>
                    <td style={{ padding:"10px 12px", color:"#4a7a40", fontSize:11 }}>{o.time || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TABLE MANAGER — YANGI
// ════════════════════════════════════════════════════════════════════════════
function TableManager({ tables, waiters, toast }) {
  const [modal,   setModal]   = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [viewTable, setViewTable] = useState(null);
  const [zone,    setZone]    = useState("all");

  const blank = { id:"", zone:"A", capacity:4, status:"free" };
  const [form, setForm] = useState(blank);
  const f = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  const tList    = Object.entries(tables);
  const allZones = [...new Set(tList.map(([,t])=>t.zone))].filter(Boolean).sort();
  const filtered = zone === "all" ? tList : tList.filter(([,t])=>t.zone===zone);

  const statusColor = { free:"#2ecc71", busy:"#e67e22", bill:"#D4AF37" };
  const statusLabel = { free:"Bo'sh", busy:"Band", bill:"Hisob" };

  const counts = {
    free: tList.filter(([,t])=>t.status==="free").length,
    busy: tList.filter(([,t])=>t.status==="busy").length,
    bill: tList.filter(([,t])=>t.status==="bill").length,
  };

  const openAdd  = () => { setForm(blank); setModal("add"); };
  const openEdit = ([id, t]) => { setForm({ ...t, id }); setModal("edit"); };

  const save = async () => {
    if (!form.id || !form.zone) { toast("Stol ID va zona majburiy", "error"); return; }
    // ID validatsiya: faqat raqam yoki harf
    const cleanId = String(form.id).trim();
    if (cleanId === "") { toast("Stol ID bo'sh bo'lmasin", "error"); return; }

    setSaving(true);
    try {
      if (modal === "add") {
        // Takror ID tekshirish
        const existing = await dbGet(`tables/${cleanId}`);
        if (existing) { toast(`"${cleanId}" ID allaqachon mavjud`, "error"); setSaving(false); return; }
        await dbSet(`tables/${cleanId}`, {
          zone:     form.zone,
          capacity: parseInt(form.capacity) || 4,
          status:   "free",
          shots:    [],
        });
        toast(`Stol ${cleanId} qo'shildi ✓`, "success");
      } else {
        const { id: oldId, ...data } = form;
        await dbUpdate(`tables/${oldId}`, {
          zone:     data.zone,
          capacity: parseInt(data.capacity) || 4,
        });
        toast("Stol yangilandi ✓", "success");
      }
      setModal(null);
    } catch (e) { toast("Firebase xatoligi: " + e.message, "error"); }
    setSaving(false);
  };

  const del = async (id) => {
    const t = tables[id];
    if (t?.status !== "free" || (t?.shots?.length || 0) > 0) {
      toast("Bu stol band yoki shotlari bor. Avval tozalang.", "error");
      setConfirm(null); return;
    }
    try { await dbRemove(`tables/${id}`); toast("Stol o'chirildi", "success"); }
    catch { toast("Xatolik", "error"); }
    setConfirm(null);
  };

  // Stolni majburiy tozalash (admin huquqi)
  const forceReset = async (id) => {
    try {
      await dbUpdate(`tables/${id}`, { status:"free", shots:[] });
      toast(`Stol ${id} tozalandi ✓`, "success");
    } catch { toast("Xatolik", "error"); }
    setViewTable(null);
  };

  // Massiv stol qo'shish
  const [bulkForm, setBulkForm] = useState({ prefix:"", start:"1", end:"10", zone:"A", capacity:4 });
  const [bulkModal, setBulkModal] = useState(false);
  const bf = (k) => (v) => setBulkForm((p)=>({...p,[k]:v}));

  const saveBulk = async () => {
    const start = parseInt(bulkForm.start);
    const end   = parseInt(bulkForm.end);
    if (isNaN(start)||isNaN(end)||start>end) { toast("Raqamlar noto'g'ri", "error"); return; }
    if (end - start > 49) { toast("Bir vaqtda 50 tadan ko'p qo'shib bo'lmaydi", "warn"); return; }
    setSaving(true);
    let added = 0;
    for (let i = start; i <= end; i++) {
      const id = bulkForm.prefix ? `${bulkForm.prefix}${i}` : String(i);
      const ex = await dbGet(`tables/${id}`);
      if (!ex) {
        await dbSet(`tables/${id}`, { zone: bulkForm.zone, capacity: parseInt(bulkForm.capacity)||4, status:"free", shots:[] });
        added++;
      }
    }
    toast(`${added} ta stol qo'shildi ✓`, "success");
    setSaving(false);
    setBulkModal(false);
  };

  return (
    <div>
      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:18 }}>
        {[["Jami",tList.length,"#D4AF37"],["Bo'sh",counts.free,"#2ecc71"],["Band",counts.busy,"#e67e22"],["Hisob",counts.bill,"#D4AF37"]].map(([l,v,c])=>(
          <div key={l} style={{ background:`${c}10`, border:`1px solid ${c}30`, borderRadius:12, padding:"14px", textAlign:"center" }}>
            <div style={{ color:c, fontSize:24, fontWeight:700, fontFamily:"Cinzel,serif" }}>{v}</div>
            <div style={{ color:"#7fa86b", fontSize:11, marginTop:2 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        {/* Zone filter */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {["all",...allZones].map((z)=>(
            <button key={z} onClick={()=>setZone(z)} style={{
              padding:"6px 14px", borderRadius:20, cursor:"pointer", fontSize:12,
              background: zone===z?"rgba(212,175,55,0.2)":"rgba(255,255,255,0.04)",
              border: zone===z?"1px solid rgba(212,175,55,0.5)":"1px solid rgba(134,176,84,0.2)",
              color: zone===z?"#D4AF37":"#7fa86b",
            }}>
              {z==="all"?"Barcha":z} zona
            </button>
          ))}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button style={BTN.ghost} onClick={()=>setBulkModal(true)}>📋 Ko'p stol qo'shish</button>
          <button style={BTN.gold}  onClick={openAdd}>+ Stol qo'shish</button>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ color:"#3d5c38", textAlign:"center", padding:48, fontSize:14 }}>
          {tList.length === 0 ? "Hali stol qo'shilmagan" : "Bu zonada stol yo'q"}
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:10 }}>
          {filtered.map(([id, t]) => {
            const c = statusColor[t.status] || "#2ecc71";
            const shots = t.shots || [];
            const totalItems = shots.reduce((s,sh)=>s+(sh.items||[]).reduce((ss,i)=>ss+i.qty,0),0);
            const totalAmt   = shots.reduce((s,sh)=>s+(sh.items||[]).reduce((ss,i)=>ss+i.price*i.qty,0),0);
            return (
              <div key={id} style={{ background:`${c}08`, border:`2px solid ${c}35`, borderRadius:12, padding:"12px 10px", position:"relative", cursor:"pointer" }}
                onClick={()=>setViewTable([id,t])}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                  <span style={{ fontFamily:"Cinzel,serif", color:"#e8f5e0", fontSize:15, fontWeight:700 }}>{id}</span>
                  {shots.length > 0 && (
                    <div style={{ width:18, height:18, borderRadius:"50%", background:"#D4AF37", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <span style={{ color:"#0a1f0d", fontSize:10, fontWeight:700 }}>{shots.length}</span>
                    </div>
                  )}
                </div>
                <div style={{ color:"#4a7a40", fontSize:10, marginBottom:4 }}>{t.zone} zona · {t.capacity || 4} o'rin</div>
                <div style={{ color:c, fontSize:11, fontWeight:600, marginBottom:4 }}>{statusLabel[t.status] || "Bo'sh"}</div>
                {totalItems > 0 && (
                  <div style={{ color:"#D4AF37", fontSize:10 }}>{totalItems} ta · {fmt(totalAmt)}</div>
                )}
                {/* Actions row */}
                <div style={{ display:"flex", gap:4, marginTop:8 }} onClick={(e)=>e.stopPropagation()}>
                  <button onClick={()=>openEdit([id,t])} style={{ flex:1, background:"rgba(212,175,55,0.12)", border:"1px solid rgba(212,175,55,0.3)", borderRadius:6, color:"#D4AF37", fontSize:11, padding:"4px", cursor:"pointer" }}>✎</button>
                  <button onClick={()=>setConfirm(id)} style={{ flex:1, background:"rgba(192,57,43,0.12)", border:"1px solid rgba(192,57,43,0.3)", borderRadius:6, color:"#e74c3c", fontSize:11, padding:"4px", cursor:"pointer" }}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stol detail modal */}
      {viewTable && (() => {
        const [tId, tData] = viewTable;
        const shots = tData.shots || [];
        const total = shots.reduce((s,sh)=>(sh.items||[]).reduce((ss,i)=>ss+i.price*i.qty,s),0);
        return (
          <Modal title={`Stol ${tId} — batafsil`} onClose={()=>setViewTable(null)}>
            <div style={{ display:"flex", gap:10, marginBottom:16 }}>
              <div style={{ flex:1, background:"rgba(255,255,255,0.03)", borderRadius:10, padding:"12px", textAlign:"center" }}>
                <div style={{ color:"#7fa86b", fontSize:11 }}>Zona</div>
                <div style={{ color:"#D4AF37", fontSize:16, fontWeight:700 }}>{tData.zone}</div>
              </div>
              <div style={{ flex:1, background:"rgba(255,255,255,0.03)", borderRadius:10, padding:"12px", textAlign:"center" }}>
                <div style={{ color:"#7fa86b", fontSize:11 }}>Holat</div>
                <Badge status={tData.status} />
              </div>
              <div style={{ flex:1, background:"rgba(255,255,255,0.03)", borderRadius:10, padding:"12px", textAlign:"center" }}>
                <div style={{ color:"#7fa86b", fontSize:11 }}>Shotlar</div>
                <div style={{ color:"#D4AF37", fontSize:16, fontWeight:700 }}>{shots.length}</div>
              </div>
              <div style={{ flex:1, background:"rgba(255,255,255,0.03)", borderRadius:10, padding:"12px", textAlign:"center" }}>
                <div style={{ color:"#7fa86b", fontSize:11 }}>Jami</div>
                <div style={{ color:"#D4AF37", fontSize:13, fontWeight:700 }}>{fmt(total)}</div>
              </div>
            </div>
            {shots.length > 0 && (
              <div style={{ marginBottom:16 }}>
                <div style={{ color:"#D4AF37", fontSize:11, letterSpacing:1, marginBottom:8 }}>SHOTLAR</div>
                {shots.map((sh,i)=>{
                  const st = (sh.items||[]).reduce((s,it)=>s+it.price*it.qty,0);
                  return (
                    <div key={sh.id} style={{ background:"rgba(255,255,255,0.03)", borderRadius:8, padding:"10px 14px", marginBottom:6, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <span style={{ color:"#e8f5e0", fontSize:13 }}>Shot #{i+1}</span>
                        <span style={{ color:"#4a7a40", fontSize:11, marginLeft:8 }}>{(sh.items||[]).reduce((s,it)=>s+it.qty,0)} ta mahsulot</span>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <Badge status={sh.status||"new"} />
                        <span style={{ color:"#D4AF37", fontSize:13, fontWeight:700 }}>{fmt(st)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {tData.status !== "free" && (
              <button onClick={()=>forceReset(tId)} style={{ ...BTN.danger, width:"100%" }}>
                ⚠ Stolni majburiy tozalash (bo'sh qilish)
              </button>
            )}
          </Modal>
        );
      })()}

      {/* Add/Edit modal */}
      {modal && (
        <Modal title={modal==="add"?"Stol qo'shish":"Stol tahrirlash"} onClose={()=>setModal(null)}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
            <Field label="Stol ID (masalan: 1, A1, VIP1)" value={form.id} onChange={f("id")}
              placeholder="1" required />
            <Field label="Zona" value={form.zone} onChange={f("zone")} placeholder="A, B, VIP" required />
            <Field label="O'rinlar soni" value={String(form.capacity)} onChange={f("capacity")} type="number" placeholder="4" />
          </div>
          {modal === "add" && (
            <div style={{ background:"rgba(41,128,185,0.1)", border:"1px solid rgba(41,128,185,0.3)", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:12, color:"#3498db" }}>
              ℹ Stol qo'shilgach ofitsiantlar darhol ko'ra oladi
            </div>
          )}
          <div style={{ display:"flex", gap:12 }}>
            <button style={{ ...BTN.gold, flex:1, opacity:saving?0.7:1 }} onClick={save} disabled={saving}>
              {saving?"Saqlanmoqda...":modal==="add"?"Qo'shish":"Saqlash"}
            </button>
            <button style={{ ...BTN.ghost, flex:1 }} onClick={()=>setModal(null)}>Bekor</button>
          </div>
        </Modal>
      )}

      {/* Bulk add modal */}
      {bulkModal && (
        <Modal title="Ko'p stol qo'shish" onClose={()=>setBulkModal(false)}>
          <div style={{ background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"12px 16px", marginBottom:16, color:"#D4AF37", fontSize:12 }}>
            Misol: Prefix="T", Boshlanish=1, Tugash=10 → T1, T2, ... T10
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
            <Field label="Prefix (ixtiyoriy)" value={bulkForm.prefix} onChange={bf("prefix")} placeholder="T, VIP, A" />
            <Field label="Zona" value={bulkForm.zone} onChange={bf("zone")} placeholder="A" />
            <Field label="Boshlanish raqami" value={bulkForm.start} onChange={bf("start")} type="number" placeholder="1" />
            <Field label="Tugash raqami"    value={bulkForm.end}   onChange={bf("end")}   type="number" placeholder="10" />
            <Field label="O'rinlar soni" value={String(bulkForm.capacity)} onChange={bf("capacity")} type="number" placeholder="4" />
          </div>
          <div style={{ display:"flex", gap:12 }}>
            <button style={{ ...BTN.gold, flex:1, opacity:saving?0.7:1 }} onClick={saveBulk} disabled={saving}>
              {saving?"Qo'shilmoqda...":"Stollarni qo'shish"}
            </button>
            <button style={{ ...BTN.ghost, flex:1 }} onClick={()=>setBulkModal(false)}>Bekor</button>
          </div>
        </Modal>
      )}

      {confirm && (
        <Confirm
          msg={`Stol "${confirm}" ni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`}
          onYes={() => del(confirm)}
          onNo={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ORDERS MONITOR — YANGI (real-time buyurtmalar + shot status boshqaruvi)
// ════════════════════════════════════════════════════════════════════════════
function OrdersMonitor({ tables, orders, toast }) {
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedShot, setSelectedShot] = useState(null); // { tableId, shotId, shot, tableData }

  // Barcha aktiv stollardan shotlarni yig'amiz
  const activeShots = [];
  Object.entries(tables).forEach(([tableId, t]) => {
    (t.shots || []).forEach((shot) => {
      activeShots.push({ tableId, tableName: tableId, tableZone: t.zone || "", shot });
    });
  });

  const SHOT_STATUSES = ["new","preparing","ready","delivered"];
  const STATUS_COLORS = { new:"#3498db", preparing:"#e67e22", ready:"#2ecc71", delivered:"#7f8c8d" };
  const STATUS_LABELS = { new:"Yangi", preparing:"Tayyorlanmoqda", ready:"Tayyor", delivered:"Yetkazildi" };
  const STATUS_ICONS  = { new:"🆕", preparing:"👨‍🍳", ready:"✅", delivered:"🚀" };

  const filtered = filterStatus === "all"
    ? activeShots
    : activeShots.filter((a) => (a.shot.status || "new") === filterStatus);

  const countsByStatus = SHOT_STATUSES.reduce((acc, s) => {
    acc[s] = activeShots.filter((a) => (a.shot.status || "new") === s).length;
    return acc;
  }, {});

  const updateShotStatus = async (tableId, shotId, newStatus) => {
    const t = tables[tableId];
    if (!t) return;
    const newShots = (t.shots || []).map((sh) =>
      sh.id === shotId ? { ...sh, status: newStatus } : sh
    );
    try {
      await dbUpdate(`tables/${tableId}`, { shots: newShots });
      toast(`Shot holati: ${STATUS_LABELS[newStatus]} ✓`, "success");
      setSelectedShot(null);
    } catch (e) { toast("Xatolik: " + e.message, "error"); }
  };

  return (
    <div>
      {/* Status filter */}
      <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap" }}>
        <button onClick={()=>setFilterStatus("all")} style={{
          padding:"8px 16px", borderRadius:20, cursor:"pointer", fontSize:12,
          background: filterStatus==="all"?"rgba(212,175,55,0.2)":"rgba(255,255,255,0.04)",
          border: filterStatus==="all"?"1px solid rgba(212,175,55,0.5)":"1px solid rgba(134,176,84,0.2)",
          color: filterStatus==="all"?"#D4AF37":"#7fa86b",
        }}>
          Hammasi ({activeShots.length})
        </button>
        {SHOT_STATUSES.map((s) => (
          <button key={s} onClick={()=>setFilterStatus(s)} style={{
            padding:"8px 16px", borderRadius:20, cursor:"pointer", fontSize:12,
            background: filterStatus===s?`${STATUS_COLORS[s]}20`:"rgba(255,255,255,0.04)",
            border: filterStatus===s?`1px solid ${STATUS_COLORS[s]}60`:"1px solid rgba(134,176,84,0.2)",
            color: filterStatus===s?STATUS_COLORS[s]:"#7fa86b",
          }}>
            {STATUS_ICONS[s]} {STATUS_LABELS[s]} ({countsByStatus[s]})
          </button>
        ))}
      </div>

      {/* Shots list */}
      {filtered.length === 0 ? (
        <div style={{ color:"#3d5c38", textAlign:"center", padding:60, fontSize:14 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🍽️</div>
          <div>{filterStatus==="all"?"Hozirda aktiv buyurtma yo'q":"Bu statusda buyurtma yo'q"}</div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:12 }}>
          {filtered.map(({ tableId, tableZone, shot }) => {
            const shotTotal = (shot.items || []).reduce((s,i)=>s+i.price*i.qty,0);
            const status    = shot.status || "new";
            const c         = STATUS_COLORS[status];
            return (
              <div key={`${tableId}-${shot.id}`}
                style={{ background:`${c}08`, border:`1px solid ${c}35`, borderRadius:14, padding:"16px 18px", cursor:"pointer" }}
                onClick={()=>setSelectedShot({ tableId, shotId:shot.id, shot, tableData:tables[tableId] })}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ fontFamily:"Cinzel,serif", color:"#e8f5e0", fontSize:15, fontWeight:700 }}>Stol {tableId}</div>
                      <span style={{ color:"#4a7a40", fontSize:11 }}>{tableZone} zona</span>
                    </div>
                    <div style={{ color:"#4a7a40", fontSize:11, marginTop:2 }}>{shot.createdAt || ""}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <Badge status={status} />
                    <div style={{ color:"#D4AF37", fontSize:13, fontWeight:700, marginTop:4 }}>{fmt(shotTotal)}</div>
                  </div>
                </div>
                {/* Items */}
                <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
                  {(shot.items || []).map((item, i) => (
                    <div key={i} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:6, padding:"4px 10px", fontSize:11, color:"#e8f5e0", display:"flex", alignItems:"center", gap:5 }}>
                      <span>{item.image || "🍽️"}</span>
                      <span>{item.name}</span>
                      <span style={{ color:"#D4AF37", fontWeight:700 }}>×{item.qty}</span>
                      {item.note && <span style={{ color:"#e67e22", fontSize:10 }}>📝</span>}
                    </div>
                  ))}
                </div>
                {/* Quick status change buttons */}
                <div style={{ display:"flex", gap:5 }} onClick={(e)=>e.stopPropagation()}>
                  {SHOT_STATUSES.filter((s)=>s!==status).map((s) => (
                    <button key={s} onClick={()=>updateShotStatus(tableId, shot.id, s)}
                      style={{ flex:1, padding:"5px 4px", borderRadius:6, cursor:"pointer", fontSize:10, border:`1px solid ${STATUS_COLORS[s]}50`, background:`${STATUS_COLORS[s]}15`, color:STATUS_COLORS[s] }}>
                      {STATUS_ICONS[s]}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Shot detail modal */}
      {selectedShot && (
        <Modal title={`Stol ${selectedShot.tableId} — Shot batafsil`} onClose={()=>setSelectedShot(null)}>
          <div style={{ marginBottom:16 }}>
            <div style={{ display:"flex", gap:8, marginBottom:12 }}>
              <Badge status={selectedShot.shot.status || "new"} />
              <span style={{ color:"#4a7a40", fontSize:12 }}>{selectedShot.shot.createdAt || ""}</span>
            </div>
            <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:10, overflow:"hidden" }}>
              {(selectedShot.shot.items || []).map((item, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 16px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize:20 }}>{item.image || "🍽️"}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ color:"#e8f5e0", fontSize:13 }}>{item.name}</div>
                    {item.note && <div style={{ color:"#e67e22", fontSize:11 }}>📝 {item.note}</div>}
                  </div>
                  <span style={{ color:"#7fa86b", fontSize:12 }}>×{item.qty}</span>
                  <span style={{ color:"#D4AF37", fontSize:13, fontWeight:700, minWidth:90, textAlign:"right" }}>{fmt(item.price * item.qty)}</span>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end", padding:"10px 0 4px", color:"#D4AF37", fontSize:14, fontWeight:700 }}>
              Jami: {fmt((selectedShot.shot.items||[]).reduce((s,i)=>s+i.price*i.qty,0))}
            </div>
          </div>
          <div style={{ color:"#D4AF37", fontSize:11, letterSpacing:1, marginBottom:10 }}>HOLATNI O'ZGARTIRISH</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {SHOT_STATUSES.map((s) => {
              const isCurrent = (selectedShot.shot.status || "new") === s;
              return (
                <button key={s} onClick={()=>!isCurrent && updateShotStatus(selectedShot.tableId, selectedShot.shotId, s)}
                  style={{
                    padding:"12px 16px", borderRadius:10, cursor:isCurrent?"default":"pointer",
                    background: isCurrent?`${STATUS_COLORS[s]}30`:`${STATUS_COLORS[s]}10`,
                    border: isCurrent?`2px solid ${STATUS_COLORS[s]}`:`1px solid ${STATUS_COLORS[s]}50`,
                    color: STATUS_COLORS[s], fontSize:13, fontWeight:isCurrent?700:400,
                    display:"flex", alignItems:"center", gap:8, justifyContent:"center",
                  }}>
                  {STATUS_ICONS[s]} {STATUS_LABELS[s]}
                  {isCurrent && <span style={{ fontSize:11 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// KITCHEN PANEL — YANGI (oshxona uchun optimallashtirilgan ko'rinish)
// ════════════════════════════════════════════════════════════════════════════
function KitchenPanel({ tables, toast }) {
  // Faqat "new" va "preparing" shotlar
  const pendingShots = [];
  Object.entries(tables).forEach(([tableId, t]) => {
    (t.shots || []).forEach((shot) => {
      const st = shot.status || "new";
      if (st === "new" || st === "preparing") {
        pendingShots.push({ tableId, shot, st });
      }
    });
  });
  pendingShots.sort((a, b) => {
    // "new" oldin, keyin "preparing"
    if (a.st === b.st) return 0;
    return a.st === "new" ? -1 : 1;
  });

  const updateStatus = async (tableId, shotId, newSt) => {
    const t = tables[tableId];
    if (!t) return;
    const newShots = (t.shots || []).map((sh) =>
      sh.id === shotId ? { ...sh, status: newSt } : sh
    );
    try {
      await dbUpdate(`tables/${tableId}`, { shots: newShots });
      toast(newSt === "preparing" ? "🍳 Tayyorlanmoqda!" : newSt === "ready" ? "✅ Tayyor!" : "🚀 Yetkazildi!", "success");
    } catch (e) { toast("Xatolik", "error"); }
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div style={{ color:"#7fa86b", fontSize:13 }}>
          Oshxona navbati: <span style={{ color:"#e67e22", fontWeight:700 }}>{pendingShots.length} ta shot</span>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <span style={{ background:"rgba(41,128,185,0.15)", border:"1px solid rgba(41,128,185,0.4)", borderRadius:20, padding:"4px 12px", color:"#3498db", fontSize:11 }}>
            🆕 Yangi: {pendingShots.filter((p)=>p.st==="new").length}
          </span>
          <span style={{ background:"rgba(230,126,34,0.15)", border:"1px solid rgba(230,126,34,0.4)", borderRadius:20, padding:"4px 12px", color:"#e67e22", fontSize:11 }}>
            👨‍🍳 Tayyorlanmoqda: {pendingShots.filter((p)=>p.st==="preparing").length}
          </span>
        </div>
      </div>

      {pendingShots.length === 0 ? (
        <div style={{ color:"#3d5c38", textAlign:"center", padding:80, fontSize:15 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
          <div>Barcha buyurtmalar bajarildi!</div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
          {pendingShots.map(({ tableId, shot, st }) => {
            const isNew = st === "new";
            const borderColor = isNew ? "#3498db" : "#e67e22";
            return (
              <div key={`${tableId}-${shot.id}`}
                style={{ background:`${borderColor}08`, border:`2px solid ${borderColor}50`, borderRadius:14, padding:"18px", position:"relative" }}>
                {/* Yangi belgisi */}
                {isNew && (
                  <div style={{ position:"absolute", top:-1, right:-1, background:"#3498db", borderRadius:"0 14px 0 8px", padding:"3px 10px", fontSize:10, color:"#fff", fontWeight:700 }}>
                    YANGI
                  </div>
                )}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <div style={{ fontFamily:"Cinzel,serif", color:"#e8f5e0", fontSize:16, fontWeight:700 }}>Stol {tableId}</div>
                  <div style={{ color:"#4a7a40", fontSize:12 }}>{shot.createdAt || ""}</div>
                </div>
                {/* Items */}
                <div style={{ marginBottom:14 }}>
                  {(shot.items || []).map((item, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                      <span style={{ fontSize:22, minWidth:30 }}>{item.image || "🍽️"}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ color:"#e8f5e0", fontSize:14, fontWeight:600 }}>{item.name}</div>
                        {item.note && (
                          <div style={{ color:"#e67e22", fontSize:11, marginTop:2 }}>📝 {item.note}</div>
                        )}
                      </div>
                      <div style={{ background:"rgba(212,175,55,0.2)", border:"1px solid rgba(212,175,55,0.4)", borderRadius:8, padding:"4px 12px", color:"#D4AF37", fontSize:16, fontWeight:700 }}>
                        ×{item.qty}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Action buttons */}
                <div style={{ display:"flex", gap:8 }}>
                  {isNew ? (
                    <button onClick={()=>updateStatus(tableId, shot.id, "preparing")}
                      style={{ flex:1, background:"rgba(230,126,34,0.25)", border:"1px solid rgba(230,126,34,0.5)", borderRadius:10, color:"#e67e22", fontSize:13, padding:"12px", cursor:"pointer", fontWeight:600 }}>
                      👨‍🍳 Tayyorlashni boshlash
                    </button>
                  ) : (
                    <button onClick={()=>updateStatus(tableId, shot.id, "ready")}
                      style={{ flex:1, background:"rgba(39,174,96,0.25)", border:"1px solid rgba(39,174,96,0.5)", borderRadius:10, color:"#2ecc71", fontSize:13, padding:"12px", cursor:"pointer", fontWeight:600 }}>
                      ✅ Tayyor!
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ADMIN MANAGER (o'zgarmadi)
// ════════════════════════════════════════════════════════════════════════════
function AdminManager({ admins, toast, isSuperAdmin }) {
  const [modal,   setModal]   = useState(null);
  const [search,  setSearch]  = useState("");
  const [confirm, setConfirm] = useState(null);
  const [showP,   setShowP]   = useState([]);
  const [saving,  setSaving]  = useState(false);
  const blank = { name:"", username:"", password:"", email:"", phone:"", status:"active" };
  const [form, setForm] = useState(blank);
  const f = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  const list = Object.entries(admins).filter(
    ([, a]) =>
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.username?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd  = () => { setForm(blank); setModal("add"); };
  const openEdit = ([id, a]) => { setForm({ ...a, id }); setModal("edit"); };

  const save = async () => {
    if (!form.name || !form.username || !form.password) {
      toast("Barcha majburiy maydonlarni to'ldiring", "error"); return;
    }
    setSaving(true);
    try {
      if (modal === "add") {
        if (Object.values(admins).find((a) => a.username === form.username)) {
          toast("Bu username band", "error"); setSaving(false); return;
        }
        const id = "adm_" + uid();
        await dbSet(`admins/${id}`, { ...form, createdAt: today(), lastLogin: "—" });
        toast("Admin qo'shildi ✓", "success");
      } else {
        const { id, ...data } = form;
        await dbUpdate(`admins/${id}`, data);
        toast("Admin yangilandi ✓", "success");
      }
      setModal(null);
    } catch { toast("Firebase xatoligi", "error"); }
    setSaving(false);
  };

  const del = async (id) => {
    try { await dbRemove(`admins/${id}`); toast("Admin o'chirildi", "success"); }
    catch { toast("Xatolik", "error"); }
    setConfirm(null);
  };

  const toggle = async (id, cur) => {
    try {
      await dbUpdate(`admins/${id}`, { status: cur === "active" ? "blocked" : "active" });
      toast("Status yangilandi", "info");
    } catch { toast("Xatolik", "error"); }
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, gap:12, flexWrap:"wrap" }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Admin qidirish..." />
        {isSuperAdmin && <button style={BTN.gold} onClick={openAdd}>+ Admin qo'shish</button>}
      </div>

      {list.length === 0 && (
        <div style={{ color:"#3d5c38", textAlign:"center", padding:48, fontSize:14 }}>
          {Object.keys(admins).length === 0 ? "Hali admin qo'shilmagan" : "Admin topilmadi"}
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {list.map(([id, a]) => (
          <div key={id} style={{ ...CARD, display:"flex", alignItems:"center", gap:14, flexWrap:"wrap", padding:"14px 18px" }}>
            <div style={{ width:42, height:42, borderRadius:10, background:"linear-gradient(135deg,#1a3a1a,#0f2a10)", border:"1px solid rgba(212,175,55,0.3)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Icon d={IC.admin} color="#D4AF37" size={20} />
            </div>
            <div style={{ flex:1, minWidth:140 }}>
              <div style={{ color:"#e8f5e0", fontWeight:600, fontSize:14 }}>{a.name}</div>
              <div style={{ color:"#7fa86b", fontSize:12 }}>@{a.username} · {a.email || "—"}</div>
              <div style={{ color:"#4a7a40", fontSize:11, marginTop:2 }}>{a.phone || "—"} · Qo'shilgan: {a.createdAt || "—"}</div>
            </div>
            <div style={{ textAlign:"center", minWidth:90 }}>
              <div style={{ color:"#4a7a40", fontSize:9, marginBottom:3 }}>PAROL</div>
              <div style={{ color:"#D4AF37", fontSize:12, cursor:"pointer" }}
                onClick={() => setShowP((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])}>
                {showP.includes(id) ? a.password : "••••••••"}
              </div>
            </div>
            <div style={{ textAlign:"center", minWidth:90 }}>
              <div style={{ color:"#4a7a40", fontSize:9, marginBottom:3 }}>SO'NGI KIRISH</div>
              <div style={{ color:"#7fa86b", fontSize:11 }}>{a.lastLogin || "—"}</div>
            </div>
            <Badge status={a.status} />
            {isSuperAdmin && (
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                <button style={{ ...BTN.ghost, padding:"6px 12px" }} onClick={() => openEdit([id, a])}>✎ Tahrirlash</button>
                <button style={{ ...(a.status === "active" ? BTN.warn : BTN.green), padding:"6px 12px" }}
                  onClick={() => toggle(id, a.status)}>
                  {a.status === "active" ? "Bloklash" : "Faollashtirish"}
                </button>
                <button style={{ ...BTN.danger, padding:"6px 12px" }} onClick={() => setConfirm(id)}>✕</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={modal === "add" ? "Admin qo'shish" : "Admin tahrirlash"} onClose={() => setModal(null)}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
            <Field label="To'liq ism" value={form.name}     onChange={f("name")}     placeholder="Jasur Toshmatov" required />
            <Field label="Username"   value={form.username}  onChange={f("username")} placeholder="jasur_admin"     required />
            <Field label="Parol"      value={form.password}  onChange={f("password")} type="password"               required />
            <Field label="Telefon"    value={form.phone}     onChange={f("phone")}    placeholder="+998901234567" />
            <Field label="Email"      value={form.email}     onChange={f("email")}    placeholder="admin@amazonia.uz" />
            <Field label="Status"     value={form.status}    onChange={f("status")}
              options={[{value:"active",label:"Faol"},{value:"blocked",label:"Bloklangan"}]} />
          </div>
          <div style={{ display:"flex", gap:12, marginTop:8 }}>
            <button style={{ ...BTN.gold, flex:1, opacity:saving?0.7:1 }} onClick={save} disabled={saving}>
              {saving ? "Saqlanmoqda..." : modal === "add" ? "Qo'shish" : "Saqlash"}
            </button>
            <button style={{ ...BTN.ghost, flex:1 }} onClick={() => setModal(null)}>Bekor</button>
          </div>
        </Modal>
      )}
      {confirm && <Confirm msg={`"${admins[confirm]?.name}" adminini o'chirmoqchimisiz?`} onYes={() => del(confirm)} onNo={() => setConfirm(null)} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// WAITER MANAGER (o'zgarmadi)
// ════════════════════════════════════════════════════════════════════════════
function WaiterManager({ waiters, toast }) {
  const [modal,   setModal]   = useState(null);
  const [search,  setSearch]  = useState("");
  const [confirm, setConfirm] = useState(null);
  const [showP,   setShowP]   = useState([]);
  const [saving,  setSaving]  = useState(false);
  const genPass = () => "Waiter@" + Math.floor(1000 + Math.random() * 9000);
  const blank   = { name:"", username:"", password:"", phone:"", table:"", status:"active" };
  const [form, setForm] = useState(blank);
  const f = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  const list = Object.entries(waiters).filter(
    ([, w]) =>
      w.name?.toLowerCase().includes(search.toLowerCase()) ||
      w.username?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd  = () => { setForm({ ...blank, password: genPass() }); setModal("add"); };
  const openEdit = ([id, w]) => { setForm({ ...w, id }); setModal("edit"); };

  const save = async () => {
    if (!form.name || !form.username || !form.password) {
      toast("Majburiy maydonlarni to'ldiring", "error"); return;
    }
    setSaving(true);
    try {
      if (modal === "add") {
        if (Object.values(waiters).find((w) => w.username === form.username)) {
          toast("Bu username band", "error"); setSaving(false); return;
        }
        const id = "wtr_" + uid();
        await dbSet(`waiters/${id}`, { ...form, rating:0, orders:0, createdAt:today(), lastLogin:"—" });
        toast("Ofitsiant qo'shildi ✓", "success");
      } else {
        const { id, ...data } = form;
        await dbUpdate(`waiters/${id}`, data);
        toast("Yangilandi ✓", "success");
      }
      setModal(null);
    } catch { toast("Firebase xatoligi", "error"); }
    setSaving(false);
  };

  const del = async (id) => {
    try { await dbRemove(`waiters/${id}`); toast("O'chirildi", "success"); }
    catch { toast("Xatolik", "error"); }
    setConfirm(null);
  };

  const toggle = async (id, cur) => {
    try {
      await dbUpdate(`waiters/${id}`, { status: cur === "active" ? "blocked" : "active" });
      toast("Status yangilandi", "info");
    } catch { toast("Xatolik", "error"); }
  };

  const resetPass = async (id) => {
    const np = genPass();
    try {
      await dbUpdate(`waiters/${id}`, { password: np });
      toast(`Yangi parol: ${np}`, "info");
    } catch { toast("Xatolik", "error"); }
  };

  const stars = (r) => "★".repeat(Math.round(r || 0)) + "☆".repeat(5 - Math.round(r || 0));

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, gap:12, flexWrap:"wrap" }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Ofitsiant qidirish..." />
        <button style={BTN.gold} onClick={openAdd}>+ Ofitsiant qo'shish</button>
      </div>

      {list.length === 0 && (
        <div style={{ color:"#3d5c38", textAlign:"center", padding:48 }}>
          {Object.keys(waiters).length === 0 ? "Hali ofitsiant qo'shilmagan" : "Topilmadi"}
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:12 }}>
        {list.map(([id, w]) => (
          <div key={id} style={{ ...CARD, padding:"16px 18px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
              <div style={{ display:"flex", gap:10 }}>
                <div style={{ width:42, height:42, borderRadius:10, background: w.status==="active"?"rgba(39,174,96,0.15)":"rgba(192,57,43,0.15)", border:`1px solid ${w.status==="active"?"rgba(39,174,96,0.4)":"rgba(192,57,43,0.4)"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Icon d={IC.waiter} color={w.status==="active"?"#2ecc71":"#e74c3c"} size={20} />
                </div>
                <div>
                  <div style={{ color:"#e8f5e0", fontWeight:600, fontSize:14 }}>{w.name}</div>
                  <div style={{ color:"#7fa86b", fontSize:12 }}>@{w.username}</div>
                  <div style={{ color:"#f39c12", fontSize:12 }}>{stars(w.rating)} {(w.rating || 0).toFixed(1)}</div>
                </div>
              </div>
              <Badge status={w.status} />
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:10 }}>
              {[["Telefon",w.phone||"—"],["Zona",w.table||"—"],["Buyurtmalar",(w.orders||0)+" ta"],["Qo'shilgan",w.createdAt||"—"]].map(([k, v]) => (
                <div key={k} style={{ background:"rgba(255,255,255,0.03)", borderRadius:6, padding:"5px 9px" }}>
                  <div style={{ color:"#4a7a40", fontSize:9 }}>{k.toUpperCase()}</div>
                  <div style={{ color:"#e8f5e0", fontSize:12, marginTop:1 }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,0.03)", borderRadius:6, padding:"6px 10px", marginBottom:10 }}>
              <div>
                <div style={{ color:"#4a7a40", fontSize:9 }}>PAROL</div>
                <div style={{ color:"#D4AF37", fontSize:13, cursor:"pointer" }}
                  onClick={() => setShowP((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])}>
                  {showP.includes(id) ? w.password : "••••••••"}
                </div>
              </div>
              <button style={{ ...BTN.ghost, padding:"4px 10px", fontSize:11 }} onClick={() => resetPass(id)}>
                🔄 Yangi parol
              </button>
            </div>

            <div style={{ display:"flex", gap:6 }}>
              <button style={{ ...BTN.ghost, flex:1, padding:"7px" }} onClick={() => openEdit([id, w])}>✎ Tahrirlash</button>
              <button style={{ ...(w.status==="active"?BTN.warn:BTN.green), flex:1, padding:"7px" }}
                onClick={() => toggle(id, w.status)}>
                {w.status === "active" ? "Bloklash" : "Faollashtirish"}
              </button>
              <button style={{ ...BTN.danger, padding:"7px 12px" }} onClick={() => setConfirm(id)}>✕</button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={modal==="add"?"Ofitsiant qo'shish":"Ofitsiant tahrirlash"} onClose={() => setModal(null)}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
            <Field label="To'liq ism"  value={form.name}     onChange={f("name")}     placeholder="Bobur Yusupov" required />
            <Field label="Username"    value={form.username}  onChange={f("username")} placeholder="bobur_waiter"  required />
            <Field label="Parol"       value={form.password}  onChange={f("password")} required />
            <Field label="Telefon"     value={form.phone}     onChange={f("phone")}    placeholder="+998901234567" />
            <Field label="Stol zonasi" value={form.table}     onChange={f("table")}    placeholder="A, B, VIP" />
            <Field label="Status"      value={form.status}    onChange={f("status")}
              options={[{value:"active",label:"Faol"},{value:"blocked",label:"Bloklangan"}]} />
          </div>
          {modal === "add" && (
            <div style={{ background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.3)", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:12, color:"#D4AF37" }}>
              💡 Login: <b>{form.username}</b> · Parol: <b>{form.password}</b>
            </div>
          )}
          <div style={{ display:"flex", gap:12 }}>
            <button style={{ ...BTN.gold, flex:1, opacity:saving?0.7:1 }} onClick={save} disabled={saving}>
              {saving ? "Saqlanmoqda..." : modal==="add"?"Hisob yaratish":"Saqlash"}
            </button>
            <button style={{ ...BTN.ghost, flex:1 }} onClick={() => setModal(null)}>Bekor</button>
          </div>
        </Modal>
      )}
      {confirm && <Confirm msg={`"${waiters[confirm]?.name}" ofitsiantni o'chirmoqchimisiz?`} onYes={() => del(confirm)} onNo={() => setConfirm(null)} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CATEGORY MANAGER (o'zgarmadi)
// ════════════════════════════════════════════════════════════════════════════
function CategoryManager({ categories, menu, toast }) {
  const [modal,   setModal]   = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const blank = { name:"", icon:"🍽️", color:"#27ae60", status:"active" };
  const [form, setForm] = useState(blank);
  const f = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  const EMOJIS = ["🥩","🍔","🥗","🍹","🍰","🍞","🍕","🌮","🍜","🥘","🍣","🦞","🍗","🥙","🍛","🍱","🥤","🧁","🫕","🍮","🥦","🫔","🍤","🥚","🧆"];
  const COLORS = ["#c0392b","#e67e22","#27ae60","#2980b9","#8e44ad","#d35400","#16a085","#f39c12","#1abc9c","#2c3e50","#e91e63","#00bcd4"];

  const list = Object.entries(categories);

  const openAdd  = () => { setForm(blank); setModal("add"); };
  const openEdit = ([id, c]) => { setForm({ ...c, id }); setModal("edit"); };

  const save = async () => {
    if (!form.name) { toast("Nom kiritish shart", "error"); return; }
    setSaving(true);
    try {
      if (modal === "add") {
        await dbSet(`categories/cat_${uid()}`, { ...form });
        toast("Kategoriya qo'shildi ✓", "success");
      } else {
        const { id, ...data } = form;
        await dbUpdate(`categories/${id}`, data);
        toast("Yangilandi ✓", "success");
      }
      setModal(null);
    } catch { toast("Firebase xatoligi", "error"); }
    setSaving(false);
  };

  const del = async (id) => {
    if (Object.values(menu).some((m) => m.category === id)) {
      toast("Bu kategoriyada ovqatlar bor, avval ularni o'chiring", "error");
      setConfirm(null); return;
    }
    try { await dbRemove(`categories/${id}`); toast("O'chirildi", "success"); }
    catch { toast("Xatolik", "error"); }
    setConfirm(null);
  };

  const toggle = async (id, cur) => {
    try {
      await dbUpdate(`categories/${id}`, { status: cur === "active" ? "hidden" : "active" });
      toast("Status yangilandi", "info");
    } catch { toast("Xatolik", "error"); }
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:18 }}>
        <button style={BTN.gold} onClick={openAdd}>+ Kategoriya qo'shish</button>
      </div>

      {list.length === 0 && (
        <div style={{ color:"#3d5c38", textAlign:"center", padding:48 }}>Hali kategoriya qo'shilmagan</div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))", gap:12 }}>
        {list.map(([id, c]) => {
          const count = Object.values(menu).filter((m) => m.category === id).length;
          return (
            <div key={id} style={{ ...CARD, padding:"16px 18px", borderLeft:`3px solid ${c.color}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                <div style={{ width:46, height:46, borderRadius:10, background:`${c.color}20`, border:`1px solid ${c.color}50`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{c.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ color:"#e8f5e0", fontWeight:600, fontSize:14 }}>{c.name}</div>
                  <div style={{ color:"#7fa86b", fontSize:12 }}>{count} ta ovqat</div>
                </div>
                <Badge status={c.status} />
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <button style={{ ...BTN.ghost, flex:1, padding:"6px" }} onClick={() => openEdit([id, c])}>✎</button>
                <button style={{ ...(c.status==="active"?BTN.warn:BTN.green), padding:"6px 12px" }}
                  onClick={() => toggle(id, c.status)}>
                  {c.status === "active" ? "Yashirish" : "Ko'rsatish"}
                </button>
                <button style={{ ...BTN.danger, padding:"6px 12px" }} onClick={() => setConfirm(id)}>✕</button>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <Modal title={modal==="add"?"Kategoriya qo'shish":"Kategoriya tahrirlash"} onClose={() => setModal(null)}>
          <Field label="Kategoriya nomi" value={form.name} onChange={f("name")} placeholder="Salatlar" required />
          <div style={{ marginBottom:14 }}>
            <label style={LBL}>EMOJI</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {EMOJIS.map((e) => (
                <button key={e} onClick={() => setForm((p) => ({ ...p, icon:e }))}
                  style={{ width:38, height:38, fontSize:18, borderRadius:8, cursor:"pointer", background:form.icon===e?"rgba(212,175,55,0.3)":"rgba(255,255,255,0.05)", border:form.icon===e?"2px solid #D4AF37":"1px solid rgba(255,255,255,0.1)" }}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={LBL}>RANG</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {COLORS.map((c) => (
                <button key={c} onClick={() => setForm((p) => ({ ...p, color:c }))}
                  style={{ width:30, height:30, borderRadius:"50%", background:c, cursor:"pointer", border:form.color===c?"3px solid #D4AF37":"2px solid transparent", transform:form.color===c?"scale(1.2)":"scale(1)", transition:"transform 0.1s" }} />
              ))}
            </div>
          </div>
          <Field label="Status" value={form.status} onChange={f("status")}
            options={[{value:"active",label:"Faol"},{value:"hidden",label:"Yashirin"}]} />
          <div style={{ display:"flex", gap:12 }}>
            <button style={{ ...BTN.gold, flex:1, opacity:saving?0.7:1 }} onClick={save} disabled={saving}>
              {saving ? "Saqlanmoqda..." : modal==="add"?"Qo'shish":"Saqlash"}
            </button>
            <button style={{ ...BTN.ghost, flex:1 }} onClick={() => setModal(null)}>Bekor</button>
          </div>
        </Modal>
      )}
      {confirm && <Confirm msg={`"${categories[confirm]?.name}" kategoriyani o'chirmoqchimisiz?`} onYes={() => del(confirm)} onNo={() => setConfirm(null)} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MENU MANAGER (o'zgarmadi)
// ════════════════════════════════════════════════════════════════════════════
function MenuManager({ menu, categories, toast }) {
  const [modal,     setModal]     = useState(null);
  const [search,    setSearch]    = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterSt,  setFilterSt]  = useState("all");
  const [confirm,   setConfirm]   = useState(null);
  const [saving,    setSaving]    = useState(false);
  const blank = { name:"", category:"", price:"", description:"", status:"active", image:"🍽️" };
  const [form, setForm] = useState(blank);
  const f = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  const EMOJIS  = ["🥩","🍔","🥗","🍹","🍰","🍞","🍕","🌮","🍜","🥘","🍣","🦞","🍗","🥙","🍛","🍱","🥤","🧁","🫕","🍮","🍤","🥚","🧆","🫔","🥦"];
  const catList = Object.entries(categories);
  const catName = (id) => categories[id]?.name || "—";

  const list = Object.entries(menu).filter(([, m]) => {
    const matchS  = m.name?.toLowerCase().includes(search.toLowerCase());
    const matchC  = filterCat === "all" || m.category === filterCat;
    const matchSt = filterSt  === "all" || m.status   === filterSt;
    return matchS && matchC && matchSt;
  });

  const openAdd  = () => { setForm({ ...blank, category: catList[0]?.[0] || "" }); setModal("add"); };
  const openEdit = ([id, m]) => { setForm({ ...m, price: String(m.price || ""), id }); setModal("edit"); };

  const save = async () => {
    if (!form.name || !form.category || !form.price) {
      toast("Majburiy maydonlarni to'ldiring", "error"); return;
    }
    const price = parseInt(String(form.price).replace(/\D/g, ""));
    if (isNaN(price) || price < 0) { toast("Narx noto'g'ri", "error"); return; }
    setSaving(true);
    try {
      if (modal === "add") {
        await dbSet(`menu/menu_${uid()}`, { ...form, price, rating:0, orders:0, createdAt:today() });
        toast("Ovqat qo'shildi ✓", "success");
      } else {
        const { id, ...data } = form;
        await dbUpdate(`menu/${id}`, { ...data, price });
        toast("Yangilandi ✓", "success");
      }
      setModal(null);
    } catch { toast("Firebase xatoligi", "error"); }
    setSaving(false);
  };

  const del = async (id) => {
    try { await dbRemove(`menu/${id}`); toast("O'chirildi", "success"); }
    catch { toast("Xatolik", "error"); }
    setConfirm(null);
  };

  const changeSt = async (id, st) => {
    try { await dbUpdate(`menu/${id}`, { status: st }); toast("Status yangilandi", "info"); }
    catch { toast("Xatolik", "error"); }
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", gap:8, flex:1, flexWrap:"wrap" }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Ovqat qidirish..." />
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={SELECT_S}>
            <option value="all" style={{ background:"#0a1f0d" }}>Barcha kategoriya</option>
            {catList.map(([id, c]) => (
              <option key={id} value={id} style={{ background:"#0a1f0d" }}>{c.icon} {c.name}</option>
            ))}
          </select>
          <select value={filterSt} onChange={(e) => setFilterSt(e.target.value)} style={SELECT_S}>
            <option value="all"    style={{ background:"#0a1f0d" }}>Barcha status</option>
            <option value="active" style={{ background:"#0a1f0d" }}>Faol</option>
            <option value="stop"   style={{ background:"#0a1f0d" }}>To'xtatilgan</option>
            <option value="hidden" style={{ background:"#0a1f0d" }}>Yashirin</option>
          </select>
        </div>
        <button style={BTN.gold} onClick={openAdd} disabled={catList.length === 0}>
          {catList.length === 0 ? "Avval kategoriya qo'shing" : "+ Ovqat qo'shish"}
        </button>
      </div>

      <div style={{ color:"#4a7a40", fontSize:12, marginBottom:12 }}>{list.length} ta ovqat topildi</div>

      {catList.length === 0 && (
        <div style={{ background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.3)", borderRadius:10, padding:"16px 20px", marginBottom:16, color:"#D4AF37", fontSize:13 }}>
          ⚠ Avval "Kategoriyalar" bo'limida kategoriya yarating.
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))", gap:12 }}>
        {list.map(([id, item]) => (
          <div key={id} style={{ ...CARD, padding:"14px 16px", opacity:item.status==="hidden"?0.55:1 }}>
            <div style={{ display:"flex", gap:12, marginBottom:10 }}>
              <div style={{ width:50, height:50, borderRadius:10, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>{item.image}</div>
              <div style={{ flex:1 }}>
                <div style={{ color:"#e8f5e0", fontWeight:600, fontSize:13, marginBottom:2 }}>{item.name}</div>
                <div style={{ color:"#7fa86b", fontSize:11, marginBottom:2 }}>{catName(item.category)}</div>
                <div style={{ color:"#D4AF37", fontSize:14, fontWeight:700 }}>{fmt(item.price)}</div>
              </div>
            </div>
            {item.description && (
              <p style={{ color:"#4a7a40", fontSize:11, marginBottom:10, lineHeight:1.5 }}>{item.description}</p>
            )}
            <div style={{ display:"flex", gap:4, marginBottom:10, flexWrap:"wrap" }}>
              {["active","stop","hidden"].map((st) => (
                <button key={st} onClick={() => changeSt(id, st)}
                  style={{ padding:"3px 10px", borderRadius:6, fontSize:10, cursor:"pointer", fontFamily:"Inter,sans-serif",
                    background: item.status===st?(st==="active"?"rgba(39,174,96,0.3)":st==="stop"?"rgba(230,126,34,0.3)":"rgba(100,100,100,0.3)"):"rgba(255,255,255,0.04)",
                    border: item.status===st?(st==="active"?"1px solid rgba(39,174,96,0.5)":st==="stop"?"1px solid rgba(230,126,34,0.5)":"1px solid rgba(100,100,100,0.5)"):"1px solid rgba(255,255,255,0.1)",
                    color: item.status===st?(st==="active"?"#2ecc71":st==="stop"?"#e67e22":"#95a5a6"):"#4a7a40" }}>
                  {st==="active"?"✓ Faol":st==="stop"?"⏸ Stop":"👁 Yashirin"}
                </button>
              ))}
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <button style={{ ...BTN.ghost, flex:1, padding:"6px" }} onClick={() => openEdit([id, item])}>✎ Tahrirlash</button>
              <button style={{ ...BTN.danger, padding:"6px 12px" }} onClick={() => setConfirm(id)}>✕</button>
            </div>
          </div>
        ))}
        {list.length === 0 && Object.keys(menu).length > 0 && (
          <div style={{ color:"#3d5c38", textAlign:"center", padding:40, gridColumn:"1/-1" }}>Natija topilmadi</div>
        )}
        {Object.keys(menu).length === 0 && (
          <div style={{ color:"#3d5c38", textAlign:"center", padding:40, gridColumn:"1/-1" }}>Hali ovqat qo'shilmagan</div>
        )}
      </div>

      {modal && (
        <Modal title={modal==="add"?"Ovqat qo'shish":"Ovqat tahrirlash"} onClose={() => setModal(null)} wide>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 20px" }}>
            <div>
              <Field label="Ovqat nomi"  value={form.name}        onChange={f("name")}        placeholder="Steyk Ribeye" required />
              <Field label="Kategoriya"  value={form.category}    onChange={f("category")}
                options={catList.map(([id, c]) => ({ value:id, label:`${c.icon} ${c.name}` }))} required />
              <Field label="Narx (so'm)" value={form.price}       onChange={f("price")}       placeholder="185000" required />
              <Field label="Status"      value={form.status}      onChange={f("status")}
                options={[{value:"active",label:"Faol"},{value:"stop",label:"Vaqtincha to'xtatilgan"},{value:"hidden",label:"Yashirin"}]} />
            </div>
            <div>
              <Field label="Tavsif" value={form.description} onChange={f("description")} type="textarea" placeholder="Ovqat haqida qisqacha..." />
              <div style={{ marginBottom:14 }}>
                <label style={LBL}>EMOJI</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                  {EMOJIS.map((e) => (
                    <button key={e} onClick={() => setForm((p) => ({ ...p, image:e }))}
                      style={{ width:34, height:34, fontSize:17, borderRadius:7, cursor:"pointer", background:form.image===e?"rgba(212,175,55,0.3)":"rgba(255,255,255,0.05)", border:form.image===e?"2px solid #D4AF37":"1px solid rgba(255,255,255,0.1)" }}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div style={{ display:"flex", gap:12 }}>
            <button style={{ ...BTN.gold, flex:1, opacity:saving?0.7:1 }} onClick={save} disabled={saving}>
              {saving ? "Saqlanmoqda..." : modal==="add"?"Qo'shish":"Saqlash"}
            </button>
            <button style={{ ...BTN.ghost, flex:1 }} onClick={() => setModal(null)}>Bekor</button>
          </div>
        </Modal>
      )}
      {confirm && <Confirm msg={`"${menu[confirm]?.name}" ovqatni o'chirmoqchimisiz?`} onYes={() => del(confirm)} onNo={() => setConfirm(null)} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// STATISTICS (tables qo'shildi)
// ════════════════════════════════════════════════════════════════════════════
function Statistics({ orders, waiters, menu, tables }) {
  const oList        = Object.values(orders);
  const todayOrders  = oList.filter((o) => o.date === today());
  const todayRevenue = todayOrders.reduce((s, o) => s + (o.total || 0), 0);
  const totalRevenue = oList.reduce((s, o) => s + (o.total || 0), 0);
  const avgCheck     = oList.length ? Math.round(totalRevenue / oList.length) : 0;

  const DAYS = ["Yak","Dush","Sesh","Chor","Pay","Jum","Shan"];
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr   = d.toISOString().slice(0, 10);
    const dayOrders = oList.filter((o) => o.date === dateStr);
    return {
      day:     DAYS[d.getDay()],
      date:    dateStr,
      revenue: dayOrders.reduce((s, o) => s + (o.total || 0), 0),
      count:   dayOrders.length,
    };
  });
  const maxRev = Math.max(...last7.map((d) => d.revenue), 1);

  const waiterStats = Object.entries(waiters).map(([id, w]) => {
    const wOrds = oList.filter((o) => o.waiterId === id);
    return { ...w, id, wCount: wOrds.length, revenue: wOrds.reduce((s, o) => s + (o.total || 0), 0) };
  }).sort((a, b) => b.revenue - a.revenue);

  const topMenu = Object.entries(menu).map(([id, m]) => {
    const sold = oList.reduce((s, o) => {
      const shots = o.shots || [];
      return s + shots.reduce((ss, sh) => ss + (sh.items || []).filter((it) => it.id === id).reduce((sss, it) => sss + it.qty, 0), 0);
    }, 0);
    return { ...m, id, sold };
  }).sort((a, b) => b.sold - a.sold).slice(0, 5);

  // Stol statistikasi
  const tList = Object.values(tables);
  const tableRevenue = Object.entries(tables).map(([id, t]) => {
    const tOrds = oList.filter((o) => o.tableId === id || o.table === id);
    return { id, zone: t.zone, revenue: tOrds.reduce((s,o)=>s+(o.total||0),0), count: tOrds.length };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 8);

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:14, marginBottom:22 }}>
        <StatCard icon={IC.money} label="Bugungi tushum"   value={fmt(todayRevenue)}   sub={`${todayOrders.length} ta buyurtma`} color="#D4AF37"/>
        <StatCard icon={IC.money} label="Jami tushum"      value={fmt(totalRevenue)}   sub={`${oList.length} ta buyurtma`}       color="#27ae60"/>
        <StatCard icon={IC.order} label="O'rtacha chek"    value={fmt(avgCheck)}       sub="Jami buyurtmalar bo'yicha"            color="#3498db"/>
        <StatCard icon={IC.star}  label="Jami buyurtmalar" value={oList.length + " ta"} sub={`Bugun: ${todayOrders.length} ta`}  color="#f39c12"/>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:16, marginBottom:16 }}>
        {/* Bar chart */}
        <div style={CARD}>
          <div style={CARD_HDR}><span style={CARD_TTL}>Oxirgi 7 kun tushumi</span></div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:110, paddingBottom:4 }}>
            {last7.map((d, i) => (
              <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                <div style={{ color:"#4a7a40", fontSize:9, minHeight:12 }}>
                  {d.revenue > 0 ? (d.revenue >= 1000000 ? (d.revenue/1000000).toFixed(1)+"M" : Math.round(d.revenue/1000)+"K") : ""}
                </div>
                <div style={{ width:"100%", background: d.date===today()?"linear-gradient(to top,#b8931f,#D4AF37)":"linear-gradient(to top,rgba(134,176,84,0.3),rgba(134,176,84,0.6))", borderRadius:"4px 4px 0 0", height:`${Math.max((d.revenue/maxRev)*80,d.revenue>0?4:2)}px`, transition:"height 0.5s" }}/>
                <div style={{ color: d.date===today()?"#D4AF37":"#4a7a40", fontSize:9, fontWeight: d.date===today()?600:400 }}>{d.day}</div>
                <div style={{ color:"#3d5c38", fontSize:8 }}>{d.count > 0 ? d.count+"ta" : ""}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top waiters */}
        <div style={CARD}>
          <div style={CARD_HDR}><span style={CARD_TTL}>Ofitsiantlar reytingi</span></div>
          {waiterStats.length === 0 ? (
            <div style={{ color:"#3d5c38", textAlign:"center", padding:24, fontSize:13 }}>Hali buyurtma yo'q</div>
          ) : waiterStats.slice(0, 5).map((w, i) => (
            <div key={w.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom: i<4?"1px solid rgba(255,255,255,0.05)":"none" }}>
              <div style={{ width:26, height:26, borderRadius:"50%", background: i===0?"linear-gradient(135deg,#b8931f,#D4AF37)":i===1?"rgba(192,192,192,0.2)":i===2?"rgba(205,127,50,0.2)":"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center", color:i===0?"#0a1f0d":"#7fa86b", fontSize:11, fontWeight:700, flexShrink:0 }}>
                {i+1}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color:"#e8f5e0", fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{w.name}</div>
                <div style={{ color:"#4a7a40", fontSize:11 }}>{w.wCount} ta buyurtma</div>
              </div>
              <div style={{ color:"#D4AF37", fontSize:12, fontWeight:600, flexShrink:0 }}>{fmt(w.revenue)}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
        {/* Top menu */}
        <div style={CARD}>
          <div style={CARD_HDR}><span style={CARD_TTL}>Eng ko'p buyurtma qilingan</span></div>
          {topMenu.length === 0 ? (
            <div style={{ color:"#3d5c38", textAlign:"center", padding:24 }}>Ma'lumot yo'q</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {topMenu.map((m, i) => (
                <div key={m.id} style={{ display:"flex", gap:10, alignItems:"center", padding:"8px 0", borderBottom:i<4?"1px solid rgba(255,255,255,0.05)":"none" }}>
                  <div style={{ width:26, height:26, borderRadius:"50%", background:"rgba(212,175,55,0.15)", display:"flex", alignItems:"center", justifyContent:"center", color:"#D4AF37", fontSize:11, fontWeight:700 }}>{i+1}</div>
                  <span style={{ fontSize:20 }}>{m.image}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ color:"#e8f5e0", fontSize:12, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.name}</div>
                    <div style={{ color:"#4a7a40", fontSize:11 }}>{m.sold} ta sotilgan</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top tables */}
        <div style={CARD}>
          <div style={CARD_HDR}><span style={CARD_TTL}>Stollar bo'yicha tushum</span></div>
          {tableRevenue.length === 0 ? (
            <div style={{ color:"#3d5c38", textAlign:"center", padding:24 }}>Ma'lumot yo'q</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {tableRevenue.map((t, i) => (
                <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:i<tableRevenue.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
                  <div style={{ width:26, height:26, borderRadius:6, background:"rgba(134,176,84,0.15)", display:"flex", alignItems:"center", justifyContent:"center", color:"#86B054", fontSize:11, fontWeight:700 }}>{t.id}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ color:"#e8f5e0", fontSize:12 }}>Stol {t.id} · {t.zone} zona</div>
                    <div style={{ color:"#4a7a40", fontSize:11 }}>{t.count} ta buyurtma</div>
                  </div>
                  <div style={{ color:"#D4AF37", fontSize:12, fontWeight:600 }}>{fmt(t.revenue)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SETTINGS (o'zgarmadi)
// ════════════════════════════════════════════════════════════════════════════
function Settings({ toast, isSuperAdmin, currentUser }) {
  const [restaurant, setRestaurant] = useState({ name:"AMAZONIA", slogan:"BY ASMALD", phone:"", address:"", workStart:"10:00", workEnd:"23:00" });
  const [vip,        setVip]        = useState({ price:"220000", serviceFee:"12", description:"2 ta mojito + 2 ta meva assorti" });
  const [pass,       setPass]       = useState({ current:"", next:"", confirm:"" });
  const [saPass,     setSaPass]     = useState({ current:"", next:"", confirm:"" });
  const [loading,    setLoading]    = useState(true);
  const fp = (k) => (v) => setPass((p) => ({ ...p, [k]: v }));
  const fsa = (k) => (v) => setSaPass((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    dbGet("settings").then((data) => {
      if (data?.restaurant) setRestaurant(data.restaurant);
      if (data?.vip)        setVip(data.vip);
      setLoading(false);
    });
  }, []);

  const saveRestaurant = async () => {
    try { await dbUpdate("settings/restaurant", restaurant); toast("Saqlandi ✓", "success"); }
    catch { toast("Xatolik", "error"); }
  };

  const saveVip = async () => {
    try { await dbUpdate("settings/vip", vip); toast("Saqlandi ✓", "success"); }
    catch { toast("Xatolik", "error"); }
  };

  const changeAdminPass = async () => {
    if (!pass.current || !pass.next || !pass.confirm) { toast("Barcha maydonlarni to'ldiring", "error"); return; }
    if (pass.next !== pass.confirm) { toast("Yangi parollar mos emas", "error"); return; }
    if (pass.next.length < 6)       { toast("Kamida 6 belgi", "error"); return; }
    try {
      const current = await dbGet(`admins/${currentUser.id}`);
      if (!current || current.password !== pass.current) { toast("Joriy parol noto'g'ri", "error"); return; }
      await dbUpdate(`admins/${currentUser.id}`, { password: pass.next });
      toast("Parol yangilandi ✓", "success");
      setPass({ current:"", next:"", confirm:"" });
    } catch { toast("Xatolik", "error"); }
  };

  const changeSuperAdminPass = async () => {
    if (!saPass.current || !saPass.next || !saPass.confirm) { toast("Barcha maydonlarni to'ldiring", "error"); return; }
    if (saPass.next !== saPass.confirm) { toast("Yangi parollar mos emas", "error"); return; }
    if (saPass.next.length < 6)         { toast("Kamida 6 belgi", "error"); return; }
    try {
      const current = await dbGet("super_admin");
      if (!current || current.password !== saPass.current) { toast("Joriy parol noto'g'ri", "error"); return; }
      await dbUpdate("super_admin", { password: saPass.next });
      toast("Super Admin paroli yangilandi ✓", "success");
      setSaPass({ current:"", next:"", confirm:"" });
    } catch { toast("Xatolik", "error"); }
  };

  if (loading) return <div style={{ color:"#4a7a40", textAlign:"center", padding:48 }}>Yuklanmoqda...</div>;

  return (
    <div style={{ display:"grid", gap:16 }}>
      {isSuperAdmin && (
        <div style={CARD}>
          <div style={CARD_HDR}><span style={CARD_TTL}>🏪 Restoran ma'lumotlari</span></div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 20px" }}>
            <Field label="Restoran nomi"   value={restaurant.name}      onChange={(v) => setRestaurant((p) => ({ ...p, name:v }))} />
            <Field label="Slogan"          value={restaurant.slogan}    onChange={(v) => setRestaurant((p) => ({ ...p, slogan:v }))} />
            <Field label="Telefon"         value={restaurant.phone}     onChange={(v) => setRestaurant((p) => ({ ...p, phone:v }))}     placeholder="+998712345678" />
            <Field label="Manzil"          value={restaurant.address}   onChange={(v) => setRestaurant((p) => ({ ...p, address:v }))}   placeholder="Toshkent, ..." />
            <Field label="Ish boshlanishi" value={restaurant.workStart} onChange={(v) => setRestaurant((p) => ({ ...p, workStart:v }))} placeholder="10:00" />
            <Field label="Ish tugashi"     value={restaurant.workEnd}   onChange={(v) => setRestaurant((p) => ({ ...p, workEnd:v }))}   placeholder="23:00" />
          </div>
          <button style={BTN.gold} onClick={saveRestaurant}>Saqlash</button>
        </div>
      )}

      {isSuperAdmin && (
        <div style={CARD}>
          <div style={CARD_HDR}><span style={CARD_TTL}>🥂 VIP xizmat sozlamalari</span></div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"0 20px" }}>
            <Field label="VIP narxi (so'm)" value={String(vip.price)}       onChange={(v) => setVip((p) => ({ ...p, price:v }))} />
            <Field label="Servis haqi (%)"  value={String(vip.serviceFee)}  onChange={(v) => setVip((p) => ({ ...p, serviceFee:v }))} />
            <Field label="Tavsif"           value={vip.description}          onChange={(v) => setVip((p) => ({ ...p, description:v }))} />
          </div>
          <button style={BTN.gold} onClick={saveVip}>Saqlash</button>
        </div>
      )}

      {isSuperAdmin && (
        <div style={CARD}>
          <div style={CARD_HDR}><span style={CARD_TTL}>🔐 Super Admin paroli</span></div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"0 20px" }}>
            <Field label="Joriy parol" value={saPass.current} onChange={fsa("current")} type="password" />
            <Field label="Yangi parol" value={saPass.next}    onChange={fsa("next")}    type="password" />
            <Field label="Tasdiqlash"  value={saPass.confirm} onChange={fsa("confirm")} type="password" />
          </div>
          <button style={BTN.gold} onClick={changeSuperAdminPass}>Parolni yangilash</button>
        </div>
      )}

      {!isSuperAdmin && (
        <div style={CARD}>
          <div style={CARD_HDR}><span style={CARD_TTL}>🔑 O'z parolimni o'zgartirish</span></div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"0 20px" }}>
            <Field label="Joriy parol" value={pass.current} onChange={fp("current")} type="password" />
            <Field label="Yangi parol" value={pass.next}    onChange={fp("next")}    type="password" />
            <Field label="Tasdiqlash"  value={pass.confirm} onChange={fp("confirm")} type="password" />
          </div>
          <button style={BTN.gold} onClick={changeAdminPass}>Parolni yangilash</button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SETUP WIZARD
// ════════════════════════════════════════════════════════════════════════════
function SetupWizard({ onDone }) {
  const [form,   setForm]   = useState({ name:"", username:"", password:"", confirm:"" });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const f = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  const create = async () => {
    if (!form.name || !form.username || !form.password) { setError("Barcha maydonlarni to'ldiring"); return; }
    if (form.password !== form.confirm) { setError("Parollar mos emas"); return; }
    if (form.password.length < 6)       { setError("Kamida 6 belgi"); return; }
    setSaving(true);
    try {
      await dbSet("super_admin", {
        name:      form.name,
        username:  form.username,
        password:  form.password,
        createdAt: today(),
        lastLogin: "—",
      });
      onDone();
    } catch (e) {
      setError("Firebase xatoligi: " + e.message);
    }
    setSaving(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#050f06,#0a1f0d)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Inter,sans-serif" }}>
      <div style={{ background:"rgba(10,31,13,0.95)", border:"1px solid rgba(212,175,55,0.3)", borderRadius:20, padding:"44px 40px", width:"100%", maxWidth:440, boxShadow:"0 24px 70px rgba(0,0,0,0.6)" }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <span style={{ fontSize:40, display:"block", marginBottom:10 }}>🌿</span>
          <div style={{ fontFamily:"Cinzel,serif", color:"#D4AF37", fontSize:20, fontWeight:700, letterSpacing:3 }}>AMAZONIA</div>
          <div style={{ color:"#4a7a40", fontSize:11, marginTop:6, letterSpacing:1 }}>BIRINCHI ISHGA TUSHIRISH</div>
        </div>
        <div style={{ background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.3)", borderRadius:8, padding:"12px 16px", marginBottom:24, color:"#D4AF37", fontSize:12, lineHeight:1.6 }}>
          ℹ Super Admin hisob hali yaratilmagan. Quyida birinchi Super Admin yarating.
        </div>
        {error && (
          <div style={{ background:"rgba(192,57,43,0.15)", border:"1px solid rgba(192,57,43,0.4)", borderRadius:8, color:"#e74c3c", fontSize:12, padding:"10px 14px", marginBottom:16 }}>⚠ {error}</div>
        )}
        <Field label="To'liq ism"    value={form.name}     onChange={f("name")}     placeholder="Super Admin" required />
        <Field label="Username"      value={form.username}  onChange={f("username")} placeholder="superadmin"  required />
        <Field label="Parol"         value={form.password}  onChange={f("password")} type="password"           required />
        <Field label="Parolni tasdiqlang" value={form.confirm} onChange={f("confirm")} type="password"         required />
        <button
          style={{ ...BTN.gold, width:"100%", marginTop:8, opacity:saving?0.7:1 }}
          onClick={create} disabled={saving}>
          {saving ? "Yaratilmoqda..." : "Super Admin Yaratish"}
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN SUPERADMIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
const NAV = [
  { id:"dashboard",  label:"Dashboard",      icon:IC.dashboard },
  { id:"tables",     label:"Stollar",         icon:IC.table     },
  { id:"orders",     label:"Buyurtmalar",     icon:IC.monitor   },
  { id:"kitchen",    label:"Oshxona",         icon:IC.kitchen   },
  { id:"admins",     label:"Adminlar",        icon:IC.admin     },
  { id:"waiters",    label:"Ofitsiantlar",    icon:IC.waiter    },
  { id:"categories", label:"Kategoriyalar",   icon:IC.category  },
  { id:"menu",       label:"Menyu",           icon:IC.food      },
  { id:"statistics", label:"Statistika",      icon:IC.stats     },
  { id:"settings",   label:"Sozlamalar",      icon:IC.settings  },
];
const TITLES = {
  dashboard:  "Dashboard",
  tables:     "Stollar boshqaruvi",
  orders:     "Buyurtmalar monitoru",
  kitchen:    "Oshxona paneli",
  admins:     "Adminlar",
  waiters:    "Ofitsiantlar",
  categories: "Kategoriyalar",
  menu:       "Menyu boshqaruvi",
  statistics: "Statistika",
  settings:   "Sozlamalar",
};

export default function SuperAdmin() {
  const navigate = useNavigate();

  const [user] = useState(() => getStoredUser());
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
      navigate("/", { replace: true });
    }
  }, []);

  const [setupDone, setSetupDone] = useState(null);
  useEffect(() => {
    dbGet("super_admin").then((data) => setSetupDone(!!data));
  }, []);

  const [page,     setPage]     = useState("dashboard");
  const [sideOpen, setSideOpen] = useState(true);
  const [toasts,   setToasts]   = useState([]);

  const [admins,     setAdmins]     = useState({});
  const [waiters,    setWaiters]    = useState({});
  const [categories, setCategories] = useState({});
  const [menu,       setMenu]       = useState({});
  const [orders,     setOrders]     = useState({});
  const [tables,     setTables]     = useState({});
  const [dbLoading,  setDbLoading]  = useState(true);

  // Aktiv shotlar soni (oshxona uchun badge)
  const [newShotsCount, setNewShotsCount] = useState(0);

  useEffect(() => {
    const unsubs = [
      dbListen("admins",     (d) => setAdmins(d     || {})),
      dbListen("waiters",    (d) => setWaiters(d    || {})),
      dbListen("categories", (d) => setCategories(d || {})),
      dbListen("menu",       (d) => setMenu(d       || {})),
      dbListen("orders",     (d) => { setOrders(d   || {}); setDbLoading(false); }),
      dbListen("tables",     (d) => {
        const data = d || {};
        setTables(data);
        // Yangi shotlar hisoblanadi
        let count = 0;
        Object.values(data).forEach((t) => {
          (t.shots || []).forEach((sh) => {
            if (sh.status === "new") count++;
          });
        });
        setNewShotsCount(count);
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const toast = useCallback((msg, type = "info") => {
    const id = uid();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);

  const removeToast = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  const handleLogout = () => {
    clearUser();
    navigate("/", { replace: true });
  };

  if (!user) return null;
  if (setupDone === null) {
    return (
      <div style={{ minHeight:"100vh", background:"#0a1f0d", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ color:"#D4AF37", fontFamily:"Cinzel,serif", fontSize:14, letterSpacing:2 }}>
          🌿 Yuklanmoqda...
        </div>
      </div>
    );
  }
  if (!setupDone) {
    return <SetupWizard onDone={() => setSetupDone(true)} />;
  }

  const pages = {
    dashboard:  <Dashboard    admins={admins} waiters={waiters} categories={categories} menu={menu} orders={orders} tables={tables} />,
    tables:     <TableManager tables={tables} waiters={waiters} toast={toast} />,
    orders:     <OrdersMonitor tables={tables} orders={orders} toast={toast} />,
    kitchen:    <KitchenPanel  tables={tables} toast={toast} />,
    admins:     <AdminManager  admins={admins} toast={toast} isSuperAdmin={isSuperAdmin} />,
    waiters:    <WaiterManager waiters={waiters} toast={toast} />,
    categories: <CategoryManager categories={categories} menu={menu} toast={toast} />,
    menu:       <MenuManager  menu={menu} categories={categories} toast={toast} />,
    statistics: <Statistics   orders={orders} waiters={waiters} menu={menu} tables={tables} />,
    settings:   <Settings     toast={toast} isSuperAdmin={isSuperAdmin} currentUser={user} />,
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0a1f0d,#0f2a10,#1a3a1a,#0d2410)", fontFamily:"Inter,sans-serif", display:"flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:rgba(255,255,255,0.02); }
        ::-webkit-scrollbar-thumb { background:rgba(212,175,55,0.3); border-radius:2px; }
        select option { background:#0a1f0d; color:#e8f5e0; }
        input::placeholder, textarea::placeholder { color:#3d6b35; }
        input:focus, textarea:focus, select:focus { outline:none; border-color:rgba(212,175,55,0.5) !important; box-shadow:0 0 0 2px rgba(212,175,55,0.08); }
        @keyframes slideIn { from { transform:translateX(40px); opacity:0; } to { transform:translateX(0); opacity:1; } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        button:disabled { cursor:not-allowed; }
      `}</style>

      {/* ── SIDEBAR ── */}
      <aside style={{ width:sideOpen?242:64, minHeight:"100vh", background:"rgba(3,10,5,0.98)", backdropFilter:"blur(20px)", borderRight:"1px solid rgba(212,175,55,0.1)", transition:"width 0.28s ease", flexShrink:0, display:"flex", flexDirection:"column", position:"sticky", top:0, height:"100vh", overflowY:"auto", overflowX:"hidden" }}>
        {/* Logo */}
        <div style={{ padding:"20px 14px 14px", borderBottom:"1px solid rgba(212,175,55,0.08)", display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:8, background:"linear-gradient(135deg,#1a3a1a,#0f2a10)", border:"1px solid rgba(212,175,55,0.3)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:17 }}>🌿</div>
          {sideOpen && (
            <div>
              <div style={{ fontFamily:"Cinzel,serif", color:"#D4AF37", fontSize:12, fontWeight:700, letterSpacing:2, lineHeight:1 }}>AMAZONIA</div>
              <div style={{ fontFamily:"Cinzel,serif", color:"#86B054", fontSize:7, letterSpacing:2, marginTop:3 }}>
                {isSuperAdmin ? "SUPER ADMIN" : "ADMIN PANEL"}
              </div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ flex:1, padding:"10px 8px" }}>
          {NAV
            .filter((n) => isSuperAdmin || n.id !== "admins")
            .map((n) => {
              const isKitchen = n.id === "kitchen" && newShotsCount > 0;
              const isOrders  = n.id === "orders";
              const activeShotsAll = Object.values(tables).reduce((s,t)=>s+(t.shots||[]).filter(sh=>sh.status==="new"||sh.status==="preparing").length,0);
              return (
                <button key={n.id} onClick={() => setPage(n.id)}
                  style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:sideOpen?"10px 12px":"10px", borderRadius:9, marginBottom:3, cursor:"pointer", border:"none", textAlign:"left", transition:"all 0.15s", justifyContent:sideOpen?"flex-start":"center", background:page===n.id?"rgba(212,175,55,0.14)":"transparent", borderLeft:page===n.id?"2px solid #D4AF37":"2px solid transparent", position:"relative" }}>
                  <span style={{ flexShrink:0 }}>
                    <Icon d={n.icon} color={page===n.id?"#D4AF37":"#4a7a40"} size={17} />
                  </span>
                  {sideOpen && (
                    <span style={{ color:page===n.id?"#D4AF37":"#7fa86b", fontSize:12, fontWeight:page===n.id?600:400, flex:1 }}>{n.label}</span>
                  )}
                  {/* Oshxona badge */}
                  {isKitchen && (
                    <div style={{ width:18, height:18, borderRadius:"50%", background:"#e74c3c", display:"flex", alignItems:"center", justifyContent:"center", animation:"pulse 1.5s infinite", flexShrink:0 }}>
                      <span style={{ color:"#fff", fontSize:10, fontWeight:700 }}>{newShotsCount}</span>
                    </div>
                  )}
                  {/* Orders badge */}
                  {isOrders && activeShotsAll > 0 && (
                    <div style={{ width:18, height:18, borderRadius:"50%", background:"#e67e22", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <span style={{ color:"#fff", fontSize:10, fontWeight:700 }}>{activeShotsAll}</span>
                    </div>
                  )}
                </button>
              );
            })}

          <button onClick={handleLogout}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:sideOpen?"10px 12px":"10px", borderRadius:9, marginTop:10, cursor:"pointer", border:"none", textAlign:"left", justifyContent:sideOpen?"flex-start":"center", background:"rgba(192,57,43,0.1)" }}>
            <span style={{ flexShrink:0 }}><Icon d={IC.logout} color="#e74c3c" size={17} /></span>
            {sideOpen && <span style={{ color:"#e74c3c", fontSize:12 }}>Chiqish</span>}
          </button>
        </nav>

        {/* Collapse button */}
        <div style={{ padding:"10px 8px", borderTop:"1px solid rgba(212,175,55,0.07)" }}>
          <button onClick={() => setSideOpen((v) => !v)}
            style={{ width:"100%", padding:"9px", borderRadius:9, cursor:"pointer", border:"1px solid rgba(134,176,84,0.12)", background:"rgba(255,255,255,0.02)", color:"#4a7a40", display:"flex", alignItems:"center", justifyContent:"center", gap:6, fontSize:12 }}>
            {sideOpen ? "◀ Yig'ish" : "▶"}
          </button>
        </div>

        {/* User info */}
        {sideOpen && (
          <div style={{ padding:"10px 12px 18px", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:isSuperAdmin?"linear-gradient(135deg,#D4AF37,#b8931f)":"linear-gradient(135deg,#86B054,#4a7a40)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>
              {isSuperAdmin ? "👑" : "🛡️"}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ color:"#e8f5e0", fontSize:12, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.name}</div>
              <div style={{ color:"#4a7a40", fontSize:10 }}>@{user.username}</div>
            </div>
          </div>
        )}
      </aside>

      {/* ── MAIN ── */}
      <main style={{ flex:1, display:"flex", flexDirection:"column", minHeight:"100vh", minWidth:0 }}>
        {/* Header */}
        <header style={{ background:"rgba(3,10,5,0.88)", backdropFilter:"blur(12px)", borderBottom:"1px solid rgba(212,175,55,0.08)", padding:"12px 22px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
          <div>
            <h1 style={{ fontFamily:"Cinzel,serif", color:"#D4AF37", fontSize:15, fontWeight:700, letterSpacing:1, margin:0 }}>{TITLES[page]}</h1>
            <div style={{ color:"#4a7a40", fontSize:10, marginTop:2 }}>
              Amazonia · {isSuperAdmin ? "Super Admin" : "Admin"} Panel
            </div>
          </div>
          <div style={{ display:"flex", gap:12, alignItems:"center" }}>
            {dbLoading && <span style={{ color:"#4a7a40", fontSize:11, animation:"fadeIn 0.3s ease" }}>Yuklanmoqda...</span>}
            {/* Yangi shotlar alert */}
            {newShotsCount > 0 && (
              <button onClick={()=>setPage("kitchen")} style={{ background:"rgba(231,76,60,0.15)", border:"1px solid rgba(231,76,60,0.4)", borderRadius:20, padding:"4px 12px", display:"flex", alignItems:"center", gap:5, cursor:"pointer" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:"#e74c3c", animation:"pulse 1s infinite" }} />
                <span style={{ color:"#e74c3c", fontSize:11 }}>{newShotsCount} yangi buyurtma</span>
              </button>
            )}
            <div style={{ background:"rgba(39,174,96,0.12)", border:"1px solid rgba(39,174,96,0.28)", borderRadius:20, padding:"3px 12px", display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:5, height:5, borderRadius:"50%", background:"#2ecc71" }} />
              <span style={{ color:"#2ecc71", fontSize:10 }}>Real-time · Firebase</span>
            </div>
            <LiveClock />
          </div>
        </header>

        {/* Page content */}
        <div key={page} style={{ flex:1, padding:"22px", overflowY:"auto", animation:"fadeIn 0.25s ease" }}>
          {pages[page]}
        </div>
      </main>

      <Toast toasts={toasts} remove={removeToast} />
    </div>
  );
}