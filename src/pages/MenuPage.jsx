// MenuPage.jsx - ULTRA PREMIUM VERSIYA
// Mehmonlar uchun 5 yulduzli restoran menyu tajribasi

import { useState, useEffect, useRef } from "react";
import { dbListen } from "../firebase";

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const IC = {
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  food: "M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3",
  drink: "M12 22v-7M8 15h8M9 11h6M17 21v-2a3 3 0 01-3-3h-4a3 3 0 01-3 3v2M6 2h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z",
  search: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  cart: "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0",
  close: "M18 6L6 18M6 6l12 12",
  menuBars: "M3 6h18M3 12h18M3 18h18",
  check: "M20 6L9 17l-5-5",
  clock: "M12 6v6l4 2M12 22a10 10 0 100-20 10 10 0 000 20z",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
  fire: "M12 2c-3 4-6 7-6 11a6 6 0 1012 0c0-4-3-7-6-11zM12 18a3 3 0 01-3-3",
  crown: "M2 5l3 14h14l3-14-6 5-5-5-5 5-6-5z",
  wine: "M8 22h8M12 15v7M6 7h12M6 7l-1 8a3 3 0 003 3h8a3 3 0 003-3l-1-8M10 2v5M14 2v5",
  coffee: "M17 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3",
};

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({ toasts, remove }) {
  return (
    <div style={{
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
    }}>
      {toasts.map((t) => (
        <div key={t.id} onClick={() => remove(t.id)}
          style={{
            background: t.type === "success" ? "linear-gradient(135deg,#b8931f,#D4AF37)" : 
                       t.type === "error" ? "linear-gradient(135deg,#c0392b,#e74c3c)" :
                       "linear-gradient(135deg,#2c3e50,#34495e)",
            color: "#fff",
            padding: "16px 24px",
            borderRadius: 16,
            fontSize: 14,
            fontFamily: "Inter,sans-serif",
            boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            gap: 14,
            cursor: "pointer",
            animation: "slideUp 0.3s ease",
            width: "100%",
            boxSizing: "border-box",
            border: "1px solid rgba(255,255,255,0.08)",
            pointerEvents: "all",
            backdropFilter: "blur(10px)",
          }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>
            {t.type === "success" ? "✨" : t.type === "error" ? "❌" : "ℹ️"}
          </span>
          <span style={{ flex: 1 }}>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ─── CART MODAL ─────────────────────────────────────────────────────────────
function CartModal({ items, onClose, onUpdate, onRemove, onSubmit, total }) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (items.length === 0) return;
    setSubmitting(true);
    await onSubmit(note);
    setSubmitting(false);
  };

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(20px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        animation: "fadeIn 0.3s ease",
      }}>
      <div style={{
        background: "linear-gradient(160deg, #0a1f0d, #0f2a10)",
        border: "1px solid rgba(212,175,55,0.2)",
        borderRadius: 28,
        width: "100%",
        maxWidth: 600,
        maxHeight: "92vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 40px 120px rgba(0,0,0,0.8)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "24px 28px 20px",
          borderBottom: "1px solid rgba(212,175,55,0.08)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))",
              border: "1px solid rgba(212,175,55,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Icon d={IC.cart} color="#D4AF37" size={22} />
            </div>
            <div>
              <div style={{ fontFamily: "Cinzel,serif", color: "#D4AF37", fontSize: 18, letterSpacing: 1 }}>
                Sizning savatchangiz
              </div>
              <div style={{ color: "#4a7a40", fontSize: 12 }}>
                {items.reduce((s, i) => s + i.qty, 0)} ta mahsulot
              </div>
            </div>
          </div>
          <button onClick={onClose}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "#7fa86b",
              cursor: "pointer",
              fontSize: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => e.target.style.background = "rgba(255,255,255,0.1)"}
            onMouseLeave={(e) => e.target.style.background = "rgba(255,255,255,0.05)"}
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 28px",
          maxHeight: 400,
        }}>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#4a7a40" }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>Savatcha bo'sh</div>
              <div style={{ fontSize: 14, marginTop: 6 }}>Menyudan taomlar qo'shing</div>
            </div>
          ) : (
            items.map((item, idx) => (
              <div key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "14px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  animation: "fadeIn 0.2s ease",
                }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  overflow: "hidden",
                  flexShrink: 0,
                  background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26,
                  border: "1px solid rgba(255,255,255,0.05)",
                }}>
                  {item.image && item.image.startsWith("data:") ? (
                    <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span>{item.emoji || "🍽️"}</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "#e8f5e0", fontSize: 15, fontWeight: 600 }}>{item.name}</div>
                  <div style={{ color: "#D4AF37", fontSize: 14, fontWeight: 600 }}>
                    {(item.price * item.qty).toLocaleString()} so'm
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button onClick={() => onUpdate(idx, -1)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      border: "1px solid rgba(134,176,84,0.2)",
                      background: "rgba(255,255,255,0.03)",
                      color: "#86B054",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => e.target.style.background = "rgba(255,255,255,0.08)"}
                    onMouseLeave={(e) => e.target.style.background = "rgba(255,255,255,0.03)"}
                  >
                    −
                  </button>
                  <span style={{ color: "#e8f5e0", fontSize: 17, fontWeight: 700, minWidth: 30, textAlign: "center" }}>
                    {item.qty}
                  </span>
                  <button onClick={() => onUpdate(idx, 1)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      border: "1px solid rgba(212,175,55,0.25)",
                      background: "rgba(212,175,55,0.08)",
                      color: "#D4AF37",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => e.target.style.background = "rgba(212,175,55,0.18)"}
                    onMouseLeave={(e) => e.target.style.background = "rgba(212,175,55,0.08)"}
                  >
                    +
                  </button>
                  <button onClick={() => onRemove(idx)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      border: "none",
                      background: "rgba(192,57,43,0.12)",
                      color: "#e74c3c",
                      cursor: "pointer",
                      fontSize: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => e.target.style.background = "rgba(192,57,43,0.2)"}
                    onMouseLeave={(e) => e.target.style.background = "rgba(192,57,43,0.12)"}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{
            borderTop: "1px solid rgba(212,175,55,0.08)",
            padding: "20px 28px 24px",
            flexShrink: 0,
            background: "rgba(0,0,0,0.3)",
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}>
              <span style={{ color: "#7fa86b", fontSize: 14 }}>Umumiy summa</span>
              <span style={{ color: "#D4AF37", fontSize: 26, fontWeight: 700, fontFamily: "Cinzel,serif" }}>
                {total.toLocaleString()} so'm
              </span>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{
                display: "block",
                color: "#4a7a40",
                fontSize: 11,
                letterSpacing: 1.5,
                marginBottom: 6,
                textTransform: "uppercase",
              }}>
                Maxsus talablar
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Masalan: achchiq bo'lmasin, qo'shimcha sous..."
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(134,176,84,0.15)",
                  borderRadius: 12,
                  padding: "12px 16px",
                  color: "#e8f5e0",
                  fontSize: 13,
                  fontFamily: "Inter,sans-serif",
                  outline: "none",
                  boxSizing: "border-box",
                  minHeight: 52,
                  resize: "vertical",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => e.target.style.borderColor = "rgba(212,175,55,0.4)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(134,176,84,0.15)"}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                width: "100%",
                padding: "18px",
                borderRadius: 14,
                border: "none",
                background: "linear-gradient(135deg, #b8931f, #D4AF37, #e8c84a)",
                color: "#0a1f0d",
                fontFamily: "Cinzel,serif",
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: 1.5,
                cursor: submitting ? "not-allowed" : "pointer",
                transition: "all 0.3s",
                opacity: submitting ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                boxShadow: "0 4px 24px rgba(212,175,55,0.3)",
              }}
              onMouseEnter={(e) => {
                if (!submitting) {
                  e.target.style.transform = "scale(1.02)";
                  e.target.style.boxShadow = "0 8px 32px rgba(212,175,55,0.4)";
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "scale(1)";
                e.target.style.boxShadow = "0 4px 24px rgba(212,175,55,0.3)";
              }}
            >
              {submitting ? (
                <>
                  <span style={{
                    width: 22,
                    height: 22,
                    border: "2px solid rgba(10,31,13,0.25)",
                    borderTop: "2px solid #0a1f0d",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                    display: "inline-block",
                  }} />
                  Yuborilmoqda...
                </>
              ) : (
                <>✨ Buyurtma berish</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MENU PAGE ──────────────────────────────────────────────────────────────
export default function MenuPage() {
  const [categories, setCategories] = useState({});
  const [menuItems, setMenuItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [showFood, setShowFood] = useState(true);
  const searchRef = useRef();

  // ─── FIREBASE LISTENERS ──────────────────────────────────────────────────
  useEffect(() => {
    const unsubs = [
      dbListen("categories", (data) => {
        setCategories(data || {});
        setLoading(false);
      }),
      dbListen("menu", (data) => {
        setMenuItems(data || {});
      }),
    ];
    return () => unsubs.forEach((u) => typeof u === "function" && u());
  }, []);

  // ─── TOAST ────────────────────────────────────────────────────────────────
  const toast = (msg, type = "info") => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };

  const removeToast = (id) => setToasts((p) => p.filter((t) => t.id !== id));

  // ─── FILTERS ──────────────────────────────────────────────────────────────
  const catList = Object.entries(categories).filter(([, c]) => c.status === "active");

  const allItems = Object.entries(menuItems)
    .filter(([, item]) => item.status === "active")
    .map(([id, item]) => ({ ...item, id }));

  const foodItems = allItems.filter((item) =>
    (item.categoryType || "food") === "food"
  );

  const barItems = allItems.filter((item) =>
    (item.categoryType || "food") === "bar"
  );

  const activeItems = showFood ? foodItems : barItems;

  const filteredItems = activeItems.filter((item) => {
    const matchCat = selectedCategory === "all" || item.category === selectedCategory;
    const matchSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  // ─── CART FUNCTIONS ──────────────────────────────────────────────────────
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
    toast(`${item.name} savatchaga qo'shildi ✨`, "success");
  };

  const updateQty = (idx, delta) => {
    setCart((prev) => {
      const newCart = [...prev];
      const newQty = newCart[idx].qty + delta;
      if (newQty <= 0) {
        newCart.splice(idx, 1);
        return newCart;
      }
      newCart[idx].qty = newQty;
      return newCart;
    });
  };

  const removeItem = (idx) => {
    setCart((prev) => {
      const newCart = [...prev];
      newCart.splice(idx, 1);
      return newCart;
    });
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const submitOrder = async (note) => {
    if (cart.length === 0) {
      toast("Savatcha bo'sh!", "error");
      return;
    }

    try {
      const { dbSet, dbGet } = await import("../firebase");
      const settings = await dbGet("settings");
      const restName = settings?.restaurant?.name || "AMAZONIA";

      const orderData = {
        items: cart.map(i => ({
          id: i.id,
          name: i.name,
          price: i.price,
          qty: i.qty,
          image: i.image || "",
          emoji: i.emoji || "🍽️",
        })),
        total: totalPrice,
        note: note || "",
        table: "Menyu orqali",
        status: "new",
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
        createdAt: new Date().toLocaleString("uz-UZ"),
        restaurant: restName,
      };

      await dbSet(`orders/ord_${Math.random().toString(36).slice(2, 9)}`, orderData);
      
      toast("🎉 Buyurtmangiz qabul qilindi! Tez orada yetkazib beramiz.", "success");
      setCart([]);
      setCartOpen(false);
    } catch (err) {
      console.error("Buyurtma xatosi:", err);
      toast("Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.", "error");
    }
  };

  // ─── KEYBOARD SHORTCUT ──────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && cartOpen) setCartOpen(false);
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [cartOpen]);

  // ─── LOADING ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #050f06, #0a1f0d)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        fontFamily: "Inter,sans-serif",
      }}>
        <div style={{ fontSize: 64, animation: "float 3s ease-in-out infinite" }}>🌿</div>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          border: "3px solid rgba(212,175,55,0.1)",
          borderTop: "3px solid #D4AF37",
          animation: "spin 1s linear infinite",
        }} />
        <div style={{ color: "#4a7a40", fontSize: 13, letterSpacing: 4, fontFamily: "Cinzel,serif" }}>
          AMAZONIA MENYU
        </div>
      </div>
    );
  }

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #050f06, #0a1f0d, #0f2a10, #0d1f10)",
      fontFamily: "Inter,sans-serif",
      paddingBottom: 100,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; background: #050f06; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.25); border-radius: 2px; }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(212,175,55,0.05); }
          50% { box-shadow: 0 0 40px rgba(212,175,55,0.15); }
        }
        .menu-item {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        .menu-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(212,175,55,0.03), transparent);
          transition: left 0.6s ease;
          pointer-events: none;
        }
        .menu-item:hover::before {
          left: 100%;
        }
        .menu-item:hover {
          transform: translateY(-8px) scale(1.01);
          border-color: rgba(212,175,55,0.35);
          box-shadow: 0 24px 64px rgba(0,0,0,0.5), 0 0 40px rgba(212,175,55,0.05);
        }
        .menu-item:hover .item-image {
          transform: scale(1.08);
        }
        .item-image {
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .category-tab {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }
        .category-tab::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 50%;
          width: 0;
          height: 2px;
          background: #D4AF37;
          transition: all 0.3s ease;
          transform: translateX(-50%);
        }
        .category-tab.active::after {
          width: 60%;
        }
        .category-tab:hover::after {
          width: 40%;
        }
        .menu-grid {
          display: grid;
          gap: 20px;
        }
        @media (max-width: 480px) {
          .menu-grid { grid-template-columns: 1fr !important; gap: 16px; }
          .menu-hero-title { font-size: 24px !important; }
        }
        @media (min-width: 481px) and (max-width: 768px) {
          .menu-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (min-width: 769px) and (max-width: 1100px) {
          .menu-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (min-width: 1101px) {
          .menu-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
        .gold-gradient-text {
          background: linear-gradient(135deg, #b8931f, #D4AF37, #f0d060);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .gold-border {
          border: 1px solid rgba(212,175,55,0.15);
        }
        .gold-border:hover {
          border-color: rgba(212,175,55,0.4);
        }
      `}</style>

      {/* ─── HEADER ────────────────────────────────────────────────────────── */}
      <header style={{
        background: "rgba(3,10,5,0.96)",
        backdropFilter: "blur(30px)",
        borderBottom: "1px solid rgba(212,175,55,0.06)",
        padding: "16px 28px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: "linear-gradient(135deg, #1a3a1a, #0f2a10)",
            border: "1px solid rgba(212,175,55,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            boxShadow: "0 4px 20px rgba(212,175,55,0.1)",
          }}>
            🌿
          </div>
          <div>
            <div style={{
              fontFamily: "Cinzel,serif",
              background: "linear-gradient(135deg, #D4AF37, #f0d060)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 4,
            }}>
              AMAZONIA
            </div>
            <div style={{
              color: "#4a7a40",
              fontSize: 9,
              letterSpacing: 3,
              marginTop: 2,
              textTransform: "uppercase",
            }}>
              ✦ Premium Dining ✦
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {/* Cart button */}
          <button
            onClick={() => setCartOpen(true)}
            style={{
              position: "relative",
              background: "rgba(212,175,55,0.06)",
              border: "1px solid rgba(212,175,55,0.15)",
              borderRadius: 14,
              padding: "12px 20px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 10,
              transition: "all 0.3s",
              backdropFilter: "blur(10px)",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(212,175,55,0.12)";
              e.target.style.borderColor = "rgba(212,175,55,0.3)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(212,175,55,0.06)";
              e.target.style.borderColor = "rgba(212,175,55,0.15)";
            }}
          >
            <Icon d={IC.cart} color="#D4AF37" size={20} />
            <span style={{ color: "#D4AF37", fontSize: 13, fontWeight: 600, fontFamily: "Cinzel,serif" }}>
              Savatcha
            </span>
            {cart.length > 0 && (
              <div style={{
                position: "absolute",
                top: -8,
                right: -8,
                minWidth: 22,
                height: 22,
                borderRadius: 11,
                background: "linear-gradient(135deg, #D4AF37, #b8931f)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 7px",
                animation: "pulse 0.5s ease",
                boxShadow: "0 2px 12px rgba(212,175,55,0.4)",
              }}>
                <span style={{
                  color: "#0a1f0d",
                  fontSize: 10,
                  fontWeight: 700,
                }}>
                  {cart.reduce((s, i) => s + i.qty, 0)}
                </span>
              </div>
            )}
          </button>

          {/* Total */}
          {cart.length > 0 && (
            <div style={{
              color: "#D4AF37",
              fontSize: 15,
              fontWeight: 700,
              fontFamily: "Cinzel,serif",
              background: "rgba(212,175,55,0.05)",
              border: "1px solid rgba(212,175,55,0.1)",
              borderRadius: 12,
              padding: "10px 20px",
            }}>
              {totalPrice.toLocaleString()} so'm
            </div>
          )}
        </div>
      </header>

      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(160deg, rgba(212,175,55,0.03), rgba(10,31,13,0.95))",
        borderBottom: "1px solid rgba(212,175,55,0.05)",
        padding: "48px 28px 36px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute",
          top: -150,
          right: -150,
          width: 500,
          height: 500,
          background: "radial-gradient(circle, rgba(212,175,55,0.04), transparent 70%)",
          pointerEvents: "none",
          animation: "float 8s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute",
          bottom: -100,
          left: -100,
          width: 400,
          height: 400,
          background: "radial-gradient(circle, rgba(39,174,96,0.03), transparent 70%)",
          pointerEvents: "none",
          animation: "float 10s ease-in-out infinite reverse",
        }} />
        <div style={{
          fontFamily: "Cinzel,serif",
          fontSize: 38,
          fontWeight: 700,
          letterSpacing: 8,
          marginBottom: 14,
          position: "relative",
        }} className="gold-gradient-text">
          {showFood ? "✦ TAOMLAR ✦" : "✦ BAR MENYU ✦"}
        </div>
        <div style={{
          color: "#7fa86b",
          fontSize: 16,
          maxWidth: 560,
          margin: "0 auto",
          lineHeight: 1.9,
          position: "relative",
          letterSpacing: 0.5,
        }}>
          {showFood
            ? "Bizning oshxonamizdan eng sara taomlar. Har bir ta'm o'ziga xos va unutilmas."
            : "Eksklyuziv ichimliklar va kokteyllar. Kechki ovqatingizni mukammal to'ldiring."
          }
        </div>
      </div>

      {/* ─── TABS ──────────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex",
        gap: 8,
        padding: "16px 28px",
        borderBottom: "1px solid rgba(255,255,255,0.03)",
        background: "rgba(3,10,5,0.7)",
        backdropFilter: "blur(10px)",
      }}>
        <button
          onClick={() => {
            setShowFood(true);
            setSelectedCategory("all");
          }}
          className={`category-tab ${showFood ? "active" : ""}`}
          style={{
            flex: 1,
            padding: "14px 24px",
            borderRadius: 16,
            border: "none",
            background: showFood ? "linear-gradient(135deg, rgba(212,175,55,0.18), rgba(212,175,55,0.06))" : "rgba(255,255,255,0.02)",
            color: showFood ? "#D4AF37" : "#4a7a40",
            fontSize: 15,
            fontWeight: showFood ? 700 : 400,
            cursor: "pointer",
            fontFamily: "Cinzel,serif",
            letterSpacing: 1.5,
            transition: "all 0.3s",
            boxShadow: showFood ? "inset 0 0 0 1px rgba(212,175,55,0.25)" : "none",
          }}
        >
          🥘 Taomlar
        </button>
        <button
          onClick={() => {
            setShowFood(false);
            setSelectedCategory("all");
          }}
          className={`category-tab ${!showFood ? "active" : ""}`}
          style={{
            flex: 1,
            padding: "14px 24px",
            borderRadius: 16,
            border: "none",
            background: !showFood ? "linear-gradient(135deg, rgba(212,175,55,0.18), rgba(212,175,55,0.06))" : "rgba(255,255,255,0.02)",
            color: !showFood ? "#D4AF37" : "#4a7a40",
            fontSize: 15,
            fontWeight: !showFood ? 700 : 400,
            cursor: "pointer",
            fontFamily: "Cinzel,serif",
            letterSpacing: 1.5,
            transition: "all 0.3s",
            boxShadow: !showFood ? "inset 0 0 0 1px rgba(212,175,55,0.25)" : "none",
          }}
        >
          🍸 Bar
        </button>
      </div>

      {/* ─── FILTERS & SEARCH ────────────────────────────────────────────── */}
      <div style={{
        padding: "16px 28px",
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.03)",
        background: "rgba(3,10,5,0.4)",
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, flex: 1 }}>
          <button
            onClick={() => setSelectedCategory("all")}
            style={{
              padding: "8px 20px",
              borderRadius: 24,
              border: selectedCategory === "all" ? "1px solid #D4AF37" : "1px solid rgba(134,176,84,0.12)",
              background: selectedCategory === "all" ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.02)",
              color: selectedCategory === "all" ? "#D4AF37" : "#7fa86b",
              fontSize: 12,
              cursor: "pointer",
              fontWeight: selectedCategory === "all" ? 600 : 400,
              transition: "all 0.3s",
              whiteSpace: "nowrap",
            }}
          >
            🏷️ Barchasi
          </button>
          {catList.map(([id, cat]) => {
            const count = showFood
              ? foodItems.filter((item) => item.category === id).length
              : barItems.filter((item) => item.category === id).length;
            if (count === 0) return null;
            return (
              <button
                key={id}
                onClick={() => setSelectedCategory(id)}
                style={{
                  padding: "8px 20px",
                  borderRadius: 24,
                  border: selectedCategory === id ? "1px solid #D4AF37" : "1px solid rgba(134,176,84,0.12)",
                  background: selectedCategory === id ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.02)",
                  color: selectedCategory === id ? "#D4AF37" : "#7fa86b",
                  fontSize: 12,
                  cursor: "pointer",
                  fontWeight: selectedCategory === id ? 600 : 400,
                  transition: "all 0.3s",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  whiteSpace: "nowrap",
                }}
              >
                <span>{cat.icon || "📁"}</span>
                <span>{cat.name}</span>
                <span style={{
                  fontSize: 9,
                  opacity: 0.5,
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 10,
                  padding: "0 8px",
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{
          position: "relative",
          minWidth: 200,
          maxWidth: 320,
          flex: 1,
        }}>
          <span style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            opacity: 0.3,
            pointerEvents: "none",
          }}>
            <Icon d={IC.search} color="#D4AF37" size={16} />
          </span>
          <input
            ref={searchRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={showFood ? "🔍 Taomlar..." : "🔍 Ichimliklar..."}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(134,176,84,0.1)",
              borderRadius: 12,
              padding: "10px 14px 10px 40px",
              color: "#e8f5e0",
              fontSize: 13,
              fontFamily: "Inter,sans-serif",
              outline: "none",
              boxSizing: "border-box",
              transition: "all 0.3s",
              backdropFilter: "blur(10px)",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "rgba(212,175,55,0.4)";
              e.target.style.boxShadow = "0 0 0 4px rgba(212,175,55,0.05)";
              e.target.style.background = "rgba(255,255,255,0.06)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(134,176,84,0.1)";
              e.target.style.boxShadow = "none";
              e.target.style.background = "rgba(255,255,255,0.03)";
            }}
          />
        </div>
      </div>

      {/* ─── RESULT COUNT ─────────────────────────────────────────────────── */}
      <div style={{
        padding: "12px 28px",
        color: "#4a7a40",
        fontSize: 12,
        letterSpacing: 0.5,
        borderBottom: "1px solid rgba(255,255,255,0.02)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 6,
      }}>
        <span>
          {filteredItems.length} ta mahsulot topildi
          {searchTerm && ` — "${searchTerm}"`}
          {selectedCategory !== "all" && ` · ${categories[selectedCategory]?.name || ""}`}
        </span>
        <span style={{ color: "#3d5c38", fontSize: 10, letterSpacing: 1 }}>
          ✦ {showFood ? "TAOMLAR" : "BAR"} ✦
        </span>
      </div>

      {/* ─── MENU GRID ────────────────────────────────────────────────────── */}
      <div style={{ padding: "20px 28px 0" }}>
        {filteredItems.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "100px 20px",
            color: "#3d5c38",
          }}>
            <div style={{ fontSize: 72, marginBottom: 24, opacity: 0.6 }}>🍽️</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: "#4a7a40", marginBottom: 10, fontFamily: "Cinzel,serif" }}>
              Hech narsa topilmadi
            </div>
            <div style={{ fontSize: 15 }}>
              {searchTerm ? `"${searchTerm}" bo'yicha natija yo'q` : "Bu bo'limda hozircha mahsulot yo'q"}
            </div>
            <button
              onClick={() => { setSearchTerm(""); setSelectedCategory("all"); }}
              style={{
                marginTop: 20,
                padding: "12px 28px",
                borderRadius: 14,
                border: "1px solid rgba(134,176,84,0.2)",
                background: "rgba(255,255,255,0.03)",
                color: "#86B054",
                cursor: "pointer",
                fontSize: 13,
                transition: "all 0.3s",
                fontFamily: "Cinzel,serif",
                letterSpacing: 1,
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(255,255,255,0.08)";
                e.target.style.borderColor = "rgba(134,176,84,0.4)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(255,255,255,0.03)";
                e.target.style.borderColor = "rgba(134,176,84,0.2)";
              }}
            >
              🔄 Filtrlarni tozalash
            </button>
          </div>
        ) : (
          <div className="menu-grid" style={{
            animation: "fadeIn 0.4s ease",
          }}>
            {filteredItems.map((item, idx) => {
              const category = categories[item.category];
              const isInCart = cart.some((i) => i.id === item.id);
              const qtyInCart = cart.find((i) => i.id === item.id)?.qty || 0;

              return (
                <div
                  key={item.id}
                  className="menu-item"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(134,176,84,0.06)",
                    borderRadius: 20,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    animation: `fadeIn ${0.2 + idx * 0.04}s ease`,
                    backdropFilter: "blur(10px)",
                  }}
                >
                  {/* Image */}
                  <div style={{
                    width: "100%",
                    height: 220,
                    background: "linear-gradient(135deg, rgba(212,175,55,0.03), rgba(10,31,13,0.7))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 80,
                    position: "relative",
                    overflow: "hidden",
                  }}>
                    {item.image && item.image.startsWith("data:") ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="item-image"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <span style={{ animation: "float 3s ease-in-out infinite", opacity: 0.7 }}>
                        {item.emoji || "🍽️"}
                      </span>
                    )}
                    
                    {/* Gradient overlay */}
                    <div style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: "40%",
                      background: "linear-gradient(to top, rgba(10,31,13,0.8), transparent)",
                      pointerEvents: "none",
                    }} />
                    
                    {/* Category badge */}
                    {category && (
                      <div style={{
                        position: "absolute",
                        top: 16,
                        left: 16,
                        background: "rgba(0,0,0,0.6)",
                        backdropFilter: "blur(16px)",
                        borderRadius: 12,
                        padding: "5px 16px",
                        fontSize: 10,
                        color: "#D4AF37",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        border: "1px solid rgba(212,175,55,0.1)",
                        letterSpacing: 0.5,
                      }}>
                        <span>{category.icon || "📁"}</span>
                        <span>{category.name}</span>
                      </div>
                    )}

                    {/* Popular badge */}
                    {item.popular && (
                      <div style={{
                        position: "absolute",
                        top: 16,
                        right: 16,
                        background: "linear-gradient(135deg, #D4AF37, #b8931f)",
                        borderRadius: 12,
                        padding: "5px 14px",
                        fontSize: 10,
                        color: "#0a1f0d",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        boxShadow: "0 4px 20px rgba(212,175,55,0.3)",
                        letterSpacing: 0.5,
                      }}>
                        ⭐ Mashhur
                      </div>
                    )}

                    {/* In cart badge */}
                    {isInCart && (
                      <div style={{
                        position: "absolute",
                        bottom: 16,
                        right: 16,
                        background: "rgba(39,174,96,0.85)",
                        backdropFilter: "blur(16px)",
                        borderRadius: 12,
                        padding: "5px 14px",
                        fontSize: 10,
                        color: "#fff",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        border: "1px solid rgba(39,174,96,0.3)",
                      }}>
                        <Icon d={IC.cart} size={12} color="#fff" />
                        {qtyInCart} ta
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{
                    padding: "20px 22px 22px",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 8,
                      gap: 10,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          color: "#e8f5e0",
                          fontSize: 18,
                          fontWeight: 600,
                          fontFamily: "Cinzel,serif",
                          lineHeight: 1.2,
                          letterSpacing: 0.5,
                        }}>
                          {item.name}
                        </div>
                      </div>
                      <div style={{
                        color: "#D4AF37",
                        fontSize: 18,
                        fontWeight: 700,
                        fontFamily: "Cinzel,serif",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}>
                        {item.price.toLocaleString()} so'm
                      </div>
                    </div>

                    {item.description && (
                      <div style={{
                        color: "#4a7a40",
                        fontSize: 13,
                        lineHeight: 1.7,
                        marginBottom: 14,
                        flex: 1,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}>
                        {item.description}
                      </div>
                    )}

                    {/* Tags */}
                    <div style={{
                      display: "flex",
                      gap: 8,
                      marginBottom: 16,
                      flexWrap: "wrap",
                    }}>
                      {item.spicy && (
                        <span style={{
                          fontSize: 10,
                          color: "#e74c3c",
                          background: "rgba(231,76,60,0.06)",
                          border: "1px solid rgba(231,76,60,0.1)",
                          borderRadius: 8,
                          padding: "3px 12px",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          letterSpacing: 0.3,
                        }}>
                          🌶 Achchiq
                        </span>
                      )}
                      {item.vegetarian && (
                        <span style={{
                          fontSize: 10,
                          color: "#2ecc71",
                          background: "rgba(46,204,113,0.06)",
                          border: "1px solid rgba(46,204,113,0.1)",
                          borderRadius: 8,
                          padding: "3px 12px",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          letterSpacing: 0.3,
                        }}>
                          🌿 Vegetarian
                        </span>
                      )}
                      {item.glutenFree && (
                        <span style={{
                          fontSize: 10,
                          color: "#f39c12",
                          background: "rgba(243,156,18,0.06)",
                          border: "1px solid rgba(243,156,18,0.1)",
                          borderRadius: 8,
                          padding: "3px 12px",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          letterSpacing: 0.3,
                        }}>
                          🚫 Glutensiz
                        </span>
                      )}
                    </div>

                    {/* Add to cart */}
                    <button
                      onClick={() => addToCart(item)}
                      style={{
                        width: "100%",
                        padding: "14px",
                        borderRadius: 14,
                        border: "none",
                        background: isInCart
                          ? "linear-gradient(135deg, #27ae60, #2ecc71)"
                          : "linear-gradient(135deg, #b8931f, #D4AF37, #e8c84a)",
                        color: isInCart ? "#fff" : "#0a1f0d",
                        fontFamily: "Cinzel,serif",
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: 0.5,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        transition: "all 0.3s",
                        boxShadow: isInCart 
                          ? "0 2px 16px rgba(39,174,96,0.25)" 
                          : "0 2px 16px rgba(212,175,55,0.2)",
                      }}
                      onMouseEnter={(e) => {
                        if (!isInCart) {
                          e.target.style.transform = "scale(1.03)";
                          e.target.style.boxShadow = "0 6px 28px rgba(212,175,55,0.35)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "scale(1)";
                        if (!isInCart) {
                          e.target.style.boxShadow = "0 2px 16px rgba(212,175,55,0.2)";
                        }
                      }}
                    >
                      {isInCart ? (
                        <>
                          <Icon d={IC.check} size={18} color="#fff" />
                          Savatchada ({qtyInCart} ta)
                        </>
                      ) : (
                        <>
                          🛒 Savatchaga
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── CART MODAL ────────────────────────────────────────────────────── */}
      {cartOpen && (
        <CartModal
          items={cart}
          onClose={() => setCartOpen(false)}
          onUpdate={updateQty}
          onRemove={removeItem}
          onSubmit={submitOrder}
          total={totalPrice}
        />
      )}

      {/* ─── TOASTS ────────────────────────────────────────────────────────── */}
      <Toast toasts={toasts} remove={removeToast} />
    </div>
  );
}