import React, { useState, useMemo } from 'react';
import { Center, Office, sortOfficesMenFirst } from '../types';
import { OfficePairTable } from './StaffTableView';
import {
  Printer,
  Building,
  Layers,
  CheckSquare,
  Square,
  X,
  Check,
  FileSpreadsheet,
  Users,
  ChevronLeft,
} from 'lucide-react';

export type PrintTarget =
  | { mode: 'all' } // طباعة شاملة لكافة المراكز والمكاتب
  | { mode: 'center'; centerId: string; centerName?: string } // طباعة مركز محدد بكل مكاتبه
  | { mode: 'table'; tableId: string } // طباعة جدول محدد (مكتبين معاً أو مؤطري المركز)
  | { mode: 'office'; officeId: string; officeTitle?: string } // طباعة مكتب تصويت واحد بعينه
  | { mode: 'custom'; tableIds: string[] } // طباعة مجموعة جداول محددة يدوياً
  | {
      mode: 'custom_offices';
      centerId: string;
      officeSectionIds: string[];
      layout: 'pair' | 'single'; // مكتبين في صفحة واحدة أو مكتب واحد في كل صفحة
    };

interface PrintSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  centers: Center[];
  allTables: OfficePairTable[]; // All tables across all centers
  displayedTables: OfficePairTable[]; // Currently filtered on screen
  onExecutePrint: (target: PrintTarget) => void;
  initialCenterId?: string;
}

export const PrintSelectionModal: React.FC<PrintSelectionModalProps> = ({
  isOpen,
  onClose,
  centers,
  allTables,
  displayedTables,
  onExecutePrint,
  initialCenterId,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'center' | 'office' | 'custom'>('all');

  // Center mode selection
  const [selectedCenterId, setSelectedCenterId] = useState<string>(
    initialCenterId && initialCenterId !== 'all' ? initialCenterId : centers[0]?.id || ''
  );

  // Office mode selection
  const [officeCenterId, setOfficeCenterId] = useState<string>(
    initialCenterId && initialCenterId !== 'all' ? initialCenterId : centers[0]?.id || ''
  );
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>('');
  const [officePrintScope, setOfficePrintScope] = useState<'single_office' | 'pair_table'>('single_office');

  // Custom multi-select offices mode
  const [customCenterId, setCustomCenterId] = useState<string>(
    initialCenterId && initialCenterId !== 'all' ? initialCenterId : centers[0]?.id || ''
  );
  const [selectedCustomOfficeIds, setSelectedCustomOfficeIds] = useState<string[]>([]);
  const [customLayout, setCustomLayout] = useState<'pair' | 'single'>('pair');

  // Legacy table ids fallback
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);

  // Statistics
  const totalCenters = centers.length;
  const totalOffices = useMemo(() => {
    return centers.reduce((acc, c) => acc + (c.offices?.length || 0), 0);
  }, [centers]);
  const totalStaff = useMemo(() => {
    return allTables.reduce((acc, t) => acc + t.allRows.length, 0);
  }, [allTables]);

  // Tables for the chosen center in Center tab
  const centerTables = useMemo(() => {
    return allTables.filter((t) => t.centerId === selectedCenterId);
  }, [allTables, selectedCenterId]);

  const activeCenter = useMemo(() => {
    return centers.find((c) => c.id === selectedCenterId) || centers[0];
  }, [centers, selectedCenterId]);

  // Offices for Office tab
  const officeCenter = useMemo(() => {
    return centers.find((c) => c.id === officeCenterId) || centers[0];
  }, [centers, officeCenterId]);

  const officeCenterTables = useMemo(() => {
    return allTables.filter((t) => t.centerId === officeCenterId);
  }, [allTables, officeCenterId]);

  // Extract all individual offices & sections for the selected center
  const availableOfficeSections = useMemo(() => {
    const list: {
      sectionId: string;
      title: string;
      tableId: string;
      isCenterStaff: boolean;
      officeNumber?: number;
      memberCount: number;
    }[] = [];

    officeCenterTables.forEach((table) => {
      table.sections.forEach((sec) => {
        list.push({
          sectionId: sec.sectionId,
          title: sec.sectionTitle,
          tableId: table.id,
          isCenterStaff: table.tableType === 'center_staff',
          officeNumber: sec.officeNumber,
          memberCount: sec.rows.length,
        });
      });
    });

    return list;
  }, [officeCenterTables]);

  // Set default selected office if empty
  React.useEffect(() => {
    if (availableOfficeSections.length > 0 && !selectedOfficeId) {
      setSelectedOfficeId(availableOfficeSections[0].sectionId);
    }
  }, [availableOfficeSections, selectedOfficeId]);

  // Custom selection helpers (Legacy tables)
  const handleToggleTable = (tableId: string) => {
    setSelectedTableIds((prev) =>
      prev.includes(tableId) ? prev.filter((id) => id !== tableId) : [...prev, tableId]
    );
  };

  const handleSelectAllCustom = () => {
    setSelectedTableIds(allTables.map((t) => t.id));
  };

  const handleDeselectAllCustom = () => {
    setSelectedTableIds([]);
  };

  // Selected Center for Custom mode
  const selectedCustomCenter = useMemo(() => {
    return centers.find((c) => c.id === customCenterId) || centers[0];
  }, [centers, customCenterId]);

  // Available offices & sections for the chosen center in Custom mode
  const customAvailableOffices = useMemo(() => {
    if (!selectedCustomCenter) return [];

    const list: {
      id: string;
      title: string;
      type: 'center_staff' | 'office';
      officeNumber?: number;
      gender?: 'H' | 'F' | 'M';
      staffCount: number;
      staffFilledCount: number;
    }[] = [];

    // 1. Center staff if present
    if (selectedCustomCenter.centerStaff && selectedCustomCenter.centerStaff.length > 0) {
      const csCount = selectedCustomCenter.centerStaff.length;
      const filledCount = selectedCustomCenter.centerStaff.filter(
        (m) => Boolean(m.firstName?.trim() || m.lastName?.trim())
      ).length;
      list.push({
        id: `${selectedCustomCenter.id}-cs`,
        title: 'طاقم تسيير وإدارة المركز',
        type: 'center_staff',
        staffCount: csCount,
        staffFilledCount: filledCount,
      });
    }

    // 2. Voting offices sorted Men first, then Women
    const sorted = sortOfficesMenFirst(selectedCustomCenter.offices || []);
    sorted.forEach((o) => {
      const staffList = o.staff || [];
      const staffCount = staffList.length || 5;
      const filledCount = staffList.filter((m) =>
        Boolean(m.firstName?.trim() || m.lastName?.trim())
      ).length;
      const genderLabel = o.gender === 'H' ? 'رجال' : o.gender === 'F' ? 'نساء' : 'مختلط';

      list.push({
        id: o.id,
        title: `مكتب التصويت رقم ${String(o.number).padStart(2, '0')} (${genderLabel})`,
        type: 'office',
        officeNumber: o.number,
        gender: o.gender,
        staffCount,
        staffFilledCount: filledCount,
      });
    });

    return list;
  }, [selectedCustomCenter]);

  // Automatically select all offices of the chosen center when center changes or on mount
  React.useEffect(() => {
    if (customAvailableOffices.length > 0) {
      setSelectedCustomOfficeIds(customAvailableOffices.map((o) => o.id));
    } else {
      setSelectedCustomOfficeIds([]);
    }
  }, [customCenterId, customAvailableOffices]);

  // Toggle single custom office
  const handleToggleCustomOffice = (officeId: string) => {
    setSelectedCustomOfficeIds((prev) =>
      prev.includes(officeId) ? prev.filter((id) => id !== officeId) : [...prev, officeId]
    );
  };

  const handleSelectAllCustomOffices = () => {
    setSelectedCustomOfficeIds(customAvailableOffices.map((o) => o.id));
  };

  const handleDeselectAllCustomOffices = () => {
    setSelectedCustomOfficeIds([]);
  };

  // Calculated pages count for custom print
  const totalCalculatedCustomPages = useMemo(() => {
    if (selectedCustomOfficeIds.length === 0) return 0;
    if (customLayout === 'single') {
      return selectedCustomOfficeIds.length;
    }
    return Math.ceil(selectedCustomOfficeIds.length / 2);
  }, [selectedCustomOfficeIds, customLayout]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-white text-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-950">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide">
                خيارات وطباعة الجداول الرسمية (A4 Landscape)
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                حرية مطلقة: طباعة شاملة لكل البلدية، أو حسب المركز، أو حسب المكتب، أو تحديد مخصص
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-xl transition-colors cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs Navigation */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>1. طباعة كلية (شاملة)</span>
          </button>

          <button
            onClick={() => setActiveTab('center')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              activeTab === 'center'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>2. طباعة بالمركز</span>
          </button>

          <button
            onClick={() => setActiveTab('office')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              activeTab === 'office'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>3. طباعة بالمكتب</span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>4. تحديد مخصص ({selectedCustomOfficeIds.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: PRINT ALL */}
          {activeTab === 'all' && (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-emerald-950">
                      طباعة كلية شاملة لكافة مراكز ومكاتب البلدية
                    </h3>
                    <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed font-medium">
                      سيتم إرسال كافة جداول التأطير لجميع المراكز والمكاتب إلى الطابعة مباشرة.
                      يتم تنسيق كل جدول (مكتبين معاً) في ورقة A4 أفقية مستقلة مع الترويسة الرسمية والترقيم المنظم.
                    </p>
                  </div>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-emerald-200">
                  <div className="bg-white p-3 rounded-xl border border-emerald-100 text-center">
                    <div className="text-2xs font-bold text-slate-500">إجمالي المراكز</div>
                    <div className="text-lg font-black text-slate-900">{totalCenters}</div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-100 text-center">
                    <div className="text-2xs font-bold text-slate-500">إجمالي المكاتب</div>
                    <div className="text-lg font-black text-slate-900">{totalOffices}</div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-100 text-center">
                    <div className="text-2xs font-bold text-slate-500">إجمالي الجداول والأوراق</div>
                    <div className="text-lg font-black text-emerald-700">{allTables.length} ورقة</div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-100 text-center">
                    <div className="text-2xs font-bold text-slate-500">إجمالي المؤطرين</div>
                    <div className="text-lg font-black text-slate-900">{totalStaff}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => onExecutePrint({ mode: 'all' })}
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-950/20 cursor-pointer transition-all"
                >
                  <Printer className="w-5 h-5" />
                  <span>طباعة كلية لكافة المراكز والمكاتب الآن ({allTables.length} ورقة)</span>
                </button>

                {displayedTables.length !== allTables.length && (
                  <button
                    type="button"
                    onClick={() =>
                      onExecutePrint({
                        mode: 'custom',
                        tableIds: displayedTables.map((t) => t.id),
                      })
                    }
                    className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-5 bg-slate-800 hover:bg-slate-700 active:scale-98 text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-all"
                    title="طباعة ما هو ظاهر حالياً على الشاشة بعد تطبيق التصفيات"
                  >
                    <span>طباعة المعروض حالياً على الشاشة فقط ({displayedTables.length} ورقة)</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PRINT BY CENTER */}
          {activeTab === 'center' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-2">
                  اختر المركز المراد طباعة جداوله:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1">
                  {centers.map((center) => {
                    const isSelected = center.id === selectedCenterId;
                    const cTables = allTables.filter((t) => t.centerId === center.id);
                    const cStaffCount = cTables.reduce((acc, t) => acc + t.allRows.length, 0);

                    return (
                      <div
                        key={center.id}
                        onClick={() => setSelectedCenterId(center.id)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/80 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            <Building className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-black text-slate-900 truncate">
                              {center.name}
                            </div>
                            <div className="text-2xs text-slate-500 font-medium">
                              رمز المركز: {center.code || '—'} • {center.offices?.length || 0} مكاتب
                            </div>
                          </div>
                        </div>

                        <div className="text-left shrink-0">
                          <span className="text-xs font-black text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                            {cTables.length} أوراق
                          </span>
                          <div className="text-2xs text-slate-500 mt-0.5">{cStaffCount} مؤطر</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Center Preview & Actions */}
              {activeCenter && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="text-xs text-slate-500 font-bold">المركز المحدد:</div>
                      <div className="text-sm sm:text-base font-black text-slate-950">
                        {activeCenter.name}{' '}
                        {activeCenter.code && (
                          <span className="text-xs font-normal text-slate-600">
                            (رمز: {activeCenter.code})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-600">
                      يحتوي على: {centerTables.length} جدول تأطير رسمي
                    </div>
                  </div>

                  {/* Tables List inside this Center */}
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {centerTables.map((t, idx) => (
                      <div
                        key={t.id}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs flex items-center justify-between"
                      >
                        <span className="font-bold text-slate-800">
                          ورقة {idx + 1}: {t.title}
                        </span>
                        <span className="text-2xs font-semibold text-slate-500">
                          {t.allRows.length} مؤطر
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Print Action for Center */}
                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        onExecutePrint({
                          mode: 'center',
                          centerId: activeCenter.id,
                          centerName: activeCenter.name,
                        })
                      }
                      className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-xs sm:text-sm rounded-xl shadow-md cursor-pointer transition-all"
                    >
                      <Printer className="w-4 h-4" />
                      <span>
                        طباعة مركز {activeCenter.name} كاملاً ({centerTables.length} أوراق)
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PRINT BY OFFICE */}
          {activeTab === 'office' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Pick Center */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    1. المركز:
                  </label>
                  <select
                    value={officeCenterId}
                    onChange={(e) => {
                      setOfficeCenterId(e.target.value);
                      setSelectedOfficeId('');
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {centers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.code ? `(رمز: ${c.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Pick Office/Section */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    2. مكتب التصويت أو طاقم المركز:
                  </label>
                  <select
                    value={selectedOfficeId}
                    onChange={(e) => setSelectedOfficeId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {availableOfficeSections.map((sec) => (
                      <option key={sec.sectionId} value={sec.sectionId}>
                        {sec.title} ({sec.memberCount} مؤطر)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Printing Mode for Single Office */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <label className="block text-xs font-black text-slate-800">
                  شكل الورقة المطبوعة:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setOfficePrintScope('single_office')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      officePrintScope === 'single_office'
                        ? 'border-emerald-600 bg-white shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          officePrintScope === 'single_office'
                            ? 'border-emerald-600'
                            : 'border-slate-400'
                        }`}
                      >
                        {officePrintScope === 'single_office' && (
                          <div className="w-2 h-2 rounded-full bg-emerald-600" />
                        )}
                      </div>
                      <span className="text-xs sm:text-sm font-black text-slate-900">
                        طباعة هذا المكتب فقط منفرداً
                      </span>
                    </div>
                    <p className="text-2xs text-slate-500 mt-1.5 pr-6 font-medium">
                      تطبع ورقة رسمية مخصصة فقط لمؤطري هذا المكتب دون مؤطري المكتب الثاني المقترن به.
                    </p>
                  </div>

                  <div
                    onClick={() => setOfficePrintScope('pair_table')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      officePrintScope === 'pair_table'
                        ? 'border-emerald-600 bg-white shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          officePrintScope === 'pair_table'
                            ? 'border-emerald-600'
                            : 'border-slate-400'
                        }`}
                      >
                        {officePrintScope === 'pair_table' && (
                          <div className="w-2 h-2 rounded-full bg-emerald-600" />
                        )}
                      </div>
                      <span className="text-xs sm:text-sm font-black text-slate-900">
                        طباعة جدول المكتبين كاملاً
                      </span>
                    </div>
                    <p className="text-2xs text-slate-500 mt-1.5 pr-6 font-medium">
                      تطبع ورقة الجدول الكاملة التي تحتوي هذا المكتب ومكتب التصويت المقترن معه.
                    </p>
                  </div>
                </div>

                {/* Print Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={!selectedOfficeId}
                    onClick={() => {
                      if (!selectedOfficeId) return;
                      const activeSec = availableOfficeSections.find(
                        (s) => s.sectionId === selectedOfficeId
                      );
                      if (!activeSec) return;

                      if (officePrintScope === 'single_office') {
                        onExecutePrint({
                          mode: 'office',
                          officeId: selectedOfficeId,
                          officeTitle: activeSec.title,
                        });
                      } else {
                        onExecutePrint({
                          mode: 'table',
                          tableId: activeSec.tableId,
                        });
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-xs sm:text-sm rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Printer className="w-4 h-4" />
                    <span>
                      {officePrintScope === 'single_office'
                        ? `طباعة هذا المكتب منفرداً الآن`
                        : `طباعة جدول المكتبين معاً الآن`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOM OFFICES SELECTION (تحديد مخصص حسب المركز والمكاتب) */}
          {activeTab === 'custom' && (
            <div className="space-y-5">
              {/* Step 1: Select Center */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-2">
                    <Building className="w-4 h-4 text-emerald-700" />
                    <span>1. اختر المركز الانتخابي:</span>
                  </label>
                  <span className="text-2xs font-bold text-slate-500">
                    إجمالي المراكز: {centers.length}
                  </span>
                </div>

                <div className="relative">
                  <select
                    value={customCenterId}
                    onChange={(e) => setCustomCenterId(e.target.value)}
                    className="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-black text-slate-900 shadow-xs cursor-pointer transition-all"
                  >
                    {centers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.code ? `(رمز: ${c.code})` : ''} — ({c.offices?.length || 0} مكاتب)
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCustomCenter && (
                  <div className="flex items-center gap-3 sm:gap-6 text-2xs text-slate-600 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 flex-wrap">
                    <div>
                      <span className="font-bold text-slate-500">المركز: </span>
                      <span className="font-black text-slate-900">{selectedCustomCenter.name}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500">عدد المكاتب: </span>
                      <span className="font-black text-emerald-700">{selectedCustomCenter.offices?.length || 0}</span>
                    </div>
                    {selectedCustomCenter.centerStaff && selectedCustomCenter.centerStaff.length > 0 && (
                      <div>
                        <span className="font-bold text-slate-500">طاقم إدارة المركز: </span>
                        <span className="font-black text-blue-700">
                          {selectedCustomCenter.centerStaff.length} مؤطر
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Select Offices to Print */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-emerald-700" />
                    <span>2. حدد مكاتب التصويت المراد طباعتها:</span>
                    <span className="text-2xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      تم تحديد {selectedCustomOfficeIds.length} من أصل {customAvailableOffices.length}
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllCustomOffices}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-200 cursor-pointer transition-colors"
                    >
                      تحديد الكل ({customAvailableOffices.length})
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllCustomOffices}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-lg border border-slate-200 cursor-pointer transition-colors"
                    >
                      إلغاء التحديد
                    </button>
                  </div>
                </div>

                {/* Offices Checkbox Grid */}
                {customAvailableOffices.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    لا توجد مكاتب مسجلة في هذا المركز حالياً.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto p-1">
                    {customAvailableOffices.map((office) => {
                      const isChecked = selectedCustomOfficeIds.includes(office.id);
                      return (
                        <div
                          key={office.id}
                          onClick={() => handleToggleCustomOffice(office.id)}
                          className={`p-3 rounded-xl border-2 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                            isChecked
                              ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="shrink-0 text-emerald-600">
                              {isChecked ? (
                                <CheckSquare className="w-5 h-5 fill-emerald-600 text-white" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-black text-slate-900 truncate">
                                {office.title}
                              </div>
                              <div className="text-2xs text-slate-500 flex items-center gap-2 mt-0.5">
                                <span>{office.staffCount} مؤطرين</span>
                                {office.staffFilledCount > 0 && (
                                  <span className="text-emerald-700 font-bold">
                                    • {office.staffFilledCount} مسجل
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {office.gender && (
                            <span
                              className={`text-2xs font-bold px-2 py-0.5 rounded-md shrink-0 ${
                                office.gender === 'H'
                                  ? 'bg-blue-100 text-blue-800'
                                  : office.gender === 'F'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              {office.gender === 'H' ? 'رجال' : office.gender === 'F' ? 'نساء' : 'مختلط'}
                            </span>
                          )}
                          {office.type === 'center_staff' && (
                            <span className="text-2xs font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 shrink-0">
                              إدارة المركز
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Step 3: Print Layout Format: 2 Offices per page or 1 Office per page */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <label className="block text-xs font-black text-slate-800">
                  3. شكل ونمط الطباعة في الصفحة (A4 Landscape):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: Two offices per page */}
                  <div
                    onClick={() => setCustomLayout('pair')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      customLayout === 'pair'
                        ? 'border-emerald-600 bg-white shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          customLayout === 'pair' ? 'border-emerald-600' : 'border-slate-400'
                        }`}
                      >
                        {customLayout === 'pair' && (
                          <div className="w-2 h-2 rounded-full bg-emerald-600" />
                        )}
                      </div>
                      <span className="text-xs sm:text-sm font-black text-slate-900">
                        مكتبين في صفحة واحدة (A4)
                      </span>
                      <span className="text-2xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full mr-auto">
                        يوفر الورق
                      </span>
                    </div>
                    <p className="text-2xs text-slate-500 mt-2 pr-6 font-medium leading-relaxed">
                      يتم دمج كل مكتبين تم اختيارهما في ورقة A4 أفقية واحدة رسمية (النمط الثنائي المعتمد). وإذا بقي مكتب مفرد يُطبع منفرداً في ورقة.
                    </p>
                  </div>

                  {/* Option 2: One office per page */}
                  <div
                    onClick={() => setCustomLayout('single')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      customLayout === 'single'
                        ? 'border-emerald-600 bg-white shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          customLayout === 'single' ? 'border-emerald-600' : 'border-slate-400'
                        }`}
                      >
                        {customLayout === 'single' && (
                          <div className="w-2 h-2 rounded-full bg-emerald-600" />
                        )}
                      </div>
                      <span className="text-xs sm:text-sm font-black text-slate-900">
                        مكتب واحد فقط في كل صفحة (A4)
                      </span>
                      <span className="text-2xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full mr-auto">
                        مستقل
                      </span>
                    </div>
                    <p className="text-2xs text-slate-500 mt-2 pr-6 font-medium leading-relaxed">
                      يُطبع كل مكتب تم تحديده في ورقة A4 أفقية مستقلة وخاصة به فقط مع ترويسته الرسمية الكاملة.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 4: Summary & Print Button */}
              <div className="pt-1 flex items-center justify-between flex-wrap gap-3 bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-700">
                    تم تحديد:{' '}
                    <span className="font-black text-emerald-800 text-sm">
                      {selectedCustomOfficeIds.length} مكاتب
                    </span>{' '}
                    من مركز <span className="font-black text-slate-900">{selectedCustomCenter?.name}</span>
                  </div>
                  <div className="text-2xs text-slate-600 font-medium">
                    النمط:{' '}
                    <span className="font-bold text-slate-800">
                      {customLayout === 'pair' ? 'مكتبين في صفحة واحدة' : 'مكتب واحد في كل صفحة'}
                    </span>
                    {' • '}
                    الأوراق الناتجة:{' '}
                    <span className="font-black text-emerald-800 text-xs">
                      {totalCalculatedCustomPages} ورقة A4
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={selectedCustomOfficeIds.length === 0}
                  onClick={() =>
                    onExecutePrint({
                      mode: 'custom_offices',
                      centerId: customCenterId,
                      officeSectionIds: selectedCustomOfficeIds,
                      layout: customLayout,
                    })
                  }
                  className="flex items-center justify-center gap-2 py-3 px-6 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-xs sm:text-sm rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-40"
                >
                  <Printer className="w-4 h-4" />
                  <span>
                    طباعة المكاتب المحددة ({totalCalculatedCustomPages} ورقة A4)
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-2xs text-slate-500 font-medium">
          <div>
            تتم الطباعة تلقائياً بصيغة <span className="font-bold text-slate-700">A4 Landscape</span> مع الترويسة الرسمية لكل ورقة.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg cursor-pointer transition-all"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
