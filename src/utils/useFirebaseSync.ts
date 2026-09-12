/**
 * useFirebaseSync.ts
 * ============================================================
 * React hook that manages Firebase sync state.
 * - Debounces writes to avoid too many Firebase calls.
 * - Listens for online/offline events.
 * - Queues pending syncs when offline.
 * ============================================================
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  syncToFirebase,
  loadFromFirebase,
  subscribeToFirebase,
  markPendingSync,
  clearPendingSync,
  hasPendingSync,
  isFirebaseConfigured,
  type SyncStatus,
  type FirebaseSyncState,
} from './firebase';
import type { Center } from '../types';

const DEBOUNCE_MS = 2000; // Wait 2s after last local change before uploading
const STORAGE_KEY = 'electoral_staffing_data_v7_empty_staff';

export function useFirebaseSync(
  centers: Center[],
  onCentersLoaded: (centers: Center[]) => void
) {
  const [syncState, setSyncState] = useState<FirebaseSyncState>({
    status: 'idle',
    lastSyncedAt: null,
    error: null,
  });

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);
  const lastSyncedData = useRef<string>('');
  const centersRef = useRef<Center[]>(centers);

  useEffect(() => {
    centersRef.current = centers;
  }, [centers]);

  const updateStatus = useCallback((status: SyncStatus, error?: string) => {
    setSyncState((prev) => ({
      ...prev,
      status,
      error: error || null,
      lastSyncedAt: status === 'synced' ? new Date() : prev.lastSyncedAt,
    }));
  }, []);

  // Real-time synchronization & Initial data load
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      updateStatus('error', 'Firebase غير مهيأ');
      return;
    }

    if (!navigator.onLine) {
      updateStatus('offline');
    } else {
      updateStatus('syncing');
    }

    // Subscribe to real-time changes across all devices (PC exe, Mobile App, Web)
    const unsubscribe = subscribeToFirebase(
      (remoteCenters) => {
        if (remoteCenters && Array.isArray(remoteCenters) && remoteCenters.length > 0) {
          const remoteSerialized = JSON.stringify(remoteCenters);
          // Only apply if different from our last synced snapshot
          if (remoteSerialized !== lastSyncedData.current) {
            lastSyncedData.current = remoteSerialized;
            onCentersLoaded(remoteCenters);
            try {
              localStorage.setItem(STORAGE_KEY, remoteSerialized);
            } catch {
              // ignore storage errors
            }
          }
          updateStatus('synced');
          clearPendingSync();
        } else {
          // If remote document is empty, push local data to populate Firebase
          const currentLocal = centersRef.current;
          if (currentLocal && currentLocal.length > 0) {
            syncToFirebase(currentLocal, updateStatus).then((ok) => {
              if (ok) {
                lastSyncedData.current = JSON.stringify(currentLocal);
                clearPendingSync();
              }
            });
          } else {
            updateStatus('synced');
          }
        }
      },
      (errorMsg) => {
        if (!navigator.onLine) {
          updateStatus('offline');
        } else {
          updateStatus('error', errorMsg);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced sync whenever centers change
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }

    if (!isFirebaseConfigured()) return;

    const serialized = JSON.stringify(centers);

    // Don't re-sync data we just received from Firebase
    if (serialized === lastSyncedData.current) return;

    // Cancel previous pending debounce
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!navigator.onLine) {
      // Mark pending for when we come back online
      markPendingSync();
      updateStatus('offline');
      return;
    }

    updateStatus('syncing');

    debounceTimer.current = setTimeout(async () => {
      const success = await syncToFirebase(centers, updateStatus);
      if (success) {
        lastSyncedData.current = serialized;
        clearPendingSync();
      } else if (!navigator.onLine) {
        markPendingSync();
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [centers, updateStatus]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = async () => {
      updateStatus('syncing');
      if (hasPendingSync()) {
        // Sync the latest local data to Firebase
        const localRaw = localStorage.getItem('electoral_staffing_data_v7_empty_staff');
        if (localRaw) {
          try {
            const localData = JSON.parse(localRaw);
            const success = await syncToFirebase(localData, updateStatus);
            if (success) clearPendingSync();
          } catch {
            updateStatus('error', 'فشل المزامنة عند العودة للإنترنت');
          }
        }
      } else {
        updateStatus('synced');
      }
    };

    const handleOffline = () => {
      updateStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updateStatus]);

  // Manual sync trigger
  const manualSync = useCallback(async (currentCenters: Center[]) => {
    if (!navigator.onLine) {
      updateStatus('offline');
      return;
    }
    const success = await syncToFirebase(currentCenters, updateStatus);
    if (success) {
      lastSyncedData.current = JSON.stringify(currentCenters);
      clearPendingSync();
    }
  }, [updateStatus]);

  return { syncState, manualSync };
}
