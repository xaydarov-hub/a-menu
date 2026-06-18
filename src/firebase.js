import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  remove,
  push,
  onValue,
  off,
} from "firebase/database";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCKaHMjVOozS_WKY49Kr5-gp5ABkZ4m39E",
  authDomain: "ia-restaurant-76d41.firebaseapp.com",
  projectId: "ia-restaurant-76d41",
  storageBucket: "ia-restaurant-76d41.firebasestorage.app",
  messagingSenderId: "701439832114",
  appId: "1:701439832114:web:4f0d9fbe841d5d88bdcc2b",
  measurementId: "G-BKB6Y2FGG4",
  databaseURL: "https://ia-restaurant-76d41-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// ─── HELPERS ─────────────────────────────────────────────────────────────────
export const dbSet = (path, data) =>
  set(ref(db, path), data);

export const dbGet = async (path) => {
  const snap = await get(ref(db, path));
  return snap.exists() ? snap.val() : null;
};

export const dbUpdate = (path, data) =>
  update(ref(db, path), data);

export const dbRemove = (path) =>
  remove(ref(db, path));

export const dbPush = (path, data) =>
  push(ref(db, path), data);

// Real-time listener — returns unsubscribe function
export const dbListen = (path, callback) => {
  const r = ref(db, path);
  onValue(r, (snap) => callback(snap.exists() ? snap.val() : null));
  return () => off(r);
};

export { db };