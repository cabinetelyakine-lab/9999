import React, { useState, useEffect } from 'react';
import { Center } from '../types';
import { Building, X, Check, Trash2, Eraser, AlertTriangle, MapPin, ExternalLink, ArrowRight, Lock } from 'lucide-react';
import { normalizeMapsUrl } from '../utils/maps';

interface CenterEditModalProps {
  isOpen: boolean;
  center: Center | null;
  totalCentersCount: number;
  isSupervisor?: boolean;
  onSave: (updatedCenter: Center) => void;
  onDeleteCenter: (centerId: string) => void;
  onClearCenterStaffOnly: (centerId: string) => void;
  onClearAllCenterAndOffices: (centerId: string) => void;
  onDeleteAllOffices: (centerId: string) => void;
  onClose: () => void;
}

export const CenterEditModal: React.FC<CenterEditModalProps> = ({
  isOpen,
  center,
  totalCentersCount,
  isSupervisor = false,
  onSave,
  onDeleteCenter,
  onClearCenterStaffOnly,
  onClearAllCenterAndOffices,
  onDeleteAllOffices,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const [confirmAction, setConfirmAction] = useState<
    'clearCenterStaff' | 'clearAll' | 'deleteAllOffices' | 'deleteCenter' | null
  >(null);

  useEffect(() => {
    if (center) {
      setName(center.name);
      setCode(center.code || '');
      setAddress(center.address || '');
      setMapUrl(center.mapUrl || '');
      setConfirmAction(null);
    }
  }, [center]);

  if (!isOpen || !center) return null;

  const getComputedMapsUrl = () => {
    if (mapUrl.trim()) return mapUrl.trim();
    const parts = [name || center.name, address, 'الجزائر'].filter(Boolean);
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(' '))}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!isSupervisor) {
      alert('تعديل بيانات المركز محصور بالمشرف فقط. لتفعيل وضع المشرف، افتح خانة البحث واكتب mohamed 44000');
      return;
    }
    const cleanMapUrl = mapUrl.trim() ? normalizeMapsUrl(mapUrl.trim()) : undefined;
    onSave({
      ...center,
      name: name.trim(),
      code: code.trim(),
      address: address.trim(),
      mapUrl: cleanMapUrl,
    });
    onClose();
  };

  const handleClearCenterStaffAction = () => {
    if (!isSupervisor) {
      alert('تفريغ مؤطري المركز محصور بالمشرف فقط.');
      return;
    }
    onClearCenterStaffOnly(center.id);
    setConfirmAction(null);
    onClose();
  };

  const handleClearAllAction = () => {
    if (!isSupervisor) {
      alert('تفريغ المركز والمكاتب محصور بالمشرف فقط.');
      return;
    }
    onClearAllCenterAndOffices(center.id);
    setConfirmAction(null);
    onClose();
  };

  const handleDeleteAllOfficesAction = () => {
    if (!isSupervisor) {
      alert('حذف مكاتب المركز محصور بالمشرف فقط.');
      return;
    }
    onDeleteAllOffices(center.id);
    setConfirmAction(null);
    onClose();
  };

  const handleDeleteCenterAction = () => {
    if (!isSupervisor) {
      alert('حذف المركز محصور بالمشرف فقط.');
      return;
    }
    onDeleteCenter(center.id);
    setConfirmAction(null);
    onClose();
  };

  return (
    <div
      id="center-edit-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in"
    >
      <div
        id="center-edit-card"
        className="w-full max-w-lg bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header with Red Gradual Back Button */}
        <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              id="close-center-edit-back-btn"
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white flex items-center justify-center shadow-md border-2 border-red-300 transition-all cursor-pointer shrink-0"
              title="رجوع"
            >
              <ArrowRight className="w-4 h-4 font-black text-white" />
            </button>
            <div>
              <h2 className="text-base font-bold text-white">
                تعديل وإدارة المركز
              </h2>
              <p className="text-xs text-slate-400">{center.name}</p>
            </div>
          </div>
          <button
            id="close-center-edit-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-750 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Non-supervisor banner */}
          {!isSupervisor && (
            <div className="bg-amber-950/90 border-2 border-amber-500/80 p-3.5 rounded-xl flex items-center gap-3 text-amber-200 text-xs sm:text-sm font-bold shadow-lg">
              <Lock className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-white font-black">وضع العرض فقط (أنت لست مشرفاً)</p>
                <p className="text-amber-300 font-semibold text-xs">
                  لا يمكنك تعديل أو حذف المراكز الانتخابية. لتفعيل وضع المشرف، افتح خانة البحث واكتب{' '}
                  <span className="font-mono bg-blue-950 px-1.5 py-0.5 rounded text-amber-200 border border-amber-400 font-bold">
                    mohamed 44000
                  </span>
                </p>
              </div>
            </div>
          )}

          <fieldset disabled={!isSupervisor} className="space-y-5 contents">
          {/* Main Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white mb-1.5">
                اسم مركز الانتخاب *
              </label>
              <input
                id="edit-center-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثلاً: مدرسة العربي التبسي"
                style={{ color: '#FFFFFF' }}
                className="w-full px-4 py-3 bg-[#102a5c] border border-slate-600 rounded-xl text-xl sm:text-2xl font-black text-white !text-white placeholder:text-blue-300/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300 transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white mb-1.5">
                رمز أو رقم المركز
              </label>
              <input
                id="edit-center-code-input"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="01"
                style={{ color: '#FFFFFF' }}
                className="w-full px-4 py-3 bg-[#102a5c] border border-slate-600 rounded-xl text-xl sm:text-2xl font-black text-white !text-white placeholder:text-blue-300/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300 transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white mb-1.5">
                العنوان أو الموقع الجغرافي
              </label>
              <input
                id="edit-center-address-input"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="شارع فلسطين، وسط المدينة"
                style={{ color: '#FFFFFF' }}
                className="w-full px-4 py-3 bg-[#102a5c] border border-slate-600 rounded-xl text-xl sm:text-2xl font-black text-white !text-white placeholder:text-blue-300/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300 transition-all shadow-inner"
              />
            </div>

            <div className="bg-[#102a5c] p-3.5 rounded-xl border border-slate-600 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  رابط خرائط Google Maps (اختياري)
                </label>
                <a
                  href={getComputedMapsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-2xs font-extrabold text-cyan-300 hover:text-white flex items-center gap-1 bg-blue-900 px-2 py-1 rounded-lg border border-blue-700"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>معاينة الموقع على الخريطة</span>
                </a>
              </div>
              <input
                id="edit-center-map-url-input"
                type="url"
                value={mapUrl}
                onChange={(e) => setMapUrl(e.target.value)}
                placeholder="https://maps.google.com/..."
                style={{ color: '#FFFFFF' }}
                className="w-full px-3 py-2 bg-blue-950 border border-slate-600 rounded-lg text-sm font-bold text-white !text-white placeholder:text-blue-300/60 focus:outline-none focus:border-blue-400 transition-all font-mono"
              />
              <p className="text-3xs text-slate-400">
                إذا تركته فارغاً، فسيتم فتح الخرائط تلقائياً بالبحث عن اسم المركز وعنوانه والبلدية.
              </p>
            </div>
          </div>

          {/* Quick Bulk Operations Section */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              عمليات الحذف والتفريغ (كلي وجزئي)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Clear Center Staff Only */}
              {/* Clear Center Staff */}
              {confirmAction === 'clearCenterStaff' ? (
                <div className="p-3 bg-amber-950/80 rounded-xl border border-amber-500 space-y-2">
                  <p className="text-2xs text-amber-200 font-bold">تأكيد تفريغ مؤطري قيادة المركز؟</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClearCenterStaffAction}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-lg transition-colors"
                    >
                      نعم، فرّغ
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmAction(null)}
                      className="px-2 py-1 text-slate-300 hover:text-white text-xs"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  id="clear-center-staff-only-btn"
                  onClick={() => setConfirmAction('clearCenterStaff')}
                  className="p-3 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-between text-right transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Eraser className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>تفريغ طاقم المركز فقط</span>
                  </div>
                  <span className="text-2xs text-slate-500">حذف أسماء</span>
                </button>
              )}

              {/* Clear All Center and Offices */}
              {confirmAction === 'clearAll' ? (
                <div className="p-3 bg-amber-950/80 rounded-xl border border-amber-500 space-y-2">
                  <p className="text-2xs text-amber-200 font-bold">تأكيد تفريغ كلي لبيانات ومؤطري كافة المكاتب والمركز؟</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClearAllAction}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-lg transition-colors"
                    >
                      نعم، مسح كلي
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmAction(null)}
                      className="px-2 py-1 text-slate-300 hover:text-white text-xs"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  id="clear-all-center-offices-btn"
                  onClick={() => setConfirmAction('clearAll')}
                  className="p-3 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-between text-right transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Eraser className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>تفريغ كلي لبيانات المركز ومكاتبه</span>
                  </div>
                  <span className="text-2xs text-slate-500">مسح كلي</span>
                </button>
              )}

              {/* Delete All Offices */}
              {center.offices.length > 0 && (
                confirmAction === 'deleteAllOffices' ? (
                  <div className="p-3 bg-rose-950/90 rounded-xl border border-rose-600 space-y-2">
                    <p className="text-2xs text-rose-200 font-bold">تأكيد حذف كافة مكاتب التصويت ({center.offices.length} مكاتب)؟</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDeleteAllOfficesAction}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-lg transition-colors"
                      >
                        نعم، احذف كافة المكاتب
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmAction(null)}
                        className="px-2 py-1 text-slate-300 hover:text-white text-xs"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    id="delete-all-offices-btn"
                    onClick={() => setConfirmAction('deleteAllOffices')}
                    className="p-3 bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 text-xs font-semibold rounded-xl border border-rose-900/40 flex items-center justify-between text-right transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>حذف كافة مكاتب المركز</span>
                    </div>
                    <span className="text-2xs text-rose-400">{center.offices.length} مكاتب</span>
                  </button>
                )
              )}

              {/* Delete Entire Center */}
              {confirmAction === 'deleteCenter' ? (
                <div className="p-3 bg-rose-950/90 rounded-xl border border-rose-600 space-y-2">
                  <p className="text-2xs text-rose-200 font-bold">
                    {totalCentersCount <= 1
                      ? 'تأكيد حذف وتفريغ بيانات هذا المركز بالكامل؟'
                      : 'تأكيد حذف هذا المركز نهائياً بما فيه من مكاتب ومؤطرين؟'}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="confirm-delete-center-btn"
                      onClick={handleDeleteCenterAction}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-lg transition-colors cursor-pointer"
                    >
                      نعم، احذف المركز
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmAction(null)}
                      className="px-2 py-1 text-slate-300 hover:text-white text-xs cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  id="delete-center-completely-btn"
                  onClick={() => setConfirmAction('deleteCenter')}
                  className="p-3 text-xs font-semibold rounded-xl border flex items-center justify-between text-right transition-colors bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border-rose-800/60 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>حذف المركز نهائياً</span>
                  </div>
                  <span className="text-2xs text-rose-400">
                    {totalCentersCount <= 1 ? 'حذف / إعادة ضبط' : 'حذف فردي للمركز'}
                  </span>
                </button>
              )}
            </div>
          </div>
          </fieldset>

          {/* Footer Save */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              إغلاق
            </button>
            <button
              type="submit"
              id="save-center-details-btn"
              disabled={!isSupervisor}
              className={`px-6 py-2.5 text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2 ${
                isSupervisor
                  ? 'text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer active:scale-95'
                  : 'text-slate-400 bg-slate-800 border border-slate-700 cursor-not-allowed opacity-75'
              }`}
              title={!isSupervisor ? 'خاص بالمشرف فقط' : 'حفظ التعديلات'}
            >
              {isSupervisor ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>حفظ التعديلات</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>الحفظ متاح للمشرف فقط</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
