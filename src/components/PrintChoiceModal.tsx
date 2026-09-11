import React from 'react';
import { FileText, Printer, Eye, X } from 'lucide-react';

interface PrintChoiceModalProps {
  isOpen: boolean;
  onOpenWord: () => void;
  onPrintDirect: () => void;
  onPreview: () => void;
  onClose: () => void;
}

export const PrintChoiceModal: React.FC<PrintChoiceModalProps> = ({
  isOpen,
  onOpenWord,
  onPrintDirect,
  onPreview,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 print:hidden">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white">
          <span className="text-sm font-black">كيفاش تحب تطبع؟</span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="إلغاء"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">

          {/* معاينة قبل الطباعة */}
          <button
            onClick={onPreview}
            className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-violet-500 hover:bg-violet-50/60 transition-all cursor-pointer text-right"
          >
            <div className="shrink-0 w-10 h-10 rounded-lg bg-violet-600 flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-black text-slate-900">معاينة قبل الطباعة</div>
              <div className="text-2xs text-slate-500 font-medium mt-0.5">
                شوف كيفاش راح تكون الطباعة قبل ما تطبع فعلاً
              </div>
            </div>
          </button>

          {/* فتح في Word */}
          <button
            onClick={onOpenWord}
            className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50/60 transition-all cursor-pointer text-right"
          >
            <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-black text-slate-900">فتحها في Word</div>
              <div className="text-2xs text-slate-500 font-medium mt-0.5">
                تحميل الملف باش تشوفه أو تعدل فيه قبل الطباعة
              </div>
            </div>
          </button>

          {/* طباعة مباشرة */}
          <button
            onClick={onPrintDirect}
            className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/60 transition-all cursor-pointer text-right"
          >
            <div className="shrink-0 w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-black text-slate-900">طباعة مباشرة</div>
              <div className="text-2xs text-slate-500 font-medium mt-0.5">
                تفتح نافذة الطباعة العادية للمتصفح مباشرة
              </div>
            </div>
          </button>

        </div>

        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-all"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
