import React, { useState, useEffect, useRef } from 'react';
import { Lock, KeyRound, ShieldAlert, Check, X, Eye, EyeOff, Trash2, Edit3, AlertTriangle } from 'lucide-react';
import { verifySecurityPin, SECURITY_PIN } from '../utils/security';

export type SecurityActionType = 'edit' | 'delete' | 'clear' | 'save' | 'generic';

interface SecurityPinModalProps {
  isOpen: boolean;
  actionType?: SecurityActionType;
  actionTitle?: string;
  actionDescription?: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const SecurityPinModal: React.FC<SecurityPinModalProps> = ({
  isOpen,
  actionType = 'edit',
  actionTitle,
  actionDescription,
  onSuccess,
  onClose,
}) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setShowPin(false);
      setErrorMsg('');
      setIsSuccess(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!pin) {
      setErrorMsg('يرجى إدخال الرقم السري للمتابعة');
      return;
    }

    if (verifySecurityPin(pin)) {
      setIsSuccess(true);
      setErrorMsg('');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 350);
    } else {
      setErrorMsg('الرقم السري غير صحيح! يرجى إدخال الرقم السري الصحيح: 123258');
      setPin('');
      inputRef.current?.focus();
    }
  };

  const handleKeypadPress = (digit: string) => {
    if (pin.length < 10) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg('');
      if (nextPin.length === 6) {
        if (verifySecurityPin(nextPin)) {
          setIsSuccess(true);
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 350);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClearPin = () => {
    setPin('');
    setErrorMsg('');
    inputRef.current?.focus();
  };

  const isDelete = actionType === 'delete' || actionType === 'clear';

  return (
    <div
      id="security-pin-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="security-pin-card"
        className="w-full max-w-sm bg-slate-900 border border-slate-700 text-slate-100 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between ${
            isDelete
              ? 'bg-rose-950/60 border-rose-800/60'
              : 'bg-blue-950/70 border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-inner ${
                isDelete ? 'bg-rose-600 text-white' : 'bg-amber-400 text-slate-950'
              }`}
            >
              {isDelete ? <Trash2 className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
                {actionTitle || (isDelete ? 'تأكيد الحذف برمز الأمان' : 'تأكيد التعديل برمز الأمان')}
              </h2>
              <p className="text-2xs text-slate-400 mt-0.5">
                {isDelete ? 'عملية حساسة تتطلب الرقم السري' : 'حفظ التعديلات يتطلب الرقم السري'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleVerify} className="p-5 space-y-4">
          {actionDescription && (
            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 text-center font-medium">
              {actionDescription}
            </div>
          )}

          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-amber-300 text-xs font-mono font-bold border border-slate-700">
              <KeyRound className="w-3.5 h-3.5" />
              <span>الرقم السري المطلوب: 123258</span>
            </div>
            <p className="text-xs text-slate-400">
              أدخل الرقم السري المكون من 6 أرقام لإتمام العملية
            </p>
          </div>

          {/* PIN Input field */}
          <div className="relative">
            <input
              ref={inputRef}
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={10}
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setPin(val);
                setErrorMsg('');
                if (val.length === 6 && verifySecurityPin(val)) {
                  setIsSuccess(true);
                  setTimeout(() => {
                    onSuccess();
                    onClose();
                  }, 350);
                }
              }}
              placeholder="••••••"
              className={`w-full py-3.5 px-10 text-center text-2xl sm:text-3xl font-mono tracking-widest bg-slate-950 border-2 rounded-2xl text-white outline-none transition-all ${
                isSuccess
                  ? 'border-emerald-500 bg-emerald-950/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : errorMsg
                  ? 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                  : 'border-slate-700 focus:border-amber-400 focus:shadow-[0_0_15px_rgba(251,191,36,0.2)]'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
              title={showPin ? 'إخفاء الأرقام' : 'إظهار الأرقام'}
            >
              {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-2.5 bg-rose-950/80 border border-rose-600 rounded-xl text-rose-200 text-xs font-semibold animate-in shake">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Message */}
          {isSuccess && (
            <div className="flex items-center justify-center gap-2 p-2.5 bg-emerald-950/80 border border-emerald-500 rounded-xl text-emerald-200 text-xs font-bold animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>تم التحقق بنجاح! جاري التنفيذ...</span>
            </div>
          )}

          {/* Visual Numeric Keypad for fast touch/click */}
          <div className="grid grid-cols-3 gap-2 pt-1 select-none">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeypadPress(digit)}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 active:scale-95 text-lg font-bold font-mono text-white border border-slate-700/80 transition-all shadow-sm flex items-center justify-center cursor-pointer"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClearPin}
              className="py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 active:scale-95 text-xs font-semibold text-slate-400 hover:text-white border border-slate-700/80 transition-all flex items-center justify-center cursor-pointer"
            >
              مسح
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 active:scale-95 text-lg font-bold font-mono text-white border border-slate-700/80 transition-all shadow-sm flex items-center justify-center cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 active:scale-95 text-xs font-semibold text-rose-300 hover:text-rose-200 border border-slate-700/80 transition-all flex items-center justify-center cursor-pointer"
            >
              حذف
            </button>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 px-4 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 rounded-xl transition-colors"
            >
              إلغاء العملية
            </button>
            <button
              type="submit"
              disabled={isSuccess}
              className={`w-1/2 py-2.5 px-4 text-xs sm:text-sm font-bold text-white rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 ${
                isDelete
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>تأكيد ومتابعة</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
