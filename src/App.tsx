import React, { useState, useEffect, useCallback } from 'react';
import { AppView, Center, sortOfficesMenFirst } from './types';
import { INITIAL_CENTERS, createDefaultCenter, ALGERIAN_VOTER_CARD_IMG, clearAllStaffNamesFromCenters } from './data/initialData';
import { HomeScreen } from './components/HomeScreen';
import { StaffingView } from './components/StaffingView';
import { SearchView } from './components/SearchView';
import { StaffTableView } from './components/StaffTableView';
import { Download, Upload, RotateCcw, Database, ArrowRight, X, Trash2, UserX, ShieldCheck, Lock, Cloud } from 'lucide-react';
import { getSupervisorStatus, setSupervisorStatus } from './utils/security';
import { useFirebaseSync } from './utils/useFirebaseSync';
import { FirebaseSyncIndicator } from './components/FirebaseSyncIndicator';

const STORAGE_KEY = 'electoral_staffing_data_v7_empty_staff';
const PREV_STORAGE_KEYS = [
  'electoral_staffing_data_v5_clean_dates',
  'electoral_staffing_data_v4',
  'electoral_staffing_data_v3',
];

// Sanitize legacy roles and images
function sanitizeCentersData(centersList: Center[]): Center[] {
  return centersList.map((c) => ({
    ...c,
    imageUrl:
      c.imageUrl && (c.imageUrl.startsWith('data:') || c.imageUrl.startsWith('blob:'))
        ? c.imageUrl
        : ALGERIAN_VOTER_CARD_IMG,
    offices: sortOfficesMenFirst(
      (c.offices || []).map((o) => ({
        ...o,
        staff: (o.staff || []).map((s) => ({
          ...s,
          role:
            s.role === 'مساعد رئيس مكتب' || s.role === 'مساعد رئيس المكتب'
              ? 'نائب رئيس مكتب'
              : s.role,
        })),
      }))
    ),
  }));
}

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(() => {
    const savedView = (sessionStorage.getItem('app_current_view') || localStorage.getItem('app_current_view')) as AppView | null;
    if (savedView && ['home', 'staffing', 'search', 'staff_table'].includes(savedView)) {
      return savedView;
    }
    return 'home';
  });
  const [searchInitialCenterId, setSearchInitialCenterId] = useState<string | undefined>(undefined);
  const [staffingInitialCenterId, setStaffingInitialCenterId] = useState<string | null>(null);
  const [staffTableInitialCenterId, setStaffTableInitialCenterId] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsConfirmAction, setSettingsConfirmAction] = useState<'resetSample' | 'resetEmpty' | 'deleteAllOfficesAllCenters' | 'clearAllStaffNames' | null>(null);
  const [importNotification, setImportNotification] = useState<string | null>(null);

  // Global Supervisor Mode State (Restricts modifying or deleting program data to supervisor)
  const [isSupervisor, setIsSupervisor] = useState<boolean>(() => getSupervisorStatus());

  const handleSetSupervisor = (status: boolean) => {
    setIsSupervisor(status);
    setSupervisorStatus(status);
  };

  // Sync currentView with sessionStorage & localStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('app_current_view', currentView);
      localStorage.setItem('app_current_view', currentView);
    } catch {
      // ignore
    }
  }, [currentView]);

  // Initialize centers from localStorage with empty offices and no default dummy names
  const [centers, setCenters] = useState<Center[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return sanitizeCentersData(parsed);
        }
      }

      // Check older storage versions and strip all sample names
      for (const oldKey of PREV_STORAGE_KEYS) {
        const oldSaved = localStorage.getItem(oldKey);
        if (oldSaved) {
          const parsed = JSON.parse(oldSaved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const cleaned = clearAllStaffNamesFromCenters(sanitizeCentersData(parsed));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
            return cleaned;
          }
        }
      }
    } catch (err) {
      console.error('Failed to load from storage:', err);
    }
    // Default 15 centers with 0 offices ready for user registration
    const freshCenters = INITIAL_CENTERS.map((c) => ({
      ...c,
      offices: [],
    }));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(freshCenters));
    } catch {
      // ignore
    }
    return freshCenters;
  });

  // Save to localStorage automatically on update
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(centers));
    } catch (err) {
      console.error('Failed to save to storage:', err);
    }
  }, [centers]);

  // ── Firebase Sync ──────────────────────────────────────────────────────────
  // Callback to load data from Firebase into local state (on first connect)
  const handleFirebaseDataLoaded = useCallback(
    (firebaseCenters: Center[]) => {
      setCenters(sanitizeCentersData(firebaseCenters));
    },
    []
  );

  const { syncState, manualSync } = useFirebaseSync(centers, handleFirebaseDataLoaded);
  // ──────────────────────────────────────────────────────────────────────────

  // Overall counts for display
  const totalCenters = centers.length;
  const totalOffices = centers.reduce((acc, c) => acc + c.offices.length, 0);
  const totalMembers = centers.reduce(
    (acc, c) =>
      acc +
      c.centerStaff.filter((m) => m.firstName || m.lastName).length +
      c.offices.reduce(
        (oAcc, off) =>
          oAcc + off.staff.filter((m) => m.firstName || m.lastName).length,
        0
      ),
    0
  );

  // Backup / Export JSON
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(centers, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `نسخة_احتياطية_التأطير_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSupervisor) {
      setImportNotification('استيراد وتعديل بيانات البرنامج محصور بالمشرف فقط. لتفعيل وضع المشرف، اكتب mohamed 44000 في البحث.');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCenters(sanitizeCentersData(parsed));
          setImportNotification('تم استيراد البيانات بنجاح.');
          setTimeout(() => {
            setShowSettingsModal(false);
            setImportNotification(null);
          }, 1200);
        } else {
          setImportNotification('الملف المحدد لا يحتوي على بيانات صالحة.');
        }
      } catch (err) {
        setImportNotification('حدث خطأ أثناء قراءة ملف النسخة الاحتياطية.');
      }
    };
    reader.readAsText(file);
  };

  // Reset to clean 15 electoral centers with empty staff
  const handleResetSampleData = () => {
    if (!isSupervisor) {
      alert('تعديل وتغيير بيانات البرنامج محصور بالمشرف فقط.\nلتفعيل وضع المشرف، انتقل إلى خانة البحث واكتب mohamed 44000');
      setSettingsConfirmAction(null);
      return;
    }
    setCenters(INITIAL_CENTERS.map((c) => ({ ...c, offices: [] })));
    setSettingsConfirmAction(null);
    setShowSettingsModal(false);
  };

  // Clear all staff names from centers and offices
  const handleClearAllStaffNames = () => {
    if (!isSupervisor) {
      alert('تعديل وتغيير بيانات البرنامج محصور بالمشرف فقط.\nلتفعيل وضع المشرف، انتقل إلى خانة البحث واكتب mohamed 44000');
      setSettingsConfirmAction(null);
      return;
    }
    setCenters((prev) => clearAllStaffNamesFromCenters(prev));
    setSettingsConfirmAction(null);
    setShowSettingsModal(false);
  };

  // Delete all offices across all centers
  const handleDeleteAllOfficesAllCenters = () => {
    if (!isSupervisor) {
      alert('تعديل وتغيير بيانات البرنامج محصور بالمشرف فقط.\nلتفعيل وضع المشرف، انتقل إلى خانة البحث واكتب mohamed 44000');
      setSettingsConfirmAction(null);
      return;
    }
    setCenters((prev) => prev.map((c) => ({ ...c, offices: [] })));
    setSettingsConfirmAction(null);
    setShowSettingsModal(false);
  };

  // Start with a clean empty center
  const handleResetEmptyData = () => {
    if (!isSupervisor) {
      alert('تعديل وتغيير بيانات البرنامج محصور بالمشرف فقط.\nلتفعيل وضع المشرف، انتقل إلى خانة البحث واكتب mohamed 44000');
      setSettingsConfirmAction(null);
      return;
    }
    const emptyCenter = createDefaultCenter('مركز انتخابي رقم 01', '01');
    setCenters([emptyCenter]);
    setSettingsConfirmAction(null);
    setShowSettingsModal(false);
  };

  return (
    <div className="min-h-screen bg-[#7fa534] text-slate-100 font-sans antialiased relative selection:bg-amber-400 selection:text-slate-950">

      {/* ── Firebase Sync Indicator (floating top-left) ─────────────────── */}
      <div className="fixed top-3 left-3 z-40">
        <FirebaseSyncIndicator
          syncState={syncState}
          onManualSync={() => manualSync(centers)}
        />
      </div>

      {/* View router */}
      {currentView === 'home' && (
        <>
          <HomeScreen
            onNavigate={(view) => {
              setSearchInitialCenterId(undefined);
              setStaffingInitialCenterId(null);
              setCurrentView(view);
            }}
            totalCenters={totalCenters}
            totalOffices={totalOffices}
            totalMembers={totalMembers}
          />
        </>
      )}

      {currentView === 'staffing' && (
        <StaffingView
          centers={centers}
          onUpdateCenters={setCenters}
          onBackToHome={() => {
            setStaffingInitialCenterId(null);
            setCurrentView('home');
          }}
          onNavigateToSearch={(centerId) => {
            setSearchInitialCenterId(centerId);
            setCurrentView('search');
          }}
          onNavigateToStaffTable={(centerId) => {
            setStaffTableInitialCenterId(centerId || null);
            setCurrentView('staff_table');
          }}
          initialCenterId={staffingInitialCenterId}
          isSupervisor={isSupervisor}
          onSetSupervisor={handleSetSupervisor}
        />
      )}

      {currentView === 'search' && (
        <SearchView
          centers={centers}
          onUpdateCenters={setCenters}
          onBackToHome={() => setCurrentView('home')}
          onNavigateToStaffing={(centerId) => {
            setStaffingInitialCenterId(centerId || null);
            setCurrentView('staffing');
          }}
          onNavigateToStaffTable={(centerId) => {
            setStaffTableInitialCenterId(centerId || null);
            setCurrentView('staff_table');
          }}
          initialCenterId={searchInitialCenterId}
          isSupervisor={isSupervisor}
          onSetSupervisor={handleSetSupervisor}
        />
      )}

      {currentView === 'staff_table' && (
        <StaffTableView
          centers={centers}
          onUpdateCenters={setCenters}
          onBack={() => {
            if (staffTableInitialCenterId) {
              setStaffingInitialCenterId(staffTableInitialCenterId);
              setCurrentView('staffing');
            } else {
              setCurrentView('staffing');
            }
          }}
          initialCenterId={staffTableInitialCenterId}
          isSupervisor={isSupervisor}
          onSetSupervisor={handleSetSupervisor}
        />
      )}

      {/* Data Backup & Settings Modal */}
      {showSettingsModal && (
        <div
          id="backup-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-slate-800 text-slate-100 w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-700 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <button
                  id="close-settings-back-btn"
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white flex items-center justify-center shadow-md border-2 border-red-300 transition-all cursor-pointer shrink-0"
                  title="رجوع"
                >
                  <ArrowRight className="w-4 h-4 font-black text-white" />
                </button>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  إدارة البيانات والنسخ الاحتياطي
                </h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-750 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              تُحفظ جميع بيانات التأطير والمؤطرين تلقائياً على جهازك. يمكنك تحميل نسخة احتياطية أو استيرادها لاستخدامها على أي هاتف أو حاسوب آخر.
            </p>

            {/* Firebase Sync Status in modal */}
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200">المزامنة السحابية (Firebase)</span>
                </div>
                <FirebaseSyncIndicator
                  syncState={syncState}
                  onManualSync={() => manualSync(centers)}
                />
              </div>
              <p className="text-2xs text-slate-400 leading-relaxed">
                البيانات تُحفظ أولاً على جهازك (أوف لاين)، ثم تُزامَن تلقائياً مع قاعدة بيانات Firebase عند توفر الإنترنت.
                {syncState.lastSyncedAt && (
                  <span className="block mt-1 text-emerald-400">
                    آخر مزامنة: {syncState.lastSyncedAt.toLocaleString('ar-DZ')}
                  </span>
                )}
              </p>
            </div>

            {/* Supervisor Status Indicator */}
            {isSupervisor ? (
              <div className="flex items-center justify-between p-2.5 bg-emerald-950/80 border border-emerald-500/80 rounded-xl text-emerald-200 text-xs font-bold">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>وضع المشرف مفعّل (صلاحيات التعديل كاملة)</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSetSupervisor(false)}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-lg text-2xs font-black transition-all cursor-pointer shadow-sm"
                  title="تسجيل الخروج من وضع المشرف"
                >
                  خروج المشرف
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2.5 bg-amber-950/40 border border-amber-500/50 rounded-xl text-amber-200 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>وضع العرض فقط (غير مشرف).</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsModal(false);
                    setCurrentView('search');
                  }}
                  className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-2xs cursor-pointer"
                >
                  تفعيل المشرف
                </button>
              </div>
            )}

            <div className="space-y-2.5">
              {/* Export JSON */}
              <button
                onClick={handleExportJSON}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-750 text-slate-200 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-between border border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>تصدير نسخة احتياطية (JSON)</span>
                </div>
                <span className="text-2xs text-slate-400">حفظ ملف</span>
              </button>

              {/* Import JSON */}
              <label className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-750 text-slate-200 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-between border border-slate-700 transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-400" />
                  <span>استيراد نسخة احتياطية</span>
                </div>
                <span className="text-2xs text-slate-400">تحميل ملف</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>

              {/* Import Feedback */}
              {importNotification && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500 rounded-xl text-emerald-200 text-xs font-bold">
                  {importNotification}
                </div>
              )}

              {/* Clear all staff names (حذف كافة الأسماء الافتراضية) */}
              {settingsConfirmAction === 'clearAllStaffNames' ? (
                <div className="p-3.5 bg-rose-950/90 rounded-xl border border-rose-600 space-y-2.5">
                  <p className="text-xs text-rose-200 font-bold">
                    هل أنت متأكد من حذف وتفريغ كافة أسماء المؤطرين الافتراضية؟ (سيتم تفريغ الأسماء مع بقاء هياكل المراكز)
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClearAllStaffNames}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-lg transition-colors"
                    >
                      نعم، احذف كافة الأسماء
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsConfirmAction(null)}
                      className="px-2.5 py-1.5 text-slate-300 hover:text-white text-xs font-semibold"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSettingsConfirmAction('clearAllStaffNames')}
                  className="w-full py-2.5 px-4 bg-rose-950/40 hover:bg-rose-950/60 text-rose-200 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-between border border-rose-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <UserX className="w-4 h-4 text-rose-400" />
                    <span>حذف وتفريغ كافة الأسماء الافتراضية</span>
                  </div>
                  <span className="text-2xs text-rose-400">تفريغ الأسماء</span>
                </button>
              )}

              {/* Reset to clean 15 electoral centers */}
              {settingsConfirmAction === 'resetSample' ? (
                <div className="p-3.5 bg-amber-950/90 rounded-xl border border-amber-500 space-y-2.5">
                  <p className="text-xs text-amber-200 font-bold">
                    هل أنت متأكد من استعادة المراكز الـ 15 الرسمية بدون أسماء مسبقة؟
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetSampleData}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-lg transition-colors"
                    >
                      نعم، استعد المراكز
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsConfirmAction(null)}
                      className="px-2.5 py-1.5 text-slate-300 hover:text-white text-xs font-semibold"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSettingsConfirmAction('resetSample')}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-750 text-slate-300 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-between border border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-amber-400" />
                    <span>استعادة المراكز الـ 15 الرسمية (جاهزة للتسجيل)</span>
                  </div>
                  <span className="text-2xs text-slate-400">إعادة تعيين</span>
                </button>
              )}

              {/* Delete all offices across all centers */}
              {settingsConfirmAction === 'deleteAllOfficesAllCenters' ? (
                <div className="p-3.5 bg-rose-950/90 rounded-xl border border-rose-600 space-y-2.5">
                  <p className="text-xs text-rose-200 font-bold">
                    هل أنت متأكد من حذف كافة مكاتب التصويت من جميع المراكز لإعادة تسجيلها؟
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDeleteAllOfficesAllCenters}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-lg transition-colors"
                    >
                      نعم، احذف كل المكاتب
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsConfirmAction(null)}
                      className="px-2.5 py-1.5 text-slate-300 hover:text-white text-xs font-semibold"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSettingsConfirmAction('deleteAllOfficesAllCenters')}
                  className="w-full py-2.5 px-4 bg-rose-950/40 hover:bg-rose-950/60 text-rose-300 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-between border border-rose-800/60 transition-colors"
                >
                  <span>حذف كافة مكاتب التصويت من جميع المراكز</span>
                  <span className="text-2xs text-rose-400">تفريغ كل المكاتب</span>
                </button>
              )}

              {/* Blank slate */}
              {settingsConfirmAction === 'resetEmpty' ? (
                <div className="p-3.5 bg-rose-950/90 rounded-xl border border-rose-600 space-y-2.5">
                  <p className="text-xs text-rose-200 font-bold">
                    هل أنت متأكد من مسح كافة المراكز وبدء جدول فارغ جديد؟
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetEmptyData}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-lg transition-colors"
                    >
                      نعم، ابدأ جدولاً فارغاً
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsConfirmAction(null)}
                      className="px-2.5 py-1.5 text-slate-300 hover:text-white text-xs font-semibold"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSettingsConfirmAction('resetEmpty')}
                  className="w-full py-2.5 px-4 bg-rose-950/30 hover:bg-rose-950/50 text-rose-300 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-between border border-rose-900/50 transition-colors"
                >
                  <span>تفريغ وبدء جدول فارغ جديد</span>
                  <span className="text-2xs text-rose-400">مركز جديد فارغ</span>
                </button>
              )}
            </div>

            <div className="pt-3 border-t border-slate-700 flex justify-end">
              <button
                onClick={() => {
                  setSettingsConfirmAction(null);
                  setShowSettingsModal(false);
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
