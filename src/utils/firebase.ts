/**
 * firebase.ts — Firestore Offline-first Sync
 * ============================================================
 * Collection: election_app
 * Document:   current_data
 * Field:      centers (array)
 * ============================================================
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  enableIndexedDbPersistence,
} from 'firebase/firestore';

// ─── CONFIG ──────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDCA5TswTex-3Qj2kFOXJ1S-l_0cMwuTzU",
  authDomain: "election-manager-80433.firebaseapp.com",
  projectId: "election-manager-80433",
  storageBucket: "election-manager-80433.firebasestorage.app",
  messagingSenderId: "87099817422",
  appId: "1:87099817422:web:25f43d66c1a52f6aefbf9f",
  measurementId: "G-PTRNCMYPQR"
};

// ─── INIT ─────────────────────────────────────────────────────
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// تفعيل الحفظ المحلي في Firestore (IndexedDB) — يعمل أوف لاين تلقائياً
try {
  enableIndexedDbPersistence(db).catch(() => {});
} catch {}

// ─── TYPES ───────────────────────────────────────────────────
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

export interface FirebaseSyncState {
  status: SyncStatus;
  lastSyncedAt: Date | null;
  error: string | null;
}

// ─── FIRESTORE PATH ──────────────────────────────────────────
const DOC_REF = () => doc(db, 'election_app', 'current_data');

// ─── SAVE TO FIRESTORE ────────────────────────────────────────
export async function syncToFirebase(
  data: any[],
  onStatusChange?: (status: SyncStatus, error?: string) => void
): Promise<boolean> {
  if (!navigator.onLine) {
    onStatusChange?.('offline');
    return false;
  }
  onStatusChange?.('syncing');
  try {
    await setDoc(DOC_REF(), {
      centers: data,
      updatedAt: new Date().toISOString(),
    });
    onStatusChange?.('synced');
    return true;
  } catch (err: any) {
    console.error('[Firestore] Sync failed:', err);
    onStatusChange?.('error', err?.message || 'فشل المزامنة');
    return false;
  }
}

// ─── LOAD FROM FIRESTORE ─────────────────────────────────────
export async function loadFromFirebase(
  onStatusChange?: (status: SyncStatus, error?: string) => void
): Promise<any[] | null> {
  if (!navigator.onLine) {
    onStatusChange?.('offline');
    return null;
  }
  onStatusChange?.('syncing');
  try {
    const snap = await getDoc(DOC_REF());
    if (snap.exists()) {
      const val = snap.data();
      if (Array.isArray(val?.centers) && val.centers.length > 0) {
        onStatusChange?.('synced');
        return val.centers;
      }
    }
    onStatusChange?.('synced');
    return null;
  } catch (err: any) {
    console.error('[Firestore] Load failed:', err);
    onStatusChange?.('error', err?.message || 'فشل التحميل');
    return null;
  }
}

// ─── PENDING SYNC ─────────────────────────────────────────────
const PENDING_KEY = 'firebase_pending_sync';
export const markPendingSync  = () => localStorage.setItem(PENDING_KEY, 'true');
export const clearPendingSync = () => localStorage.removeItem(PENDING_KEY);
export const hasPendingSync   = () => localStorage.getItem(PENDING_KEY) === 'true';
export const isFirebaseConfigured = () => true;
