import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { dbGet, dbSet, dbUpdate, dbRemove, dbListen } from "../firebase";
import { getStoredUser, clearUser } from "../App";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt   = (n) => (n || 0).toLocaleString("uz-UZ") + " so'm";
const uid   = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().slice(0, 10);
const nowStr = () => new Date().toLocaleString("uz-UZ");

// ─── SCREENS ──────────────────────────────────────────────────────────────────
const S = {
  TABLES:       "TABLES",
  TABLE_DETAIL: "TABLE_DETAIL",
  ORDER:        "ORDER",
  BILL:         "BILL",
  PAYMENT:      "PAYMENT",
  RATING:       "RATING",
};

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 20, color = "currentColor", stroke = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const IC = {
  back:     ["M19 12H5", "M12 19l-7-7 7-7"],
  plus:     "M12 5v14M5 12h14",
  minus:    "M5 12h14",
  check:    "M20 6L9 17l-5-5",
  x:        "M18 6L6 18M6 6l12 12",
  logout:   ["M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  bill:     ["M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z", "M14 2v6h6", "M16 13H8", "M16 17H8", "M10 9H8"],
  cash:     ["M12 1v22", "M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"],
  card:     ["M1 4h22v16H1z", "M1 10h22"],
  star:     "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  note:     ["M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z", "M14 2v6h6"],
  telegram: "M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z",
  refresh:  ["M23 4v6h-6", "M1 20v-6h6", "M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"],
  user:     ["M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2", "M12 11a4 4 0 100-8 4 4 0 000 8"],
  table:    ["M3 3h18v18H3z", "M3 9h18", "M3 15h18", "M9 3v18", "M15 3v18"],
};

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const OVERLAY = {
  position: "fixed", inset: 0,
  background: "rgba(0,0,0,0.78)", backdropFilter: "blur(4px)",
  zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
};

const BTN = {
  gold:   { background: "linear-gradient(135deg,#b8931f,#D4AF37)", border: "none", borderRadius: 10, color: "#0a1f0d", fontFamily: "Cinzel,serif", fontSize: 13, fontWeight: 700, letterSpacing: 1, padding: "12px 20px", cursor: "pointer", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 },
  ghost:  { background: "transparent", border: "1px solid rgba(134,176,84,0.4)", borderRadius: 10, color: "#86B054", fontFamily: "Inter,sans-serif", fontSize: 13, padding: "12px 20px", cursor: "pointer", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 },
  danger: { background: "rgba(192,57,43,0.85)", border: "1px solid rgba(220,80,80,0.4)", borderRadius: 10, color: "#fff", fontFamily: "Inter,sans-serif", fontSize: 13, padding: "12px 20px", cursor: "pointer", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" },
  red:    { background: "rgba(192,57,43,0.2)", border: "1px solid rgba(192,57,43,0.4)", borderRadius: 8, color: "#e74c3c", fontFamily: "Inter,sans-serif", fontSize: 12, padding: "8px 14px", cursor: "pointer" },
};

// ─── LIVE CLOCK ───────────────────────────────────────────────────────────────
function LiveClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(i);
  }, []);
  const pad = (n) => String(n).padStart(2, "0");
  return (
    <span style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 14, letterSpacing: 2 }}>
      {pad(t.getHours())}:{pad(t.getMinutes())}:{pad(t.getSeconds())}
    </span>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "info") => {
    const id = uid();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
  }, []);
  const remove = useCallback((id) => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, toast: add, remove };
}

function ToastContainer({ toasts, remove }) {
  const colors = { success: "#27ae60", error: "#c0392b", info: "#2980b9", warn: "#e67e22" };
  return (
    <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, alignItems: "center", pointerEvents: "none" }}>
      {toasts.map(t => (
        <div key={t.id} onClick={() => remove(t.id)} style={{
          background: colors[t.type] || colors.info, color: "#fff",
          padding: "11px 20px", borderRadius: 10, fontSize: 13,
          fontFamily: "Inter,sans-serif", boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", gap: 8, pointerEvents: "all",
          minWidth: 220, maxWidth: 340, cursor: "pointer", justifyContent: "center",
          animation: "slideUp 0.3s ease",
        }}>
          <span>{t.type === "success" ? "✓" : t.type === "error" ? "✗" : t.type === "warn" ? "⚠" : "ℹ"}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── BADGE ────────────────────────────────────────────────────────────────────
function Badge({ status }) {
  const map = {
    free:      { bg: "rgba(39,174,96,0.2)",   bd: "rgba(39,174,96,0.5)",   c: "#2ecc71", l: "Bo'sh" },
    busy:      { bg: "rgba(230,126,34,0.2)",  bd: "rgba(230,126,34,0.5)",  c: "#e67e22", l: "Band" },
    bill:      { bg: "rgba(212,175,55,0.2)",  bd: "rgba(212,175,55,0.5)",  c: "#D4AF37", l: "Hisob" },
    new:       { bg: "rgba(41,128,185,0.2)",  bd: "rgba(41,128,185,0.5)",  c: "#3498db", l: "Yangi" },
    preparing: { bg: "rgba(230,126,34,0.2)",  bd: "rgba(230,126,34,0.5)",  c: "#e67e22", l: "Tayyorlanmoqda" },
    ready:     { bg: "rgba(39,174,96,0.2)",   bd: "rgba(39,174,96,0.5)",   c: "#2ecc71", l: "Tayyor" },
    delivered: { bg: "rgba(100,100,100,0.2)", bd: "rgba(100,100,100,0.4)", c: "#7f8c8d", l: "Yetkazildi" },
    stop:      { bg: "rgba(230,126,34,0.2)",  bd: "rgba(230,126,34,0.5)",  c: "#e67e22", l: "To'xtatilgan" },
    active:    { bg: "rgba(39,174,96,0.15)",  bd: "rgba(39,174,96,0.4)",   c: "#2ecc71", l: "Faol" },
    hidden:    { bg: "rgba(100,100,100,0.2)", bd: "rgba(100,100,100,0.4)", c: "#95a5a6", l: "Yashirin" },
  };
  const s = map[status] || map.active;
  return (
    <span style={{ background: s.bg, border: `1px solid ${s.bd}`, color: s.c, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
      {s.l}
    </span>
  );
}

// ─── CONFIRM MODAL ────────────────────────────────────────────────────────────
function Confirm({ msg, onYes, onNo }) {
  return (
    <div style={OVERLAY} onClick={e => e.target === e.currentTarget && onNo()}>
      <div style={{ background: "#0e2210", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 16, padding: "28px 24px", maxWidth: 360, width: "100%", margin: "0 16px", boxShadow: "0 20px 60px rgba(0,0,0,0.7)" }}>
        <p style={{ color: "#e8f5e0", fontSize: 15, marginBottom: 24, lineHeight: 1.6, textAlign: "center" }}>{msg}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onYes} style={BTN.danger}>Ha, tasdiqlash</button>
          <button onClick={onNo}  style={BTN.ghost}>Bekor qilish</button>
        </div>
      </div>
    </div>
  );
}

// ─── LOADING ──────────────────────────────────────────────────────────────────
function Loading({ text = "Yuklanmoqda..." }) {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0a1f0d,#0f2a10,#1a3a1a)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div style={{ fontSize: 40 }}>🌿</div>
      <div style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 14, letterSpacing: 2 }}>{text}</div>
      <div style={{ width: 32, height: 32, border: "3px solid rgba(212,175,55,0.2)", borderTop: "3px solid #D4AF37", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// SCREEN: TABLES
// ════════════════════════════════════════════════════════════════════════════════
function ScreenTables({ tables, onSelectTable, onLogout, waiter }) {
  const [zone, setZone] = useState("all");

  // Stollarni Firebase dan kelgan ma'lumotlar asosida ko'rsatamiz
  const allZones = [...new Set(tables.map(t => t.zone))].sort();
  const filtered = zone === "all" ? tables : tables.filter(t => t.zone === zone);

  const statusColor = { free: "#2ecc71", busy: "#e67e22", bill: "#D4AF37" };
  const statusLabel = { free: "Bo'sh", busy: "Band", bill: "Hisob" };

  const counts = {
    free: tables.filter(t => t.status === "free").length,
    busy: tables.filter(t => t.status === "busy").length,
    bill: tables.filter(t => t.status === "bill").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0a1f0d,#0f2a10,#1a3a1a)", paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: "rgba(5,15,7,0.97)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(212,175,55,0.12)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#1a3a1a,#0f2a10)", border: "1px solid rgba(212,175,55,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🌿</div>
          <div>
            <div style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 14, fontWeight: 700, letterSpacing: 2 }}>AMAZONIA</div>
            <div style={{ color: "#4a7a40", fontSize: 10, letterSpacing: 1 }}>OFITSIANT PANEL</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <LiveClock />
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#e8f5e0", fontSize: 13, fontWeight: 600 }}>{waiter?.name || "Ofitsiant"}</div>
            <div style={{ color: "#4a7a40", fontSize: 11 }}>@{waiter?.username || "—"}</div>
          </div>
          <button onClick={onLogout} style={{ background: "rgba(192,57,43,0.15)", border: "1px solid rgba(192,57,43,0.35)", borderRadius: 8, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: "#e74c3c", fontSize: 12 }}>
            <Icon d={IC.logout} size={15} color="#e74c3c" />
          </button>
        </div>
      </div>

      <div style={{ padding: "18px 20px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 }}>
          {[["free","Bo'sh"],["busy","Band"],["bill","Hisob"]].map(([st, label]) => (
            <div key={st} style={{ background: `${statusColor[st]}10`, border: `1px solid ${statusColor[st]}35`, borderRadius: 12, padding: "14px 10px", textAlign: "center" }}>
              <div style={{ color: statusColor[st], fontSize: 26, fontWeight: 700, fontFamily: "Cinzel,serif" }}>{counts[st]}</div>
              <div style={{ color: "#7fa86b", fontSize: 11, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Zone filter */}
        {allZones.length > 1 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 18, overflowX: "auto", paddingBottom: 2 }}>
            {["all", ...allZones].map(z => (
              <button key={z} onClick={() => setZone(z)} style={{
                padding: "7px 16px", borderRadius: 20, cursor: "pointer", fontFamily: "Inter,sans-serif",
                fontSize: 12, whiteSpace: "nowrap",
                background: zone === z ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.04)",
                border: zone === z ? "1px solid rgba(212,175,55,0.5)" : "1px solid rgba(134,176,84,0.2)",
                color: zone === z ? "#D4AF37" : "#7fa86b",
              }}>
                {z === "all" ? "Barcha zonalar" : `${z} zona`}
              </button>
            ))}
          </div>
        )}

        {/* Tables grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "#3d5c38" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🪑</div>
            <div>Stollar topilmadi</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(86px, 1fr))", gap: 10 }}>
            {filtered.map(table => {
              const c = statusColor[table.status] || "#2ecc71";
              const shots = table.shots || [];
              const shotCount = shots.length;
              const totalItems = shots.reduce((s, sh) => s + (sh.items || []).reduce((ss, i) => ss + i.qty, 0), 0);
              return (
                <button key={table.id} onClick={() => onSelectTable(table)} style={{
                  height: 86, borderRadius: 12,
                  background: `${c}10`, border: `2px solid ${c}40`,
                  cursor: "pointer", display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 3,
                  position: "relative", transition: "all 0.2s",
                }}>
                  <span style={{ color: "#e8f5e0", fontSize: 13, fontWeight: 700, fontFamily: "Cinzel,serif" }}>{table.id}</span>
                  <span style={{ color: c, fontSize: 10, fontWeight: 600 }}>{statusLabel[table.status] || "Bo'sh"}</span>
                  {shotCount > 0 && (
                    <div style={{ position: "absolute", top: 5, right: 5, width: 18, height: 18, borderRadius: "50%", background: "#D4AF37", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ color: "#0a1f0d", fontSize: 10, fontWeight: 700 }}>{shotCount}</span>
                    </div>
                  )}
                  {totalItems > 0 && (
                    <span style={{ color: "#4a7a40", fontSize: 9 }}>{totalItems} ta</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// SCREEN: TABLE DETAIL
// ════════════════════════════════════════════════════════════════════════════════
function ScreenTableDetail({ table, onBack, onNewShot, onOpenShot, onOpenBill }) {
  const shots = table.shots || [];
  const totalItems  = shots.reduce((s, sh) => s + (sh.items || []).reduce((ss, i) => ss + i.qty, 0), 0);
  const totalAmount = shots.reduce((s, sh) => s + (sh.items || []).reduce((ss, i) => ss + i.price * i.qty, 0), 0);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0a1f0d,#0f2a10,#1a3a1a)", paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ background: "rgba(5,15,7,0.97)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(212,175,55,0.12)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, position: "sticky", top: 0, zIndex: 100 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
          <Icon d={IC.back} color="#7fa86b" size={22} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 16, fontWeight: 700 }}>Stol {table.id}</div>
          <div style={{ color: "#4a7a40", fontSize: 11 }}>{table.zone} zona</div>
        </div>
        <Badge status={table.status} />
      </div>

      <div style={{ padding: "18px 20px" }}>
        {/* Summary */}
        {shots.length > 0 && (
          <div style={{ background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 14, padding: "16px 20px", marginBottom: 18, display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ textAlign: "center", minWidth: 48 }}>
              <div style={{ color: "#D4AF37", fontSize: 22, fontWeight: 700, fontFamily: "Cinzel,serif" }}>{shots.length}</div>
              <div style={{ color: "#7fa86b", fontSize: 11 }}>Shot</div>
            </div>
            <div style={{ width: 1, background: "rgba(212,175,55,0.2)", alignSelf: "stretch" }} />
            <div style={{ textAlign: "center", minWidth: 48 }}>
              <div style={{ color: "#D4AF37", fontSize: 22, fontWeight: 700, fontFamily: "Cinzel,serif" }}>{totalItems}</div>
              <div style={{ color: "#7fa86b", fontSize: 11 }}>Mahsulot</div>
            </div>
            <div style={{ width: 1, background: "rgba(212,175,55,0.2)", alignSelf: "stretch" }} />
            <div style={{ flex: 1 }}>
              <div style={{ color: "#D4AF37", fontSize: 15, fontWeight: 700, fontFamily: "Cinzel,serif" }}>{fmt(totalAmount)}</div>
              <div style={{ color: "#7fa86b", fontSize: 11 }}>Umumiy summa</div>
            </div>
          </div>
        )}

        {/* Shots */}
        {shots.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
            {shots.map((shot, idx) => {
              const shotTotal = (shot.items || []).reduce((s, i) => s + i.price * i.qty, 0);
              return (
                <div key={shot.id} onClick={() => onOpenShot(shot)}
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(134,176,84,0.15)", borderRadius: 12, padding: "14px 16px", cursor: "pointer", transition: "border-color 0.2s" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: "#D4AF37", fontSize: 12, fontWeight: 700 }}>{idx + 1}</span>
                      </div>
                      <div>
                        <div style={{ color: "#e8f5e0", fontSize: 13, fontWeight: 600 }}>Shot #{idx + 1}</div>
                        <div style={{ color: "#4a7a40", fontSize: 11 }}>{(shot.items || []).reduce((s, i) => s + i.qty, 0)} ta mahsulot · {shot.createdAt || ""}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <Badge status={shot.status || "new"} />
                      <div style={{ color: "#D4AF37", fontSize: 14, fontWeight: 700, marginTop: 4 }}>{fmt(shotTotal)}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {(shot.items || []).slice(0, 4).map((item, i) => (
                      <span key={i} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 6, padding: "2px 8px", color: "#7fa86b", fontSize: 11 }}>
                        {item.image} {item.name} ×{item.qty}
                      </span>
                    ))}
                    {(shot.items || []).length > 4 && (
                      <span style={{ color: "#4a7a40", fontSize: 11 }}>+{shot.items.length - 4} ta</span>
                    )}
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
          <button onClick={onNewShot} style={{ ...BTN.gold, padding: "14px 20px", borderRadius: 12, fontSize: 14, flex: "none" }}>
            <Icon d={IC.plus} size={18} color="#0a1f0d" />
            Yangi shot ochish
          </button>
          {shots.length > 0 && (
            <button onClick={onOpenBill} style={{ ...BTN.ghost, padding: "14px 20px", borderRadius: 12, fontSize: 14, flex: "none" }}>
              <Icon d={IC.bill} size={18} color="#86B054" />
              Hisob chiqarish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// SCREEN: ORDER (MENU) — Firebase menu + categories
// ════════════════════════════════════════════════════════════════════════════════
function ScreenOrder({ table, shot, categories, menu, onBack, onUpdateShot, toast }) {
  const [activeCat, setActiveCat] = useState("all");
  const [cart,      setCart]      = useState(shot ? [...(shot.items || [])] : []);
  const [noteItem,  setNoteItem]  = useState(null);
  const [noteText,  setNoteText]  = useState("");

  // Active categoriyalar va menu
  const activeCats = Object.entries(categories).filter(([, c]) => c.status !== "hidden");
  const activeMenu = Object.entries(menu).filter(([, m]) => m.status !== "hidden");

  const filtered = activeCat === "all"
    ? activeMenu
    : activeMenu.filter(([, m]) => m.category === activeCat);

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const addItem = (id, item) => {
    if (item.status === "stop") { toast("Bu ovqat vaqtincha to'xtatilgan", "warn"); return; }
    setCart(prev => {
      const ex = prev.find(i => i.id === id);
      if (ex) return prev.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id, name: item.name, price: item.price, image: item.image || "🍽️", qty: 1, note: "" }];
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
      <div style={{ background: "rgba(5,15,7,0.97)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(212,175,55,0.12)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, position: "sticky", top: 0, zIndex: 100 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
          <Icon d={IC.back} color="#7fa86b" size={22} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 15, fontWeight: 700 }}>
            Stol {table.id} — Buyurtma
          </div>
          <div style={{ color: "#4a7a40", fontSize: 11 }}>Ovqat tanlang</div>
        </div>
        {cartCount > 0 && (
          <div style={{ background: "rgba(212,175,55,0.14)", border: "1px solid rgba(212,175,55,0.35)", borderRadius: 20, padding: "4px 12px", color: "#D4AF37", fontSize: 12, whiteSpace: "nowrap" }}>
            {cartCount} ta · {fmt(cartTotal)}
          </div>
        )}
      </div>

      {/* Category tabs */}
      <div style={{ display: "flex", gap: 8, padding: "12px 20px", overflowX: "auto" }}>
        {[{ id: "all", name: "Hammasi", icon: "🍽️" }, ...activeCats.map(([id, c]) => ({ id, ...c }))].map(c => (
          <button key={c.id} onClick={() => setActiveCat(c.id)} style={{
            padding: "7px 14px", borderRadius: 20, cursor: "pointer", fontFamily: "Inter,sans-serif",
            fontSize: 12, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 5,
            background: activeCat === c.id ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.04)",
            border: activeCat === c.id ? "1px solid rgba(212,175,55,0.5)" : "1px solid rgba(134,176,84,0.2)",
            color: activeCat === c.id ? "#D4AF37" : "#7fa86b",
          }}>
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {/* Menu items */}
      <div style={{ padding: "0 20px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.length === 0 && (
          <div style={{ color: "#3d5c38", textAlign: "center", padding: 40, fontSize: 13 }}>
            Bu kategoriyada ovqat yo'q
          </div>
        )}
        {filtered.map(([id, item]) => {
          const qty = getQty(id);
          const cartItem = cart.find(i => i.id === id);
          return (
            <div key={id} style={{
              background: "rgba(255,255,255,0.03)",
              border: qty > 0 ? "1px solid rgba(212,175,55,0.35)" : "1px solid rgba(134,176,84,0.12)",
              borderRadius: 12, padding: "14px 16px",
              opacity: item.status === "stop" ? 0.55 : 1,
              display: "flex", gap: 12, alignItems: "center",
            }}>
              <div style={{ width: 52, height: 52, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
                {item.image || "🍽️"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#e8f5e0", fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{item.name}</div>
                {item.description && (
                  <div style={{ color: "#4a7a40", fontSize: 11, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.description}</div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#D4AF37", fontSize: 14, fontWeight: 700 }}>{fmt(item.price)}</span>
                  {item.status === "stop" && <Badge status="stop" />}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                {qty > 0 ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button onClick={() => removeItem(id)} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(192,57,43,0.2)", border: "1px solid rgba(192,57,43,0.4)", cursor: "pointer", color: "#e74c3c", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon d={IC.minus} size={14} color="#e74c3c" />
                      </button>
                      <span style={{ color: "#D4AF37", fontSize: 16, fontWeight: 700, minWidth: 22, textAlign: "center" }}>{qty}</span>
                      <button onClick={() => addItem(id, item)} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(212,175,55,0.2)", border: "1px solid rgba(212,175,55,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon d={IC.plus} size={14} color="#D4AF37" />
                      </button>
                    </div>
                    <button onClick={() => { setNoteItem({ id, name: item.name, image: item.image }); setNoteText(cartItem?.note || ""); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: cartItem?.note ? "#D4AF37" : "#4a7a40", fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}>
                      <Icon d={IC.note} size={11} color={cartItem?.note ? "#D4AF37" : "#4a7a40"} />
                      {cartItem?.note ? "Izoh bor" : "Izoh qo'sh"}
                    </button>
                  </>
                ) : (
                  <button onClick={() => addItem(id, item)} style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: item.status === "stop" ? "rgba(100,100,100,0.15)" : "rgba(212,175,55,0.18)",
                    border: `1px solid ${item.status === "stop" ? "rgba(100,100,100,0.35)" : "rgba(212,175,55,0.4)"}`,
                    cursor: item.status === "stop" ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon d={IC.plus} size={18} color={item.status === "stop" ? "#7f8c8d" : "#D4AF37"} />
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
          <div style={{ flex: 1, background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ color: "#7fa86b", fontSize: 11, marginBottom: 2 }}>Savat</div>
            <div style={{ color: "#D4AF37", fontSize: 14, fontWeight: 700 }}>{cartCount} ta · {fmt(cartTotal)}</div>
          </div>
          <button onClick={submitOrder} style={{ ...BTN.gold, flex: "none", padding: "12px 24px", borderRadius: 10, fontSize: 13 }}>
            <Icon d={IC.telegram} size={16} color="#0a1f0d" />
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
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {["Piyozsiz", "Muz ko'proq", "Muz kamroq", "Achchiqroq", "Sho'rroq", "Kam pishirilsin", "Ko'p pishirilsin", "Alohida sarab"].map(hint => (
                <button key={hint} onClick={() => setNoteText(hint)} style={{ background: "rgba(134,176,84,0.1)", border: "1px solid rgba(134,176,84,0.3)", borderRadius: 16, padding: "4px 12px", color: "#86B054", fontSize: 11, cursor: "pointer" }}>{hint}</button>
              ))}
            </div>
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
              placeholder="Yoki o'zingiz yozing..."
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(134,176,84,0.3)", borderRadius: 10, padding: "10px 14px", color: "#e8f5e0", fontSize: 13, outline: "none", resize: "none", height: 80, fontFamily: "Inter,sans-serif", boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button onClick={saveNote} style={BTN.gold}>Saqlash</button>
              <button onClick={() => setNoteItem(null)} style={BTN.ghost}>Bekor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// SCREEN: BILL
// ════════════════════════════════════════════════════════════════════════════════
function ScreenBill({ table, settings, onBack, onPayment }) {
  const [vipSelected,  setVipSelected]  = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);

  // Settings dan VIP narx va servis haqi
  const VIP_PRICE   = parseInt(settings?.vip?.price    || 220000);
  const SERVICE_FEE = parseFloat(settings?.vip?.serviceFee || 12) / 100;

  const shots   = table.shots || [];
  const allItems = shots.flatMap(sh => sh.items || []);
  const grouped  = allItems.reduce((acc, item) => {
    const ex = acc.find(x => x.id === item.id);
    if (ex) { ex.qty += item.qty; }
    else acc.push({ ...item });
    return acc;
  }, []);

  const subtotal   = grouped.reduce((s, i) => s + i.price * i.qty, 0);
  const serviceFee = Math.round(subtotal * SERVICE_FEE);
  const vipCost    = vipSelected ? VIP_PRICE : 0;
  const total      = subtotal + serviceFee + vipCost;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0a1f0d,#0f2a10,#1a3a1a)", paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ background: "rgba(5,15,7,0.97)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(212,175,55,0.12)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, position: "sticky", top: 0, zIndex: 100 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
          <Icon d={IC.back} color="#7fa86b" size={22} />
        </button>
        <div>
          <div style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 16, fontWeight: 700 }}>Hisob</div>
          <div style={{ color: "#4a7a40", fontSize: 11 }}>Stol {table.id} · {shots.length} shot</div>
        </div>
      </div>

      <div style={{ padding: "18px 20px" }}>
        {/* Bill card */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 16, overflow: "hidden", marginBottom: 14 }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(212,175,55,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 13 }}>
              {settings?.restaurant?.name || "AMAZONIA"} — HISOB
            </span>
            <span style={{ color: "#4a7a40", fontSize: 11 }}>Stol {table.id}</span>
          </div>

          {/* Items */}
          <div style={{ padding: "8px 0" }}>
            {grouped.map(item => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontSize: 18 }}>{item.image || "🍽️"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#e8f5e0", fontSize: 13 }}>{item.name}</div>
                  {item.note && <div style={{ color: "#D4AF37", fontSize: 11 }}>📝 {item.note}</div>}
                </div>
                <span style={{ color: "#7fa86b", fontSize: 12 }}>×{item.qty}</span>
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
                <span style={{ color: "#D4AF37", fontSize: 13 }}>🥂 VIP xizmat</span>
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
          border: `1px solid ${vipSelected ? "rgba(212,175,55,0.45)" : "rgba(134,176,84,0.15)"}`,
          borderRadius: 12, padding: "14px 16px", marginBottom: 18,
          cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(212,175,55,0.14)", border: "1px solid rgba(212,175,55,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
            🥂
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#D4AF37", fontSize: 14, fontWeight: 600, fontFamily: "Cinzel,serif" }}>VIP Xizmat</div>
            <div style={{ color: "#7fa86b", fontSize: 12, marginTop: 2 }}>{settings?.vip?.description || "2 ta mojito + 2 ta meva assorti"}</div>
            <div style={{ color: "#D4AF37", fontSize: 13, fontWeight: 700, marginTop: 3 }}>{fmt(VIP_PRICE)}</div>
          </div>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: vipSelected ? "#D4AF37" : "rgba(255,255,255,0.05)", border: `2px solid ${vipSelected ? "#D4AF37" : "rgba(134,176,84,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {vipSelected && <span style={{ color: "#0a1f0d", fontSize: 14, fontWeight: 700 }}>✓</span>}
          </div>
        </div>

        <button onClick={() => setShowConfirm(true)} style={{ ...BTN.gold, padding: "16px 20px", borderRadius: 12, fontSize: 15, width: "100%", flex: "none" }}>
          <Icon d={IC.cash} size={20} color="#0a1f0d" />
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

// ════════════════════════════════════════════════════════════════════════════════
// SCREEN: PAYMENT
// ════════════════════════════════════════════════════════════════════════════════
function ScreenPayment({ table, billInfo, onBack, onComplete, toast }) {
  const [method,      setMethod]      = useState(null);
  const [cashEntered, setCashEntered] = useState("");
  const [confirming,  setConfirming]  = useState(false);

  const cashNum = parseInt(String(cashEntered).replace(/\D/g, "") || "0");
  const change  = cashNum > billInfo.total ? cashNum - billInfo.total : 0;

  const processPayment = () => {
    if (!method) { toast("To'lov usulini tanlang", "warn"); return; }
    if (method === "cash" && cashNum < billInfo.total) { toast("Naqd pul yetarli emas", "error"); return; }
    setConfirming(true);
    setTimeout(() => { setConfirming(false); onComplete(); }, 1200);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0a1f0d,#0f2a10,#1a3a1a)", paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ background: "rgba(5,15,7,0.97)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(212,175,55,0.12)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, position: "sticky", top: 0, zIndex: 100 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
          <Icon d={IC.back} color="#7fa86b" size={22} />
        </button>
        <div>
          <div style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 16, fontWeight: 700 }}>To'lov</div>
          <div style={{ color: "#4a7a40", fontSize: 11 }}>Stol {table.id}</div>
        </div>
      </div>

      <div style={{ padding: "20px" }}>
        {/* Total */}
        <div style={{ textAlign: "center", padding: "24px 20px", marginBottom: 24, background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 16 }}>
          <div style={{ color: "#7fa86b", fontSize: 12, letterSpacing: 1, marginBottom: 8 }}>TO'LOV MIQDORI</div>
          <div style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 28, fontWeight: 700 }}>{fmt(billInfo.total)}</div>
          {billInfo.vip && <div style={{ color: "#86B054", fontSize: 12, marginTop: 4 }}>🥂 VIP xizmat qo'shilgan</div>}
        </div>

        {/* Payment methods */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          {[{ id: "cash", icon: "💵", label: "Naqd pul" }, { id: "card", icon: "💳", label: "Karta" }].map(m => (
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

        {method === "cash" && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(134,176,84,0.2)", borderRadius: 12, padding: "16px 18px", marginBottom: 20 }}>
            <div style={{ color: "#D4AF37", fontSize: 11, letterSpacing: 2, marginBottom: 10, textTransform: "uppercase" }}>Naqd pul miqdori</div>
            <input type="number" value={cashEntered} onChange={e => setCashEntered(e.target.value)}
              placeholder={`Min: ${billInfo.total.toLocaleString()}`}
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(134,176,84,0.3)", borderRadius: 10, padding: "12px 14px", color: "#e8f5e0", fontSize: 16, outline: "none", fontFamily: "Inter,sans-serif", boxSizing: "border-box" }} />
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
            <div style={{ color: "#3498db", fontSize: 11, letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" }}>Karta to'lovi</div>
            <div style={{ color: "#3498db", fontSize: 13 }}>Kartani terminalga ulang va tasdiqlang</div>
          </div>
        )}

        <button onClick={processPayment} disabled={confirming}
          style={{ ...BTN.gold, padding: "16px 20px", borderRadius: 12, fontSize: 15, width: "100%", flex: "none", opacity: confirming ? 0.7 : 1 }}>
          {confirming ? (
            <span style={{ width: 20, height: 20, border: "2px solid rgba(0,0,0,0.3)", borderTop: "2px solid #0a1f0d", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
          ) : (
            <><Icon d={IC.check} size={18} color="#0a1f0d" />To'lovni tasdiqlash</>
          )}
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// SCREEN: RATING
// ════════════════════════════════════════════════════════════════════════════════
function ScreenRating({ table, onDone, toast }) {
  const [foodRating,   setFoodRating]   = useState(0);
  const [waiterRating, setWaiterRating] = useState(0);
  const [comment,      setComment]      = useState("");
  const [submitted,    setSubmitted]    = useState(false);

  const StarRow = ({ value, onChange, label }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ color: "#7fa86b", fontSize: 12, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>{label}</div>
      <div style={{ display: "flex", gap: 8 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => onChange(n)} style={{
            width: 44, height: 44, borderRadius: 10, border: "none", cursor: "pointer",
            background: n <= value ? "rgba(212,175,55,0.25)" : "rgba(255,255,255,0.04)", fontSize: 24,
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
    toast("Reyting saqlandi! 📤", "success");
    setTimeout(() => onDone({ foodRating, waiterRating, comment }), 2000);
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
      <div style={{ background: "rgba(5,15,7,0.97)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(212,175,55,0.12)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(212,175,55,0.14)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⭐</div>
        <div>
          <div style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 16, fontWeight: 700 }}>Reyting</div>
          <div style={{ color: "#4a7a40", fontSize: 11 }}>Stol {table.id} — buyurtma tugadi</div>
        </div>
      </div>

      <div style={{ padding: "24px 20px" }}>
        <p style={{ color: "#7fa86b", fontSize: 14, lineHeight: 1.6, marginBottom: 24, textAlign: "center" }}>
          Mijoz reytingini qoldiring
        </p>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(134,176,84,0.15)", borderRadius: 14, padding: "20px" }}>
          <StarRow value={foodRating}   onChange={setFoodRating}   label="🍽️ Ovqat sifati" />
          <StarRow value={waiterRating} onChange={setWaiterRating} label="🧑‍🍽️ Ofitsiant xizmati" />
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: "#7fa86b", fontSize: 12, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>Izoh (ixtiyoriy)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {["Ajoyib!", "Tez xizmat", "Mazali ovqat", "Yana kelamiz", "Sog'lom muhit"].map(hint => (
                <button key={hint} onClick={() => setComment(hint)} style={{ background: "rgba(134,176,84,0.1)", border: "1px solid rgba(134,176,84,0.3)", borderRadius: 16, padding: "4px 12px", color: "#86B054", fontSize: 11, cursor: "pointer" }}>{hint}</button>
              ))}
            </div>
            <textarea value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Fikr bildiring..."
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(134,176,84,0.3)", borderRadius: 10, padding: "10px 14px", color: "#e8f5e0", fontSize: 13, outline: "none", resize: "none", height: 70, fontFamily: "Inter,sans-serif", boxSizing: "border-box" }} />
          </div>
          <button onClick={submit} style={{ ...BTN.gold, padding: "14px 20px", borderRadius: 10, fontSize: 14, width: "100%", flex: "none" }}>
            <Icon d={IC.telegram} size={16} color="#0a1f0d" />
            Reytingni yuborish
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN WAITER PANEL
// ════════════════════════════════════════════════════════════════════════════════
export default function WaiterPanel() {
  const navigate = useNavigate();

  // ── 1. Auth ────────────────────────────────────────────────────────────────
  const [user] = useState(() => getStoredUser());

  useEffect(() => {
    if (!user || user.role !== "WAITER") {
      navigate("/", { replace: true });
    }
  }, []); // eslint-disable-line

  // ── 2. Firebase real-time data ─────────────────────────────────────────────
  const [tables,     setTables]     = useState([]);
  const [categories, setCategories] = useState({});
  const [menu,       setMenu]       = useState({});
  const [settings,   setSettings]   = useState(null);
  const [dbReady,    setDbReady]    = useState(false);

  useEffect(() => {
    if (!user) return;

    // Settings (bir marta o'qish kifoya)
    dbGet("settings").then(d => setSettings(d || {}));

    // Stollarni Firebase dan real-time tinglash
    // Har bir ofitsiant o'z stollarini ko'radi (tableZone bo'yicha) yoki hammani
    const unsubs = [
      dbListen("tables", (data) => {
        if (!data) {
          // Stollar yo'q — bo'sh array
          setTables([]);
          setDbReady(true);
          return;
        }
        // Firebase dan kelgan stollar
        const list = Object.entries(data).map(([id, t]) => ({ id, ...t }));
        // Waiter o'z zonasini ko'radi yoki hamma stolni (tableZone bo'sh bo'lsa)
        const filtered = user.tableZone
          ? list.filter(t => t.zone === user.tableZone || !user.tableZone)
          : list;
        setTables(filtered.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true })));
        setDbReady(true);
      }),
      dbListen("categories", (d) => setCategories(d || {})),
      dbListen("menu",       (d) => setMenu(d || {})),
    ];

    return () => unsubs.forEach(u => u && u());
  }, []); // eslint-disable-line

  // ── 3. Screen state ────────────────────────────────────────────────────────
  const [screen,        setScreen]        = useState(S.TABLES);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedShot,  setSelectedShot]  = useState(null);
  const [billInfo,      setBillInfo]       = useState(null);
  const { toasts, toast, remove } = useToast();

  // Aktual table: real-time tables dan olamiz
  const activeTable = selectedTable
    ? (tables.find(t => t.id === selectedTable.id) || selectedTable)
    : null;

  // ── 4. Logout ──────────────────────────────────────────────────────────────
  const handleLogout = () => {
    clearUser();
    navigate("/", { replace: true });
  };

  // ── 5. Table operations → Firebase ────────────────────────────────────────

  const handleSelectTable = (table) => {
    setSelectedTable(table);
    setScreen(S.TABLE_DETAIL);
  };

  const handleNewShot = () => {
    const newShot = {
      id:        uid(),
      items:     [],
      status:    "new",
      createdAt: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
    };
    setSelectedShot(newShot);
    setScreen(S.ORDER);
  };

  const handleOpenShot = (shot) => {
    setSelectedShot(shot);
    setScreen(S.ORDER);
  };

  // Shot ni Firebase ga saqlash
  const handleUpdateShot = async (updatedShot) => {
    const tbl = activeTable;
    if (!tbl) return;

    const existingShots = tbl.shots || [];
    const idx = existingShots.findIndex(s => s.id === updatedShot.id);
    const newShots = idx >= 0
      ? existingShots.map(s => s.id === updatedShot.id ? updatedShot : s)
      : [...existingShots, updatedShot];

    try {
      await dbUpdate(`tables/${tbl.id}`, {
        status: "busy",
        shots:  newShots,
      });

      // Ofitsiant buyurtma sonini oshirish
      if (user?.id) {
        const w = await dbGet(`waiters/${user.id}`);
        if (w) {
          await dbUpdate(`waiters/${user.id}`, { orders: (w.orders || 0) + 1 });
        }
      }
    } catch (e) {
      toast("Firebase xatoligi: " + e.message, "error");
    }
  };

  // Hisob chiqarish
  const handleOpenBill = async () => {
    if (!activeTable) return;
    try {
      await dbUpdate(`tables/${activeTable.id}`, { status: "bill" });
      setScreen(S.BILL);
    } catch (e) {
      toast("Xatolik: " + e.message, "error");
    }
  };

  // To'lov bo'lgach — order saqlash
  const handlePaymentDone = async (info) => {
    setBillInfo(info);
    // Orderni saqlash
    const tbl = activeTable;
    if (tbl) {
      const orderId = "ord_" + uid();
      try {
        await dbSet(`orders/${orderId}`, {
          tableId:    tbl.id,
          table:      tbl.id,
          waiterId:   user?.id   || "",
          waiterName: user?.name || "",
          shots:      tbl.shots  || [],
          total:      info.total,
          subtotal:   info.subtotal,
          serviceFee: info.serviceFee,
          vip:        info.vip,
          date:       today(),
          time:       new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
          createdAt:  nowStr(),
        });
      } catch (e) {
        toast("Order saqlanmadi: " + e.message, "warn");
      }
    }
    setScreen(S.RATING);
  };

  // Reyting va stolni tozalash
  const handleRatingDone = async ({ foodRating, waiterRating, comment }) => {
    const tbl = activeTable;
    if (!tbl) return;

    try {
      // Stolni tozalash
      await dbUpdate(`tables/${tbl.id}`, {
        status: "free",
        shots:  [],
      });

      // Ofitsiant reytingini yangilash
      if (user?.id) {
        const w = await dbGet(`waiters/${user.id}`);
        if (w) {
          const prevRating  = parseFloat(w.rating || 0);
          const ratingCount = parseInt(w.ratingCount || 0);
          const newCount    = ratingCount + 1;
          const newRating   = ((prevRating * ratingCount) + waiterRating) / newCount;
          await dbUpdate(`waiters/${user.id}`, {
            rating:      parseFloat(newRating.toFixed(2)),
            ratingCount: newCount,
          });
        }
      }
    } catch (e) {
      toast("Xatolik: " + e.message, "warn");
    }

    setSelectedTable(null);
    setBillInfo(null);
    setScreen(S.TABLES);
    toast("Stol bo'shatildi ✓", "success");
  };

  // ── Early returns ──────────────────────────────────────────────────────────
  if (!user) return null;
  if (!dbReady) return <Loading text="Ma'lumotlar yuklanmoqda..." />;

  // Stollar mavjud emas (SuperAdmin hali qo'shmagan)
  if (tables.length === 0 && dbReady) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0a1f0d,#0f2a10,#1a3a1a)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24 }}>
        <div style={{ fontSize: 48 }}>🪑</div>
        <div style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 16, letterSpacing: 2, textAlign: "center" }}>Stollar topilmadi</div>
        <div style={{ color: "#4a7a40", fontSize: 13, textAlign: "center", maxWidth: 300, lineHeight: 1.6 }}>
          Super Admin hali stollar qo'shmagan. Iltimos, admin bilan bog'laning.
        </div>
        <button onClick={handleLogout} style={{ ...BTN.ghost, flex: "none", marginTop: 8 }}>
          Chiqish
        </button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "Inter,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.3); border-radius: 2px; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        button:active { opacity: 0.85; }
        input:focus, textarea:focus { outline: none; border-color: rgba(212,175,55,0.5) !important; box-shadow: 0 0 0 2px rgba(212,175,55,0.08); }
      `}</style>

      {screen === S.TABLES && (
        <ScreenTables
          tables={tables}
          onSelectTable={handleSelectTable}
          onLogout={handleLogout}
          waiter={user}
        />
      )}

      {screen === S.TABLE_DETAIL && activeTable && (
        <ScreenTableDetail
          table={activeTable}
          onBack={() => { setScreen(S.TABLES); setSelectedTable(null); }}
          onNewShot={handleNewShot}
          onOpenShot={handleOpenShot}
          onOpenBill={handleOpenBill}
        />
      )}

      {screen === S.ORDER && activeTable && selectedShot && (
        <ScreenOrder
          table={activeTable}
          shot={selectedShot}
          categories={categories}
          menu={menu}
          onBack={() => setScreen(S.TABLE_DETAIL)}
          onUpdateShot={handleUpdateShot}
          toast={toast}
        />
      )}

      {screen === S.BILL && activeTable && (
        <ScreenBill
          table={activeTable}
          settings={settings}
          onBack={() => setScreen(S.TABLE_DETAIL)}
          onPayment={(info) => { setBillInfo(info); handlePaymentDone(info); }}
        />
      )}

      {screen === S.PAYMENT && activeTable && billInfo && (
        <ScreenPayment
          table={activeTable}
          billInfo={billInfo}
          onBack={() => setScreen(S.BILL)}
          onComplete={() => setScreen(S.RATING)}
          toast={toast}
        />
      )}

      {screen === S.RATING && activeTable && (
        <ScreenRating
          table={activeTable}
          onDone={handleRatingDone}
          toast={toast}
        />
      )}

      <ToastContainer toasts={toasts} remove={remove} />
    </div>
  );
}