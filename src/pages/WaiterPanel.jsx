// WaiterPanel.jsx - MUKAMMAL PROFESSIONAL VERSIYA
// Ofitsiant profili, real-time ball, servis haqi to'g'ri hisoblash, premium UI

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { dbGet, dbSet, dbUpdate, dbRemove, dbListen } from "../firebase";
import { getStoredUser, clearUser } from "../App";
import { listenTables, ensureTablesExist, ZONES_CONFIG, BISETKA_INFO } from "../tableData";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (n) => (n || 0).toLocaleString("uz-UZ") + " so'm";
const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().slice(0, 10);
const nowStr = () => new Date().toLocaleString("uz-UZ");

// ─── TELEGRAM BOT CONFIG ────────────────────────────────────────────────────
const TELEGRAM_BOT_TOKEN = "8439103046:AAEdXNGGDRlMy56JrFgz8eivms-tr9PFKuY";
const TELEGRAM_CHAT_IDS = ["5916247309", "6290796444"];

// ─── TELEGRAM SENDER ────────────────────────────────────────────────────────
async function sendTelegramMessage(message, chatId) {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );
    return response.ok;
  } catch (error) {
    console.error("Telegram yuborish xatosi:", error);
    return false;
  }
}

async function sendTelegramToAll(message) {
  const results = await Promise.all(
    TELEGRAM_CHAT_IDS.map((chatId) => sendTelegramMessage(message, chatId))
  );
  return results.every((r) => r === true);
}

// ─── SCREENS ──────────────────────────────────────────────────────────────────
const S = {
  TABLES: "TABLES",
  TABLE_DETAIL: "TABLE_DETAIL",
  ORDER: "ORDER",
  BILL: "BILL",
  PAYMENT: "PAYMENT",
  RATING: "RATING",
  PROFILE: "PROFILE",
};

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 20, color = "currentColor", stroke = 1.8 }) => (
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
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const IC = {
  back: ["M19 12H5", "M12 19l-7-7 7-7"],
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  check: "M20 6L9 17l-5-5",
  x: "M18 6L6 18M6 6l12 12",
  logout: ["M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  bill: [
    "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z",
    "M14 2v6h6",
    "M16 13H8",
    "M16 17H8",
    "M10 9H8",
  ],
  cash: ["M12 1v22", "M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"],
  card: ["M1 4h22v16H1z", "M1 10h22"],
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  note: [
    "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z",
    "M14 2v6h6",
  ],
  send: "M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z",
  refresh: [
    "M23 4v6h-6",
    "M1 20v-6h6",
    "M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
  ],
  user: [
    "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2",
    "M12 11a4 4 0 100-8 4 4 0 000 8",
  ],
  phone: [
    "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z",
  ],
  copy: [
    "M20 9H11a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2z",
    "M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1",
  ],
  shield: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"],
  receipt: [
    "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z",
    "M14 2v6h6",
    "M9 15h6",
    "M9 11h6",
    "M9 7h1",
  ],
  menuBars: ["M3 6h18", "M3 12h18", "M3 18h18"],
  home: ["M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z", "M9 22V12h6v10"],
  telegram: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z",
  robot: "M12 2v4M5 10h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2zM9 16v0M15 16v0",
  calendar: "M8 2v4M16 2v4M3 10h18M21 6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6z",
  award: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  trending: "M3 12l4-4 4 4 4-4 6 6M21 18V8",
};

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const OVERLAY = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.85)",
  backdropFilter: "blur(10px)",
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const BTN = {
  gold: {
    background: "linear-gradient(135deg,#b8931f,#D4AF37,#e8c84a)",
    border: "none",
    borderRadius: 12,
    color: "#0a1f0d",
    fontFamily: "Cinzel,serif",
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: 1,
    padding: "14px 24px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxShadow: "0 4px 15px rgba(212,175,55,0.3)",
  },
  ghost: {
    background: "rgba(134,176,84,0.1)",
    border: "1px solid rgba(134,176,84,0.4)",
    borderRadius: 12,
    color: "#86B054",
    fontFamily: "Inter,sans-serif",
    fontSize: 13,
    padding: "14px 24px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  danger: {
    background: "rgba(192,57,43,0.85)",
    border: "1px solid rgba(220,80,80,0.4)",
    borderRadius: 12,
    color: "#fff",
    fontFamily: "Inter,sans-serif",
    fontSize: 13,
    padding: "14px 24px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
};

// ─── MENU ITEM THUMBNAIL ──────────────────────────────────────────────────────
function MenuItemThumb({ item, size = 90 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 16,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.44,
        flexShrink: 0,
        overflow: "hidden",
        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.3)",
      }}
    >
      {item.image && item.image.startsWith("data:") ? (
        <img
          src={item.image}
          alt={item.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <span>{item.emoji || item.image || "🍽️"}</span>
      )}
    </div>
  );
}

// ─── LIVE CLOCK ───────────────────────────────────────────────────────────────
function LiveClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(i);
  }, []);
  const pad = (n) => String(n).padStart(2, "0");
  const DAYS = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];
  const MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span
        style={{
          fontFamily: "Cinzel,serif",
          color: "#D4AF37",
          fontSize: 14,
          letterSpacing: 2,
        }}
      >
        {pad(t.getHours())}:{pad(t.getMinutes())}:{pad(t.getSeconds())}
      </span>
      <span style={{ color: "#4a7a40", fontSize: 10 }}>
        {DAYS[t.getDay()]}, {t.getDate()} {MONTHS[t.getMonth()]}
      </span>
    </div>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "info") => {
    const id = uid();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);
  const remove = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  return { toasts, toast: add, remove };
}

function ToastContainer({ toasts, remove }) {
  const colors = { success: "#27ae60", error: "#c0392b", info: "#2980b9", warn: "#e67e22" };
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        alignItems: "center",
        pointerEvents: "none",
        width: "92vw",
        maxWidth: 400,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => remove(t.id)}
          style={{
            background: colors[t.type] || colors.info,
            color: "#fff",
            padding: "13px 22px",
            borderRadius: 12,
            fontSize: 14,
            fontFamily: "Inter,sans-serif",
            boxShadow: "0 6px 24px rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            pointerEvents: "all",
            width: "100%",
            cursor: "pointer",
            justifyContent: "center",
            animation: "slideUp 0.3s ease",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <span style={{ fontSize: 16 }}>
            {t.type === "success" ? "✅" : t.type === "error" ? "❌" : t.type === "warn" ? "⚠️" : "ℹ️"}
          </span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── BADGE ────────────────────────────────────────────────────────────────────
function Badge({ status }) {
  const map = {
    free: { bg: "rgba(39,174,96,0.2)", bd: "rgba(39,174,96,0.5)", c: "#2ecc71", l: "Bo'sh" },
    busy: { bg: "rgba(230,126,34,0.2)", bd: "rgba(230,126,34,0.5)", c: "#e67e22", l: "Band" },
    bill: { bg: "rgba(212,175,55,0.2)", bd: "rgba(212,175,55,0.5)", c: "#D4AF37", l: "Hisob" },
    new: { bg: "rgba(41,128,185,0.2)", bd: "rgba(41,128,185,0.5)", c: "#3498db", l: "Yangi" },
    preparing: { bg: "rgba(230,126,34,0.2)", bd: "rgba(230,126,34,0.5)", c: "#e67e22", l: "Tayyorlanmoqda" },
    ready: { bg: "rgba(39,174,96,0.2)", bd: "rgba(39,174,96,0.5)", c: "#2ecc71", l: "Tayyor" },
    delivered: { bg: "rgba(100,100,100,0.2)", bd: "rgba(100,100,100,0.4)", c: "#7f8c8d", l: "Yetkazildi" },
    stop: { bg: "rgba(230,126,34,0.2)", bd: "rgba(230,126,34,0.5)", c: "#e67e22", l: "To'xtatilgan" },
    active: { bg: "rgba(39,174,96,0.15)", bd: "rgba(39,174,96,0.4)", c: "#2ecc71", l: "Faol" },
  };
  const s = map[status] || map.active;
  return (
    <span
      style={{
        background: s.bg,
        border: `1px solid ${s.bd}`,
        color: s.c,
        borderRadius: 8,
        padding: "4px 12px",
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {s.l}
    </span>
  );
}

// ─── CONFIRM MODAL ────────────────────────────────────────────────────────────
function Confirm({ msg, onYes, onNo }) {
  return (
    <div style={OVERLAY} onClick={(e) => e.target === e.currentTarget && onNo()}>
      <div
        style={{
          background: "#0e2210",
          border: "1px solid rgba(212,175,55,0.3)",
          borderRadius: 20,
          padding: "32px 28px",
          maxWidth: 380,
          width: "calc(100% - 32px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
        }}
      >
        <p
          style={{
            color: "#e8f5e0",
            fontSize: 16,
            marginBottom: 28,
            lineHeight: 1.7,
            textAlign: "center",
          }}
        >
          {msg}
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onYes} style={{ ...BTN.danger, flex: 1 }}>
            Ha, tasdiqlash
          </button>
          <button onClick={onNo} style={{ ...BTN.ghost, flex: 1 }}>
            Bekor qilish
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── LOADING ──────────────────────────────────────────────────────────────────
function Loading({ text = "Yuklanmoqda..." }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#0a1f0d,#0f2a10,#1a3a1a)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
      }}
    >
      <div style={{ fontSize: 48 }}>🌿</div>
      <div style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 15, letterSpacing: 2 }}>
        {text}
      </div>
      <div
        style={{
          width: 36,
          height: 36,
          border: "3px solid rgba(212,175,55,0.2)",
          borderTop: "3px solid #D4AF37",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// SCREEN: TABLES
// ════════════════════════════════════════════════════════════════════════════════
function ScreenTables({ tables, onSelectTable, onLogout, waiter, onOpenProfile }) {
  const [zone, setZone] = useState("all");

  const allZones = ZONES_CONFIG.map((z) => z.zone).filter((z) => tables.some((t) => t.zone === z));
  const filtered = zone === "all" ? tables : tables.filter((t) => t.zone === zone);

  const statusColor = { free: "#2ecc71", busy: "#e67e22", bill: "#D4AF37" };
  const statusLabel = { free: "Bo'sh", busy: "Band", bill: "Hisob" };
  const statusBg = {
    free: "rgba(39,174,96,0.12)",
    busy: "rgba(230,126,34,0.12)",
    bill: "rgba(212,175,55,0.12)",
  };

  const counts = {
    free: tables.filter((t) => t.status === "free").length,
    busy: tables.filter((t) => t.status === "busy").length,
    bill: tables.filter((t) => t.status === "bill").length,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg,#050d06,#0a1f0d,#0f2a10)",
        paddingBottom: 80,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "rgba(3,8,4,0.97)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(212,175,55,0.15)",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "linear-gradient(135deg,#1a3a1a,#0f2a10)",
              border: "1px solid rgba(212,175,55,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            🌿
          </div>
          <div>
            <div
              style={{
                fontFamily: "Cinzel,serif",
                color: "#D4AF37",
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: 2,
              }}
            >
              AMAZONIA
            </div>
            <div style={{ color: "#4a7a40", fontSize: 10, letterSpacing: 1 }}>
              OFITSIANT PANEL
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <LiveClock />
          
          {/* 👤 PROFILE BUTTON */}
          <button
            onClick={onOpenProfile}
            style={{
              background: "rgba(212,175,55,0.1)",
              border: "1px solid rgba(212,175,55,0.25)",
              borderRadius: 10,
              padding: "8px 14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => e.target.style.background = "rgba(212,175,55,0.2)"}
            onMouseLeave={(e) => e.target.style.background = "rgba(212,175,55,0.1)"}
          >
            <Icon d={IC.user} size={16} color="#D4AF37" />
            <span style={{ color: "#D4AF37", fontSize: 12, fontWeight: 600 }}>
              {waiter?.name || "Profil"}
            </span>
          </button>

          <button
            onClick={onLogout}
            style={{
              background: "rgba(192,57,43,0.15)",
              border: "1px solid rgba(192,57,43,0.35)",
              borderRadius: 10,
              padding: "9px 13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              color: "#e74c3c",
              fontSize: 12,
            }}
          >
            <Icon d={IC.logout} size={16} color="#e74c3c" />
          </button>
        </div>
      </div>

      {/* ⭐ PREMIUM MENU LINK */}
      <div
        style={{
          padding: "12px 20px",
          background: "rgba(212,175,55,0.05)",
          borderBottom: "1px solid rgba(212,175,55,0.08)",
        }}
      >
        <Link
          to="/menu"
          target="_blank"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            borderRadius: 12,
            background: "rgba(212,175,55,0.08)",
            border: "1px solid rgba(212,175,55,0.2)",
            color: "#D4AF37",
            textDecoration: "none",
            fontSize: 13,
            fontFamily: "Inter,sans-serif",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(212,175,55,0.18)";
            e.target.style.borderColor = "rgba(212,175,55,0.4)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(212,175,55,0.08)";
            e.target.style.borderColor = "rgba(212,175,55,0.2)";
          }}
        >
          <span style={{ fontSize: 18 }}>🌿</span>
          <span style={{ flex: 1 }}>Premium Menyuni ko'rish</span>
          <span style={{ fontSize: 12, opacity: 0.5 }}>↗</span>
        </Link>
      </div>

      <div style={{ padding: "20px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
          {[
            ["free", "Bo'sh", "🪑"],
            ["busy", "Band", "🍽️"],
            ["bill", "Hisob", "💰"],
          ].map(([st, label, emoji]) => (
            <div
              key={st}
              style={{
                background: statusBg[st],
                border: `1px solid ${statusColor[st]}40`,
                borderRadius: 16,
                padding: "16px 10px",
                textAlign: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: statusColor[st],
                  opacity: 0.7,
                }}
              />
              <div style={{ fontSize: 22, marginBottom: 4 }}>{emoji}</div>
              <div
                style={{
                  color: statusColor[st],
                  fontSize: 28,
                  fontWeight: 700,
                  fontFamily: "Cinzel,serif",
                  lineHeight: 1,
                }}
              >
                {counts[st]}
              </div>
              <div style={{ color: "#7fa86b", fontSize: 12, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Zone filter */}
        {allZones.length > 1 && (
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 20,
              overflowX: "auto",
              paddingBottom: 4,
            }}
          >
            {["all", ...allZones].map((z) => (
              <button
                key={z}
                onClick={() => setZone(z)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 24,
                  cursor: "pointer",
                  fontFamily: "Inter,sans-serif",
                  fontSize: 13,
                  whiteSpace: "nowrap",
                  border: "none",
                  fontWeight: zone === z ? 600 : 400,
                  background: zone === z ? "rgba(212,175,55,0.25)" : "rgba(255,255,255,0.05)",
                  color: zone === z ? "#D4AF37" : "#7fa86b",
                  boxShadow:
                    zone === z
                      ? "inset 0 0 0 1px rgba(212,175,55,0.5)"
                      : "inset 0 0 0 1px rgba(134,176,84,0.2)",
                }}
              >
                {z === "all" ? "Barcha zonalar" : `${z} zona`}
              </button>
            ))}
          </div>
        )}

        {/* Tables grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
            gap: 12,
          }}
        >
          {filtered.map((table) => {
            const c = statusColor[table.status] || "#2ecc71";
            const bg = statusBg[table.status] || "rgba(39,174,96,0.08)";
            const shots = table.shots || [];
            const shotCount = shots.length;
            const totalAmt = shots.reduce(
              (s, sh) => (sh.items || []).reduce((ss, i) => ss + i.price * i.qty, s),
              0
            );

            return (
              <button
                key={table.id}
                onClick={() => onSelectTable(table)}
                style={{
                  minHeight: 110,
                  borderRadius: 16,
                  background: bg,
                  border: `2px solid ${c}45`,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  position: "relative",
                  boxShadow: table.status === "busy" ? `0 4px 20px ${c}20` : "none",
                  transition: "all 0.18s",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 6,
                    left: 8,
                    color: "#4a7a40",
                    fontSize: 9,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                  }}
                >
                  {table.zone}
                </div>

                {shotCount > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: 5,
                      right: 7,
                      minWidth: 20,
                      height: 20,
                      borderRadius: 10,
                      background: "#D4AF37",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingInline: 4,
                    }}
                  >
                    <span style={{ color: "#0a1f0d", fontSize: 10, fontWeight: 700 }}>
                      {shotCount}
                    </span>
                  </div>
                )}

                <span
                  style={{
                    color: "#e8f5e0",
                    fontSize: 18,
                    fontWeight: 700,
                    fontFamily: "Cinzel,serif",
                    marginTop: 12,
                  }}
                >
                  {table.id}
                </span>
                <span style={{ color: c, fontSize: 11, fontWeight: 600 }}>
                  {statusLabel[table.status] || "Bo'sh"}
                </span>

                {table.paid && (
                  <span style={{ color: "#D4AF37", fontSize: 9, opacity: 0.8 }}>🥂 Bisetka</span>
                )}

                {totalAmt > 0 && (
                  <span style={{ color: "#D4AF37", fontSize: 10, fontWeight: 600, marginTop: 2 }}>
                    {(totalAmt / 1000).toFixed(0)}K
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

// ─── SCREEN: TABLE DETAIL ────────────────────────────────────────────────────
function ScreenTableDetail({ table, onBack, onNewShot, onOpenShot, onOpenBill }) {
  const shots = table.shots || [];
  const totalItems = shots.reduce((s, sh) => s + (sh.items || []).reduce((ss, i) => ss + i.qty, 0), 0);
  const totalAmount = shots.reduce(
    (s, sh) => s + (sh.items || []).reduce((ss, i) => ss + i.price * i.qty, 0),
    0
  );

  const statusColor = { new: "#3498db", preparing: "#e67e22", ready: "#2ecc71", delivered: "#7f8c8d" };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg,#050d06,#0a1f0d,#0f2a10)",
        paddingBottom: 130,
      }}
    >
      <div
        style={{
          background: "rgba(3,8,4,0.97)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(212,175,55,0.15)",
          padding: "15px 20px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(134,176,84,0.2)",
            borderRadius: 10,
            padding: "9px",
            cursor: "pointer",
            display: "flex",
          }}
        >
          <Icon d={IC.back} color="#7fa86b" size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 17, fontWeight: 700 }}>
            Stol {table.id}
          </div>
          <div style={{ color: "#4a7a40", fontSize: 11 }}>
            {table.zone} zona · {table.capacity || 4} o'rin {table.paid ? "· 🥂 Bisetka" : ""}
          </div>
        </div>
        <Badge status={table.status} />
      </div>

      <div style={{ padding: "20px" }}>
        {shots.length > 0 && (
          <div
            style={{
              background: "rgba(212,175,55,0.08)",
              border: "1px solid rgba(212,175,55,0.25)",
              borderRadius: 16,
              padding: "18px 20px",
              marginBottom: 20,
              display: "flex",
              gap: 16,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {[
              [shots.length, "Shot"],
              [totalItems, "Mahsulot"],
            ].map(([v, l]) => (
              <div key={l} style={{ textAlign: "center", minWidth: 52 }}>
                <div
                  style={{
                    color: "#D4AF37",
                    fontSize: 24,
                    fontWeight: 700,
                    fontFamily: "Cinzel,serif",
                    lineHeight: 1,
                  }}
                >
                  {v}
                </div>
                <div style={{ color: "#7fa86b", fontSize: 12, marginTop: 3 }}>{l}</div>
              </div>
            ))}
            <div style={{ width: 1, background: "rgba(212,175,55,0.2)", alignSelf: "stretch" }} />
            <div style={{ flex: 1 }}>
              <div style={{ color: "#D4AF37", fontSize: 16, fontWeight: 700, fontFamily: "Cinzel,serif" }}>
                {fmt(totalAmount)}
              </div>
              <div style={{ color: "#7fa86b", fontSize: 12, marginTop: 2 }}>Umumiy summa</div>
            </div>
          </div>
        )}

        {shots.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {shots.map((shot, idx) => {
              const shotTotal = (shot.items || []).reduce((s, i) => s + i.price * i.qty, 0);
              const st = shot.status || "new";
              return (
                <div
                  key={shot.id}
                  onClick={() => onOpenShot(shot)}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${statusColor[st] || "rgba(134,176,84,0.15)"}30`,
                    borderRadius: 14,
                    padding: "16px",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 10,
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "rgba(212,175,55,0.15)",
                          border: "1px solid rgba(212,175,55,0.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span style={{ color: "#D4AF37", fontSize: 13, fontWeight: 700 }}>{idx + 1}</span>
                      </div>
                      <div>
                        <div style={{ color: "#e8f5e0", fontSize: 14, fontWeight: 600 }}>
                          Shot #{idx + 1}
                        </div>
                        <div style={{ color: "#4a7a40", fontSize: 11 }}>
                          {(shot.items || []).reduce((s, i) => s + i.qty, 0)} ta · {shot.createdAt || ""}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <Badge status={st} />
                      <div style={{ color: "#D4AF37", fontSize: 14, fontWeight: 700, marginTop: 4 }}>
                        {fmt(shotTotal)}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {(shot.items || []).slice(0, 5).map((item, i) => (
                      <span
                        key={i}
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 8,
                          padding: "4px 10px",
                          color: "#86B054",
                          fontSize: 12,
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        {item.image && item.image.startsWith("data:") ? (
                          <img
                            src={item.image}
                            alt=""
                            style={{ width: 16, height: 16, borderRadius: 4, objectFit: "cover" }}
                          />
                        ) : (
                          <span>{item.emoji || "🍽️"}</span>
                        )}
                        {item.name} ×{item.qty}
                      </span>
                    ))}
                    {(shot.items || []).length > 5 && (
                      <span style={{ color: "#4a7a40", fontSize: 12, alignSelf: "center" }}>
                        +{shot.items.length - 5} ta
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "52px 20px", color: "#3d5c38" }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🍽️</div>
            <div style={{ fontSize: 16, marginBottom: 6, color: "#4a7a40" }}>Hozircha buyurtma yo'q</div>
            <div style={{ fontSize: 13 }}>Yangi shot ochib buyurtma qiling</div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button onClick={onNewShot} style={{ ...BTN.gold, padding: "16px 24px", borderRadius: 14, fontSize: 15 }}>
            <Icon d={IC.plus} size={20} color="#0a1f0d" />
            Yangi shot ochish
          </button>
          {shots.length > 0 && (
            <button
              onClick={onOpenBill}
              style={{ ...BTN.ghost, padding: "16px 24px", borderRadius: 14, fontSize: 15 }}
            >
              <Icon d={IC.bill} size={20} color="#86B054" />
              Hisob chiqarish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN: ORDER ──────────────────────────────────────────────────────────
function ScreenOrder({ table, shot, categories, menu, onBack, onUpdateShot, toast }) {
  const [activeCat, setActiveCat] = useState("all");
  const [cart, setCart] = useState(shot ? [...(shot.items || [])] : []);
  const [noteItem, setNoteItem] = useState(null);
  const [noteText, setNoteText] = useState("");

  const activeCats = Object.entries(categories).filter(([, c]) => c.status !== "hidden");
  const activeMenu = Object.entries(menu).filter(([, m]) => m.status !== "hidden");

  const filtered =
    activeCat === "all" ? activeMenu : activeMenu.filter(([, m]) => m.category === activeCat);

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const addItem = (id, item) => {
    if (item.status === "stop") {
      toast("Bu ovqat vaqtincha to'xtatilgan ⏸", "warn");
      return;
    }
    setCart((prev) => {
      const ex = prev.find((i) => i.id === id);
      if (ex) return prev.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { id, name: item.name, price: item.price, image: item.image || "", emoji: item.emoji || "🍽️", qty: 1, note: "" }];
    });
  };

  const removeItem = (id) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.id === id);
      if (!ex) return prev;
      if (ex.qty <= 1) return prev.filter((i) => i.id !== id);
      return prev.map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i));
    });
  };

  const getQty = (id) => cart.find((i) => i.id === id)?.qty || 0;

  const saveNote = () => {
    setCart((prev) => prev.map((i) => (i.id === noteItem.id ? { ...i, note: noteText } : i)));
    setNoteItem(null);
    toast("Izoh saqlandi ✓", "success");
  };

  const submitOrder = () => {
    if (cart.length === 0) {
      toast("Savat bo'sh", "error");
      return;
    }
    onUpdateShot({ ...shot, items: cart, status: "new" });
    toast("Buyurtma yuborildi! 📤", "success");
    onBack();
  };

  const CatIcon = ({ cat }) => {
    if (cat.image && cat.image.startsWith("data:")) {
      return (
        <img
          src={cat.image}
          alt=""
          style={{ width: 18, height: 18, borderRadius: 4, objectFit: "cover", flexShrink: 0 }}
        />
      );
    }
    return <span style={{ flexShrink: 0 }}>{cat.icon || "🍽️"}</span>;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg,#050d06,#0a1f0d,#0f2a10)",
        paddingBottom: 140,
      }}
    >
      <div
        style={{
          background: "rgba(3,8,4,0.97)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(212,175,55,0.15)",
          padding: "15px 20px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(134,176,84,0.2)",
            borderRadius: 10,
            padding: "9px",
            cursor: "pointer",
            display: "flex",
          }}
        >
          <Icon d={IC.back} color="#7fa86b" size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 15, fontWeight: 700 }}>
            Stol {table.id} — Buyurtma
          </div>
          <div style={{ color: "#4a7a40", fontSize: 11 }}>Ovqat tanlang</div>
        </div>
        {cartCount > 0 && (
          <div
            style={{
              background: "rgba(212,175,55,0.15)",
              border: "1px solid rgba(212,175,55,0.4)",
              borderRadius: 24,
              padding: "5px 14px",
              color: "#D4AF37",
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            {cartCount} ta · {fmt(cartTotal)}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "14px 20px 10px",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        <button
          onClick={() => setActiveCat("all")}
          style={{
            padding: "9px 16px",
            borderRadius: 24,
            cursor: "pointer",
            fontFamily: "Inter,sans-serif",
            fontSize: 13,
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: 6,
            border: "none",
            background: activeCat === "all" ? "rgba(212,175,55,0.22)" : "rgba(255,255,255,0.05)",
            color: activeCat === "all" ? "#D4AF37" : "#7fa86b",
            boxShadow:
              activeCat === "all"
                ? "inset 0 0 0 1px rgba(212,175,55,0.5)"
                : "inset 0 0 0 1px rgba(134,176,84,0.2)",
            fontWeight: activeCat === "all" ? 600 : 400,
          }}
        >
          🍽️ Hammasi
        </button>
        {activeCats.map(([id, c]) => (
          <button
            key={id}
            onClick={() => setActiveCat(id)}
            style={{
              padding: "9px 16px",
              borderRadius: 24,
              cursor: "pointer",
              fontFamily: "Inter,sans-serif",
              fontSize: 13,
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: "none",
              background: activeCat === id ? "rgba(212,175,55,0.22)" : "rgba(255,255,255,0.05)",
              color: activeCat === id ? "#D4AF37" : "#7fa86b",
              boxShadow:
                activeCat === id
                  ? "inset 0 0 0 1px rgba(212,175,55,0.5)"
                  : "inset 0 0 0 1px rgba(134,176,84,0.2)",
              fontWeight: activeCat === id ? 600 : 400,
            }}
          >
            <CatIcon cat={c} /> {c.name}
          </button>
        ))}
      </div>

      <div
        className="waiter-menu-grid"
        style={{
          padding: "4px 20px 10px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 14,
        }}
      >
        {filtered.length === 0 && (
          <div style={{ color: "#3d5c38", textAlign: "center", padding: 52, fontSize: 14, gridColumn: "1/-1" }}>
            Bu kategoriyada ovqat yo'q
          </div>
        )}
        {filtered.map(([id, item]) => {
          const qty = getQty(id);
          const cartItem = cart.find((i) => i.id === id);
          const isStopped = item.status === "stop";

          return (
            <div
              key={id}
              style={{
                background: qty > 0 ? "rgba(212,175,55,0.07)" : "rgba(255,255,255,0.03)",
                border: qty > 0 ? "1.5px solid rgba(212,175,55,0.4)" : "1px solid rgba(134,176,84,0.12)",
                borderRadius: 18,
                padding: "16px",
                opacity: isStopped ? 0.5 : 1,
                display: "flex",
                gap: 16,
                alignItems: "flex-start",
                boxShadow: qty > 0 ? "0 4px 20px rgba(212,175,55,0.1)" : "none",
                transition: "all 0.2s",
              }}
            >
              <MenuItemThumb item={item} size={90} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: "#f0f8ea",
                    fontWeight: 700,
                    fontSize: 16,
                    marginBottom: 4,
                    lineHeight: 1.3,
                  }}
                >
                  {item.name}
                </div>
                {item.description && (
                  <div
                    style={{
                      color: "#4a7a40",
                      fontSize: 12,
                      marginBottom: 8,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      lineHeight: 1.5,
                    }}
                  >
                    {item.description}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ color: "#D4AF37", fontSize: 16, fontWeight: 700 }}>{fmt(item.price)}</span>
                  {isStopped && <Badge status="stop" />}
                </div>

                {qty > 0 ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: "rgba(0,0,0,0.2)",
                        borderRadius: 10,
                        padding: "4px 8px",
                      }}
                    >
                      <button
                        onClick={() => removeItem(id)}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 8,
                          background: "rgba(192,57,43,0.25)",
                          border: "1px solid rgba(192,57,43,0.4)",
                          cursor: "pointer",
                          color: "#e74c3c",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon d={IC.minus} size={16} color="#e74c3c" />
                      </button>
                      <span
                        style={{
                          color: "#D4AF37",
                          fontSize: 18,
                          fontWeight: 700,
                          minWidth: 26,
                          textAlign: "center",
                        }}
                      >
                        {qty}
                      </span>
                      <button
                        onClick={() => addItem(id, item)}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 8,
                          background: "rgba(212,175,55,0.25)",
                          border: "1px solid rgba(212,175,55,0.4)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon d={IC.plus} size={16} color="#D4AF37" />
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setNoteItem({ id, name: item.name, image: item.image, emoji: item.emoji });
                        setNoteText(cartItem?.note || "");
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: cartItem?.note ? "#D4AF37" : "#4a7a40",
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Icon d={IC.note} size={14} color={cartItem?.note ? "#D4AF37" : "#4a7a40"} />
                      {cartItem?.note ? "Izoh bor ✓" : "Izoh"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addItem(id, item)}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 10,
                      border: "none",
                      background: isStopped
                        ? "rgba(100,100,100,0.15)"
                        : "linear-gradient(135deg,rgba(212,175,55,0.2),rgba(184,147,31,0.25))",
                      cursor: isStopped ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 7,
                      color: isStopped ? "#7f8c8d" : "#D4AF37",
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: "Inter,sans-serif",
                      boxShadow: isStopped ? "none" : "inset 0 0 0 1px rgba(212,175,55,0.35)",
                    }}
                  >
                    <Icon d={IC.plus} size={16} color={isStopped ? "#7f8c8d" : "#D4AF37"} />
                    {isStopped ? "To'xtatilgan" : "Qo'shish"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {cart.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "rgba(3,8,4,0.97)",
            backdropFilter: "blur(20px)",
            borderTop: "1px solid rgba(212,175,55,0.25)",
            padding: "14px 20px",
            display: "flex",
            gap: 12,
            zIndex: 200,
          }}
        >
          <div
            style={{
              flex: 1,
              background: "rgba(212,175,55,0.08)",
              border: "1px solid rgba(212,175,55,0.22)",
              borderRadius: 12,
              padding: "11px 16px",
            }}
          >
            <div style={{ color: "#7fa86b", fontSize: 11, marginBottom: 2 }}>Savat</div>
            <div style={{ color: "#D4AF37", fontSize: 15, fontWeight: 700 }}>
              {cartCount} ta mahsulot · {fmt(cartTotal)}
            </div>
          </div>
          <button
            onClick={submitOrder}
            style={{ ...BTN.gold, flex: "none", padding: "12px 22px", borderRadius: 12, fontSize: 14, whiteSpace: "nowrap" }}
          >
            <Icon d={IC.send} size={17} color="#0a1f0d" />
            Yuborish
          </button>
        </div>
      )}

      {noteItem && (
        <div style={OVERLAY} onClick={(e) => e.target === e.currentTarget && setNoteItem(null)}>
          <div
            style={{
              background: "#0e2210",
              border: "1px solid rgba(212,175,55,0.3)",
              borderRadius: 20,
              padding: "26px 24px",
              maxWidth: 400,
              width: "calc(100% - 32px)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontFamily: "Cinzel,serif",
                color: "#D4AF37",
                fontSize: 15,
                marginBottom: 18,
              }}
            >
              {noteItem.image && noteItem.image.startsWith("data:") ? (
                <img
                  src={noteItem.image}
                  alt=""
                  style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" }}
                />
              ) : (
                <span>{noteItem.emoji || "🍽️"}</span>
              )}
              {noteItem.name} — izoh
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
              {["Piyozsiz", "Muz ko'proq", "Muz kamroq", "Achchiqroq", "Sho'rroq", "Kam pishirilsin", "Ko'p pishirilsin", "Alohida"].map(
                (hint) => (
                  <button
                    key={hint}
                    onClick={() => setNoteText(hint)}
                    style={{
                      background: noteText === hint ? "rgba(212,175,55,0.2)" : "rgba(134,176,84,0.1)",
                      border:
                        noteText === hint
                          ? "1px solid rgba(212,175,55,0.5)"
                          : "1px solid rgba(134,176,84,0.3)",
                      borderRadius: 20,
                      padding: "5px 13px",
                      color: noteText === hint ? "#D4AF37" : "#86B054",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    {hint}
                  </button>
                )
              )}
            </div>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Yoki o'zingiz yozing..."
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(134,176,84,0.3)",
                borderRadius: 12,
                padding: "12px 14px",
                color: "#e8f5e0",
                fontSize: 13,
                outline: "none",
                resize: "none",
                height: 84,
                fontFamily: "Inter,sans-serif",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={saveNote} style={{ ...BTN.gold, flex: 1 }}>
                Saqlash
              </button>
              <button onClick={() => setNoteItem(null)} style={{ ...BTN.ghost, flex: 1 }}>
                Bekor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SCREEN: BILL (TO'G'RI HISOBLASH) ──────────────────────────────────────
function ScreenBill({ table, settings, onBack, onPayment }) {
  const [vipSelected, setVipSelected] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const VIP_PRICE = parseInt(settings?.vip?.price || BISETKA_INFO.price || 220000);
  const SERVICE_FEE = parseFloat(settings?.vip?.serviceFee || BISETKA_INFO.serviceFeePercent || 12) / 100;
  const VIP_DESC = settings?.vip?.description || BISETKA_INFO.includes || "2 ta mojito + 1 ta meva assorti";
  const REST_NAME = settings?.restaurant?.name || "AMAZONIA";

  const shots = table.shots || [];
  const allItems = shots.flatMap((sh) => sh.items || []);
  const grouped = allItems.reduce((acc, item) => {
    const ex = acc.find((x) => x.id === item.id);
    if (ex) {
      ex.qty += item.qty;
    } else acc.push({ ...item });
    return acc;
  }, []);

  // ⭐ TO'G'RI HISOBLASH: Servis haqi faqat mahsulotlar summasidan olinadi
  const subtotal = grouped.reduce((s, i) => s + i.price * i.qty, 0);
  const serviceFee = Math.round(subtotal * SERVICE_FEE);
  
  // ⭐ VIP xizmat summasi servis haqisiz
  const vipCost = vipSelected ? VIP_PRICE : 0;
  const total = subtotal + serviceFee + vipCost;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg,#050d06,#0a1f0d,#0f2a10)",
        paddingBottom: 120,
      }}
    >
      <div
        style={{
          background: "rgba(3,8,4,0.97)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(212,175,55,0.15)",
          padding: "15px 20px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(134,176,84,0.2)",
            borderRadius: 10,
            padding: "9px",
            cursor: "pointer",
            display: "flex",
          }}
        >
          <Icon d={IC.back} color="#7fa86b" size={20} />
        </button>
        <div>
          <div style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 17, fontWeight: 700 }}>
            Hisob
          </div>
          <div style={{ color: "#4a7a40", fontSize: 11 }}>Stol {table.id} · {shots.length} shot</div>
        </div>
      </div>

      <div style={{ padding: "20px" }}>
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(212,175,55,0.22)",
            borderRadius: 18,
            overflow: "hidden",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid rgba(212,175,55,0.12)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 14 }}>{REST_NAME}</span>
            <span style={{ color: "#4a7a40", fontSize: 12 }}>Stol {table.id}</span>
          </div>

          <div style={{ padding: "6px 0" }}>
            {grouped.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 20px",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    overflow: "hidden",
                    flexShrink: 0,
                    background: "rgba(255,255,255,0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                  }}
                >
                  {item.image && item.image.startsWith("data:") ? (
                    <img
                      src={item.image}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span>{item.emoji || "🍽️"}</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#e8f5e0", fontSize: 14 }}>{item.name}</div>
                  {item.note && (
                    <div style={{ color: "#D4AF37", fontSize: 11, marginTop: 2 }}>📝 {item.note}</div>
                  )}
                </div>
                <span style={{ color: "#7fa86b", fontSize: 12 }}>×{item.qty}</span>
                <span
                  style={{
                    color: "#e8f5e0",
                    fontSize: 14,
                    fontWeight: 600,
                    minWidth: 100,
                    textAlign: "right",
                  }}
                >
                  {fmt(item.price * item.qty)}
                </span>
              </div>
            ))}
          </div>

          <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {[
              ["Mahsulotlar summasi", subtotal, "#e8f5e0"],
              [`Servis haqi (${Math.round(SERVICE_FEE * 100)}%)`, serviceFee, "#86B054"],
            ].map(([label, val, color]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ color: "#7fa86b", fontSize: 14 }}>{label}</span>
                <span style={{ color, fontSize: 14, fontWeight: 600 }}>{fmt(val)}</span>
              </div>
            ))}
            {vipSelected && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ color: "#D4AF37", fontSize: 14 }}>🥂 VIP xizmat</span>
                <span style={{ color: "#D4AF37", fontSize: 14, fontWeight: 600 }}>{fmt(VIP_PRICE)}</span>
              </div>
            )}
            <div
              style={{
                borderTop: "1px solid rgba(212,175,55,0.3)",
                paddingTop: 12,
                marginTop: 6,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 16, fontWeight: 700 }}>
                JAMI
              </span>
              <span style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 22, fontWeight: 700 }}>
                {fmt(total)}
              </span>
            </div>
          </div>
        </div>

        {table.paid && (
          <div
            onClick={() => setVipSelected((v) => !v)}
            style={{
              background: vipSelected ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.03)",
              border: `1.5px solid ${vipSelected ? "rgba(212,175,55,0.5)" : "rgba(134,176,84,0.18)"}`,
              borderRadius: 16,
              padding: "16px 18px",
              marginBottom: 20,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                background: "rgba(212,175,55,0.15)",
                border: "1px solid rgba(212,175,55,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                flexShrink: 0,
              }}
            >
              🥂
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#D4AF37", fontSize: 15, fontWeight: 600, fontFamily: "Cinzel,serif" }}>
                VIP Xizmat (Bisetka)
              </div>
              <div style={{ color: "#7fa86b", fontSize: 12, marginTop: 3 }}>{VIP_DESC}</div>
              <div style={{ color: "#D4AF37", fontSize: 14, fontWeight: 700, marginTop: 4 }}>
                {fmt(VIP_PRICE)}
              </div>
              <div style={{ color: "#4a7a40", fontSize: 10, marginTop: 2 }}>
                ⚠️ Servis haqi VIP summadan olinmaydi
              </div>
            </div>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: vipSelected ? "#D4AF37" : "rgba(255,255,255,0.06)",
                border: `2px solid ${vipSelected ? "#D4AF37" : "rgba(134,176,84,0.35)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.2s",
              }}
            >
              {vipSelected && <span style={{ color: "#0a1f0d", fontSize: 16, fontWeight: 700 }}>✓</span>}
            </div>
          </div>
        )}

        <button
          onClick={() => setShowConfirm(true)}
          style={{ ...BTN.gold, padding: "17px 24px", borderRadius: 14, fontSize: 16, width: "100%" }}
        >
          <Icon d={IC.cash} size={22} color="#0a1f0d" />
          To'lovni boshlash — {fmt(total)}
        </button>
      </div>

      {showConfirm && (
        <Confirm
          msg={`Jami: ${fmt(total)} — to'lovni tasdiqlaysizmi?`}
          onYes={() => {
            setShowConfirm(false);
            onPayment({ total, vip: vipSelected, subtotal, serviceFee });
          }}
          onNo={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}

// ─── SCREEN: PAYMENT ─────────────────────────────────────────────────────────
const ONLINE_PAYMENT_INFO = {
  bankName: "Kapitalbank",
  cardNumber: "8600 1234 5678 9012",
  cardHolder: "AMAZONIA RESTORAN",
  phone: "+998 90 123 45 67",
};

function ScreenPayment({ table, billInfo, onBack, onComplete, toast }) {
  const [method, setMethod] = useState(null);
  const [cashEntered, setCashEntered] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [copied, setCopied] = useState("");

  const cashNum = parseInt(String(cashEntered).replace(/\D/g, "") || "0");
  const change = cashNum > billInfo.total ? cashNum - billInfo.total : 0;

  const copyText = (text, key) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(key);
    toast("Nusxa olindi ✓", "success");
    setTimeout(() => setCopied(""), 2000);
  };

  const processPayment = () => {
    if (!method) {
      toast("To'lov usulini tanlang", "warn");
      return;
    }
    if (method === "cash" && cashNum < billInfo.total) {
      toast("Naqd pul yetarli emas", "error");
      return;
    }
    setConfirming(true);
    setTimeout(() => {
      setConfirming(false);
      if (method === "online") {
        setShowReceipt(true);
      } else {
        onComplete();
      }
    }, 1000);
  };

  if (showReceipt) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(160deg,#050d06,#0a1f0d,#0f2a10)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            background: "rgba(3,8,4,0.97)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(212,175,55,0.15)",
            padding: "15px 20px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(39,174,96,0.15)",
              border: "1px solid rgba(39,174,96,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            ✓
          </div>
          <div>
            <div style={{ fontFamily: "Cinzel,serif", color: "#2ecc71", fontSize: 16, fontWeight: 700 }}>
              To'lov tasdiqlandi
            </div>
            <div style={{ color: "#4a7a40", fontSize: 11 }}>Stol {table.id} · Online to'lov</div>
          </div>
        </div>
        <div style={{ flex: 1, padding: "24px 20px", overflowY: "auto", paddingBottom: 100 }}>
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(212,175,55,0.25)",
              borderRadius: 20,
              overflow: "hidden",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                background: "rgba(212,175,55,0.08)",
                padding: "18px 22px",
                borderBottom: "1px solid rgba(212,175,55,0.15)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 6 }}>🧾</div>
              <div style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>
                ONLINE CHEK
              </div>
              <div style={{ color: "#7fa86b", fontSize: 12, marginTop: 4 }}>{nowStr()}</div>
            </div>
            <div style={{ padding: "20px 22px" }}>
              {[
                ["Stol", `Stol ${table.id}`],
                ["Mahsulotlar", fmt(billInfo.subtotal)],
                ["Servis haqi", fmt(billInfo.serviceFee)],
                ["VIP xizmat", billInfo.vip ? fmt(parseInt(billInfo.total - billInfo.subtotal - billInfo.serviceFee)) : "—"],
                ["TO'LOV JAMI", fmt(billInfo.total)],
              ]
                .filter(([, v]) => v !== "—")
                .map(([l, v]) => (
                  <div
                    key={l}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "9px 0",
                      borderBottom: l === "TO'LOV JAMI" ? "none" : "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <span
                      style={{
                        color: l === "TO'LOV JAMI" ? "#D4AF37" : "#7fa86b",
                        fontSize: l === "TO'LOV JAMI" ? 15 : 13,
                        fontWeight: l === "TO'LOV JAMI" ? 700 : 400,
                        fontFamily: l === "TO'LOV JAMI" ? "Cinzel,serif" : "Inter,sans-serif",
                      }}
                    >
                      {l}
                    </span>
                    <span
                      style={{
                        color: l === "TO'LOV JAMI" ? "#D4AF37" : "#e8f5e0",
                        fontSize: l === "TO'LOV JAMI" ? 16 : 13,
                        fontWeight: l === "TO'LOV JAMI" ? 700 : 600,
                      }}
                    >
                      {v}
                    </span>
                  </div>
                ))}
            </div>
            <div
              style={{
                background: "rgba(41,128,185,0.08)",
                padding: "14px 22px",
                borderTop: "1px solid rgba(41,128,185,0.2)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(41,128,185,0.15)",
                  border: "1px solid rgba(41,128,185,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                💳
              </div>
              <div>
                <div style={{ color: "#3498db", fontSize: 13, fontWeight: 600 }}>
                  Online to'lov orqali to'landi
                </div>
                <div style={{ color: "#4a7a40", fontSize: 11, marginTop: 2 }}>
                  {ONLINE_PAYMENT_INFO.bankName} · {ONLINE_PAYMENT_INFO.cardHolder}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: "rgba(230,126,34,0.1)",
              border: "1px solid rgba(230,126,34,0.3)",
              borderRadius: 16,
              padding: "18px 20px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div style={{ fontSize: 30, flexShrink: 0 }}>👨‍💼</div>
            <div>
              <div style={{ color: "#e67e22", fontSize: 14, fontWeight: 700, fontFamily: "Cinzel,serif" }}>
                Supervisorga ko'rsating!
              </div>
              <div style={{ color: "#7fa86b", fontSize: 12, marginTop: 4, lineHeight: 1.6 }}>
                Mijoz online to'lov qildi. Ushbu chekni yoki to'lov skrinshotini managerga ko'rsating va tasdiq
                oling.
              </div>
            </div>
          </div>

          <button
            onClick={onComplete}
            style={{ ...BTN.gold, width: "100%", padding: "17px", borderRadius: 14, fontSize: 15 }}
          >
            <Icon d={IC.check} size={22} color="#0a1f0d" />
            Tasdiqlash — Stolni yoping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg,#050d06,#0a1f0d,#0f2a10)",
        paddingBottom: 100,
      }}
    >
      <div
        style={{
          background: "rgba(3,8,4,0.97)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(212,175,55,0.15)",
          padding: "15px 20px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(134,176,84,0.2)",
            borderRadius: 10,
            padding: "9px",
            cursor: "pointer",
            display: "flex",
          }}
        >
          <Icon d={IC.back} color="#7fa86b" size={20} />
        </button>
        <div>
          <div style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 17, fontWeight: 700 }}>
            To'lov
          </div>
          <div style={{ color: "#4a7a40", fontSize: 11 }}>Stol {table.id}</div>
        </div>
      </div>

      <div style={{ padding: "22px 20px" }}>
        <div
          style={{
            textAlign: "center",
            padding: "26px 20px",
            marginBottom: 24,
            background: "rgba(212,175,55,0.08)",
            border: "1px solid rgba(212,175,55,0.22)",
            borderRadius: 18,
          }}
        >
          <div style={{ color: "#7fa86b", fontSize: 12, letterSpacing: 1.5, marginBottom: 10, textTransform: "uppercase" }}>
            To'lov miqdori
          </div>
          <div style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 32, fontWeight: 700 }}>
            {fmt(billInfo.total)}
          </div>
          {billInfo.vip && <div style={{ color: "#86B054", fontSize: 13, marginTop: 6 }}>🥂 VIP xizmat qo'shilgan</div>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 22 }}>
          {[
            { id: "cash", icon: "💵", label: "Naqd pul" },
            { id: "card", icon: "💳", label: "Terminal" },
            { id: "online", icon: "📱", label: "Online" },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              style={{
                padding: "18px 8px",
                borderRadius: 14,
                cursor: "pointer",
                border: "none",
                background: method === m.id ? "rgba(212,175,55,0.18)" : "rgba(255,255,255,0.04)",
                boxShadow:
                  method === m.id
                    ? "inset 0 0 0 2px rgba(212,175,55,0.55)"
                    : "inset 0 0 0 1px rgba(134,176,84,0.18)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                transition: "all 0.18s",
              }}
            >
              <span style={{ fontSize: 30 }}>{m.icon}</span>
              <span
                style={{
                  color: method === m.id ? "#D4AF37" : "#7fa86b",
                  fontSize: 13,
                  fontWeight: method === m.id ? 700 : 400,
                  fontFamily: "Inter,sans-serif",
                }}
              >
                {m.label}
              </span>
            </button>
          ))}
        </div>

        {method === "cash" && (
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(134,176,84,0.2)",
              borderRadius: 14,
              padding: "18px 20px",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                color: "#D4AF37",
                fontSize: 11,
                letterSpacing: 2,
                marginBottom: 12,
                textTransform: "uppercase",
              }}
            >
              Naqd pul miqdori
            </div>
            <input
              type="number"
              value={cashEntered}
              onChange={(e) => setCashEntered(e.target.value)}
              placeholder={`Min: ${billInfo.total.toLocaleString()} so'm`}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(134,176,84,0.35)",
                borderRadius: 12,
                padding: "14px 16px",
                color: "#e8f5e0",
                fontSize: 17,
                outline: "none",
                fontFamily: "Inter,sans-serif",
                boxSizing: "border-box",
              }}
            />
            {change > 0 && (
              <div
                style={{
                  marginTop: 14,
                  padding: "13px 16px",
                  background: "rgba(39,174,96,0.1)",
                  border: "1px solid rgba(39,174,96,0.3)",
                  borderRadius: 10,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ color: "#7fa86b", fontSize: 14 }}>Qaytim:</span>
                <span style={{ color: "#2ecc71", fontSize: 18, fontWeight: 700, fontFamily: "Cinzel,serif" }}>
                  {fmt(change)}
                </span>
              </div>
            )}
          </div>
        )}

        {method === "card" && (
          <div
            style={{
              background: "rgba(41,128,185,0.08)",
              border: "1px solid rgba(41,128,185,0.25)",
              borderRadius: 14,
              padding: "18px 20px",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                color: "#3498db",
                fontSize: 11,
                letterSpacing: 2,
                marginBottom: 12,
                textTransform: "uppercase",
              }}
            >
              Terminal orqali to'lov
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: 10,
              }}
            >
              <span style={{ fontSize: 28 }}>💳</span>
              <div>
                <div style={{ color: "#3498db", fontSize: 14, fontWeight: 600 }}>Kartani terminalga ulang</div>
                <div style={{ color: "#4a7a40", fontSize: 12, marginTop: 3 }}>
                  Mijoz kartasini POS terminalga bosing va {fmt(billInfo.total)} miqdorini kiriting
                </div>
              </div>
            </div>
          </div>
        )}

        {method === "online" && (
          <div
            style={{
              background: "rgba(39,174,96,0.07)",
              border: "1px solid rgba(39,174,96,0.25)",
              borderRadius: 14,
              padding: "20px",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                color: "#2ecc71",
                fontSize: 11,
                letterSpacing: 2,
                marginBottom: 16,
                textTransform: "uppercase",
              }}
            >
              Online to'lov ma'lumotlari
            </div>

            <div
              style={{
                background: "rgba(0,0,0,0.25)",
                borderRadius: 14,
                padding: "18px 16px",
                marginBottom: 14,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ color: "#4a7a40", fontSize: 11, marginBottom: 8, letterSpacing: 1 }}>KARTA RAQAMI</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontFamily: "Cinzel,serif", color: "#e8f5e0", fontSize: 20, letterSpacing: 3 }}>
                  {ONLINE_PAYMENT_INFO.cardNumber}
                </span>
                <button
                  onClick={() => copyText(ONLINE_PAYMENT_INFO.cardNumber.replace(/\s/g, ""), "card")}
                  style={{
                    background: copied === "card" ? "rgba(39,174,96,0.2)" : "rgba(255,255,255,0.08)",
                    border: `1px solid ${copied === "card" ? "rgba(39,174,96,0.5)" : "rgba(255,255,255,0.15)"}`,
                    borderRadius: 8,
                    padding: "8px 12px",
                    cursor: "pointer",
                    color: copied === "card" ? "#2ecc71" : "#86B054",
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    whiteSpace: "nowrap",
                  }}
                >
                  {copied === "card" ? "✓ Nusxa" : (
                    <>
                      <Icon d={IC.copy} size={13} color="#86B054" /> Ko'chir
                    </>
                  )}
                </button>
              </div>
              <div style={{ color: "#7fa86b", fontSize: 13, marginTop: 6 }}>{ONLINE_PAYMENT_INFO.cardHolder}</div>
              <div style={{ color: "#4a7a40", fontSize: 11, marginTop: 2 }}>{ONLINE_PAYMENT_INFO.bankName}</div>
            </div>

            <div
              style={{
                background: "rgba(0,0,0,0.2)",
                borderRadius: 12,
                padding: "14px 16px",
                marginBottom: 14,
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ color: "#4a7a40", fontSize: 11, marginBottom: 6, letterSpacing: 1 }}>TELEFON (Click/Payme)</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: "#e8f5e0", fontSize: 18, fontFamily: "Cinzel,serif" }}>
                  {ONLINE_PAYMENT_INFO.phone}
                </span>
                <button
                  onClick={() => copyText(ONLINE_PAYMENT_INFO.phone.replace(/\s/g, ""), "phone")}
                  style={{
                    background: copied === "phone" ? "rgba(39,174,96,0.2)" : "rgba(255,255,255,0.08)",
                    border: `1px solid ${copied === "phone" ? "rgba(39,174,96,0.5)" : "rgba(255,255,255,0.15)"}`,
                    borderRadius: 8,
                    padding: "8px 12px",
                    cursor: "pointer",
                    color: copied === "phone" ? "#2ecc71" : "#86B054",
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    whiteSpace: "nowrap",
                  }}
                >
                  {copied === "phone" ? "✓ Nusxa" : (
                    <>
                      <Icon d={IC.copy} size={13} color="#86B054" /> Ko'chir
                    </>
                  )}
                </button>
              </div>
            </div>

            <div
              style={{
                background: "rgba(212,175,55,0.1)",
                border: "1px solid rgba(212,175,55,0.3)",
                borderRadius: 10,
                padding: "12px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "#D4AF37", fontSize: 13 }}>O'tkazma miqdori:</span>
              <span style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 18, fontWeight: 700 }}>
                {fmt(billInfo.total)}
              </span>
            </div>

            <div style={{ color: "#4a7a40", fontSize: 11, marginTop: 12, textAlign: "center", lineHeight: 1.6 }}>
              Mijoz to'lov qilgach, "To'lovni tasdiqlash" tugmasini bosing
            </div>
          </div>
        )}

        <button
          onClick={processPayment}
          disabled={confirming}
          style={{
            ...BTN.gold,
            padding: "17px 24px",
            borderRadius: 14,
            fontSize: 15,
            width: "100%",
            opacity: confirming ? 0.7 : 1,
          }}
        >
          {confirming ? (
            <span
              style={{
                width: 22,
                height: 22,
                border: "2px solid rgba(0,0,0,0.3)",
                borderTop: "2px solid #0a1f0d",
                borderRadius: "50%",
                display: "inline-block",
                animation: "spin 0.7s linear infinite",
              }}
            />
          ) : (
            <>
              <Icon d={IC.check} size={20} color="#0a1f0d" /> To'lovni tasdiqlash
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── SCREEN: RATING ──────────────────────────────────────────────────────────
function ScreenRating({ table, onDone, toast }) {
  const [foodRating, setFoodRating] = useState(0);
  const [waiterRating, setWaiterRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const StarRow = ({ value, onChange, label }) => (
    <div style={{ marginBottom: 22 }}>
      <div style={{ color: "#7fa86b", fontSize: 12, letterSpacing: 1.5, marginBottom: 12, textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            style={{
              width: 50,
              height: 50,
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              background: n <= value ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.04)",
              fontSize: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: n <= value
                ? "inset 0 0 0 1.5px rgba(212,175,55,0.5)"
                : "inset 0 0 0 1px rgba(134,176,84,0.2)",
              transition: "all 0.15s",
            }}
          >
            <span style={{ filter: n <= value ? "none" : "grayscale(1)", opacity: n <= value ? 1 : 0.35 }}>⭐</span>
          </button>
        ))}
        <span
          style={{
            color: "#D4AF37",
            fontSize: 20,
            fontWeight: 700,
            alignSelf: "center",
            marginLeft: 4,
            fontFamily: "Cinzel,serif",
          }}
        >
          {value > 0 ? value + ".0" : "—"}
        </span>
      </div>
    </div>
  );

  const submit = () => {
    if (foodRating === 0 || waiterRating === 0) {
      toast("Ikkala reytingni ham qo'ying ⭐", "warn");
      return;
    }
    setSubmitted(true);
    toast("Reyting saqlandi! Rahmat 📤", "success");
    setTimeout(() => onDone({ foodRating, waiterRating, comment }), 2000);
  };

  if (submitted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(160deg,#050d06,#0a1f0d,#0f2a10)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 22,
          padding: 24,
        }}
      >
        <div
          style={{
            width: 90,
            height: 90,
            borderRadius: "50%",
            background: "rgba(39,174,96,0.15)",
            border: "2px solid rgba(39,174,96,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 42,
          }}
        >
          ✓
        </div>
        <div style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 22, textAlign: "center" }}>
          Rahmat!
        </div>
        <div style={{ color: "#7fa86b", fontSize: 15, textAlign: "center" }}>Reyting saqlandi</div>
        <div style={{ color: "#4a7a40", fontSize: 13, textAlign: "center" }}>Stol tozalanmoqda...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg,#050d06,#0a1f0d,#0f2a10)",
        paddingBottom: 100,
      }}
    >
      <div
        style={{
          background: "rgba(3,8,4,0.97)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(212,175,55,0.15)",
          padding: "15px 20px",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "rgba(212,175,55,0.12)",
            border: "1px solid rgba(212,175,55,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
          }}
        >
          ⭐
        </div>
        <div>
          <div style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 17, fontWeight: 700 }}>
            Reyting
          </div>
          <div style={{ color: "#4a7a40", fontSize: 11 }}>Stol {table.id} — buyurtma tugadi</div>
        </div>
      </div>

      <div style={{ padding: "26px 20px" }}>
        <p style={{ color: "#7fa86b", fontSize: 15, lineHeight: 1.7, marginBottom: 26, textAlign: "center" }}>
          Mijoz reytingini qoldiring
        </p>
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(134,176,84,0.15)",
            borderRadius: 18,
            padding: "24px 20px",
          }}
        >
          <StarRow value={foodRating} onChange={setFoodRating} label="🍽️  Ovqat sifati" />
          <StarRow value={waiterRating} onChange={setWaiterRating} label="🧑‍🍽️  Ofitsiant xizmati" />
          <div style={{ marginBottom: 22 }}>
            <div
              style={{
                color: "#7fa86b",
                fontSize: 12,
                letterSpacing: 1.5,
                marginBottom: 10,
                textTransform: "uppercase",
              }}
            >
              Izoh (ixtiyoriy)
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 10 }}>
              {["Ajoyib!", "Tez xizmat", "Mazali ovqat", "Yana kelamiz", "Sog'lom muhit"].map((hint) => (
                <button
                  key={hint}
                  onClick={() => setComment(hint)}
                  style={{
                    background: comment === hint ? "rgba(212,175,55,0.2)" : "rgba(134,176,84,0.1)",
                    border:
                      comment === hint
                        ? "1px solid rgba(212,175,55,0.5)"
                        : "1px solid rgba(134,176,84,0.3)",
                    borderRadius: 20,
                    padding: "6px 14px",
                    color: comment === hint ? "#D4AF37" : "#86B054",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {hint}
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Fikr bildiring..."
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(134,176,84,0.3)",
                borderRadius: 12,
                padding: "12px 16px",
                color: "#e8f5e0",
                fontSize: 14,
                outline: "none",
                resize: "none",
                height: 80,
                fontFamily: "Inter,sans-serif",
                boxSizing: "border-box",
              }}
            />
          </div>
          <button
            onClick={submit}
            style={{ ...BTN.gold, padding: "16px 24px", borderRadius: 14, fontSize: 15, width: "100%" }}
          >
            <Icon d={IC.send} size={18} color="#0a1f0d" />
            Reytingni yuborish
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN: PROFILE (OFITSIANT PROFILI) ────────────────────────────────────
function ScreenProfile({ waiter, onBack, toast }) {
  const [waiterData, setWaiterData] = useState(waiter);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      if (!waiter?.id) return;
      try {
        const data = await dbGet(`waiters/${waiter.id}`);
        if (data) {
          setWaiterData(data);
        }
        // Attendance tarixini olish
        const orders = await dbGet("orders");
        if (orders) {
          const waiterOrders = Object.values(orders).filter(o => o.waiterId === waiter.id);
          const dates = [...new Set(waiterOrders.map(o => o.date))];
          setAttendance(dates.sort().reverse());
        }
      } catch (e) {
        console.error("Profil yuklash xatosi:", e);
      }
      setLoading(false);
    };
    loadData();
  }, [waiter]);

  const points = waiterData?.points ?? 100;
  const ballColor = points >= 80 ? "#2ecc71" : points >= 40 ? "#f39c12" : "#e74c3c";
  const ordersCount = waiterData?.orders || 0;
  const rating = waiterData?.rating || 0;
  const ratingCount = waiterData?.ratingCount || 0;
  const lastLogin = waiterData?.lastLogin || "—";

  // Ishga kelgan kunlar
  const todayStr = today();
  const isTodayWork = attendance.includes(todayStr);

  // Oxirgi 7 kun
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    last7Days.push({
      date: dateStr,
      worked: attendance.includes(dateStr),
      day: ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"][d.getDay()]
    });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg,#050d06,#0a1f0d,#0f2a10)",
        paddingBottom: 40,
      }}
    >
      <div
        style={{
          background: "rgba(3,8,4,0.97)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(212,175,55,0.15)",
          padding: "15px 20px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(134,176,84,0.2)",
            borderRadius: 10,
            padding: "9px",
            cursor: "pointer",
            display: "flex",
          }}
        >
          <Icon d={IC.back} color="#7fa86b" size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 17, fontWeight: 700 }}>
            👤 Mening profilim
          </div>
          <div style={{ color: "#4a7a40", fontSize: 11 }}>Shaxsiy ma'lumotlar va statistika</div>
        </div>
      </div>

      <div style={{ padding: "20px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#4a7a40" }}>Yuklanmoqda...</div>
        ) : (
          <>
            {/* Profile Header */}
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(212,175,55,0.15)",
                borderRadius: 20,
                padding: "24px",
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))",
                  border: "2px solid rgba(212,175,55,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                  fontSize: 36,
                }}
              >
                {waiterData?.name?.[0] || "👤"}
              </div>
              <div style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 20, fontWeight: 700 }}>
                {waiterData?.name || "Ofitsiant"}
              </div>
              <div style={{ color: "#7fa86b", fontSize: 13, marginTop: 4 }}>
                @{waiterData?.username || "—"} · {waiterData?.table || "Zona belgilanmagan"}
              </div>
              <div style={{ color: "#4a7a40", fontSize: 12, marginTop: 6 }}>
                Oxirgi kirish: {lastLogin}
              </div>
            </div>

            {/* Stats Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  background: `rgba(212,175,55,0.08)`,
                  border: `1px solid rgba(212,175,55,0.2)`,
                  borderRadius: 14,
                  padding: "14px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 4 }}>🏆</div>
                <div style={{ color: ballColor, fontSize: 24, fontWeight: 700, fontFamily: "Cinzel,serif" }}>
                  {points}
                </div>
                <div style={{ color: "#7fa86b", fontSize: 11 }}>Ball</div>
              </div>
              <div
                style={{
                  background: `rgba(39,174,96,0.08)`,
                  border: `1px solid rgba(39,174,96,0.2)`,
                  borderRadius: 14,
                  padding: "14px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 4 }}>📦</div>
                <div style={{ color: "#2ecc71", fontSize: 24, fontWeight: 700, fontFamily: "Cinzel,serif" }}>
                  {ordersCount}
                </div>
                <div style={{ color: "#7fa86b", fontSize: 11 }}>Buyurtma</div>
              </div>
              <div
                style={{
                  background: `rgba(241,196,15,0.08)`,
                  border: `1px solid rgba(241,196,15,0.2)`,
                  borderRadius: 14,
                  padding: "14px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 4 }}>⭐</div>
                <div style={{ color: "#f1c40f", fontSize: 24, fontWeight: 700, fontFamily: "Cinzel,serif" }}>
                  {rating > 0 ? rating.toFixed(1) : "—"}
                </div>
                <div style={{ color: "#7fa86b", fontSize: 11 }}>{ratingCount} ta reyting</div>
              </div>
              <div
                style={{
                  background: isTodayWork ? `rgba(39,174,96,0.08)` : `rgba(192,57,43,0.08)`,
                  border: `1px solid ${isTodayWork ? "rgba(39,174,96,0.2)" : "rgba(192,57,43,0.2)"}`,
                  borderRadius: 14,
                  padding: "14px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 4 }}>📅</div>
                <div style={{ color: isTodayWork ? "#2ecc71" : "#e74c3c", fontSize: 24, fontWeight: 700 }}>
                  {isTodayWork ? "✅" : "❌"}
                </div>
                <div style={{ color: "#7fa86b", fontSize: 11 }}>Bugun ishda</div>
              </div>
            </div>

            {/* Attendance Calendar */}
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(134,176,84,0.1)",
                borderRadius: 16,
                padding: "18px 20px",
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <Icon d={IC.calendar} size={18} color="#D4AF37" />
                <span style={{ color: "#D4AF37", fontSize: 13, fontWeight: 600, fontFamily: "Cinzel,serif" }}>
                  Oxirgi 7 kun
                </span>
                <span style={{ color: "#4a7a40", fontSize: 11, marginLeft: "auto" }}>
                  {attendance.length} kun ishlagan
                </span>
              </div>
              <div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>
                {last7Days.map((d) => (
                  <div key={d.date} style={{ textAlign: "center", flex: 1 }}>
                    <div
                      style={{
                        width: "100%",
                        height: 40,
                        borderRadius: 10,
                        background: d.worked ? "rgba(39,174,96,0.2)" : "rgba(192,57,43,0.08)",
                        border: d.worked 
                          ? `1px solid rgba(39,174,96,0.4)` 
                          : `1px solid rgba(192,57,43,0.15)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                      }}
                    >
                      {d.worked ? "✅" : "⬜"}
                    </div>
                    <div style={{ color: d.worked ? "#2ecc71" : "#4a7a40", fontSize: 10, marginTop: 4 }}>
                      {d.day}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Waiter Info */}
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(134,176,84,0.1)",
                borderRadius: 16,
                padding: "18px 20px",
              }}
            >
              <div style={{ color: "#D4AF37", fontSize: 13, fontWeight: 600, fontFamily: "Cinzel,serif", marginBottom: 14 }}>
                📋 Ma'lumotlar
              </div>
              {[
                ["Telefon", waiterData?.phone || "—"],
                ["Zona", waiterData?.table || "—"],
                ["Qo'shilgan", waiterData?.createdAt || "—"],
                ["So'nggi faollik", waiterData?.lastLogin || "—"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <span style={{ color: "#4a7a40", fontSize: 12 }}>{label}</span>
                  <span style={{ color: "#e8f5e0", fontSize: 12 }}>{value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════════
export default function WaiterPanel() {
  const navigate = useNavigate();
  const [user] = useState(() => getStoredUser());

  useEffect(() => {
    if (!user || user.role !== "WAITER") {
      navigate("/", { replace: true });
    }
  }, []);

  const [tables, setTables] = useState([]);
  const [categories, setCategories] = useState({});
  const [menu, setMenu] = useState({});
  const [settings, setSettings] = useState(null);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    if (!user) return;

    dbGet("settings").then((d) => setSettings(d || {}));
    ensureTablesExist();

    const unsubTables = listenTables((merged) => {
      const waiterZone = user.table || "";
      const filtered = waiterZone ? merged.filter((t) => t.zone === waiterZone) : merged;
      const zonesOrder = ZONES_CONFIG.map((z) => z.zone);
      const sorted = [...filtered].sort((a, b) => {
        const zDiff = zonesOrder.indexOf(a.zone) - zonesOrder.indexOf(b.zone);
        if (zDiff !== 0) return zDiff;
        return a.id.localeCompare(b.id, undefined, { numeric: true });
      });
      setTables(sorted);
      setDbReady(true);
    });

    const unsubCat = dbListen("categories", (d) => setCategories(d || {}));
    const unsubMenu = dbListen("menu", (d) => setMenu(d || {}));

    return () => {
      unsubTables && unsubTables();
      unsubCat && unsubCat();
      unsubMenu && unsubMenu();
    };
  }, []);

  const [screen, setScreen] = useState(S.TABLES);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedShot, setSelectedShot] = useState(null);
  const [billInfo, setBillInfo] = useState(null);
  const { toasts, toast, remove } = useToast();

  const activeTable = selectedTable
    ? tables.find((t) => t.id === selectedTable.id) || selectedTable
    : null;

  // ─── NAVIGATION ───────────────────────────────────────────────────────────
  const handleLogout = () => {
    clearUser();
    navigate("/", { replace: true });
  };

  const handleSelectTable = (t) => {
    setSelectedTable(t);
    setScreen(S.TABLE_DETAIL);
  };

  const handleNewShot = () => {
    setSelectedShot({
      id: uid(),
      items: [],
      status: "new",
      createdAt: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
    });
    setScreen(S.ORDER);
  };

  const handleOpenShot = (shot) => {
    setSelectedShot(shot);
    setScreen(S.ORDER);
  };

  // ─── UPDATE SHOT ─────────────────────────────────────────────────────────
  const handleUpdateShot = async (updatedShot) => {
    const tbl = activeTable;
    if (!tbl) return;
    const existing = tbl.shots || [];
    const idx = existing.findIndex((s) => s.id === updatedShot.id);
    const newShots = idx >= 0
      ? existing.map((s) => (s.id === updatedShot.id ? updatedShot : s))
      : [...existing, updatedShot];

    try {
      await dbUpdate(`tables/${tbl.id}`, { status: "busy", shots: newShots });

      if (user?.id) {
        const w = await dbGet(`waiters/${user.id}`);
        if (w) await dbUpdate(`waiters/${user.id}`, { orders: (w.orders || 0) + 1 });
      }

      const orderMessage = `
🌿 <b>AMAZONIA - YANGI BUYURTMA</b> 🌿

🪑 Stol: <b>${tbl.id}</b> (${tbl.zone} zona)
👨‍🍳 Ofitsiant: <b>${user?.name || "Ofitsiant"}</b>
🕐 Vaqt: <b>${nowStr()}</b>

📋 <b>Buyurtma mahsulotlari:</b>
${updatedShot.items.map((item) => 
  `  • ${item.name} ×${item.qty} — ${fmt(item.price * item.qty)}`
).join("\n")}

${updatedShot.items.some(i => i.note) ? `\n📝 <b>Maxsus talablar:</b>\n${updatedShot.items.filter(i => i.note).map(i => `  • ${i.name}: ${i.note}`).join("\n")}` : ""}

💰 <b>Jami: ${fmt(updatedShot.items.reduce((s, i) => s + i.price * i.qty, 0))}</b>

📊 <b>Holat: 🆕 YANGI</b>
`;

      await sendTelegramToAll(orderMessage);
    } catch (e) {
      toast("Firebase xatoligi: " + e.message, "error");
    }
  };

  // ─── BILL ─────────────────────────────────────────────────────────────────
  const handleOpenBill = async () => {
    if (!activeTable) return;
    try {
      await dbUpdate(`tables/${activeTable.id}`, { status: "bill" });
      setScreen(S.BILL);
    } catch (e) {
      toast("Xatolik: " + e.message, "error");
    }
  };

  const handlePaymentDone = async (info) => {
    setBillInfo(info);
    const tbl = activeTable;
    if (tbl) {
      try {
        const orderId = `ord_${uid()}`;
        await dbSet(`orders/${orderId}`, {
          tableId: tbl.id,
          table: tbl.id,
          waiterId: user?.id || "",
          waiterName: user?.name || "",
          shots: tbl.shots || [],
          total: info.total,
          subtotal: info.subtotal,
          serviceFee: info.serviceFee,
          vip: info.vip,
          date: today(),
          time: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
          createdAt: nowStr(),
        });

        const billMessage = `
🧾 <b>AMAZONIA - HISOBOT</b> 🧾

🪑 Stol: <b>${tbl.id}</b> (${tbl.zone} zona)
👨‍🍳 Ofitsiant: <b>${user?.name || "Ofitsiant"}</b>
🕐 Vaqt: <b>${nowStr()}</b>

─────────────────
📊 <b>HISOB TAFSILOTLARI</b>
─────────────────
💰 Mahsulotlar: ${fmt(info.subtotal)}
💁 Servis haqi (${Math.round(info.serviceFee / info.subtotal * 100)}%): ${fmt(info.serviceFee)}
${info.vip ? `🥂 VIP xizmat: ${fmt(info.total - info.subtotal - info.serviceFee)}` : ""}
─────────────────
<b>JAMI: ${fmt(info.total)}</b>
─────────────────

✅ <b>To'lov holati: TASDIQLANDI</b>
`;

        await sendTelegramToAll(billMessage);
      } catch (e) {
        toast("Order saqlanmadi: " + e.message, "warn");
      }
    }
    setScreen(S.RATING);
  };

  // ─── RATING ──────────────────────────────────────────────────────────────
  const handleRatingDone = async ({ foodRating, waiterRating, comment }) => {
    const tbl = activeTable;
    if (!tbl) return;
    try {
      await dbUpdate(`tables/${tbl.id}`, { status: "free", shots: [] });
      if (user?.id) {
        const w = await dbGet(`waiters/${user.id}`);
        if (w) {
          const rc = parseInt(w.ratingCount || 0);
          const nr = (parseFloat(w.rating || 0) * rc + waiterRating) / (rc + 1);
          await dbUpdate(`waiters/${user.id}`, {
            rating: parseFloat(nr.toFixed(2)),
            ratingCount: rc + 1,
          });
        }
      }

      const ratingMessage = `
⭐ <b>AMAZONIA - REYTING</b> ⭐

🪑 Stol: <b>${tbl.id}</b>
👨‍🍳 Ofitsiant: <b>${user?.name || "Ofitsiant"}</b>

🍽️ Ovqat sifati: <b>${foodRating}⭐</b>
🧑‍🍳 Xizmat sifati: <b>${waiterRating}⭐</b>
${comment ? `\n💬 <b>Izoh:</b> ${comment}` : ""}

✅ Stol bo'shatildi!
`;

      await sendTelegramToAll(ratingMessage);
    } catch (e) {
      toast("Xatolik: " + e.message, "warn");
    }
    setSelectedTable(null);
    setBillInfo(null);
    setScreen(S.TABLES);
    toast("Stol bo'shatildi ✓", "success");
  };

  // ─── PROFILE ─────────────────────────────────────────────────────────────
  const handleOpenProfile = () => {
    setScreen(S.PROFILE);
  };

  if (!user) return null;
  if (!dbReady) return <Loading text="Ma'lumotlar yuklanmoqda..." />;

  if (tables.length === 0 && dbReady) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(160deg,#050d06,#0a1f0d,#0f2a10)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          padding: 24,
        }}
      >
        <div style={{ fontSize: 52 }}>🪑</div>
        <div
          style={{
            fontFamily: "Cinzel,serif",
            color: "#D4AF37",
            fontSize: 18,
            letterSpacing: 2,
            textAlign: "center",
          }}
        >
          Stollar topilmadi
        </div>
        <div
          style={{
            color: "#4a7a40",
            fontSize: 14,
            textAlign: "center",
            maxWidth: 300,
            lineHeight: 1.7,
          }}
        >
          Zonangizda stol yo'q yoki ma'lumot yuklanmoqda. Admin bilan bog'laning.
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{ ...BTN.ghost, marginTop: 8 }}
        >
          <Icon d={IC.refresh} size={16} color="#86B054" />
          Qayta yuklash
        </button>
        <button onClick={handleLogout} style={{ ...BTN.danger }}>
          Chiqish
        </button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Inter,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:3px; height:3px; }
        ::-webkit-scrollbar-thumb { background:rgba(212,175,55,0.25); border-radius:2px; }
        @keyframes slideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        button { transition: opacity 0.15s, transform 0.1s; }
        button:active { opacity:0.8; transform:scale(0.97); }
        input:focus, textarea:focus { outline:none; border-color:rgba(212,175,55,0.55)!important; box-shadow:0 0 0 3px rgba(212,175,55,0.1); }

        @media (max-width: 420px) {
          .waiter-menu-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 421px) and (max-width: 860px) {
          .waiter-menu-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (min-width: 861px) and (max-width: 1300px) {
          .waiter-menu-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (min-width: 1301px) {
          .waiter-menu-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
      `}</style>

      <div style={{ animation: "fadeIn 0.22s ease" }} key={screen}>
        {screen === S.TABLES && (
          <ScreenTables
            tables={tables}
            onSelectTable={handleSelectTable}
            onLogout={handleLogout}
            waiter={user}
            onOpenProfile={handleOpenProfile}
          />
        )}
        {screen === S.TABLE_DETAIL && activeTable && (
          <ScreenTableDetail
            table={activeTable}
            onBack={() => {
              setScreen(S.TABLES);
              setSelectedTable(null);
            }}
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
            onPayment={(info) => handlePaymentDone(info)}
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
          <ScreenRating table={activeTable} onDone={handleRatingDone} toast={toast} />
        )}
        {screen === S.PROFILE && (
          <ScreenProfile waiter={user} onBack={() => setScreen(S.TABLES)} toast={toast} />
        )}
      </div>

      <ToastContainer toasts={toasts} remove={remove} />
    </div>
  );
}