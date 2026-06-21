import { dbGet, dbSet, dbListen } from "./firebase";

/* ════════════════════════════════════════════════════════════════════════
   ✏️  SOZLASH BLOKI — FAQAT SHU YERNI TAHRIRLANG
   ════════════════════════════════════════════════════════════════════════

   Har bir zona uchun:
     zone     -> zona nomi (ekranda shu chiqadi, masalan "Garden")
     prefix   -> stol ID si boshlanadigan harf (G1, G2, G3... shu tarzda)
     count    -> shu zonada nechta stol bor
     capacity -> bitta stolga necha kishi sig'adi
     paid     -> true bo'lsa, bu zona pullik joy hisoblanadi (masalan Basseyn)
     priceTag -> faqat ko'rinish uchun belgi (ixtiyoriy, masalan "Bisetka")

   Stol soni yoki sig'imini o'zgartirish uchun shunchaki raqamni almashtiring.
   Yangi zona qo'shish uchun pastga yana bitta { ... } qatorini qo'shing.
   ════════════════════════════════════════════════════════════════════════ */

export const ZONES_CONFIG = [
  { zone: "Garden",   prefix: "G", count: 13, capacity: 4 },
  { zone: "Amazonia", prefix: "A", count: 10, capacity: 4 },
  { zone: "Terassa",  prefix: "T", count: 12,  capacity: 4 },
  { zone: "Basseyn",  prefix: "B", count: 7,  capacity: 6, paid: true, priceTag: "Bisetka" },
  { zone: "Basseyn",  prefix: "B", count: 13,  capacity: 6, paid: true, priceTag: "Tekin" },
];

/* ════════════════════════════════════════════════════════════════════════
   Bisetka (Basseyn) narxi va tarkibi — VIP sozlamalar bilan bog'liq.
   Bu yer faqat ma'lumot uchun, asosiy narx admin panelda
   settings/vip ichida turadi (ScreenBill shu yerdan o'qiydi).
   Agar shu yerda ko'rsatib qo'yish kerak bo'lsa, quyidagini o'zgartiring:
   ════════════════════════════════════════════════════════════════════════ */
export const BISETKA_INFO = {
  price: 220000,                  // narxi (so'm)
  includes: "2 ta klassik mojito + 1 ta meva assorti",
  serviceFeePercent: 12,          // umumiy shotga olinadigan xizmat haqi (%)
};

/* ════════════════════════════════════════════════════════════════════════
   QUYIDAGI QISMNI TAHRIRLASH SHART EMAS
   Yuqoridagi konfiguratsiya asosida stollar ro'yxati avtomatik yasaladi
   va Firebase real-time bazaga ulanadi.
   ════════════════════════════════════════════════════════════════════════ */

// Sozlash blokidan to'liq stollar ro'yxatini generatsiya qiladi
function buildStaticTables() {
  const list = [];
  ZONES_CONFIG.forEach(({ zone, prefix, count, capacity, paid, priceTag }) => {
    for (let i = 1; i <= count; i++) {
      list.push({
        id:       `${prefix}${i}`,
        zone,
        capacity,
        paid:     !!paid,
        priceTag: priceTag || null,
      });
    }
  });
  return list;
}

const STATIC_TABLES = buildStaticTables();

// Firebase'da hali yo'q bo'lgan stollarni yaratib qo'yadi (status: free, shots: [])
export async function ensureTablesExist() {
  for (const t of STATIC_TABLES) {
    try {
      const existing = await dbGet(`tables/${t.id}`);
      if (!existing) {
        await dbSet(`tables/${t.id}`, {
          id:       t.id,
          zone:     t.zone,
          capacity: t.capacity,
          paid:     t.paid,
          priceTag: t.priceTag,
          status:   "free",
          shots:    [],
        });
      }
    } catch (e) {
      console.error(`Stol ${t.id} yaratishda xatolik:`, e);
    }
  }
}

// Statik konfiguratsiya (zona, sig'im) + Firebase'dagi jonli holat (status, shots)
// ni birlashtirib, real-time ravishda callback'ga qaytaradi.
export function listenTables(callback) {
  return dbListen("tables", (data) => {
    const liveTables = data || {};

    const merged = STATIC_TABLES.map((t) => {
      const live = liveTables[t.id] || {};
      return {
        id:       t.id,
        zone:     t.zone,
        capacity: live.capacity ?? t.capacity,
        paid:     t.paid,
        priceTag: t.priceTag,
        status:   live.status || "free",
        shots:    live.shots  || [],
      };
    });

    callback(merged);
  });
}