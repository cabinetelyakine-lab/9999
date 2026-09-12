import React, { useState, useEffect } from 'react';
import { StaffMember } from '../types';
import { X, Check, User, Phone, Calendar, FileText, Briefcase, Trash2, Eraser, PhoneCall, Printer, ArrowRight, MapPin, Globe, Lock, ShieldAlert, Vote } from 'lucide-react';
import { arabicToLatin } from '../utils/transliteration';

interface MemberEditModalProps {
  isOpen: boolean;
  member: StaffMember | null;
  locationInfo?: {
    centerName: string;
    officeName?: string;
  };
  isSupervisor?: boolean;
  onSave: (updatedMember: StaffMember) => void;
  onDeleteSlot?: (memberId: string) => void;
  onOpenForm?: (member: StaffMember) => void;
  onClose: () => void;
}

export const MemberEditModal: React.FC<MemberEditModalProps> = ({
  isOpen,
  member,
  locationInfo,
  isSupervisor = false,
  onSave,
  onDeleteSlot,
  onOpenForm,
  onClose,
}) => {
  const [formData, setFormData] = useState<StaffMember | null>(null);
  const [isConfirmingDeleteSlot, setIsConfirmingDeleteSlot] = useState(false);

  useEffect(() => {
    if (member) {
      setFormData({
        ...member,
        votingPlace: member.votingPlace && member.votingPlace.trim() !== '' ? member.votingPlace : 'عين الدفلى',
      });
      setIsConfirmingDeleteSlot(false);
    }
  }, [member]);

  if (!isOpen || !formData) return null;

  const isExistingStaff = Boolean(
    member && (member.firstName?.trim() || member.lastName?.trim() || member.phone?.trim() || member.nationalId?.trim() || member.electoralCardNumber?.trim())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupervisor) {
      alert('تعديل البيانات محصور بالمشرف فقط. لتفعيل وضع المشرف، افتح خانة البحث واكتب mohamed 44000');
      return;
    }
    onSave(formData);
    onClose();
  };

  const handleClearAndSave = () => {
    if (!isSupervisor) {
      alert('تفريغ ومسح البيانات محصور بالمشرف فقط.');
      return;
    }
    const cleared: StaffMember = {
      ...formData,
      firstName: '',
      lastName: '',
      latinFirstName: '',
      latinLastName: '',
      birthDate: '',
      birthCommune: '',
      phone: '',
      notes: '',
      votingPlace: 'عين الدفلى',
    };
    onSave(cleared);
    onClose();
  };

  const handleDeleteSlotAction = () => {
    if (!isSupervisor) {
      alert('حذف المنصب محصور بالمشرف فقط.');
      return;
    }
    if (!onDeleteSlot) return;
    onDeleteSlot(formData.id);
    onClose();
  };

  const handleClearInputsOnly = () => {
    if (!isSupervisor) return;
    setFormData({
      ...formData,
      firstName: '',
      lastName: '',
      latinFirstName: '',
      latinLastName: '',
      birthDate: '',
      birthCommune: '',
      phone: '',
      notes: '',
      votingPlace: 'عين الدفلى',
    });
  };

  return (
    <div
      id="member-edit-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="member-edit-card"
        className="w-full max-w-lg bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header with Red Gradual Back Button */}
        <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              id="close-member-edit-back-btn"
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white flex items-center justify-center shadow-md border-2 border-red-300 transition-all cursor-pointer shrink-0"
              title="رجوع"
            >
              <ArrowRight className="w-4 h-4 font-black text-white" />
            </button>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                {isExistingStaff ? 'تعديل بيانات المؤطر والمنصب' : 'تسجيل وتعيين مؤطر في المنصب'}
              </h2>
              {locationInfo && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {locationInfo.centerName}
                  {locationInfo.officeName ? ` • ${locationInfo.officeName}` : ' • مؤطرو المركز'}
                </p>
              )}
            </div>
          </div>
          <button
            id="close-member-edit-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-750 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Non-supervisor banner */}
          {!isSupervisor && (
            <div className="bg-amber-950/90 border-2 border-amber-500/80 p-3.5 rounded-xl flex items-center gap-3 text-amber-200 text-xs sm:text-sm font-bold shadow-lg">
              <Lock className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-white font-black">وضع العرض فقط (أنت لست مشرفاً)</p>
                <p className="text-amber-300 font-semibold text-xs">
                  لا يمكنك تعديل أو حفظ البيانات. لتفعيل وضع المشرف، افتح خانة البحث واكتب{' '}
                  <span className="font-mono bg-blue-950 px-1.5 py-0.5 rounded text-amber-200 border border-amber-400 font-bold">
                    mohamed 44000
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Form Fields Fieldset */}
          <fieldset disabled={!isSupervisor} className="space-y-4">
            {/* Role Name Edit */}
            <div>
              <label className="block text-sm font-extrabold text-white mb-1.5 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-400" />
                مسمى المنصب
              </label>
              <input
                id="member-role-title-input"
                type="text"
                required
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                placeholder="المنصب"
                style={{ color: '#FFFFFF' }}
                className={`w-full px-4 py-3 bg-[#102a5c] border border-slate-600 rounded-xl text-xl sm:text-2xl font-black text-white !text-white placeholder:text-blue-300/60 transition-all shadow-inner ${
                  !isSupervisor ? 'opacity-90 cursor-not-allowed' : 'focus:bg-[#163674] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300'
                }`}
              />
            </div>

          {/* Name & Surname Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-extrabold text-white mb-1.5 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                الاسم بالعربية
              </label>
              <input
                id="member-first-name-input"
                type="text"
                placeholder="أدخل الاسم بالعربية"
                value={formData.firstName}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({
                    ...formData,
                    firstName: val,
                    latinFirstName: formData.latinFirstName || arabicToLatin(val, false),
                  });
                }}
                style={{ color: '#FFFFFF' }}
                className="w-full px-4 py-3 bg-[#102a5c] border border-slate-600 rounded-xl text-xl sm:text-2xl font-black text-white !text-white placeholder:text-blue-300/60 focus:bg-[#163674] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300 transition-all shadow-inner"
              />
            </div>
            <div>
              <label className="block text-sm font-extrabold text-white mb-1.5 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                اللقب بالعربية
              </label>
              <input
                id="member-last-name-input"
                type="text"
                placeholder="أدخل اللقب بالعربية"
                value={formData.lastName}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({
                    ...formData,
                    lastName: val,
                    latinLastName: formData.latinLastName || arabicToLatin(val, true),
                  });
                }}
                style={{ color: '#FFFFFF' }}
                className="w-full px-4 py-3 bg-[#102a5c] border border-slate-600 rounded-xl text-xl sm:text-2xl font-black text-white !text-white placeholder:text-blue-300/60 focus:bg-[#163674] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300 transition-all shadow-inner"
              />
            </div>
          </div>

          {/* French / Latin Prénom & Nom Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-amber-300 mb-1 flex items-center gap-1.5" dir="ltr">
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>Prénom (الاسم بالفرنسية)</span>
              </label>
              <input
                id="member-latin-first-name-input"
                type="text"
                dir="ltr"
                placeholder="Prénom (ex: Mohamed)"
                value={formData.latinFirstName || ''}
                onChange={(e) =>
                  setFormData({ ...formData, latinFirstName: e.target.value })
                }
                style={{ color: '#FFFFFF' }}
                className="w-full px-3.5 py-2.5 bg-[#0f244e] border border-slate-600 rounded-xl text-base font-bold text-white placeholder:text-blue-300/40 focus:bg-[#163674] focus:outline-none focus:ring-2 focus:ring-amber-400 font-sans shadow-inner"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-amber-300 mb-1 flex items-center gap-1.5" dir="ltr">
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>Nom (اللقب بالفرنسية)</span>
              </label>
              <input
                id="member-latin-last-name-input"
                type="text"
                dir="ltr"
                placeholder="Nom (ex: Hadj Djillani)"
                value={formData.latinLastName || ''}
                onChange={(e) =>
                  setFormData({ ...formData, latinLastName: e.target.value })
                }
                style={{ color: '#FFFFFF' }}
                className="w-full px-3.5 py-2.5 bg-[#0f244e] border border-slate-600 rounded-xl text-base font-bold text-white placeholder:text-blue-300/40 focus:bg-[#163674] focus:outline-none focus:ring-2 focus:ring-amber-400 font-sans shadow-inner"
              />
            </div>
          </div>

          {/* Date of Birth & Place of Birth Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>تاريخ الميلاد</span>
                </label>
                {formData.birthDate && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, birthDate: '' })}
                    className="text-2xs font-bold text-slate-300 hover:text-rose-300 transition-colors flex items-center gap-1 bg-[#102a5c] hover:bg-slate-750 px-2 py-0.5 rounded-md border border-slate-600 hover:border-rose-500/50"
                    title="تفريغ تاريخ الميلاد ليبقى فارغاً"
                  >
                    <X className="w-3 h-3 text-rose-400" />
                    <span>تفريغ</span>
                  </button>
                )}
              </div>
              <input
                id="member-birth-date-input"
                type="text"
                value={formData.birthDate || ''}
                onChange={(e) =>
                  setFormData({ ...formData, birthDate: e.target.value })
                }
                placeholder="تاريخ الميلاد (1979/06/30)"
                style={{ color: '#FFFFFF' }}
                className="w-full px-4 py-3 bg-[#102a5c] border border-slate-600 rounded-xl text-lg sm:text-xl font-black text-white !text-white placeholder:text-blue-300/60 focus:bg-[#163674] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300 transition-all font-mono shadow-inner"
              />
            </div>
            <div>
              <label className="block text-sm font-extrabold text-white mb-1.5 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span>مكان الميلاد</span>
              </label>
              <input
                id="member-birth-commune-input"
                type="text"
                placeholder="مكان الميلاد (مثال: عين الدفلى)"
                value={formData.birthCommune || ''}
                onChange={(e) =>
                  setFormData({ ...formData, birthCommune: e.target.value })
                }
                style={{ color: '#FFFFFF' }}
                className="w-full px-4 py-3 bg-[#102a5c] border border-slate-600 rounded-xl text-lg sm:text-xl font-black text-white !text-white placeholder:text-blue-300/60 focus:bg-[#163674] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300 transition-all shadow-inner"
              />
            </div>
          </div>
          {/* Phone & Voting Place Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-400" />
                  <span>رقم الهاتف</span>
                </label>
                {formData.phone && (
                  <a
                    href={`tel:${formData.phone.replace(/\s+/g, '')}`}
                    className="text-xs font-black text-emerald-300 hover:text-white flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-700/80 px-2.5 py-1 rounded-lg transition-colors"
                    title="اتصال مباشر بهذا الرقم"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>اتصال فوري</span>
                  </a>
                )}
              </div>
              <input
                id="member-phone-input"
                type="tel"
                dir="ltr"
                placeholder="06XXXXXXXX"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                style={{ color: '#FFFFFF' }}
                className="w-full px-4 py-3 bg-[#102a5c] border border-slate-600 rounded-xl text-xl sm:text-2xl font-black text-right text-white !text-white placeholder:text-blue-300/60 focus:bg-[#163674] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300 transition-all font-mono shadow-inner"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Vote className="w-4 h-4 text-emerald-400" />
                  <span>مكان الانتخاب</span>
                </label>
                {formData.votingPlace && formData.votingPlace !== 'عين الدفلى' && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, votingPlace: 'عين الدفلى' })}
                    className="text-2xs font-bold text-emerald-300 hover:text-emerald-200 transition-colors flex items-center gap-1 bg-emerald-950/60 hover:bg-emerald-900/60 px-2 py-0.5 rounded-md border border-emerald-700/60"
                    title="إعادة التعيين إلى عين الدفلى"
                  >
                    <span>عين الدفلى</span>
                  </button>
                )}
              </div>
              <input
                id="member-voting-place-input"
                type="text"
                placeholder="مكان الانتخاب (مثال: عين الدفلى)"
                value={formData.votingPlace !== undefined ? formData.votingPlace : 'عين الدفلى'}
                onChange={(e) =>
                  setFormData({ ...formData, votingPlace: e.target.value })
                }
                style={{ color: '#FFFFFF' }}
                className="w-full px-4 py-3 bg-[#102a5c] border border-slate-600 rounded-xl text-lg sm:text-xl font-black text-white !text-white placeholder:text-blue-300/60 focus:bg-[#163674] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-300 transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Notes & Status Circles */}
          <div className="space-y-3">
            <label className="block text-sm font-extrabold text-white mb-1 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              ملاحظات
            </label>
            <input
              id="member-notes-input"
              type="text"
              placeholder="مثلاً: أستاذ، موظف، متقاعد، تم الاتصال به..."
              value={formData.notes || ''}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              style={{ color: '#FFFFFF' }}
              className="w-full px-4 py-3 bg-[#102a5c] border border-slate-600 rounded-xl text-xl sm:text-2xl font-black text-white !text-white placeholder:text-blue-300/60 focus:bg-[#163674] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300 transition-all shadow-inner"
            />

            {/* Red and Green Selection Circles */}
            <div className="flex items-center gap-4 bg-[#0d224a] p-3 rounded-xl border border-slate-700">
              <span className="text-xs sm:text-sm font-black text-slate-200">
                حالة القبول / التأكيد:
              </span>
              <div className="flex items-center gap-3">
                {/* Green Circle with Checkmark (Acceptance) */}
                <button
                  type="button"
                  id="member-notes-accept-btn"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      notesStatus: formData.notesStatus === 'accepted' ? null : 'accepted',
                    })
                  }
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 shadow-md ${
                    formData.notesStatus === 'accepted'
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-400/60 scale-110 shadow-emerald-500/50'
                      : 'bg-emerald-950/80 text-emerald-300 border-2 border-emerald-600 hover:bg-emerald-600 hover:text-white opacity-60 hover:opacity-100'
                  }`}
                  title="علامة القبول (موافق عليه / مؤكد)"
                >
                  <Check className="w-6 h-6 stroke-[3.5]" />
                </button>

                {/* Red Circle with Cross / Multiplication (Rejection / Cancel) */}
                <button
                  type="button"
                  id="member-notes-reject-btn"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      notesStatus: formData.notesStatus === 'rejected' ? null : 'rejected',
                    })
                  }
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 shadow-md ${
                    formData.notesStatus === 'rejected'
                      ? 'bg-rose-600 text-white ring-4 ring-rose-500/60 scale-110 shadow-rose-600/50'
                      : 'bg-rose-950/80 text-rose-300 border-2 border-rose-600 hover:bg-rose-600 hover:text-white opacity-60 hover:opacity-100'
                  }`}
                  title="علامة الضرب / الرفض (مرفوض / غير متاح)"
                >
                  <X className="w-6 h-6 stroke-[3.5]" />
                </button>
              </div>
              <span className="text-2xs sm:text-xs font-bold text-slate-300">
                {formData.notesStatus === 'accepted'
                  ? 'تم تفعيل علامة القبول (✓ خضراء)'
                  : formData.notesStatus === 'rejected'
                  ? 'تم تفعيل علامة الضرب (✕ حمراء)'
                  : 'اضغط لتفعيل إحدى العلامتين'}
              </span>
            </div>
          </div>

          {/* Individual Deletion & Clear actions */}
          <div className="pt-3 border-t border-slate-800 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {(formData.firstName || formData.lastName || formData.phone) && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="clear-and-save-member-btn"
                    onClick={handleClearAndSave}
                    className="text-xs text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1.5 py-1.5 px-3 bg-amber-950/40 hover:bg-amber-900/50 rounded-xl border border-amber-500/40 transition-colors"
                    title="مسح كافة معلومات هذا المؤطر وحفظ الخانة فارغة فوراً"
                  >
                    <Eraser className="w-3.5 h-3.5 text-amber-400" />
                    <span>تفريغ وحفظ الخانة فارغة</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearInputsOnly}
                    className="text-2xs text-slate-400 hover:text-slate-200 underline py-1 px-1.5"
                    title="مسح الحقول للكتابة من جديد"
                  >
                    مسح الحقول فقط
                  </button>
                </div>
              )}

              {onDeleteSlot && (
                <div className="mr-auto">
                  {!isConfirmingDeleteSlot ? (
                    <button
                      type="button"
                      id="delete-member-slot-btn"
                      onClick={() => setIsConfirmingDeleteSlot(true)}
                      className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1.5 py-1.5 px-3 bg-rose-950/30 hover:bg-rose-900/40 rounded-xl border border-rose-800/60 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف هذا المنصب</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 p-1 bg-rose-950/80 rounded-xl border border-rose-600">
                      <span className="text-2xs text-rose-200 px-1 font-bold">تأكيد حذف المنصب؟</span>
                      <button
                        type="button"
                        onClick={handleDeleteSlotAction}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-lg transition-colors"
                      >
                        نعم، احذف
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsConfirmingDeleteSlot(false)}
                        className="px-2 py-1 text-slate-300 hover:text-white text-xs"
                      >
                        إلغاء
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          </fieldset>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            {onOpenForm && (
              <button
                type="button"
                id="open-member-registration-form-btn"
                onClick={() => {
                  if (isSupervisor) {
                    onSave(formData);
                  }
                  onOpenForm(formData);
                  onClose();
                }}
                className="px-4 py-2.5 text-xs sm:text-sm font-black text-amber-300 hover:text-amber-200 bg-blue-950 hover:bg-blue-900 rounded-xl border border-amber-400 shadow-md transition-all flex items-center gap-2 cursor-pointer"
                title="معاينة وطباعة الاستمارة الرسمية لهذا المؤطر"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>معاينة وطباعة الاستمارة الرسمية</span>
              </button>
            )}

            <div className="flex items-center gap-2 mr-auto">
              <button
                type="button"
                id="cancel-edit-member-btn"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                إغلاق
              </button>
              <button
                type="submit"
                id="save-member-btn"
                disabled={!isSupervisor}
                className={`px-6 py-2.5 text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2 ${
                  isSupervisor
                    ? 'text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer active:scale-95'
                    : 'text-slate-400 bg-slate-800 border border-slate-700 cursor-not-allowed opacity-75'
                }`}
                title={!isSupervisor ? 'خاص بالمشرف فقط' : 'حفظ البيانات'}
              >
                {isSupervisor ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isExistingStaff ? 'حفظ التعديلات' : 'تسجيل وتعيين المؤطر'}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>الحفظ متاح للمشرف فقط</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
