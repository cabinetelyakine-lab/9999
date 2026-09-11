import React, { useState, useEffect } from 'react';
import { Office, OfficeGender } from '../types';
import { Vote, X, Check, Trash2, Eraser, Plus, UserPlus, UserCheck, ArrowRight, Lock } from 'lucide-react';

interface OfficeEditModalProps {
  isOpen: boolean;
  office: Office | null;
  isSupervisor?: boolean;
  onSave: (updatedOffice: Office) => void;
  onDeleteOffice: (officeId: string) => void;
  onClearOfficeStaff: (officeId: string) => void;
  onAddCustomRole: (officeId: string, roleName: string) => void;
  onClose: () => void;
}

export const OfficeEditModal: React.FC<OfficeEditModalProps> = ({
  isOpen,
  office,
  isSupervisor = false,
  onSave,
  onDeleteOffice,
  onClearOfficeStaff,
  onAddCustomRole,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [numberStr, setNumberStr] = useState('1');
  const [gender, setGender] = useState<OfficeGender>('H');
  const [newRoleName, setNewRoleName] = useState('');
  const [showAddRoleInput, setShowAddRoleInput] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'delete' | 'clear' | null>(null);

  useEffect(() => {
    if (office) {
      setName(office.name);
      setNumberStr(String(office.number));
      setGender(office.gender || (office.number % 2 === 1 ? 'H' : 'F'));
      setShowAddRoleInput(false);
      setNewRoleName('');
      setConfirmAction(null);
    }
  }, [office]);

  if (!isOpen || !office) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!isSupervisor) {
      alert('تعديل المكتب محصور بالمشرف فقط. لتفعيل وضع المشرف، افتح خانة البحث واكتب mohamed 44000');
      return;
    }
    const parsedNumber = parseInt(numberStr, 10);
    const finalNumber =
      !isNaN(parsedNumber) && parsedNumber > 0 ? parsedNumber : office.number;
    onSave({
      ...office,
      name: name.trim(),
      number: finalNumber,
      gender,
    });
    onClose();
  };

  const handleAddRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    if (!isSupervisor) {
      alert('إضافة منصب محصور بالمشرف فقط.');
      return;
    }
    onAddCustomRole(office.id, newRoleName.trim());
    setNewRoleName('');
    setShowAddRoleInput(false);
  };

  const handleClearOfficeStaffAction = () => {
    if (!isSupervisor) {
      alert('تفريغ مؤطري المكتب محصور بالمشرف فقط.');
      return;
    }
    onClearOfficeStaff(office.id);
    onClose();
  };

  const handleDeleteOfficeAction = () => {
    if (!isSupervisor) {
      alert('حذف مكتب التصويت محصور بالمشرف فقط.');
      return;
    }
    onDeleteOffice(office.id);
    onClose();
  };

  return (
    <div
      id="office-edit-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in"
    >
      <div
        id="office-edit-card"
        className="w-full max-w-lg bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header with Red Gradual Back Button */}
        <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              id="close-office-edit-back-btn"
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white flex items-center justify-center shadow-md border-2 border-red-300 transition-all cursor-pointer shrink-0"
              title="رجوع"
            >
              <ArrowRight className="w-4 h-4 font-black text-white" />
            </button>
            <div>
              <h2 className="text-base font-bold text-white">
                تعديل وإدارة مكتب التصويت
              </h2>
              <p className="text-xs text-slate-400">{office.name}</p>
            </div>
          </div>
          <button
            id="close-office-edit-btn"
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
                  لا يمكنك تعديل أو حذف مكاتب التصويت. لتفعيل وضع المشرف، افتح خانة البحث واكتب{' '}
                  <span className="font-mono bg-blue-950 px-1.5 py-0.5 rounded text-amber-200 border border-amber-400 font-bold">
                    mohamed 44000
                  </span>
                </p>
              </div>
            </div>
          )}

          <fieldset disabled={!isSupervisor} className="space-y-5 contents">
          {/* Main Info */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-bold text-white mb-1.5">
                رقم المكتب *
              </label>
              <input
                id="edit-office-number-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                value={numberStr}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d+$/.test(val)) {
                    setNumberStr(val);
                  }
                }}
                style={{ color: '#FFFFFF' }}
                className="w-full px-4 py-3 bg-[#102a5c] border border-slate-600 rounded-xl text-xl sm:text-2xl font-black text-white !text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300 transition-all text-center shadow-inner"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-white mb-1.5">
                اسم مكتب التصويت *
              </label>
              <input
                id="edit-office-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مكتب تصويت رقم 01"
                style={{ color: '#FFFFFF' }}
                className="w-full px-4 py-3 bg-[#102a5c] border border-slate-600 rounded-xl text-xl sm:text-2xl font-black text-white !text-white placeholder:text-blue-300/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300 transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Gender / Category: H (رجال) or F (نساء) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              نوع وفئة المكتب (خاص بالرجال H أو بالنساء F) *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGender('H')}
                className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
                  gender === 'H'
                    ? 'bg-blue-600/20 border-blue-500 text-white ring-2 ring-blue-500/30'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-blue-500/30 text-blue-300 flex items-center justify-center font-black text-sm">
                      H
                    </span>
                    <span className="font-extrabold text-sm text-blue-300">خاص بالرجال</span>
                  </div>
                  <p className="text-2xs text-slate-400 mt-1">Hommes - مكتب تصويت رجالي</p>
                </div>
                {gender === 'H' && <Check className="w-5 h-5 text-blue-400" />}
              </button>

              <button
                type="button"
                onClick={() => setGender('F')}
                className={`p-3 rounded-xl border-2 text-right transition-all flex items-center justify-between ${
                  gender === 'F'
                    ? 'bg-gradient-to-r from-pink-900/60 to-rose-900/60 border-pink-400 text-white ring-2 ring-pink-500/30'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-pink-400/50'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-pink-600 text-white flex items-center justify-center font-black text-sm border border-pink-300">
                      F
                    </span>
                    <span className="font-extrabold text-sm text-pink-300">خاص بالنساء</span>
                  </div>
                  <p className="text-2xs text-pink-200/80 mt-1">Femmes - مكتب تصويت نسائي</p>
                </div>
                {gender === 'F' && <Check className="w-5 h-5 text-pink-400" />}
              </button>
            </div>
          </div>

          {/* Add custom role to office */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-blue-400" />
                المناصب في هذا المكتب ({office.staff.length} مناصب)
              </span>

              {!showAddRoleInput && (
                <button
                  type="button"
                  onClick={() => setShowAddRoleInput(true)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة منصب إضافي للمكتب</span>
                </button>
              )}
            </div>

            {showAddRoleInput && (
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
                <label className="block text-2xs font-semibold text-slate-300">
                  اسم المنصب الجديد
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="مثلاً: إضافي ثالث، مرشد..."
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddRoleSubmit}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    إضافة
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddRoleInput(false)}
                    className="px-2 py-2 text-slate-400 hover:text-white text-xs transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions (Clear vs Delete) */}
          <div className="pt-3 border-t border-slate-800 space-y-2.5">
            <h3 className="text-xs font-bold text-amber-400">
              خيارات الحذف والتفريغ لهذا المكتب
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Clear office staff */}
              {confirmAction === 'clear' ? (
                <div className="p-3 bg-amber-950/80 rounded-xl border border-amber-500 space-y-2">
                  <p className="text-2xs text-amber-200 font-bold">تأكيد تفريغ كافة مؤطري هذا المكتب؟</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClearOfficeStaffAction}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-lg transition-colors"
                    >
                      نعم، فرّغ الأسماء
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
                  id="clear-office-staff-btn"
                  onClick={() => setConfirmAction('clear')}
                  className="p-3 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-between text-right transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Eraser className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>تفريغ مؤطري المكتب</span>
                  </div>
                  <span className="text-2xs text-slate-500">مسح الأسماء</span>
                </button>
              )}

              {/* Delete office */}
              {confirmAction === 'delete' ? (
                <div className="p-3 bg-rose-950/90 rounded-xl border border-rose-600 space-y-2">
                  <p className="text-2xs text-rose-200 font-bold">تأكيد حذف هذا المكتب نهائياً؟</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDeleteOfficeAction}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-lg transition-colors"
                    >
                      نعم، احذف المكتب
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
                  id="delete-single-office-btn"
                  onClick={() => setConfirmAction('delete')}
                  className="p-3 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 text-xs font-semibold rounded-xl border border-rose-800/60 flex items-center justify-between text-right transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>حذف هذا المكتب</span>
                  </div>
                  <span className="text-2xs text-rose-400">حذف فردي</span>
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
              id="save-office-details-btn"
              disabled={!isSupervisor}
              className={`px-6 py-2.5 text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2 ${
                isSupervisor
                  ? 'text-white bg-blue-600 hover:bg-blue-700 cursor-pointer active:scale-95'
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
