import React, { useState, useMemo, useRef } from 'react';
import { Center, Office, StaffMember, sortOfficesMenFirst } from '../types';
import {
  Printer,
  ArrowRight,
  Download,
  Building,
  Filter,
  Sparkles,
  Edit3,
  Check,
  Save,
  Users,
  FileSpreadsheet,
  Hash,
  ListOrdered,
  Layers,
  ChevronDown,
  ChevronUp,
  Pin,
  Unlock,
  SlidersHorizontal,
  LogOut,
  FileText,
  X,
} from 'lucide-react';
import { AnieLogo } from './AnieLogo';
import { getMemberLatinFirstName, getMemberLatinLastName, arabicToLatin } from '../utils/transliteration';
import { PrintSelectionModal, PrintTarget } from './PrintSelectionModal';
import { PrintChoiceModal } from './PrintChoiceModal';
import { PrintPreviewModal } from './PrintPreviewModal';
import { exportPrintableAsWord } from '../utils/exportWord';

export interface TableRowData {
  rowNumber: number;
  orderNumber: string; // الرقم القابل للتعديل حتى 4 أرقام (0001 - 9999 أو 001 - 999)
  centerId: string;
  centerName: string;
  centerCode?: string;
  officeId?: string;
  officeName?: string;
  officeNumber?: number;
  officeGender?: 'H' | 'F';
  isCenterStaff: boolean;
  memberId: string;
  role: string;
  roleOrder: number;
  firstName: string;
  lastName: string;
  latinFirstName: string;
  latinLastName: string;
  birthDate: string;
  birthCommune: string;
  votingPlace: string; // مكان الانتخاب
  phone: string;
  originalMember: StaffMember;
}

export interface OfficePairTable {
  id: string;
  centerId: string;
  centerName: string;
  centerCode?: string;
  tableType: 'center_staff' | 'offices_pair';
  tableIndex: number;
  title: string;
  subtitle: string;
  office1?: Office;
  office2?: Office;
  sections: {
    sectionId: string;
    sectionTitle: string;
    officeNumber?: number;
    gender?: 'H' | 'F';
    rows: TableRowData[];
  }[];
  allRows: TableRowData[];
}

interface StaffTableViewProps {
  centers: Center[];
  onUpdateCenters: (updatedCenters: Center[]) => void;
  onBack: () => void;
  initialCenterId?: string | null;
  isSupervisor?: boolean;
  onSetSupervisor?: (status: boolean) => void;
}

export const StaffTableView: React.FC<StaffTableViewProps> = ({
  centers,
  onUpdateCenters,
  onBack,
  initialCenterId = null,
  isSupervisor = false,
  onSetSupervisor,
}) => {
  // Center Filter ('all' or specific centerId)
  const [selectedCenterId, setSelectedCenterId] = useState<string>(initialCenterId || 'all');

  // Specific Table Filter within Center ('all' or specific tableId)
  const [selectedTableFilter, setSelectedTableFilter] = useState<string>('all');

  // Table Type Filter: 'all' = الكل | 'center_staff' = مؤطري المراكز | 'offices' = مكاتب التصويت
  const [tableTypeFilter, setTableTypeFilter] = useState<'all' | 'center_staff' | 'offices'>('all');

  // Role Filter ('all' or specific role name)
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Show only registered staff or also vacant slots
  const [showOnlyFilled, setShowOnlyFilled] = useState<boolean>(true);

  // Numbering mode: 'per_table' (starts at 0001 for each 2-office table) or 'continuous' (starts at 0001 and counts up across the center)
  const [numberingMode, setNumberingMode] = useState<'per_table' | 'continuous'>('per_table');

  // Digits format: 4 digits (0001 - 9999) or 3 digits (001 - 999)
  const [numberingDigits, setNumberingDigits] = useState<3 | 4>(4);

  // Custom start number for auto-numbering
  const [startNumberInput, setStartNumberInput] = useState<number>(1);

  // Local state for edited cells (names, dates, roles)
  const [editedCells, setEditedCells] = useState<{ [memberId: string]: Partial<StaffMember> }>({});

  // Local state for custom order numbers (up to 4 digits)
  const [customOrderNumbers, setCustomOrderNumbers] = useState<{ [memberId: string]: string }>({});

  // Local state for custom banner titles (directly above the table)
  const [customBannerTitles, setCustomBannerTitles] = useState<{ [tableId: string]: string }>({});

  // Local state for custom general table title (shown above all tables instead of default generated title)
  const [generalTableTitle, setGeneralTableTitle] = useState<string>(() => {
    return localStorage.getItem('staff_table_general_title') || '';
  });

  // Local state for custom section titles (office header row inside table)
  const [customSectionTitles, setCustomSectionTitles] = useState<{ [sectionId: string]: string }>({});

  // Inline editing mode toggle for general text
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Print target: null = normal screen view, object = active print configuration
  const [activePrintTarget, setActivePrintTarget] = useState<PrintTarget | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  // Whether to open in Word or print directly (asked right before printing)
  const [isPrintChoiceOpen, setIsPrintChoiceOpen] = useState<boolean>(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState<boolean>(false);
  const printableContainerRef = useRef<HTMLElement>(null);

  // Screen layout: allows the top header and filter boxes to scroll freely up and down or pin at top
  const [isHeaderSticky, setIsHeaderSticky] = useState<boolean>(false);
  // Screen layout: collapse or expand the filter boxes (الخانات) to preserve tablet/screen space
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState<boolean>(false);

  // Build the 2-offices-per-table structure for ALL centers
  const allPairTables: OfficePairTable[] = useMemo(() => {
    const tables: OfficePairTable[] = [];
    const targetCenters = centers;

    let globalCounter = startNumberInput;

    targetCenters.forEach((center) => {
      let centerTableIndex = 1;

      // 1. Center Staff Table (طاقم تسيير وإدارة المركز)
      const centerStaffMembers = center.centerStaff || [];
      const validCenterStaff = showOnlyFilled
        ? centerStaffMembers.filter((m) => Boolean(m.firstName?.trim() || m.lastName?.trim()))
        : centerStaffMembers;

      if (validCenterStaff.length > 0) {
        let tableRowIndex = 1;
        const centerRows: TableRowData[] = validCenterStaff.map((m, idx) => {
          const defaultNum = numberingMode === 'continuous' ? globalCounter++ : tableRowIndex++;
          const customVal = customOrderNumbers[m.id] ?? editedCells[m.id]?.orderNumber ?? m.orderNumber;
          const orderNumStr = customVal !== undefined && customVal !== ''
            ? customVal
            : String(defaultNum).padStart(numberingDigits, '0');

          return {
            rowNumber: defaultNum,
            orderNumber: orderNumStr,
            centerId: center.id,
            centerName: center.name,
            centerCode: center.code,
            isCenterStaff: true,
            memberId: m.id,
            role: m.role || 'عضو قيادة مركز',
            roleOrder: m.roleOrder || idx + 1,
            firstName: m.firstName || '',
            lastName: m.lastName || '',
            latinFirstName: getMemberLatinFirstName(m.firstName, m.latinFirstName),
            latinLastName: getMemberLatinLastName(m.lastName, m.latinLastName),
            birthDate: m.birthDate || '',
            birthCommune: m.birthCommune || '',
            votingPlace: m.votingPlace || 'عين الدفلى',
            phone: m.phone || '',
            originalMember: m,
          };
        });

        // Filter by role if selected
        const filteredCenterRows = selectedRole === 'all'
          ? centerRows
          : centerRows.filter((r) => r.role === selectedRole);

        if (filteredCenterRows.length > 0) {
          tables.push({
            id: `${center.id}-center-staff`,
            centerId: center.id,
            centerName: center.name,
            centerCode: center.code,
            tableType: 'center_staff',
            tableIndex: centerTableIndex++,
            title: 'مؤطري مركز التصويت',
            subtitle: '',
            sections: [
              {
                sectionId: `${center.id}-cs`,
                sectionTitle: 'مؤطري مركز التصويت',
                rows: filteredCenterRows,
              },
            ],
            allRows: filteredCenterRows,
          });
        }
      }

      // 2. Voting Offices grouped 2-by-2 (كل جدول فيه مؤطرين زوج مكاتب)
      const sortedOffices = sortOfficesMenFirst(center.offices || []);

      for (let i = 0; i < sortedOffices.length; i += 2) {
        const office1 = sortedOffices[i];
        const office2 = sortedOffices[i + 1]; // may be undefined for odd count

        let tableRowIndex = 1;
        const sections: OfficePairTable['sections'] = [];
        const combinedRows: TableRowData[] = [];

        // Office 1 Staff
        const staff1 = showOnlyFilled
          ? (office1.staff || []).filter((m) => Boolean(m.firstName?.trim() || m.lastName?.trim()))
          : (office1.staff || []);

        const rows1: TableRowData[] = staff1.map((m, idx) => {
          const defaultNum = numberingMode === 'continuous' ? globalCounter++ : tableRowIndex++;
          const customVal = customOrderNumbers[m.id] ?? editedCells[m.id]?.orderNumber ?? m.orderNumber;
          const orderNumStr = customVal !== undefined && customVal !== ''
            ? customVal
            : String(defaultNum).padStart(numberingDigits, '0');

          return {
            rowNumber: defaultNum,
            orderNumber: orderNumStr,
            centerId: center.id,
            centerName: center.name,
            centerCode: center.code,
            officeId: office1.id,
            officeName: office1.name,
            officeNumber: office1.number,
            officeGender: office1.gender,
            isCenterStaff: false,
            memberId: m.id,
            role: m.role || 'مؤطر مكتب',
            roleOrder: m.roleOrder || idx + 1,
            firstName: m.firstName || '',
            lastName: m.lastName || '',
            latinFirstName: getMemberLatinFirstName(m.firstName, m.latinFirstName),
            latinLastName: getMemberLatinLastName(m.lastName, m.latinLastName),
            birthDate: m.birthDate || '',
            birthCommune: m.birthCommune || '',
            votingPlace: m.votingPlace || 'عين الدفلى',
            phone: m.phone || '',
            originalMember: m,
          };
        });

        // Filter office 1 rows by role if needed
        const filteredRows1 = selectedRole === 'all'
          ? rows1
          : rows1.filter((r) => r.role === selectedRole);

        if (filteredRows1.length > 0) {
          sections.push({
            sectionId: office1.id,
            sectionTitle: `مكتب التصويت رقم ${String(office1.number).padStart(2, '0')} (${office1.gender === 'H' ? 'رجال' : 'نساء'})`,
            officeNumber: office1.number,
            gender: office1.gender,
            rows: filteredRows1,
          });
          combinedRows.push(...filteredRows1);
        }

        // Office 2 Staff (if exists)
        if (office2) {
          const staff2 = showOnlyFilled
            ? (office2.staff || []).filter((m) => Boolean(m.firstName?.trim() || m.lastName?.trim()))
            : (office2.staff || []);

          const rows2: TableRowData[] = staff2.map((m, idx) => {
            const defaultNum = numberingMode === 'continuous' ? globalCounter++ : tableRowIndex++;
            const customVal = customOrderNumbers[m.id] ?? editedCells[m.id]?.orderNumber ?? m.orderNumber;
            const orderNumStr = customVal !== undefined && customVal !== ''
              ? customVal
              : String(defaultNum).padStart(numberingDigits, '0');

            return {
              rowNumber: defaultNum,
              orderNumber: orderNumStr,
              centerId: center.id,
              centerName: center.name,
              centerCode: center.code,
              officeId: office2.id,
              officeName: office2.name,
              officeNumber: office2.number,
              officeGender: office2.gender,
              isCenterStaff: false,
              memberId: m.id,
              role: m.role || 'مؤطر مكتب',
              roleOrder: m.roleOrder || idx + 1,
              firstName: m.firstName || '',
              lastName: m.lastName || '',
              latinFirstName: getMemberLatinFirstName(m.firstName, m.latinFirstName),
              latinLastName: getMemberLatinLastName(m.lastName, m.latinLastName),
              birthDate: m.birthDate || '',
              birthCommune: m.birthCommune || '',
              votingPlace: m.votingPlace || 'عين الدفلى',
              phone: m.phone || '',
              originalMember: m,
            };
          });

          // Filter office 2 rows by role if needed
          const filteredRows2 = selectedRole === 'all'
            ? rows2
            : rows2.filter((r) => r.role === selectedRole);

          if (filteredRows2.length > 0) {
            sections.push({
              sectionId: office2.id,
              sectionTitle: `مكتب التصويت رقم ${String(office2.number).padStart(2, '0')} (${office2.gender === 'H' ? 'رجال' : 'نساء'})`,
              officeNumber: office2.number,
              gender: office2.gender,
              rows: filteredRows2,
            });
            combinedRows.push(...filteredRows2);
          }
        }

        // Only create table if there are rows matching criteria
        if (combinedRows.length > 0) {
          const title = office2
            ? `مكتبي التصويت رقم ${String(office1.number).padStart(2, '0')} ورقم ${String(office2.number).padStart(2, '0')}`
            : `مكتب التصويت رقم ${String(office1.number).padStart(2, '0')}`;

          tables.push({
            id: `${center.id}-pair-${office1.id}-${office2?.id || 'single'}`,
            centerId: center.id,
            centerName: center.name,
            centerCode: center.code,
            tableType: 'offices_pair',
            tableIndex: centerTableIndex++,
            title,
            subtitle: '',
            office1,
            office2,
            sections,
            allRows: combinedRows,
          });
        }
      }
    });

    return tables;
  }, [
    centers,
    selectedRole,
    showOnlyFilled,
    numberingMode,
    numberingDigits,
    startNumberInput,
    customOrderNumbers,
    editedCells,
  ]);

  // Tables for the on-screen view (filtered by selectedCenterId)
  const pairTables = useMemo(() => {
    if (selectedCenterId === 'all') return allPairTables;
    return allPairTables.filter((t) => t.centerId === selectedCenterId);
  }, [allPairTables, selectedCenterId]);

  // Tables to actually display (filtered by tableTypeFilter and selectedTableFilter)
  const displayedTables = useMemo(() => {
    let result = pairTables;
    if (tableTypeFilter === 'center_staff') {
      result = result.filter((t) => t.tableType === 'center_staff');
    } else if (tableTypeFilter === 'offices') {
      result = result.filter((t) => t.tableType === 'offices_pair');
    }

    if (selectedTableFilter !== 'all') {
      result = result.filter((t) => t.id === selectedTableFilter);
    }
    return result;
  }, [pairTables, tableTypeFilter, selectedTableFilter]);

  // Total members currently displayed
  const totalDisplayedStaffCount = useMemo(() => {
    return displayedTables.reduce((acc, t) => acc + t.allRows.length, 0);
  }, [displayedTables]);

  // Printable tables: dynamically adapts to regular screen viewing vs active print mode
  const printableTables = useMemo(() => {
    // 1. Regular on-screen view
    if (!activePrintTarget) {
      return displayedTables.map((t) => ({
        table: t,
        uniqueKey: t.id,
        renderSections: t.sections,
        printBannerTitle: customBannerTitles[t.id] ?? generalTableTitle,
        printTotalRows: t.allRows.length,
      }));
    }

    // 2. Active Print: All Centers & Offices
    if (activePrintTarget.mode === 'all') {
      return allPairTables.map((t) => ({
        table: t,
        uniqueKey: `print-all-${t.id}`,
        renderSections: t.sections,
        printBannerTitle: customBannerTitles[t.id] ?? generalTableTitle,
        printTotalRows: t.allRows.length,
      }));
    }

    // 3. Active Print: By Center
    if (activePrintTarget.mode === 'center') {
      return allPairTables
        .filter((t) => t.centerId === activePrintTarget.centerId)
        .map((t) => ({
          table: t,
          uniqueKey: `print-center-${t.id}`,
          renderSections: t.sections,
          printBannerTitle: customBannerTitles[t.id] ?? generalTableTitle,
          printTotalRows: t.allRows.length,
        }));
    }

    // 4. Active Print: By Table
    if (activePrintTarget.mode === 'table') {
      return allPairTables
        .filter((t) => t.id === activePrintTarget.tableId)
        .map((t) => ({
          table: t,
          uniqueKey: `print-table-${t.id}`,
          renderSections: t.sections,
          printBannerTitle: customBannerTitles[t.id] ?? generalTableTitle,
          printTotalRows: t.allRows.length,
        }));
    }

    // 5. Active Print: By Office (Individual office on dedicated sheet)
    if (activePrintTarget.mode === 'office') {
      const parentTable = allPairTables.find((t) =>
        t.sections.some((s) => s.sectionId === activePrintTarget.officeId)
      );
      if (!parentTable) return [];

      const targetSection = parentTable.sections.find(
        (s) => s.sectionId === activePrintTarget.officeId
      );
      if (!targetSection) return [];

      return [
        {
          table: parentTable,
          uniqueKey: `print-office-${targetSection.sectionId}`,
          renderSections: [targetSection],
          printBannerTitle:
            customBannerTitles[targetSection.sectionId] ?? generalTableTitle,
          printTotalRows: targetSection.rows.length,
        },
      ];
    }

    // 6. Active Print: Custom Selection (Legacy table IDs)
    if (activePrintTarget.mode === 'custom') {
      return allPairTables
        .filter((t) => activePrintTarget.tableIds.includes(t.id))
        .map((t) => ({
          table: t,
          uniqueKey: `print-custom-${t.id}`,
          renderSections: t.sections,
          printBannerTitle: customBannerTitles[t.id] ?? generalTableTitle,
          printTotalRows: t.allRows.length,
        }));
    }

    // 7. Active Print: Custom Selected Offices from a Specific Center
    if (activePrintTarget.mode === 'custom_offices') {
      const { centerId, officeSectionIds, layout } = activePrintTarget;

      const centerPairTables = allPairTables.filter((t) => t.centerId === centerId);
      if (centerPairTables.length === 0) return [];

      const parentCenterTable = centerPairTables[0];
      const centerName = parentCenterTable.centerName;
      const centerCode = parentCenterTable.centerCode;

      // Extract all matched sections in order
      const matchedSections: {
        sectionId: string;
        sectionTitle: string;
        officeNumber?: number;
        gender?: 'H' | 'F';
        rows: TableRowData[];
      }[] = [];

      centerPairTables.forEach((t) => {
        t.sections.forEach((s) => {
          if (officeSectionIds.includes(s.sectionId)) {
            matchedSections.push(s);
          }
        });
      });

      if (matchedSections.length === 0) return [];

      // Layout: Single office per page
      if (layout === 'single') {
        return matchedSections.map((sec, idx) => ({
          table: {
            ...parentCenterTable,
            id: `custom-office-single-${sec.sectionId}-${idx}`,
            title: sec.sectionTitle,
            sections: [sec],
            allRows: sec.rows,
          },
          uniqueKey: `print-custom-single-${sec.sectionId}-${idx}`,
          renderSections: [sec],
          printBannerTitle:
            customBannerTitles[sec.sectionId] ?? generalTableTitle,
          printTotalRows: sec.rows.length,
        }));
      }

      // Layout: Two offices per page (Pair)
      const pairedPrintTables: {
        table: OfficePairTable;
        uniqueKey: string;
        renderSections: typeof parentCenterTable.sections;
        printBannerTitle: string;
        printTotalRows: number;
      }[] = [];

      for (let i = 0; i < matchedSections.length; i += 2) {
        const pair = matchedSections.slice(i, i + 2);
        const pairTitle =
          pair.length === 2
            ? `${pair[0].sectionTitle} و ${pair[1].sectionTitle}`
            : pair[0].sectionTitle;
        const totalRows = pair.reduce((sum, s) => sum + s.rows.length, 0);
        const pairId = `custom-office-pair-${i}-${pair.map((p) => p.sectionId).join('-')}`;

        pairedPrintTables.push({
          table: {
            ...parentCenterTable,
            id: pairId,
            title: pairTitle,
            sections: pair,
            allRows: pair.flatMap((s) => s.rows),
          },
          uniqueKey: `print-custom-pair-${pairId}`,
          renderSections: pair,
          printBannerTitle:
            customBannerTitles[pairId] ?? generalTableTitle,
          printTotalRows: totalRows,
        });
      }

      return pairedPrintTables;
    }

    return [];
  }, [activePrintTarget, displayedTables, allPairTables, customBannerTitles, generalTableTitle]);

  // Unique roles for filter dropdown
  const availableRoles = useMemo(() => {
    const set = new Set<string>();
    pairTables.forEach((t) => {
      t.allRows.forEach((r) => {
        if (r.role) set.add(r.role);
      });
    });
    return Array.from(set);
  }, [pairTables]);

  // Handle direct Order Number change (accepts up to 4 digits: 1 to 9999 or 0001)
  const handleOrderNumberChange = (memberId: string, value: string) => {
    // Only accept numbers up to 4 digits
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    setCustomOrderNumbers((prev) => ({
      ...prev,
      [memberId]: cleaned,
    }));
  };

  // Handle Order Number blur (preserves user input and pads up to 4 digits if needed)
  const handleOrderNumberBlur = (memberId: string, value: string) => {
    const trimmed = value.trim();
    if (trimmed) {
      // If user typed 4 digits, keep them as 4 digits; if fewer digits, pad to numberingDigits (e.g. 4 digits: 0001)
      const targetPad = Math.max(numberingDigits, trimmed.length > 3 ? 4 : numberingDigits);
      const padded = trimmed.padStart(targetPad, '0').slice(0, 4);
      setCustomOrderNumbers((prev) => ({
        ...prev,
        [memberId]: padded,
      }));

      // Immediately sync into editedCells for batch saving
      setEditedCells((prev) => ({
        ...prev,
        [memberId]: {
          ...prev[memberId],
          orderNumber: padded,
        },
      }));
    }
  };

  // Handle general cell change
  const handleCellChange = (memberId: string, field: keyof StaffMember, value: string) => {
    setEditedCells((prev) => {
      const current = prev[memberId] || {};
      const updated = { ...current, [field]: value };

      if (field === 'firstName' && !current.latinFirstName) {
        updated.latinFirstName = arabicToLatin(value, false);
      }
      if (field === 'lastName' && !current.latinLastName) {
        updated.latinLastName = arabicToLatin(value, true);
      }

      return {
        ...prev,
        [memberId]: updated,
      };
    });
  };

  // Save general table title
  const handleSaveGeneralTitle = () => {
    localStorage.setItem('staff_table_general_title', generalTableTitle);
    setCustomBannerTitles({});
    setSaveSuccessMsg(
      generalTableTitle.trim()
        ? `تم حفظ وتطبيق عنوان الجداول: "${generalTableTitle}" بنجاح.`
        : 'تم حفظ عنوان الجداول.'
    );
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Clear general table title
  const handleClearGeneralTitle = () => {
    setGeneralTableTitle('');
    localStorage.removeItem('staff_table_general_title');
    setCustomBannerTitles({});
    setSaveSuccessMsg('تم تفريغ وحذف عنوان الجداول بنجاح.');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Save all inline edits and custom order numbers back to Centers
  const handleSaveAll = () => {
    // Also save the general table title to localStorage
    localStorage.setItem('staff_table_general_title', generalTableTitle);

    if (!isSupervisor) {
      alert('حفظ وتعديل بيانات المؤطرين محصور بالمشرف فقط.\nلتفعيل وضع المشرف وصلاحيات التعديل، انتقل إلى خانة البحث واكتب mohamed 44000');
      return;
    }

    const updatedCenters = centers.map((center) => ({
      ...center,
      centerStaff: center.centerStaff.map((m) => {
        const edits = editedCells[m.id] || {};
        const customOrder = customOrderNumbers[m.id];
        const newOrder = customOrder !== undefined ? customOrder : edits.orderNumber ?? m.orderNumber;
        return {
          ...m,
          ...edits,
          orderNumber: newOrder,
        };
      }),
      offices: center.offices.map((office) => ({
        ...office,
        staff: office.staff.map((m) => {
          const edits = editedCells[m.id] || {};
          const customOrder = customOrderNumbers[m.id];
          const newOrder = customOrder !== undefined ? customOrder : edits.orderNumber ?? m.orderNumber;
          return {
            ...m,
            ...edits,
            orderNumber: newOrder,
          };
        }),
      })),
    }));

    onUpdateCenters(updatedCenters);
    setIsEditMode(false);
    setSaveSuccessMsg('تم حفظ كافة الأرقام (001 - 999) والبيانات بنجاح في قاعدة البيانات.');
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Apply sequential numbering (e.g. 0001, 0002... or 001, 002...) to all visible tables
  const handleApplySequentialNumbering = (mode: 'per_table' | 'continuous', digits: 3 | 4 = numberingDigits) => {
    const newCustomMap: { [memberId: string]: string } = {};
    let runningCounter = startNumberInput;

    pairTables.forEach((table) => {
      let tableCounter = 1;
      table.allRows.forEach((row) => {
        const num = mode === 'continuous' ? runningCounter++ : tableCounter++;
        newCustomMap[row.memberId] = String(num).padStart(digits, '0');
      });
    });

    setCustomOrderNumbers((prev) => ({
      ...prev,
      ...newCustomMap,
    }));

    setSaveSuccessMsg(
      mode === 'per_table'
        ? `تم تطبيق ترقيم (${digits === 4 ? '0001' : '001'}...) مستقل لكل جدول. اضغط "حفظ" لتثبيته.`
        : `تم تطبيق ترقيم تسلسلي مستمر (${digits === 4 ? '0001' : '001'}...) عبر كافة المكاتب. اضغط "حفظ" لتثبيته.`
    );
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Auto-generate Latin French names for all filled members
  const handleAutoFillAllLatinNames = () => {
    const updatedCenters = centers.map((center) => ({
      ...center,
      centerStaff: center.centerStaff.map((m) => ({
        ...m,
        latinFirstName: m.latinFirstName || (m.firstName ? arabicToLatin(m.firstName, false) : ''),
        latinLastName: m.latinLastName || (m.lastName ? arabicToLatin(m.lastName, true) : ''),
      })),
      offices: center.offices.map((office) => ({
        ...office,
        staff: office.staff.map((m) => ({
          ...m,
          latinFirstName: m.latinFirstName || (m.firstName ? arabicToLatin(m.firstName, false) : ''),
          latinLastName: m.latinLastName || (m.lastName ? arabicToLatin(m.lastName, true) : ''),
        })),
      })),
    }));

    onUpdateCenters(updatedCenters);
    setSaveSuccessMsg('تم توليد الأسماء بالفرنسية (Prénom / Nom) لكافة المؤطرين بنجاح.');
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Execute any print scope: all, by center, by office, or custom.
  // Instead of printing right away, we render the chosen content then ask
  // the user whether to open it in Word or send it straight to the
  // browser's print dialog.
  const handleExecutePrint = (target: PrintTarget) => {
    setIsPrintModalOpen(false);
    setActivePrintTarget(target);
    setTimeout(() => {
      setIsPrintChoiceOpen(true);
    }, 150);
  };

  // User picked "طباعة مباشرة" (print directly)
  const handleConfirmDirectPrint = () => {
    setIsPrintChoiceOpen(false);
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setActivePrintTarget(null);
      }, 1500);
    }, 150);
  };

  // User picked "فتحها في Word" (open in Word)
  const handleConfirmWordExport = () => {
    setIsPrintChoiceOpen(false);
    setTimeout(() => {
      if (printableContainerRef.current) {
        exportPrintableAsWord(printableContainerRef.current, 'جدول-المؤطرين');
      }
      setActivePrintTarget(null);
    }, 150);
  };

  // User picked "معاينة قبل الطباعة"
  const handleConfirmPreview = () => {
    setIsPrintChoiceOpen(false);
    setTimeout(() => {
      setIsPrintPreviewOpen(true);
    }, 150);
  };

  // User closed the choice dialog without picking anything
  const handleCancelPrintChoice = () => {
    setIsPrintChoiceOpen(false);
    setActivePrintTarget(null);
  };

  // Print all visible tables
  const handlePrintAll = () => {
    handleExecutePrint({ mode: 'all' });
  };

  // Print single 2-office table
  const handlePrintSingleTable = (tableId: string) => {
    handleExecutePrint({ mode: 'table', tableId });
  };

  // Export as CSV / Excel
  const handleExportCSV = () => {
    const headers = [
      'الرقم (N°)',
      'اللقب بالعربية',
      'الاسم بالعربية',
      'Prénom',
      'Nom',
      'تاريخ الميلاد',
      'مكان الميلاد',
      'مكان الانتخاب',
      'المهمة',
      'المركز',
      'المكتب',
      'الهاتف',
    ];

    const rows: string[][] = [];
    displayedTables.forEach((table) => {
      table.allRows.forEach((r) => {
        const orderNum = customOrderNumbers[r.memberId] ?? r.orderNumber;
        rows.push([
          `"${orderNum}"`,
          `"${(editedCells[r.memberId]?.lastName ?? r.lastName).replace(/"/g, '""')}"`,
          `"${(editedCells[r.memberId]?.firstName ?? r.firstName).replace(/"/g, '""')}"`,
          `"${(editedCells[r.memberId]?.latinFirstName ?? r.latinFirstName).replace(/"/g, '""')}"`,
          `"${(editedCells[r.memberId]?.latinLastName ?? r.latinLastName).replace(/"/g, '""')}"`,
          `"${editedCells[r.memberId]?.birthDate ?? r.birthDate}"`,
          `"${(editedCells[r.memberId]?.birthCommune ?? r.birthCommune).replace(/"/g, '""')}"`,
          `"${(editedCells[r.memberId]?.votingPlace ?? r.votingPlace).replace(/"/g, '""')}"`,
          `"${editedCells[r.memberId]?.role ?? r.role}"`,
          `"${r.centerName.replace(/"/g, '""')}"`,
          `"${r.isCenterStaff ? 'طاقم المركز' : r.officeName || `مكتب ${r.officeNumber}`}"`,
          `"${editedCells[r.memberId]?.phone ?? r.phone}"`,
        ]);
      });
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const centerPart = selectedCenterId === 'all' ? 'كافة_المراكز' : centers.find((c) => c.id === selectedCenterId)?.name || 'مركز';
    link.download = `جدول_تأطير_مكاتب_${centerPart}_عين_الدفلى_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased pb-24 print:bg-white print:text-black print:p-0">
      {/* ========================================================= */}
      {/* SCREEN CONTROLS BAR (Hidden in Print) */}
      {/* ========================================================= */}
      <div
        id="staff-table-header-bar"
        className={`print:hidden bg-slate-950/95 border-b border-slate-800 z-40 backdrop-blur-md shadow-xl px-4 py-3 transition-all duration-200 ${
          isHeaderSticky ? 'sticky top-0 shadow-2xl' : 'relative'
        }`}
      >
        <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Back Button & Main Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white flex items-center justify-center shadow-lg border-2 border-red-300 transition-all cursor-pointer shrink-0"
              title="العودة"
            >
              <ArrowRight className="w-5 h-5 font-black text-white" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                <h1 className="text-base sm:text-lg font-black text-white">
                  جدول تأطير المكاتب الرسمي (زوج مكاتب في كل جدول)
                </h1>
                <span className="bg-amber-400/20 text-amber-300 text-2xs font-black px-2 py-0.5 rounded-full border border-amber-400/40">
                  ترقيم 3 أرقام قابل للتعديل
                </span>
                {!isHeaderSticky && (
                  <span className="bg-emerald-500/20 text-emerald-300 text-2xs font-bold px-2 py-0.5 rounded-full border border-emerald-500/40">
                    قابل للتمرير للأعلى والأسفل
                  </span>
                )}
              </div>
              <p className="text-2xs text-slate-400">
                الجمهورية الجزائرية الديمقراطية الشعبية — المندوبية البلدية لبلدية عين الدفلى
              </p>
            </div>
          </div>

          {/* Action Buttons: Print, Excel, Auto-Latin, Save, Sticky Toggle, Collapse Toggle */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Primary Print Options Button (Modal) */}
            <button
              id="print-options-btn"
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-black rounded-xl shadow-lg shadow-emerald-950/50 border border-emerald-400 cursor-pointer transition-all"
              title="الحرية الكاملة في الطباعة: طباعة شاملة، أو بالمركز، أو بالمكتب، أو تحديد مخصص"
            >
              <Printer className="w-4 h-4" />
              <span>خيارات وطباعة الجداول...</span>
            </button>

            {/* Quick Direct Print All */}
            <button
              id="print-all-tables-btn"
              onClick={handlePrintAll}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-emerald-800 hover:bg-emerald-700 active:scale-95 text-emerald-100 text-xs sm:text-sm font-bold rounded-xl border border-emerald-500/60 cursor-pointer transition-all"
              title="طباعة كلية سريعة لكافة الجداول"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة كلية فورية</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-600 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md border border-blue-400 cursor-pointer transition-all"
              title="تصدير إلى ملف Excel (CSV)"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">تصدير Excel</span>
            </button>

            {/* Auto-Latin Names generator */}
            <button
              onClick={handleAutoFillAllLatinNames}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-800/80 hover:bg-purple-700 text-purple-100 text-xs sm:text-sm font-bold rounded-xl border border-purple-500/60 cursor-pointer transition-all"
              title="توليد الأسماء بالفرنسية تلقائياً (Prénom & Nom) استناداً إلى الأسماء بالعربية"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="hidden md:inline">توليد الأسماء بالفرنسية</span>
              <span className="md:hidden">Prénom/Nom</span>
            </button>

            {/* Save All / Edit Mode */}
            <button
              onClick={handleSaveAll}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-black rounded-xl shadow-md border border-amber-300 cursor-pointer transition-all"
              title="حفظ كافة الأرقام والتعديلات"
            >
              <Save className="w-4 h-4" />
              <span>حفظ الأرقام والتعديلات</span>
            </button>

            {/* Edit mode toggle for texts */}
            <button
              onClick={() => {
                if (!isSupervisor && !isEditMode) {
                  alert('تعديل نصوص وأسماء المؤطرين محصور بالمشرف فقط.\nلتفعيل وضع المشرف، انتقل إلى خانة البحث واكتب mohamed 44000');
                  return;
                }
                setIsEditMode(!isEditMode);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border cursor-pointer transition-all ${
                isEditMode
                  ? 'bg-amber-600 text-white border-amber-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title={isSupervisor ? "تفعيل وضع تعديل نصوص الأسماء والوظائف مباشرة" : "تعديل النصوص (خاص بالمشرف)"}
            >
              <Edit3 className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">
                {isEditMode ? 'وضع التعديل مفعل' : 'تعديل النصوص'}
              </span>
            </button>

            {/* Supervisor Logout Button */}
            {isSupervisor && (
              <button
                type="button"
                id="staff-table-supervisor-logout-btn"
                onClick={() => {
                  onSetSupervisor?.(false);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/90 hover:bg-rose-900 active:scale-95 text-rose-200 hover:text-white border-2 border-rose-500/80 rounded-xl text-xs sm:text-sm font-black shadow-md shadow-rose-950/30 transition-all cursor-pointer"
                title="تسجيل الخروج من وضع المشرف والعودة لوضع العرض فقط"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
                <span>خروج المشرف</span>
              </button>
            )}

            {/* Free Scroll vs Sticky Pin Toggle */}
            <button
              type="button"
              id="toggle-header-sticky-btn"
              onClick={() => setIsHeaderSticky((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                isHeaderSticky
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/60 shadow-xs'
                  : 'bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border-emerald-500/60 shadow-md'
              }`}
              title={
                isHeaderSticky
                  ? 'الشريط مثبت حالياً في أعلى الشاشة. انقر لجعله قابل للتمرير للأعلى والأسفل بحرية مع الصفحة'
                  : 'الشريط قابل للتمرير للأعلى والأسفل بحرية مع الصفحة. انقر لتثبيته في الأعلى'
              }
            >
              {isHeaderSticky ? (
                <>
                  <Pin className="w-3.5 h-3.5 text-amber-400" />
                  <span>تثبيت في الأعلى</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>تمرير حر للأعلى/الأسفل</span>
                </>
              )}
            </button>

            {/* Collapse / Expand Filter Boxes Toggle */}
            <button
              type="button"
              id="toggle-filter-boxes-btn"
              onClick={() => setIsFiltersCollapsed((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                isFiltersCollapsed
                  ? 'bg-indigo-900/90 hover:bg-indigo-800 text-indigo-100 border-indigo-400 shadow-md'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title={isFiltersCollapsed ? 'إظهار شريط الخانات (المركز، الجدول، المهمة، الترقيم)' : 'طي الخانات لتوفير مساحة الشاشة'}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-300" />
              <span>{isFiltersCollapsed ? 'إظهار الخانات' : 'طي الخانات'}</span>
              {isFiltersCollapsed ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Secondary Bar: Filters and Numbering Tools (Scrollable vertically if height is limited) */}
        {!isFiltersCollapsed && (
          <div className="max-w-[1700px] mx-auto mt-3 pt-3 border-t border-slate-800 max-h-[60vh] overflow-y-auto overflow-x-hidden pr-1 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              {/* Center Selector */}
              <div className="flex items-center gap-1.5">
                <Building className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-slate-300 font-bold shrink-0">المركز:</span>
                <select
                  id="staff-table-center-select"
                  value={selectedCenterId}
                  onChange={(e) => {
                    setSelectedCenterId(e.target.value);
                    setSelectedTableFilter('all');
                  }}
                  className="bg-slate-900 text-white font-bold px-3 py-1.5 rounded-lg border border-slate-700 focus:ring-2 focus:ring-amber-400 focus:outline-none max-w-[220px] truncate"
                >
                  <option value="all">كافة المراكز (15 مركزاً)</option>
                  {centers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.code ? `(${c.code})` : ''} - ({c.offices.length} مكتب)
                    </option>
                  ))}
                </select>
              </div>

              {/* Category / Type Selector Tabs: All, Center Staff, Voting Offices */}
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-700 select-none">
                <button
                  type="button"
                  onClick={() => {
                    setTableTypeFilter('all');
                    setSelectedTableFilter('all');
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    tableTypeFilter === 'all'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="عرض كافة الجداول (مؤطري المراكز ومكاتب التصويت)"
                >
                  كافة الجداول
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTableTypeFilter('center_staff');
                    setSelectedTableFilter('all');
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    tableTypeFilter === 'center_staff'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="عرض جداول مؤطري المراكز فقط"
                >
                  مؤطري المراكز فقط
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTableTypeFilter('offices');
                    setSelectedTableFilter('all');
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    tableTypeFilter === 'offices'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="عرض جداول مكاتب التصويت فقط"
                >
                  مكاتب التصويت فقط
                </button>
              </div>

              {/* Table Selection within Current View (All tables or specific table) */}
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-slate-300 font-bold shrink-0">الجدول:</span>
                <select
                  id="staff-table-pair-select"
                  value={selectedTableFilter}
                  onChange={(e) => setSelectedTableFilter(e.target.value)}
                  className="bg-slate-900 text-white font-bold px-3 py-1.5 rounded-lg border border-slate-700 focus:ring-2 focus:ring-amber-400 focus:outline-none max-w-[260px] truncate"
                >
                  <option value="all">
                    {tableTypeFilter === 'center_staff'
                      ? `كافة جداول مؤطري المراكز (${pairTables.filter(t => t.tableType === 'center_staff').length} جدول)`
                      : tableTypeFilter === 'offices'
                      ? `كافة جداول مكاتب التصويت (${pairTables.filter(t => t.tableType === 'offices_pair').length} جدول)`
                      : `كافة الجداول المعروضة (${pairTables.length} جدول)`}
                  </option>
                  {pairTables
                    .filter((t) => {
                      if (tableTypeFilter === 'center_staff') return t.tableType === 'center_staff';
                      if (tableTypeFilter === 'offices') return t.tableType === 'offices_pair';
                      return true;
                    })
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.tableType === 'center_staff'
                          ? `[مؤطري المركز] ${t.centerName}: ${t.title}`
                          : `${t.centerName}: ${t.title}`} ({t.allRows.length} مؤطر)
                      </option>
                    ))}
                </select>
              </div>

              {/* Role Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300 font-bold shrink-0">المهمة:</span>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="bg-slate-900 text-white font-bold px-2.5 py-1.5 rounded-lg border border-slate-700 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  <option value="all">كافة المهام</option>
                  {availableRoles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Only filled staff checkbox */}
              <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                <input
                  type="checkbox"
                  checked={showOnlyFilled}
                  onChange={(e) => setShowOnlyFilled(e.target.checked)}
                  className="rounded text-amber-400 focus:ring-amber-400 w-4 h-4"
                />
                <span className="text-slate-200 font-semibold">المؤطرين المسجلين فقط</span>
              </label>

              {/* Custom General Table Title Input (خانة عنوان الجداول) */}
              <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border-2 border-amber-400/80 shadow-md">
                <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                <label
                  htmlFor="general-table-title-input"
                  className="text-amber-300 font-black shrink-0 text-xs cursor-pointer"
                >
                  عنوان الجداول:
                </label>
                <input
                  id="general-table-title-input"
                  type="text"
                  value={generalTableTitle}
                  onChange={(e) => setGeneralTableTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveGeneralTitle();
                  }}
                  placeholder="اكتب العنوان الظاهر فوق الجداول..."
                  className="bg-slate-950 text-white font-bold px-3 py-1 rounded-lg border border-slate-700 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:outline-none w-52 sm:w-64 md:w-80 text-xs placeholder:text-slate-500"
                  title="اكتب هنا العنوان الذي سيظهر أعلى الجداول ثم اضغط حفظ"
                />
                <button
                  type="button"
                  id="save-general-title-btn"
                  onClick={handleSaveGeneralTitle}
                  className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black rounded-lg text-xs transition-all cursor-pointer shadow-xs shrink-0"
                  title="حفظ هذا العنوان وتطبيقه على كافة الجداول"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ</span>
                </button>
                {generalTableTitle && (
                  <button
                    type="button"
                    onClick={handleClearGeneralTitle}
                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="تفريغ ومسح عنوان الجداول"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Numbering Tools section */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                <Hash className="w-4 h-4" />
                <span>أدوات الترقيم (حتى 4 أرقام):</span>
              </div>

              {/* Digits format toggle (4 أرقام / 3 أرقام) */}
              <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setNumberingDigits(4)}
                  className={`px-2 py-0.5 rounded text-2xs font-black transition-all cursor-pointer ${
                    numberingDigits === 4
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="صيغة 4 أرقام (0001 - 9999)"
                >
                  4 أرقام (0001)
                </button>
                <button
                  type="button"
                  onClick={() => setNumberingDigits(3)}
                  className={`px-2 py-0.5 rounded text-2xs font-black transition-all cursor-pointer ${
                    numberingDigits === 3
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="صيغة 3 أرقام (001 - 999)"
                >
                  3 أرقام (001)
                </button>
              </div>

              {/* Quick auto-numbering per table */}
              <button
                type="button"
                onClick={() => handleApplySequentialNumbering('per_table', numberingDigits)}
                className="px-2.5 py-1 bg-blue-900 hover:bg-blue-800 text-blue-100 text-2xs font-bold rounded-md border border-blue-600 cursor-pointer"
                title={`يبدأ الترقيم من ${numberingDigits === 4 ? '0001' : '001'} داخل كل جدول`}
              >
                {numberingDigits === 4 ? 'ترقيم 0001 لكل جدول' : 'ترقيم 001 لكل جدول'}
              </button>

              {/* Continuous auto-numbering */}
              <button
                type="button"
                onClick={() => handleApplySequentialNumbering('continuous', numberingDigits)}
                className="px-2.5 py-1 bg-indigo-900 hover:bg-indigo-800 text-indigo-100 text-2xs font-bold rounded-md border border-indigo-600 cursor-pointer"
                title={`ترقيم تسلسلي مستمر (${numberingDigits === 4 ? '0001' : '001'}...) عبر كافة المكاتب`}
              >
                ترقيم مستمر
              </button>

              {/* Counts badge */}
              <div className="flex items-center gap-1.5 text-slate-300 font-bold mr-2">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>المؤطرين:</span>
                <span className="text-amber-300 font-black">{totalDisplayedStaffCount}</span>
              </div>
            </div>
          </div>
        )}

        {/* Success toast message */}
        {saveSuccessMsg && (
          <div className="max-w-[1700px] mx-auto mt-2 p-2 bg-emerald-900/90 border border-emerald-500 rounded-lg text-emerald-100 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-300" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* PRINT STYLES EMBED (A4 Landscape, Page Break per Table)   */}
      {/* ========================================================= */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 6mm 6mm;
          }
          html, body {
            background-color: #ffffff !important;
            color: #000000 !important;
            font-family: 'Amiri', 'Traditional Arabic', 'Arial', sans-serif !important;
            font-size: 10pt !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-hidden, .print\\:hidden {
            display: none !important;
          }
          .print-show {
            display: block !important;
          }
          .office-pair-sheet {
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            min-height: 96vh !important;
            padding: 2mm 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .office-pair-sheet:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .official-print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            border: 2px solid #000000 !important;
          }
          .official-print-table th {
            background-color: #f2f2f2 !important;
            color: #000000 !important;
            font-weight: bold !important;
            font-size: 9.5pt !important;
            text-align: center !important;
            border: 1.5px solid #000000 !important;
            padding: 4px 2px !important;
            white-space: nowrap !important;
          }
          .official-print-table td {
            border: 1.5px solid #000000 !important;
            padding: 3px 2px !important;
            color: #000000 !important;
            font-size: 9pt !important;
            text-align: center !important;
            height: 23px !important;
          }
          .office-section-header-row {
            background-color: #e5e7eb !important;
            color: #000000 !important;
            font-weight: 900 !important;
            font-size: 9.5pt !important;
            text-align: right !important;
            padding: 3px 8px !important;
            border: 1.5px solid #000000 !important;
          }
          .order-number-input {
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
            color: #000000 !important;
            font-weight: 900 !important;
            font-family: monospace !important;
            font-size: 10pt !important;
            text-align: center !important;
            width: 100% !important;
          }
          .official-header {
            text-align: center !important;
            margin-bottom: 6px !important;
            border-bottom: 2px solid #000000 !important;
            padding-bottom: 4px !important;
          }
        }
      `}</style>

      {/* ========================================================= */}
      {/* MAIN CONTENT: 2-OFFICES TABLES (Cards on Screen / A4 Sheets in Print) */}
      {/* ========================================================= */}
      <main
        ref={printableContainerRef}
        className="max-w-[1700px] mx-auto p-3 sm:p-6 space-y-8 print:p-0 print:m-0 print:space-y-0 min-h-[85vh]"
      >
        {printableTables.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-bold bg-slate-950/40 rounded-2xl border border-slate-800">
            لا توجد بيانات مطابقة للشروط المختارة.
          </div>
        ) : (
          printableTables.map(({ table, uniqueKey, renderSections, printBannerTitle, printTotalRows }) => {
            return (
              <div
                key={uniqueKey}
                id={`table-card-${table.id}`}
                className="office-pair-sheet bg-white text-slate-950 rounded-2xl shadow-2xl p-5 sm:p-7 border border-slate-300 print:shadow-none print:border-none print:p-0 print:rounded-none relative"
              >
                {/* Screen Top Action Ribbon (Fast In-Place Print Controls) */}
                <div className="print:hidden flex items-center justify-between flex-wrap gap-2 mb-3 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Printer className="w-4 h-4 text-emerald-700" />
                    <span>خيارات الطباعة السريعة:</span>
                  </div>

                  <div className="flex items-center flex-wrap gap-1.5">
                    {/* Print this 2-office table */}
                    <button
                      onClick={() => handleExecutePrint({ mode: 'table', tableId: table.id })}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white text-xs font-black rounded-lg shadow-xs cursor-pointer transition-all"
                      title="طباعة هذا الجدول كاملاً (A4 أفقي)"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>طباعة هذا الجدول</span>
                    </button>

                    {/* Print each office individually */}
                    {table.sections.map((section) => (
                      <button
                        key={section.sectionId}
                        onClick={() =>
                          handleExecutePrint({
                            mode: 'office',
                            officeId: section.sectionId,
                            officeTitle: section.sectionTitle,
                          })
                        }
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 cursor-pointer transition-all"
                        title={`طباعة ${section.sectionTitle} فقط منفرداً في ورقة مستقلة`}
                      >
                        <span>
                          طباعة {section.officeNumber ? `مكتب ${section.officeNumber}` : section.sectionTitle} فقط
                        </span>
                      </button>
                    ))}

                    {/* Print this entire center */}
                    <button
                      onClick={() =>
                        handleExecutePrint({
                          mode: 'center',
                          centerId: table.centerId,
                          centerName: table.centerName,
                        })
                      }
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-900 text-xs font-bold rounded-lg border border-blue-200 cursor-pointer transition-all"
                      title={`طباعة كافة جداول مركز ${table.centerName}`}
                    >
                      <Building className="w-3.5 h-3.5 text-blue-700" />
                      <span>طباعة المركز كاملاً</span>
                    </button>
                  </div>
                </div>

                {/* Official Document Header */}
                <OfficialDocumentHeader
                  centerName={table.centerName}
                  centerCode={table.centerCode}
                  tableTitle={table.title}
                  totalRows={printTotalRows}
                  bannerText={printBannerTitle}
                  onBannerTextChange={(newText) =>
                    setCustomBannerTitles((prev) => ({
                      ...prev,
                      [table.id]: newText,
                    }))
                  }
                />

                {/* Office Tables — one independent table per office, stacked one under the other on the same page */}
                <div className="mt-2 mb-4 space-y-5">
                  {renderSections.map((section) => (
                    <div key={section.sectionId} className="office-section-block">
                      {/* Office / Section Title — ABOVE the table, not a row inside it */}
                      <div className="office-section-header-row flex items-center justify-between gap-4 bg-slate-100 print:bg-slate-200 border-2 border-b-0 border-black px-3 py-1.5">
                        <input
                          type="text"
                          value={
                            customSectionTitles[section.sectionId] ??
                            section.sectionTitle
                          }
                          onChange={(e) =>
                            setCustomSectionTitles((prev) => ({
                              ...prev,
                              [section.sectionId]: e.target.value,
                            }))
                          }
                          className="flex-1 font-black text-xs sm:text-sm bg-transparent border-b border-dashed border-slate-400/50 hover:border-slate-600 focus:border-blue-600 focus:bg-white focus:outline-none px-1 py-0.5 print:border-none print:p-0 print:text-black text-right"
                          title="انقر لتعديل عنوان هذا القسم"
                        />
                        <span className="text-2xs font-bold text-slate-600 print:text-black shrink-0">
                          عدد المؤطرين: {section.rows.length}
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="official-print-table w-full border-collapse border-2 border-black text-slate-950 text-xs sm:text-sm">
                          <thead>
                            <tr className="bg-slate-200 text-black font-black border-b-2 border-black">
                              {/* 1. الرقم (حتى 4 أرقام قابلة للتعديل) */}
                              <th className="border border-black py-1.5 px-1 text-center w-14 sm:w-16 shrink-0 font-mono">
                                الرقم
                              </th>

                              {/* 2. اللقب بالعربية */}
                              <th className="border border-black py-1.5 px-2 text-center min-w-[105px]">
                                اللقب بالعربية
                              </th>

                              {/* 3. الاسم بالعربية */}
                              <th className="border border-black py-1.5 px-2 text-center min-w-[105px]">
                                الاسم بالعربية
                              </th>

                              {/* 4. Prénom */}
                              <th
                                className="border border-black py-1.5 px-2 text-center min-w-[105px] font-sans font-bold"
                                dir="ltr"
                              >
                                Prénom
                              </th>

                              {/* 5. Nom */}
                              <th
                                className="border border-black py-1.5 px-2 text-center min-w-[105px] font-sans font-bold"
                                dir="ltr"
                              >
                                Nom
                              </th>

                              {/* 6. تاريخ الميلاد */}
                              <th className="border border-black py-1.5 px-2 text-center min-w-[95px]">
                                تاريخ الميلاد
                              </th>

                              {/* 7. مكان الميلاد */}
                              <th className="border border-black py-1.5 px-2 text-center min-w-[100px]">
                                مكان الميلاد
                              </th>

                              {/* 8. مكان الانتخاب */}
                              <th className="border border-black py-1.5 px-2 text-center min-w-[105px] bg-amber-50/50 print:bg-transparent">
                                مكان الانتخاب
                              </th>

                              {/* 9. المهمة */}
                              <th className="border border-black py-1.5 px-2 text-center min-w-[125px]">
                                المهمة
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {section.rows.map((row) => {
                            const currentOrderNumber =
                              customOrderNumbers[row.memberId] ??
                              editedCells[row.memberId]?.orderNumber ??
                              row.orderNumber;

                            const currentLastName =
                              editedCells[row.memberId]?.lastName ?? row.lastName;
                            const currentFirstName =
                              editedCells[row.memberId]?.firstName ?? row.firstName;
                            const currentLatinFirstName =
                              editedCells[row.memberId]?.latinFirstName ?? row.latinFirstName;
                            const currentLatinLastName =
                              editedCells[row.memberId]?.latinLastName ?? row.latinLastName;
                            const currentBirthDate =
                              editedCells[row.memberId]?.birthDate ?? row.birthDate;
                            const currentBirthCommune =
                              editedCells[row.memberId]?.birthCommune ?? row.birthCommune;
                            const currentVotingPlace =
                              editedCells[row.memberId]?.votingPlace ?? row.votingPlace;
                            const currentRole =
                              editedCells[row.memberId]?.role ?? row.role;

                            return (
                              <tr
                                key={row.memberId}
                                className="hover:bg-amber-50/70 border-b border-black transition-colors"
                              >
                                {/* 1. خانة الرقم القابلة للتعديل وتضم حتى 4 أرقام (0001 - 9999) */}
                                <td className="border border-black text-center font-bold px-1 py-1 bg-slate-50 print:bg-transparent font-mono w-16 sm:w-20">
                                  <input
                                    id={`order-number-input-${row.memberId}`}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={4}
                                    value={currentOrderNumber}
                                    onChange={(e) =>
                                      handleOrderNumberChange(row.memberId, e.target.value)
                                    }
                                    onBlur={(e) =>
                                      handleOrderNumberBlur(row.memberId, e.target.value)
                                    }
                                    placeholder={numberingDigits === 4 ? "0001" : "001"}
                                    className="order-number-input w-14 sm:w-16 text-center font-mono font-black text-xs sm:text-sm bg-amber-50/90 border border-amber-300 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-400 rounded px-1 py-0.5 print:border-none print:bg-transparent print:p-0 print:text-black print:font-black"
                                    title="رقم المؤطر (يمكنك إدخال حتى 4 أرقام: 0001 - 9999)"
                                  />
                                </td>

                                {/* 2. اللقب بالعربية */}
                                <td className="border border-black text-center px-2 py-1 font-bold">
                                  {isEditMode ? (
                                    <input
                                      type="text"
                                      value={currentLastName}
                                      onChange={(e) =>
                                        handleCellChange(row.memberId, 'lastName', e.target.value)
                                      }
                                      placeholder="اللقب"
                                      className="w-full text-center bg-amber-50 border border-amber-300 rounded px-1 py-0.5 font-bold text-xs"
                                    />
                                  ) : (
                                    <span>{currentLastName || '—'}</span>
                                  )}
                                </td>

                                {/* 3. الاسم بالعربية */}
                                <td className="border border-black text-center px-2 py-1 font-bold">
                                  {isEditMode ? (
                                    <input
                                      type="text"
                                      value={currentFirstName}
                                      onChange={(e) =>
                                        handleCellChange(row.memberId, 'firstName', e.target.value)
                                      }
                                      placeholder="الاسم"
                                      className="w-full text-center bg-amber-50 border border-amber-300 rounded px-1 py-0.5 font-bold text-xs"
                                    />
                                  ) : (
                                    <span>{currentFirstName || '—'}</span>
                                  )}
                                </td>

                                {/* 4. Prénom */}
                                <td
                                  className="border border-black text-center px-2 py-1 font-semibold font-sans"
                                  dir="ltr"
                                >
                                  {isEditMode ? (
                                    <input
                                      type="text"
                                      value={currentLatinFirstName}
                                      onChange={(e) =>
                                        handleCellChange(
                                          row.memberId,
                                          'latinFirstName',
                                          e.target.value
                                        )
                                      }
                                      placeholder="Prénom"
                                      className="w-full text-center bg-amber-50 border border-amber-300 rounded px-1 py-0.5 font-semibold text-xs"
                                    />
                                  ) : (
                                    <span>{currentLatinFirstName || '—'}</span>
                                  )}
                                </td>

                                {/* 5. Nom */}
                                <td
                                  className="border border-black text-center px-2 py-1 font-semibold font-sans"
                                  dir="ltr"
                                >
                                  {isEditMode ? (
                                    <input
                                      type="text"
                                      value={currentLatinLastName}
                                      onChange={(e) =>
                                        handleCellChange(
                                          row.memberId,
                                          'latinLastName',
                                          e.target.value
                                        )
                                      }
                                      placeholder="Nom"
                                      className="w-full text-center bg-amber-50 border border-amber-300 rounded px-1 py-0.5 font-semibold text-xs"
                                    />
                                  ) : (
                                    <span>{currentLatinLastName || '—'}</span>
                                  )}
                                </td>

                                {/* 6. تاريخ الميلاد */}
                                <td
                                  className="border border-black text-center px-2 py-1 font-mono text-xs font-semibold"
                                  dir="ltr"
                                >
                                  {isEditMode ? (
                                    <input
                                      type="text"
                                      value={currentBirthDate}
                                      onChange={(e) =>
                                        handleCellChange(row.memberId, 'birthDate', e.target.value)
                                      }
                                      placeholder="YYYY/MM/DD"
                                      className="w-full text-center bg-amber-50 border border-amber-300 rounded px-1 py-0.5 font-mono text-xs"
                                    />
                                  ) : (
                                    <span>{currentBirthDate || '—'}</span>
                                  )}
                                </td>

                                {/* 7. مكان الميلاد */}
                                <td className="border border-black text-center px-2 py-1 font-medium">
                                  {isEditMode ? (
                                    <input
                                      type="text"
                                      value={currentBirthCommune}
                                      onChange={(e) =>
                                        handleCellChange(
                                          row.memberId,
                                          'birthCommune',
                                          e.target.value
                                        )
                                      }
                                      placeholder="مكان الميلاد"
                                      className="w-full text-center bg-amber-50 border border-amber-300 rounded px-1 py-0.5 text-xs font-medium"
                                    />
                                  ) : (
                                    <span>{currentBirthCommune || '—'}</span>
                                  )}
                                </td>

                                {/* 8. مكان الانتخاب */}
                                <td className="border border-black text-center px-2 py-1 font-medium">
                                  {isEditMode ? (
                                    <input
                                      type="text"
                                      value={currentVotingPlace}
                                      onChange={(e) =>
                                        handleCellChange(
                                          row.memberId,
                                          'votingPlace',
                                          e.target.value
                                        )
                                      }
                                      placeholder="مكان الانتخاب"
                                      className="w-full text-center bg-amber-50 border border-amber-300 rounded px-1 py-0.5 text-xs font-medium"
                                    />
                                  ) : (
                                    <span>{currentVotingPlace || '—'}</span>
                                  )}
                                </td>

                                {/* 9. المهمة */}
                                <td className="border border-black text-center px-2 py-1 font-black text-slate-900 bg-slate-50/50 print:bg-transparent">
                                  {isEditMode ? (
                                    <input
                                      type="text"
                                      value={currentRole}
                                      onChange={(e) =>
                                        handleCellChange(row.memberId, 'role', e.target.value)
                                      }
                                      placeholder="المهمة"
                                      className="w-full text-center bg-amber-50 border border-amber-300 rounded px-1 py-0.5 text-xs font-black"
                                    />
                                  ) : (
                                    <span>{currentRole}</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Official Signatures & Seal Section (Printed at bottom of each page) */}
                <div className="official-footer mt-auto pt-3 border-t-2 border-slate-900 text-xs text-slate-900 font-bold">
                  <div className="flex items-center justify-between px-8">
                    {/* Right: Delegated Coordinator */}
                    <div className="space-y-6 text-center min-w-[240px]">
                      <div>المندوب البلدي لسلطة الانتخابات</div>
                      <div className="text-3xs text-slate-500 font-normal print:text-black">
                        (التأشيرة والختم الرسمي)
                      </div>
                    </div>

                    {/* Left: Issue Date & Place */}
                    <div className="text-left font-bold text-slate-800">
                      <div>حرر بعين الدفلى في: {new Date().toLocaleDateString('fr-DZ')}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Print Selection Modal */}
      <PrintSelectionModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        centers={centers}
        allTables={allPairTables}
        displayedTables={displayedTables}
        onExecutePrint={handleExecutePrint}
        initialCenterId={selectedCenterId}
      />

      {/* Ask: open in Word, or print directly */}
      <PrintChoiceModal
        isOpen={isPrintChoiceOpen}
        onOpenWord={handleConfirmWordExport}
        onPrintDirect={handleConfirmDirectPrint}
        onPreview={handleConfirmPreview}
        onClose={handleCancelPrintChoice}
      />

      <PrintPreviewModal
        isOpen={isPrintPreviewOpen}
        contentRef={printableContainerRef}
        onClose={() => { setIsPrintPreviewOpen(false); setActivePrintTarget(null); }}
      />
    </div>
  );
};

// ============================================================================
// OFFICIAL DOCUMENT HEADER COMPONENT
// الجمهورية الجزائرية الديمقراطية الشعبية
// السلطة الوطنية المستقلة للانتخابات
// المندوبية البلدية لبلدية عين الدفلى
// ============================================================================
interface OfficialDocumentHeaderProps {
  centerName: string;
  centerCode?: string;
  tableTitle: string;
  totalRows?: number;
  bannerText?: string;
  onBannerTextChange?: (newText: string) => void;
}

const OfficialDocumentHeader: React.FC<OfficialDocumentHeaderProps> = ({
  centerName,
  centerCode,
  tableTitle,
  totalRows,
  bannerText,
  onBannerTextChange,
}) => {
  return (
    <div className="official-header text-center mb-3 pb-2 border-b-2 border-slate-900">
      {/* Top Republic & Authority Titles */}
      <div className="flex items-center justify-between gap-4">
        {/* Right emblem/seal */}
        <div className="w-16 sm:w-20 shrink-0 flex flex-col items-center">
          <AnieLogo className="w-12 h-12 sm:w-14 sm:h-14" />
        </div>

        {/* Central Titles */}
        <div className="flex-1 text-center space-y-0.5">
          <h2 className="text-sm sm:text-base md:text-lg font-black tracking-wide text-slate-950 font-serif">
            الجمهورية الجزائرية الديمقراطية الشعبية
          </h2>
          <h3 className="text-xs sm:text-sm font-bold text-slate-800">
            السلطة الوطنية المستقلة للانتخابات
          </h3>
          <h3 className="text-xs sm:text-sm font-black text-slate-900">
            المندوبية البلدية لبلدية عين الدفلى
          </h3>
        </div>

        {/* Left Meta info: اسم المركز بدلاً من التاريخ وعدد المؤطرين */}
        <div className="w-36 sm:w-56 text-left text-xs font-bold text-slate-900 print:text-black space-y-0.5 shrink-0">
          <div className="text-[11px] font-bold text-slate-700 print:text-black">مركز التصويت:</div>
          <div className="text-xs sm:text-sm font-black text-slate-950 print:text-black underline decoration-1">
            {centerName}
          </div>
          {centerCode && (
            <div className="text-[10px] text-slate-600 print:text-black font-mono font-bold">
              (رمز المركز: {centerCode})
            </div>
          )}
        </div>
      </div>

      {/* Document Subject Banner (الخانة الطويلة فوق الجدول مباشرة - قابلة للتعديل) */}
      <div
        className={`mt-2 py-1 px-3 bg-slate-100 rounded-lg border border-slate-400 max-w-4xl mx-auto shadow-xs print:bg-transparent print:border-black print:shadow-none w-full ${
          !bannerText || !bannerText.trim() ? 'print:hidden' : ''
        }`}
      >
        <input
          type="text"
          value={bannerText || ''}
          onChange={(e) => onBannerTextChange?.(e.target.value)}
          placeholder="عنوان الجدول (اكتب هنا أو حدده من خانة 'عنوان الجداول' بالأعلى)..."
          className="w-full text-center text-xs sm:text-sm font-black text-slate-900 bg-transparent border-b border-dashed border-slate-400/50 hover:border-slate-600 focus:border-blue-600 focus:bg-white focus:outline-none px-2 py-0.5 rounded transition-all print:border-none print:p-0 print:text-black print:font-black"
          title="انقر لتعديل نص هذه الخانة العلوية للجدول مباشرة"
        />
      </div>
    </div>
  );
};
