import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const INITIAL_TABLES = [
  ...["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10"].map((t) => ({
    id: t, zone: "A", status: "free", shots: [],
  })),
  ...["B1","B2","B3","B4","B5","B6","B7","B8"].map((t) => ({
    id: t, zone: "B", status: "free", shots: [],
  })),
  ...["VIP1","VIP2","VIP3"].map((t) => ({
    id: t, zone: "VIP", status: "free", shots: [],
  })),
];

const CATEGORIES = [
  { id: "c1", name: "Steyklar", icon: "🥩" },
  { id: "c2", name: "Burgerlar", icon: "🍔" },
  { id: "c3", name: "Salatlar", icon: "🥗" },
  { id: "c4", name: "Ichimliklar", icon: "🍹" },
  { id: "c5", name: "Dessertlar", icon: "🍰" },
];

const MENU = [
  { id: "m1", name: "Steyk Ribeye",    cat: "c1", price: 185000, image: "🥩", status: "active",  desc: "Premium go'sht, yog'li va mazali" },
  { id: "m2", name: "NY Strip Steak",  cat: "c1", price: 155000, image: "🥩", status: "stop",    desc: "Klassik amerikan steyki" },
  { id: "m3", name: "Classic Burger",  cat: "c2", price: 95000,  image: "🍔", status: "active",  desc: "Mol go'shti, pishloq, sabzavot" },
  { id: "m4", name: "BBQ Burger",      cat: "c2", price: 105000, image: "🍔", status: "active",  desc: "BBQ sous, qovurilgan piyoz" },
  { id: "m5", name: "Caesar Salad",    cat: "c3", price: 65000,  image: "🥗", status: "active",  desc: "Tovuq, Romaine, Parmezan" },
  { id: "m6", name: "Greek Salad",     cat: "c3", price: 58000,  image: "🥗", status: "active",  desc: "Feta, zaytun, sabzavotlar" },
  { id: "m7", name: "Mojito",          cat: "c4", price: 55000,  image: "🍹", status: "active",  desc: "Yanana, limon, muz" },
  { id: "m8", name: "Limonchello",     cat: "c4", price: 48000,  image: "🍋", status: "active",  desc: "Limon, limon balzami" },
  { id: "m9", name: "Tiramisu",        cat: "c5", price: 45000,  image: "🍰", status: "active",  desc: "Italyan klassikasi" },
  { id: "m10",name: "Cheesecake",      cat: "c5", price: 42000,  image: "🍮", status: "active",  desc: "New York uslubida" },
];

const VIP_PRICE = 220000;
const SERVICE_FEE = 0.12;
const uid = () => Math.random().toString(36).slice(2, 8);
const fmt = (n) => n?.toLocaleString("uz-UZ") + " so'm";

// ─── SCREENS ──────────────────────────────────────────────────────────────────
// SCREEN_TABLES → SCREEN_TABLE_DETAIL → SCREEN_ORDER → SCREEN_CART → SCREEN_BILL → SCREEN_PAYMENT → SCREEN_RATING
const S = {
  TABLES: "TABLES",
  TABLE_DETAIL: "TABLE_DETAIL",
  ORDER: "ORDER",
  CART: "CART",
  BILL: "BILL",
  PAYMENT: "PAYMENT",
  RATING: "RATING",
};

// ─── ICONS ───────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 20, color = "currentColor", stroke = 1.8, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const ICONS = {
  table:    ["M3 3h18v18H3z","M3 9h18","M3 15h18","M9 3v18","M15 3v18"],
  plus:     "M12 5v14M5 12h14",
  minus:    "M5 12h14",
  cart:     ["M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z","M3 6h18","M16 10a4 4 0 01-8 0"],
  check:    "M20 6L9 17l-5-5",
  x:        "M18 6L6 18M6 6l12 12",
  back:     ["M19 12H5","M12 19l-7-7 7-7"],
  bill:     ["M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z","M14 2v6h6","M16 13H8","M16 17H8","M10 9H8"],
  star:     "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  cash:     ["M12 1v22","M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"],
  card:     ["M1 4h22v16H1z","M1 10h22"],
  telegram: "M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z",
  logout:   ["M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4","M16 17l5-5-5-5","M21 12H9"],
  note:     ["M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z","M14 2v6h6"],
  vip:      "M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17 5.8 21.3l2.4-7.4L2 9.4h7.6z",
  refresh:  ["M23 4v6h-6","M1 20v-6h6","M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"],
  user:     ["M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2","M12 11a4 4 0 100-8 4 4 0 000 8"],
  eye:      ["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z","M12 9a3 3 0 100 6 3 3 0 000-6z"],
};

// ─── TOAST ───────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = (msg, type = "info") => {
    const id = uid();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  };
  const remove = (id) => setToasts(p => p.filter(t => t.id !== id));
  return { toasts, toast: add, remove };
}

function ToastContainer({ toasts, remove }) {
  const colors = { success: "#27ae60", error: "#c0392b", info: "#2980b9", warn: "#e67e22" };
  return (
    <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, alignItems: "center", pointerEvents: "none" }}>
      {toasts.map(t => (
        <div key={t.id} onClick={() => remove(t.id)} style={{
          background: colors[t.type] || colors.info, color: "#fff",
          padding: "10px 20px", borderRadius: 10, fontSize: 13,
          fontFamily: "Inter,sans-serif", boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", gap: 8,
          animation: "slideUp 0.3s ease", cursor: "pointer", pointerEvents: "all",
          minWidth: 220, maxWidth: 320, textAlign: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 16 }}>{t.type === "success" ? "✓" : t.type === "error" ? "✗" : t.type === "warn" ? "⚠" : "ℹ"}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── CONFIRM ─────────────────────────────────────────────────────────────────
function Confirm({ msg, onYes, onNo }) {
  return (
    <div style={OVERLAY} onClick={e => e.target === e.currentTarget && onNo()}>
      <div style={{ background: "#0e2210", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 16, padding: "28px 24px", maxWidth: 360, width: "100%", margin: "0 16px", boxShadow: "0 20px 60px rgba(0,0,0,0.7)" }}>
        <p style={{ color: "#e8f5e0", fontSize: 15, marginBottom: 24, lineHeight: 1.6, textAlign: "center" }}>{msg}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onYes} style={BTN.danger}>Ha, tasdiqlash</button>
          <button onClick={onNo} style={BTN.ghost}>Bekor qilish</button>
        </div>
      </div>
    </div>
  );
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const OVERLAY = {
  position: "fixed", inset: 0,
  background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
  zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
};

const BTN = {
  gold:   { background: "linear-gradient(135deg,#b8931f,#D4AF37)", border: "none", borderRadius: 10, color: "#0a1f0d", fontFamily: "Cinzel,serif", fontSize: 12, fontWeight: 700, letterSpacing: 1, padding: "12px 20px", cursor: "pointer", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 },
  ghost:  { background: "transparent", border: "1px solid rgba(134,176,84,0.4)", borderRadius: 10, color: "#86B054", fontFamily: "Inter,sans-serif", fontSize: 13, padding: "12px 20px", cursor: "pointer", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 },
  danger: { background: "rgba(192,57,43,0.85)", border: "1px solid rgba(220,80,80,0.4)", borderRadius: 10, color: "#fff", fontFamily: "Inter,sans-serif", fontSize: 13, padding: "12px 20px", cursor: "pointer", flex: 1 },
  red:    { background: "rgba(192,57,43,0.2)", border: "1px solid rgba(192,57,43,0.4)", borderRadius: 8, color: "#e74c3c", fontFamily: "Inter,sans-serif", fontSize: 12, padding: "8px 14px", cursor: "pointer" },
  blue:   { background: "rgba(41,128,185,0.2)", border: "1px solid rgba(41,128,185,0.4)", borderRadius: 10, color: "#3498db", fontFamily: "Inter,sans-serif", fontSize: 13, padding: "12px 20px", cursor: "pointer", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 },
};

// ─── BADGE ───────────────────────────────────────────────────────────────────
function Badge({ status }) {
  const map = {
    free:     { bg: "rgba(39,174,96,0.2)",   border: "rgba(39,174,96,0.5)",   color: "#2ecc71", label: "Bo'sh" },
    busy:     { bg: "rgba(230,126,34,0.2)",  border: "rgba(230,126,34,0.5)",  color: "#e67e22", label: "Band" },
    bill:     { bg: "rgba(212,175,55,0.2)",  border: "rgba(212,175,55,0.5)",  color: "#D4AF37", label: "Hisob kutmoqda" },
    active:   { bg: "rgba(39,174,96,0.15)",  border: "rgba(39,174,96,0.4)",   color: "#2ecc71", label: "Faol" },
    stop:     { bg: "rgba(230,126,34,0.2)",  border: "rgba(230,126,34,0.5)",  color: "#e67e22", label: "Vaqtincha to'xtatilgan" },
    new:      { bg: "rgba(41,128,185,0.2)",  border: "rgba(41,128,185,0.5)",  color: "#3498db", label: "Yangi" },
    preparing:{ bg: "rgba(230,126,34,0.2)",  border: "rgba(230,126,34,0.5)",  color: "#e67e22", label: "Tayyorlanmoqda" },
    ready:    { bg: "rgba(39,174,96,0.2)",   border: "rgba(39,174,96,0.5)",   color: "#2ecc71", label: "Tayyor" },
    delivered:{ bg: "rgba(100,100,100,0.2)", border: "rgba(100,100,100,0.4)", color: "#7f8c8d", label: "Yetkazildi" },
  };
  const s = map[status] || map.active;
  return (
    <span style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
}

// ─── SCREEN: TABLES ──────────────────────────────────────────────────────────
function ScreenTables({ tables, setTables, onSelectTable, onLogout, waiter }) {
  const [zone, setZone] = useState("all");
  const zones = ["all", "A", "B", "VIP"];
  const filtered = zone === "all" ? tables : tables.filter(t => t.zone === zone);

  const statusColor = { free: "#2ecc71", busy: "#e67e22", bill: "#D4AF37" };
  const statusLabel = { free: "Bo'sh", busy: "Band", bill: "Hisob" };

  const counts = {
    free:  tables.filter(t => t.status === "free").length,
    busy:  tables.filter(t => t.status === "busy").length,
    bill:  tables.filter(t => t.status === "bill").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0a1f0d,#0f2a10,#1a3a1a)", padding: "0 0 80px" }}>
      {/* Header */}
      <div style={{ background: "rgba(5,15,7,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(212,175,55,0.12)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#1a3a1a,#0f2a10)", border: "1px solid rgba(212,175,55,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🌿</div>
          <div>
            <div style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 14, fontWeight: 700, letterSpacing: 2 }}>AMAZONIA</div>
            <div style={{ color: "#7fa86b", fontSize: 10, letterSpacing: 1 }}>OFITSIANT PANEL</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#e8f5e0", fontSize: 13, fontWeight: 600 }}>{waiter?.name || "Ofitsiant"}</div>
            <div style={{ color: "#4a7a40", fontSize: 11 }}>@{waiter?.username || "waiter"}</div>
          </div>
          <button onClick={onLogout} style={{ background: "rgba(192,57,43,0.2)", border: "1px solid rgba(192,57,43,0.4)", borderRadius: 8, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#e74c3c", fontSize: 12 }}>
            <Icon d={ICONS.logout} size={16} color="#e74c3c" />
          </button>
        </div>
      </div>

      <div style={{ padding: "20px" }}>
        {/* Stats bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
          {Object.entries(counts).map(([st, n]) => (
            <div key={st} style={{ background: `${statusColor[st]}12`, border: `1px solid ${statusColor[st]}35`, borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
              <div style={{ color: statusColor[st], fontSize: 24, fontWeight: 700, fontFamily: "Cinzel,serif" }}>{n}</div>
              <div style={{ color: "#7fa86b", fontSize: 11, marginTop: 2 }}>{statusLabel[st]}</div>
            </div>
          ))}
        </div>

        {/* Zone filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
          {zones.map(z => (
            <button key={z} onClick={() => setZone(z)} style={{
              padding: "8px 18px", borderRadius: 20, cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: 13, whiteSpace: "nowrap",
              background: zone === z ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.04)",
              border: zone === z ? "1px solid rgba(212,175,55,0.5)" : "1px solid rgba(134,176,84,0.2)",
              color: zone === z ? "#D4AF37" : "#7fa86b",
            }}>
              {z === "all" ? "Barcha zonalar" : `${z} zona`}
            </button>
          ))}
        </div>

        {/* Table grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 10 }}>
          {filtered.map(table => {
            const c = statusColor[table.status];
            const shotCount = table.shots.length;
            return (
              <button key={table.id} onClick={() => onSelectTable(table)} style={{
                height: 90, borderRadius: 12,
                background: `${c}12`, border: `2px solid ${c}45`,
                cursor: "pointer", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 3,
                position: "relative", transition: "all 0.2s",
              }}>
                <span style={{ color: "#e8f5e0", fontSize: 13, fontWeight: 700, fontFamily: "Cinzel,serif" }}>{table.id}</span>
                <span style={{ color: c, fontSize: 10, fontWeight: 600 }}>{statusLabel[table.status]}</span>
                {shotCount > 0 && (
                  <div style={{ position: "absolute", top: 5, right: 5, width: 18, height: 18, borderRadius: "50%", background: "#D4AF37", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "#0a1f0d", fontSize: 10, fontWeight: 700 }}>{shotCount}</span>
                  </div>
                )}
                {table.status === "busy" && (
                  <span style={{ color: "#4a7a40", fontSize: 9 }}>
                    {table.shots.reduce((s, sh) => s + sh.items.reduce((ss, i) => ss + i.qty, 0), 0)} ta
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN: TABLE DETAIL ─────────────────────────────────────────────────────
function ScreenTableDetail({ table, onBack, onNewShot, onOpenShot, onOpenBill }) {
  const totalItems = table.shots.reduce((s, sh) => s + sh.items.reduce((ss, i) => ss + i.qty, 0), 0);
  const totalAmount = table.shots.reduce((s, sh) => s + sh.items.reduce((ss, i) => ss + i.price * i.qty, 0), 0);
  const statusColor = { free: "#2ecc71", busy: "#e67e22", bill: "#D4AF37" };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0a1f0d,#0f2a10,#1a3a1a)" }}>
      {/* Header */}
      <div style={{ background: "rgba(5,15,7,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(212,175,55,0.12)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, position: "sticky", top: 0, zIndex: 100 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#7fa86b", display: "flex" }}>
          <Icon d={ICONS.back} color="#7fa86b" size={22} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 16, fontWeight: 700 }}>Stol {table.id}</div>
          <div style={{ color: "#4a7a40", fontSize: 11 }}>{table.zone} zona</div>
        </div>
        <Badge status={table.status} />
      </div>

      <div style={{ padding: "20px" }}>
        {/* Summary */}
        {table.shots.length > 0 && (
          <div style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 14, padding: "16px 20px", marginBottom: 20, display: "flex", gap: 20 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#D4AF37", fontSize: 22, fontWeight: 700, fontFamily: "Cinzel,serif" }}>{table.shots.length}</div>
              <div style={{ color: "#7fa86b", fontSize: 11 }}>Shot</div>
            </div>
            <div style={{ width: 1, background: "rgba(212,175,55,0.2)" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#D4AF37", fontSize: 22, fontWeight: 700, fontFamily: "Cinzel,serif" }}>{totalItems}</div>
              <div style={{ color: "#7fa86b", fontSize: 11 }}>Mahsulot</div>
            </div>
            <div style={{ width: 1, background: "rgba(212,175,55,0.2)" }} />
            <div style={{ flex: 1 }}>
              <div style={{ color: "#D4AF37", fontSize: 16, fontWeight: 700, fontFamily: "Cinzel,serif" }}>{fmt(totalAmount)}</div>
              <div style={{ color: "#7fa86b", fontSize: 11 }}>Umumiy summa</div>
            </div>
          </div>
        )}

        {/* Shots list */}
        {table.shots.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
            {table.shots.map((shot, idx) => {
              const shotTotal = shot.items.reduce((s, i) => s + i.price * i.qty, 0);
              const statusColors = { new: "#3498db", preparing: "#e67e22", ready: "#2ecc71", delivered: "#7f8c8d" };
              return (
                <div key={shot.id} onClick={() => onOpenShot(shot)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(134,176,84,0.15)", borderRadius: 12, padding: "14px 16px", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: "#D4AF37", fontSize: 12, fontWeight: 700 }}>{idx + 1}</span>
                      </div>
                      <div>
                        <div style={{ color: "#e8f5e0", fontSize: 13, fontWeight: 600 }}>Shot #{idx + 1}</div>
                        <div style={{ color: "#4a7a40", fontSize: 11 }}>{shot.items.reduce((s, i) => s + i.qty, 0)} ta mahsulot</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <Badge status={shot.status} />
                      <div style={{ color: "#D4AF37", fontSize: 14, fontWeight: 700, marginTop: 4 }}>{fmt(shotTotal)}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {shot.items.slice(0, 4).map((item, i) => (
                      <span key={i} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 6, padding: "2px 8px", color: "#7fa86b", fontSize: 11 }}>
                        {item.image} {item.name} x{item.qty}
                      </span>
                    ))}
                    {shot.items.length > 4 && <span style={{ color: "#4a7a40", fontSize: 11 }}>+{shot.items.length - 4} ta</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#3d5c38" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
            <div style={{ fontSize: 15, marginBottom: 4 }}>Hozircha buyurtma yo'q</div>
            <div style={{ fontSize: 12 }}>Yangi shot ochib buyurtma qiling</div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, position: "sticky", bottom: 20 }}>
          <button onClick={onNewShot} style={{ ...BTN.gold, padding: "14px 20px", borderRadius: 12, fontSize: 14 }}>
            <Icon d={ICONS.plus} size={18} color="#0a1f0d" />
            Yangi shot ochish
          </button>
          {table.shots.length > 0 && (
            <button onClick={onOpenBill} style={{ ...BTN.ghost, padding: "14px 20px", borderRadius: 12, fontSize: 14 }}>
              <Icon d={ICONS.bill} size={18} color="#86B054" />
              Hisob chiqarish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN: ORDER (MENU) ─────────────────────────────────────────────────────
function ScreenOrder({ table, shot, onBack, onUpdateShot, toast }) {
  const [activeCat, setActiveCat] = useState("all");
  const [cart, setCart] = useState(shot ? [...shot.items] : []);
  const [noteItem, setNoteItem] = useState(null);
  const [noteText, setNoteText] = useState("");

  const filtered = activeCat === "all" ? MENU : MENU.filter(m => m.cat === activeCat);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const addItem = (menuItem) => {
    if (menuItem.status === "stop") { toast("Bu ovqat vaqtincha to'xtatilgan", "warn"); return; }
    setCart(prev => {
      const ex = prev.find(i => i.id === menuItem.id);
      if (ex) return prev.map(i => i.id === menuItem.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...menuItem, qty: 1, note: "" }];
    });
  };

  const removeItem = (id) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === id);
      if (!ex) return prev;
      if (ex.qty <= 1) return prev.filter(i => i.id !== id);
      return prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i);
    });
  };

  const getQty = (id) => cart.find(i => i.id === id)?.qty || 0;

  const saveNote = () => {
    setCart(prev => prev.map(i => i.id === noteItem.id ? { ...i, note: noteText } : i));
    setNoteItem(null);
    toast("Izoh saqlandi", "success");
  };

  const submitOrder = () => {
    if (cart.length === 0) { toast("Savat bo'sh", "error"); return; }
    onUpdateShot({ ...shot, items: cart, status: "new" });
    toast("Buyurtma yuborildi! 📤", "success");
    onBack();
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0a1f0d,#0f2a10,#1a3a1a)", paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ background: "rgba(5,15,7,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(212,175,55,0.12)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, position: "sticky", top: 0, zIndex: 100 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#7fa86b", display: "flex" }}>
          <Icon d={ICONS.back} color="#7fa86b" size={22} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 15, fontWeight: 700 }}>
            Stol {table.id} — Buyurtma
          </div>
          <div style={{ color: "#4a7a40", fontSize: 11 }}>Ovqat tanlang</div>
        </div>
        {cartCount > 0 && (
          <div style={{ background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 20, padding: "4px 12px", color: "#D4AF37", fontSize: 12 }}>
            {cartCount} ta · {fmt(cartTotal)}
          </div>
        )}
      </div>

      {/* Category tabs */}
      <div style={{ display: "flex", gap: 8, padding: "14px 20px 0", overflowX: "auto", paddingBottom: 0 }}>
        {[{ id: "all", name: "Hammasi", icon: "🍽️" }, ...CATEGORIES].map(c => (
          <button key={c.id} onClick={() => setActiveCat(c.id)} style={{
            padding: "8px 16px", borderRadius: 20, cursor: "pointer", fontFamily: "Inter,sans-serif",
            fontSize: 12, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6,
            background: activeCat === c.id ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.04)",
            border: activeCat === c.id ? "1px solid rgba(212,175,55,0.5)" : "1px solid rgba(134,176,84,0.2)",
            color: activeCat === c.id ? "#D4AF37" : "#7fa86b",
          }}>
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {/* Menu items */}
      <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(item => {
          const qty = getQty(item.id);
          const cartItem = cart.find(i => i.id === item.id);
          return (
            <div key={item.id} style={{
              background: "rgba(255,255,255,0.03)",
              border: qty > 0 ? "1px solid rgba(212,175,55,0.35)" : "1px solid rgba(134,176,84,0.15)",
              borderRadius: 12, padding: "14px 16px",
              opacity: item.status === "stop" ? 0.55 : 1,
              display: "flex", gap: 12, alignItems: "center",
            }}>
              <div style={{ width: 54, height: 54, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>
                {item.image}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#e8f5e0", fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{item.name}</div>
                <div style={{ color: "#4a7a40", fontSize: 11, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.desc}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#D4AF37", fontSize: 14, fontWeight: 700 }}>{fmt(item.price)}</span>
                  {item.status === "stop" && <Badge status="stop" />}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                {qty > 0 ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button onClick={() => removeItem(item.id)} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(192,57,43,0.2)", border: "1px solid rgba(192,57,43,0.4)", cursor: "pointer", color: "#e74c3c", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon d={ICONS.minus} size={14} color="#e74c3c" />
                      </button>
                      <span style={{ color: "#D4AF37", fontSize: 16, fontWeight: 700, minWidth: 20, textAlign: "center" }}>{qty}</span>
                      <button onClick={() => addItem(item)} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(212,175,55,0.2)", border: "1px solid rgba(212,175,55,0.4)", cursor: "pointer", color: "#D4AF37", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon d={ICONS.plus} size={14} color="#D4AF37" />
                      </button>
                    </div>
                    <button onClick={() => { setNoteItem(item); setNoteText(cartItem?.note || ""); }} style={{ background: "none", border: "none", cursor: "pointer", color: cartItem?.note ? "#D4AF37" : "#4a7a40", fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}>
                      <Icon d={ICONS.note} size={12} color={cartItem?.note ? "#D4AF37" : "#4a7a40"} />
                      {cartItem?.note ? "Izoh bor" : "Izoh qo'sh"}
                    </button>
                  </>
                ) : (
                  <button onClick={() => addItem(item)} style={{ width: 36, height: 36, borderRadius: 10, background: item.status === "stop" ? "rgba(100,100,100,0.2)" : "rgba(212,175,55,0.2)", border: `1px solid ${item.status === "stop" ? "rgba(100,100,100,0.4)" : "rgba(212,175,55,0.4)"}`, cursor: item.status === "stop" ? "not-allowed" : "pointer", color: item.status === "stop" ? "#7f8c8d" : "#D4AF37", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon d={ICONS.plus} size={18} color={item.status === "stop" ? "#7f8c8d" : "#D4AF37"} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom cart bar */}
      {cart.length > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(5,15,7,0.97)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(212,175,55,0.2)", padding: "14px 20px", display: "flex", gap: 10, zIndex: 200 }}>
          <div style={{ flex: 1, background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ color: "#7fa86b", fontSize: 11, marginBottom: 2 }}>Savat</div>
            <div style={{ color: "#D4AF37", fontSize: 14, fontWeight: 700 }}>{cartCount} ta · {fmt(cartTotal)}</div>
          </div>
          <button onClick={submitOrder} style={{ ...BTN.gold, flex: "none", padding: "12px 24px", borderRadius: 10, fontSize: 13 }}>
            <Icon d={ICONS.telegram} size={16} color="#0a1f0d" />
            Yuborish
          </button>
        </div>
      )}

      {/* Note modal */}
      {noteItem && (
        <div style={OVERLAY} onClick={e => e.target === e.currentTarget && setNoteItem(null)}>
          <div style={{ background: "#0e2210", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 16, padding: "24px", maxWidth: 380, width: "100%", margin: "0 16px" }}>
            <div style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 14, marginBottom: 16 }}>
              {noteItem.image} {noteItem.name} — izoh
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
              {["Piyozsiz", "Muz ko'proq", "Muz kamroq", "Achchiqroq", "Sho'rroq", "Kam pishirilsin", "Ko'p pishirilsin", "Alohida sarab"].map(hint => (
                <button key={hint} onClick={() => setNoteText(hint)} style={{ background: "rgba(134,176,84,0.1)", border: "1px solid rgba(134,176,84,0.3)", borderRadius: 16, padding: "4px 12px", color: "#86B054", fontSize: 11, cursor: "pointer" }}>{hint}</button>
              ))}
            </div>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Yoki o'zingiz yozing..."
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(134,176,84,0.3)", borderRadius: 10, padding: "10px 14px", color: "#e8f5e0", fontSize: 13, outline: "none", resize: "none", height: 80, fontFamily: "Inter,sans-serif", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button onClick={saveNote} style={{ ...BTN.gold }}>Saqlash</button>
              <button onClick={() => setNoteItem(null)} style={{ ...BTN.ghost }}>Bekor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SCREEN: BILL ─────────────────────────────────────────────────────────────
function ScreenBill({ table, onBack, onPayment }) {
  const [vipSelected, setVipSelected] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const allItems = table.shots.flatMap(sh => sh.items);
  const grouped = allItems.reduce((acc, item) => {
    const ex = acc.find(x => x.id === item.id);
    if (ex) { ex.qty += item.qty; }
    else acc.push({ ...item });
    return acc;
  }, []);

  const subtotal = grouped.reduce((s, i) => s + i.price * i.qty, 0);
  const serviceFee = Math.round(subtotal * SERVICE_FEE);
  const vipCost = vipSelected ? VIP_PRICE : 0;
  const total = subtotal + serviceFee + vipCost;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0a1f0d,#0f2a10,#1a3a1a)", paddingBottom: 120 }}>
      <div style={{ background: "rgba(5,15,7,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(212,175,55,0.12)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, position: "sticky", top: 0, zIndex: 100 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
          <Icon d={ICONS.back} color="#7fa86b" size={22} />
        </button>
        <div>
          <div style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 16, fontWeight: 700 }}>Hisob</div>
          <div style={{ color: "#4a7a40", fontSize: 11 }}>Stol {table.id}</div>
        </div>
      </div>

      <div style={{ padding: "20px" }}>
        {/* Bill card */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(212,175,55,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 13 }}>AMAZONIA — HISOB</span>
            <span style={{ color: "#4a7a40", fontSize: 11 }}>Stol {table.id} · {table.shots.length} shot</span>
          </div>

          {/* Items */}
          <div style={{ padding: "8px 0" }}>
            {grouped.map(item => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontSize: 18 }}>{item.image}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#e8f5e0", fontSize: 13 }}>{item.name}</div>
                  {item.note && <div style={{ color: "#D4AF37", fontSize: 11 }}>📝 {item.note}</div>}
                </div>
                <span style={{ color: "#7fa86b", fontSize: 12 }}>x{item.qty}</span>
                <span style={{ color: "#e8f5e0", fontSize: 13, minWidth: 90, textAlign: "right" }}>{fmt(item.price * item.qty)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {[
              ["Mahsulotlar summasi", subtotal, "#e8f5e0"],
              [`Servis haqi (${Math.round(SERVICE_FEE * 100)}%)`, serviceFee, "#7fa86b"],
            ].map(([label, val, color]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: "#7fa86b", fontSize: 13 }}>{label}</span>
                <span style={{ color, fontSize: 13, fontWeight: 600 }}>{fmt(val)}</span>
              </div>
            ))}
            {vipSelected && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: "#D4AF37", fontSize: 13 }}>🌟 VIP xizmat</span>
                <span style={{ color: "#D4AF37", fontSize: 13, fontWeight: 600 }}>{fmt(VIP_PRICE)}</span>
              </div>
            )}
            <div style={{ borderTop: "1px solid rgba(212,175,55,0.25)", paddingTop: 10, marginTop: 8, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 15, fontWeight: 700 }}>JAMI</span>
              <span style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 18, fontWeight: 700 }}>{fmt(total)}</span>
            </div>
          </div>
        </div>

        {/* VIP toggle */}
        <div onClick={() => setVipSelected(v => !v)} style={{
          background: vipSelected ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${vipSelected ? "rgba(212,175,55,0.4)" : "rgba(134,176,84,0.15)"}`,
          borderRadius: 12, padding: "14px 16px", marginBottom: 20,
          cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
            🥂
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#D4AF37", fontSize: 14, fontWeight: 600, fontFamily: "Cinzel,serif" }}>VIP Xizmat</div>
            <div style={{ color: "#7fa86b", fontSize: 12 }}>2 ta mojito + 2 ta meva assorti</div>
            <div style={{ color: "#D4AF37", fontSize: 13, fontWeight: 700, marginTop: 2 }}>{fmt(VIP_PRICE)}</div>
          </div>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: vipSelected ? "#D4AF37" : "rgba(255,255,255,0.05)", border: `2px solid ${vipSelected ? "#D4AF37" : "rgba(134,176,84,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {vipSelected && <span style={{ color: "#0a1f0d", fontSize: 14, fontWeight: 700 }}>✓</span>}
          </div>
        </div>

        {/* Pay button */}
        <button onClick={() => setShowConfirm(true)} style={{ ...BTN.gold, padding: "16px 20px", borderRadius: 12, fontSize: 15, width: "100%", flex: "none" }}>
          <Icon d={ICONS.cash} size={20} color="#0a1f0d" />
          To'lovni boshlash
        </button>
      </div>

      {showConfirm && (
        <Confirm
          msg={`Jami: ${fmt(total)} — to'lovni tasdiqlaysizmi?`}
          onYes={() => { setShowConfirm(false); onPayment({ total, vip: vipSelected, subtotal, serviceFee }); }}
          onNo={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}

// ─── SCREEN: PAYMENT ─────────────────────────────────────────────────────────
function ScreenPayment({ table, billInfo, onBack, onComplete, toast }) {
  const [method, setMethod] = useState(null);
  const [cashEntered, setCashEntered] = useState("");
  const [confirming, setConfirming] = useState(false);

  const change = cashEntered ? Math.max(0, parseInt(cashEntered.replace(/\D/g, "") || 0) - billInfo.total) : 0;

  const processPayment = () => {
    if (!method) { toast("To'lov usulini tanlang", "warn"); return; }
    if (method === "cash" && parseInt(cashEntered.replace(/\D/g, "") || 0) < billInfo.total) {
      toast("Naqd pul yetarli emas", "error"); return;
    }
    setConfirming(true);
    setTimeout(() => { setConfirming(false); onComplete(); }, 1200);
  };

  const CARD_NO = "8600 **** **** 4521";
  const QR = "UZ-PAY-AMAZONIA-001";

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0a1f0d,#0f2a10,#1a3a1a)", paddingBottom: 100 }}>
      <div style={{ background: "rgba(5,15,7,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(212,175,55,0.12)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, position: "sticky", top: 0, zIndex: 100 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
          <Icon d={ICONS.back} color="#7fa86b" size={22} />
        </button>
        <div>
          <div style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 16, fontWeight: 700 }}>To'lov</div>
          <div style={{ color: "#4a7a40", fontSize: 11 }}>Stol {table.id}</div>
        </div>
      </div>

      <div style={{ padding: "20px" }}>
        {/* Total display */}
        <div style={{ textAlign: "center", padding: "24px 20px", marginBottom: 24, background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 16 }}>
          <div style={{ color: "#7fa86b", fontSize: 12, letterSpacing: 1, marginBottom: 8 }}>TO'LOV MIQDORI</div>
          <div style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 28, fontWeight: 700 }}>{fmt(billInfo.total)}</div>
          {billInfo.vip && <div style={{ color: "#86B054", fontSize: 12, marginTop: 4 }}>VIP xizmat qo'shilgan</div>}
        </div>

        {/* Payment methods */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          {[
            { id: "cash",    icon: "💵", label: "Naqd pul" },
            { id: "card",    icon: "💳", label: "Karta" },
          ].map(m => (
            <button key={m.id} onClick={() => setMethod(m.id)} style={{
              padding: "20px 14px", borderRadius: 12, cursor: "pointer",
              background: method === m.id ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.03)",
              border: `2px solid ${method === m.id ? "rgba(212,175,55,0.5)" : "rgba(134,176,84,0.15)"}`,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontSize: 28 }}>{m.icon}</span>
              <span style={{ color: method === m.id ? "#D4AF37" : "#7fa86b", fontSize: 13, fontWeight: method === m.id ? 600 : 400, fontFamily: "Inter,sans-serif" }}>{m.label}</span>
            </button>
          ))}
        </div>

        {/* Method specific */}
        {method === "cash" && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(134,176,84,0.2)", borderRadius: 12, padding: "16px 18px", marginBottom: 20 }}>
            <div style={{ color: "#D4AF37", fontSize: 11, letterSpacing: 2, marginBottom: 10, textTransform: "uppercase" }}>Naqd pul miqdori</div>
            <input
              type="number"
              value={cashEntered}
              onChange={e => setCashEntered(e.target.value)}
              placeholder={`Min: ${billInfo.total.toLocaleString()}`}
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(134,176,84,0.3)", borderRadius: 10, padding: "12px 14px", color: "#e8f5e0", fontSize: 16, outline: "none", fontFamily: "Inter,sans-serif", boxSizing: "border-box" }}
            />
            {change > 0 && (
              <div style={{ marginTop: 10, padding: "10px 14px", background: "rgba(39,174,96,0.1)", border: "1px solid rgba(39,174,96,0.3)", borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#7fa86b", fontSize: 13 }}>Qaytim:</span>
                <span style={{ color: "#2ecc71", fontSize: 14, fontWeight: 700 }}>{fmt(change)}</span>
              </div>
            )}
          </div>
        )}

        {method === "card" && (
          <div style={{ background: "rgba(41,128,185,0.08)", border: "1px solid rgba(41,128,185,0.25)", borderRadius: 12, padding: "16px 18px", marginBottom: 20 }}>
            <div style={{ color: "#3498db", fontSize: 11, letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" }}>Karta ma'lumotlari</div>
            <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
              <div style={{ width: 50, height: 34, borderRadius: 6, background: "linear-gradient(135deg,#1a3a6a,#2c5aa0)", border: "1px solid rgba(41,128,185,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontSize: 8, fontWeight: 700 }}>VISA</span>
              </div>
              <div>
                <div style={{ color: "#e8f5e0", fontSize: 14, letterSpacing: 2 }}>{CARD_NO}</div>
                <div style={{ color: "#4a7a40", fontSize: 11 }}>Terminal: POS-AMAZONIA-01</div>
              </div>
            </div>
            <div style={{ color: "#3498db", fontSize: 13 }}>Kartani terminalga ulang va to'lovni tasdiqlang</div>
          </div>
        )}

        {/* Pay button */}
        <button
          onClick={processPayment}
          disabled={confirming}
          style={{ ...BTN.gold, padding: "16px 20px", borderRadius: 12, fontSize: 15, width: "100%", flex: "none", opacity: confirming ? 0.7 : 1 }}
        >
          {confirming ? (
            <span style={{ width: 20, height: 20, border: "2px solid rgba(0,0,0,0.3)", borderTop: "2px solid #0a1f0d", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
          ) : (
            <>
              <Icon d={ICONS.check} size={18} color="#0a1f0d" />
              To'lovni tasdiqlash
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── SCREEN: RATING ───────────────────────────────────────────────────────────
function ScreenRating({ table, onDone, toast }) {
  const [foodRating, setFoodRating] = useState(0);
  const [waiterRating, setWaiterRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const StarRow = ({ value, onChange, label }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ color: "#7fa86b", fontSize: 12, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>{label}</div>
      <div style={{ display: "flex", gap: 10 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => onChange(n)} style={{
            width: 44, height: 44, borderRadius: 10, border: "none", cursor: "pointer",
            background: n <= value ? "rgba(212,175,55,0.25)" : "rgba(255,255,255,0.04)",
            fontSize: 24, transition: "all 0.15s",
          }}>
            <span style={{ filter: n <= value ? "none" : "grayscale(1)", opacity: n <= value ? 1 : 0.3 }}>⭐</span>
          </button>
        ))}
        <span style={{ color: "#D4AF37", fontSize: 18, fontWeight: 700, alignSelf: "center", marginLeft: 4 }}>
          {value > 0 ? value + ".0" : "—"}
        </span>
      </div>
    </div>
  );

  const submit = () => {
    if (foodRating === 0 || waiterRating === 0) { toast("Ikkala reytingni ham qo'ying", "warn"); return; }
    setSubmitted(true);
    toast("Reyting saqlandi va Telegramga yuborildi! 📤", "success");
    setTimeout(() => onDone(), 2000);
  };

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0a1f0d,#0f2a10,#1a3a1a)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20, padding: 24 }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(39,174,96,0.15)", border: "2px solid rgba(39,174,96,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>✓</div>
        <div style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 20, textAlign: "center" }}>Rahmat!</div>
        <div style={{ color: "#7fa86b", fontSize: 14, textAlign: "center" }}>Reyting saqlandi</div>
        <div style={{ color: "#4a7a40", fontSize: 12, textAlign: "center" }}>Stol tozalanmoqda...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0a1f0d,#0f2a10,#1a3a1a)", paddingBottom: 100 }}>
      <div style={{ background: "rgba(5,15,7,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(212,175,55,0.12)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(212,175,55,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⭐</div>
        <div>
          <div style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 16, fontWeight: 700 }}>Reyting</div>
          <div style={{ color: "#4a7a40", fontSize: 11 }}>Stol {table.id} — buyurtma tugadi</div>
        </div>
      </div>

      <div style={{ padding: "24px 20px" }}>
        <p style={{ color: "#7fa86b", fontSize: 14, lineHeight: 1.6, marginBottom: 24, textAlign: "center" }}>
          Mijoz sizga reyting beradi — pastga pastga aylantirib to'ldiring
        </p>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(134,176,84,0.15)", borderRadius: 14, padding: "20px" }}>
          <StarRow value={foodRating} onChange={setFoodRating} label="🍽️ Ovqat sifati" />
          <StarRow value={waiterRating} onChange={setWaiterRating} label="🧑‍🍽️ Ofitsiant xizmati" />

          <div style={{ marginBottom: 20 }}>
            <div style={{ color: "#7fa86b", fontSize: 12, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>Izoh (ixtiyoriy)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {["Ajoyib!", "Tez xizmat", "Mazali ovqat", "Yana kelamiz", "Sog'lom muhit"].map(hint => (
                <button key={hint} onClick={() => setComment(hint)} style={{ background: "rgba(134,176,84,0.1)", border: "1px solid rgba(134,176,84,0.3)", borderRadius: 16, padding: "4px 12px", color: "#86B054", fontSize: 11, cursor: "pointer" }}>{hint}</button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Fikr bildiring..."
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(134,176,84,0.3)", borderRadius: 10, padding: "10px 14px", color: "#e8f5e0", fontSize: 13, outline: "none", resize: "none", height: 70, fontFamily: "Inter,sans-serif", boxSizing: "border-box" }}
            />
          </div>

          <button onClick={submit} style={{ ...BTN.gold, padding: "14px 20px", borderRadius: 10, fontSize: 14, width: "100%", flex: "none" }}>
            <Icon d={ICONS.telegram} size={16} color="#0a1f0d" />
            Reytingni yuborish
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function WaiterPanel() {
  const navigate = useNavigate();

  // Sessiyani localStorage dan o'qiymiz
  const sessionUser = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  })();

  // Agar sessiya yo'q yoki rol WAITER emas bo'lsa — Login sahifasiga qaytaramiz
  useEffect(() => {
    if (!sessionUser || sessionUser.role !== "WAITER") {
      navigate("/", { replace: true });
    }
  }, []);

  const [tables, setTables] = useState(INITIAL_TABLES);
  const [screen, setScreen] = useState(S.TABLES);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedShot, setSelectedShot] = useState(null);
  const [billInfo, setBillInfo] = useState(null);
  const { toasts, toast, remove } = useToast();

  // Logout — sessiyani o'chirib Login ga qaytaramiz
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  // Table selection
  const handleSelectTable = (table) => {
    setSelectedTable(table);
    setScreen(S.TABLE_DETAIL);
  };

  // New shot
  const handleNewShot = () => {
    const newShot = { id: uid(), items: [], status: "new", createdAt: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }) };
    setSelectedShot(newShot);
    setScreen(S.ORDER);
  };

  // Open existing shot
  const handleOpenShot = (shot) => {
    setSelectedShot(shot);
    setScreen(S.ORDER);
  };

  // Save shot to table
  const handleUpdateShot = (updatedShot) => {
    setTables(prev => prev.map(t => {
      if (t.id !== selectedTable.id) return t;
      const existingIdx = t.shots.findIndex(s => s.id === updatedShot.id);
      const newShots = existingIdx >= 0
        ? t.shots.map(s => s.id === updatedShot.id ? updatedShot : s)
        : [...t.shots, updatedShot];
      return { ...t, status: "busy", shots: newShots };
    }));
    setSelectedTable(prev => {
      const existingIdx = prev.shots.findIndex(s => s.id === updatedShot.id);
      const newShots = existingIdx >= 0
        ? prev.shots.map(s => s.id === updatedShot.id ? updatedShot : s)
        : [...prev.shots, updatedShot];
      return { ...prev, status: "busy", shots: newShots };
    });
  };

  // Open bill
  const handleOpenBill = () => {
    setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, status: "bill" } : t));
    setSelectedTable(prev => ({ ...prev, status: "bill" }));
    setScreen(S.BILL);
  };

  // Payment done
  const handlePaymentDone = (info) => {
    setBillInfo(info);
    setScreen(S.RATING);
  };

  // Rating done — clear table
  const handleRatingDone = () => {
    setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, status: "free", shots: [] } : t));
    setSelectedTable(null);
    setBillInfo(null);
    setScreen(S.TABLES);
    toast("Stol bo'shatildi ✓", "success");
  };


  // Main router
  return (
    <div style={{ fontFamily: "Inter,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {screen === S.TABLES && (
        <ScreenTables
          tables={tables}
          setTables={setTables}
          onSelectTable={handleSelectTable}
          onLogout={handleLogout}
        />
      )}

      {screen === S.TABLE_DETAIL && selectedTable && (
        <ScreenTableDetail
          table={tables.find(t => t.id === selectedTable.id) || selectedTable}
          onBack={() => { setScreen(S.TABLES); setSelectedTable(null); }}
          onNewShot={handleNewShot}
          onOpenShot={handleOpenShot}
          onOpenBill={handleOpenBill}
        />
      )}

      {screen === S.ORDER && selectedTable && selectedShot && (
        <ScreenOrder
          table={selectedTable}
          shot={selectedShot}
          onBack={() => setScreen(S.TABLE_DETAIL)}
          onUpdateShot={handleUpdateShot}
          toast={toast}
        />
      )}

      {screen === S.BILL && selectedTable && (
        <ScreenBill
          table={tables.find(t => t.id === selectedTable.id) || selectedTable}
          onBack={() => setScreen(S.TABLE_DETAIL)}
          onPayment={(info) => { setBillInfo(info); setScreen(S.PAYMENT); }}
        />
      )}

      {screen === S.PAYMENT && selectedTable && billInfo && (
        <ScreenPayment
          table={selectedTable}
          billInfo={billInfo}
          onBack={() => setScreen(S.BILL)}
          onComplete={() => setScreen(S.RATING)}
          toast={toast}
        />
      )}

      {screen === S.RATING && selectedTable && (
        <ScreenRating
          table={selectedTable}
          onDone={handleRatingDone}
          toast={toast}
        />
      )}

      <ToastContainer toasts={toasts} remove={remove} />
    </div>
  );
}