import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { dbGet, dbSet, dbUpdate, dbRemove, dbListen } from "../firebase";
import { getStoredUser, clearUser } from "../App";
import { listenTables, ensureTablesExist, ZONES_CONFIG, BISETKA_INFO } from "../tableData";

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt    = (n) => (n || 0).toLocaleString("uz-UZ") + " so'm";
const uid    = () => Math.random().toString(36).slice(2, 9);
const today  = () => new Date().toISOString().slice(0, 10);
const nowStr = () => new Date().toLocaleString("uz-UZ");
const sortTables = (arr) =>
  [...arr].sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));

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
      <span className="sa-hide-mobile" style={{ color:"#4a7a40", fontSize:11 }}>
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
  image:     ["M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2z","M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z","M21 15l-5-5L5 21"],
  upload:    ["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4","M17 8l-5-5-5 5","M12 3v12"],
  menuBars:  ["M3 6h18","M3 12h18","M3 18h18"],
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
const CARD_HDR = { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:8 };
const CARD_TTL = { fontFamily:"Cinzel,serif", color:"#D4AF37", fontSize:13, letterSpacing:1 };
const LBL      = { display:"block", color:"#D4AF37", fontSize:10, letterSpacing:2, textTransform:"uppercase", marginBottom:6 };
const INP      = { width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(134,176,84,0.3)", borderRadius:8, padding:"10px 14px", color:"#e8f5e0", fontSize:13, fontFamily:"Inter,sans-serif", outline:"none", boxSizing:"border-box" };
const SELECT_S = { ...INP, cursor:"pointer" };

// ─── IMAGE UPLOAD HELPER ─────────────────────────────────────────────────────
// Rasmni base64 ga aylantiradi, 400x400 ga resize qiladi
function compressImage(file, maxSize = 400) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
          else       { w = Math.round(w * maxSize / h); h = maxSize; }
        }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ─── IMAGE UPLOADER COMPONENT ────────────────────────────────────────────────
function ImageUploader({ value, onChange, size = 80, label = "Rasm" }) {
  const ref = useRef();
  const [dragging, setDragging] = useState(false);

  const handle = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const b64 = await compressImage(file);
    onChange(b64);
  };

  return (
    <div style={{ marginBottom:14 }}>
      <label style={LBL}>{label}</label>
      <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
        {/* Preview */}
        <div style={{
          width:size, height:size, borderRadius:12, overflow:"hidden", flexShrink:0,
          border: dragging ? "2px solid #D4AF37" : "2px dashed rgba(134,176,84,0.4)",
          background:"rgba(255,255,255,0.04)", display:"flex", alignItems:"center",
          justifyContent:"center", cursor:"pointer", transition:"border-color 0.2s",
        }}
          onClick={() => ref.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files[0]); }}
        >
          {value ? (
            <img src={value} alt="preview" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          ) : (
            <div style={{ textAlign:"center", padding:8 }}>
              <Icon d={IC.upload} size={22} color="#4a7a40" />
              <div style={{ color:"#3d5c38", fontSize:10, marginTop:4 }}>Yuklash</div>
            </div>
          )}
        </div>
        {/* Actions */}
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <button type="button" onClick={() => ref.current?.click()}
            style={{ ...BTN.ghost, padding:"7px 14px", fontSize:11 }}>
            <Icon d={IC.upload} size={13} color="#86B054" /> Rasm tanlash
          </button>
          {value && (
            <button type="button" onClick={() => onChange("")}
              style={{ ...BTN.danger, padding:"7px 14px", fontSize:11 }}>
              O'chirish
            </button>
          )}
          <div style={{ color:"#3d5c38", fontSize:10 }}>JPG, PNG, WEBP · Max 5MB</div>
        </div>
      </div>
      <input ref={ref} type="file" accept="image/*" style={{ display:"none" }}
        onChange={(e) => handle(e.target.files[0])} />
    </div>
  );
}

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({ toasts, remove }) {
  const colors = { success:"rgba(39,174,96,0.95)", error:"rgba(192,57,43,0.95)", info:"rgba(41,128,185,0.95)", warn:"rgba(230,126,34,0.95)" };
  return (
    <div style={{ position:"fixed", bottom:16, right:16, left:16, zIndex:9999, display:"flex", flexDirection:"column", gap:8, alignItems:"flex-end" }}>
      {toasts.map((t) => (
        <div key={t.id} onClick={() => remove(t.id)}
          style={{ background:colors[t.type]||colors.info, color:"#fff", padding:"12px 20px", borderRadius:10, fontSize:13, fontFamily:"Inter,sans-serif", boxShadow:"0 4px 20px rgba(0,0,0,0.4)", display:"flex", alignItems:"center", gap:10, minWidth:220, maxWidth:360, width:"100%", cursor:"pointer", animation:"slideIn 0.3s ease", boxSizing:"border-box" }}>
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
    <div onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.78)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#0a1f0d", border:"1px solid rgba(212,175,55,0.3)", borderRadius:16, width:"100%", maxWidth:wide?720:500, maxHeight:"92vh", overflow:"auto", boxShadow:"0 24px 70px rgba(0,0,0,0.7)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 20px 14px", borderBottom:"1px solid rgba(212,175,55,0.15)" }}>
          <span style={{ fontFamily:"Cinzel,serif", color:"#D4AF37", fontSize:15, letterSpacing:1 }}>{title}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#7fa86b", cursor:"pointer", fontSize:22, lineHeight:1 }}>✕</button>
        </div>
        <div style={{ padding:"20px" }}>{children}</div>
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
    <span style={{ background:s.bg, border:`1px solid ${s.bd}`, color:s.c, borderRadius:6, padding:"2px 10px", fontSize:11, fontWeight:600, flexShrink:0 }}>{s.l}</span>
  );
}

// ─── STAT CARD ───────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${color}25`, borderRadius:14, padding:"18px 20px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:color, opacity:0.6 }} />
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div style={{ minWidth:0 }}>
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
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        <button onClick={onYes} style={{ ...BTN.danger, flex:1, minWidth:120 }}>Ha, tasdiqlash</button>
        <button onClick={onNo}  style={{ ...BTN.ghost,  flex:1, minWidth:120 }}>Bekor qilish</button>
      </div>
    </Modal>
  );
}

// ─── SEARCH BAR ──────────────────────────────────────────────────────────────
function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ position:"relative", flex:1, minWidth:160, maxWidth:300 }}>
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
// tables — listenTables() dan keladigan massiv: [{id, zone, capacity, paid, priceTag, status, shots}]
// ════════════════════════════════════════════════════════════════════════════
function Dashboard({ admins, waiters, categories, menu, orders, tables }) {
  const tablesArr = Array.isArray(tables) ? tables : [];
  const aCount     = Object.keys(admins || {}).length;
  const wActive    = Object.values(waiters || {}).filter((w) => w.status === "active").length;
  const mActive    = Object.values(menu || {}).filter((m) => m.status === "active").length;
  const cCount     = Object.keys(categories || {}).length;
  const oList      = Object.values(orders || {});
  const todayList  = oList.filter((o) => o.date === today());
  const todayTotal = todayList.reduce((s, o) => s + (o.total || 0), 0);

  const tFree = tablesArr.filter((t) => t.status === "free").length;
  const tBusy = tablesArr.filter((t) => t.status === "busy").length;
  const tBill = tablesArr.filter((t) => t.status === "bill").length;
  const activeShots = tablesArr.flatMap((t) =>
    (t.shots || []).filter((s) => s.status === "new" || s.status === "preparing")
  );
  const sorted = sortTables(tablesArr);

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:14, marginBottom:22 }}>
        <StatCard icon={IC.money}   label="Bugungi tushum"    value={fmt(todayTotal)}                       sub={`${todayList.length} ta buyurtma`}               color="#D4AF37"/>
        <StatCard icon={IC.order}   label="Jami buyurtmalar"  value={oList.length + " ta"}                  sub={`Bugun: ${todayList.length} ta`}                 color="#27ae60"/>
        <StatCard icon={IC.admin}   label="Adminlar"          value={aCount + " ta"}                        sub="Ro'yxatdagi adminlar"                            color="#9b59b6"/>
        <StatCard icon={IC.waiter}  label="Ofitsiantlar"      value={wActive + " faol"}                     sub={`Jami: ${Object.keys(waiters||{}).length} ta`}  color="#3498db"/>
        <StatCard icon={IC.food}    label="Faol menyu"        value={mActive + " ta"}                       sub={`${cCount} ta kategoriya`}                      color="#e67e22"/>
        <StatCard icon={IC.table}   label="Stollar holati"    value={`${tBusy} band / ${tFree} bo'sh`}      sub={`${tBill} ta hisob kutmoqda`}                   color="#e91e63"/>
        <StatCard icon={IC.kitchen} label="Aktiv shotlar"     value={activeShots.length + " ta"}            sub="Tayyorlanmoqda / Yangi"                         color="#1abc9c"/>
        <StatCard icon={IC.stats}   label="Jami tushum"       value={fmt(oList.reduce((s,o)=>s+(o.total||0),0))} sub="Barcha vaqt uchun"                        color="#f39c12"/>
      </div>

      <div style={{ ...CARD, marginBottom:16 }}>
        <div style={CARD_HDR}>
          <span style={CARD_TTL}>Stollar real-time holati</span>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {[["Bo'sh","#2ecc71",tFree],["Band","#e67e22",tBusy],["Hisob","#D4AF37",tBill]].map(([l,c,v])=>(
              <span key={l} style={{ background:`${c}15`, border:`1px solid ${c}40`, borderRadius:20, padding:"3px 12px", color:c, fontSize:11 }}>{l}: {v}</span>
            ))}
          </div>
        </div>

        {sorted.length === 0 ? (
          <div style={{ color:"#3d5c38", textAlign:"center", padding:20, fontSize:13 }}>Hali stol topilmadi</div>
        ) : (
          ZONES_CONFIG.map((zc) => {
            const zoneTables = sorted.filter((t) => t.zone === zc.zone);
            if (zoneTables.length === 0) return null;
            return (
              <div key={zc.zone} style={{ marginBottom:16 }}>
                <div style={{ color:"#86B054", fontSize:11, letterSpacing:1, marginBottom:8, textTransform:"uppercase", display:"flex", alignItems:"center", gap:6 }}>
                  {zc.zone} zona {zc.paid && <span title="Pullik zona">🥂</span>}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(72px,1fr))", gap:8 }}>
                  {zoneTables.map((t) => {
                    const c = t.status === "free" ? "#2ecc71" : t.status === "busy" ? "#e67e22" : "#D4AF37";
                    const shots = t.shots || [];
                    return (
                      <div key={t.id} style={{ height:70, borderRadius:10, background:`${c}10`, border:`2px solid ${c}40`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, position:"relative" }}>
                        <span style={{ color:"#e8f5e0", fontSize:13, fontWeight:700, fontFamily:"Cinzel,serif" }}>{t.id}</span>
                        <span style={{ color:c, fontSize:9, fontWeight:600 }}>
                          {t.status === "free" ? "Bo'sh" : t.status === "busy" ? "Band" : "Hisob"}
                        </span>
                        {shots.length > 0 && (
                          <div style={{ position:"absolute", top:4, right:4, width:16, height:16, borderRadius:"50%", background:"#D4AF37", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <span style={{ color:"#0a1f0d", fontSize:9, fontWeight:700 }}>{shots.length}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
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
                {[...oList].reverse().slice(0,10).map((o, i) => (
                  <tr key={i} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding:"10px 12px", color:"#D4AF37", fontSize:11, fontFamily:"Cinzel,serif" }}>#{i+1}</td>
                    <td style={{ padding:"10px 12px", color:"#e8f5e0", fontSize:13 }}>{o.table||"—"}</td>
                    <td style={{ padding:"10px 12px", color:"#86B054", fontSize:13 }}>{o.waiterName||"—"}</td>
                    <td style={{ padding:"10px 12px", color:"#D4AF37", fontSize:13, fontWeight:600 }}>{fmt(o.total)}</td>
                    <td style={{ padding:"10px 12px", color:"#4a7a40", fontSize:11 }}>{o.date||"—"}</td>
                    <td style={{ padding:"10px 12px", color:"#4a7a40", fontSize:11 }}>{o.time||"—"}</td>
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
// TABLE MANAGER — Stollar tableData.js orqali belgilanadi (zona/soni/sig'im).
// Bu yerda faqat: zona bo'yicha ko'rish, live holat, sig'im override va
// majburiy tozalash mavjud. Yangi stol/zona qo'shish uchun tableData.js
// faylini tahrirlash kerak.
// ════════════════════════════════════════════════════════════════════════════
function TableManager({ tables, toast }) {
  const [confirmReset, setConfirmReset] = useState(null);
  const [viewTable,    setViewTable]    = useState(null);
  const [capModal,     setCapModal]     = useState(null); // {id, capacity}
  const [zone,         setZone]         = useState("all");
  const [saving,       setSaving]       = useState(false);

  const tablesArr = Array.isArray(tables) ? tables : [];
  const allZones  = ZONES_CONFIG.map((z) => z.zone);

  const filtered = zone === "all" ? tablesArr : tablesArr.filter((t) => t.zone === zone);
  const sorted   = sortTables(filtered);

  const counts = {
    total: tablesArr.length,
    free:  tablesArr.filter((t) => t.status === "free").length,
    busy:  tablesArr.filter((t) => t.status === "busy").length,
    bill:  tablesArr.filter((t) => t.status === "bill").length,
  };

  const statusColor = { free:"#2ecc71", busy:"#e67e22", bill:"#D4AF37" };
  const statusLabel = { free:"Bo'sh",   busy:"Band",    bill:"Hisob"   };

  const forceReset = async (id) => {
    try {
      await dbUpdate(`tables/${id}`, { status:"free", shots:[] });
      toast(`Stol ${id} tozalandi ✓`, "success");
      setViewTable(null);
    } catch (e) { toast("Xatolik: "+e.message,"error"); }
    setConfirmReset(null);
  };

  const saveCapacity = async () => {
    if (!capModal) return;
    const cap = parseInt(capModal.capacity);
    if (isNaN(cap) || cap <= 0) { toast("Sig'im noto'g'ri","error"); return; }
    setSaving(true);
    try {
      await dbUpdate(`tables/${capModal.id}`, { capacity: cap });
      toast(`Stol ${capModal.id} sig'imi yangilandi ✓`, "success");
      setCapModal(null);
    } catch (e) { toast("Xatolik: "+e.message,"error"); }
    setSaving(false);
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid-4" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:18 }}>
        {[["Jami",counts.total,"#D4AF37"],["Bo'sh",counts.free,"#2ecc71"],["Band",counts.busy,"#e67e22"],["Hisob",counts.bill,"#D4AF37"]].map(([l,v,c])=>(
          <div key={l} style={{ background:`${c}10`, border:`1px solid ${c}30`, borderRadius:12, padding:"14px", textAlign:"center" }}>
            <div style={{ color:c, fontSize:24, fontWeight:700, fontFamily:"Cinzel,serif" }}>{v}</div>
            <div style={{ color:"#7fa86b", fontSize:11, marginTop:2 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div style={{ background:"rgba(39,174,96,0.08)", border:"1px solid rgba(39,174,96,0.25)", borderRadius:10, padding:"10px 16px", marginBottom:14, fontSize:12, color:"#2ecc71", display:"flex", alignItems:"flex-start", gap:8 }}>
        <span>✓</span>
        <span>Stollar <code style={{ background:"rgba(0,0,0,0.2)", borderRadius:4, padding:"1px 6px" }}>tableData.js</code> faylida belgilangan (zona, soni, sig'imi), holati esa Firebase <code style={{ background:"rgba(0,0,0,0.2)", borderRadius:4, padding:"1px 6px" }}>tables/</code> orqali real-time keladi. Yangi zona/stol qo'shish yoki sonini o'zgartirish uchun <code style={{ background:"rgba(0,0,0,0.2)", borderRadius:4, padding:"1px 6px" }}>tableData.js</code> faylini tahrirlang.</span>
      </div>

      {/* Bisetka info */}
      {ZONES_CONFIG.some((z) => z.paid) && (
        <div style={{ background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"12px 16px", marginBottom:18, display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <span style={{ fontSize:22 }}>🥂</span>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ color:"#D4AF37", fontSize:13, fontWeight:600, fontFamily:"Cinzel,serif" }}>Basseyn — Bisetka narxi</div>
            <div style={{ color:"#86B054", fontSize:12, marginTop:2 }}>{BISETKA_INFO.includes} · Servis haqi {BISETKA_INFO.serviceFeePercent}%</div>
          </div>
          <div style={{ color:"#D4AF37", fontSize:15, fontWeight:700, fontFamily:"Cinzel,serif" }}>{fmt(BISETKA_INFO.price)}</div>
        </div>
      )}

      {/* Zone filter */}
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        {["all", ...allZones].map((z) => (
          <button key={z} onClick={() => setZone(z)} style={{
            padding:"6px 14px", borderRadius:20, cursor:"pointer", fontSize:12,
            background: zone===z ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.04)",
            border:     zone===z ? "1px solid rgba(212,175,55,0.5)" : "1px solid rgba(134,176,84,0.2)",
            color:      zone===z ? "#D4AF37" : "#7fa86b",
          }}>
            {z === "all" ? "Barcha" : z} zona
          </button>
        ))}
      </div>

      {/* Grid */}
      {sorted.length === 0 ? (
        <div style={{ color:"#3d5c38", textAlign:"center", padding:48, fontSize:14 }}>Bu zonada stol yo'q</div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10 }}>
          {sorted.map((t) => {
            const c = statusColor[t.status] || "#2ecc71";
            const shots = t.shots || [];
            const totalItems = shots.reduce((s,sh)=>s+(sh.items||[]).reduce((ss,i)=>ss+i.qty,0),0);
            const totalAmt   = shots.reduce((s,sh)=>s+(sh.items||[]).reduce((ss,i)=>ss+i.price*i.qty,0),0);
            return (
              <div key={t.id}
                style={{ background:`${c}08`, border:`2px solid ${c}35`, borderRadius:12, padding:"12px 10px", position:"relative", cursor:"pointer" }}
                onClick={() => setViewTable(t)}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                  <span style={{ fontFamily:"Cinzel,serif", color:"#e8f5e0", fontSize:15, fontWeight:700 }}>{t.id}</span>
                  {shots.length > 0 && (
                    <div style={{ width:18, height:18, borderRadius:"50%", background:"#D4AF37", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <span style={{ color:"#0a1f0d", fontSize:10, fontWeight:700 }}>{shots.length}</span>
                    </div>
                  )}
                </div>
                <div style={{ color:"#4a7a40", fontSize:10, marginBottom:4 }}>{t.zone} · {t.capacity} o'rin</div>
                <div style={{ color:c, fontSize:11, fontWeight:600, marginBottom:4 }}>{statusLabel[t.status]||"Bo'sh"}</div>
                {t.paid && (
                  <div style={{ color:"#D4AF37", fontSize:10, marginBottom:4 }}>🥂 {t.priceTag||"Pullik"}</div>
                )}
                {totalItems > 0 && (
                  <div style={{ color:"#D4AF37", fontSize:10 }}>{totalItems} ta · {fmt(totalAmt)}</div>
                )}
                <div style={{ display:"flex", gap:4, marginTop:8 }} onClick={(e)=>e.stopPropagation()}>
                  <button onClick={()=>setCapModal({ id:t.id, capacity:String(t.capacity) })}
                    style={{ flex:1, background:"rgba(212,175,55,0.12)", border:"1px solid rgba(212,175,55,0.3)", borderRadius:6, color:"#D4AF37", fontSize:11, padding:"4px", cursor:"pointer" }}>✎ Sig'im</button>
                  {t.status !== "free" && (
                    <button onClick={()=>setConfirmReset(t.id)}
                      style={{ flex:1, background:"rgba(192,57,43,0.12)", border:"1px solid rgba(192,57,43,0.3)", borderRadius:6, color:"#e74c3c", fontSize:11, padding:"4px", cursor:"pointer" }}>Tozalash</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stol detail modal */}
      {viewTable && (() => {
        const latest = tablesArr.find((x) => x.id === viewTable.id) || viewTable;
        const shots  = latest.shots || [];
        const total  = shots.reduce((s,sh)=>(sh.items||[]).reduce((ss,i)=>ss+i.price*i.qty,s),0);
        return (
          <Modal title={`Stol ${latest.id} — batafsil`} onClose={() => setViewTable(null)}>
            <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
              {[["Zona",latest.zone,null],["Holat",null,latest.status],["Shotlar",shots.length,null],["Jami",fmt(total),null]].map(([lbl,val,badgeSt])=>(
                <div key={lbl} style={{ flex:"1 1 100px", minWidth:100, background:"rgba(255,255,255,0.03)", borderRadius:10, padding:"12px", textAlign:"center" }}>
                  <div style={{ color:"#7fa86b", fontSize:11 }}>{lbl}</div>
                  {badgeSt ? <Badge status={badgeSt}/> : <div style={{ color:"#D4AF37", fontSize:16, fontWeight:700, marginTop:4 }}>{val}</div>}
                </div>
              ))}
            </div>
            {latest.paid && (
              <div style={{ background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:12, color:"#D4AF37" }}>
                🥂 {latest.priceTag||"Pullik joy"} · {BISETKA_INFO.includes} · {fmt(BISETKA_INFO.price)}
              </div>
            )}
            {shots.length > 0 && (
              <div style={{ marginBottom:16 }}>
                <div style={{ color:"#D4AF37", fontSize:11, letterSpacing:1, marginBottom:8 }}>SHOTLAR</div>
                {shots.map((sh,i)=>{
                  const st=(sh.items||[]).reduce((s,it)=>s+it.price*it.qty,0);
                  return (
                    <div key={sh.id||i} style={{ background:"rgba(255,255,255,0.03)", borderRadius:8, padding:"10px 14px", marginBottom:6, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:6 }}>
                      <div>
                        <span style={{ color:"#e8f5e0", fontSize:13 }}>Shot #{i+1}</span>
                        <span style={{ color:"#4a7a40", fontSize:11, marginLeft:8 }}>{(sh.items||[]).reduce((s,it)=>s+it.qty,0)} ta mahsulot</span>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <Badge status={sh.status||"new"}/>
                        <span style={{ color:"#D4AF37", fontSize:13, fontWeight:700 }}>{fmt(st)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {latest.status !== "free" && (
              <button onClick={()=>forceReset(latest.id)} style={{ ...BTN.danger, width:"100%" }}>
                ⚠ Stolni majburiy tozalash (bo'sh qilish)
              </button>
            )}
          </Modal>
        );
      })()}

      {/* Capacity edit modal */}
      {capModal && (
        <Modal title={`Stol ${capModal.id} — sig'imni o'zgartirish`} onClose={()=>setCapModal(null)}>
          <Field label="O'rinlar soni" value={capModal.capacity}
            onChange={(v)=>setCapModal((p)=>({ ...p, capacity:v }))} type="number" placeholder="4" required/>
          <div style={{ display:"flex", gap:12 }}>
            <button style={{ ...BTN.gold, flex:1, opacity:saving?0.7:1 }} onClick={saveCapacity} disabled={saving}>
              {saving?"Saqlanmoqda...":"Saqlash"}
            </button>
            <button style={{ ...BTN.ghost, flex:1 }} onClick={()=>setCapModal(null)}>Bekor</button>
          </div>
        </Modal>
      )}

      {confirmReset && (
        <Confirm
          msg={`Stol "${confirmReset}" ni tozalamoqchimisiz? Barcha shotlar o'chiriladi va stol bo'sh holatga o'tadi.`}
          onYes={() => forceReset(confirmReset)}
          onNo={() => setConfirmReset(null)}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ORDERS MONITOR
// ════════════════════════════════════════════════════════════════════════════
function OrdersMonitor({ tables, toast }) {
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedShot, setSelectedShot] = useState(null);

  const tablesArr = Array.isArray(tables) ? tables : [];

  const SHOT_STATUSES = ["new","preparing","ready","delivered"];
  const STATUS_COLORS = { new:"#3498db", preparing:"#e67e22", ready:"#2ecc71", delivered:"#7f8c8d" };
  const STATUS_LABELS = { new:"Yangi", preparing:"Tayyorlanmoqda", ready:"Tayyor", delivered:"Yetkazildi" };
  const STATUS_ICONS  = { new:"🆕", preparing:"👨‍🍳", ready:"✅", delivered:"🚀" };

  const activeShots = [];
  tablesArr.forEach((t) => {
    (t.shots||[]).forEach((shot) => {
      activeShots.push({ tableId:t.id, tableZone:t.zone||"", shot });
    });
  });

  const filtered = filterStatus === "all"
    ? activeShots
    : activeShots.filter((a) => (a.shot.status||"new") === filterStatus);

  const countsByStatus = SHOT_STATUSES.reduce((acc,s) => {
    acc[s] = activeShots.filter((a)=>(a.shot.status||"new")===s).length;
    return acc;
  }, {});

  const updateShotStatus = async (tableId, shotId, newStatus) => {
    const t = tablesArr.find((x) => x.id === tableId);
    if (!t) return;
    const newShots = (t.shots||[]).map((sh) => sh.id===shotId ? { ...sh, status:newStatus } : sh);
    try {
      await dbUpdate(`tables/${tableId}`, { shots:newShots });
      toast(`Shot holati: ${STATUS_LABELS[newStatus]} ✓`, "success");
      setSelectedShot(null);
    } catch (e) { toast("Xatolik: "+e.message,"error"); }
  };

  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap" }}>
        <button onClick={()=>setFilterStatus("all")} style={{
          padding:"8px 16px", borderRadius:20, cursor:"pointer", fontSize:12,
          background: filterStatus==="all"?"rgba(212,175,55,0.2)":"rgba(255,255,255,0.04)",
          border:     filterStatus==="all"?"1px solid rgba(212,175,55,0.5)":"1px solid rgba(134,176,84,0.2)",
          color:      filterStatus==="all"?"#D4AF37":"#7fa86b",
        }}>
          Hammasi ({activeShots.length})
        </button>
        {SHOT_STATUSES.map((s) => (
          <button key={s} onClick={()=>setFilterStatus(s)} style={{
            padding:"8px 16px", borderRadius:20, cursor:"pointer", fontSize:12,
            background: filterStatus===s?`${STATUS_COLORS[s]}20`:"rgba(255,255,255,0.04)",
            border:     filterStatus===s?`1px solid ${STATUS_COLORS[s]}60`:"1px solid rgba(134,176,84,0.2)",
            color:      filterStatus===s?STATUS_COLORS[s]:"#7fa86b",
          }}>
            {STATUS_ICONS[s]} {STATUS_LABELS[s]} ({countsByStatus[s]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ color:"#3d5c38", textAlign:"center", padding:60, fontSize:14 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🍽️</div>
          <div>{filterStatus==="all"?"Hozirda aktiv buyurtma yo'q":"Bu statusda buyurtma yo'q"}</div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
          {filtered.map(({ tableId, tableZone, shot }) => {
            const shotTotal = (shot.items||[]).reduce((s,i)=>s+i.price*i.qty,0);
            const status    = shot.status||"new";
            const c         = STATUS_COLORS[status];
            return (
              <div key={`${tableId}-${shot.id}`}
                style={{ background:`${c}08`, border:`1px solid ${c}35`, borderRadius:14, padding:"16px 18px", cursor:"pointer" }}
                onClick={()=>setSelectedShot({ tableId, shotId:shot.id, shot })}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10, flexWrap:"wrap", gap:6 }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ fontFamily:"Cinzel,serif", color:"#e8f5e0", fontSize:15, fontWeight:700 }}>Stol {tableId}</div>
                      <span style={{ color:"#4a7a40", fontSize:11 }}>{tableZone} zona</span>
                    </div>
                    <div style={{ color:"#4a7a40", fontSize:11, marginTop:2 }}>{shot.createdAt||""}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <Badge status={status}/>
                    <div style={{ color:"#D4AF37", fontSize:13, fontWeight:700, marginTop:4 }}>{fmt(shotTotal)}</div>
                  </div>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
                  {(shot.items||[]).map((item,i) => (
                    <div key={i} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:6, padding:"4px 10px", fontSize:11, color:"#e8f5e0", display:"flex", alignItems:"center", gap:5 }}>
                      {item.image && item.image.startsWith("data:") ? (
                        <img src={item.image} alt="" style={{ width:16, height:16, borderRadius:3, objectFit:"cover" }}/>
                      ) : (
                        <span>{item.emoji||item.image||"🍽️"}</span>
                      )}
                      <span>{item.name}</span>
                      <span style={{ color:"#D4AF37", fontWeight:700 }}>×{item.qty}</span>
                      {item.note && <span style={{ color:"#e67e22", fontSize:10 }}>📝</span>}
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", gap:5 }} onClick={(e)=>e.stopPropagation()}>
                  {SHOT_STATUSES.filter((s)=>s!==status).map((s)=>(
                    <button key={s} onClick={()=>updateShotStatus(tableId,shot.id,s)}
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

      {selectedShot && (
        <Modal title={`Stol ${selectedShot.tableId} — Shot batafsil`} onClose={()=>setSelectedShot(null)}>
          <div style={{ marginBottom:16 }}>
            <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
              <Badge status={selectedShot.shot.status||"new"}/>
              <span style={{ color:"#4a7a40", fontSize:12 }}>{selectedShot.shot.createdAt||""}</span>
            </div>
            <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:10, overflow:"hidden" }}>
              {(selectedShot.shot.items||[]).map((item,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 16px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                  {item.image && item.image.startsWith("data:") ? (
                    <img src={item.image} alt="" style={{ width:36, height:36, borderRadius:8, objectFit:"cover", flexShrink:0 }}/>
                  ) : (
                    <span style={{ fontSize:20 }}>{item.image||"🍽️"}</span>
                  )}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ color:"#e8f5e0", fontSize:13 }}>{item.name}</div>
                    {item.note && <div style={{ color:"#e67e22", fontSize:11 }}>📝 {item.note}</div>}
                  </div>
                  <span style={{ color:"#7fa86b", fontSize:12 }}>×{item.qty}</span>
                  <span style={{ color:"#D4AF37", fontSize:13, fontWeight:700, minWidth:90, textAlign:"right" }}>{fmt(item.price*item.qty)}</span>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end", padding:"10px 0 4px", color:"#D4AF37", fontSize:14, fontWeight:700 }}>
              Jami: {fmt((selectedShot.shot.items||[]).reduce((s,i)=>s+i.price*i.qty,0))}
            </div>
          </div>
          <div style={{ color:"#D4AF37", fontSize:11, letterSpacing:1, marginBottom:10 }}>HOLATNI O'ZGARTIRISH</div>
          <div className="field-2col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {SHOT_STATUSES.map((s) => {
              const isCurrent = (selectedShot.shot.status||"new") === s;
              return (
                <button key={s} onClick={()=>!isCurrent&&updateShotStatus(selectedShot.tableId,selectedShot.shotId,s)}
                  style={{
                    padding:"12px 16px", borderRadius:10, cursor:isCurrent?"default":"pointer",
                    background:isCurrent?`${STATUS_COLORS[s]}30`:`${STATUS_COLORS[s]}10`,
                    border:isCurrent?`2px solid ${STATUS_COLORS[s]}`:`1px solid ${STATUS_COLORS[s]}50`,
                    color:STATUS_COLORS[s], fontSize:13, fontWeight:isCurrent?700:400,
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
// KITCHEN PANEL
// ════════════════════════════════════════════════════════════════════════════
function KitchenPanel({ tables, toast }) {
  const tablesArr = Array.isArray(tables) ? tables : [];

  const pendingShots = [];
  tablesArr.forEach((t) => {
    (t.shots||[]).forEach((shot) => {
      const st = shot.status||"new";
      if (st==="new"||st==="preparing") {
        pendingShots.push({ tableId:t.id, shot, st });
      }
    });
  });
  pendingShots.sort((a,b) => {
    if (a.st===b.st) return 0;
    return a.st==="new"?-1:1;
  });

  const updateStatus = async (tableId, shotId, newSt) => {
    const t = tablesArr.find((x) => x.id === tableId);
    if (!t) return;
    const newShots = (t.shots||[]).map((sh)=>sh.id===shotId?{...sh,status:newSt}:sh);
    try {
      await dbUpdate(`tables/${tableId}`, { shots:newShots });
      toast(newSt==="preparing"?"🍳 Tayyorlanmoqda!":newSt==="ready"?"✅ Tayyor!":"🚀 Yetkazildi!","success");
    } catch (e) { toast("Xatolik: "+e.message,"error"); }
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, flexWrap:"wrap", gap:10 }}>
        <div style={{ color:"#7fa86b", fontSize:13 }}>
          Oshxona navbati: <span style={{ color:"#e67e22", fontWeight:700 }}>{pendingShots.length} ta shot</span>
        </div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
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
            const isNew       = st==="new";
            const borderColor = isNew?"#3498db":"#e67e22";
            return (
              <div key={`${tableId}-${shot.id}`}
                style={{ background:`${borderColor}08`, border:`2px solid ${borderColor}50`, borderRadius:14, padding:"18px", position:"relative" }}>
                {isNew && (
                  <div style={{ position:"absolute", top:-1, right:-1, background:"#3498db", borderRadius:"0 14px 0 8px", padding:"3px 10px", fontSize:10, color:"#fff", fontWeight:700 }}>
                    YANGI
                  </div>
                )}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <div style={{ fontFamily:"Cinzel,serif", color:"#e8f5e0", fontSize:16, fontWeight:700 }}>Stol {tableId}</div>
                  <div style={{ color:"#4a7a40", fontSize:12 }}>{shot.createdAt||""}</div>
                </div>
                <div style={{ marginBottom:14 }}>
                  {(shot.items||[]).map((item,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                      {item.image && item.image.startsWith("data:") ? (
                        <img src={item.image} alt="" style={{ width:36, height:36, borderRadius:8, objectFit:"cover", flexShrink:0 }}/>
                      ) : (
                        <span style={{ fontSize:22, minWidth:30 }}>{item.image||"🍽️"}</span>
                      )}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ color:"#e8f5e0", fontSize:14, fontWeight:600 }}>{item.name}</div>
                        {item.note && <div style={{ color:"#e67e22", fontSize:11, marginTop:2 }}>📝 {item.note}</div>}
                      </div>
                      <div style={{ background:"rgba(212,175,55,0.2)", border:"1px solid rgba(212,175,55,0.4)", borderRadius:8, padding:"4px 12px", color:"#D4AF37", fontSize:16, fontWeight:700 }}>
                        ×{item.qty}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  {isNew ? (
                    <button onClick={()=>updateStatus(tableId,shot.id,"preparing")}
                      style={{ flex:1, background:"rgba(230,126,34,0.25)", border:"1px solid rgba(230,126,34,0.5)", borderRadius:10, color:"#e67e22", fontSize:13, padding:"12px", cursor:"pointer", fontWeight:600 }}>
                      👨‍🍳 Tayyorlashni boshlash
                    </button>
                  ) : (
                    <button onClick={()=>updateStatus(tableId,shot.id,"ready")}
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
// ADMIN MANAGER
// ════════════════════════════════════════════════════════════════════════════
function AdminManager({ admins, toast, isSuperAdmin }) {
  const adminsObj = admins && typeof admins === "object" ? admins : {};
  const [modal,   setModal]   = useState(null);
  const [search,  setSearch]  = useState("");
  const [confirm, setConfirm] = useState(null);
  const [showP,   setShowP]   = useState([]);
  const [saving,  setSaving]  = useState(false);
  const blank = { name:"", username:"", password:"", email:"", phone:"", status:"active" };
  const [form, setForm] = useState(blank);
  const f = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  const list = Object.entries(adminsObj).filter(([,a]) =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.username?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd  = () => { setForm(blank); setModal("add"); };
  const openEdit = ([id, a]) => { setForm({ ...a, id }); setModal("edit"); };

  const save = async () => {
    if (!form.name||!form.username||!form.password) { toast("Barcha majburiy maydonlarni to'ldiring","error"); return; }
    setSaving(true);
    try {
      if (modal==="add") {
        if (Object.values(adminsObj).find((a)=>a.username===form.username)) { toast("Bu username band","error"); setSaving(false); return; }
        const id = "adm_"+uid();
        await dbSet(`admins/${id}`, { ...form, createdAt:today(), lastLogin:"—" });
        toast("Admin qo'shildi ✓","success");
      } else {
        const { id, ...data } = form;
        await dbUpdate(`admins/${id}`, data);
        toast("Admin yangilandi ✓","success");
      }
      setModal(null);
    } catch { toast("Firebase xatoligi","error"); }
    setSaving(false);
  };

  const del = async (id) => {
    try { await dbRemove(`admins/${id}`); toast("Admin o'chirildi","success"); }
    catch { toast("Xatolik","error"); }
    setConfirm(null);
  };

  const toggle = async (id, cur) => {
    try { await dbUpdate(`admins/${id}`, { status: cur==="active"?"blocked":"active" }); toast("Status yangilandi","info"); }
    catch { toast("Xatolik","error"); }
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, gap:12, flexWrap:"wrap" }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Admin qidirish..."/>
        {isSuperAdmin && <button style={BTN.gold} onClick={openAdd}>+ Admin qo'shish</button>}
      </div>

      {list.length === 0 && (
        <div style={{ color:"#3d5c38", textAlign:"center", padding:48, fontSize:14 }}>
          {Object.keys(adminsObj).length===0?"Hali admin qo'shilmagan":"Admin topilmadi"}
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {list.map(([id, a]) => (
          <div key={id} style={{ ...CARD, display:"flex", alignItems:"center", gap:14, flexWrap:"wrap", padding:"14px 18px" }}>
            <div style={{ width:42, height:42, borderRadius:10, background:"linear-gradient(135deg,#1a3a1a,#0f2a10)", border:"1px solid rgba(212,175,55,0.3)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Icon d={IC.admin} color="#D4AF37" size={20}/>
            </div>
            <div style={{ flex:1, minWidth:140 }}>
              <div style={{ color:"#e8f5e0", fontWeight:600, fontSize:14 }}>{a.name}</div>
              <div style={{ color:"#7fa86b", fontSize:12 }}>@{a.username} · {a.email||"—"}</div>
              <div style={{ color:"#4a7a40", fontSize:11, marginTop:2 }}>{a.phone||"—"} · Qo'shilgan: {a.createdAt||"—"}</div>
            </div>
            <div style={{ textAlign:"center", minWidth:90 }}>
              <div style={{ color:"#4a7a40", fontSize:9, marginBottom:3 }}>PAROL</div>
              <div style={{ color:"#D4AF37", fontSize:12, cursor:"pointer" }}
                onClick={()=>setShowP((p)=>p.includes(id)?p.filter((x)=>x!==id):[...p,id])}>
                {showP.includes(id)?a.password:"••••••••"}
              </div>
            </div>
            <div style={{ textAlign:"center", minWidth:90 }}>
              <div style={{ color:"#4a7a40", fontSize:9, marginBottom:3 }}>SO'NGI KIRISH</div>
              <div style={{ color:"#7fa86b", fontSize:11 }}>{a.lastLogin||"—"}</div>
            </div>
            <Badge status={a.status}/>
            {isSuperAdmin && (
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                <button style={{ ...BTN.ghost, padding:"6px 12px" }} onClick={()=>openEdit([id,a])}>✎ Tahrirlash</button>
                <button style={{ ...(a.status==="active"?BTN.warn:BTN.green), padding:"6px 12px" }} onClick={()=>toggle(id,a.status)}>
                  {a.status==="active"?"Bloklash":"Faollashtirish"}
                </button>
                <button style={{ ...BTN.danger, padding:"6px 12px" }} onClick={()=>setConfirm(id)}>✕</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={modal==="add"?"Admin qo'shish":"Admin tahrirlash"} onClose={()=>setModal(null)}>
          <div className="field-2col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
            <Field label="To'liq ism" value={form.name}     onChange={f("name")}     placeholder="Jasur Toshmatov" required/>
            <Field label="Username"   value={form.username}  onChange={f("username")} placeholder="jasur_admin"     required/>
            <Field label="Parol"      value={form.password}  onChange={f("password")} type="password"               required/>
            <Field label="Telefon"    value={form.phone}     onChange={f("phone")}    placeholder="+998901234567"/>
            <Field label="Email"      value={form.email}     onChange={f("email")}    placeholder="admin@amazonia.uz"/>
            <Field label="Status"     value={form.status}    onChange={f("status")}
              options={[{value:"active",label:"Faol"},{value:"blocked",label:"Bloklangan"}]}/>
          </div>
          <div style={{ display:"flex", gap:12, marginTop:8, flexWrap:"wrap" }}>
            <button style={{ ...BTN.gold, flex:1, minWidth:120, opacity:saving?0.7:1 }} onClick={save} disabled={saving}>
              {saving?"Saqlanmoqda...":modal==="add"?"Qo'shish":"Saqlash"}
            </button>
            <button style={{ ...BTN.ghost, flex:1, minWidth:120 }} onClick={()=>setModal(null)}>Bekor</button>
          </div>
        </Modal>
      )}
      {confirm && <Confirm msg={`"${adminsObj[confirm]?.name}" adminini o'chirmoqchimisiz?`} onYes={()=>del(confirm)} onNo={()=>setConfirm(null)}/>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// WAITER MANAGER
// ════════════════════════════════════════════════════════════════════════════
function WaiterManager({ waiters, toast }) {
  const waitersObj = waiters && typeof waiters === "object" ? waiters : {};
  const [modal,   setModal]   = useState(null);
  const [search,  setSearch]  = useState("");
  const [confirm, setConfirm] = useState(null);
  const [showP,   setShowP]   = useState([]);
  const [saving,  setSaving]  = useState(false);
  const genPass = () => "Waiter@"+Math.floor(1000+Math.random()*9000);
  const blank   = { name:"", username:"", password:"", phone:"", table:"", status:"active" };
  const [form, setForm] = useState(blank);
  const f = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  const zoneOptions = ZONES_CONFIG.map((z) => ({ value:z.zone, label:z.zone }));

  const list = Object.entries(waitersObj).filter(([,w]) =>
    w.name?.toLowerCase().includes(search.toLowerCase()) ||
    w.username?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd  = () => { setForm({ ...blank, password:genPass(), table:ZONES_CONFIG[0]?.zone||"" }); setModal("add"); };
  const openEdit = ([id, w]) => { setForm({ ...w, id }); setModal("edit"); };

  const save = async () => {
    if (!form.name||!form.username||!form.password) { toast("Majburiy maydonlarni to'ldiring","error"); return; }
    setSaving(true);
    try {
      if (modal==="add") {
        if (Object.values(waitersObj).find((w)=>w.username===form.username)) { toast("Bu username band","error"); setSaving(false); return; }
        const id = "wtr_"+uid();
        await dbSet(`waiters/${id}`, { ...form, rating:0, orders:0, createdAt:today(), lastLogin:"—" });
        toast("Ofitsiant qo'shildi ✓","success");
      } else {
        const { id, ...data } = form;
        await dbUpdate(`waiters/${id}`, data);
        toast("Yangilandi ✓","success");
      }
      setModal(null);
    } catch { toast("Firebase xatoligi","error"); }
    setSaving(false);
  };

  const del = async (id) => {
    try { await dbRemove(`waiters/${id}`); toast("O'chirildi","success"); }
    catch { toast("Xatolik","error"); }
    setConfirm(null);
  };

  const toggle = async (id, cur) => {
    try { await dbUpdate(`waiters/${id}`, { status:cur==="active"?"blocked":"active" }); toast("Status yangilandi","info"); }
    catch { toast("Xatolik","error"); }
  };

  const resetPass = async (id) => {
    const np = genPass();
    try { await dbUpdate(`waiters/${id}`, { password:np }); toast(`Yangi parol: ${np}`,"info"); }
    catch { toast("Xatolik","error"); }
  };

  const stars = (r) => "★".repeat(Math.round(r||0))+"☆".repeat(5-Math.round(r||0));

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, gap:12, flexWrap:"wrap" }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Ofitsiant qidirish..."/>
        <button style={BTN.gold} onClick={openAdd}>+ Ofitsiant qo'shish</button>
      </div>

      {list.length === 0 && (
        <div style={{ color:"#3d5c38", textAlign:"center", padding:48 }}>
          {Object.keys(waitersObj).length===0?"Hali ofitsiant qo'shilmagan":"Topilmadi"}
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:12 }}>
        {list.map(([id, w]) => (
          <div key={id} style={{ ...CARD, padding:"16px 18px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12, flexWrap:"wrap", gap:8 }}>
              <div style={{ display:"flex", gap:10 }}>
                <div style={{ width:42, height:42, borderRadius:10, background:w.status==="active"?"rgba(39,174,96,0.15)":"rgba(192,57,43,0.15)", border:`1px solid ${w.status==="active"?"rgba(39,174,96,0.4)":"rgba(192,57,43,0.4)"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Icon d={IC.waiter} color={w.status==="active"?"#2ecc71":"#e74c3c"} size={20}/>
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ color:"#e8f5e0", fontWeight:600, fontSize:14 }}>{w.name}</div>
                  <div style={{ color:"#7fa86b", fontSize:12 }}>@{w.username}</div>
                  <div style={{ color:"#f39c12", fontSize:12 }}>{stars(w.rating)} {(w.rating||0).toFixed(1)}</div>
                </div>
              </div>
              <Badge status={w.status}/>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:10 }}>
              {[["Telefon",w.phone||"—"],["Zona",w.table||"—"],["Buyurtmalar",(w.orders||0)+" ta"],["Qo'shilgan",w.createdAt||"—"]].map(([k,v])=>(
                <div key={k} style={{ background:"rgba(255,255,255,0.03)", borderRadius:6, padding:"5px 9px" }}>
                  <div style={{ color:"#4a7a40", fontSize:9 }}>{k.toUpperCase()}</div>
                  <div style={{ color:"#e8f5e0", fontSize:12, marginTop:1 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,0.03)", borderRadius:6, padding:"6px 10px", marginBottom:10, flexWrap:"wrap", gap:6 }}>
              <div>
                <div style={{ color:"#4a7a40", fontSize:9 }}>PAROL</div>
                <div style={{ color:"#D4AF37", fontSize:13, cursor:"pointer" }}
                  onClick={()=>setShowP((p)=>p.includes(id)?p.filter((x)=>x!==id):[...p,id])}>
                  {showP.includes(id)?w.password:"••••••••"}
                </div>
              </div>
              <button style={{ ...BTN.ghost, padding:"4px 10px", fontSize:11 }} onClick={()=>resetPass(id)}>
                🔄 Yangi parol
              </button>
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              <button style={{ ...BTN.ghost, flex:1, minWidth:90, padding:"7px" }} onClick={()=>openEdit([id,w])}>✎ Tahrirlash</button>
              <button style={{ ...(w.status==="active"?BTN.warn:BTN.green), flex:1, minWidth:90, padding:"7px" }} onClick={()=>toggle(id,w.status)}>
                {w.status==="active"?"Bloklash":"Faollashtirish"}
              </button>
              <button style={{ ...BTN.danger, padding:"7px 12px" }} onClick={()=>setConfirm(id)}>✕</button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={modal==="add"?"Ofitsiant qo'shish":"Ofitsiant tahrirlash"} onClose={()=>setModal(null)}>
          <div className="field-2col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
            <Field label="To'liq ism"  value={form.name}     onChange={f("name")}     placeholder="Bobur Yusupov" required/>
            <Field label="Username"    value={form.username}  onChange={f("username")} placeholder="bobur_waiter"  required/>
            <Field label="Parol"       value={form.password}  onChange={f("password")} required/>
            <Field label="Telefon"     value={form.phone}     onChange={f("phone")}    placeholder="+998901234567"/>
            <Field label="Stol zonasi" value={form.table}     onChange={f("table")}    options={zoneOptions}/>
            <Field label="Status"      value={form.status}    onChange={f("status")}
              options={[{value:"active",label:"Faol"},{value:"blocked",label:"Bloklangan"}]}/>
          </div>
          {modal==="add" && (
            <div style={{ background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.3)", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:12, color:"#D4AF37" }}>
              💡 Login: <b>{form.username}</b> · Parol: <b>{form.password}</b>
            </div>
          )}
          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            <button style={{ ...BTN.gold, flex:1, minWidth:120, opacity:saving?0.7:1 }} onClick={save} disabled={saving}>
              {saving?"Saqlanmoqda...":modal==="add"?"Hisob yaratish":"Saqlash"}
            </button>
            <button style={{ ...BTN.ghost, flex:1, minWidth:120 }} onClick={()=>setModal(null)}>Bekor</button>
          </div>
        </Modal>
      )}
      {confirm && <Confirm msg={`"${waitersObj[confirm]?.name}" ofitsiantni o'chirmoqchimisiz?`} onYes={()=>del(confirm)} onNo={()=>setConfirm(null)}/>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CATEGORY MANAGER
// ════════════════════════════════════════════════════════════════════════════
function CategoryManager({ categories, menu, toast }) {
  const categoriesObj = categories && typeof categories === "object" ? categories : {};
  const menuObj       = menu       && typeof menu       === "object" ? menu       : {};

  const [modal,   setModal]   = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const blank = { name:"", icon:"🍽️", color:"#27ae60", status:"active", image:"" };
  const [form, setForm] = useState(blank);
  const f = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  const EMOJIS = ["🥩","🍔","🥗","🍹","🍰","🍞","🍕","🌮","🍜","🥘","🍣","🦞","🍗","🥙","🍛","🍱","🥤","🧁","🫕","🍮","🥦","🫔","🍤","🥚","🧆"];
  const COLORS = ["#c0392b","#e67e22","#27ae60","#2980b9","#8e44ad","#d35400","#16a085","#f39c12","#1abc9c","#2c3e50","#e91e63","#00bcd4"];

  const list = Object.entries(categoriesObj);

  const openAdd  = () => { setForm(blank); setModal("add"); };
  const openEdit = ([id, c]) => { setForm({ ...c, id, image:c.image||"" }); setModal("edit"); };

  const save = async () => {
    if (!form.name) { toast("Nom kiritish shart","error"); return; }
    setSaving(true);
    try {
      if (modal==="add") {
        await dbSet(`categories/cat_${uid()}`, { ...form });
        toast("Kategoriya qo'shildi ✓","success");
      } else {
        const { id, ...data } = form;
        await dbUpdate(`categories/${id}`, data);
        toast("Yangilandi ✓","success");
      }
      setModal(null);
    } catch { toast("Firebase xatoligi","error"); }
    setSaving(false);
  };

  const del = async (id) => {
    if (Object.values(menuObj).some((m)=>m.category===id)) {
      toast("Bu kategoriyada ovqatlar bor, avval ularni o'chiring","error");
      setConfirm(null); return;
    }
    try { await dbRemove(`categories/${id}`); toast("O'chirildi","success"); }
    catch { toast("Xatolik","error"); }
    setConfirm(null);
  };

  const toggle = async (id, cur) => {
    try { await dbUpdate(`categories/${id}`, { status:cur==="active"?"hidden":"active" }); toast("Status yangilandi","info"); }
    catch { toast("Xatolik","error"); }
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
          const count = Object.values(menuObj).filter((m)=>m.category===id).length;
          return (
            <div key={id} style={{ ...CARD, padding:"16px 18px", borderLeft:`3px solid ${c.color}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                <div style={{ width:46, height:46, borderRadius:10, background:`${c.color}20`, border:`1px solid ${c.color}50`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0, overflow:"hidden" }}>
                  {c.image ? (
                    <img src={c.image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  ) : c.icon}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ color:"#e8f5e0", fontWeight:600, fontSize:14 }}>{c.name}</div>
                  <div style={{ color:"#7fa86b", fontSize:12 }}>{count} ta ovqat</div>
                </div>
                <Badge status={c.status}/>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <button style={{ ...BTN.ghost, flex:1, padding:"6px" }} onClick={()=>openEdit([id,c])}>✎</button>
                <button style={{ ...(c.status==="active"?BTN.warn:BTN.green), padding:"6px 12px" }} onClick={()=>toggle(id,c.status)}>
                  {c.status==="active"?"Yashirish":"Ko'rsatish"}
                </button>
                <button style={{ ...BTN.danger, padding:"6px 12px" }} onClick={()=>setConfirm(id)}>✕</button>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <Modal title={modal==="add"?"Kategoriya qo'shish":"Kategoriya tahrirlash"} onClose={()=>setModal(null)}>
          <Field label="Kategoriya nomi" value={form.name} onChange={f("name")} placeholder="Salatlar" required/>
          {/* Rasm yuklash */}
          <ImageUploader
            value={form.image}
            onChange={(v) => setForm((p) => ({ ...p, image:v }))}
            size={72}
            label="Kategoriya rasmi (ixtiyoriy)"
          />
          {/* Emoji fallback */}
          {!form.image && (
            <div style={{ marginBottom:14 }}>
              <label style={LBL}>EMOJI (rasm yo'q bo'lsa)</label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {EMOJIS.map((e) => (
                  <button key={e} onClick={()=>setForm((p)=>({...p,icon:e}))}
                    style={{ width:38, height:38, fontSize:18, borderRadius:8, cursor:"pointer", background:form.icon===e?"rgba(212,175,55,0.3)":"rgba(255,255,255,0.05)", border:form.icon===e?"2px solid #D4AF37":"1px solid rgba(255,255,255,0.1)" }}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div style={{ marginBottom:14 }}>
            <label style={LBL}>RANG</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {COLORS.map((c) => (
                <button key={c} onClick={()=>setForm((p)=>({...p,color:c}))}
                  style={{ width:30, height:30, borderRadius:"50%", background:c, cursor:"pointer", border:form.color===c?"3px solid #D4AF37":"2px solid transparent", transform:form.color===c?"scale(1.2)":"scale(1)", transition:"transform 0.1s" }}/>
              ))}
            </div>
          </div>
          <Field label="Status" value={form.status} onChange={f("status")}
            options={[{value:"active",label:"Faol"},{value:"hidden",label:"Yashirin"}]}/>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            <button style={{ ...BTN.gold, flex:1, minWidth:120, opacity:saving?0.7:1 }} onClick={save} disabled={saving}>
              {saving?"Saqlanmoqda...":modal==="add"?"Qo'shish":"Saqlash"}
            </button>
            <button style={{ ...BTN.ghost, flex:1, minWidth:120 }} onClick={()=>setModal(null)}>Bekor</button>
          </div>
        </Modal>
      )}
      {confirm && <Confirm msg={`"${categoriesObj[confirm]?.name}" kategoriyani o'chirmoqchimisiz?`} onYes={()=>del(confirm)} onNo={()=>setConfirm(null)}/>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MENU MANAGER — Rasm yuklash bilan
// ════════════════════════════════════════════════════════════════════════════
function MenuManager({ menu, categories, toast }) {
  const menuObj       = menu       && typeof menu       === "object" ? menu       : {};
  const categoriesObj = categories && typeof categories === "object" ? categories : {};

  const [modal,     setModal]     = useState(null);
  const [search,    setSearch]    = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterSt,  setFilterSt]  = useState("all");
  const [confirm,   setConfirm]   = useState(null);
  const [saving,    setSaving]    = useState(false);

  // image — base64 yoki "" (bo'sh)
  const blank = { name:"", category:"", price:"", description:"", status:"active", image:"", emoji:"🍽️" };
  const [form, setForm] = useState(blank);
  const f = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  const EMOJIS  = ["🥩","🍔","🥗","🍹","🍰","🍞","🍕","🌮","🍜","🥘","🍣","🦞","🍗","🥙","🍛","🍱","🥤","🧁","🫕","🍮","🍤","🥚","🧆","🫔","🥦"];
  const catList = Object.entries(categoriesObj);
  const catName = (id) => categoriesObj[id]?.name || "—";

  const list = Object.entries(menuObj).filter(([,m]) => {
    const matchS  = m.name?.toLowerCase().includes(search.toLowerCase());
    const matchC  = filterCat==="all" || m.category===filterCat;
    const matchSt = filterSt==="all"  || m.status===filterSt;
    return matchS && matchC && matchSt;
  });

  const openAdd  = () => { setForm({ ...blank, category:catList[0]?.[0]||"" }); setModal("add"); };
  const openEdit = ([id, m]) => { setForm({ ...m, price:String(m.price||""), id, image:m.image||"", emoji:m.emoji||"🍽️" }); setModal("edit"); };

  const save = async () => {
    if (!form.name||!form.category||!form.price) { toast("Majburiy maydonlarni to'ldiring","error"); return; }
    const price = parseInt(String(form.price).replace(/\D/g,""));
    if (isNaN(price)||price<0) { toast("Narx noto'g'ri","error"); return; }
    setSaving(true);
    try {
      const payload = { ...form, price, rating:0, orders:0 };
      if (modal==="add") {
        await dbSet(`menu/menu_${uid()}`, { ...payload, createdAt:today() });
        toast("Ovqat qo'shildi ✓","success");
      } else {
        const { id, ...data } = payload;
        await dbUpdate(`menu/${id}`, data);
        toast("Yangilandi ✓","success");
      }
      setModal(null);
    } catch { toast("Firebase xatoligi","error"); }
    setSaving(false);
  };

  const del = async (id) => {
    try { await dbRemove(`menu/${id}`); toast("O'chirildi","success"); }
    catch { toast("Xatolik","error"); }
    setConfirm(null);
  };

  const changeSt = async (id, st) => {
    try { await dbUpdate(`menu/${id}`, { status:st }); toast("Status yangilandi","info"); }
    catch { toast("Xatolik","error"); }
  };

  // Menyu elementini ko'rsatish uchun rasm yoki emoji
  const ItemThumb = ({ item, size=50 }) => (
    <div style={{ width:size, height:size, borderRadius:10, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.5, flexShrink:0, overflow:"hidden" }}>
      {item.image && item.image.startsWith("data:") ? (
        <img src={item.image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
      ) : (
        <span>{item.emoji||item.image||"🍽️"}</span>
      )}
    </div>
  );

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", gap:8, flex:1, flexWrap:"wrap" }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Ovqat qidirish..."/>
          <select value={filterCat} onChange={(e)=>setFilterCat(e.target.value)} style={SELECT_S}>
            <option value="all" style={{ background:"#0a1f0d" }}>Barcha kategoriya</option>
            {catList.map(([id,c])=>(
              <option key={id} value={id} style={{ background:"#0a1f0d" }}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
          <select value={filterSt} onChange={(e)=>setFilterSt(e.target.value)} style={SELECT_S}>
            <option value="all"    style={{ background:"#0a1f0d" }}>Barcha status</option>
            <option value="active" style={{ background:"#0a1f0d" }}>Faol</option>
            <option value="stop"   style={{ background:"#0a1f0d" }}>To'xtatilgan</option>
            <option value="hidden" style={{ background:"#0a1f0d" }}>Yashirin</option>
          </select>
        </div>
        <button style={BTN.gold} onClick={openAdd} disabled={catList.length===0}>
          {catList.length===0?"Avval kategoriya qo'shing":"+ Ovqat qo'shish"}
        </button>
      </div>

      <div style={{ color:"#4a7a40", fontSize:12, marginBottom:12 }}>{list.length} ta ovqat topildi</div>

      {catList.length===0 && (
        <div style={{ background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.3)", borderRadius:10, padding:"16px 20px", marginBottom:16, color:"#D4AF37", fontSize:13 }}>
          ⚠ Avval "Kategoriyalar" bo'limida kategoriya yarating.
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))", gap:12 }}>
        {list.map(([id, item]) => (
          <div key={id} style={{ ...CARD, padding:"14px 16px", opacity:item.status==="hidden"?0.55:1 }}>
            <div style={{ display:"flex", gap:12, marginBottom:10 }}>
              <ItemThumb item={item} size={56}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color:"#e8f5e0", fontWeight:600, fontSize:13, marginBottom:2 }}>{item.name}</div>
                <div style={{ color:"#7fa86b", fontSize:11, marginBottom:2 }}>{catName(item.category)}</div>
                <div style={{ color:"#D4AF37", fontSize:14, fontWeight:700 }}>{fmt(item.price)}</div>
              </div>
            </div>
            {item.description && (
              <p style={{ color:"#4a7a40", fontSize:11, marginBottom:10, lineHeight:1.5 }}>{item.description}</p>
            )}
            <div style={{ display:"flex", gap:4, marginBottom:10, flexWrap:"wrap" }}>
              {["active","stop","hidden"].map((st)=>(
                <button key={st} onClick={()=>changeSt(id,st)}
                  style={{ padding:"3px 10px", borderRadius:6, fontSize:10, cursor:"pointer", fontFamily:"Inter,sans-serif",
                    background:item.status===st?(st==="active"?"rgba(39,174,96,0.3)":st==="stop"?"rgba(230,126,34,0.3)":"rgba(100,100,100,0.3)"):"rgba(255,255,255,0.04)",
                    border:item.status===st?(st==="active"?"1px solid rgba(39,174,96,0.5)":st==="stop"?"1px solid rgba(230,126,34,0.5)":"1px solid rgba(100,100,100,0.5)"):"1px solid rgba(255,255,255,0.1)",
                    color:item.status===st?(st==="active"?"#2ecc71":st==="stop"?"#e67e22":"#95a5a6"):"#4a7a40" }}>
                  {st==="active"?"✓ Faol":st==="stop"?"⏸ Stop":"👁 Yashirin"}
                </button>
              ))}
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <button style={{ ...BTN.ghost, flex:1, padding:"6px" }} onClick={()=>openEdit([id,item])}>✎ Tahrirlash</button>
              <button style={{ ...BTN.danger, padding:"6px 12px" }} onClick={()=>setConfirm(id)}>✕</button>
            </div>
          </div>
        ))}
        {list.length===0 && Object.keys(menuObj).length>0 && (
          <div style={{ color:"#3d5c38", textAlign:"center", padding:40, gridColumn:"1/-1" }}>Natija topilmadi</div>
        )}
        {Object.keys(menuObj).length===0 && (
          <div style={{ color:"#3d5c38", textAlign:"center", padding:40, gridColumn:"1/-1" }}>Hali ovqat qo'shilmagan</div>
        )}
      </div>

      {modal && (
        <Modal title={modal==="add"?"Ovqat qo'shish":"Ovqat tahrirlash"} onClose={()=>setModal(null)} wide>
          <div className="menu-modal-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 20px" }}>
            <div>
              <Field label="Ovqat nomi"  value={form.name}        onChange={f("name")}        placeholder="Steyk Ribeye" required/>
              <Field label="Kategoriya"  value={form.category}    onChange={f("category")}
                options={catList.map(([id,c])=>({ value:id, label:`${c.icon} ${c.name}` }))} required/>
              <Field label="Narx (so'm)" value={form.price}       onChange={f("price")}       placeholder="185000" required/>
              <Field label="Status"      value={form.status}      onChange={f("status")}
                options={[{value:"active",label:"Faol"},{value:"stop",label:"Vaqtincha to'xtatilgan"},{value:"hidden",label:"Yashirin"}]}/>
              <Field label="Tavsif"      value={form.description} onChange={f("description")} type="textarea" placeholder="Ovqat haqida qisqacha..."/>
            </div>
            <div>
              {/* RASM YUKLASH */}
              <ImageUploader
                value={form.image}
                onChange={(v) => setForm((p) => ({ ...p, image:v }))}
                size={120}
                label="Ovqat rasmi"
              />
              {/* Emoji fallback — rasm yo'q bo'lganda */}
              {!form.image && (
                <div style={{ marginBottom:14 }}>
                  <label style={LBL}>EMOJI (rasm yo'q bo'lsa)</label>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                    {EMOJIS.map((e)=>(
                      <button key={e} onClick={()=>setForm((p)=>({...p,emoji:e}))}
                        style={{ width:34, height:34, fontSize:17, borderRadius:7, cursor:"pointer", background:form.emoji===e?"rgba(212,175,55,0.3)":"rgba(255,255,255,0.05)", border:form.emoji===e?"2px solid #D4AF37":"1px solid rgba(255,255,255,0.1)" }}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Preview */}
              {(form.image||form.emoji) && (
                <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(134,176,84,0.15)", borderRadius:10, padding:12 }}>
                  <div style={{ color:"#4a7a40", fontSize:10, marginBottom:8 }}>KO'RINISHI</div>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:48, height:48, borderRadius:10, overflow:"hidden", background:"rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>
                      {form.image && form.image.startsWith("data:") ? (
                        <img src={form.image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                      ) : (
                        <span>{form.emoji||"🍽️"}</span>
                      )}
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ color:"#e8f5e0", fontSize:13, fontWeight:600 }}>{form.name||"Ovqat nomi"}</div>
                      <div style={{ color:"#D4AF37", fontSize:13, fontWeight:700 }}>{form.price?fmt(parseInt(form.price)||0):"Narx"}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div style={{ display:"flex", gap:12, marginTop:16, flexWrap:"wrap" }}>
            <button style={{ ...BTN.gold, flex:1, minWidth:120, opacity:saving?0.7:1 }} onClick={save} disabled={saving}>
              {saving?"Saqlanmoqda...":modal==="add"?"Qo'shish":"Saqlash"}
            </button>
            <button style={{ ...BTN.ghost, flex:1, minWidth:120 }} onClick={()=>setModal(null)}>Bekor</button>
          </div>
        </Modal>
      )}
      {confirm && <Confirm msg={`"${menuObj[confirm]?.name}" ovqatni o'chirmoqchimisiz?`} onYes={()=>del(confirm)} onNo={()=>setConfirm(null)}/>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// STATISTICS
// ════════════════════════════════════════════════════════════════════════════
function Statistics({ orders, waiters, menu, tables }) {
  const ordersObj  = orders  && typeof orders  === "object" ? orders  : {};
  const waitersObj = waiters && typeof waiters === "object" ? waiters : {};
  const menuObj    = menu    && typeof menu    === "object" ? menu    : {};
  const tablesArr  = Array.isArray(tables) ? tables : [];

  const oList        = Object.values(ordersObj);
  const todayOrders  = oList.filter((o)=>o.date===today());
  const todayRevenue = todayOrders.reduce((s,o)=>s+(o.total||0),0);
  const totalRevenue = oList.reduce((s,o)=>s+(o.total||0),0);
  const avgCheck     = oList.length ? Math.round(totalRevenue/oList.length) : 0;

  const DAYS = ["Yak","Dush","Sesh","Chor","Pay","Jum","Shan"];
  const last7 = Array.from({ length:7 }, (_,i) => {
    const d = new Date();
    d.setDate(d.getDate()-(6-i));
    const dateStr   = d.toISOString().slice(0,10);
    const dayOrders = oList.filter((o)=>o.date===dateStr);
    return { day:DAYS[d.getDay()], date:dateStr, revenue:dayOrders.reduce((s,o)=>s+(o.total||0),0), count:dayOrders.length };
  });
  const maxRev = Math.max(...last7.map((d)=>d.revenue),1);

  const waiterStats = Object.entries(waitersObj).map(([id,w])=>{
    const wOrds = oList.filter((o)=>o.waiterId===id);
    return { ...w, id, wCount:wOrds.length, revenue:wOrds.reduce((s,o)=>s+(o.total||0),0) };
  }).sort((a,b)=>b.revenue-a.revenue);

  const topMenu = Object.entries(menuObj).map(([id,m])=>{
    const sold = oList.reduce((s,o)=>{
      const shots = o.shots||[];
      return s+shots.reduce((ss,sh)=>ss+(sh.items||[]).filter((it)=>it.id===id).reduce((sss,it)=>sss+it.qty,0),0);
    },0);
    return { ...m, id, sold };
  }).sort((a,b)=>b.sold-a.sold).slice(0,5);

  const tableRevenue = tablesArr.map((t)=>{
    const tOrds = oList.filter((o)=>o.tableId===t.id||o.table===t.id);
    return { id:t.id, zone:t.zone||"?", revenue:tOrds.reduce((s,o)=>s+(o.total||0),0), count:tOrds.length };
  }).sort((a,b)=>b.revenue-a.revenue).slice(0,8);

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:14, marginBottom:22 }}>
        <StatCard icon={IC.money} label="Bugungi tushum"   value={fmt(todayRevenue)}   sub={`${todayOrders.length} ta buyurtma`} color="#D4AF37"/>
        <StatCard icon={IC.money} label="Jami tushum"      value={fmt(totalRevenue)}   sub={`${oList.length} ta buyurtma`}       color="#27ae60"/>
        <StatCard icon={IC.order} label="O'rtacha chek"    value={fmt(avgCheck)}       sub="Jami buyurtmalar bo'yicha"            color="#3498db"/>
        <StatCard icon={IC.star}  label="Jami buyurtmalar" value={oList.length+" ta"}  sub={`Bugun: ${todayOrders.length} ta`}   color="#f39c12"/>
      </div>

      <div className="stats-row-a" style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:16, marginBottom:16 }}>
        <div style={CARD}>
          <div style={CARD_HDR}><span style={CARD_TTL}>Oxirgi 7 kun tushumi</span></div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:110, paddingBottom:4 }}>
            {last7.map((d,i)=>(
              <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                <div style={{ color:"#4a7a40", fontSize:9, minHeight:12 }}>
                  {d.revenue>0?(d.revenue>=1000000?(d.revenue/1000000).toFixed(1)+"M":Math.round(d.revenue/1000)+"K"):""}
                </div>
                <div style={{ width:"100%", background:d.date===today()?"linear-gradient(to top,#b8931f,#D4AF37)":"linear-gradient(to top,rgba(134,176,84,0.3),rgba(134,176,84,0.6))", borderRadius:"4px 4px 0 0", height:`${Math.max((d.revenue/maxRev)*80,d.revenue>0?4:2)}px`, transition:"height 0.5s" }}/>
                <div style={{ color:d.date===today()?"#D4AF37":"#4a7a40", fontSize:9, fontWeight:d.date===today()?600:400 }}>{d.day}</div>
                <div style={{ color:"#3d5c38", fontSize:8 }}>{d.count>0?d.count+"ta":""}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={CARD}>
          <div style={CARD_HDR}><span style={CARD_TTL}>Ofitsiantlar reytingi</span></div>
          {waiterStats.length===0 ? (
            <div style={{ color:"#3d5c38", textAlign:"center", padding:24, fontSize:13 }}>Hali buyurtma yo'q</div>
          ) : waiterStats.slice(0,5).map((w,i)=>(
            <div key={w.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:i<4?"1px solid rgba(255,255,255,0.05)":"none" }}>
              <div style={{ width:26, height:26, borderRadius:"50%", background:i===0?"linear-gradient(135deg,#b8931f,#D4AF37)":i===1?"rgba(192,192,192,0.2)":i===2?"rgba(205,127,50,0.2)":"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center", color:i===0?"#0a1f0d":"#7fa86b", fontSize:11, fontWeight:700, flexShrink:0 }}>{i+1}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color:"#e8f5e0", fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{w.name}</div>
                <div style={{ color:"#4a7a40", fontSize:11 }}>{w.wCount} ta buyurtma</div>
              </div>
              <div style={{ color:"#D4AF37", fontSize:12, fontWeight:600, flexShrink:0 }}>{fmt(w.revenue)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="stats-row-b" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div style={CARD}>
          <div style={CARD_HDR}><span style={CARD_TTL}>Eng ko'p buyurtma qilingan</span></div>
          {topMenu.length===0 ? (
            <div style={{ color:"#3d5c38", textAlign:"center", padding:24 }}>Ma'lumot yo'q</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {topMenu.map((m,i)=>(
                <div key={m.id} style={{ display:"flex", gap:10, alignItems:"center", padding:"8px 0", borderBottom:i<4?"1px solid rgba(255,255,255,0.05)":"none" }}>
                  <div style={{ width:26, height:26, borderRadius:"50%", background:"rgba(212,175,55,0.15)", display:"flex", alignItems:"center", justifyContent:"center", color:"#D4AF37", fontSize:11, fontWeight:700 }}>{i+1}</div>
                  <div style={{ width:32, height:32, borderRadius:8, overflow:"hidden", flexShrink:0, background:"rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>
                    {m.image && m.image.startsWith("data:") ? (
                      <img src={m.image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                    ) : <span>{m.emoji||m.image||"🍽️"}</span>}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ color:"#e8f5e0", fontSize:12, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.name}</div>
                    <div style={{ color:"#4a7a40", fontSize:11 }}>{m.sold} ta sotilgan</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={CARD}>
          <div style={CARD_HDR}><span style={CARD_TTL}>Stollar bo'yicha tushum</span></div>
          {tableRevenue.length===0 ? (
            <div style={{ color:"#3d5c38", textAlign:"center", padding:24 }}>Ma'lumot yo'q</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {tableRevenue.map((t,i)=>(
                <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:i<tableRevenue.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
                  <div style={{ width:26, height:26, borderRadius:6, background:"rgba(134,176,84,0.15)", display:"flex", alignItems:"center", justifyContent:"center", color:"#86B054", fontSize:11, fontWeight:700 }}>{t.id}</div>
                  <div style={{ flex:1, minWidth:0 }}>
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
// SETTINGS
// ════════════════════════════════════════════════════════════════════════════
function Settings({ toast, isSuperAdmin, currentUser }) {
  const [restaurant, setRestaurant] = useState({ name:"AMAZONIA", slogan:"BY ASMALD", phone:"", address:"", workStart:"10:00", workEnd:"23:00" });
  const [vip,        setVip]        = useState({ price:String(BISETKA_INFO.price), serviceFee:String(BISETKA_INFO.serviceFeePercent), description:BISETKA_INFO.includes });
  const [pass,       setPass]       = useState({ current:"", next:"", confirm:"" });
  const [saPass,     setSaPass]     = useState({ current:"", next:"", confirm:"" });
  const [loading,    setLoading]    = useState(true);
  const fp  = (k) => (v) => setPass((p)=>({...p,[k]:v}));
  const fsa = (k) => (v) => setSaPass((p)=>({...p,[k]:v}));

  useEffect(() => {
    dbGet("settings").then((data)=>{
      if (data?.restaurant) setRestaurant(data.restaurant);
      if (data?.vip)        setVip(data.vip);
      setLoading(false);
    });
  }, []);

  const saveRestaurant = async () => {
    try { await dbUpdate("settings/restaurant", restaurant); toast("Saqlandi ✓","success"); }
    catch { toast("Xatolik","error"); }
  };

  const saveVip = async () => {
    try { await dbUpdate("settings/vip", vip); toast("Saqlandi ✓ (Bisetka narxi yangilandi)","success"); }
    catch { toast("Xatolik","error"); }
  };

  const changeAdminPass = async () => {
    if (!pass.current||!pass.next||!pass.confirm) { toast("Barcha maydonlarni to'ldiring","error"); return; }
    if (pass.next!==pass.confirm) { toast("Yangi parollar mos emas","error"); return; }
    if (pass.next.length<6)       { toast("Kamida 6 belgi","error"); return; }
    try {
      const current = await dbGet(`admins/${currentUser.id}`);
      if (!current||current.password!==pass.current) { toast("Joriy parol noto'g'ri","error"); return; }
      await dbUpdate(`admins/${currentUser.id}`, { password:pass.next });
      toast("Parol yangilandi ✓","success");
      setPass({ current:"", next:"", confirm:"" });
    } catch { toast("Xatolik","error"); }
  };

  const changeSuperAdminPass = async () => {
    if (!saPass.current||!saPass.next||!saPass.confirm) { toast("Barcha maydonlarni to'ldiring","error"); return; }
    if (saPass.next!==saPass.confirm) { toast("Yangi parollar mos emas","error"); return; }
    if (saPass.next.length<6)         { toast("Kamida 6 belgi","error"); return; }
    try {
      const current = await dbGet("super_admin");
      if (!current||current.password!==saPass.current) { toast("Joriy parol noto'g'ri","error"); return; }
      await dbUpdate("super_admin", { password:saPass.next });
      toast("Super Admin paroli yangilandi ✓","success");
      setSaPass({ current:"", next:"", confirm:"" });
    } catch { toast("Xatolik","error"); }
  };

  if (loading) return <div style={{ color:"#4a7a40", textAlign:"center", padding:48 }}>Yuklanmoqda...</div>;

  return (
    <div style={{ display:"grid", gap:16 }}>
      {isSuperAdmin && (
        <div style={CARD}>
          <div style={CARD_HDR}><span style={CARD_TTL}>🏪 Restoran ma'lumotlari</span></div>
          <div className="field-2col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 20px" }}>
            <Field label="Restoran nomi"   value={restaurant.name}      onChange={(v)=>setRestaurant((p)=>({...p,name:v}))}/>
            <Field label="Slogan"          value={restaurant.slogan}    onChange={(v)=>setRestaurant((p)=>({...p,slogan:v}))}/>
            <Field label="Telefon"         value={restaurant.phone}     onChange={(v)=>setRestaurant((p)=>({...p,phone:v}))}    placeholder="+998712345678"/>
            <Field label="Manzil"          value={restaurant.address}   onChange={(v)=>setRestaurant((p)=>({...p,address:v}))}  placeholder="Toshkent, ..."/>
            <Field label="Ish boshlanishi" value={restaurant.workStart} onChange={(v)=>setRestaurant((p)=>({...p,workStart:v}))} placeholder="10:00"/>
            <Field label="Ish tugashi"     value={restaurant.workEnd}   onChange={(v)=>setRestaurant((p)=>({...p,workEnd:v}))}  placeholder="23:00"/>
          </div>
          <button style={BTN.gold} onClick={saveRestaurant}>Saqlash</button>
        </div>
      )}
      {isSuperAdmin && (
        <div style={CARD}>
          <div style={CARD_HDR}><span style={CARD_TTL}>🥂 Bisetka (Basseyn VIP) sozlamalari</span></div>
          <div style={{ color:"#7fa86b", fontSize:12, marginBottom:14 }}>
            Bu narx Ofitsiant panelidagi hisob-kitobda (ScreenBill) ishlatiladi.
          </div>
          <div className="field-3col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"0 20px" }}>
            <Field label="Bisetka narxi (so'm)" value={String(vip.price)}      onChange={(v)=>setVip((p)=>({...p,price:v}))}/>
            <Field label="Servis haqi (%)"      value={String(vip.serviceFee)} onChange={(v)=>setVip((p)=>({...p,serviceFee:v}))}/>
            <Field label="Tarkibi"              value={vip.description}        onChange={(v)=>setVip((p)=>({...p,description:v}))}/>
          </div>
          <button style={BTN.gold} onClick={saveVip}>Saqlash</button>
        </div>
      )}
      {isSuperAdmin && (
        <div style={CARD}>
          <div style={CARD_HDR}><span style={CARD_TTL}>🔐 Super Admin paroli</span></div>
          <div className="field-3col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"0 20px" }}>
            <Field label="Joriy parol" value={saPass.current} onChange={fsa("current")} type="password"/>
            <Field label="Yangi parol" value={saPass.next}    onChange={fsa("next")}    type="password"/>
            <Field label="Tasdiqlash"  value={saPass.confirm} onChange={fsa("confirm")} type="password"/>
          </div>
          <button style={BTN.gold} onClick={changeSuperAdminPass}>Parolni yangilash</button>
        </div>
      )}
      {!isSuperAdmin && (
        <div style={CARD}>
          <div style={CARD_HDR}><span style={CARD_TTL}>🔑 O'z parolimni o'zgartirish</span></div>
          <div className="field-3col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"0 20px" }}>
            <Field label="Joriy parol" value={pass.current} onChange={fp("current")} type="password"/>
            <Field label="Yangi parol" value={pass.next}    onChange={fp("next")}    type="password"/>
            <Field label="Tasdiqlash"  value={pass.confirm} onChange={fp("confirm")} type="password"/>
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
  const f = (k) => (v) => setForm((p)=>({...p,[k]:v}));

  const create = async () => {
    if (!form.name||!form.username||!form.password) { setError("Barcha maydonlarni to'ldiring"); return; }
    if (form.password!==form.confirm) { setError("Parollar mos emas"); return; }
    if (form.password.length<6)       { setError("Kamida 6 belgi"); return; }
    setSaving(true);
    try {
      await dbSet("super_admin", { name:form.name, username:form.username, password:form.password, createdAt:today(), lastLogin:"—" });
      onDone();
    } catch (e) { setError("Firebase xatoligi: "+e.message); }
    setSaving(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#050f06,#0a1f0d)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Inter,sans-serif", padding:16 }}>
      <div style={{ background:"rgba(10,31,13,0.95)", border:"1px solid rgba(212,175,55,0.3)", borderRadius:20, padding:"44px 32px", width:"100%", maxWidth:440, boxShadow:"0 24px 70px rgba(0,0,0,0.6)", boxSizing:"border-box" }}>
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
        <Field label="To'liq ism"         value={form.name}     onChange={f("name")}     placeholder="Super Admin" required/>
        <Field label="Username"           value={form.username}  onChange={f("username")} placeholder="superadmin"  required/>
        <Field label="Parol"              value={form.password}  onChange={f("password")} type="password"           required/>
        <Field label="Parolni tasdiqlang" value={form.confirm}   onChange={f("confirm")}  type="password"           required/>
        <button style={{ ...BTN.gold, width:"100%", marginTop:8, opacity:saving?0.7:1 }} onClick={create} disabled={saving}>
          {saving?"Yaratilmoqda...":"Super Admin Yaratish"}
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// NAV CONFIG
// ════════════════════════════════════════════════════════════════════════════
const NAV = [
  { id:"dashboard",  label:"Dashboard",    icon:IC.dashboard },
  { id:"tables",     label:"Stollar",       icon:IC.table     },
  { id:"orders",     label:"Buyurtmalar",   icon:IC.monitor   },
  { id:"kitchen",    label:"Oshxona",       icon:IC.kitchen   },
  { id:"admins",     label:"Adminlar",      icon:IC.admin     },
  { id:"waiters",    label:"Ofitsiantlar",  icon:IC.waiter    },
  { id:"categories", label:"Kategoriyalar", icon:IC.category  },
  { id:"menu",       label:"Menyu",         icon:IC.food      },
  { id:"statistics", label:"Statistika",    icon:IC.stats     },
  { id:"settings",   label:"Sozlamalar",    icon:IC.settings  },
];
const TITLES = {
  dashboard:"Dashboard", tables:"Stollar boshqaruvi", orders:"Buyurtmalar monitoru",
  kitchen:"Oshxona paneli", admins:"Adminlar", waiters:"Ofitsiantlar",
  categories:"Kategoriyalar", menu:"Menyu boshqaruvi", statistics:"Statistika", settings:"Sozlamalar",
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════
export default function SuperAdmin() {
  const navigate = useNavigate();
  const [user] = useState(()=>getStoredUser());
  const isSuperAdmin = user?.role==="SUPER_ADMIN";

  useEffect(()=>{
    if (!user||(user.role!=="SUPER_ADMIN"&&user.role!=="ADMIN")) {
      navigate("/",{ replace:true });
    }
  },[]); // eslint-disable-line

  const [setupDone, setSetupDone] = useState(null);
  useEffect(()=>{ dbGet("super_admin").then((data)=>setSetupDone(!!data)); },[]);

  const [page,         setPage]         = useState("dashboard");
  const [sideOpen,     setSideOpen]     = useState(true);   // desktop: ochiq/yig'ilgan
  const [mobileNavOpen,setMobileNavOpen]= useState(false);  // mobil: drawer ochiq/yopiq
  const [toasts,       setToasts]       = useState([]);

  const [admins,     setAdmins]     = useState({});
  const [waiters,    setWaiters]    = useState({});
  const [categories, setCategories] = useState({});
  const [menu,       setMenu]       = useState({});
  const [orders,     setOrders]     = useState({});
  const [tables,     setTables]     = useState([]); // tableData.js -> listenTables() massivi
  const [dbLoading,  setDbLoading]  = useState(true);
  const [newShotsCount, setNewShotsCount] = useState(0);

  useEffect(()=>{
    ensureTablesExist();

    const unsubs = [
      dbListen("admins",     (d)=>setAdmins(d||{})),
      dbListen("waiters",    (d)=>setWaiters(d||{})),
      dbListen("categories", (d)=>setCategories(d||{})),
      dbListen("menu",       (d)=>setMenu(d||{})),
      dbListen("orders",     (d)=>{ setOrders(d||{}); setDbLoading(false); }),
      listenTables((arr)=>{
        setTables(arr);
        let count = 0;
        arr.forEach((t)=>{ (t.shots||[]).forEach((sh)=>{ if(sh.status==="new") count++; }); });
        setNewShotsCount(count);
      }),
    ];
    return ()=>unsubs.forEach((u)=>typeof u==="function"&&u());
  },[]);

  const toast = useCallback((msg, type="info")=>{
    const id = uid();
    setToasts((p)=>[...p,{ id, msg, type }]);
    setTimeout(()=>setToasts((p)=>p.filter((t)=>t.id!==id)),3500);
  },[]);

  const removeToast = useCallback((id)=>setToasts((p)=>p.filter((t)=>t.id!==id)),[]);

  const handleLogout = ()=>{ clearUser(); navigate("/",{ replace:true }); };

  const goPage = (id) => { setPage(id); setMobileNavOpen(false); };

  if (!user) return null;

  if (setupDone===null) {
    return (
      <div style={{ minHeight:"100vh", background:"#0a1f0d", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ color:"#D4AF37", fontFamily:"Cinzel,serif", fontSize:14, letterSpacing:2 }}>🌿 Yuklanmoqda...</div>
      </div>
    );
  }

  if (!setupDone) return <SetupWizard onDone={()=>setSetupDone(true)}/>;

  const activeShotsAll = tables.reduce(
    (s,t)=>s+(t.shots||[]).filter((sh)=>sh.status==="new"||sh.status==="preparing").length, 0
  );

  const pages = {
    dashboard:  <Dashboard    admins={admins} waiters={waiters} categories={categories} menu={menu} orders={orders} tables={tables}/>,
    tables:     <TableManager tables={tables} toast={toast}/>,
    orders:     <OrdersMonitor tables={tables} toast={toast}/>,
    kitchen:    <KitchenPanel  tables={tables} toast={toast}/>,
    admins:     <AdminManager  admins={admins} toast={toast} isSuperAdmin={isSuperAdmin}/>,
    waiters:    <WaiterManager waiters={waiters} toast={toast}/>,
    categories: <CategoryManager categories={categories} menu={menu} toast={toast}/>,
    menu:       <MenuManager  menu={menu} categories={categories} toast={toast}/>,
    statistics: <Statistics   orders={orders} waiters={waiters} menu={menu} tables={tables}/>,
    settings:   <Settings     toast={toast} isSuperAdmin={isSuperAdmin} currentUser={user}/>,
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
        input::placeholder,textarea::placeholder { color:#3d6b35; }
        input:focus,textarea:focus,select:focus { outline:none; border-color:rgba(212,175,55,0.5)!important; box-shadow:0 0 0 2px rgba(212,175,55,0.08); }
        @keyframes slideIn { from{transform:translateX(40px);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.5} }
        button:disabled { cursor:not-allowed; }

        /* ── RESPONSIVE GRID OVERRIDES ── */
        .grid-4         { grid-template-columns: repeat(4,1fr); }
        .field-2col     { grid-template-columns: 1fr 1fr; }
        .field-3col     { grid-template-columns: 1fr 1fr 1fr; }
        .stats-row-a    { grid-template-columns: 1.4fr 1fr; }
        .stats-row-b    { grid-template-columns: 1fr 1fr; }
        .menu-modal-grid{ grid-template-columns: 1fr 1fr; }

        @media (max-width: 980px) {
          .stats-row-a, .stats-row-b, .menu-modal-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 700px) {
          .field-3col { grid-template-columns: 1fr 1fr !important; }
          .grid-4     { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 520px) {
          .field-2col, .field-3col { grid-template-columns: 1fr !important; }
          .sa-hide-mobile { display:none !important; }
        }

        /* ── SIDEBAR: mobil rejimda slide-drawer ── */
        .sa-hamburger { display:none; }
        @media (max-width: 860px) {
          .sa-sidebar {
            position: fixed !important;
            top:0; left:0; height:100vh;
            width: 248px !important;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            z-index: 600;
          }
          .sa-sidebar.open { transform: translateX(0); }
          .sa-collapse-btn { display:none !important; }
          .sa-hamburger { display:flex !important; }
        }
        @media (min-width: 861px) {
          .sa-overlay { display:none !important; }
        }
      `}</style>

      {/* MOBIL OVERLAY (drawer ochiq bo'lganda fon qoraytiriladi) */}
      {mobileNavOpen && (
        <div className="sa-overlay" onClick={()=>setMobileNavOpen(false)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:500 }}/>
      )}

      {/* SIDEBAR */}
      <aside className={`sa-sidebar${mobileNavOpen?" open":""}`}
        style={{ width:sideOpen?242:64, minHeight:"100vh", background:"rgba(3,10,5,0.98)", backdropFilter:"blur(20px)", borderRight:"1px solid rgba(212,175,55,0.1)", transition:"width 0.28s ease", flexShrink:0, display:"flex", flexDirection:"column", position:"sticky", top:0, height:"100vh", overflowY:"auto", overflowX:"hidden" }}>
        <div style={{ padding:"20px 14px 14px", borderBottom:"1px solid rgba(212,175,55,0.08)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:8, background:"linear-gradient(135deg,#1a3a1a,#0f2a10)", border:"1px solid rgba(212,175,55,0.3)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:17 }}>🌿</div>
            {(sideOpen || mobileNavOpen) && (
              <div>
                <div style={{ fontFamily:"Cinzel,serif", color:"#D4AF37", fontSize:12, fontWeight:700, letterSpacing:2, lineHeight:1 }}>AMAZONIA</div>
                <div style={{ fontFamily:"Cinzel,serif", color:"#86B054", fontSize:7, letterSpacing:2, marginTop:3 }}>
                  {isSuperAdmin?"SUPER ADMIN":"ADMIN PANEL"}
                </div>
              </div>
            )}
          </div>
          <button onClick={()=>setMobileNavOpen(false)} className="sa-hamburger"
            style={{ background:"none", border:"none", color:"#7fa86b", cursor:"pointer", fontSize:20 }}>✕</button>
        </div>

        <nav style={{ flex:1, padding:"10px 8px" }}>
          {NAV.filter((n)=>isSuperAdmin||n.id!=="admins").map((n)=>{
            const isKitchen = n.id==="kitchen" && newShotsCount>0;
            const isOrders  = n.id==="orders"  && activeShotsAll>0;
            const expanded  = sideOpen || mobileNavOpen;
            return (
              <button key={n.id} onClick={()=>goPage(n.id)}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:expanded?"10px 12px":"10px", borderRadius:9, marginBottom:3, cursor:"pointer", border:"none", textAlign:"left", transition:"all 0.15s", justifyContent:expanded?"flex-start":"center", background:page===n.id?"rgba(212,175,55,0.14)":"transparent", borderLeft:page===n.id?"2px solid #D4AF37":"2px solid transparent", position:"relative" }}>
                <span style={{ flexShrink:0 }}><Icon d={n.icon} color={page===n.id?"#D4AF37":"#4a7a40"} size={17}/></span>
                {expanded && <span style={{ color:page===n.id?"#D4AF37":"#7fa86b", fontSize:12, fontWeight:page===n.id?600:400, flex:1 }}>{n.label}</span>}
                {isKitchen && (
                  <div style={{ width:18, height:18, borderRadius:"50%", background:"#e74c3c", display:"flex", alignItems:"center", justifyContent:"center", animation:"pulse 1.5s infinite", flexShrink:0 }}>
                    <span style={{ color:"#fff", fontSize:10, fontWeight:700 }}>{newShotsCount}</span>
                  </div>
                )}
                {isOrders && !isKitchen && (
                  <div style={{ width:18, height:18, borderRadius:"50%", background:"#e67e22", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <span style={{ color:"#fff", fontSize:10, fontWeight:700 }}>{activeShotsAll}</span>
                  </div>
                )}
              </button>
            );
          })}
          <button onClick={handleLogout}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:(sideOpen||mobileNavOpen)?"10px 12px":"10px", borderRadius:9, marginTop:10, cursor:"pointer", border:"none", textAlign:"left", justifyContent:(sideOpen||mobileNavOpen)?"flex-start":"center", background:"rgba(192,57,43,0.1)" }}>
            <span style={{ flexShrink:0 }}><Icon d={IC.logout} color="#e74c3c" size={17}/></span>
            {(sideOpen||mobileNavOpen) && <span style={{ color:"#e74c3c", fontSize:12 }}>Chiqish</span>}
          </button>
        </nav>

        <div className="sa-collapse-btn" style={{ padding:"10px 8px", borderTop:"1px solid rgba(212,175,55,0.07)" }}>
          <button onClick={()=>setSideOpen((v)=>!v)}
            style={{ width:"100%", padding:"9px", borderRadius:9, cursor:"pointer", border:"1px solid rgba(134,176,84,0.12)", background:"rgba(255,255,255,0.02)", color:"#4a7a40", display:"flex", alignItems:"center", justifyContent:"center", gap:6, fontSize:12 }}>
            {sideOpen?"◀ Yig'ish":"▶"}
          </button>
        </div>

        {(sideOpen||mobileNavOpen) && (
          <div style={{ padding:"10px 12px 18px", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:isSuperAdmin?"linear-gradient(135deg,#D4AF37,#b8931f)":"linear-gradient(135deg,#86B054,#4a7a40)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>
              {isSuperAdmin?"👑":"🛡️"}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ color:"#e8f5e0", fontSize:12, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.name}</div>
              <div style={{ color:"#4a7a40", fontSize:10 }}>@{user.username}</div>
            </div>
          </div>
        )}
      </aside>

      {/* MAIN */}
      <main style={{ flex:1, display:"flex", flexDirection:"column", minHeight:"100vh", minWidth:0 }}>
        <header style={{ background:"rgba(3,10,5,0.88)", backdropFilter:"blur(12px)", borderBottom:"1px solid rgba(212,175,55,0.08)", padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100, gap:10, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <button className="sa-hamburger" onClick={()=>setMobileNavOpen(true)}
              style={{ background:"rgba(212,175,55,0.12)", border:"1px solid rgba(212,175,55,0.3)", borderRadius:8, padding:"7px 9px", cursor:"pointer", alignItems:"center" }}>
              <Icon d={IC.menuBars} color="#D4AF37" size={16}/>
            </button>
            <div>
              <h1 style={{ fontFamily:"Cinzel,serif", color:"#D4AF37", fontSize:15, fontWeight:700, letterSpacing:1, margin:0 }}>{TITLES[page]}</h1>
              <div className="sa-hide-mobile" style={{ color:"#4a7a40", fontSize:10, marginTop:2 }}>Amazonia · {isSuperAdmin?"Super Admin":"Admin"} Panel</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
            {dbLoading && <span style={{ color:"#4a7a40", fontSize:11, animation:"fadeIn 0.3s ease" }}>Yuklanmoqda...</span>}
            {newShotsCount>0 && (
              <button onClick={()=>goPage("kitchen")} style={{ background:"rgba(231,76,60,0.15)", border:"1px solid rgba(231,76,60,0.4)", borderRadius:20, padding:"4px 12px", display:"flex", alignItems:"center", gap:5, cursor:"pointer" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:"#e74c3c", animation:"pulse 1s infinite" }}/>
                <span style={{ color:"#e74c3c", fontSize:11 }}>{newShotsCount} yangi buyurtma</span>
              </button>
            )}
            <div className="sa-hide-mobile" style={{ background:"rgba(39,174,96,0.12)", border:"1px solid rgba(39,174,96,0.28)", borderRadius:20, padding:"3px 12px", display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:5, height:5, borderRadius:"50%", background:"#2ecc71" }}/>
              <span style={{ color:"#2ecc71", fontSize:10 }}>Real-time · Firebase</span>
            </div>
            <LiveClock/>
          </div>
        </header>

        <div key={page} style={{ flex:1, padding:"18px", overflowY:"auto", animation:"fadeIn 0.25s ease" }}>
          {pages[page]}
        </div>
      </main>

      <Toast toasts={toasts} remove={removeToast}/>
    </div>
  );
}