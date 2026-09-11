import React, { useEffect, useRef, useState } from 'react';
import { X, Printer, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface PrintPreviewModalProps {
  isOpen: boolean;
  contentRef: React.RefObject<HTMLElement>;
  onClose: () => void;
}

type Orientation = 'portrait' | 'landscape';

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  contentRef,
  onClose,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [zoom, setZoom] = useState(0.72);
  const [ready, setReady] = useState(false);
  const [orientation, setOrientation] = useState<Orientation>('landscape');

  useEffect(() => {
    if (!isOpen) { setReady(false); return; }
    if (!contentRef.current || !iframeRef.current) return;

    setReady(false);

    // أبعاد الورقة حسب الاتجاه المختار (عمودي / أفقي)
    const isLandscape = orientation === 'landscape';
    const pageWidthMM = isLandscape ? 297 : 210;
    const pageHeightMM = isLandscape ? 210 : 297;
    // الورقة البيضاء تاخذ كامل مقاس صفحة الـ A4 بلا أي تصغير أو هامش خارجي
    const sheetWidthMM = pageWidthMM;
    const sheetMinHeightMM = pageHeightMM;

    // جمع كل CSS من الصفحة
    const allStyles = Array.from(document.styleSheets)
      .flatMap((sheet) => {
        try {
          return Array.from(sheet.cssRules).map((r) => r.cssText);
        } catch {
          return sheet.href ? [`@import url("${sheet.href}");`] : [];
        }
      })
      .join('\n');

    // نسخ المحتوى وحذف كل عناصر print:hidden (أزرار الطباعة السريعة وغيرها)
    const clone = contentRef.current.cloneNode(true) as HTMLElement;

    // حذف كل عنصر عنده class يحتوي print:hidden أو no-print
    clone.querySelectorAll('[class*="print:hidden"], .no-print').forEach((el) => el.remove());

    const content = clone.innerHTML;

    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8"/>
  <style>
    /* ── Google Fonts ── */
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');

    /* ── كل الـ CSS من التطبيق ── */
    ${allStyles}

    /* ── إعدادات المعاينة ── */
    *, *::before, *::after { box-sizing: border-box; }

    html, body {
      margin: 0;
      padding: 0;
      background: #cbd5e1;
      font-family: 'Cairo', 'Tajawal', Arial, sans-serif;
      direction: rtl;
    }

    /* كل ورقة A4 - المقاس يتبدل حسب الاتجاه المختار (عمودي/أفقي) */
    .office-pair-sheet {
      width: ${sheetWidthMM}mm;
      min-height: ${sheetMinHeightMM}mm;
      background: white !important;
      margin: 0 auto;
      padding: 8mm 10mm !important;
      box-shadow: none;
      border-radius: 0 !important;
      border: none !important;
      page-break-after: always;
      break-after: page;
      overflow: hidden;
    }

    /* إخفاء أزرار الطباعة السريعة داخل المعاينة */
    .print\\:hidden { display: none !important; }
    .no-print { display: none !important; }

    /* ── فرض اتجاه/مقاس الورقة المختار من المستخدم (يطغى على أي @page سابق) ── */
    @page {
      size: A4 ${orientation};
      margin: 6mm;
    }

    @media print {
      html, body { background: white !important; }
      .office-pair-sheet {
        margin: 0 !important;
        padding: 8mm 10mm !important;
        box-shadow: none !important;
        border: none !important;
        border-radius: 0 !important;
        width: 100% !important;
      }
    }
  </style>
</head>
<body>
  <div>
    ${content}
  </div>
  <script>
    (function () {
      // يتأكد أن محتوى كل ورقة (الجدول وما حوله) يبان كاملاً داخل حدود الورقة
      // بدل ما يتقص أو يبان نصو فقط، عبر تصغيره تلقائياً إذا كان أعرض من المتاح.
      function fitAllSheets() {
        var sheets = document.querySelectorAll('.office-pair-sheet');
        sheets.forEach(function (sheet) {
          // إلغاء أي تصغير سابق حتى نقيس الحجم الحقيقي للمحتوى من جديد
          var prevWrap = sheet.querySelector(':scope > .__pp_fit_inner');
          if (prevWrap) {
            while (prevWrap.firstChild) sheet.insertBefore(prevWrap.firstChild, prevWrap);
            prevWrap.remove();
          }
          sheet.style.height = '';
          sheet.style.minHeight = '';

          var cs = window.getComputedStyle(sheet);
          var padLeft = parseFloat(cs.paddingLeft) || 0;
          var padRight = parseFloat(cs.paddingRight) || 0;
          var availableWidth = sheet.clientWidth - padLeft - padRight;

          var wrapper = document.createElement('div');
          wrapper.className = '__pp_fit_inner';
          wrapper.style.display = 'inline-block';
          wrapper.style.transformOrigin = 'top right';
          wrapper.style.width = 'max-content';
          while (sheet.firstChild) wrapper.appendChild(sheet.firstChild);
          sheet.appendChild(wrapper);

          var naturalWidth = wrapper.scrollWidth;
          var naturalHeight = wrapper.scrollHeight;

          if (naturalWidth > 0 && availableWidth > 0 && naturalWidth > availableWidth) {
            var scale = availableWidth / naturalWidth;
            wrapper.style.transform = 'scale(' + scale + ')';
            sheet.style.height = Math.ceil(naturalHeight * scale) + 'px';
            sheet.style.minHeight = '0';
          } else {
            wrapper.style.transform = 'none';
          }
        });
      }

      window.__ppFit = fitAllSheets;
      window.addEventListener('load', function () { setTimeout(fitAllSheets, 60); });
      window.addEventListener('beforeprint', fitAllSheets);
      setTimeout(fitAllSheets, 200);
    })();
  <\/script>
</body>
</html>`);
    doc.close();

    // انتظر تحميل الـ iframe
    iframeRef.current.onload = () => setReady(true);
    setTimeout(() => setReady(true), 800);

  }, [isOpen, contentRef, orientation]);

  // الطباعة من داخل الـ iframe مباشرة (تطبع بنفس الاتجاه المختار في المعاينة)
  const handlePrint = () => {
    if (!iframeRef.current?.contentWindow) return;
    try {
      (iframeRef.current.contentWindow as any).__ppFit?.();
    } catch {
      // تجاهل أي خطأ في إعادة الحساب، الطباعة تكمل بالمقاس الحالي
    }
    iframeRef.current.contentWindow.focus();
    iframeRef.current.contentWindow.print();
  };

  if (!isOpen) return null;

  const pageWidthMM = orientation === 'landscape' ? 297 : 210;
  const pageHeightMM = orientation === 'landscape' ? 210 : 297;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black/85 print:hidden" dir="rtl">

      {/* ── شريط العنوان ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 text-white shrink-0 border-b border-slate-700 flex-wrap gap-y-2">
        <div className="flex items-center gap-2.5">
          <Printer className="w-4 h-4 text-emerald-400" />
          <span className="font-black text-sm">معاينة الطباعة</span>
          <span className="text-slate-400 text-xs hidden sm:inline">— هكذا ستكون الطباعة فعلاً</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* اختيار اتجاه الورقة: عمودي / أفقي */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 ml-1">
            <button
              onClick={() => setOrientation('portrait')}
              className={`px-2.5 py-1 text-xs font-black rounded-md transition-colors ${
                orientation === 'portrait'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
              title="ورقة عمودية"
            >
              عمودي
            </button>
            <button
              onClick={() => setOrientation('landscape')}
              className={`px-2.5 py-1 text-xs font-black rounded-md transition-colors ${
                orientation === 'landscape'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
              title="ورقة أفقية"
            >
              أفقي
            </button>
          </div>

          <div className="w-px h-5 bg-slate-600 mx-1" />

          {/* تصغير */}
          <button
            onClick={() => setZoom((z) => Math.max(0.35, +(z - 0.1).toFixed(2)))}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title="تصغير"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* نسبة الزوم */}
          <span className="text-xs text-slate-300 w-10 text-center select-none">
            {Math.round(zoom * 100)}%
          </span>

          {/* تكبير */}
          <button
            onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.1).toFixed(2)))}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title="تكبير"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* إعادة ضبط الزوم */}
          <button
            onClick={() => setZoom(0.72)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title="إعادة الضبط"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-5 bg-slate-600 mx-1" />

          {/* زر الطباعة */}
          <button
            onClick={handlePrint}
            disabled={!ready}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black rounded-lg transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            طباعة
          </button>

          {/* إغلاق */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors mr-1"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── منطقة المعاينة ── */}
      <div className="flex-1 overflow-auto bg-slate-500 p-4">
        {!ready && (
          <div className="flex items-center justify-center h-40 text-white text-sm">
            جاري تحميل المعاينة...
          </div>
        )}
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease',
            visibility: ready ? 'visible' : 'hidden',
          }}
        >
          <iframe
            ref={iframeRef}
            title="معاينة الطباعة"
            style={{
              width: `${pageWidthMM}mm`,
              minHeight: `${pageHeightMM}mm`,
              border: 'none',
              display: 'block',
              margin: '0 auto',
              background: '#cbd5e1',
              transition: 'width 0.15s ease, min-height 0.15s ease',
            }}
          />
        </div>
      </div>

      {/* ── شريط الأسفل ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 text-slate-400 text-xs shrink-0 border-t border-slate-700">
        <span>ما تشوفه هنا هو بالضبط ما سيُطبع ({orientation === 'landscape' ? 'ورقة أفقية' : 'ورقة عمودية'})</span>
        <button
          onClick={onClose}
          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
};
