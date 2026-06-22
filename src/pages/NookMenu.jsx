// NookMenu.jsx - Premium A4 Kitob Menyu
// Firebase dan barcha ma'lumotlarni import qiladi
// Kategoriya bo'yicha guruhlash, har bir kategoriya alohida sahifada
// Har bir sahifada 4 tadan mahsulot, zigzag layout, premium dizayn
// FON RASMI: public/bgr.png dan olinadi, tepadan 25% pastda joylashgan
// Sahifa raqamlari olib tashlandi, matnlar kichraytirildi va pastroqqa tushirildi
// Rasmlar balandligi oshirildi (140px)

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import { dbListen } from "../firebase";
import bgImage from "/bgr.png"; // public/bgr.png

// ─── CORNER ORNAMENT ─────────────────────────────────────────────────────────
function Corner({ position }) {
  const rot = { tl: 0, tr: 90, br: 180, bl: 270 }[position];
  const pos = {
    tl: { top: -10, left: -10 },
    tr: { top: -10, right: -10 },
    br: { bottom: -10, right: -10 },
    bl: { bottom: -10, left: -10 },
  }[position];

  return (
    <svg
      width="128"
      height="128"
      viewBox="0 0 100 100"
      style={{
        position: "absolute",
        ...pos,
        transform: `rotate(${rot}deg)`,
        zIndex: 5,
        opacity: 0.95,
        filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.6))",
      }}
    >
      <path d="M5 32 L5 5 L32 5" stroke="#C9A24B" strokeWidth="1.8" fill="none" />
      <path d="M16 44 L16 16 L44 16" stroke="#C9A24B" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M26 54 L26 26 L54 26" stroke="#C9A24B" strokeWidth="0.6" fill="none" opacity="0.3" />
      <circle cx="16" cy="16" r="3.4" fill="#C9A24B" opacity="0.95" />
      <circle cx="16" cy="16" r="6" stroke="#C9A24B" strokeWidth="0.5" fill="none" opacity="0.4" />
      <path
        d="M32 5 C 48 5, 58 5, 66 10 M5 32 C 5 48, 5 58, 10 66"
        stroke="#C9A24B"
        strokeWidth="1"
        fill="none"
        opacity="0.5"
      />
      <path d="M22 5 L27 11 L37 6 L30 14 L42 19" stroke="#C9A24B" strokeWidth="0.9" fill="none" opacity="0.4" />
      <path d="M5 22 L11 27 L6 37 L14 30 L19 42" stroke="#C9A24B" strokeWidth="0.9" fill="none" opacity="0.4" />
      <path d="M10 10 L14 14 L18 10 L14 18 L10 14 Z" fill="#C9A24B" opacity="0.22" />
    </svg>
  );
}

// ─── DIVIDER ──────────────────────────────────────────────────────────────────
function Divider() {
  return (
    <div style={styles.divider}>
      <span style={styles.dividerLine} />
      <span style={styles.dividerDot}>◆</span>
      <span style={styles.dividerLine} />
    </div>
  );
}

// ─── MENU ROW (ZIGZAG) ──────────────────────────────────────────────────────
function MenuRow({ item, reversed, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{
        scale: 1.02,
        boxShadow: "0 8px 32px rgba(201,162,75,0.08)",
        transition: { duration: 0.2 },
      }}
      style={{
        ...styles.row,
        flexDirection: reversed ? "row-reverse" : "row",
      }}
    >
      {/* Image */}
      <div style={styles.imageCol}>
        <div style={styles.imageFrame}>
          {item.image && item.image.startsWith("data:") ? (
            <img src={item.image} alt={item.name} style={styles.image} />
          ) : (
            <div style={styles.imagePlaceholder}>
              <span style={styles.imageEmoji}>{item.emoji || "🍔"}</span>
            </div>
          )}
        </div>
        {item.popular && <span style={styles.popularBadge}>⭐ Mashhur</span>}
      </div>

      {/* Content */}
      <div style={styles.textCol}>
        <h3 style={styles.itemName}>{item.name}</h3>
        <Divider />
        <p style={styles.itemDesc}>{item.description}</p>
        <div style={styles.itemTags}>
          {item.spicy && <span style={styles.tagSpicy}>🌶</span>}
          {item.vegetarian && <span style={styles.tagVeg}>🌿</span>}
          {item.glutenFree && <span style={styles.tagGluten}>🚫</span>}
        </div>
        <div style={styles.itemPrice}>
          {typeof item.price === "number" ? item.price.toLocaleString() : item.price}{" "}
          <span style={styles.somLabel}>so'm</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function NookMenu() {
  const [categories, setCategories] = useState({});
  const [menuItems, setMenuItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const pageRef = useRef(null);

  // ─── FIREBASE LISTENERS (MenuPage.jsx dagi kabi) ────────────────────────
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

  // ─── MA'LUMOTLARNI TAYYORLASH ────────────────────────────────────────────
  const allItems = Object.entries(menuItems)
    .filter(([, item]) => item.status === "active")
    .map(([id, item]) => ({ ...item, id }));

  // Kategoriyalarni olish
  const catList = Object.entries(categories)
    .filter(([, cat]) => cat.status === "active")
    .sort((a, b) => (a[1].order || 0) - (b[1].order || 0));

  // Har bir kategoriyadagi mahsulotlar
  const categoryMap = {};
  catList.forEach(([catId, cat]) => {
    const items = allItems.filter((item) => item.category === catId);
    if (items.length > 0) {
      categoryMap[catId] = {
        name: cat.name,
        icon: cat.icon || "🍽️",
        color: cat.color || "#C9A24B",
        items: items,
      };
    }
  });

  // Agar kategoriya bo'lmasa, barcha mahsulotlarni bitta guruhga solamiz
  const hasCategories = Object.keys(categoryMap).length > 0;

  // Sahifalarni tayyorlash: har bir kategoriya o'z sahifalarida
  const ITEMS_PER_PAGE = 4;
  const pages = [];

  if (hasCategories) {
    // Kategoriya bo'yicha
    Object.entries(categoryMap).forEach(([catId, catData]) => {
      const items = catData.items;
      const totalItems = items.length;
      const numPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

      for (let i = 0; i < numPages; i++) {
        const start = i * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        pages.push({
          categoryName: catData.name,
          categoryIcon: catData.icon,
          categoryColor: catData.color,
          items: items.slice(start, end),
          pageIndex: i + 1,
          totalPages: numPages,
          categoryId: catId,
        });
      }
    });
  } else {
    // Kategoriya bo'lmasa, barcha mahsulotlar bitta guruh
    const totalItems = allItems.length;
    const numPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    for (let i = 0; i < numPages; i++) {
      const start = i * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      pages.push({
        categoryName: "Barcha Mahsulotlar",
        categoryIcon: "🍽️",
        categoryColor: "#C9A24B",
        items: allItems.slice(start, end),
        pageIndex: i + 1,
        totalPages: numPages,
        categoryId: "all",
      });
    }
  }

  const totalPages = pages.length;

  // ─── KEYBOARD NAVIGATION ────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        if (currentPage > 0) setCurrentPage(currentPage - 1);
      }
      if (e.key === "Home") setCurrentPage(0);
      if (e.key === "End") setCurrentPage(totalPages - 1);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [currentPage, totalPages]);

  // ─── LOADING ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingIcon}>📖</div>
        <div style={styles.loadingSpinner} />
        <div style={styles.loadingText}>AMAZONIA NOOK MENU</div>
      </div>
    );
  }

  if (totalPages === 0 || allItems.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <div style={styles.emptyIcon}>📖</div>
        <div style={styles.emptyTitle}>Hozircha mahsulot yo'q</div>
        <div style={styles.emptySub}>Admin panel orqali menyu qo'shing</div>
      </div>
    );
  }

  const currentPageData = pages[currentPage] || pages[0];
  const currentItems = currentPageData?.items || [];
  const categoryName = currentPageData?.categoryName || "";
  const categoryIcon = currentPageData?.categoryIcon || "🍽️";
  const categoryColor = currentPageData?.categoryColor || "#C9A24B";

  // ─── NAVIGATION FUNKSIYALARI ──────────────────────────────────────────────
  const nextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  // ─── SAHIFANI RASM (PNG) SIFATIDA YUKLAB OLISH ───────────────────────────
  const downloadPage = async () => {
    if (!pageRef.current || downloading) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(pageRef.current, {
        scale: 3, // yuqori sifat / tiniqlik uchun
        useCORS: true,
        backgroundColor: null,
      });
      const link = document.createElement("a");
      const fileName = `${(categoryName || "menu").replace(/\s+/g, "_")}_${currentPage + 1}.png`;
      link.download = fileName;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
    } catch (err) {
      console.error("Sahifani yuklab olishda xatolik:", err);
    } finally {
      setDownloading(false);
    }
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div style={styles.outer}>
      <div style={styles.pageWrapper}>
        {/* ─── BOOK PAGE ──────────────────────────────────────────────────── */}
        <motion.div
          key={currentPage}
          ref={pageRef}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          style={{
            ...styles.page,
            backgroundImage: `url(${bgImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center 25%",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Frame line */}
          <div style={styles.frameLine} />
          <div style={styles.frameLineInner} />

          {/* Corners */}
          <Corner position="tl" />
          <Corner position="tr" />
          <Corner position="bl" />
          <Corner position="br" />

          {/* Content */}
          <div style={styles.content}>
            {/* Category Header */}
            <div style={styles.categoryHeader}>
              <span style={styles.categoryIcon}>{categoryIcon}</span>
              <div>
                <h2 style={styles.categoryName}>{categoryName}</h2>
                <span style={styles.categoryCount}>
                  {currentPageData.totalPages > 1
                    ? `Sahifa ${currentPageData.pageIndex}/${currentPageData.totalPages}`
                    : `${currentItems.length} ta mahsulot`}
                </span>
              </div>
              <span style={styles.categoryBadge}>✦ PREMIUM ✦</span>
            </div>

            {/* Menu Items */}
            <div style={styles.itemsContainer}>
              {currentItems.map((item, idx) => (
                <MenuRow
                  key={item.id || idx}
                  item={item}
                  reversed={idx % 2 === 1}
                  index={idx}
                />
              ))}
              {/* Bo'sh joylar to'ldiriladi (4 ta bo'lishi uchun) */}
              {currentItems.length < ITEMS_PER_PAGE &&
                Array.from({ length: ITEMS_PER_PAGE - currentItems.length }).map((_, i) => (
                  <div key={`empty-${i}`} style={styles.emptySlot} />
                ))}
            </div>

            {/* Page number - olib tashlandi */}
            {/* <div style={styles.pageNumberWrap}> ... </div> */}
          </div>
        </motion.div>

        {/* ─── YUKLAB OLISH ────────────────────────────────────────────────── */}
        <button
          onClick={downloadPage}
          disabled={downloading}
          style={{
            ...styles.downloadBtn,
            opacity: downloading ? 0.6 : 1,
            cursor: downloading ? "wait" : "pointer",
          }}
        >
          <span style={styles.downloadIcon}>{downloading ? "⏳" : "⬇"}</span>
          {downloading ? "Tayyorlanmoqda..." : "Sahifani yuklab olish"}
        </button>

        {/* ─── CONTROLS ────────────────────────────────────────────────────── */}
        <div style={styles.controls}>
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            style={{
              ...styles.controlBtn,
              opacity: currentPage === 0 ? 0.3 : 1,
              cursor: currentPage === 0 ? "not-allowed" : "pointer",
            }}
          >
            ◀ Orqaga
          </button>

          <div style={styles.pageDots}>
            {pages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx)}
                style={{
                  ...styles.pageDot,
                  background: idx === currentPage ? "#C9A24B" : "rgba(201,162,75,0.15)",
                  width: idx === currentPage ? 28 : 8,
                }}
              />
            ))}
          </div>

          <button
            onClick={nextPage}
            disabled={currentPage === totalPages - 1}
            style={{
              ...styles.controlBtn,
              ...styles.controlBtnNext,
              opacity: currentPage === totalPages - 1 ? 0.3 : 1,
              cursor: currentPage === totalPages - 1 ? "not-allowed" : "pointer",
            }}
          >
            Keyingi ▶
          </button>
        </div>

        <div style={styles.hint}>← → yoki Page Up/Down</div>
      </div>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const GOLD = "#C9A24B";
const CREAM = "#E8DEC8";

const styles = {
  outer: {
    minHeight: "100vh",
    background: "#040403",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    fontFamily: "'Inter', sans-serif",
  },
  pageWrapper: {
    width: "100%",
    maxWidth: "794px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px",
  },
  page: {
    position: "relative",
    width: "100%",
    maxWidth: "794px",
    aspectRatio: "210 / 297",
    boxShadow:
      "0 30px 90px rgba(0,0,0,0.7), inset 0 0 110px rgba(0,0,0,0.55), inset 0 0 220px rgba(0,0,0,0.25)",
    overflow: "hidden",
    borderRadius: "2px",
  },
  frameLine: {
    position: "absolute",
    inset: "14px",
    border: `1.4px solid ${GOLD}`,
    opacity: 0.6,
    pointerEvents: "none",
    zIndex: 4,
  },
  frameLineInner: {
    position: "absolute",
    inset: "22px",
    border: `0.6px solid ${GOLD}`,
    opacity: 0.32,
    pointerEvents: "none",
    zIndex: 4,
  },
  content: {
    position: "relative",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    padding: "248px 42px 36px",
    zIndex: 6,
    background: "rgba(3,5,3,0.10)",
    borderRadius: "2px",
  },
  categoryHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "8px",
    borderBottom: `1px solid ${GOLD}22`,
    paddingBottom: "6px",
  },
  categoryIcon: {
    fontSize: "19px",
    width: "32px",
    textAlign: "center",
    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.85))",
  },
  categoryName: {
    fontFamily: "'Playfair Display', serif",
    color: GOLD,
    fontSize: "16px",
    fontWeight: 600,
    letterSpacing: "0.8px",
    margin: 0,
    textShadow: "0 2px 6px rgba(0,0,0,0.9)",
  },
  categoryCount: {
    fontFamily: "'EB Garamond', serif",
    color: CREAM,
    fontSize: "9px",
    opacity: 0.6,
    letterSpacing: "1px",
    textShadow: "0 1px 4px rgba(0,0,0,0.9)",
  },
  categoryBadge: {
    marginLeft: "auto",
    fontFamily: "'Cinzel', serif",
    color: GOLD,
    fontSize: "7px",
    letterSpacing: "2px",
    opacity: 0.45,
    border: `1px solid ${GOLD}33`,
    padding: "2px 9px",
    borderRadius: "20px",
    textShadow: "0 1px 4px rgba(0,0,0,0.9)",
  },
  itemsContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "12px",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "18px",  // ← biroz kengaytirildi
    cursor: "pointer",
    transition: "all 0.3s",
    padding: "2px 0",
  },
  imageCol: {
    flex: "0 0 42%",  // biroz kengroq
    position: "relative",
  },
  imageFrame: {
    border: `1.5px solid ${GOLD}`,
    borderRadius: "4px",
    padding: "3px",
    background: "rgba(0,0,0,0.22)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.55)",
  },
  image: {
    width: "100%",
    height: "160px",  // ← balandligi oshirildi
    objectFit: "cover",
    display: "block",
    borderRadius: "2px",
    filter: "saturate(1.05) contrast(1.03)",
  },
  imagePlaceholder: {
    width: "100%",
    height: "140px",  // ← balandligi oshirildi
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.03)",
    borderRadius: "2px",
  },
  imageEmoji: {
    fontSize: "50px",
  },
  popularBadge: {
    position: "absolute",
    top: "-8px",
    right: "-6px",
    background: "linear-gradient(135deg, #b8931f, #D4AF37)",
    color: "#0a1f0d",
    fontSize: "8px",
    fontWeight: 700,
    padding: "2px 10px",
    borderRadius: "20px",
    fontFamily: "'Cinzel', serif",
    letterSpacing: "0.5px",
    boxShadow: "0 2px 12px rgba(184,147,31,0.3)",
  },
  textCol: {
    flex: 1,
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "3px",
  },
  itemName: {
    fontFamily: "'Playfair Display', serif",
    color: GOLD,
    fontSize: "18px",
    fontWeight: 600,
    fontStyle: "italic",
    letterSpacing: "0.4px",
    margin: 0,
    textShadow: "0 2px 8px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,0.8)",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    margin: "2px 0",
  },
  dividerLine: {
    width: "20px",
    height: "1px",
    background: GOLD,
    opacity: 0.55,
    boxShadow: "0 1px 3px rgba(0,0,0,0.8)",
  },
  dividerDot: {
    color: GOLD,
    fontSize: "5px",
    opacity: 0.85,
    textShadow: "0 1px 4px rgba(0,0,0,0.9)",
  },
  itemDesc: {
    fontFamily: "'EB Garamond', serif",
    fontStyle: "italic",
    color: CREAM,
    fontSize: "10.5px",
    lineHeight: 1.45,
    maxWidth: "82%",
    margin: 0,
    opacity: 0.92,
    textShadow: "0 2px 6px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,0.8)",
  },
  itemTags: {
    display: "flex",
    gap: "5px",
    margin: "2px 0",
  },
  tagSpicy: { fontSize: "12px" },
  tagVeg: { fontSize: "12px" },
  tagGluten: { fontSize: "12px" },
  itemPrice: {
    fontFamily: "'Cinzel', serif",
    color: GOLD,
    fontSize: "15.5px",
    fontWeight: 600,
    letterSpacing: "1px",
    marginTop: "1px",
    textShadow: "0 2px 8px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,0.8)",
  },
  somLabel: {
    fontSize: "10px",
    opacity: 0.85,
  },
  emptySlot: {
    flex: 1,
    minHeight: "100px",
    opacity: 0,
  },
  // Sahifa raqami olib tashlandi
  pageNumberWrap: {
    display: "none",
  },
  downloadBtn: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "11px 26px",
    borderRadius: "30px",
    border: `1px solid ${GOLD}55`,
    background: "linear-gradient(135deg, rgba(201,162,75,0.12), rgba(201,162,75,0.04))",
    color: GOLD,
    fontFamily: "'Cinzel', serif",
    fontSize: "12px",
    letterSpacing: "1.5px",
    transition: "all 0.3s",
    boxShadow: "0 4px 18px rgba(0,0,0,0.35)",
  },
  downloadIcon: {
    fontSize: "14px",
  },
  controls: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  controlBtn: {
    padding: "10px 22px",
    borderRadius: "12px",
    border: "1px solid rgba(201,162,75,0.2)",
    background: "rgba(255,255,255,0.03)",
    color: GOLD,
    fontFamily: "'Cinzel', serif",
    fontSize: "13px",
    letterSpacing: "1px",
    cursor: "pointer",
    transition: "all 0.3s",
  },
  controlBtnNext: {
    background: "linear-gradient(135deg, #b8931f, #D4AF37)",
    color: "#0a1f0d",
    border: "none",
  },
  pageDots: {
    display: "flex",
    gap: "6px",
    alignItems: "center",
  },
  pageDot: {
    height: "6px",
    borderRadius: "3px",
    border: "none",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  hint: {
    color: "#444",
    fontSize: "10px",
    fontFamily: "'Inter', sans-serif",
    opacity: 0.3,
    letterSpacing: "1px",
  },
  loadingContainer: {
    minHeight: "100vh",
    background: "#040403",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "24px",
  },
  loadingIcon: {
    fontSize: "56px",
    animation: "float 3s ease-in-out infinite",
  },
  loadingSpinner: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    border: "3px solid rgba(201,162,75,0.08)",
    borderTop: "3px solid #C9A24B",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    color: "#4a7a40",
    fontSize: "12px",
    letterSpacing: "4px",
    fontFamily: "'Cinzel', serif",
  },
  emptyContainer: {
    minHeight: "100vh",
    background: "#040403",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    padding: "24px",
  },
  emptyIcon: {
    fontSize: "64px",
  },
  emptyTitle: {
    fontFamily: "'Cinzel', serif",
    color: "#C9A24B",
    fontSize: "24px",
    letterSpacing: "2px",
  },
  emptySub: {
    color: "#4a7a40",
    fontSize: "14px",
    fontFamily: "'Inter', sans-serif",
  },
};

// ─── GLOBAL STYLES ──────────────────────────────────────────────────────────
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Cinzel:wght@500;600&family=EB+Garamond:ital,wght@0,400;1,400&family=Playfair+Display:ital,wght@0,600;1,600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
  ::-webkit-scrollbar-thumb { background: rgba(201,162,75,0.2); border-radius: 2px; }
`;

// ─── STYLE INJECTION ──────────────────────────────────────────────────────
if (typeof document !== "undefined") {
  const styleEl = document.createElement("style");
  styleEl.textContent = globalStyles;
  if (!document.head.querySelector("#nook-menu-styles")) {
    styleEl.id = "nook-menu-styles";
    document.head.appendChild(styleEl);
  }
}