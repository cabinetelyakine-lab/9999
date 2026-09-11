// Export the printable content (same DOM used for window.print()) as a
// Word-compatible .doc file, so the user can open it in Microsoft Word,
// review it, and print or edit it from there instead of the browser's
// direct print dialog.

/**
 * Clones the printable container, strips screen-only controls (buttons,
 * "print:hidden" ribbons), converts editable <input> fields into plain
 * text, and wraps everything in an HTML document with the Word-specific
 * markup (mso namespaces + @page rules) needed so Word opens it as a
 * proper A4-landscape document instead of raw HTML.
 */
export function exportPrintableAsWord(
  containerEl: HTMLElement,
  filenameBase: string,
  documentTitle: string = 'مستند',
  orientation: 'landscape' | 'portrait' = 'landscape'
): void {
  const clone = containerEl.cloneNode(true) as HTMLElement;

  // Remove anything that is screen-only (quick action ribbons, buttons...)
  clone.querySelectorAll('.print\\:hidden, .no-print, .print-hidden, button').forEach((el) => {
    el.parentElement?.removeChild(el);
  });

  // Turn editable fields (banner text, order numbers, select boxes,
  // textareas...) into plain text so Word shows the current value instead
  // of an empty/broken form field.
  clone.querySelectorAll('input, textarea').forEach((fieldEl) => {
    const field = fieldEl as HTMLInputElement | HTMLTextAreaElement;
    const span = document.createElement('span');
    span.textContent = field.value || field.placeholder || '';
    const existingStyle = field.getAttribute('style');
    if (existingStyle) span.setAttribute('style', existingStyle);
    if (field.className) span.className = field.className;
    field.replaceWith(span);
  });
  clone.querySelectorAll('select').forEach((selectEl) => {
    const select = selectEl as HTMLSelectElement;
    const span = document.createElement('span');
    span.textContent = select.options[select.selectedIndex]?.text || '';
    if (select.className) span.className = select.className;
    select.replaceWith(span);
  });

  const bodyHtml = clone.innerHTML;

  const printStyles = `
    body { font-family: 'Amiri','Traditional Arabic','Arial',sans-serif; direction: rtl; color:#000; }
    table { width:100%; border-collapse: collapse; }
    th, td { border: 1.5px solid #000000; padding: 4px 3px; text-align:center; font-size: 11pt; }
    th { background:#f2f2f2; font-weight:bold; }
    .office-section-header-row { background:#e5e7eb; font-weight:900; text-align:right; padding:3px 8px; border:1.5px solid #000; }
    .office-pair-sheet { page-break-after: always; margin-bottom: 24px; }
    .office-pair-sheet:last-child { page-break-after: auto; }
    .official-header { text-align:center; border-bottom:2px solid #000; margin-bottom:10px; padding-bottom:6px; }
  `;

  const pageSize = orientation === 'landscape' ? '29.7cm 21cm' : '21cm 29.7cm';

  const htmlDoc = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8" />
<title>${documentTitle}</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
  @page Section1 {
    size: ${pageSize};
    mso-page-orientation: ${orientation};
    margin: 1cm 1cm 1cm 1cm;
  }
  div.Section1 { page: Section1; }
  ${printStyles}
</style>
</head>
<body dir="rtl" lang="AR-DZ">
<div class="Section1">
${bodyHtml}
</div>
</body>
</html>`;

  const blob = new Blob(['\ufeff', htmlDoc], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const safeName = filenameBase.trim() || 'مستند-الطباعة';
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeName}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
