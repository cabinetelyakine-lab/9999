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
  onSnapshot,
  enableIndexedDbPersistence,
  getDocFromServer,
} from 'firebase/firestore';
import appletConfig from '../../firebase-applet-config.json';

// ─── CONFIG ──────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || appletConfig.apiKey || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || appletConfig.appId || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || appletConfig.measurementId || '',
};

const firestoreDbId =
  import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
  appletConfig.firestoreDatabaseId ||
  '';

export const isFirebaseConfigured = () => Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

// ─── INIT ─────────────────────────────────────────────────────
let db: ReturnType<typeof getFirestore> | null = null;

if (isFirebaseConfigured()) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    // Pass named database ID if provisioned
    db = firestoreDbId ? getFirestore(app, firestoreDbId) : getFirestore(app);
    // تفعيل الحفظ المحلي في Firestore (IndexedDB) — يعمل أوف لاين تلقائياً على كل الأجهزة
    enableIndexedDbPersistence(db).catch(() => {});
  } catch (err) {
    console.warn('[Firestore] Initialization skipped or failed:', err);
  }
}

// ─── TYPES ───────────────────────────────────────────────────
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

export interface FirebaseSyncState {
  status: SyncStatus;
  lastSyncedAt: Date | null;
  error: string | null;
}

// ─── FIRESTORE PATH ──────────────────────────────────────────
const DOC_REF = () => {
  if (!db) throw new Error('Firestore not initialized');
  return doc(db, 'election_app', 'current_data');
};

// Test initial connection as required
export async function testConnection() {
  if (!db) return;
  try {
    await getDocFromServer(DOC_REF());
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firestore] Offline mode active.');
    }
  }
}
testConnection().catch(() => {});

// ─── SAVE TO FIRESTORE ────────────────────────────────────────
export async function syncToFirebase(
  data: any[],
  onStatusChange?: (status: SyncStatus, error?: string) => void
): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) {
    return false;
  }
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
  if (!isFirebaseConfigured() || !db) {
    return null;
  }
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

// ─── REAL-TIME SUBSCRIPTION (SYNC PHONE <-> PC <-> WEB) ──────
export function subscribeToFirebase(
  onData: (centers: any[], updatedAt?: string) => void,
  onError?: (errorMsg: string) => void
): () => void {
  if (!isFirebaseConfigured() || !db) return () => {};
  try {
    const unsub = onSnapshot(
      DOC_REF(),
      (snap) => {
        if (snap.exists()) {
          const val = snap.data();
          if (Array.isArray(val?.centers)) {
            onData(val.centers, val.updatedAt);
          }
        }
      },
      (err) => {
        console.warn('[Firestore] Realtime subscription error:', err);
        onError?.(err?.message || 'خطأ في الاستماع للبيانات السحابية');
      }
    );
    return unsub;
  } catch (e: any) {
    console.warn('[Firestore] Subscribe failed:', e);
    return () => {};
  }
}

// ─── PENDING SYNC ─────────────────────────────────────────────
const PENDING_KEY = 'firebase_pending_sync';
export const markPendingSync  = () => localStorage.setItem(PENDING_KEY, 'true');
export const clearPendingSync = () => localStorage.removeItem(PENDING_KEY);
export const hasPendingSync   = () => localStorage.getItem(PENDING_KEY) === 'true';

