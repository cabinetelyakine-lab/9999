import React, { useState, useMemo } from 'react';
import { Center, CENTER_ROLES, OFFICE_ROLES, SearchResultItem, StaffMember } from '../types';
import { filterStaffMembers } from '../utils/search';
import { ELECTION_STAFF_IMG } from '../data/initialData';
import { isSupervisorCode, setSupervisorStatus } from '../utils/security';
import {
  ArrowRight,
  Search,
  User,
  Building,
  Phone,
  Calendar,
  Filter,
  X,
  Check,
  Edit2,
  PhoneCall,
  FileSpreadsheet,
  Users,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Printer,
  FileText,
  AlertTriangle,
  GraduationCap,
  BookOpen,
  Briefcase,
  Lock,
  ShieldCheck,
  ShieldAlert,
  LogOut,
} from 'lucide-react';
import { MemberEditModal } from './MemberEditModal';
import { StaffRegistrationFormModal } from './StaffRegistrationFormModal';

interface SearchViewProps {
  centers: Center[];
  onUpdateCenters: (centers: Center[]) => void;
  onBackToHome: () => void;
  onNavigateToStaffing: (centerId?: string) => void;
  onNavigateToStaffTable?: (centerId?: string) => void;
  initialCenterId?: string;
  isSupervisor?: boolean;
  onSetSupervisor?: (status: boolean) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  centers,
  onUpdateCenters,
  onBackToHome,
  onNavigateToStaffing,
  onNavigateToStaffTable,
  initialCenterId,
  isSupervisor = false,
  onSetSupervisor,
}) => {
  const [nameQuery, setNameQuery] = useState('');
  const [roleQuery, setRoleQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'rejected' | 'accepted'>('all');
  const [justActivatedSupervisor, setJustActivatedSupervisor] = useState(false);
  const [selectedCenterId, setSelectedCenterId] = useState<string>(
    initialCenterId || 'all'
  );
  const [scopeType, setScopeType] = useState<'all' | 'specific'>(
    initialCenterId && initialCenterId !== 'all' ? 'specific' : 'all'
  );

  // Modal editing
  const [editingItem, setEditingItem] = useState<SearchResultItem | null>(null);

  // Registration Form Modal State
  const [isRegistrationFormOpen, setIsRegistrationFormOpen] = useState(false);
  const [formModalMember, setFormModalMember] = useState<StaffMember | null>(null);
  const [formModalCenterId, setFormModalCenterId] = useState<string | undefined>(undefined);
  const [formModalOfficeId, setFormModalOfficeId] = useState<string | undefined>(undefined);

  const handleOpenForm = (member: StaffMember, centerId?: string, officeId?: string) => {
    setFormModalMember(member);
    setFormModalCenterId(centerId);
    setFormModalOfficeId(officeId);
    setIsRegistrationFormOpen(true);
  };

  // Calculate total rejected staff count in current scope
  const rejectedCount = useMemo(() => {
    let count = 0;
    centers.forEach((c) => {
      if (scopeType === 'specific' && selectedCenterId !== 'all' && c.id !== selectedCenterId) {
        return;
      }
      c.centerStaff.forEach((m) => {
        if (
          m.notesStatus === 'rejected' ||
          (m.notes && (m.notes.includes('مرفوض') || m.notes.includes('رفض') || m.notes.includes('عدم قبول')))
        ) {
          count++;
        }
      });
      c.offices.forEach((off) => {
        off.staff.forEach((m) => {
          if (
            m.notesStatus === 'rejected' ||
            (m.notes && (m.notes.includes('مرفوض') || m.notes.includes('رفض') || m.notes.includes('عدم قبول')))
          ) {
            count++;
          }
        });
      });
    });
    return count;
  }, [centers, scopeType, selectedCenterId]);

  // Gradual back navigation from Search View (خطوة بخطوة)
  const handleGradualBackFromSearch = () => {
    if (editingItem) {
      // Step 1: close item edit modal if open
      setEditingItem(null);
    } else if (isRegistrationFormOpen) {
      // Step 2: close registration form modal if open
      setIsRegistrationFormOpen(false);
    } else if (statusFilter !== 'all') {
      // Step 3: clear status filter
      setStatusFilter('all');
    } else if (nameQuery.trim()) {
      // Step 4: clear text name query first
      setNameQuery('');
    } else if (roleQuery.trim()) {
      // Step 5: clear selected role filter
      setRoleQuery('');
    } else if (scopeType === 'specific' && (!initialCenterId || initialCenterId === 'all')) {
      // Step 6: reset scope to all centers
      setScopeType('all');
      setSelectedCenterId('all');
    } else if (initialCenterId && initialCenterId !== 'all') {
      // Step 7: return to that specific center's staffing view
      onNavigateToStaffing(initialCenterId);
    } else {
      // Step 8: return to Home
      onBackToHome();
    }
  };

  const searchBackLabel = editingItem
    ? 'إغلاق التعديل'
    : isRegistrationFormOpen
    ? 'إغلاق الاستمارة'
    : statusFilter !== 'all'
    ? 'رجوع (إلغاء تصفية المرفوضين)'
    : nameQuery.trim()
    ? 'رجوع (مسح الاسم)'
    : roleQuery.trim()
    ? 'رجوع (مسح المنصب)'
    : scopeType === 'specific' && (!initialCenterId || initialCenterId === 'all')
    ? 'رجوع (كافة المراكز)'
    : initialCenterId && initialCenterId !== 'all'
    ? 'رجوع للمركز'
    : 'الرئيسية';

  const handleSaveFormMember = (updatedMember: StaffMember, centerId: string, officeId?: string) => {
    let memberFound = false;

    let updatedCenters = centers.map((c) => {
      let changedCenter = false;
      const newCenterStaff = c.centerStaff.map((m) => {
        if (m.id === updatedMember.id) {
          memberFound = true;
          changedCenter = true;
          return { ...m, ...updatedMember };
        }
        return m;
      });

      let changedOffice = false;
      const newOffices = c.offices.map((off) => {
        const newStaff = off.staff.map((m) => {
          if (m.id === updatedMember.id) {
            memberFound = true;
            changedOffice = true;
            return { ...m, ...updatedMember };
          }
          return m;
        });
        return changedOffice ? { ...off, staff: newStaff } : off;
      });

      if (changedCenter || changedOffice) {
        return {
          ...c,
          centerStaff: newCenterStaff,
          offices: newOffices,
        };
      }
      return c;
    });

    if (!memberFound) {
      const targetCId = centerId || centers[0]?.id;
      updatedCenters = updatedCenters.map((c) => {
        if (c.id !== targetCId) return c;

        if (officeId) {
          return {
            ...c,
            offices: c.offices.map((off) => {
              if (off.id !== officeId) return off;
              // 1. First look for matching empty slot with same role
              const matchingRoleEmptyIdx = off.staff.findIndex(
                (m) => (!m.firstName && !m.lastName) && m.role === updatedMember.role
              );
              // 2. Otherwise look for any empty slot
              const emptyIdx = matchingRoleEmptyIdx >= 0
                ? matchingRoleEmptyIdx
                : off.staff.findIndex((m) => (!m.firstName && !m.lastName) || m.id === updatedMember.id);

              if (emptyIdx >= 0) {
                const newStaff = [...off.staff];
                newStaff[emptyIdx] = {
                  ...newStaff[emptyIdx],
                  ...updatedMember,
                  role: updatedMember.role || newStaff[emptyIdx].role,
                };
                return { ...off, staff: newStaff };
              }
              return { ...off, staff: [...off.staff, updatedMember] };
            }),
          };
        } else {
          // 1. Look for matching role empty slot in center
          const matchingRoleEmptyIdx = c.centerStaff.findIndex(
            (m) => (!m.firstName && !m.lastName) && m.role === updatedMember.role
          );
          const emptyIdx = matchingRoleEmptyIdx >= 0
            ? matchingRoleEmptyIdx
            : c.centerStaff.findIndex((m) => (!m.firstName && !m.lastName) || m.id === updatedMember.id);

          if (emptyIdx >= 0) {
            const newCenterStaff = [...c.centerStaff];
            newCenterStaff[emptyIdx] = {
              ...newCenterStaff[emptyIdx],
              ...updatedMember,
              role: updatedMember.role || newCenterStaff[emptyIdx].role,
            };
            return { ...c, centerStaff: newCenterStaff };
          }
          return {
            ...c,
            centerStaff: [...c.centerStaff, updatedMember],
          };
        }
      });
    }

    onUpdateCenters(updatedCenters);
  };

  // Common role suggestions for rapid 1-click filter with strict position isolation
  const allKnownRoles = useMemo(() => {
    return [
      'رئيس مركز',
      'رئيس مكتب',
      'نائب رئيس مكتب',
      'كاتب',
      'مساعد أول',
      'مساعد ثاني',
      'مساعد ثالث',
      'مساعد رابع',
      'ممثل السلطة',
      'إضافي أول',
      'إضافي ثاني',
    ];
  }, []);

  // Compute search results with bidirectional name matching, scope filtering & status filter
  const results = useMemo(() => {
    return filterStaffMembers(centers, {
      nameQuery,
      roleQuery,
      selectedCenterId: scopeType === 'all' ? 'all' : selectedCenterId,
      statusFilter,
    });
  }, [centers, nameQuery, roleQuery, scopeType, selectedCenterId, statusFilter]);

  // Handle saving member from search view modal
  const handleSaveMember = (updatedMember: StaffMember) => {
    if (!editingItem) return;

    const newCenters = centers.map((c) => {
      if (c.id !== editingItem.centerId) return c;

      if (editingItem.type === 'center_staff') {
        return {
          ...c,
          centerStaff: c.centerStaff.map((m) =>
            m.id === updatedMember.id ? updatedMember : m
          ),
        };
      } else {
        return {
          ...c,
          offices: c.offices.map((off) => {
            if (off.id !== editingItem.officeId) return off;
            return {
              ...off,
              staff: off.staff.map((m) =>
                m.id === updatedMember.id ? updatedMember : m
              ),
            };
          }),
        };
      }
    });

    onUpdateCenters(newCenters);
    // Update local editing item view
    setEditingItem({
      ...editingItem,
      member: updatedMember,
    });
  };

  const handleClearFilters = () => {
    setNameQuery('');
    setRoleQuery('');
    setSelectedCenterId('all');
    setScopeType('all');
    setStatusFilter('all');
  };

  // Export results to CSV
  const handleExportCSV = () => {
    const headers = [
      'الرقم',
      'الاسم',
      'اللقب',
      'المنصب',
      'المركز',
      'المكتب/المستوى',
      'تاريخ الميلاد',
      'رقم الهاتف',
      'الحالة',
      'ملاحظات',
    ];

    const rows = results.map((item, index) => {
      const isRej =
        item.member.notesStatus === 'rejected' ||
        (item.member.notes &&
          (item.member.notes.includes('مرفوض') || item.member.notes.includes('رفض')));
      const isAcc =
        item.member.notesStatus === 'accepted' ||
        (item.member.notes &&
          (item.member.notes.includes('مقبول') || item.member.notes.includes('قبول')));

      const statusText = isRej ? 'مرفوض' : isAcc ? 'مقبول' : '—';

      return [
        index + 1,
        `"${item.member.firstName}"`,
        `"${item.member.lastName}"`,
        `"${item.member.role}"`,
        `"${item.centerName}"`,
        `"${
          item.officeName
            ? `${item.officeName} (${item.officeGender === 'H' ? 'H رجال' : 'F نساء'})`
            : 'طاقم المركز'
        }"`,
        `"${item.member.birthDate || ''}"`,
        `"${item.member.phone || ''}"`,
        `"${statusText}"`,
        `"${item.member.notes || ''}"`,
      ];
    });

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `${statusFilter === 'rejected' ? 'قائمة_المرفوضين' : 'نتائج_البحث_المؤطرين'}_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="search-view-root" className="min-h-screen bg-[#7fa534] text-slate-100 pb-16">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-[#5f8021]/95 backdrop-blur-md border-b border-[#9bc447]/60 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            id="back-to-home-from-search-btn"
            onClick={handleGradualBackFromSearch}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-black transition-all border-2 border-red-300 shadow-md shadow-red-900/30 cursor-pointer"
            title="الرجوع خطوة للوراء"
          >
            <ArrowRight className="w-4 h-4 text-white font-black" />
            <span>{searchBackLabel}</span>
          </button>
          <div className="h-5 w-px bg-slate-700 mx-1 hidden sm:block" />
          <h1 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
            <span className="text-blue-400">البحث</span>
          </h1>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onNavigateToStaffTable && (
            <button
              id="goto-staff-table-from-search-btn"
              onClick={() =>
                onNavigateToStaffTable(
                  scopeType === 'specific' && selectedCenterId !== 'all'
                    ? selectedCenterId
                    : undefined
                )
              }
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950 hover:bg-emerald-900 active:scale-95 text-emerald-300 rounded-xl text-xs sm:text-sm font-black transition-all border-2 border-emerald-400 shadow-md cursor-pointer"
              title="عرض وطباعة جدول المؤطرين الرسمي"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">جدول المؤطرين (طباعة)</span>
              <span className="sm:hidden">الجدول</span>
            </button>
          )}

          {isSupervisor && (
            <button
              type="button"
              id="search-header-supervisor-logout-btn"
              onClick={() => {
                setSupervisorStatus(false);
                onSetSupervisor?.(false);
                setJustActivatedSupervisor(false);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/90 hover:bg-rose-900 active:scale-95 text-rose-200 hover:text-white border-2 border-rose-500/80 rounded-xl text-xs sm:text-sm font-black shadow-md shadow-rose-950/30 transition-all cursor-pointer"
              title="تسجيل الخروج من وضع المشرف والعودة لوضع العرض فقط"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
              <span>خروج المشرف</span>
            </button>
          )}

          <button
            id="goto-staffing-from-search-btn"
            onClick={() => onNavigateToStaffing()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition-colors border border-slate-700/60"
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">التأطير</span>
          </button>

          {results.length > 0 && (
            <button
              id="export-csv-btn"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-emerald-600/20"
              title="تصدير النتائج كملف Excel / CSV"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير CSV / Excel</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Search & Filters Card */}
        <div className="no-print bg-sky-100/95 border-2 border-sky-400 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          {/* Scope & Rejection Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-sky-200">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-950" />
              <span className="text-sm font-black text-blue-950">نطاق وتصفية البحث:</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Radio 1: بحث شامل */}
              <button
                id="scope-all-btn"
                onClick={() => {
                  setScopeType('all');
                  setSelectedCenterId('all');
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                  scopeType === 'all'
                    ? 'bg-blue-950 text-white border-blue-900 shadow-md shadow-blue-950/20'
                    : 'bg-white text-slate-800 border-sky-300 hover:bg-sky-50'
                }`}
              >
                <span>بحث شامل (كافة المراكز)</span>
              </button>

              {/* Radio 2: يشمل المركز فقط */}
              <button
                id="scope-specific-btn"
                onClick={() => {
                  setScopeType('specific');
                  if (selectedCenterId === 'all' && centers[0]) {
                    setSelectedCenterId(centers[0].id);
                  }
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                  scopeType === 'specific'
                    ? 'bg-blue-950 text-white border-blue-900 shadow-md shadow-blue-950/20'
                    : 'bg-white text-slate-800 border-sky-300 hover:bg-sky-50'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>يشمل مركز محدد فقط</span>
              </button>

              {/* Center Dropdown if specific */}
              {scopeType === 'specific' && (
                <select
                  id="specific-center-select"
                  value={selectedCenterId}
                  onChange={(e) => setSelectedCenterId(e.target.value)}
                  style={{ color: '#FFFFFF' }}
                  className="px-4 py-2.5 bg-[#102a5c] border-2 border-blue-400 rounded-xl text-sm sm:text-base font-black text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all shadow-inner"
                >
                  {centers.map((center) => (
                    <option key={center.id} value={center.id} className="bg-[#102a5c] text-white">
                      {center.name} ({center.code || ''})
                    </option>
                  ))}
                </select>
              )}

              {/* RED CIRCLE WITH CROSS BUTTON: تخصيص دائرة حمراء بداخلها علامة الضرب لتصفية قائمة المرفوضين */}
              <button
                id="filter-rejected-staff-btn"
                type="button"
                onClick={() => setStatusFilter((prev) => (prev === 'rejected' ? 'all' : 'rejected'))}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2.5 border-2 cursor-pointer select-none active:scale-95 shadow-md ${
                  statusFilter === 'rejected'
                    ? 'bg-rose-700 text-white border-rose-300 ring-4 ring-rose-400/40 shadow-rose-950/40'
                    : 'bg-white hover:bg-rose-50 text-slate-900 border-rose-400 hover:border-rose-500'
                }`}
                title="الضغط لعرض قائمة المؤطرين المرفوضين (بطاقاتهم التأطيرية)"
              >
                {/* Red Circle with Cross ('X') */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center text-white shrink-0 transition-transform ${
                    statusFilter === 'rejected' ? 'scale-110 shadow-lg ring-2 ring-rose-300' : 'shadow-sm'
                  }`}
                >
                  <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[3.5]" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold">قائمة المرفوضين</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-black ${
                      statusFilter === 'rejected'
                        ? 'bg-white text-rose-700 shadow-sm'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {rejectedCount}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Search Input: الاسم واللقب، المستوى الدراسي، والتخصص */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-base font-extrabold text-blue-950 flex items-center gap-1.5">
                <User className="w-5 h-5 text-blue-950" />
                البحث بالاسم واللقب (أو العكس) • المستوى الدراسي • التخصص
              </label>
              {(nameQuery.trim() || roleQuery.trim() || scopeType === 'specific' || statusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={handleGradualBackFromSearch}
                  className="flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-lg text-xs font-black border border-red-300 shadow-sm transition-all cursor-pointer"
                  title="الرجوع خطوة للوراء في البحث"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-white font-bold" />
                  <span>{searchBackLabel}</span>
                </button>
              )}
            </div>
            <div className="relative">
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300 pointer-events-none">
                <Search className="w-6 h-6 text-blue-300" />
              </div>
              <input
                id="search-name-input"
                type="text"
                placeholder="اكتب الاسم واللقب، أو المستوى (ليسانس/ماستر)، أو التخصص (حقوق/إعلام)..."
                value={nameQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  if (isSupervisorCode(val)) {
                    setSupervisorStatus(true);
                    onSetSupervisor?.(true);
                    setJustActivatedSupervisor(true);
                    setNameQuery(''); // إخفاء ومسح الرمز السري فوراً من خانة البحث
                    return;
                  }
                  setNameQuery(val);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isSupervisorCode(nameQuery)) {
                    e.preventDefault();
                    setSupervisorStatus(true);
                    onSetSupervisor?.(true);
                    setJustActivatedSupervisor(true);
                    setNameQuery(''); // إخفاء ومسح الرمز السري فوراً
                  }
                }}
                style={{ color: '#FFFFFF' }}
                className="w-full pr-12 pl-24 py-4 bg-[#102a5c] border-2 border-blue-400 rounded-2xl text-xl sm:text-2xl font-black text-white !text-white placeholder:text-blue-200/70 focus:bg-[#163674] focus:outline-none focus:ring-4 focus:ring-blue-400/40 focus:border-cyan-300 transition-all shadow-inner selection:bg-blue-600 selection:text-white"
              />
              {nameQuery && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setNameQuery('');
                      setJustActivatedSupervisor(false);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl text-xs font-black border border-red-300 shadow-md transition-all cursor-pointer"
                    title="مسح البحث"
                  >
                    <ArrowRight className="w-3.5 h-3.5 font-bold" />
                    <span>رجوع</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Filter Suggestion Chips (المستوى الدراسي والتخصص والمناصب) */}
          <div className="space-y-2 pt-2 border-t border-sky-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">اقتراحات سريعة (المستوى الدراسي والتخصص):</span>
              {nameQuery && (
                <span className="text-2xs font-bold text-white bg-blue-950 px-2 py-0.5 rounded-md border border-blue-900 flex items-center gap-1">
                  <span>البحث الحالي: {nameQuery}</span>
                  <button
                    type="button"
                    onClick={() => setNameQuery('')}
                    className="hover:text-amber-300 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { label: '🎓 ليسانس', query: 'ليسانس' },
                { label: '🎓 ماستر', query: 'ماستر' },
                { label: '⚙️ مهندس', query: 'مهندس' },
                { label: '🎓 دكتوراه', query: 'دكتوراه' },
                { label: '⚖️ حقوق وقانون', query: 'حقوق' },
                { label: '💻 إعلام آلي', query: 'إعلام آلي' },
                { label: '📊 علوم اقتصادية', query: 'اقتصاد' },
                { label: '📚 قطاع التعليم', query: 'تعليم' },
                { label: '🏛️ إدارة محلية', query: 'إدارة' },
              ].map((chip) => {
                const isSelected = nameQuery.includes(chip.query);
                return (
                  <button
                    key={chip.query}
                    type="button"
                    onClick={() => setNameQuery(isSelected ? '' : chip.query)}
                    className={`text-xs px-3 py-1.5 rounded-xl transition-all border font-semibold cursor-pointer ${
                      isSelected
                        ? 'bg-blue-950 text-white border-blue-900 font-bold shadow-sm'
                        : 'bg-white text-slate-800 border-sky-300 hover:border-sky-400 hover:bg-sky-50'
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>

            {/* Role Filter Chips */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-slate-700">تصفية المناصب:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {allKnownRoles.map((role) => {
                const isSelected = roleQuery.trim() === role.trim();
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setRoleQuery(isSelected ? '' : role)}
                    className={`text-xs px-3 py-1.5 rounded-xl transition-all border font-semibold cursor-pointer ${
                      isSelected
                        ? 'bg-blue-950 text-white border-blue-900 font-bold shadow-sm'
                        : 'bg-white text-slate-800 border-sky-300 hover:border-sky-400 hover:bg-sky-50'
                    }`}
                  >
                    {role}
                  </button>
                );
              })}

              {(nameQuery || roleQuery || scopeType !== 'all' || statusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs px-3 py-1.5 text-rose-700 hover:text-rose-800 bg-white hover:bg-rose-50 rounded-xl transition-colors border border-rose-300 mr-auto font-bold cursor-pointer"
                >
                  إعادة ضبط الكل
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Active Rejection Banner when statusFilter === 'rejected' */}
        {statusFilter === 'rejected' && (
          <div className="bg-rose-900/95 border-2 border-rose-400 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white shadow-xl backdrop-blur-md animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center shrink-0 shadow-md">
                <X className="w-6 h-6 stroke-[3.5] text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  قائمة المؤطرين المرفوضين ({results.length} مؤطر)
                </h3>
                <p className="text-xs text-rose-200">
                  تظهر أدناه البطاقات التأطيرية لكافة المؤطرين المرفوضين مع إمكانية تعديل بياناتهم أو فتح استماراتهم.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className="px-4 py-2 bg-white hover:bg-rose-50 active:scale-95 text-rose-700 text-xs sm:text-sm font-black rounded-xl border border-rose-300 shadow-sm transition-all self-start sm:self-center cursor-pointer"
            >
              إلغاء التصفية وعرض الكل
            </button>
          </div>
        )}

        {/* Results Header / Stats */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-400" />
            <h2 className="text-base sm:text-lg font-black text-white">
              {statusFilter === 'rejected' ? 'قائمة المؤطرين المرفوضين' : 'نتائج البحث'} ({results.length} مؤطر)
            </h2>
            {scopeType === 'specific' && (
              <span className="text-xs text-blue-300 bg-blue-950/60 border border-blue-800/60 px-2.5 py-1 rounded-lg">
                ضمن مركز:{' '}
                {centers.find((c) => c.id === selectedCenterId)?.name || ''}
              </span>
            )}
          </div>
        </div>

        {/* Printable Results Table (Only in print) */}
        <div className="print-only hidden">
          <div className="text-center border-b-2 border-slate-900 pb-4 mb-4">
            <h1 className="text-lg font-bold">السلطة الوطنية المستقلة للانتخابات</h1>
            <h2 className="text-base font-bold">
              {statusFilter === 'rejected' ? 'قائمة المؤطرين المرفوضين' : 'قائمة نتائج البحث عن المؤطرين'}
            </h2>
            <p className="text-xs text-slate-600">تاريخ الطباعة: {new Date().toLocaleDateString('ar-DZ')}</p>
          </div>
          <table className="w-full text-xs text-right border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-2 border border-slate-300">الرقم</th>
                <th className="p-2 border border-slate-300">الاسم واللقب</th>
                <th className="p-2 border border-slate-300">المنصب</th>
                <th className="p-2 border border-slate-300">المركز</th>
                <th className="p-2 border border-slate-300">المكتب</th>
                <th className="p-2 border border-slate-300">تاريخ الميلاد</th>
                <th className="p-2 border border-slate-300">رقم الهاتف</th>
                <th className="p-2 border border-slate-300">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item, idx) => (
                <tr key={item.member.id}>
                  <td className="p-2 border border-slate-300 text-center">{idx + 1}</td>
                  <td className="p-2 border border-slate-300 font-bold">{item.member.firstName} {item.member.lastName}</td>
                  <td className="p-2 border border-slate-300">{item.member.role}</td>
                  <td className="p-2 border border-slate-300">{item.centerName}</td>
                  <td className="p-2 border border-slate-300">{item.officeName || 'طاقم المركز'}</td>
                  <td className="p-2 border border-slate-300">{item.member.birthDate || '—'}</td>
                  <td className="p-2 border border-slate-300">{item.member.phone || '—'}</td>
                  <td className="p-2 border border-slate-300 font-bold">
                    {item.member.notesStatus === 'rejected' ? 'مرفوض' : item.member.notesStatus === 'accepted' ? 'مقبول' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Staffing Cards Grid (البطاقات التأطيرية للمؤطرين) */}
        {results.length > 0 ? (
          <div className="no-print grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((item) => {
              const { member, centerName, officeName, officeGender } = item;
              const hasName = Boolean(member.firstName?.trim() || member.lastName?.trim());
              const fullName = hasName
                ? `${member.firstName || ''} ${member.lastName || ''}`.trim()
                : '— منصب شاغر —';

              const isRejected =
                member.notesStatus === 'rejected' ||
                (member.notes &&
                  (member.notes.includes('مرفوض') ||
                    member.notes.includes('رفض') ||
                    member.notes.includes('عدم قبول')));

              const isAccepted =
                member.notesStatus === 'accepted' ||
                (member.notes &&
                  (member.notes.includes('مقبول') ||
                    member.notes.includes('قبول') ||
                    member.notes.includes('مؤكد')));

              const cardKey = `${item.centerId}_${item.officeId || 'c'}_${member.id}`;

              return (
                <div
                  key={cardKey}
                  id={`staff-card-${cardKey}`}
                  onClick={() => setEditingItem(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setEditingItem(item);
                  }}
                  className="group cursor-pointer rounded-xl select-none shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between min-h-[160px] p-4 sm:p-5 bg-white text-black border-0 border-none outline-none"
                >
                  {/* Card Content */}
                  <div className="flex flex-col justify-between flex-1 space-y-3">
                    {/* Top: Location Line & Role Badge with Action Buttons */}
                    <div className="space-y-2">
                      {/* Location: Center & Office */}
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                          <Building className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          <span className="truncate max-w-[160px] sm:max-w-[210px]" title={centerName}>
                            {centerName}
                          </span>
                          {officeName && (
                            <>
                              <span className="text-slate-400">•</span>
                              <span className="text-black font-extrabold">{officeName}</span>
                              {officeGender && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded font-black ${
                                    officeGender === 'H' ? 'bg-blue-100 text-blue-900' : 'bg-rose-100 text-rose-900'
                                  }`}
                                >
                                  {officeGender === 'H' ? 'H' : 'F'}
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        {/* Go to Center Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToStaffing(item.centerId);
                          }}
                          className="p-1 px-2 rounded-md hover:bg-slate-100 text-slate-600 hover:text-black transition-colors text-xs font-bold cursor-pointer flex items-center gap-1"
                          title="الانتقال لجدول التأطير في هذا المركز"
                        >
                          <span>المركز</span>
                          <ArrowRight className="w-3 h-3 rotate-180" />
                        </button>
                      </div>

                      {/* Role + Actions */}
                      <div className="flex items-center justify-between gap-1.5">
                        <h4 className="text-sm sm:text-base font-black text-black leading-tight">
                          {member.role}
                        </h4>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenForm(item.member, item.centerId, item.officeId);
                            }}
                            className="p-1 sm:p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-black transition-colors cursor-pointer"
                            title="معاينة وطباعة استمارة هذا المؤطر"
                          >
                            <Printer className="w-4 h-4 text-black" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingItem(item);
                            }}
                            className="p-1 sm:p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-black transition-colors cursor-pointer"
                            title="تعديل بيانات المؤطر"
                          >
                            <Edit2 className="w-4 h-4 text-black" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Full Name in bold black text */}
                    <div className="py-1">
                      <p className="text-base sm:text-lg md:text-xl font-black text-black leading-tight">
                        {fullName}
                      </p>
                      {item.matchReason && nameQuery && (
                        <span className="text-[10px] font-bold text-slate-600 block mt-0.5">
                          مطابقة: {item.matchReason}
                        </span>
                      )}
                    </div>

                    {/* Additional details - BirthDate, Phone, & Notes */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      {member.birthDate && (
                        <span className="text-xs sm:text-sm font-mono font-bold text-black">
                          {member.birthDate}
                        </span>
                      )}

                      {member.phone && (
                        <a
                          href={`tel:${member.phone.replace(/\s+/g, '')}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-black hover:underline text-xs sm:text-sm font-bold mr-auto cursor-pointer"
                          title="اتصال مباشر بالمؤطر"
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-black shrink-0" />
                          <span>{member.phone}</span>
                        </a>
                      )}

                      {(member.notes || member.notesStatus || isRejected) && (
                        <div className="w-full flex items-center gap-1.5 text-xs text-black pt-0.5">
                          {member.notesStatus === 'accepted' && (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold shrink-0">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>مقبول</span>
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 text-rose-700 font-bold shrink-0">
                              <X className="w-3.5 h-3.5 stroke-[3]" />
                              <span>مرفوض</span>
                            </span>
                          )}
                          {member.notes && (
                            <span className="font-semibold text-black truncate max-w-full">
                              {member.notes}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-800/50 border border-dashed border-slate-700 rounded-2xl p-12 text-center space-y-3">
            <Search className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">
              {statusFilter === 'rejected'
                ? 'لا يوجد أي مؤطر مرفوض حالياً'
                : 'لا توجد نتائج مطابقة لمعايير البحث'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {statusFilter === 'rejected'
                ? 'لم يتم تحديد حالة الرفض أو تسجيل ملاحظات رفض لأي مؤطر ضمن النطاق المحدد.'
                : 'تأكد من كتابة الاسم أو اللقب بشكل صحيح أو جرب اختيار منصب من الاقتراحات أعلاه.'}
            </p>
            <button
              onClick={handleClearFilters}
              className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors border border-slate-700 cursor-pointer"
            >
              عرض كافة المؤطرين
            </button>
          </div>
        )}
      </main>

      {/* Member Edit Modal */}
      <MemberEditModal
        isOpen={!!editingItem}
        member={editingItem?.member || null}
        isSupervisor={isSupervisor}
        locationInfo={
          editingItem
            ? {
                centerName: editingItem.centerName,
                officeName: editingItem.officeName,
              }
            : undefined
        }
        onSave={handleSaveMember}
        onOpenForm={(mem) => {
          if (editingItem) {
            handleOpenForm(mem, editingItem.centerId, editingItem.officeId);
          }
        }}
        onClose={() => setEditingItem(null)}
      />

      {/* Staff Registration Form Modal */}
      <StaffRegistrationFormModal
        isOpen={isRegistrationFormOpen}
        onClose={() => {
          setIsRegistrationFormOpen(false);
          setFormModalMember(null);
        }}
        centers={centers}
        initialMember={formModalMember}
        initialCenterId={formModalCenterId}
        initialOfficeId={formModalOfficeId}
        onSaveMember={handleSaveFormMember}
      />
    </div>
  );
};
