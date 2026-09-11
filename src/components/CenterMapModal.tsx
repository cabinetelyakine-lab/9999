import React, { useState, useEffect } from 'react';
import { Center } from '../types';
import {
  MapPin,
  X,
  Check,
  ExternalLink,
  Navigation,
  ClipboardPaste,
  Trash2,
  CheckCircle2,
  Crosshair,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { normalizeMapsUrl, extractCoordinates } from '../utils/maps';

interface CenterMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  center: Center | null;
  onSaveMapUrl: (centerId: string, mapUrl: string | undefined) => void;
}

export const CenterMapModal: React.FC<CenterMapModalProps> = ({
  isOpen,
  onClose,
  center,
  onSaveMapUrl,
}) => {
  const [mapInput, setMapInput] = useState('');
  const [justSaved, setJustSaved] = useState(false);
  const [pasteSuccess, setPasteSuccess] = useState(false);

  useEffect(() => {
    if (center) {
      setMapInput(center.mapUrl || '');
      setJustSaved(false);
    }
  }, [center, isOpen]);

  if (!isOpen || !center) return null;

  // Search URL for opening Google Maps
  const getSearchMapsUrl = () => {
    const queryParts = [center.name, center.address, center.commune, 'الجزائر'].filter(Boolean);
    return `https://www.google.com/maps?q=${encodeURIComponent(queryParts.join(', '))}`;
  };

  const detectedCoords = extractCoordinates(mapInput);
  const effectiveUrl = normalizeMapsUrl(mapInput, {
    name: center.name,
    address: center.address,
    commune: center.commune,
  });

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setMapInput(text.trim());
          setPasteSuccess(true);
          setTimeout(() => setPasteSuccess(false), 2500);
        }
      }
    } catch {
      // ignore clipboard error
    }
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalUrl = mapInput.trim() ? normalizeMapsUrl(mapInput.trim()) : undefined;
    onSaveMapUrl(center.id, finalUrl);
    setJustSaved(true);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const handleClearLocation = () => {
    setMapInput('');
    onSaveMapUrl(center.id, undefined);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border-2 border-amber-400 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Red Gradual Back Button */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border-b-2 border-amber-400/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              id="close-center-map-back-btn"
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white flex items-center justify-center shadow-md border-2 border-red-300 transition-all cursor-pointer shrink-0"
              title="رجوع"
            >
              <ArrowRight className="w-4 h-4 font-black text-white" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>تحديد وتثبيت موقع المركز على Google Maps</span>
              </h2>
              <p className="text-xs text-emerald-300 font-semibold truncate max-w-xs">{center.name}</p>
            </div>
          </div>
          <button
            id="close-center-map-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Instructions Box */}
          <div className="bg-emerald-950/40 border border-emerald-700/50 rounded-xl p-3.5 space-y-2.5 text-xs text-emerald-200 shadow-inner">
            <div className="flex items-center gap-2 font-black text-emerald-300 text-sm">
              <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>طريقة تثبيت النقطة الحمراء (الدبوس) بدقة في Google Maps:</span>
            </div>

            <div className="space-y-2 text-slate-200 text-2xs sm:text-xs">
              <div className="flex items-start gap-2 bg-slate-900/70 p-2 rounded-lg border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center shrink-0 text-3xs border border-emerald-500/40">1</span>
                <div>
                  اضغط على زر <strong className="text-emerald-300 font-bold">«1. فتح تطبيق Google Maps»</strong> أدناه.
                </div>
              </div>

              <div className="flex items-start gap-2 bg-slate-900/70 p-2 rounded-lg border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center shrink-0 text-3xs border border-amber-500/40">2</span>
                <div>
                  في تطبيق Google Maps: <strong className="text-amber-300 font-black">اضغط مطولاً بأصبعك</strong> على موقع المركز حتى تظهر <strong className="text-rose-400 font-black">النقطة الحمراء (الدبوس المسقط)</strong>.
                </div>
              </div>

              <div className="flex items-start gap-2 bg-slate-900/70 p-2 rounded-lg border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-black flex items-center justify-center shrink-0 text-3xs border border-blue-500/40">3</span>
                <div>
                  اضغط على زر <strong className="text-blue-300 font-bold">«مشاركة 🔗»</strong> ثم <strong className="text-white font-bold">«نسخ الرابط»</strong> (أو انسخ الإحداثيات).
                </div>
              </div>

              <div className="flex items-start gap-2 bg-slate-900/70 p-2 rounded-lg border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 font-black flex items-center justify-center shrink-0 text-3xs border border-purple-500/40">4</span>
                <div>
                  ارجع للبرنامج واضغط زر <strong className="text-emerald-300 font-bold">«2. لصق الرابط المنسوخ»</strong> ثم <strong className="text-emerald-400 font-black">«حفظ وتثبيت الموقع»</strong>.
                </div>
              </div>
            </div>
          </div>

          {/* Quick Buttons: Open Maps & Paste */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <a
              href={getSearchMapsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 text-center"
            >
              <Navigation className="w-4 h-4 shrink-0" />
              <span>1. فتح تطبيق Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-80" />
            </a>

            <button
              type="button"
              onClick={handlePasteClipboard}
              className={`py-3 px-3.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition-all active:scale-95 ${
                pasteSuccess
                  ? 'bg-emerald-700/60 text-white border-emerald-400'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-100 border-slate-700 hover:border-emerald-500'
              }`}
            >
              {pasteSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>تم لصق الرابط بنجاح!</span>
                </>
              ) : (
                <>
                  <ClipboardPaste className="w-4 h-4 text-emerald-400" />
                  <span>2. لصق الرابط المنسوخ</span>
                </>
              )}
            </button>
          </div>

          {/* Input field for Maps URL or Coordinates */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold text-slate-200">
                رابط أو إحداثيات Google Maps المنسوخة
              </label>
              {detectedCoords && (
                <span className="text-3xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded flex items-center gap-1">
                  <Crosshair className="w-3 h-3" />
                  <span>إحداثيات دقيقة: {detectedCoords.lat}, {detectedCoords.lng}</span>
                </span>
              )}
            </div>

            <div className="relative">
              <input
                id="center-map-custom-url-input"
                type="text"
                value={mapInput}
                onChange={(e) => setMapInput(e.target.value)}
                placeholder="مثلاً: https://maps.app.goo.gl/... أو 35.123456, -0.654321"
                className="w-full px-4 py-3.5 bg-[#102a5c] border-2 border-amber-400 focus:border-amber-300 rounded-xl text-base sm:text-lg font-mono font-bold text-white placeholder:text-blue-300/60 focus:outline-none focus:ring-2 focus:ring-amber-400/40 transition-all text-left shadow-inner"
                dir="ltr"
              />
              {mapInput && (
                <button
                  type="button"
                  onClick={() => setMapInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-amber-300 hover:text-white rounded-md bg-blue-900"
                  title="مسح"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Status & Test Preview */}
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-3 h-3 rounded-full shrink-0 ${
                  mapInput.trim() ? 'bg-emerald-400 ring-4 ring-emerald-500/20' : 'bg-amber-400'
                }`}
              />
              <span className="text-xs text-slate-200 font-bold truncate">
                {mapInput.trim() ? (
                  <span className="text-emerald-300">تم تثبيت الرابط: ستفتح النقطة الحمراء في هذا المكان بدقة 📍</span>
                ) : (
                  <span className="text-slate-400">سيتم الاعتماد على البحث التلقائي بالاسم والعنوان</span>
                )}
              </span>
            </div>

            {mapInput.trim() && (
              <a
                href={effectiveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-2xs font-extrabold text-emerald-300 hover:text-white flex items-center gap-1 shrink-0 bg-emerald-950/60 hover:bg-emerald-900 px-2.5 py-1.5 rounded-lg border border-emerald-800/60 transition-colors"
              >
                <span>معاينة في Google Maps ↗</span>
              </a>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
            {center.mapUrl && (
              <button
                type="button"
                onClick={handleClearLocation}
                className="px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl text-xs font-bold border border-rose-900/50 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>إلغاء التثبيت</span>
              </button>
            )}

            <div className="flex items-center gap-2 mr-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 rounded-xl text-xs font-bold transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={justSaved}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/30"
              >
                {justSaved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>تم التثبيت بنجاح!</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>حفظ وتثبيت الموقع</span>
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
