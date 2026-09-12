/**
 * FirebaseSyncIndicator.tsx
 * ============================================================
 * Visual indicator showing Firebase sync status.
 * Shows: syncing spinner | synced checkmark | offline icon | error icon
 * ============================================================
 */

import React, { useState } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle, AlertCircle, Wifi, WifiOff, X } from 'lucide-react';
import type { FirebaseSyncState } from '../utils/firebase';
import { isFirebaseConfigured } from '../utils/firebase';

interface Props {
  syncState: FirebaseSyncState;
  onManualSync?: () => void;
}

export function FirebaseSyncIndicator({ syncState, onManualSync }: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const configured = isFirebaseConfigured();

  // Don't show anything if Firebase isn't configured
  if (!configured) {
    return (
      <button
        onClick={() => setShowDetails((v) => !v)}
        className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-900/40 border border-amber-600/50 text-amber-300 text-xs font-semibold transition-all hover:bg-amber-900/60"
        title="Firebase غير مُهيأ"
      >
        <Cloud className="w-3.5 h-3.5 opacity-50" />
        <span className="hidden sm:inline">غير مُهيأ</span>

        {showDetails && (
          <div className="absolute top-full mt-2 left-0 z-50 w-72 bg-slate-800 border border-amber-600/50 rounded-xl p-4 shadow-2xl text-right" dir="rtl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-amber-300 font-bold text-sm">إعداد Firebase</span>
              <button onClick={(e) => { e.stopPropagation(); setShowDetails(false); }} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed mb-3">
              لتفعيل المزامنة السحابية، أنشئ ملف <code className="bg-slate-700 px-1 rounded">.env</code> في جذر المشروع وأضف إعدادات Firebase:
            </p>
            <pre className="bg-slate-900 rounded-lg p-2 text-2xs text-emerald-300 overflow-x-auto leading-relaxed">
{`VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_DATABASE_URL=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_APP_ID=xxx`}
            </pre>
            <p className="text-slate-400 text-2xs mt-2">
              احصل على هذه القيم من: Firebase Console → Project Settings → Your Apps
            </p>
          </div>
        )}
      </button>
    );
  }

  const { status, lastSyncedAt, error } = syncState;

  const config = {
    idle: {
      icon: <Cloud className="w-3.5 h-3.5" />,
      label: 'سحابي',
      classes: 'bg-slate-700/60 border-slate-600/50 text-slate-300',
    },
    syncing: {
      icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />,
      label: 'جاري المزامنة...',
      classes: 'bg-blue-900/40 border-blue-500/50 text-blue-300',
    },
    synced: {
      icon: <CheckCircle className="w-3.5 h-3.5" />,
      label: 'مُزامَن',
      classes: 'bg-emerald-900/40 border-emerald-500/50 text-emerald-300',
    },
    offline: {
      icon: <WifiOff className="w-3.5 h-3.5" />,
      label: 'بدون إنترنت',
      classes: 'bg-amber-900/40 border-amber-600/50 text-amber-300',
    },
    error: {
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      label: 'خطأ في المزامنة',
      classes: 'bg-red-900/40 border-red-600/50 text-red-300',
    },
  };

  const cfg = config[status];

  return (
    <div className="relative print:hidden no-print">
      <button
        onClick={() => setShowDetails((v) => !v)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:opacity-80 ${cfg.classes}`}
        title="حالة المزامنة مع Firebase"
      >
        {cfg.icon}
        <span className="hidden sm:inline">{cfg.label}</span>
      </button>

      {showDetails && (
        <div
          className="absolute top-full mt-2 right-0 z-50 w-72 bg-slate-800 border border-slate-600 rounded-xl p-4 shadow-2xl text-right"
          dir="rtl"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-emerald-400" />
              <span className="text-white font-bold text-sm">حالة المزامنة السحابية</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setShowDetails(false); }}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status row */}
          <div className={`flex items-center gap-2 p-2.5 rounded-lg mb-3 ${cfg.classes} border`}>
            {cfg.icon}
            <span className="font-semibold text-xs">{cfg.label}</span>
          </div>

          {/* Last synced */}
          {lastSyncedAt && (
            <p className="text-slate-400 text-xs mb-3">
              آخر مزامنة: {lastSyncedAt.toLocaleTimeString('ar-DZ')}
            </p>
          )}

          {/* Error message */}
          {error && (
            <p className="text-red-300 text-xs mb-3 bg-red-950/50 p-2 rounded-lg">{error}</p>
          )}

          {/* Offline notice */}
          {status === 'offline' && (
            <p className="text-amber-300 text-xs mb-3 leading-relaxed">
              البيانات محفوظة محلياً. ستتم المزامنة تلقائياً عند اتصال الإنترنت.
            </p>
          )}

          {/* Manual sync button */}
          {status !== 'syncing' && status !== 'offline' && onManualSync && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(false);
                onManualSync();
              }}
              className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              مزامنة الآن
            </button>
          )}

          <p className="text-slate-500 text-2xs mt-3 leading-relaxed">
            البيانات تُحفظ تلقائياً على جهازك دائماً، والمزامنة السحابية تحدث تلقائياً عند توفر الإنترنت.
          </p>
        </div>
      )}
    </div>
  );
}
