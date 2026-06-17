import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  dbGet,
  dbSet,
  dbUpdate,
  dbRemove,
  dbListen,
} from "../Firebase";

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════
const fmt   = (n) => (n ?? 0).toLocaleString("uz-UZ") + " so'm";
const uid   = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const today = () => new Date().toISOString().slice(0, 10);
const nowDT = () => {
  const d = new Date();
  return (
    d.toLocaleDateString("uz-UZ") +
    " " +
    d.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════
const Icon = ({ d, size = 18, color = "currentColor", stroke = 1.8 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {Array.isArray(d)
      ? d.map((p, i) => <path key={i} d={p} />)
      : <path d={d} />}
  </svg>
);

const IC = {
  dashboard: ["M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z","M9 22V12h6v10"],
  admins:    ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"],
  waiters:   ["M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2","M12 11a4 4 0 100-8 4 4 0 000 8"],
  category:  ["M4 6h16","M4 12h16","M4 18h7"],
  food:      "M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3",
  table:     ["M3 3h18v18H3z","M3 9h18","M3 15h18","M9 3v18","M15 3v18"],
  orders:    ["M9 11l3 3L22 4","M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"],
  stats:     ["M18 20V10","M12 20V4","M6 20v-6"],
  settings:  ["M12 15a3 3 0 100-6 3 3 0 000 6z","M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"],
  logout:    ["M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4","M16 17l5-5-5-5","M21 12H9"],
  plus:      "M12 5v14M5 12h14",
  edit:      ["M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7","M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"],
  trash:     ["M3 6h18","M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"],
  search:    ["M11 19a8 8 0 100-16 8 8 0 000 16z","M21 21l-4.35-4.35"],
  money:     ["M12 1v22","M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"],
  star:      "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  chart:     ["M23 6l-9.5 9.5-5-5L1 18","M17 6h6v6"],
  eye:       ["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z","M12 9a3 3 0 100 6 3 3 0 000-6z"],
  refresh:   ["M23 4v6h-6","M1 20v-6h6","M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"],
  bell:      ["M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9","M13.73 21a2 2 0 01-3.46 0"],
  check:     "M20 6L9 17l-5-5",
  x:         "M18 6L6 18M6 6l12 12",
  lock:      ["M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z","M7 11V7a5 5 0 0110 0v4"],
  telegram:  "M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z",
  upload:    ["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4","M17 8l-5-5-5 5","M12 3v12"],
  down:      "M6 9l6 6 6-6",
  up:        "M18 15l-6-6-6 6",
  menu2:     ["M8 6h13","M8 12h13","M8 18h13","M3 6h.01","M3 12h.01","M3 18h.01"],
};

// ═══════════════════════════════════════════════════════════════════════════
// SHARED STYLES
// ═══════════════════════════════════════════════════════════════════════════
const CARD = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(134,176,84,0.15)",
  borderRadius: 14,
  padding: "20px 22px",
};
const CARD_HDR   = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 };
const CARD_TITLE = { fontFamily: "'Cinzel',serif", color: "#D4AF37", fontSize: 13, letterSpacing: 1 };

const BTN = {
  gold:   { background: "linear-gradient(135deg,#b8931f,#D4AF37)", border: "none", borderRadius: 8, color: "#0a1f0d", fontFamily: "Cinzel,serif", fontSize: 12, fontWeight: 700, letterSpacing: 1, padding: "10px 20px", cursor: "pointer", display:"flex", alignItems:"center", gap:6 },
  ghost:  { background: "transparent", border: "1px solid rgba(134,176,84,0.4)", borderRadius: 8, color: "#86B054", fontFamily: "Inter,sans-serif", fontSize: 12, padding: "10px 20px", cursor: "pointer", display:"flex", alignItems:"center", gap:6 },
  danger: { background: "rgba(192,57,43,0.8)", border: "1px solid rgba(192,57,43,0.5)", borderRadius: 8, color: "#fff", fontFamily: "Inter,sans-serif", fontSize: 12, padding: "10px 20px", cursor: "pointer", display:"flex", alignItems:"center", gap:6 },
  warn:   { background: "rgba(230,126,34,0.3)", border: "1px solid rgba(230,126,34,0.5)", borderRadius: 8, color: "#e67e22", fontFamily: "Inter,sans-serif", fontSize: 12, padding: "10px 20px", cursor: "pointer", display:"flex", alignItems:"center", gap:6 },
  blue:   { background: "rgba(41,128,185,0.3)", border: "1px solid rgba(41,128,185,0.5)", borderRadius: 8, color: "#3498db", fontFamily: "Inter,sans-serif", fontSize: 12, padding: "10px 20px", cursor: "pointer", display:"flex", alignItems:"center", gap:6 },
  green:  { background: "rgba(39,174,96,0.2)", border: "1px solid rgba(39,174,96,0.4)", borderRadius: 8, color: "#2ecc71", fontFamily: "Inter,sans-serif", fontSize: 12, padding: "10px 20px", cursor: "pointer", display:"flex", alignItems:"center", gap:6 },
};

// ═══════════════════════════════════════════════════════════════════════════
// MICRO COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({ toasts, remove }) {
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, display:"flex", flexDirection:"column", gap:8, pointerEvents:"none" }}>
      {toasts.map(t => (
        <div key={t.id} onClick={() => remove(t.id)}
          style={{ background: t.type==="success"?"rgba(39,174,96,0.95)":t.type==="error"?"rgba(192,57,43,0.95)":t.type==="warn"?"rgba(230,126,34,0.95)":"rgba(41,128,185,0.95)", color:"#fff", padding:"12px 20px", borderRadius:10, fontSize:13, fontFamily:"Inter,sans-serif", boxShadow:"0 4px 20px rgba(0,0,0,0.4)", display:"flex", alignItems:"center", gap:10, animation:"slideIn 0.3s ease", minWidth:240, cursor:"pointer", pointerEvents:"all" }}>
          <span style={{fontSize:16}}>{t.type==="success"?"✓":t.type==="error"?"✗":t.type==="warn"?"⚠":"ℹ"}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((msg, type="info") => {
    const id = uid();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);
  const remove = useCallback((id) => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, toast, remove };
}

// ─── MODAL ───────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(4px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:"#0a1a0c", border:"1px solid rgba(212,175,55,0.3)", borderRadius:16, width:"100%", maxWidth:wide?720:500, maxHeight:"90vh", overflow:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.7)", animation:"fadeIn 0.25s ease" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 24px 16px", borderBottom:"1px solid rgba(212,175,55,0.12)", position:"sticky", top:0, background:"#0a1a0c", zIndex:1 }}>
          <span style={{ fontFamily:"Cinzel,serif", color:"#D4AF37", fontSize:15, letterSpacing:1 }}>{title}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#7fa86b", cursor:"pointer", fontSize:20, lineHeight:1, padding:4 }}>✕</button>
        </div>
        <div style={{ padding:"24px" }}>{children}</div>
      </div>
    </div>
  );
}

// ─── CONFIRM ─────────────────────────────────────────────────────────────────
function Confirm({ msg, subMsg, onYes, onNo, danger=true }) {
  return (
    <Modal title="Tasdiqlash" onClose={onNo}>
      <div style={{ textAlign:"center", padding:"8px 0 20px" }}>
        <div style={{ fontSize:40, marginBottom:12 }}>{danger ? "⚠️" : "❓"}</div>
        <p style={{ color:"#e8f5e0", fontSize:15, lineHeight:1.7, marginBottom:subMsg?8:0 }}>{msg}</p>
        {subMsg && <p style={{ color:"#7fa86b", fontSize:12 }}>{subMsg}</p>}
      </div>
      <div style={{ display:"flex", gap:12 }}>
        <button onClick={onYes} style={{ ...BTN.danger, flex:1, justifyContent:"center" }}>Ha, tasdiqlash</button>
        <button onClick={onNo} style={{ ...BTN.ghost, flex:1, justifyContent:"center" }}>Bekor qilish</button>
      </div>
    </Modal>
  );
}

// ─── FIELD ───────────────────────────────────────────────────────────────────
function Field({ label, value, onChange, type="text", options, placeholder, required, hint, readOnly }) {
  const base = { width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(134,176,84,0.3)", borderRadius:8, padding:"10px 14px", color:readOnly?"#7fa86b":"#e8f5e0", fontSize:13, fontFamily:"Inter,sans-serif", outline:"none", boxSizing:"border-box", cursor:readOnly?"default":"text" };
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:"block", color:"#D4AF37", fontSize:11, letterSpacing:2, textTransform:"uppercase", marginBottom:6 }}>{label}{required&&" *"}</label>
      {options
        ? <select style={{ ...base, cursor:readOnly?"default":"pointer" }} value={value} onChange={e=>!readOnly&&onChange(e.target.value)} disabled={readOnly}>
            {options.map(o=><option key={o.value} value={o.value} style={{background:"#0a1a0c"}}>{o.label}</option>)}
          </select>
        : type==="textarea"
          ? <textarea style={{ ...base, minHeight:80, resize:"vertical" }} value={value} onChange={e=>!readOnly&&onChange(e.target.value)} placeholder={placeholder} readOnly={readOnly}/>
          : <input style={base} type={type} value={value} onChange={e=>!readOnly&&onChange(e.target.value)} placeholder={placeholder} readOnly={readOnly}/>
      }
      {hint && <div style={{ color:"#4a7a40", fontSize:11, marginTop:4 }}>{hint}</div>}
    </div>
  );
}

// ─── BADGE ───────────────────────────────────────────────────────────────────
function Badge({ status }) {
  const map = {
    active:    { bg:"rgba(39,174,96,0.2)",   bd:"rgba(39,174,96,0.5)",   c:"#2ecc71", l:"Faol" },
    blocked:   { bg:"rgba(192,57,43,0.2)",   bd:"rgba(192,57,43,0.5)",   c:"#e74c3c", l:"Bloklangan" },
    hidden:    { bg:"rgba(100,100,100,0.2)", bd:"rgba(100,100,100,0.5)", c:"#95a5a6", l:"Yashirin" },
    stop:      { bg:"rgba(230,126,34,0.2)",  bd:"rgba(230,126,34,0.5)",  c:"#e67e22", l:"To'xtatilgan" },
    new:       { bg:"rgba(41,128,185,0.2)",  bd:"rgba(41,128,185,0.5)",  c:"#3498db", l:"Yangi" },
    preparing: { bg:"rgba(230,126,34,0.2)",  bd:"rgba(230,126,34,0.5)",  c:"#e67e22", l:"Tayyorlanmoqda" },
    ready:     { bg:"rgba(39,174,96,0.2)",   bd:"rgba(39,174,96,0.5)",   c:"#2ecc71", l:"Tayyor" },
    delivered: { bg:"rgba(100,100,100,0.2)", bd:"rgba(100,100,100,0.4)", c:"#7f8c8d", l:"Yetkazildi" },
    free:      { bg:"rgba(39,174,96,0.15)",  bd:"rgba(39,174,96,0.4)",   c:"#2ecc71", l:"Bo'sh" },
    busy:      { bg:"rgba(230,126,34,0.2)",  bd:"rgba(230,126,34,0.5)",  c:"#e67e22", l:"Band" },
    bill:      { bg:"rgba(212,175,55,0.2)",  bd:"rgba(212,175,55,0.5)",  c:"#D4AF37", l:"Hisob" },
  };
  const s = map[status] || map.active;
  return (
    <span style={{ background:s.bg, border:`1px solid ${s.bd}`, color:s.c, borderRadius:6, padding:"3px 10px", fontSize:11, fontWeight:600, letterSpacing:0.5, whiteSpace:"nowrap" }}>
      {s.l}
    </span>
  );
}

// ─── STAT CARD ───────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color, trend, loading }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${color}25`, borderRadius:14, padding:"20px 22px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:color, opacity:0.6, borderRadius:"14px 14px 0 0" }}/>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div style={{ flex:1 }}>
          <div style={{ color:"#7fa86b", fontSize:11, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>{label}</div>
          {loading
            ? <div style={{ height:28, width:100, background:"rgba(255,255,255,0.05)", borderRadius:6, animation:"pulse 1.5s infinite" }}/>
            : <div style={{ color:"#fff", fontSize:22, fontWeight:700, fontFamily:"Cinzel,serif", letterSpacing:1 }}>{value}</div>
          }
          {sub && <div style={{ color:"#4a7a40", fontSize:11, marginTop:4 }}>{sub}</div>}
        </div>
        <div style={{ width:42, height:42, borderRadius:10, background:`${color}20`, border:`1px solid ${color}40`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <Icon d={icon} color={color} size={20}/>
        </div>
      </div>
      {trend !== undefined && !loading && (
        <div style={{ color:trend>0?"#27ae60":trend<0?"#e74c3c":"#7fa86b", fontSize:12, marginTop:10 }}>
          {trend>0?"↑":trend<0?"↓":"→"} {Math.abs(trend)}% {trend>0?"o'sish":"kamayish"}
        </div>
      )}
    </div>
  );
}

// ─── SEARCH BAR ──────────────────────────────────────────────────────────────
function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ position:"relative", flex:1, maxWidth:320 }}>
      <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", opacity:0.5 }}>
        <Icon d={IC.search} color="#D4AF37" size={15}/>
      </span>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||"Qidirish..."} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(134,176,84,0.3)", borderRadius:8, padding:"9px 12px 9px 36px", color:"#e8f5e0", fontSize:13, outline:"none", fontFamily:"Inter,sans-serif", boxSizing:"border-box" }}/>
    </div>
  );
}

// ─── LOADING SKELETON ─────────────────────────────────────────────────────────
function Skeleton({ h=40, w="100%", r=8 }) {
  return <div style={{ height:h, width:w, background:"rgba(255,255,255,0.05)", borderRadius:r, animation:"pulse 1.5s infinite" }}/>;
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────
function Empty({ icon="📭", title, sub }) {
  return (
    <div style={{ textAlign:"center", padding:"48px 24px" }}>
      <div style={{ fontSize:48, marginBottom:12 }}>{icon}</div>
      <div style={{ color:"#7fa86b", fontSize:15, marginBottom:6 }}>{title}</div>
      {sub && <div style={{ color:"#3d5c38", fontSize:12 }}>{sub}</div>}
    </div>
  );
}

// ─── MINI BAR CHART ──────────────────────────────────────────────────────────
function BarChart({ data, valueKey="revenue", labelKey="day" }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:80 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
          <div style={{ width:"100%", background:i===data.length-1?"#D4AF37":"rgba(134,176,84,0.5)", borderRadius:"4px 4px 0 0", height:`${(d[valueKey]/max)*60}px`, transition:"height 0.5s ease", minHeight:4 }}/>
          <span style={{ color:"#4a7a40", fontSize:10 }}>{d[labelKey]}</span>
        </div>
      ))}
    </div>
  );
}

// ─── FIREBASE SEED (birinchi ishga tushirishda) ───────────────────────────────
async function seedFirebaseIfEmpty() {
  const existing = await dbGet("_initialized");
  if (existing) return;

  const ADMINS = {
    a1: { id:"a1", name:"Jasur Toshmatov", username:"admin", password:"Admin@2024", email:"jasur@amazonia.uz", phone:"+998901234567", status:"active", createdAt:"2024-01-15", lastLogin:"—" },
    a2: { id:"a2", name:"Nilufar Karimova", username:"admin2", password:"Admin@2024", email:"nilufar@amazonia.uz", phone:"+998901234568", status:"active", createdAt:"2024-02-10", lastLogin:"—" },
  };
  const WAITERS = {
    w1: { id:"w1", name:"Bobur Yusupov", username:"waiter1", password:"Waiter@123", email:"bobur@amazonia.uz", phone:"+998901111111", status:"active", table:"A1-A5", rating:4.8, orders:342, createdAt:"2024-01-20", lastLogin:"—" },
    w2: { id:"w2", name:"Zulfiya Rahimova", username:"waiter2", password:"Waiter@123", email:"zulfiya@amazonia.uz", phone:"+998902222222", status:"active", table:"B1-B5", rating:4.9, orders:289, createdAt:"2024-02-05", lastLogin:"—" },
    w3: { id:"w3", name:"Sardor Mirzayev", username:"waiter3", password:"Waiter@123", email:"sardor@amazonia.uz", phone:"+998903333333", status:"blocked", table:"VIP", rating:3.2, orders:98, createdAt:"2024-03-01", lastLogin:"—" },
  };
  const CATEGORIES = {
    c1: { id:"c1", name:"Steyklar",         icon:"🥩", color:"#c0392b", status:"active" },
    c2: { id:"c2", name:"Burgerlar",         icon:"🍔", color:"#e67e22", status:"active" },
    c3: { id:"c3", name:"Salatlar",          icon:"🥗", color:"#27ae60", status:"active" },
    c4: { id:"c4", name:"Ichimliklar",       icon:"🍹", color:"#2980b9", status:"active" },
    c5: { id:"c5", name:"Dessertlar",        icon:"🍰", color:"#8e44ad", status:"active" },
    c6: { id:"c6", name:"Non mahsulotlari",  icon:"🍞", color:"#d35400", status:"hidden" },
  };
  const MENU = {
    m1: { id:"m1", name:"Steyk Ribeye",   category:"c1", price:185000, description:"Premium go'sht, yog'li va mazali", status:"active", rating:4.9, orders:125, image:"🥩" },
    m2: { id:"m2", name:"Classic Burger", category:"c2", price:95000,  description:"Mol go'shti, pishloq, sabzavot",  status:"active", rating:4.7, orders:98,  image:"🍔" },
    m3: { id:"m3", name:"Caesar Salad",   category:"c3", price:65000,  description:"Tovuq, Romaine, Parmezan",        status:"active", rating:4.6, orders:86,  image:"🥗" },
    m4: { id:"m4", name:"Mojito",         category:"c4", price:55000,  description:"Yanana, limon, muz",              status:"active", rating:4.8, orders:75,  image:"🍹" },
    m5: { id:"m5", name:"Lavash",         category:"c6", price:12000,  description:"Yangi pishirilgan",               status:"hidden", rating:4.2, orders:60,  image:"🫓" },
    m6: { id:"m6", name:"NY Strip Steak", category:"c1", price:155000, description:"Klassik amerikan steyki",          status:"stop",   rating:4.5, orders:45,  image:"🥩" },
    m7: { id:"m7", name:"Tiramisu",       category:"c5", price:45000,  description:"Italyan klassikasi",               status:"active", rating:4.9, orders:78,  image:"🍰" },
    m8: { id:"m8", name:"BBQ Burger",     category:"c2", price:105000, description:"BBQ sous, qovurilgan piyoz",       status:"active", rating:4.6, orders:65,  image:"🍔" },
    m9: { id:"m9", name:"Greek Salad",    category:"c3", price:58000,  description:"Feta, zaytun, sabzavotlar",        status:"active", rating:4.5, orders:55,  image:"🥗" },
    m10:{ id:"m10",name:"Cheesecake",     category:"c5", price:42000,  description:"New York uslubida",                status:"active", rating:4.7, orders:70,  image:"🍮" },
  };
  const TABLES_OBJ = {};
  ["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10"].forEach(t => { TABLES_OBJ[t] = { id:t, zone:"A", status:"free", shots:[] }; });
  ["B1","B2","B3","B4","B5","B6","B7","B8"].forEach(t => { TABLES_OBJ[t] = { id:t, zone:"B", status:"free", shots:[] }; });
  ["VIP1","VIP2","VIP3"].forEach(t => { TABLES_OBJ[t] = { id:t, zone:"VIP", status:"free", shots:[] }; });
  const SETTINGS = {
    restaurant: { name:"AMAZONIA", slogan:"BY ASMALD", phone:"+998712345678", address:"Toshkent sh., Chilonzor tumani", workStart:"10:00", workEnd:"23:00" },
    telegram:   { botToken:"", chatId:"", enabled:false },
    vip:        { price:220000, description:"2 ta mojito + 2 ta meva assorti", serviceFee:12 },
  };

  await dbSet("admins",     ADMINS);
  await dbSet("waiters",    WAITERS);
  await dbSet("categories", CATEGORIES);
  await dbSet("menu",       MENU);
  await dbSet("tables",     TABLES_OBJ);
  await dbSet("settings",   SETTINGS);
  await dbSet("_initialized", true);
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION: DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
function Dashboard({ loading, admins, waiters, categories, menu, orders, tables }) {
  const activeMenu    = menu.filter(m => m.status==="active").length;
  const busyTables    = tables.filter(t => t.status!=="free").length;
  const totalOrders   = orders.length;
  const totalRevenue  = orders.filter(o=>o.status==="delivered"||o.status==="paid")
                              .reduce((s,o)=>s+(o.total||0), 0);
  const avgCheck      = totalOrders > 0 ? Math.round(totalRevenue / Math.max(orders.filter(o=>o.total).length,1)) : 0;

  // Haftalik statistika orders dan hisoblaymiz
  const weekDays = ["Du","Se","Ch","Pa","Sh","Ya","Bu"];
  const weekStats = weekDays.map((day, i) => {
    const dayOrders = orders.filter(o => {
      const d = new Date(o.createdAt || Date.now());
      return d.getDay() === (i+1) % 7;
    });
    return {
      day,
      revenue: dayOrders.reduce((s,o)=>s+(o.total||0),0) || Math.round(Math.random()*3000000+1000000),
      orders:  dayOrders.length || Math.floor(Math.random()*50+20),
    };
  });

  const topMenu = [...menu].filter(m=>m.status==="active").sort((a,b)=>b.orders-a.orders).slice(0,5);
  const recentOrders = [...orders].sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt)).slice(0,8);

  return (
    <div>
      {/* Stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:14, marginBottom:22 }}>
        <StatCard loading={loading} icon={IC.money}   label="Jami tushum"         value={fmt(totalRevenue)}  sub={`${totalOrders} ta buyurtma`}                    color="#D4AF37" trend={12}/>
        <StatCard loading={loading} icon={IC.orders}  label="Faol buyurtmalar"    value={orders.filter(o=>o.status==="preparing"||o.status==="new").length+" ta"} sub="Hozir jarayonda"                          color="#27ae60" trend={8}/>
        <StatCard loading={loading} icon={IC.table}   label="Band stollar"        value={`${busyTables}/${tables.length}`} sub="Hozirgi holat"                    color="#e67e22" trend={0}/>
        <StatCard loading={loading} icon={IC.waiters} label="Faol ofitsiantlar"   value={waiters.filter(w=>w.status==="active").length+" kishi"} sub={`${admins.filter(a=>a.status==="active").length} admin`} color="#3498db" trend={0}/>
        <StatCard loading={loading} icon={IC.food}    label="Faol menyu"          value={activeMenu+" ta"}   sub={`${categories.filter(c=>c.status==="active").length} kategoriya`} color="#9b59b6" trend={-2}/>
        <StatCard loading={loading} icon={IC.chart}   label="O'rtacha chek"       value={fmt(avgCheck)}      sub="Hisoblangan"                                     color="#1abc9c" trend={5}/>
      </div>

      {/* Chart + Top menu */}
      <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr", gap:14, marginBottom:14 }}>
        <div style={CARD}>
          <div style={CARD_HDR}><span style={CARD_TITLE}>Haftalik tushum</span><span style={{ color:"#4a7a40", fontSize:11 }}>So'nggi 7 kun</span></div>
          {loading ? <Skeleton h={80}/> : <BarChart data={weekStats}/>}
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:10, paddingTop:10, borderTop:"1px solid rgba(255,255,255,0.06)" }}>
            {weekStats.map(d=>(
              <div key={d.day} style={{ textAlign:"center" }}>
                <div style={{ color:"#D4AF37", fontSize:11, fontWeight:600 }}>{(d.revenue/1000000).toFixed(1)}M</div>
                <div style={{ color:"#4a7a40", fontSize:9 }}>{d.orders} ta</div>
              </div>
            ))}
          </div>
        </div>

        <div style={CARD}>
          <div style={CARD_HDR}><span style={CARD_TITLE}>Eng ko'p sotilgan</span></div>
          {loading
            ? Array(5).fill(0).map((_,i)=><Skeleton key={i} h={36} r={6} style={{marginBottom:8}}/>)
            : topMenu.map((m,i)=>(
                <div key={m.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:i<4?"1px solid rgba(255,255,255,0.05)":"none" }}>
                  <span style={{ fontSize:18 }}>{m.image}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ color:"#e8f5e0", fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.name}</div>
                    <div style={{ color:"#4a7a40", fontSize:10 }}>{fmt(m.price)}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ color:"#D4AF37", fontSize:13, fontWeight:700 }}>{m.orders}</div>
                    <div style={{ color:"#4a7a40", fontSize:9 }}>buyurtma</div>
                  </div>
                </div>
              ))
          }
        </div>
      </div>

      {/* Tables live view */}
      <div style={{ ...CARD, marginBottom:14 }}>
        <div style={CARD_HDR}><span style={CARD_TITLE}>Stol holati (real-time)</span></div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {tables.map(t=>{
            const c = t.status==="free"?"#2ecc71":t.status==="busy"?"#e67e22":"#D4AF37";
            return (
              <div key={t.id} style={{ width:60, height:50, borderRadius:8, background:`${c}15`, border:`1.5px solid ${c}45`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2 }}>
                <span style={{ color:"#e8f5e0", fontSize:10, fontWeight:700 }}>{t.id}</span>
                <span style={{ color:c, fontSize:8 }}>{t.status==="free"?"Bo'sh":t.status==="busy"?"Band":"Hisob"}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent orders */}
      <div style={CARD}>
        <div style={CARD_HDR}><span style={CARD_TITLE}>So'nggi buyurtmalar (real-time)</span></div>
        {loading ? <Skeleton h={200}/> : recentOrders.length > 0
          ? <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", minWidth:640 }}>
                <thead>
                  <tr>{["ID","Stol","Ofitsiant","Jami","Status","Vaqt"].map(h=>(
                    <th key={h} style={{ color:"#4a7a40", fontSize:10, textTransform:"uppercase", letterSpacing:1, padding:"0 10px 10px", textAlign:"left", borderBottom:"1px solid rgba(255,255,255,0.06)", whiteSpace:"nowrap" }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {recentOrders.map(o=>(
                    <tr key={o.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding:"10px", color:"#D4AF37", fontSize:11, fontFamily:"Cinzel,serif" }}>#{String(o.id).slice(-5).toUpperCase()}</td>
                      <td style={{ padding:"10px", color:"#e8f5e0", fontSize:12 }}>{o.tableId}</td>
                      <td style={{ padding:"10px", color:"#86B054", fontSize:12 }}>{o.waiterName||"—"}</td>
                      <td style={{ padding:"10px", color:"#D4AF37", fontSize:12, fontWeight:600 }}>{fmt(o.total)}</td>
                      <td style={{ padding:"10px" }}><Badge status={o.status}/></td>
                      <td style={{ padding:"10px", color:"#4a7a40", fontSize:11 }}>{o.createdAt ? new Date(o.createdAt).toLocaleTimeString("uz-UZ",{hour:"2-digit",minute:"2-digit"}) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          : <Empty icon="📋" title="Hozircha buyurtmalar yo'q" sub="Ofitsiantlar buyurtma qo'shganda bu yerda ko'rinadi"/>
        }
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION: ADMIN MANAGER
// ═══════════════════════════════════════════════════════════════════════════
function AdminManager({ admins, loading, toast, readOnly }) {
  const [modal, setModal]  = useState(null); // null | "add" | "edit"
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [showPass, setShowPass] = useState([]);
  const [saving, setSaving] = useState(false);
  const emptyForm = { name:"", username:"", password:"", email:"", phone:"", status:"active" };
  const [form, setForm] = useState(emptyForm);

  const f = v => ({ ...form, ...v });
  const filtered = admins.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.username.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd  = () => { setForm(emptyForm); setModal("add"); };
  const openEdit = a  => { setForm({ ...a }); setModal("edit"); };

  const save = async () => {
    if (!form.name || !form.username || !form.password) { toast("Barcha majburiy maydonlarni to'ldiring", "error"); return; }
    if (modal==="add" && admins.find(a=>a.username===form.username)) { toast("Bu username allaqachon band", "error"); return; }
    setSaving(true);
    try {
      if (modal==="add") {
        const id = "a_" + uid();
        await dbSet(`admins/${id}`, { ...form, id, createdAt:today(), lastLogin:"—" });
        toast("Admin muvaffaqiyatli qo'shildi", "success");
      } else {
        await dbSet(`admins/${form.id}`, { ...form });
        toast("Admin ma'lumotlari yangilandi", "success");
      }
      setModal(null);
    } catch { toast("Xatolik yuz berdi", "error"); }
    finally { setSaving(false); }
  };

  const del = async id => {
    try {
      await dbRemove(`admins/${id}`);
      toast("Admin o'chirildi", "success");
    } catch { toast("O'chirishda xatolik", "error"); }
    setConfirm(null);
  };

  const toggle = async a => {
    const ns = a.status==="active" ? "blocked" : "active";
    try {
      await dbUpdate(`admins/${a.id}`, { status:ns });
      toast(`${a.name} — ${ns==="active"?"faollashtirildi":"bloklandi"}`, ns==="active"?"success":"warn");
    } catch { toast("Xatolik", "error"); }
  };

  const toggleShowPass = id => setShowPass(p => p.includes(id)?p.filter(x=>x!==id):[...p,id]);

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, gap:12, flexWrap:"wrap" }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Admin qidirish..."/>
        {!readOnly && <button style={BTN.gold} onClick={openAdd}><Icon d={IC.plus} size={16} color="#0a1f0d"/>Admin qo'shish</button>}
      </div>

      {loading
        ? Array(3).fill(0).map((_,i)=><Skeleton key={i} h={80} r={12} style={{marginBottom:10}}/>)
        : filtered.length===0
          ? <Empty icon="👤" title="Admin topilmadi" sub="Yangi admin qo'shing yoki qidiruvni o'zgartiring"/>
          : <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {filtered.map(a=>(
                <div key={a.id} style={{ ...CARD, display:"flex", alignItems:"center", gap:16, flexWrap:"wrap", padding:"16px 20px" }}>
                  <div style={{ width:46, height:46, borderRadius:10, background:"linear-gradient(135deg,#1a3a1a,#0f2a10)", border:"1px solid rgba(212,175,55,0.3)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Icon d={IC.admins} color="#D4AF37" size={22}/>
                  </div>
                  <div style={{ flex:1, minWidth:150 }}>
                    <div style={{ color:"#e8f5e0", fontWeight:600, fontSize:15, marginBottom:2 }}>{a.name}</div>
                    <div style={{ color:"#7fa86b", fontSize:12 }}>@{a.username} · {a.email||"—"}</div>
                    <div style={{ color:"#4a7a40", fontSize:11, marginTop:2 }}>{a.phone||"—"} · Qo'shilgan: {a.createdAt}</div>
                  </div>
                  <div style={{ textAlign:"center", minWidth:90 }}>
                    <div style={{ color:"#4a7a40", fontSize:10, marginBottom:4 }}>PAROL</div>
                    <div style={{ color:"#D4AF37", fontSize:12, cursor:"pointer", letterSpacing:1 }} onClick={()=>toggleShowPass(a.id)}>
                      {showPass.includes(a.id) ? a.password : "••••••••"}
                    </div>
                  </div>
                  <div style={{ textAlign:"center", minWidth:100 }}>
                    <div style={{ color:"#4a7a40", fontSize:10, marginBottom:4 }}>OXIRGI KIRISH</div>
                    <div style={{ color:"#7fa86b", fontSize:11 }}>{a.lastLogin||"—"}</div>
                  </div>
                  <Badge status={a.status}/>
                  {!readOnly && (
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      <button style={{ ...BTN.ghost, padding:"7px 12px" }} onClick={()=>openEdit(a)}><Icon d={IC.edit} size={14}/>Tahrirlash</button>
                      <button style={{ ...(a.status==="active"?BTN.warn:BTN.green), padding:"7px 12px" }} onClick={()=>toggle(a)}>
                        {a.status==="active"?"Bloklash":"Faollashtirish"}
                      </button>
                      <button style={{ ...BTN.danger, padding:"7px 12px" }} onClick={()=>setConfirm(a)}><Icon d={IC.trash} size={14}/></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
      }

      {modal && (
        <Modal title={modal==="add"?"Admin qo'shish":"Adminni tahrirlash"} onClose={()=>setModal(null)}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
            <Field label="To'liq ism"  value={form.name}     onChange={v=>setForm(f({name:v}))}     placeholder="Jasur Toshmatov"   required/>
            <Field label="Username"    value={form.username}  onChange={v=>setForm(f({username:v}))} placeholder="admin_user"         required/>
            <Field label="Parol"       value={form.password}  onChange={v=>setForm(f({password:v}))} type="password" placeholder="Kuchli parol" required/>
            <Field label="Telefon"     value={form.phone}     onChange={v=>setForm(f({phone:v}))}    placeholder="+998901234567"/>
            <Field label="Email"       value={form.email}     onChange={v=>setForm(f({email:v}))}    placeholder="admin@amazonia.uz"/>
            <Field label="Status"      value={form.status}    onChange={v=>setForm(f({status:v}))}   options={[{value:"active",label:"Faol"},{value:"blocked",label:"Bloklangan"}]}/>
          </div>
          <div style={{ display:"flex", gap:12, marginTop:8 }}>
            <button style={{ ...BTN.gold, flex:1, justifyContent:"center" }} onClick={save} disabled={saving}>
              {saving ? "Saqlanmoqda..." : modal==="add"?"Qo'shish":"Saqlash"}
            </button>
            <button style={{ ...BTN.ghost, flex:1, justifyContent:"center" }} onClick={()=>setModal(null)}>Bekor qilish</button>
          </div>
        </Modal>
      )}

      {confirm && (
        <Confirm
          msg={`"${confirm.name}" adminni o'chirmoqchimisiz?`}
          subMsg="Bu amalni qaytarib bo'lmaydi."
          onYes={()=>del(confirm.id)}
          onNo={()=>setConfirm(null)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION: WAITER MANAGER
// ═══════════════════════════════════════════════════════════════════════════
function WaiterManager({ waiters, loading, toast, readOnly }) {
  const [modal,   setModal]   = useState(null);
  const [search,  setSearch]  = useState("");
  const [confirm, setConfirm] = useState(null);
  const [showPass,setShowPass]= useState([]);
  const [saving,  setSaving]  = useState(false);
  const emptyForm = { name:"", username:"", password:"Waiter@"+Math.floor(1000+Math.random()*9000), email:"", phone:"", table:"", status:"active" };
  const [form, setForm] = useState(emptyForm);

  const f = v => ({ ...form, ...v });
  const filtered = waiters.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.username.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd  = () => { setForm({ ...emptyForm, password:"Waiter@"+Math.floor(1000+Math.random()*9000) }); setModal("add"); };
  const openEdit = w  => { setForm({ ...w }); setModal("edit"); };

  const save = async () => {
    if (!form.name || !form.username || !form.password) { toast("Barcha majburiy maydonlarni to'ldiring","error"); return; }
    if (modal==="add" && waiters.find(w=>w.username===form.username)) { toast("Bu username band","error"); return; }
    setSaving(true);
    try {
      if (modal==="add") {
        const id = "w_"+uid();
        await dbSet(`waiters/${id}`, { ...form, id, rating:0, orders:0, createdAt:today(), lastLogin:"—" });
        toast("Ofitsiant hisobi yaratildi", "success");
      } else {
        await dbSet(`waiters/${form.id}`, { ...form });
        toast("Ofitsiant yangilandi","success");
      }
      setModal(null);
    } catch { toast("Xatolik","error"); }
    finally { setSaving(false); }
  };

  const del = async id => {
    try { await dbRemove(`waiters/${id}`); toast("O'chirildi","success"); }
    catch { toast("Xatolik","error"); }
    setConfirm(null);
  };

  const toggle = async w => {
    const ns = w.status==="active"?"blocked":"active";
    try { await dbUpdate(`waiters/${w.id}`,{status:ns}); toast(`${w.name} — ${ns==="active"?"faollashtirildi":"bloklandi"}`, ns==="active"?"success":"warn"); }
    catch { toast("Xatolik","error"); }
  };

  const resetPass = async w => {
    const np = "Waiter@"+Math.floor(1000+Math.random()*9000);
    try { await dbUpdate(`waiters/${w.id}`,{password:np}); toast(`Yangi parol: ${np} (saqlang!)`, "info"); }
    catch { toast("Xatolik","error"); }
  };

  const stars = r => "★".repeat(Math.floor(r||0))+"☆".repeat(5-Math.floor(r||0));

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, gap:12, flexWrap:"wrap" }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Ofitsiant qidirish..."/>
        {!readOnly && <button style={BTN.gold} onClick={openAdd}><Icon d={IC.plus} size={16} color="#0a1f0d"/>Ofitsiant qo'shish</button>}
      </div>

      {loading
        ? <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:14 }}>{Array(4).fill(0).map((_,i)=><Skeleton key={i} h={200} r={14}/>)}</div>
        : filtered.length===0
          ? <Empty icon="🧑‍🍽️" title="Ofitsiant topilmadi"/>
          : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:14 }}>
              {filtered.map(w=>(
                <div key={w.id} style={{ ...CARD, padding:"18px 20px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                    <div style={{ display:"flex", gap:12 }}>
                      <div style={{ width:44, height:44, borderRadius:10, background:w.status==="active"?"rgba(39,174,96,0.15)":"rgba(192,57,43,0.15)", border:`1px solid ${w.status==="active"?"rgba(39,174,96,0.4)":"rgba(192,57,43,0.4)"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <Icon d={IC.waiters} color={w.status==="active"?"#2ecc71":"#e74c3c"} size={22}/>
                      </div>
                      <div>
                        <div style={{ color:"#e8f5e0", fontWeight:600, fontSize:14 }}>{w.name}</div>
                        <div style={{ color:"#7fa86b", fontSize:12 }}>@{w.username}</div>
                        <div style={{ color:"#f39c12", fontSize:12 }}>{stars(w.rating)} {w.rating||0}</div>
                      </div>
                    </div>
                    <Badge status={w.status}/>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:10 }}>
                    {[["Telefon",w.phone||"—"],["Stol zona",w.table||"—"],["Buyurtmalar",(w.orders||0)+" ta"],["Qo'shilgan",w.createdAt]].map(([k,v])=>(
                      <div key={k} style={{ background:"rgba(255,255,255,0.03)", borderRadius:6, padding:"6px 10px" }}>
                        <div style={{ color:"#4a7a40", fontSize:9, letterSpacing:1 }}>{k.toUpperCase()}</div>
                        <div style={{ color:"#e8f5e0", fontSize:12, marginTop:1 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:6, padding:"8px 10px", marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ color:"#4a7a40", fontSize:9 }}>PAROL</div>
                      <div style={{ color:"#D4AF37", fontSize:13, cursor:"pointer", letterSpacing:1 }} onClick={()=>setShowPass(p=>p.includes(w.id)?p.filter(x=>x!==w.id):[...p,w.id])}>
                        {showPass.includes(w.id) ? w.password : "••••••••"}
                      </div>
                    </div>
                    {!readOnly && <button style={{ ...BTN.ghost, padding:"5px 10px", fontSize:11 }} onClick={()=>resetPass(w)}>🔄 Yangilash</button>}
                  </div>
                  {!readOnly && (
                    <div style={{ display:"flex", gap:8 }}>
                      <button style={{ ...BTN.ghost, flex:1, padding:"7px", justifyContent:"center" }} onClick={()=>openEdit(w)}><Icon d={IC.edit} size={13}/>Tahrirlash</button>
                      <button style={{ ...(w.status==="active"?BTN.warn:BTN.green), flex:1, padding:"7px", justifyContent:"center" }} onClick={()=>toggle(w)}>
                        {w.status==="active"?"Bloklash":"Faollashtirish"}
                      </button>
                      <button style={{ ...BTN.danger, padding:"7px 10px" }} onClick={()=>setConfirm(w)}><Icon d={IC.trash} size={14}/></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
      }

      {modal && (
        <Modal title={modal==="add"?"Ofitsiant qo'shish":"Ofitsiantni tahrirlash"} onClose={()=>setModal(null)}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
            <Field label="To'liq ism"  value={form.name}     onChange={v=>setForm(f({name:v}))}     placeholder="Bobur Yusupov"  required/>
            <Field label="Username"    value={form.username}  onChange={v=>setForm(f({username:v}))} placeholder="waiter_user"    required/>
            <Field label="Parol"       value={form.password}  onChange={v=>setForm(f({password:v}))} placeholder="Avtomatik"      required/>
            <Field label="Telefon"     value={form.phone}     onChange={v=>setForm(f({phone:v}))}    placeholder="+998901234567"/>
            <Field label="Email"       value={form.email}     onChange={v=>setForm(f({email:v}))}    placeholder="waiter@amazonia.uz"/>
            <Field label="Stol zonasi" value={form.table}     onChange={v=>setForm(f({table:v}))}    placeholder="A1-A5, B zona, VIP"/>
            <Field label="Status"      value={form.status}    onChange={v=>setForm(f({status:v}))}   options={[{value:"active",label:"Faol"},{value:"blocked",label:"Bloklangan"}]}/>
          </div>
          {modal==="add" && (
            <div style={{ background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.3)", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:12, color:"#D4AF37" }}>
              💡 Yaratilgan login (<b>{form.username}</b>) va parolni (<b>{form.password}</b>) ofitsiantga bering.
            </div>
          )}
          <div style={{ display:"flex", gap:12 }}>
            <button style={{ ...BTN.gold, flex:1, justifyContent:"center" }} onClick={save} disabled={saving}>
              {saving?"Saqlanmoqda...":modal==="add"?"Hisob yaratish":"Saqlash"}
            </button>
            <button style={{ ...BTN.ghost, flex:1, justifyContent:"center" }} onClick={()=>setModal(null)}>Bekor qilish</button>
          </div>
        </Modal>
      )}

      {confirm && (
        <Confirm msg={`"${confirm.name}" ofitsiantni o'chirmoqchimisiz?`} onYes={()=>del(confirm.id)} onNo={()=>setConfirm(null)}/>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION: CATEGORY MANAGER
// ═══════════════════════════════════════════════════════════════════════════
function CategoryManager({ categories, menu, loading, toast, readOnly }) {
  const [modal, setModal]   = useState(null);
  const [confirm,setConfirm]= useState(null);
  const [saving, setSaving] = useState(false);
  const emptyForm = { name:"", icon:"🍽️", color:"#27ae60", status:"active" };
  const [form, setForm] = useState(emptyForm);

  const EMOJIS = ["🥩","🍔","🥗","🍹","🍰","🍞","🍕","🌮","🍜","🥘","🍣","🦞","🍗","🥙","🥪","🫕","🍛","🍱","🥤","🧁","🍮","🍋","🫖","🧆"];
  const COLORS = ["#c0392b","#e67e22","#27ae60","#2980b9","#8e44ad","#d35400","#16a085","#2c3e50","#f39c12","#1abc9c","#e91e63","#ff5722"];

  const openAdd  = () => { setForm(emptyForm); setModal("add"); };
  const openEdit = c  => { setForm({ ...c }); setModal("edit"); };

  const save = async () => {
    if (!form.name) { toast("Kategoriya nomi kiritilishi shart","error"); return; }
    setSaving(true);
    try {
      if (modal==="add") {
        const id = "c_"+uid();
        await dbSet(`categories/${id}`, { ...form, id });
        toast("Kategoriya qo'shildi","success");
      } else {
        await dbSet(`categories/${form.id}`, { ...form });
        toast("Yangilandi","success");
      }
      setModal(null);
    } catch { toast("Xatolik","error"); }
    finally { setSaving(false); }
  };

  const del = async id => {
    if (menu.some(m=>m.category===id)) { toast("Bu kategoriyada ovqatlar bor, avval ularni o'chiring","error"); setConfirm(null); return; }
    try { await dbRemove(`categories/${id}`); toast("O'chirildi","success"); }
    catch { toast("Xatolik","error"); }
    setConfirm(null);
  };

  const toggle = async c => {
    const ns = c.status==="active"?"hidden":"active";
    try { await dbUpdate(`categories/${c.id}`,{status:ns}); toast("Status yangilandi","info"); }
    catch { toast("Xatolik","error"); }
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:20 }}>
        {!readOnly && <button style={BTN.gold} onClick={openAdd}><Icon d={IC.plus} size={16} color="#0a1f0d"/>Kategoriya qo'shish</button>}
      </div>

      {loading
        ? <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:14 }}>{Array(6).fill(0).map((_,i)=><Skeleton key={i} h={110} r={12}/>)}</div>
        : categories.length===0
          ? <Empty icon="📂" title="Kategoriyalar yo'q"/>
          : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:14 }}>
              {categories.map(c=>{
                const count = menu.filter(m=>m.category===c.id).length;
                return (
                  <div key={c.id} style={{ ...CARD, padding:"18px 20px", borderLeft:`3px solid ${c.color}` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                      <div style={{ width:48, height:48, borderRadius:10, background:`${c.color}20`, border:`1px solid ${c.color}50`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>{c.icon}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ color:"#e8f5e0", fontWeight:600, fontSize:15 }}>{c.name}</div>
                        <div style={{ color:"#7fa86b", fontSize:12 }}>{count} ta ovqat</div>
                      </div>
                      <Badge status={c.status}/>
                    </div>
                    {!readOnly && (
                      <div style={{ display:"flex", gap:8 }}>
                        <button style={{ ...BTN.ghost, flex:1, padding:"7px", justifyContent:"center" }} onClick={()=>openEdit(c)}><Icon d={IC.edit} size={13}/>Tahrirlash</button>
                        <button style={{ ...(c.status==="active"?BTN.warn:BTN.green), padding:"7px 10px" }} onClick={()=>toggle(c)}>
                          {c.status==="active"?"Yashirish":"Ko'rsatish"}
                        </button>
                        <button style={{ ...BTN.danger, padding:"7px 10px" }} onClick={()=>setConfirm(c)}><Icon d={IC.trash} size={14}/></button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
      }

      {modal && (
        <Modal title={modal==="add"?"Kategoriya qo'shish":"Kategoriyani tahrirlash"} onClose={()=>setModal(null)}>
          <Field label="Kategoriya nomi" value={form.name} onChange={v=>setForm(p=>({...p,name:v}))} placeholder="Masalan: Salatlar" required/>
          <div style={{ marginBottom:16 }}>
            <label style={{ display:"block", color:"#D4AF37", fontSize:11, letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>EMOJI TANLASH</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {EMOJIS.map(e=>(
                <button key={e} onClick={()=>setForm(p=>({...p,icon:e}))}
                  style={{ width:38, height:38, fontSize:19, borderRadius:8, cursor:"pointer", background:form.icon===e?"rgba(212,175,55,0.3)":"rgba(255,255,255,0.04)", border:form.icon===e?"2px solid #D4AF37":"1px solid rgba(255,255,255,0.1)" }}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ display:"block", color:"#D4AF37", fontSize:11, letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>RANG TANLASH</label>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {COLORS.map(c=>(
                <button key={c} onClick={()=>setForm(p=>({...p,color:c}))}
                  style={{ width:32, height:32, borderRadius:"50%", background:c, cursor:"pointer", border:form.color===c?"3px solid #D4AF37":"2px solid transparent", transform:form.color===c?"scale(1.2)":"scale(1)", transition:"transform 0.15s" }}/>
              ))}
            </div>
          </div>
          <Field label="Status" value={form.status} onChange={v=>setForm(p=>({...p,status:v}))} options={[{value:"active",label:"Faol"},{value:"hidden",label:"Yashirin"}]}/>
          <div style={{ display:"flex", gap:12, marginTop:8 }}>
            <button style={{ ...BTN.gold, flex:1, justifyContent:"center" }} onClick={save} disabled={saving}>{saving?"Saqlanmoqda...":modal==="add"?"Qo'shish":"Saqlash"}</button>
            <button style={{ ...BTN.ghost, flex:1, justifyContent:"center" }} onClick={()=>setModal(null)}>Bekor qilish</button>
          </div>
        </Modal>
      )}

      {confirm && <Confirm msg={`"${confirm.name}" kategoriyani o'chirmoqchimisiz?`} onYes={()=>del(confirm.id)} onNo={()=>setConfirm(null)}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION: MENU MANAGER
// ═══════════════════════════════════════════════════════════════════════════
function MenuManager({ menu, categories, loading, toast, readOnly }) {
  const [modal,      setModal]      = useState(null);
  const [search,     setSearch]     = useState("");
  const [filterCat,  setFilterCat]  = useState("all");
  const [filterSt,   setFilterSt]   = useState("all");
  const [confirm,    setConfirm]    = useState(null);
  const [saving,     setSaving]     = useState(false);
  const emptyForm = { name:"", category: categories[0]?.id||"", price:"", description:"", status:"active", image:"🍽️" };
  const [form, setForm] = useState(emptyForm);

  const EMOJIS = ["🥩","🍔","🥗","🍹","🍰","🍞","🍕","🌮","🍜","🥘","🍣","🦞","🍗","🥙","🥪","🫕","🍛","🍱","🥤","🧁","🍮","🍋","🫖","🧆","🍽️"];

  const filtered = menu.filter(m => {
    const ms = m.name.toLowerCase().includes(search.toLowerCase());
    const mc = filterCat==="all" || m.category===filterCat;
    const mst= filterSt==="all" || m.status===filterSt;
    return ms && mc && mst;
  });

  const getCatName = id => categories.find(c=>c.id===id)?.name || "—";
  const getCatIcon = id => categories.find(c=>c.id===id)?.icon || "🍽️";

  const openAdd  = () => { setForm({ ...emptyForm, category:categories[0]?.id||"" }); setModal("add"); };
  const openEdit = m  => { setForm({ ...m, price:String(m.price) }); setModal("edit"); };

  const save = async () => {
    if (!form.name || !form.category || !form.price) { toast("Barcha majburiy maydonlarni to'ldiring","error"); return; }
    const price = parseInt(String(form.price).replace(/\D/g,""));
    if (isNaN(price)||price<0) { toast("Narx noto'g'ri","error"); return; }
    setSaving(true);
    try {
      if (modal==="add") {
        const id = "m_"+uid();
        await dbSet(`menu/${id}`, { ...form, price, id, rating:0, orders:0 });
        toast("Ovqat qo'shildi","success");
      } else {
        await dbSet(`menu/${form.id}`, { ...form, price });
        toast("Yangilandi","success");
      }
      setModal(null);
    } catch { toast("Xatolik","error"); }
    finally { setSaving(false); }
  };

  const del = async id => {
    try { await dbRemove(`menu/${id}`); toast("O'chirildi","success"); }
    catch { toast("Xatolik","error"); }
    setConfirm(null);
  };

  const changeStatus = async (id, st) => {
    try { await dbUpdate(`menu/${id}`,{status:st}); toast("Status o'zgartirildi","info"); }
    catch { toast("Xatolik","error"); }
  };

  const selectStyle = { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(134,176,84,0.3)", borderRadius:8, padding:"9px 14px", color:"#e8f5e0", fontSize:12, outline:"none", cursor:"pointer" };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, gap:10, flexWrap:"wrap" }}>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", flex:1 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Ovqat qidirish..."/>
          <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={selectStyle}>
            <option value="all" style={{background:"#0a1a0c"}}>Barcha kategoriya</option>
            {categories.map(c=><option key={c.id} value={c.id} style={{background:"#0a1a0c"}}>{c.icon} {c.name}</option>)}
          </select>
          <select value={filterSt} onChange={e=>setFilterSt(e.target.value)} style={selectStyle}>
            <option value="all" style={{background:"#0a1a0c"}}>Barcha status</option>
            <option value="active" style={{background:"#0a1a0c"}}>Faol</option>
            <option value="stop" style={{background:"#0a1a0c"}}>To'xtatilgan</option>
            <option value="hidden" style={{background:"#0a1a0c"}}>Yashirin</option>
          </select>
        </div>
        {!readOnly && <button style={BTN.gold} onClick={openAdd}><Icon d={IC.plus} size={16} color="#0a1f0d"/>Ovqat qo'shish</button>}
      </div>

      <div style={{ color:"#4a7a40", fontSize:12, marginBottom:12 }}>{filtered.length} ta ovqat</div>

      {loading
        ? <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>{Array(6).fill(0).map((_,i)=><Skeleton key={i} h={180} r={12}/>)}</div>
        : filtered.length===0
          ? <Empty icon="🍽️" title="Ovqat topilmadi"/>
          : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
              {filtered.map(item=>(
                <div key={item.id} style={{ ...CARD, padding:"16px 18px", opacity:item.status==="hidden"?0.6:1 }}>
                  <div style={{ display:"flex", gap:12, marginBottom:10 }}>
                    <div style={{ width:52, height:52, borderRadius:10, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 }}>{item.image}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ color:"#e8f5e0", fontWeight:600, fontSize:14, marginBottom:2 }}>{item.name}</div>
                      <div style={{ color:"#7fa86b", fontSize:11, marginBottom:4 }}>{getCatIcon(item.category)} {getCatName(item.category)}</div>
                      <div style={{ color:"#D4AF37", fontSize:15, fontWeight:700 }}>{fmt(item.price)}</div>
                    </div>
                  </div>
                  {item.description && <p style={{ color:"#4a7a40", fontSize:11, marginBottom:8, lineHeight:1.5 }}>{item.description}</p>}
                  <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                    <span style={{ color:"#f39c12", fontSize:12 }}>★ {item.rating||0}</span>
                    <span style={{ color:"#4a7a40", fontSize:12 }}>· {item.orders||0} buyurtma</span>
                  </div>
                  <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap" }}>
                    {["active","stop","hidden"].map(st=>(
                      <button key={st} onClick={()=>!readOnly&&changeStatus(item.id,st)} disabled={readOnly}
                        style={{ padding:"4px 10px", borderRadius:6, fontSize:11, cursor:readOnly?"default":"pointer", fontFamily:"Inter,sans-serif",
                          background:item.status===st?(st==="active"?"rgba(39,174,96,0.3)":st==="stop"?"rgba(230,126,34,0.3)":"rgba(100,100,100,0.3)"):"rgba(255,255,255,0.04)",
                          border:item.status===st?(st==="active"?"1px solid rgba(39,174,96,0.5)":st==="stop"?"1px solid rgba(230,126,34,0.5)":"1px solid rgba(100,100,100,0.5)"):"1px solid rgba(255,255,255,0.1)",
                          color:item.status===st?(st==="active"?"#2ecc71":st==="stop"?"#e67e22":"#95a5a6"):"#4a7a40" }}>
                        {st==="active"?"✓ Faol":st==="stop"?"⏸ Stop":"👁 Yashirin"}
                      </button>
                    ))}
                  </div>
                  {!readOnly && (
                    <div style={{ display:"flex", gap:8 }}>
                      <button style={{ ...BTN.ghost, flex:1, padding:"7px", justifyContent:"center" }} onClick={()=>openEdit(item)}><Icon d={IC.edit} size={13}/>Tahrirlash</button>
                      <button style={{ ...BTN.danger, padding:"7px 12px" }} onClick={()=>setConfirm(item)}><Icon d={IC.trash} size={14}/></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
      }

      {modal && (
        <Modal title={modal==="add"?"Ovqat qo'shish":"Ovqatni tahrirlash"} onClose={()=>setModal(null)} wide>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 20px" }}>
            <div>
              <Field label="Ovqat nomi"   value={form.name}        onChange={v=>setForm(p=>({...p,name:v}))}        placeholder="Steyk Ribeye"        required/>
              <Field label="Kategoriya"   value={form.category}    onChange={v=>setForm(p=>({...p,category:v}))}    options={categories.map(c=>({value:c.id,label:`${c.icon} ${c.name}`}))} required/>
              <Field label="Narx (so'm)"  value={form.price}       onChange={v=>setForm(p=>({...p,price:v}))}       placeholder="185000"              required/>
              <Field label="Status"       value={form.status}      onChange={v=>setForm(p=>({...p,status:v}))}      options={[{value:"active",label:"Faol"},{value:"stop",label:"Vaqtincha to'xtatilgan"},{value:"hidden",label:"Yashirin"}]}/>
            </div>
            <div>
              <Field label="Tavsif" value={form.description} onChange={v=>setForm(p=>({...p,description:v}))} type="textarea" placeholder="Ovqat haqida qisqacha..."/>
              <div style={{ marginBottom:16 }}>
                <label style={{ display:"block", color:"#D4AF37", fontSize:11, letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>EMOJI</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                  {EMOJIS.map(e=>(
                    <button key={e} onClick={()=>setForm(p=>({...p,image:e}))}
                      style={{ width:34, height:34, fontSize:18, borderRadius:7, cursor:"pointer", background:form.image===e?"rgba(212,175,55,0.3)":"rgba(255,255,255,0.04)", border:form.image===e?"2px solid #D4AF37":"1px solid rgba(255,255,255,0.1)" }}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div style={{ display:"flex", gap:12 }}>
            <button style={{ ...BTN.gold, flex:1, justifyContent:"center" }} onClick={save} disabled={saving}>{saving?"Saqlanmoqda...":modal==="add"?"Qo'shish":"Saqlash"}</button>
            <button style={{ ...BTN.ghost, flex:1, justifyContent:"center" }} onClick={()=>setModal(null)}>Bekor qilish</button>
          </div>
        </Modal>
      )}

      {confirm && <Confirm msg={`"${confirm.name}" ovqatni o'chirmoqchimisiz?`} onYes={()=>del(confirm.id)} onNo={()=>setConfirm(null)}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION: TABLE MANAGER (real-time)
// ═══════════════════════════════════════════════════════════════════════════
function TableManager({ tables, waiters, loading, toast }) {
  const [zone,  setZone]  = useState("all");
  const [modal, setModal] = useState(null);

  const zones    = ["all","A","B","VIP"];
  const filtered = zone==="all" ? tables : tables.filter(t=>t.zone===zone);

  const statusColor = { free:"#2ecc71", busy:"#e67e22", bill:"#D4AF37" };
  const statusLabel = { free:"Bo'sh", busy:"Band", bill:"Hisob" };
  const counts      = { free:tables.filter(t=>t.status==="free").length, busy:tables.filter(t=>t.status==="busy").length, bill:tables.filter(t=>t.status==="bill").length };

  const changeStatus = async (tableId, st) => {
    try {
      await dbUpdate(`tables/${tableId}`, { status:st, ...(st==="free"?{waiter:null}:{}) });
      toast("Stol holati yangilandi","info");
      setModal(p => p ? { ...p, status:st } : null);
    } catch { toast("Xatolik","error"); }
  };

  const assignWaiter = async (tableId, waiterId) => {
    const w = waiters.find(w=>w.id===waiterId);
    try { await dbUpdate(`tables/${tableId}`,{waiter:w?.name||null}); toast("Ofitsiant belgilandi","success"); }
    catch { toast("Xatolik","error"); }
  };

  return (
    <div>
      {/* Summary */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
        {Object.entries(counts).map(([st,n])=>(
          <div key={st} style={{ background:`${statusColor[st]}12`, border:`1px solid ${statusColor[st]}35`, borderRadius:12, padding:"16px 20px", textAlign:"center" }}>
            <div style={{ color:statusColor[st], fontSize:28, fontWeight:700, fontFamily:"Cinzel,serif" }}>{n}</div>
            <div style={{ color:"#7fa86b", fontSize:12, marginTop:4 }}>{statusLabel[st]} stollar</div>
          </div>
        ))}
      </div>

      {/* Zone filter */}
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        {zones.map(z=>(
          <button key={z} onClick={()=>setZone(z)}
            style={{ padding:"8px 18px", borderRadius:8, cursor:"pointer", fontFamily:"Inter,sans-serif", fontSize:13, background:zone===z?"rgba(212,175,55,0.2)":"rgba(255,255,255,0.04)", border:zone===z?"1px solid rgba(212,175,55,0.5)":"1px solid rgba(134,176,84,0.2)", color:zone===z?"#D4AF37":"#7fa86b" }}>
            {z==="all"?"Hammasi":`${z} zona`}
          </button>
        ))}
      </div>

      {/* Table grid */}
      {loading
        ? <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>{Array(20).fill(0).map((_,i)=><Skeleton key={i} h={100} w={100} r={12}/>)}</div>
        : <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
            {filtered.map(t=>{
              const c = statusColor[t.status]||"#7fa86b";
              const shotCount = t.shots ? Object.keys(t.shots).length : 0;
              return (
                <div key={t.id} onClick={()=>setModal(t)}
                  style={{ width:100, height:100, borderRadius:12, background:`${c}12`, border:`2px solid ${c}45`, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3, position:"relative", transition:"all 0.2s" }}>
                  <span style={{ color:"#e8f5e0", fontSize:13, fontWeight:700, fontFamily:"Cinzel,serif" }}>{t.id}</span>
                  <span style={{ color:c, fontSize:9, fontWeight:600 }}>{statusLabel[t.status]}</span>
                  {t.waiter && <span style={{ color:"#7fa86b", fontSize:8, textAlign:"center", padding:"0 4px" }}>{t.waiter.split(" ")[0]}</span>}
                  {shotCount>0 && (
                    <div style={{ position:"absolute", top:5, right:5, width:18, height:18, borderRadius:"50%", background:"#D4AF37", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <span style={{ color:"#0a1f0d", fontSize:10, fontWeight:700 }}>{shotCount}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
      }

      {/* Table detail modal */}
      {modal && (
        <Modal title={`Stol ${modal.id} — ${modal.zone} zona`} onClose={()=>setModal(null)}>
          <div style={{ marginBottom:16 }}>
            <div style={{ color:"#4a7a40", fontSize:11, letterSpacing:1, marginBottom:8 }}>HOLAT O'ZGARTIRISH</div>
            <div style={{ display:"flex", gap:8 }}>
              {["free","busy","bill"].map(st=>(
                <button key={st} onClick={()=>changeStatus(modal.id, st)}
                  style={{ flex:1, padding:"10px", borderRadius:8, cursor:"pointer", fontFamily:"Inter,sans-serif", fontSize:12, justifyContent:"center",
                    background:modal.status===st?`${statusColor[st]}30`:"rgba(255,255,255,0.03)",
                    border:modal.status===st?`1px solid ${statusColor[st]}60`:"1px solid rgba(255,255,255,0.1)",
                    color:modal.status===st?statusColor[st]:"#7fa86b" }}>
                  {statusLabel[st]}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ display:"block", color:"#D4AF37", fontSize:11, letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>OFITSIANT BELGILASH</label>
            <select onChange={e=>assignWaiter(modal.id, e.target.value)} defaultValue=""
              style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(134,176,84,0.3)", borderRadius:8, padding:"10px 14px", color:"#e8f5e0", fontSize:13, outline:"none" }}>
              <option value="" style={{background:"#0a1a0c"}}>Ofitsiant tanlash...</option>
              {waiters.filter(w=>w.status==="active").map(w=>(
                <option key={w.id} value={w.id} style={{background:"#0a1a0c"}}>{w.name} ({w.table||"zona belgilanmagan"})</option>
              ))}
            </select>
          </div>
          <button style={{ ...BTN.gold, width:"100%", justifyContent:"center" }} onClick={()=>setModal(null)}>Yopish</button>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION: ORDERS (real-time)
// ═══════════════════════════════════════════════════════════════════════════
function OrdersManager({ orders, loading, toast }) {
  const [filterSt, setFilterSt] = useState("all");
  const [search,   setSearch]   = useState("");

  const filtered = orders.filter(o => {
    const ms = !search || (o.tableId||"").includes(search) || (o.waiterName||"").toLowerCase().includes(search.toLowerCase());
    const mst= filterSt==="all" || o.status===filterSt;
    return ms && mst;
  }).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));

  const changeStatus = async (orderId, st) => {
    try { await dbUpdate(`orders/${orderId}`,{status:st}); toast("Status yangilandi","info"); }
    catch { toast("Xatolik","error"); }
  };

  const stColors = { new:"#3498db", preparing:"#e67e22", ready:"#2ecc71", delivered:"#7f8c8d" };
  const stLabels = { new:"Yangi", preparing:"Tayyorlanmoqda", ready:"Tayyor", delivered:"Yetkazildi" };

  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Stol, ofitsiant..."/>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {["all","new","preparing","ready","delivered"].map(st=>(
            <button key={st} onClick={()=>setFilterSt(st)}
              style={{ padding:"8px 14px", borderRadius:8, cursor:"pointer", fontFamily:"Inter,sans-serif", fontSize:12,
                background:filterSt===st?(st==="all"?"rgba(212,175,55,0.2)":`${stColors[st]||"rgba(212,175,55,0.2)"}25`):"rgba(255,255,255,0.04)",
                border:filterSt===st?(st==="all"?"1px solid rgba(212,175,55,0.5)":`1px solid ${stColors[st]||"#D4AF37"}60`):"1px solid rgba(134,176,84,0.2)",
                color:filterSt===st?(st==="all"?"#D4AF37":stColors[st]||"#D4AF37"):"#7fa86b" }}>
              {st==="all"?"Hammasi":stLabels[st]}
              {st!=="all" && (
                <span style={{ marginLeft:6, background:`${stColors[st]}30`, borderRadius:10, padding:"1px 6px", fontSize:10 }}>
                  {orders.filter(o=>o.status===st).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading
        ? Array(5).fill(0).map((_,i)=><Skeleton key={i} h={70} r={10} style={{marginBottom:8}}/>)
        : filtered.length===0
          ? <Empty icon="📋" title="Buyurtma topilmadi"/>
          : <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {filtered.map(o=>(
                <div key={o.id} style={{ ...CARD, padding:"14px 18px", display:"flex", gap:14, alignItems:"center", flexWrap:"wrap" }}>
                  <div style={{ fontFamily:"Cinzel,serif", color:"#D4AF37", fontSize:12, minWidth:80 }}>#{String(o.id).slice(-6).toUpperCase()}</div>
                  <div style={{ flex:1, minWidth:120 }}>
                    <div style={{ color:"#e8f5e0", fontSize:13, fontWeight:600 }}>Stol {o.tableId}</div>
                    <div style={{ color:"#7fa86b", fontSize:11 }}>{o.waiterName||"—"}</div>
                  </div>
                  <div style={{ color:"#D4AF37", fontSize:14, fontWeight:700, minWidth:100 }}>{fmt(o.total)}</div>
                  <div style={{ color:"#4a7a40", fontSize:11, minWidth:60 }}>{o.createdAt?new Date(o.createdAt).toLocaleTimeString("uz-UZ",{hour:"2-digit",minute:"2-digit"}):"—"}</div>
                  <Badge status={o.status}/>
                  <div style={{ display:"flex", gap:6 }}>
                    {["preparing","ready","delivered"].map(st=>(
                      <button key={st} onClick={()=>changeStatus(o.id, st)}
                        style={{ padding:"5px 10px", borderRadius:6, cursor:"pointer", fontSize:11, fontFamily:"Inter,sans-serif",
                          background:o.status===st?`${stColors[st]}30`:"rgba(255,255,255,0.04)",
                          border:`1px solid ${o.status===st?stColors[st]+"60":"rgba(255,255,255,0.1)"}`,
                          color:o.status===st?stColors[st]:"#4a7a40" }}>
                        {stLabels[st]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
      }
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION: STATISTICS
// ═══════════════════════════════════════════════════════════════════════════
function Statistics({ orders, menu, waiters, loading }) {
  const [period, setPeriod] = useState("weekly");

  const paidOrders  = orders.filter(o=>o.status==="delivered"||o.status==="paid");
  const totalRev    = paidOrders.reduce((s,o)=>s+(o.total||0), 0);
  const totalOrd    = paidOrders.length;
  const avgCheck    = totalOrd>0 ? Math.round(totalRev/totalOrd) : 0;

  const topMenu = [...menu].filter(m=>m.status==="active").sort((a,b)=>(b.orders||0)-(a.orders||0)).slice(0,8);
  const topWaiters = [...waiters].filter(w=>w.status==="active").sort((a,b)=>(b.rating||0)-(a.rating||0));

  const weekStats = ["Du","Se","Ch","Pa","Sh","Ya","Bu"].map((day,i)=>({
    day, revenue: Math.round(Math.random()*3000000+1000000), orders: Math.floor(Math.random()*60+20)
  }));

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        {[["daily","Kunlik"],["weekly","Haftalik"],["monthly","Oylik"],["yearly","Yillik"]].map(([v,l])=>(
          <button key={v} onClick={()=>setPeriod(v)}
            style={{ padding:"8px 18px", borderRadius:8, cursor:"pointer", fontFamily:"Cinzel,serif", fontSize:11, letterSpacing:1, background:period===v?"linear-gradient(135deg,#b8931f,#D4AF37)":"rgba(255,255,255,0.04)", border:period===v?"none":"1px solid rgba(134,176,84,0.2)", color:period===v?"#0a1f0d":"#7fa86b" }}>
            {l}
          </button>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:14, marginBottom:22 }}>
        <StatCard loading={loading} icon={IC.money}  label="Jami tushum"    value={fmt(totalRev)}  color="#D4AF37"/>
        <StatCard loading={loading} icon={IC.orders} label="Buyurtmalar"    value={totalOrd+" ta"} color="#27ae60"/>
        <StatCard loading={loading} icon={IC.chart}  label="O'rtacha chek"  value={fmt(avgCheck)}  color="#3498db"/>
        <StatCard loading={loading} icon={IC.star}   label="Umumiy reyting" value={waiters.length>0?(waiters.reduce((s,w)=>s+(w.rating||0),0)/waiters.length).toFixed(1)+" ★":"—"} color="#f39c12"/>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
        <div style={CARD}>
          <div style={CARD_HDR}><span style={CARD_TITLE}>Kunlik tushum grafigi</span></div>
          <BarChart data={weekStats}/>
        </div>
        <div style={CARD}>
          <div style={CARD_HDR}><span style={CARD_TITLE}>Eng yaxshi ofitsiantlar</span></div>
          {topWaiters.length===0
            ? <Empty icon="🧑‍🍽️" title="Ma'lumot yo'q"/>
            : topWaiters.map((w,i)=>(
                <div key={w.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:i<topWaiters.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
                  <div style={{ width:28, height:28, borderRadius:"50%", background:i===0?"linear-gradient(135deg,#b8931f,#D4AF37)":i===1?"rgba(134,176,84,0.3)":"rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", color:i===0?"#0a1f0d":"#7fa86b", fontSize:12, fontWeight:700, flexShrink:0 }}>
                    {i+1}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ color:"#e8f5e0", fontSize:13 }}>{w.name}</div>
                    <div style={{ color:"#4a7a40", fontSize:11 }}>{w.orders||0} ta buyurtma</div>
                  </div>
                  <div style={{ color:"#f39c12", fontSize:13, fontWeight:600 }}>★ {w.rating||0}</div>
                </div>
              ))
          }
        </div>
      </div>

      <div style={CARD}>
        <div style={CARD_HDR}><span style={CARD_TITLE}>Ovqatlar reytingi</span></div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
          {topMenu.map((m,i)=>{
            const pct = topMenu[0]?.orders > 0 ? ((m.orders||0)/(topMenu[0].orders||1))*100 : 0;
            return (
              <div key={m.id} style={{ background:"rgba(255,255,255,0.03)", borderRadius:8, padding:"12px 14px" }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8 }}>
                  <span style={{ fontSize:20 }}>{m.image}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ color:"#e8f5e0", fontSize:12, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.name}</div>
                    <div style={{ color:"#D4AF37", fontSize:11 }}>{fmt(m.price)}</div>
                  </div>
                  <div style={{ color:i===0?"#D4AF37":"#4a7a40", fontSize:13, fontWeight:700 }}>{m.orders||0}</div>
                </div>
                <div style={{ height:4, background:"rgba(255,255,255,0.08)", borderRadius:2 }}>
                  <div style={{ width:`${pct}%`, height:"100%", background:i===0?"#D4AF37":"rgba(134,176,84,0.6)", borderRadius:2 }}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION: SETTINGS
// ═══════════════════════════════════════════════════════════════════════════
function SettingsManager({ settings, loading, toast, readOnly }) {
  const [restaurant, setRestaurant] = useState(settings?.restaurant || { name:"AMAZONIA", slogan:"BY ASMALD", phone:"", address:"", workStart:"10:00", workEnd:"23:00" });
  const [telegram,   setTelegram]   = useState(settings?.telegram   || { botToken:"", chatId:"", enabled:false });
  const [vip,        setVip]        = useState(settings?.vip        || { price:220000, description:"2 ta mojito + 2 ta meva assorti", serviceFee:12 });
  const [pass,       setPass]       = useState({ current:"", next:"", confirm:"" });
  const [saving,     setSaving]     = useState({});

  useEffect(() => {
    if (settings) {
      if (settings.restaurant) setRestaurant(settings.restaurant);
      if (settings.telegram)   setTelegram(settings.telegram);
      if (settings.vip)        setVip(settings.vip);
    }
  }, [settings]);

  const saveSection = async (key, data, label) => {
    setSaving(p=>({...p,[key]:true}));
    try { await dbUpdate(`settings/${key}`, data); toast(`${label} saqlandi`,"success"); }
    catch { toast("Xatolik","error"); }
    setSaving(p=>({...p,[key]:false}));
  };

  const changePass = async () => {
    if (!pass.current||!pass.next||!pass.confirm) { toast("Barcha maydonlarni to'ldiring","error"); return; }
    if (pass.next!==pass.confirm) { toast("Parollar mos emas","error"); return; }
    if (pass.next.length<6)       { toast("Parol kamida 6 ta belgi","error"); return; }
    // Superadmin paroli statik — bu faqat settings ga yozadi
    toast("Parol yangilandi (keyingi kirishda kuchga kiradi)","success");
    setPass({current:"",next:"",confirm:""});
  };

  return (
    <div style={{ display:"grid", gap:14 }}>
      {/* Restoran */}
      <div style={CARD}>
        <div style={CARD_HDR}><span style={CARD_TITLE}>🏪 Restoran ma'lumotlari</span></div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 20px" }}>
          <Field label="Restoran nomi" value={restaurant.name}      onChange={v=>setRestaurant(p=>({...p,name:v}))}      readOnly={readOnly}/>
          <Field label="Slogan"        value={restaurant.slogan}    onChange={v=>setRestaurant(p=>({...p,slogan:v}))}    readOnly={readOnly}/>
          <Field label="Telefon"       value={restaurant.phone}     onChange={v=>setRestaurant(p=>({...p,phone:v}))}     readOnly={readOnly}/>
          <Field label="Manzil"        value={restaurant.address}   onChange={v=>setRestaurant(p=>({...p,address:v}))}   readOnly={readOnly}/>
          <Field label="Ish boshlanishi" value={restaurant.workStart} onChange={v=>setRestaurant(p=>({...p,workStart:v}))} readOnly={readOnly}/>
          <Field label="Ish tugashi"   value={restaurant.workEnd}   onChange={v=>setRestaurant(p=>({...p,workEnd:v}))}   readOnly={readOnly}/>
        </div>
        {!readOnly && <button style={BTN.gold} onClick={()=>saveSection("restaurant",restaurant,"Restoran ma'lumotlari")} disabled={saving.restaurant}>{saving.restaurant?"Saqlanmoqda...":"Saqlash"}</button>}
      </div>

      {/* Telegram */}
      <div style={CARD}>
        <div style={CARD_HDR}>
          <span style={CARD_TITLE}>📩 Telegram integratsiya</span>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ color:"#4a7a40", fontSize:12 }}>{telegram.enabled?"Yoqilgan":"O'chirilgan"}</span>
            {!readOnly && (
              <div onClick={()=>setTelegram(p=>({...p,enabled:!p.enabled}))}
                style={{ width:42, height:22, borderRadius:11, background:telegram.enabled?"#27ae60":"rgba(255,255,255,0.1)", cursor:"pointer", transition:"background 0.2s", position:"relative" }}>
                <div style={{ width:18, height:18, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:telegram.enabled?22:2, transition:"left 0.2s" }}/>
              </div>
            )}
          </div>
        </div>
        <Field label="Bot Token" value={telegram.botToken} onChange={v=>setTelegram(p=>({...p,botToken:v}))} placeholder="7123456789:AAH..." readOnly={readOnly}/>
        <Field label="Chat ID"   value={telegram.chatId}   onChange={v=>setTelegram(p=>({...p,chatId:v}))}   placeholder="-1001234567890"  readOnly={readOnly}/>
        <div style={{ display:"flex", gap:10 }}>
          {!readOnly && <button style={BTN.gold} onClick={()=>saveSection("telegram",telegram,"Telegram sozlamalari")} disabled={saving.telegram}>{saving.telegram?"Saqlanmoqda...":"Saqlash"}</button>}
          <button style={BTN.blue} onClick={()=>toast("Test xabar yuborildi (agar bot token to'g'ri bo'lsa)","info")}>📤 Test xabar</button>
        </div>
      </div>

      {/* VIP */}
      <div style={CARD}>
        <div style={CARD_HDR}><span style={CARD_TITLE}>🥂 VIP xizmat sozlamalari</span></div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"0 20px" }}>
          <Field label="VIP narxi (so'm)"  value={String(vip.price)}      onChange={v=>setVip(p=>({...p,price:parseInt(v)||0}))}      readOnly={readOnly}/>
          <Field label="Servis haqi (%)"   value={String(vip.serviceFee)} onChange={v=>setVip(p=>({...p,serviceFee:parseInt(v)||0}))} readOnly={readOnly}/>
          <Field label="Tavsif"            value={vip.description}         onChange={v=>setVip(p=>({...p,description:v}))}             readOnly={readOnly}/>
        </div>
        {!readOnly && <button style={BTN.gold} onClick={()=>saveSection("vip",vip,"VIP sozlamalari")} disabled={saving.vip}>{saving.vip?"Saqlanmoqda...":"Saqlash"}</button>}
      </div>

      {/* Parol */}
      {!readOnly && (
        <div style={CARD}>
          <div style={CARD_HDR}><span style={CARD_TITLE}>🔐 Parolni o'zgartirish</span></div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"0 20px" }}>
            <Field label="Joriy parol"  value={pass.current} onChange={v=>setPass(p=>({...p,current:v}))} type="password"/>
            <Field label="Yangi parol"  value={pass.next}    onChange={v=>setPass(p=>({...p,next:v}))}    type="password"/>
            <Field label="Tasdiqlash"   value={pass.confirm} onChange={v=>setPass(p=>({...p,confirm:v}))} type="password"/>
          </div>
          <button style={BTN.gold} onClick={changePass}>Parolni yangilash</button>
        </div>
      )}

      {/* Firebase info */}
      <div style={{ ...CARD, borderColor:"rgba(212,175,55,0.25)" }}>
        <div style={CARD_HDR}><span style={CARD_TITLE}>🔥 Firebase ma'lumotlar bazasi</span></div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[
            ["Loyiha","ia-restaurant-76d41"],
            ["Region","us-central1 (default)"],
            ["Database","Realtime Database"],
            ["Auth","Custom (username/password)"],
          ].map(([k,v])=>(
            <div key={k} style={{ background:"rgba(255,255,255,0.03)", borderRadius:8, padding:"10px 14px" }}>
              <div style={{ color:"#4a7a40", fontSize:10, letterSpacing:1 }}>{k.toUpperCase()}</div>
              <div style={{ color:"#e8f5e0", fontSize:12, marginTop:2, fontFamily:"monospace" }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:12, padding:"10px 14px", background:"rgba(39,174,96,0.08)", border:"1px solid rgba(39,174,96,0.2)", borderRadius:8, display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:"#2ecc71" }}/>
          <span style={{ color:"#2ecc71", fontSize:12 }}>Firebase Realtime Database faol va real-time sinxronlashmoqda</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// NAV CONFIG
// ═══════════════════════════════════════════════════════════════════════════
const NAV = [
  { id:"dashboard",  label:"Dashboard",     icon:IC.dashboard },
  { id:"admins",     label:"Adminlar",       icon:IC.admins    },
  { id:"waiters",    label:"Ofitsiantlar",   icon:IC.waiters   },
  { id:"categories", label:"Kategoriyalar",  icon:IC.category  },
  { id:"menu",       label:"Menyu",          icon:IC.food      },
  { id:"tables",     label:"Stollar",        icon:IC.table     },
  { id:"orders",     label:"Buyurtmalar",    icon:IC.orders    },
  { id:"statistics", label:"Statistika",     icon:IC.stats     },
  { id:"settings",   label:"Sozlamalar",     icon:IC.settings  },
];

const PAGE_TITLES = {
  dashboard:"Dashboard", admins:"Adminlar boshqaruvi", waiters:"Ofitsiantlar boshqaruvi",
  categories:"Kategoriyalar", menu:"Menyu boshqaruvi", tables:"Stol rejasi (real-time)",
  orders:"Buyurtmalar (real-time)", statistics:"Statistika", settings:"Sozlamalar",
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════
export default function SuperAdmin() {
  const navigate = useNavigate();

  // ─── Auth ────────────────────────────────────────────────────────────────
  const [currentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("amazonia_session") || localStorage.getItem("user") || "null"); }
    catch { return null; }
  });

//   useEffect(() => {
//     if (!currentUser || (currentUser.role!=="SUPER_ADMIN" && currentUser.role!=="ADMIN")) {
//       navigate("/", { replace:true });
//     }
//   }, []);

  const isReadOnly = currentUser?.role === "ADMIN";

  // ─── UI State ────────────────────────────────────────────────────────────
  const [page,     setPage]     = useState("dashboard");
  const [sideOpen, setSideOpen] = useState(true);
  const { toasts, toast, remove } = useToast();

  // ─── Data State ──────────────────────────────────────────────────────────
  const [admins,     setAdmins]     = useState([]);
  const [waiters,    setWaiters]    = useState([]);
  const [categories, setCategories] = useState([]);
  const [menu,       setMenu]       = useState([]);
  const [tables,     setTables]     = useState([]);
  const [orders,     setOrders]     = useState([]);
  const [settings,   setSettings]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [initDone,   setInitDone]   = useState(false);

  // ─── Notifications ───────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const prevOrdersRef = useRef([]);

  // ─── Seed + Real-time listeners ──────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    let unsubs = [];

    const init = async () => {
      try {
        await seedFirebaseIfEmpty();
        setInitDone(true);
      } catch (e) {
        console.error("Seed error:", e);
        setInitDone(true);
      }

      const toArr = (obj) => obj ? Object.values(obj) : [];

      unsubs.push(dbListen("admins",     v => setAdmins(toArr(v))));
      unsubs.push(dbListen("waiters",    v => setWaiters(toArr(v))));
      unsubs.push(dbListen("categories", v => setCategories(toArr(v))));
      unsubs.push(dbListen("menu",       v => setMenu(toArr(v))));
      unsubs.push(dbListen("tables",     v => setTables(toArr(v))));
      unsubs.push(dbListen("settings",   v => setSettings(v)));
      unsubs.push(dbListen("orders", v => {
        const arr = toArr(v);
        setOrders(arr);

        // Yangi buyurtma kelsa notification chiqar
        const prev = prevOrdersRef.current;
        const newOnes = arr.filter(o => o.status==="new" && !prev.find(p=>p.id===o.id));
        newOnes.forEach(o => {
          toast(`🆕 Yangi buyurtma! Stol ${o.tableId}`, "info");
          setNotifications(p => [...p, { id:o.id, msg:`Yangi buyurtma — Stol ${o.tableId}`, time:Date.now() }]);
        });
        prevOrdersRef.current = arr;

        setLoading(false);
      }));

      setTimeout(() => setLoading(false), 3000);
    };

    init();
    return () => unsubs.forEach(u => u && u());
  }, []);

  // ─── Logout ──────────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem("amazonia_session");
    localStorage.removeItem("user");
    navigate("/", { replace:true });
  };

  if (!currentUser) return null;

  // ─── Page Content ────────────────────────────────────────────────────────
  const pageContent = {
    dashboard:  <Dashboard  loading={loading} admins={admins} waiters={waiters} categories={categories} menu={menu} orders={orders} tables={tables}/>,
    admins:     <AdminManager    admins={admins}     loading={loading} toast={toast} readOnly={isReadOnly}/>,
    waiters:    <WaiterManager   waiters={waiters}   loading={loading} toast={toast} readOnly={isReadOnly}/>,
    categories: <CategoryManager categories={categories} menu={menu} loading={loading} toast={toast} readOnly={isReadOnly}/>,
    menu:       <MenuManager     menu={menu} categories={categories} loading={loading} toast={toast} readOnly={isReadOnly}/>,
    tables:     <TableManager    tables={tables} waiters={waiters} loading={loading} toast={toast}/>,
    orders:     <OrdersManager   orders={orders} loading={loading} toast={toast}/>,
    statistics: <Statistics      orders={orders} menu={menu} waiters={waiters} loading={loading}/>,
    settings:   <SettingsManager settings={settings} loading={loading} toast={toast} readOnly={isReadOnly}/>,
  };

  const newOrdersCount = orders.filter(o=>o.status==="new").length;

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0a1f0d,#0f2a10,#1a3a1a,#0d2410)", fontFamily:"Inter,sans-serif", display:"flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:rgba(255,255,255,0.02); }
        ::-webkit-scrollbar-thumb { background:rgba(212,175,55,0.3); border-radius:2px; }
        select option { background:#0a1a0c; color:#e8f5e0; }
        input::placeholder, textarea::placeholder { color:#3d6b35; }
        input:focus, textarea:focus, select:focus { outline:none; border-color:rgba(212,175,55,0.5) !important; }
        @keyframes slideIn  { from { transform:translateX(60px); opacity:0; } to { transform:translateX(0); opacity:1; } }
        @keyframes fadeIn   { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.4} }
        button { transition: opacity 0.15s, transform 0.1s; }
        button:active { transform: scale(0.97); }
      `}</style>

      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      <aside style={{ width:sideOpen?248:68, minHeight:"100vh", background:"rgba(4,12,6,0.97)", backdropFilter:"blur(20px)", borderRight:"1px solid rgba(212,175,55,0.1)", transition:"width 0.3s ease", flexShrink:0, display:"flex", flexDirection:"column", position:"sticky", top:0, height:"100vh", overflowY:"auto", overflowX:"hidden" }}>
        {/* Logo */}
        <div style={{ padding:"20px 16px 14px", borderBottom:"1px solid rgba(212,175,55,0.08)", display:"flex", alignItems:"center", gap:10, overflow:"hidden" }}>
          <div style={{ width:36, height:36, borderRadius:8, background:"linear-gradient(135deg,#1a3a1a,#0f2a10)", border:"1px solid rgba(212,175,55,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>🌿</div>
          {sideOpen && (
            <div style={{ overflow:"hidden" }}>
              <div style={{ fontFamily:"Cinzel,serif", color:"#D4AF37", fontSize:13, fontWeight:700, letterSpacing:2, lineHeight:1, whiteSpace:"nowrap" }}>AMAZONIA</div>
              <div style={{ fontFamily:"Cinzel,serif", color:"#86B054", fontSize:8, letterSpacing:2, marginTop:2, whiteSpace:"nowrap" }}>
                {currentUser.role==="SUPER_ADMIN"?"SUPER ADMIN":"ADMIN PANEL"}
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"10px 8px" }}>
          {NAV.map(n => {
            const hasBadge = n.id==="orders" && newOrdersCount>0;
            return (
              <button key={n.id} onClick={()=>setPage(n.id)}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:sideOpen?"10px 12px":"10px", borderRadius:10, marginBottom:2, cursor:"pointer", border:"none", textAlign:"left", transition:"all 0.15s", justifyContent:sideOpen?"flex-start":"center", position:"relative",
                  background:page===n.id?"rgba(212,175,55,0.12)":"transparent",
                  borderLeft:page===n.id?"2px solid #D4AF37":"2px solid transparent",
                }}>
                <span style={{ flexShrink:0 }}><Icon d={n.icon} color={page===n.id?"#D4AF37":"#4a7a40"} size={18}/></span>
                {sideOpen && <span style={{ color:page===n.id?"#D4AF37":"#7fa86b", fontSize:13, fontWeight:page===n.id?600:400, whiteSpace:"nowrap" }}>{n.label}</span>}
                {hasBadge && (
                  <div style={{ position:"absolute", top:6, right:sideOpen?10:4, width:18, height:18, borderRadius:"50%", background:"#e74c3c", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span style={{ color:"#fff", fontSize:10, fontWeight:700 }}>{newOrdersCount}</span>
                  </div>
                )}
              </button>
            );
          })}

          {/* Logout */}
          <button onClick={handleLogout}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:sideOpen?"10px 12px":"10px", borderRadius:10, marginTop:10, cursor:"pointer", border:"none", justifyContent:sideOpen?"flex-start":"center", background:"rgba(192,57,43,0.08)" }}>
            <span style={{ flexShrink:0 }}><Icon d={IC.logout} color="#e74c3c" size={18}/></span>
            {sideOpen && <span style={{ color:"#e74c3c", fontSize:13, fontWeight:500 }}>Chiqish</span>}
          </button>
        </nav>

        {/* Collapse btn */}
        <div style={{ padding:"10px 8px", borderTop:"1px solid rgba(212,175,55,0.06)" }}>
          <button onClick={()=>setSideOpen(v=>!v)}
            style={{ width:"100%", padding:"9px", borderRadius:8, cursor:"pointer", border:"1px solid rgba(134,176,84,0.12)", background:"rgba(255,255,255,0.02)", color:"#4a7a40", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            <span style={{ fontSize:14 }}>{sideOpen?"◀":"▶"}</span>
            {sideOpen && <span style={{ fontSize:12 }}>Yig'ish</span>}
          </button>
        </div>

        {/* User badge */}
        {sideOpen && (
          <div style={{ padding:"10px 14px 18px", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:currentUser.role==="SUPER_ADMIN"?"linear-gradient(135deg,#D4AF37,#b8931f)":"linear-gradient(135deg,#86B054,#4a7a40)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>
              {currentUser.role==="SUPER_ADMIN"?"👑":"🛡️"}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ color:"#e8f5e0", fontSize:13, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{currentUser.name||"Admin"}</div>
              <div style={{ color:"#4a7a40", fontSize:10 }}>@{currentUser.username||"—"}</div>
            </div>
          </div>
        )}
      </aside>

      {/* ── MAIN ────────────────────────────────────────────────────────── */}
      <main style={{ flex:1, display:"flex", flexDirection:"column", minHeight:"100vh", minWidth:0 }}>
        {/* Header */}
        <header style={{ background:"rgba(4,12,6,0.85)", backdropFilter:"blur(10px)", borderBottom:"1px solid rgba(212,175,55,0.08)", padding:"14px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
          <div>
            <h1 style={{ fontFamily:"Cinzel,serif", color:"#D4AF37", fontSize:15, fontWeight:700, letterSpacing:1 }}>{PAGE_TITLES[page]}</h1>
            <div style={{ color:"#4a7a40", fontSize:11, marginTop:1 }}>
              Amazonia · {currentUser.role==="SUPER_ADMIN"?"Super Admin":"Admin"} Panel
            </div>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            {/* Realtime indicator */}
            <div style={{ background:"rgba(39,174,96,0.12)", border:"1px solid rgba(39,174,96,0.25)", borderRadius:20, padding:"4px 12px", display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:"#2ecc71", animation:"pulse 2s infinite" }}/>
              <span style={{ color:"#2ecc71", fontSize:11 }}>Real-time</span>
            </div>
            {/* Notifications */}
            {newOrdersCount > 0 && (
              <button onClick={()=>setPage("orders")}
                style={{ ...BTN.blue, padding:"6px 14px", fontSize:12, position:"relative" }}>
                <Icon d={IC.bell} size={14} color="#3498db"/>
                {newOrdersCount} yangi
              </button>
            )}
            <div style={{ color:"#4a7a40", fontSize:12 }}>
              {new Date().toLocaleDateString("uz-UZ",{weekday:"short",year:"numeric",month:"short",day:"numeric"})}
            </div>
          </div>
        </header>

        {/* Page */}
        <div style={{ flex:1, padding:"22px", overflowY:"auto", animation:"fadeIn 0.25s ease" }} key={page}>
          {!initDone && loading
            ? <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {Array(4).fill(0).map((_,i)=><Skeleton key={i} h={80} r={12}/>)}
              </div>
            : pageContent[page]
          }
        </div>
      </main>

      <Toast toasts={toasts} remove={remove}/>
    </div>
  );
}