import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StaffMember, Center } from '../types';
import { AnieLogo } from './AnieLogo';
import {
  Printer,
  Plus,
  Minus,
  Sparkles,
  ArrowRight,
  Save,
  Search,
  X,
  UserCheck,
  RotateCcw,
  Building,
  Check,
  GraduationCap,
  BookOpen,
  Briefcase,
} from 'lucide-react';
import { normalizeArabic, calculateStringSimilarity, stripArabicPrefixes, scoreMemberMatch } from '../utils/search';
import { SecurityPinModal } from './SecurityPinModal';
import { PrintChoiceModal } from './PrintChoiceModal';
import { exportPrintableAsWord } from '../utils/exportWord';

interface StaffRegistrationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  centers: Center[];
  initialMember?: StaffMember | null;
  initialCenterId?: string;
  initialOfficeId?: string;
  onSaveMember?: (updatedMember: StaffMember, centerId: string, officeId?: string) => void;
}

export const StaffRegistrationFormModal: React.FC<StaffRegistrationFormModalProps> = ({
  isOpen,
  onClose,
  centers,
  initialMember,
  initialCenterId,
  initialOfficeId,
  onSaveMember,
}) => {
  // Find member location
  const findMemberLocation = (memberId: string) => {
    for (const c of centers) {
      const inCenter = c.centerStaff.find((m) => m.id === memberId);
      if (inCenter) return { center: c, office: undefined };
      for (const off of c.offices) {
        const inOff = off.staff.find((m) => m.id === memberId);
        if (inOff) return { center: c, office: off };
      }
    }
    return { center: undefined, office: undefined };
  };

  const [selectedMemberId, setSelectedMemberId] = useState<string>(initialMember?.id || 'blank');
  const [assignedRole, setAssignedRole] = useState<string>(initialMember?.role || 'إضافي أول');

  // Form State
  const [communeCoordinator, setCommuneCoordinator] = useState<string>('عين الدفلى');
  const [fileNumber, setFileNumber] = useState<string>('');
  const [depositDate, setDepositDate] = useState<string>('');
  const [electoralCommune, setElectoralCommune] = useState<string>('عين الدفلى');
  const [votingPlace, setVotingPlace] = useState<string>('عين الدفلى');
  const [electoralCardNumber, setElectoralCardNumber] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [fatherName, setFatherName] = useState<string>('');
  const [motherFullName, setMotherFullName] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('');
  const [birthCommune, setBirthCommune] = useState<string>('');
  const [birthCertNumber, setBirthCertNumber] = useState<string>('');
  const [maritalStatus, setMaritalStatus] = useState<'single' | 'married' | ''>('');
  const [spouseFullName, setSpouseFullName] = useState<string>('');
  const [educationLevel, setEducationLevel] = useState<string>('');
  const [specialty, setSpecialty] = useState<string>('');
  const [professionalStatus, setProfessionalStatus] = useState<string>('');
  const [profession, setProfession] = useState<string>('');
  const [sector, setSector] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isPrintChoiceOpen, setIsPrintChoiceOpen] = useState(false);
  const printableFormRef = useRef<HTMLDivElement>(null);

  // Table Past roles
  const [pastCenterRoles, setPastCenterRoles] = useState<{ [key: string]: string }>({
    'رئيس مركز': '',
    'مساعد اول': '',
    'مساعد ثاني': '',
    'مساعد ثالث': '',
    'مساعد رابع': '',
    'ممثل السلطة': '',
  });

  const [pastOfficeRoles, setPastOfficeRoles] = useState<{ [key: string]: string }>({
    'رئيس مكتب': '',
    'نائب رئيس مكتب': '',
    'كاتب': '',
    'مساعد اول': '',
    'مساعد ثاني': '',
    'اضافي اول': '',
    'اضافي ثاني': '',
  });

  // Affiliations
  const [inAssociation, setInAssociation] = useState<'yes' | 'no' | ''>('');
  const [assocType, setAssocType] = useState<'national' | 'local' | ''>('');
  const [assocName, setAssocName] = useState<string>('');
  const [assocDate, setAssocDate] = useState<string>('');
  const [inParty, setInParty] = useState<'yes' | 'no' | ''>('');
  const [partyDate, setPartyDate] = useState<string>('');
  const [inWebsite, setInWebsite] = useState<'yes' | 'no' | ''>('');
  const [websiteUrl, setWebsiteUrl] = useState<string>('');
  const [declarationCity, setDeclarationCity] = useState<string>('عين الدفلى');
  const [declarationDate, setDeclarationDate] = useState<string>('');

  const [isSavedAlert, setIsSavedAlert] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // History stack for step-by-step gradual back navigation (كيما ندخل نخرج)
  const [historyStack, setHistoryStack] = useState<Array<{ memberId: string; centerId?: string }>>([]);

  // Close search popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchOpen]);

  // Load member data into form
  const loadMemberIntoForm = (member: StaffMember | null, cId?: string) => {
    if (!member) {
      // Clear for blank form
      setFileNumber('');
      setDepositDate('');
      setElectoralCommune('عين الدفلى');
      setVotingPlace('عين الدفلى');
      setElectoralCardNumber('');
      setLastName('');
      setFirstName('');
      setFatherName('');
      setMotherFullName('');
      setBirthDate('');
      setBirthCommune('');
      setBirthCertNumber('');
      setMaritalStatus('');
      setSpouseFullName('');
      setEducationLevel('');
      setSpecialty('');
      setProfessionalStatus('');
      setProfession('');
      setSector('');
      setAddress('');
      setPhone('');
      setPastCenterRoles({
        'رئيس مركز': '',
        'مساعد اول': '',
        'مساعد ثاني': '',
        'مساعد ثالث': '',
        'مساعد رابع': '',
        'ممثل السلطة': '',
      });
      setPastOfficeRoles({
        'رئيس مكتب': '',
        'نائب رئيس مكتب': '',
        'كاتب': '',
        'مساعد اول': '',
        'مساعد ثاني': '',
        'اضافي اول': '',
        'اضافي ثاني': '',
      });
      setInAssociation('');
      setAssocType('');
      setAssocName('');
      setAssocDate('');
      setInParty('');
      setPartyDate('');
      setInWebsite('');
      setWebsiteUrl('');
      setDeclarationCity('عين الدفلى');
      setDeclarationDate('');
      setAssignedRole('إضافي أول');
      return;
    }

    // Pre-fill from member
    setAssignedRole(member.role || 'إضافي أول');
    setFirstName(member.firstName || '');
    setLastName(member.lastName || '');
    setBirthDate(member.birthDate || '');
    setPhone(member.phone || '');
    setProfession(member.profession || member.notes || '');
    setFileNumber(member.fileNumber || '');
    setDepositDate(member.depositDate || '');
    setElectoralCommune(member.communeRegistration || 'عين الدفلى');
    setElectoralCardNumber(member.electoralCardNumber || member.nationalId || '');
    setFatherName(member.fatherName || '');
    setMotherFullName(member.motherFullName || '');
    setBirthCommune(member.birthCommune || '');
    setBirthCertNumber(member.birthCertificateNumber || '');
    setMaritalStatus((member.maritalStatus as 'single' | 'married' | '') || '');
    setSpouseFullName(member.spouseFullName || '');
    setEducationLevel(member.educationLevel || '');
    setSpecialty(member.specialty || '');
    setProfessionalStatus(member.professionalStatus || '');
    setSector(member.sector || '');
    setAddress(member.address || '');

    // Voting place / center name
    let foundCenterName = '';
    if (cId) {
      const c = centers.find((x) => x.id === cId);
      if (c) foundCenterName = c.name;
    } else {
      const loc = findMemberLocation(member.id);
      if (loc.center) foundCenterName = loc.center.name;
    }
    setVotingPlace(member.votingPlace || 'عين الدفلى');

    // Past roles
    const pastCenter: { [k: string]: string } = {
      'رئيس مركز': '',
      'مساعد اول': '',
      'مساعد ثاني': '',
      'مساعد ثالث': '',
      'مساعد رابع': '',
      'ممثل السلطة': '',
    };
    const pastOffice: { [k: string]: string } = {
      'رئيس مكتب': '',
      'نائب رئيس مكتب': '',
      'كاتب': '',
      'مساعد اول': '',
      'مساعد ثاني': '',
      'اضافي اول': '',
      'اضافي ثاني': '',
    };

    if (member.pastRoles) {
      Object.keys(member.pastRoles).forEach((k) => {
        if (pastCenter[k] !== undefined) pastCenter[k] = String(member.pastRoles![k]);
        if (pastOffice[k] !== undefined) pastOffice[k] = String(member.pastRoles![k]);
      });
    }
    setPastCenterRoles(pastCenter);
    setPastOfficeRoles(pastOffice);

    setInAssociation((member.isMemberOfAssociation as 'yes' | 'no' | '') || '');
    setAssocType((member.associationType as 'national' | 'local' | '') || '');
    setAssocName(member.associationName || '');
    setAssocDate(member.associationJoinDate || '');
    setInParty((member.isMemberOfPoliticalParty as 'yes' | 'no' | '') || '');
    setPartyDate(member.partyJoinDate || '');
    setInWebsite((member.isRegisteredOnAuthorityWebsite as 'yes' | 'no' | '') || '');
    setWebsiteUrl(member.websiteUrl || '');
    setDeclarationCity(member.cityPlace || 'عين الدفلى');
    setDeclarationDate(member.declarationDate || '');
  };

  useEffect(() => {
    if (isOpen) {
      if (initialMember) {
        setSelectedMemberId(initialMember.id);
        loadMemberIntoForm(initialMember, initialCenterId);
        setHistoryStack([{ memberId: initialMember.id, centerId: initialCenterId }]);
      } else {
        setSelectedMemberId('blank');
        loadMemberIntoForm(null);
        setHistoryStack([{ memberId: 'blank' }]);
      }
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  }, [isOpen, initialMember, initialCenterId, initialOfficeId]);

  // List of all members in the system for dropdown selection
  const allMembersList = centers.flatMap((center) => [
    ...center.centerStaff
      .filter((m) => m.firstName || m.lastName)
      .map((m) => ({
        member: m,
        centerId: center.id,
        centerName: center.name,
        officeId: undefined,
        officeNumber: undefined as number | undefined,
        displayLabel: `${m.lastName} ${m.firstName} (${m.role} - ${center.name})`,
      })),
    ...center.offices.flatMap((off) =>
      off.staff
        .filter((m) => m.firstName || m.lastName)
        .map((m) => ({
          member: m,
          centerId: center.id,
          centerName: center.name,
          officeId: off.id,
          officeNumber: off.number,
          displayLabel: `${m.lastName} ${m.firstName} (${m.role} - ${center.name} - مكتب ${off.number})`,
        }))
    ),
  ]);

  // Smart similarity & bidirectional search for staff members (Name, Surname, Education, Specialty, Typo tolerance)
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) {
      return allMembersList.map((item) => ({
        ...item,
        score: 1.0,
        matchType: 'exact' as const,
        matchReason: undefined,
        matchedFields: [] as string[],
      }));
    }

    const scored = allMembersList.map((item) => {
      const matchResult = scoreMemberMatch(
        item.member,
        item.centerName,
        item.officeNumber,
        searchQuery
      );

      return {
        ...item,
        score: matchResult.score,
        matchType: matchResult.matchType,
        matchReason: matchResult.matchReason,
        matchedFields: matchResult.matchedFields,
      };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [allMembersList, searchQuery]);

  const handleSelectMemberChange = (id: string, pushHistory = true) => {
    setSelectedMemberId(id);
    if (id === 'blank') {
      loadMemberIntoForm(null);
      if (pushHistory) {
        setHistoryStack((prev) => [...prev, { memberId: 'blank' }]);
      }
      return;
    }
    const found = allMembersList.find((item) => item.member.id === id);
    if (found) {
      loadMemberIntoForm(found.member, found.centerId);
      if (pushHistory) {
        setHistoryStack((prev) => [...prev, { memberId: found.member.id, centerId: found.centerId }]);
      }
    }
  };

  // Step-by-step gradual back navigation (كيما ندخل نخرج)
  const handleGradualBack = () => {
    if (searchQuery.trim()) {
      // Step 1: clear search query text
      setSearchQuery('');
    } else if (isSearchOpen) {
      // Step 2: close search dropdown
      setIsSearchOpen(false);
    } else if (historyStack.length > 1) {
      // Step 3: revert to previously viewed member before search selection
      const newStack = historyStack.slice(0, -1);
      const prevItem = newStack[newStack.length - 1];
      setHistoryStack(newStack);
      if (prevItem) {
        setSelectedMemberId(prevItem.memberId);
        if (prevItem.memberId === 'blank') {
          loadMemberIntoForm(null);
        } else {
          const found = allMembersList.find((item) => item.member.id === prevItem.memberId);
          if (found) {
            loadMemberIntoForm(found.member, found.centerId);
          }
        }
      }
    } else {
      // Step 4: close form and return to originating screen
      onClose();
    }
  };

  const getGradualBackLabel = () => {
    if (searchQuery.trim()) return 'رجوع (مسح البحث)';
    if (isSearchOpen) return 'رجوع (إغلاق البحث)';
    if (historyStack.length > 1) return 'رجوع للمؤطر السابق';
    return 'رجوع';
  };

  // Helper for numeric increments in participation table
  const adjustCenterRoleCount = (role: string, delta: number) => {
    const current = parseInt(pastCenterRoles[role] || '0', 10);
    const newVal = Math.max(0, (isNaN(current) ? 0 : current) + delta);
    setPastCenterRoles({
      ...pastCenterRoles,
      [role]: newVal === 0 ? '' : String(newVal),
    });
  };

  const adjustOfficeRoleCount = (role: string, delta: number) => {
    const current = parseInt(pastOfficeRoles[role] || '0', 10);
    const newVal = Math.max(0, (isNaN(current) ? 0 : current) + delta);
    setPastOfficeRoles({
      ...pastOfficeRoles,
      [role]: newVal === 0 ? '' : String(newVal),
    });
  };

  // Save current form fields back to the member (or create new form entry if blank)
  const executeSaveToMember = () => {
    const mergedPastRoles = { ...pastCenterRoles, ...pastOfficeRoles };

    // Find if the member exists in the centers tree
    let targetMember: StaffMember | undefined;
    let targetCenterId = initialCenterId;
    let targetOfficeId = initialOfficeId;

    if (selectedMemberId && selectedMemberId !== 'blank') {
      for (const c of centers) {
        const cm = c.centerStaff.find((m) => m.id === selectedMemberId);
        if (cm) {
          targetMember = cm;
          targetCenterId = c.id;
          break;
        }
        for (const off of c.offices) {
          const om = off.staff.find((m) => m.id === selectedMemberId);
          if (om) {
            targetMember = om;
            targetCenterId = c.id;
            targetOfficeId = off.id;
            break;
          }
        }
        if (targetMember) break;
      }
    }

    if (!targetMember && initialMember) {
      targetMember = initialMember;
      targetCenterId = initialCenterId;
      targetOfficeId = initialOfficeId;
    }

    // If blank or member not in list, find matching center by votingPlace or fallback to initial center
    let matchedCenter = centers.find(
      (c) =>
        normalizeArabic(c.name) === normalizeArabic(votingPlace) ||
        normalizeArabic(c.name).includes(normalizeArabic(votingPlace))
    );

    const finalCenterId = targetCenterId || matchedCenter?.id || centers[0]?.id;
    const finalOfficeId = targetOfficeId;

    const baseMember: StaffMember = targetMember || {
      id: selectedMemberId !== 'blank' && selectedMemberId ? selectedMemberId : `staff_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      role: initialMember?.role || 'إضافي أول',
      roleOrder: 99,
      firstName: '',
      lastName: '',
      birthDate: '',
      phone: '',
    };

    const updated: StaffMember = {
      ...baseMember,
      role: baseMember.role || initialMember?.role || 'إضافي أول',
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate: birthDate.trim(),
      phone: phone.trim(),
      fileNumber: fileNumber.trim(),
      depositDate: depositDate.trim(),
      communeRegistration: electoralCommune.trim(),
      votingPlace: votingPlace.trim(),
      electoralCardNumber: electoralCardNumber.trim(),
      fatherName: fatherName.trim(),
      motherFullName: motherFullName.trim(),
      birthCommune: birthCommune.trim(),
      birthCertificateNumber: birthCertNumber.trim(),
      maritalStatus,
      spouseFullName: spouseFullName.trim(),
      educationLevel: educationLevel.trim(),
      specialty: specialty.trim(),
      professionalStatus: professionalStatus.trim(),
      profession: profession.trim(),
      sector: sector.trim(),
      address: address.trim(),
      pastRoles: mergedPastRoles,
      isMemberOfAssociation: inAssociation,
      associationType: assocType,
      associationName: assocName.trim(),
      associationJoinDate: assocDate.trim(),
      isMemberOfPoliticalParty: inParty,
      partyJoinDate: partyDate.trim(),
      isRegisteredOnAuthorityWebsite: inWebsite,
      websiteUrl: websiteUrl.trim(),
      cityPlace: declarationCity.trim(),
      declarationDate: declarationDate.trim(),
    };

    if (onSaveMember && finalCenterId) {
      onSaveMember(updated, finalCenterId, finalOfficeId);
      // Link the form to this member ID now so subsequent saves update the same member
      setSelectedMemberId(updated.id);
      setIsSavedAlert(true);
      setTimeout(() => setIsSavedAlert(false), 3000);
    }
  };

  const handleSaveToMember = () => {
    // Check if the target member already had registered data (editing existing staff vs new registration)
    let existingTarget: StaffMember | undefined;
    if (selectedMemberId && selectedMemberId !== 'blank') {
      for (const c of centers) {
        const cm = c.centerStaff.find((m) => m.id === selectedMemberId);
        if (cm) {
          existingTarget = cm;
          break;
        }
        for (const off of c.offices) {
          const om = off.staff.find((m) => m.id === selectedMemberId);
          if (om) {
            existingTarget = om;
            break;
          }
        }
        if (existingTarget) break;
      }
    }
    if (!existingTarget && initialMember) {
      existingTarget = initialMember;
    }

    const isExisting = Boolean(
      existingTarget &&
        (existingTarget.firstName?.trim() ||
          existingTarget.lastName?.trim() ||
          existingTarget.phone?.trim() ||
          existingTarget.nationalId?.trim() ||
          existingTarget.electoralCardNumber?.trim())
    );

    if (!isExisting) {
      // Direct registration without PIN verification
      executeSaveToMember();
    } else {
      // Prompt for PIN when modifying an already registered staff member
      setIsPinModalOpen(true);
    }
  };

  const handlePrint = () => {
    setIsPrintChoiceOpen(true);
  };

  const handleConfirmDirectPrint = () => {
    setIsPrintChoiceOpen(false);
    setTimeout(() => window.print(), 150);
  };

  const handleConfirmWordExport = () => {
    setIsPrintChoiceOpen(false);
    setTimeout(() => {
      if (printableFormRef.current) {
        exportPrintableAsWord(printableFormRef.current, 'استمارة-تسجيل-مؤطر', 'استمارة تسجيل مؤطر', 'portrait');
      }
    }, 150);
  };

  if (!isOpen) return null;

  return (
    <div
      id="staff-form-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="staff-form-modal-card"
        className="w-full max-w-5xl bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]"
      >
        {/* ========================================================= */}
        {/* MODAL CONTROL BAR (Red Back Circle, Search Icon for Registered Staff, Save, Print) */}
        {/* ========================================================= */}
        <div className="print:hidden px-4 sm:px-6 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0 shadow-md">
          {/* Right: Circular Red Back Button & Search Icon */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              id="form-gradual-back-btn"
              type="button"
              onClick={handleGradualBack}
              className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white flex items-center justify-center shadow-lg border-2 border-red-300 transition-all cursor-pointer hover:scale-105 shrink-0"
              title={getGradualBackLabel()}
            >
              <ArrowRight className="w-5 h-5 font-black text-white" />
            </button>
            <span className="text-sm font-black text-slate-200 hidden sm:inline-block">
              {getGradualBackLabel()}
            </span>

            {/* Search for Registered Staff (رمز البحث) */}
            <div className="relative mr-1" ref={searchDropdownRef}>
              <button
                id="form-search-member-btn"
                type="button"
                onClick={() => {
                  setIsSearchOpen((prev) => !prev);
                  if (!isSearchOpen) setSearchQuery('');
                }}
                className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95 ${
                  isSearchOpen
                    ? 'bg-blue-600 text-white border-blue-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700 hover:border-slate-500'
                }`}
                title="البحث عن المسجلين وتحميل بياناتهم في الاستمارة"
              >
                <Search className="w-4 h-4 text-blue-300" />
                <span className="text-xs font-bold text-slate-200 hidden md:inline-block">
                  البحث عن المسجلين
                </span>
              </button>

              {/* Search Popover / Dropdown with Gradual Back */}
              {isSearchOpen && (
                <div className="absolute right-0 top-full mt-2 w-84 sm:w-[440px] bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl z-50 p-3.5 text-right backdrop-blur-md">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800">
                    {/* Small Red Gradual Back inside search box */}
                    <button
                      type="button"
                      onClick={() => {
                        if (searchQuery.trim()) {
                          // Step 1: clear text
                          setSearchQuery('');
                        } else {
                          // Step 2: close dropdown
                          setIsSearchOpen(false);
                        }
                      }}
                      className="w-7 h-7 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white flex items-center justify-center shadow border border-red-300 transition-all shrink-0 cursor-pointer"
                      title={searchQuery.trim() ? 'مسح نص البحث' : 'إغلاق البحث'}
                    >
                      <ArrowRight className="w-3.5 h-3.5 font-bold text-white" />
                    </button>
                    <Search className="w-4 h-4 text-blue-400 shrink-0" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="ابحث بالاسم، اللقب، المستوى (ليسانس/ماستر)، التخصص (حقوق/إعلام)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ color: '#FFFFFF' }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white !text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="p-1 text-slate-400 hover:text-white"
                        title="مسح البحث"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Quick Education & Specialty Suggestion Chips */}
                  <div className="py-2 flex flex-wrap items-center gap-1 border-b border-slate-800/80">
                    <span className="text-[11px] font-bold text-slate-400 ml-1">اقتراحات سريعة:</span>
                    {[
                      { label: '🎓 ليسانس', query: 'ليسانس' },
                      { label: '🎓 ماستر', query: 'ماستر' },
                      { label: '⚙️ مهندس', query: 'مهندس' },
                      { label: '⚖️ حقوق', query: 'حقوق' },
                      { label: '💻 إعلام آلي', query: 'إعلام آلي' },
                      { label: '📊 اقتصاد', query: 'اقتصاد' },
                      { label: '📚 تعليم', query: 'تعليم' },
                    ].map((chip) => (
                      <button
                        key={chip.query}
                        type="button"
                        onClick={() => setSearchQuery(chip.query)}
                        className={`text-[10.5px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                          searchQuery.includes(chip.query)
                            ? 'bg-blue-600 text-white border-blue-400 font-bold'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>

                  {/* Action: Empty blank form */}
                  <div className="flex items-center justify-between gap-2 my-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectMemberChange('blank');
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="flex-1 text-right px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800/90 hover:bg-blue-600/30 text-slate-200 hover:text-white border border-slate-700 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                        <span>استمارة جديدة فارغة (تفريغ)</span>
                      </span>
                      <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300 font-mono">تفريغ</span>
                    </button>
                    {searchQuery && (
                      <span className="text-[10.5px] font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-800 px-2 py-1 rounded-lg shrink-0">
                        {filteredMembers.length} نتيجة
                      </span>
                    )}
                  </div>

                  {/* Results List */}
                  <div className="max-h-72 overflow-y-auto space-y-1.5 divide-y divide-slate-800/40 pr-0.5">
                    {filteredMembers.length === 0 ? (
                      <p className="text-center py-5 text-xs text-slate-400">
                        {searchQuery ? 'لا توجد نتائج مطابقة لبحثك (جرب اسم آخر، أو مستوى، أو تخصص مختلف)' : 'لا يوجد مؤطرون مسجلون'}
                      </p>
                    ) : (
                      filteredMembers.map((item) => (
                        <button
                          key={item.member.id}
                          type="button"
                          onClick={() => {
                            handleSelectMemberChange(item.member.id);
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className={`w-full text-right p-2.5 rounded-xl text-xs transition-all flex flex-col gap-1.5 cursor-pointer border ${
                            selectedMemberId === item.member.id
                              ? 'bg-blue-900/90 border-blue-400 text-white shadow-lg'
                              : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/60 hover:border-slate-600 text-slate-200'
                          }`}
                        >
                          {/* Top: Name & Role Badge */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-white text-sm">
                                {item.member.lastName} {item.member.firstName}
                              </span>
                              {item.matchReason && searchQuery && (
                                <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-amber-950/90 text-amber-300 border border-amber-600/60">
                                  {item.matchReason}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-200 font-mono shrink-0">
                              {item.member.role}
                            </span>
                          </div>

                          {/* Center & Office Line */}
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>{item.centerName} {item.officeNumber ? `• مكتب ${item.officeNumber}` : ''}</span>
                            {item.member.birthDate && (
                              <span className="font-mono text-slate-300 text-[10.5px]">{item.member.birthDate}</span>
                            )}
                          </div>

                          {/* Education Level & Specialty & Profession Badges */}
                          {(item.member.educationLevel || item.member.specialty || item.member.profession || item.member.notes) && (
                            <div className="flex flex-wrap items-center gap-1 pt-0.5">
                              {item.member.educationLevel && (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-blue-950/80 text-blue-200 border border-blue-700/60 px-1.5 py-0.5 rounded">
                                  <GraduationCap className="w-3 h-3 text-blue-400" />
                                  <span>{item.member.educationLevel}</span>
                                </span>
                              )}
                              {item.member.specialty && (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-950/80 text-emerald-200 border border-emerald-700/60 px-1.5 py-0.5 rounded">
                                  <BookOpen className="w-3 h-3 text-emerald-400" />
                                  <span>{item.member.specialty}</span>
                                </span>
                              )}
                              {(item.member.profession || item.member.notes) && (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-purple-950/80 text-purple-200 border border-purple-700/60 px-1.5 py-0.5 rounded truncate max-w-[200px]">
                                  <Briefcase className="w-3 h-3 text-purple-400 shrink-0" />
                                  <span className="truncate">{item.member.profession || item.member.notes}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Left / Center: Save Button & Print Button ONLY */}
          <div className="flex items-center gap-3">
            {/* Save Data Button */}
            <button
              id="save-form-data-btn"
              type="button"
              onClick={handleSaveToMember}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-black transition-all border border-emerald-400 flex items-center gap-1.5 shadow-md cursor-pointer"
              title="حفظ بيانات الاستمارة"
            >
              <Save className="w-4 h-4 text-emerald-100" />
              <span>حفظ البيانات</span>
            </button>

            {/* Print Button */}
            <button
              id="print-official-form-btn"
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-black transition-all border border-blue-400 shadow-md flex items-center gap-1.5 cursor-pointer"
              title="طباعة الاستمارة"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>طباعة</span>
            </button>
          </div>
        </div>

        {/* Save confirmation toast */}
        {isSavedAlert && (
          <div className="print:hidden bg-emerald-700 text-white text-xs font-black py-1.5 px-4 text-center border-b border-emerald-400 animate-in fade-in flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>تم حفظ وتحديث بيانات المؤطر بنجاح في قاعدة البيانات!</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* PRINTABLE FORM BODY (Clean Paper Desk with A4 Sheet) */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-6 bg-slate-200/90 flex justify-center items-start">
          <div
            id="printable-electoral-form"
            ref={printableFormRef}
            dir="rtl"
            className="w-full max-w-[800px] bg-white text-black p-5 sm:p-8 shadow-2xl rounded-sm font-serif border border-slate-300 selection:bg-slate-200 selection:text-black my-2"
            style={{
              fontFamily: '"Amiri", "Traditional Arabic", "Scheherazade New", "Times New Roman", serif',
            }}
          >
            {/* Inline Print Styles */}
            <style>{`
              .form-filled-val {
                color: #000000 !important;
                -webkit-text-fill-color: #000000 !important;
                font-weight: 900 !important;
                font-size: 16px;
                text-shadow: 0 0 0.4px #000000;
              }
              .form-filled-name {
                font-size: 19px !important;
                font-weight: 900 !important;
                text-shadow: 0 0 0.6px #000000;
              }
              .form-check-mark {
                font-size: 15px !important;
                font-weight: 900 !important;
                color: #000000 !important;
                -webkit-text-fill-color: #000000 !important;
                line-height: 1 !important;
              }
              @media print {
                @page {
                  size: 210mm 297mm portrait; /* 21x29.7 cm (A4) */
                  margin: 5mm 7mm;
                }
                html, body {
                  background: #FFFFFF !important;
                  color: #000000 !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  width: 100% !important;
                  height: auto !important;
                  overflow: visible !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                #staff-form-modal-overlay,
                #staff-form-modal-card {
                  position: static !important;
                  display: block !important;
                  max-height: none !important;
                  height: auto !important;
                  overflow: visible !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  background: transparent !important;
                  border: none !important;
                  box-shadow: none !important;
                }
                body * {
                  visibility: hidden;
                }
                #printable-electoral-form, #printable-electoral-form * {
                  visibility: visible;
                }
                #printable-electoral-form {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100% !important;
                  max-width: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  border: none !important;
                  box-shadow: none !important;
                  background: #FFFFFF !important;
                  color: #000000 !important;
                  font-size: 12.5px !important;
                  line-height: 1.35 !important;
                  page-break-after: avoid;
                  break-after: avoid;
                }
                input, select, textarea {
                  border: none !important;
                  border-bottom: 1px dotted #000000 !important;
                  background: transparent !important;
                  color: #000000 !important;
                  -webkit-text-fill-color: #000000 !important;
                  font-weight: 900 !important;
                  font-size: 16px !important;
                  text-shadow: 0 0 0.5px #000000 !important;
                  box-shadow: none !important;
                  opacity: 1 !important;
                }
                .form-filled-name {
                  font-size: 18.5px !important;
                  font-weight: 900 !important;
                  text-shadow: 0 0 0.6px #000000 !important;
                }
                .form-check-mark {
                  font-size: 16px !important;
                  font-weight: 900 !important;
                  color: #000000 !important;
                  -webkit-text-fill-color: #000000 !important;
                }
                .no-print, .print\\:hidden {
                  display: none !important;
                }
                .print-only-inline {
                  display: inline !important;
                }
                .print-box-checked {
                  background-color: #000000 !important;
                  color: #FFFFFF !important;
                }
              }
            `}</style>

            {/* ========================================================= */}
            {/* ========================================================= */}
            {/* 1. OFFICIAL HEADER (الجمهورية الجزائرية + الشعار على اليمين + مربع الصورة ورقم الملف على اليسار) */}
            {/* ========================================================= */}
            <div className="relative mb-2 pb-2 border-b border-black">
              <div className="grid grid-cols-12 items-start gap-2">
                {/* Right Column: Official Circular Logo (عرض مناسب 2 أعمدة) */}
                <div className="col-span-2 flex items-center justify-start">
                  <div className="w-18 h-18 sm:w-22 sm:h-22 shrink-0 flex items-center justify-center">
                    <AnieLogo className="w-full h-full object-contain" />
                  </div>
                </div>

                {/* Center Column: Official Country Header (6 أعمدة مركزية متوازنة بدون تداخل) */}
                <div className="col-span-6 text-center pt-0 px-1">
                  <h1 className="text-sm sm:text-base md:text-lg font-black tracking-normal text-black pb-0.5 whitespace-nowrap">
                    الجمهورية الجزائرية الديمقراطية الشعبية
                  </h1>
                  <h2 className="text-xs sm:text-sm font-extrabold text-black pt-0.5">
                    السلطة الوطنية المستقلة للانتخابات
                  </h2>
                  <div className="flex items-center justify-center gap-1 pt-1 text-xs sm:text-sm font-bold">
                    <span className="shrink-0 text-black">المنسق البلدي لبلدية</span>
                    <input
                      type="text"
                      value={communeCoordinator}
                      onChange={(e) => setCommuneCoordinator(e.target.value)}
                      placeholder=". . . . . . . . . ."
                      className="form-filled-val px-1 py-0.5 text-center font-black text-xs sm:text-sm text-black bg-transparent placeholder:text-slate-950 placeholder:font-black placeholder:tracking-[0.3em] focus:outline-none w-28 sm:w-36"
                    />
                  </div>
                </div>

                {/* Left Column: File No & Date + Dedicated Photo Box at the far-left edge (4 أعمدة مستقلة تماماً ومتباعدة) */}
                <div className="col-span-4 flex items-start justify-end gap-1.5 sm:gap-2.5">
                  {/* 1. File No & Date (متباعد تماماً عن كتابة الجمهورية) */}
                  <div className="flex-1 max-w-[130px] sm:max-w-[150px] text-xs font-bold text-right pt-0.5 space-y-1.5">
                    <div className="flex items-center justify-end gap-1">
                      <span className="shrink-0 font-black text-black text-[11px] sm:text-xs">رقم الملف:</span>
                      <input
                        type="text"
                        value={fileNumber}
                        onChange={(e) => setFileNumber(e.target.value)}
                        placeholder=". . . . . . ."
                        className="form-filled-val px-1 py-0 text-center font-mono font-black text-xs text-black bg-transparent placeholder:text-slate-950 placeholder:font-black placeholder:tracking-[0.2em] focus:outline-none flex-1 border-b border-dotted border-black min-w-0"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <span className="shrink-0 font-black text-black text-[11px] sm:text-xs">تاريخ الإيداع:</span>
                      <input
                        type="text"
                        value={depositDate}
                        onChange={(e) => setDepositDate(e.target.value)}
                        placeholder=". . . . . . ."
                        className="form-filled-val px-1 py-0 text-center font-mono font-black text-xs text-black bg-transparent placeholder:text-slate-950 placeholder:font-black placeholder:tracking-[0.2em] focus:outline-none flex-1 border-b border-dotted border-black min-w-0"
                      />
                    </div>
                  </div>

                  {/* 2. Dedicated Photo Box at the edge of the sheet on the top left (مربع خاص بالصورة الفوطوغرافية مع طرف الورقة في الأعلى على اليسار) */}
                  <div className="w-18 h-22 sm:w-20 sm:h-26 border-2 border-black bg-white shrink-0 flex flex-col items-center justify-center text-center p-1 relative shadow-xs">
                    <span className="text-[9.5px] sm:text-[10.5px] font-bold text-slate-400 select-none leading-tight">
                      صورة<br />شمسية
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* 2. FORM TITLE IN RECTANGULAR BOX */}
            {/* ========================================================= */}
            <div className="my-2.5 text-center">
              <div className="inline-block border-2 border-black px-6 py-1.5 rounded-xs bg-slate-50">
                <h2 className="text-sm sm:text-base md:text-lg font-black text-black tracking-wide">
                  استمارة طلب التسجيل في قائمة تأطير الانتخابات
                </h2>
              </div>
            </div>

            {/* ========================================================= */}
            {/* 3. PERSONAL & ELECTORAL INFORMATION FIELDS */}
            {/* ========================================================= */}
            <div className="space-y-2 text-xs sm:text-[13.5px] leading-snug pt-0.5">
              {/* Row 1: Electoral Commune & Voting Place */}
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <div className="flex items-center flex-1 min-w-[240px]">
                  <span className="font-bold shrink-0">بلدية التسجيل في القائمة الانتخابية:</span>
                  <input
                    type="text"
                    value={electoralCommune}
                    onChange={(e) => setElectoralCommune(e.target.value)}
                    placeholder=". . . . . . . . . . . . . . . . . . . ."
                    className="form-filled-val px-1.5 py-0.5 text-black font-black text-base sm:text-[17px] bg-transparent placeholder:text-slate-950 placeholder:font-black placeholder:tracking-[0.3em] focus:outline-none flex-1"
                  />
                </div>
                <div className="flex items-center flex-1 min-w-[240px]">
                  <span className="font-bold shrink-0">مكان الانتخاب:</span>
                  <input
                    type="text"
                    value={votingPlace}
                    onChange={(e) => setVotingPlace(e.target.value)}
                    placeholder=". . . . . . . . . . . . . . . . . . . ."
                    className="form-filled-val px-1.5 py-0.5 text-black font-black text-base sm:text-[17px] bg-transparent placeholder:text-slate-950 placeholder:font-black placeholder:tracking-[0.3em] focus:outline-none flex-1"
                  />
                </div>
              </div>

              {/* Row 2: Electoral Card Number */}
              <div className="flex items-center">
                <span className="font-bold shrink-0">رقم التسجيل في الانتخابات (البطاقة):</span>
                <input
                  type="text"
                  value={electoralCardNumber}
                  onChange={(e) => setElectoralCardNumber(e.target.value)}
                  placeholder=". . . . . . . . . . . . . . . . . . . . . . . . . . . . . ."
                  className="form-filled-val px-1.5 py-0.5 text-black font-mono font-black text-base sm:text-[17px] bg-transparent placeholder:text-slate-950 placeholder:font-black placeholder:tracking-[0.3em] focus:outline-none flex-1"
                />
              </div>

              {/* Row 3: Surname */}
              <div className="flex items-center">
                <span className="font-bold shrink-0 min-w-[65px]">اللقب:</span>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder=". . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ."
                  className="form-filled-val form-filled-name px-1.5 py-0.5 text-black font-black text-lg sm:text-xl bg-transparent placeholder:text-slate-950 placeholder:font-black placeholder:tracking-[0.3em] focus:outline-none flex-1"
                />
              </div>

              {/* Row 4: First Name */}
              <div className="flex items-center">
                <span className="font-bold shrink-0 min-w-[65px]">الاسم:</span>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder=". . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ."
                  className="form-filled-val form-filled-name px-1.5 py-0.5 text-black font-black text-lg sm:text-xl bg-transparent placeholder:text-slate-950 placeholder:font-black placeholder:tracking-[0.3em] focus:outline-none flex-1"
                />
              </div>

              {/* Row 5: Father's Name & Mother's Name */}
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <div className="flex items-center flex-1 min-w-[200px]">
                  <span className="font-bold shrink-0">اسم الأب:</span>
                  <input
                    type="text"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    placeholder=". . . . . . . . . . . . . . . . . . . ."
                    className="form-filled-val px-1.5 py-0.5 text-black font-black text-base sm:text-[17px] bg-transparent placeholder:text-slate-950 placeholder:font-black placeholder:tracking-[0.3em] focus:outline-none flex-1"
                  />
                </div>
                <div className="flex items-center flex-1 min-w-[240px]">
                  <span className="font-bold shrink-0">لقب واسم الأم:</span>
                  <input
                    type="text"
                    value={motherFullName}
                    onChange={(e) => setMotherFullName(e.target.value)}
                    placeholder=". . . . . . . . . . . . . . . . . . . ."
                    className="form-filled-val px-1.5 py-0.5 text-black font-black text-base sm:text-[17px] bg-transparent placeholder:text-slate-950 placeholder:font-black placeholder:tracking-[0.3em] focus:outline-none flex-1"
                  />
                </div>
              </div>

              {/* Row 6: Birth Date, Birth Commune, Birth Certificate No */}
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <div className="flex items-center flex-1 min-w-[170px]">
                  <span className="font-bold shrink-0">تاريخ الميلاد:</span>
                  <input
                    type="text"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    placeholder=". . . . . . . . . . . ."
                    className="form-filled-val px-1.5 py-0.5 text-black font-mono font-black text-base sm:text-[17px] bg-transparent placeholder:text-slate-950 placeholder:font-black placeholder:tracking-[0.3em] focus:outline-none flex-1"
                  />
                </div>
                <div className="flex items-center flex-1 min-w-[160px]">
                  <span className="font-bold shrink-0">بلدية الميلاد:</span>
                  <input
                    type="text"
                    value={birthCommune}
                    onChange={(e) => setBirthCommune(e.target.value)}
                    placeholder=". . . . . . . . . . . ."
                    className="form-filled-val px-1.5 py-0.5 text-black font-black text-base sm:text-[17px] bg-transparent placeholder:text-slate-950 placeholder:font-black placeholder:tracking-[0.3em] focus:outline-none flex-1"
                  />
                </div>
                <div className="flex items-center flex-1 min-w-[160px]">
                  <span className="font-bold shrink-0">رقم شهادة الميلاد:</span>
                  <input
                    type="text"
                    value={birthCertNumber}
                    onChange={(e) => setBirthCertNumber(e.target.value)}
                    placeholder=". . . . . . . . . . . ."
                    className="form-filled-val px-1.5 py-0.5 text-black font-mono font-black text-base sm:text-[17px] bg-transparent placeholder:text-slate-950 placeholder:font-black placeholder:tracking-[0.3em] focus:outline-none flex-1"
                  />
                </div>
              </div>

              {/* Row 7: Marital Status & Spouse Name */}
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-bold">الحالة العائلية:</span>
                  {/* Single Option */}
                  <button
                    type="button"
                    onClick={() => setMaritalStatus(maritalStatus === 'single' ? '' : 'single')}
                    className="inline-flex items-center gap-1 text-black font-bold cursor-pointer select-none"
                  >
                    <span className="w-4 h-4 sm:w-4.5 sm:h-4.5 border-2 border-black inline-flex items-center justify-center bg-white">
                      <span className="form-check-mark text-sm font-black text-black">{maritalStatus === 'single' ? '✓' : ''}</span>
                    </span>
                    <span className="font-extrabold text-xs sm:text-sm">اعزب (ة)</span>
                  </button>

                  {/* Married Option */}
                  <button
                    type="button"
                    onClick={() => setMaritalStatus(maritalStatus === 'married' ? '' : 'married')}
                    className="inline-flex items-center gap-1 text-black font-bold cursor-pointer select-none"
                  >
                    <span className="w-4 h-4 sm:w-4.5 sm:h-4.5 border-2 border-black inline-flex items-center justify-center bg-white">
                      <span className="form-check-mark text-sm font-black text-black">{maritalStatus === 'married' ? '✓' : ''}</span>
                    </span>
                    <span className="font-extrabold text-xs sm:text-sm">متزوج (ة)</span>
                  </button>
                </div>
                <div className="flex items-center flex-1 min-w-[220px]">
                  <span className="font-bold shrink-0">لقب واسم الزوج (ة):</span>
                  <input
                    type="text"
                    value={spouseFullName}
                    onChange={(e) => setSpouseFullName(e.target.value)}
                    placeholder=". . . . . . . . . . . . . . . . . . . ."
                    className="form-filled-val px-1.5 py-0.5 text-black font-black text-base sm:text-[17px] bg-transparent placeholder:text-slate-950 placeholder:font-black placeholder:tracking-[0.3em] focus:outline-none flex-1"
                  />
                </div>
              </div>

              {/* Row 8: Education Level & Specialty */}
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <div className="flex items-center flex-1 min-w-[200px]">
                  <span className="font-bold shrink-0">المستوى الدراسي:</span>
                  <input
                    type="text"
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    placeholder=". . . . . . . . . . . . . . . . . . . ."
                    className="form-filled-val px-1.5 py-0.5 text-black font-black text-base sm:text-[17px] bg-transparent placeholder:text-slate-950 placeholder:font-black placeholder:tracking-[0.3em] focus:outline-none flex-1"
                  />
                </div>
                <div className="flex items-center flex-1 min-w-[220px]">
                  <span className="font-bold shrink-0">التخصص:</span>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder=". . . . . . . . . . . . . . . . . . . ."
                    className="form-filled-val px-1.5 py-0.5 text-black font-black text-base sm:text-[17px] bg-transparent placeholder:text-slate-950 placeholder:font-black placeholder:tracking-[0.3em] focus:outline-none flex-1"
                  />
                </div>
              </div>

              {/* Row 9: Professional Status, Profession, Sector */}
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <div className="flex items-center flex-1 min-w-[150px]">
                  <span className="font-bold shrink-0">الحالة المهنية:</span>
                  <input
                    type="text"
                    value={professionalStatus}
                    onChange={(e) => setProfessionalStatus(e.target.value)}
                    placeholder=". . . . . . . . . . . ."
                    className="form-filled-val px-1.5 py-0.5 text-black font-black text-base sm:text-[17px] bg-transparent placeholder:text-slate-950 placeholder:font-black placeholder:tracking-[0.3em] focus:outline-none flex-1"
                  />
                </div>
                <div className="flex items-center flex-1 min-w-[160px]">
                  <span className="font-bold shrink-0">المهنة:</span>
                  <input
                    type="text"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    placeholder=". . . . . . . . . . . ."
                    className="form-filled-val px-1.5 py-0.5 text-black font-black text-base sm:text-[17px] bg-transparent placeholder:text-slate-950 placeholder:font-black placeholder:tracking-[0.3em] focus:outline-none flex-1"
                  />
                </div>
                <div className="flex items-center flex-1 min-w-[150px]">
                  <span className="font-bold shrink-0">القطاع:</span>
                  <input
                    type="text"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    placeholder=". . . . . . . . . . . ."
                    className="form-filled-val px-1.5 py-0.5 text-black font-black text-base sm:text-[17px] bg-transparent placeholder:text-slate-950 placeholder:font-black placeholder:tracking-[0.3em] focus:outline-none flex-1"
                  />
                </div>
              </div>

              {/* Row 10: Address & Phone */}
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <div className="flex items-center flex-1 min-w-[240px]">
                  <span className="font-bold shrink-0">عنوان الإقامة:</span>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder=". . . . . . . . . . . . . . . . . . . . . . . . . . . . . ."
                    className="form-filled-val px-1.5 py-0.5 text-black font-black text-base sm:text-[17px] bg-transparent placeholder:text-slate-950 placeholder:font-black placeholder:tracking-[0.3em] focus:outline-none flex-1"
                  />
                </div>
                <div className="flex items-center flex-1 min-w-[180px]">
                  <span className="font-bold shrink-0">رقم الهاتف:</span>
                  <input
                    type="text"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder=". . . . . . . . . . . ."
                    className="form-filled-val px-1.5 py-0.5 text-black text-right font-mono font-black text-base sm:text-[17px] bg-transparent placeholder:text-slate-950 placeholder:font-black placeholder:tracking-[0.3em] focus:outline-none flex-1"
                  />
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* 4. PREVIOUS PARTICIPATIONS TABLE (المشاركات السابقة في التأطير الانتخابي) */}
            {/* ========================================================= */}
            <div className="mt-3 pt-1">
              <div className="text-center font-black text-xs sm:text-sm mb-1">
                المشاركات السابقة في التأطير الانتخابي ( ان وجدت )
              </div>

              <div className="grid grid-cols-2 border-2 border-black">
                {/* Right Column: التأطير في المركز */}
                <div className="border-l-2 border-black">
                  <div className="bg-slate-100 text-center font-black text-xs sm:text-[13px] py-0.5 border-b border-black">
                    التأطير في المركز
                  </div>
                  <div className="grid grid-cols-3 text-center text-xs font-bold border-b border-black bg-slate-50">
                    <div className="col-span-2 py-0.5 border-l border-black">النوع</div>
                    <div className="py-0.5">العدد</div>
                  </div>
                  {[
                    'رئيس مركز',
                    'مساعد اول',
                    'مساعد ثاني',
                    'مساعد ثالث',
                    'مساعد رابع',
                    'ممثل السلطة',
                  ].map((roleTitle, idx) => (
                    <div
                      key={roleTitle}
                      className={`grid grid-cols-3 text-xs items-center ${
                        idx !== 5 ? 'border-b border-black' : ''
                      }`}
                    >
                      <div className="col-span-2 py-0.5 px-1.5 font-bold border-l border-black text-right">
                        {roleTitle}
                      </div>
                      <div className="py-0.5 text-center flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => adjustCenterRoleCount(roleTitle, -1)}
                          className="no-print w-4 h-4 rounded-xs bg-slate-200 hover:bg-slate-300 text-black flex items-center justify-center font-bold text-2xs cursor-pointer select-none"
                          title="إنقاص"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <input
                          type="text"
                          value={pastCenterRoles[roleTitle] || ''}
                          onChange={(e) =>
                            setPastCenterRoles({
                              ...pastCenterRoles,
                              [roleTitle]: e.target.value,
                            })
                          }
                          placeholder=""
                          className="form-filled-val w-8 text-center font-mono font-black text-sm sm:text-base text-black bg-transparent focus:bg-transparent focus:outline-none py-0.5"
                        />
                        <button
                          type="button"
                          onClick={() => adjustCenterRoleCount(roleTitle, 1)}
                          className="no-print w-4 h-4 rounded-xs bg-slate-200 hover:bg-slate-300 text-black flex items-center justify-center font-bold text-2xs cursor-pointer select-none"
                          title="زيادة"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Left Column: التأطير في المكتب */}
                <div>
                  <div className="bg-slate-100 text-center font-black text-xs sm:text-[13px] py-0.5 border-b border-black">
                    التأطير في المكتب
                  </div>
                  <div className="grid grid-cols-3 text-center text-xs font-bold border-b border-black bg-slate-50">
                    <div className="col-span-2 py-0.5 border-l border-black">النوع</div>
                    <div className="py-0.5">العدد</div>
                  </div>
                  {[
                    'رئيس مكتب',
                    'نائب رئيس مكتب',
                    'كاتب',
                    'مساعد اول',
                    'مساعد ثاني',
                    'اضافي اول',
                    'اضافي ثاني',
                  ].map((roleTitle, idx) => (
                    <div
                      key={roleTitle}
                      className={`grid grid-cols-3 text-xs items-center ${
                        idx !== 6 ? 'border-b border-black' : ''
                      }`}
                    >
                      <div className="col-span-2 py-0.5 px-1.5 font-bold border-l border-black text-right">
                        {roleTitle}
                      </div>
                      <div className="py-0.5 text-center flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => adjustOfficeRoleCount(roleTitle, -1)}
                          className="no-print w-4 h-4 rounded-xs bg-slate-200 hover:bg-slate-300 text-black flex items-center justify-center font-bold text-2xs cursor-pointer select-none"
                          title="إنقاص"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <input
                          type="text"
                          value={pastOfficeRoles[roleTitle] || ''}
                          onChange={(e) =>
                            setPastOfficeRoles({
                              ...pastOfficeRoles,
                              [roleTitle]: e.target.value,
                            })
                          }
                          placeholder=""
                          className="form-filled-val w-8 text-center font-mono font-black text-sm sm:text-base text-black bg-transparent focus:bg-transparent focus:outline-none py-0.5"
                        />
                        <button
                          type="button"
                          onClick={() => adjustOfficeRoleCount(roleTitle, 1)}
                          className="no-print w-4 h-4 rounded-xs bg-slate-200 hover:bg-slate-300 text-black flex items-center justify-center font-bold text-2xs cursor-pointer select-none"
                          title="زيادة"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* 5. AFFILIATIONS, POLITICAL PARTIES, AUTHORITY WEBSITE */}
            {/* ========================================================= */}
            <div className="mt-2.5 space-y-1.5 text-xs sm:text-[13px] leading-snug border-t border-black pt-1.5">
              {/* Question 1: Association Membership */}
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-bold">هل انت منخرط في جمعية حاليا:</span>
                  <button
                    type="button"
                    onClick={() => setInAssociation(inAssociation === 'yes' ? '' : 'yes')}
                    className="inline-flex items-center gap-1 font-bold cursor-pointer select-none"
                  >
                    <span className="w-4 h-4 sm:w-4.5 sm:h-4.5 border-2 border-black inline-flex items-center justify-center bg-white">
                      <span className="form-check-mark text-sm font-black text-black">{inAssociation === 'yes' ? '✓' : ''}</span>
                    </span>
                    <span className="font-extrabold text-xs sm:text-sm">نعم</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInAssociation(inAssociation === 'no' ? '' : 'no')}
                    className="inline-flex items-center gap-1 font-bold cursor-pointer select-none"
                  >
                    <span className="w-4 h-4 sm:w-4.5 sm:h-4.5 border-2 border-black inline-flex items-center justify-center bg-white">
                      <span className="form-check-mark text-sm font-black text-black">{inAssociation === 'no' ? '✓' : ''}</span>
                    </span>
                    <span className="font-extrabold text-xs sm:text-sm">لا</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold">نوع الجمعية:</span>
                  <button
                    type="button"
                    onClick={() => setAssocType(assocType === 'national' ? '' : 'national')}
                    className="inline-flex items-center gap-1 font-bold cursor-pointer select-none"
                  >
                    <span className="w-4 h-4 sm:w-4.5 sm:h-4.5 border-2 border-black inline-flex items-center justify-center bg-white">
                      <span className="form-check-mark text-sm font-black text-black">{assocType === 'national' ? '✓' : ''}</span>
                    </span>
                    <span className="font-extrabold text-xs sm:text-sm">وطنية</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssocType(assocType === 'local' ? '' : 'local')}
                    className="inline-flex items-center gap-1 font-bold cursor-pointer select-none"
                  >
                    <span className="w-4 h-4 sm:w-4.5 sm:h-4.5 border-2 border-black inline-flex items-center justify-center bg-white">
                      <span className="form-check-mark text-sm font-black text-black">{assocType === 'local' ? '✓' : ''}</span>
                    </span>
                    <span className="font-extrabold text-xs sm:text-sm">محلية</span>
                  </button>
                </div>
              </div>

              {/* Association Name & Date */}
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 pr-3">
                <div className="flex items-center flex-1 min-w-[220px]">
                  <span className="font-bold shrink-0">اذكر اسم الجمعية:</span>
                  <input
                    type="text"
                    value={assocName}
                    onChange={(e) => setAssocName(e.target.value)}
                    placeholder=". . . . . . . . . . . . . . . . . . . ."
                    className="form-filled-val px-1.5 py-0.5 text-black font-black text-base sm:text-[17px] bg-transparent placeholder:text-slate-950 placeholder:font-black placeholder:tracking-[0.3em] focus:outline-none flex-1"
                  />
                </div>
                <div className="flex items-center flex-1 min-w-[160px]">
                  <span className="font-bold shrink-0">تاريخ الانخراط:</span>
                  <input
                    type="text"
                    value={assocDate}
                    onChange={(e) => setAssocDate(e.target.value)}
                    placeholder=". . . . . . . . . . . ."
                    className="form-filled-val px-1.5 py-0.5 text-black font-mono font-black text-base sm:text-[17px] bg-transparent placeholder:text-slate-950 placeholder:font-black placeholder:tracking-[0.3em] focus:outline-none flex-1"
                  />
                </div>
              </div>

              {/* Question 2: Political Party Membership */}
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-bold">هل انت منخرط في حزب سياسي:</span>
                  <button
                    type="button"
                    onClick={() => setInParty(inParty === 'yes' ? '' : 'yes')}
                    className="inline-flex items-center gap-1 font-bold cursor-pointer select-none"
                  >
                    <span className="w-4 h-4 sm:w-4.5 sm:h-4.5 border-2 border-black inline-flex items-center justify-center bg-white">
                      <span className="form-check-mark text-sm font-black text-black">{inParty === 'yes' ? '✓' : ''}</span>
                    </span>
                    <span className="font-extrabold text-xs sm:text-sm">نعم</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInParty(inParty === 'no' ? '' : 'no')}
                    className="inline-flex items-center gap-1 font-bold cursor-pointer select-none"
                  >
                    <span className="w-4 h-4 sm:w-4.5 sm:h-4.5 border-2 border-black inline-flex items-center justify-center bg-white">
                      <span className="form-check-mark text-sm font-black text-black">{inParty === 'no' ? '✓' : ''}</span>
                    </span>
                    <span className="font-extrabold text-xs sm:text-sm">لا</span>
                  </button>
                </div>
                <div className="flex items-center flex-1 min-w-[180px]">
                  <span className="font-bold shrink-0">تاريخ الانخراط:</span>
                  <input
                    type="text"
                    value={partyDate}
                    onChange={(e) => setPartyDate(e.target.value)}
                    placeholder=". . . . . . . . . . . ."
                    className="form-filled-val px-1.5 py-0.5 text-black font-mono font-black text-base sm:text-[17px] bg-transparent placeholder:text-slate-950 placeholder:font-black placeholder:tracking-[0.3em] focus:outline-none flex-1"
                  />
                </div>
              </div>

              {/* Question 3: Authority Website Registration */}
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-bold">هل انت مسجل في موقع السلطة المستقلة للانتخابات:</span>
                  <button
                    type="button"
                    onClick={() => setInWebsite(inWebsite === 'yes' ? '' : 'yes')}
                    className="inline-flex items-center gap-1 font-bold cursor-pointer select-none"
                  >
                    <span className="w-4 h-4 sm:w-4.5 sm:h-4.5 border-2 border-black inline-flex items-center justify-center bg-white">
                      <span className="form-check-mark text-sm font-black text-black">{inWebsite === 'yes' ? '✓' : ''}</span>
                    </span>
                    <span className="font-extrabold text-xs sm:text-sm">نعم</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInWebsite(inWebsite === 'no' ? '' : 'no')}
                    className="inline-flex items-center gap-1 font-bold cursor-pointer select-none"
                  >
                    <span className="w-4 h-4 sm:w-4.5 sm:h-4.5 border-2 border-black inline-flex items-center justify-center bg-white">
                      <span className="form-check-mark text-sm font-black text-black">{inWebsite === 'no' ? '✓' : ''}</span>
                    </span>
                    <span className="font-extrabold text-xs sm:text-sm">لا</span>
                  </button>
                </div>
              </div>

              {/* Website URL */}
              <div className="flex items-center pr-3">
                <span className="font-bold shrink-0">عنوان الموقع:</span>
                <input
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder=". . . . . . . . . . . . . . . . . . . . . . . . . . . . . ."
                  className="form-filled-val px-1.5 py-0.5 text-black font-mono font-black text-sm sm:text-base bg-transparent placeholder:text-slate-950 placeholder:font-black placeholder:tracking-[0.3em] focus:outline-none flex-1"
                />
              </div>
            </div>

            {/* ========================================================= */}
            {/* 6. HONOR DECLARATION */}
            {/* ========================================================= */}
            <div className="mt-3 text-center font-black text-xs sm:text-[13.5px] border-t border-b border-black py-1 bg-slate-50">
              انا الممضي اسفله اصرح بشرفي بصحة المعلومات المقدمة في هذه الاستمارة
            </div>

            {/* ========================================================= */}
            {/* 7. FOOTER (المرفقات + مكان وتاريخ التحرير + الإمضاء) */}
            {/* ========================================================= */}
            <div className="mt-3 flex items-start justify-between gap-4 text-xs sm:text-[13px]">
              {/* Right: Attachments (المرفقات) */}
              <div className="space-y-0.5 font-bold">
                <div className="font-black text-black">المرفقات:</div>
                <div className="flex items-center gap-1">
                  <span>•</span>
                  <span>صورتان شمسيتان وكتابة الاسم واللقب خلف الصورة</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>•</span>
                  <span>بطاقة الناخب صورة طبق الاصل</span>
                </div>
              </div>

              {/* Left: Place, Date & Signature */}
              <div className="text-center space-y-2 min-w-[190px]">
                <div className="flex items-center justify-center gap-1 font-bold">
                  <input
                    type="text"
                    value={declarationCity}
                    onChange={(e) => setDeclarationCity(e.target.value)}
                    placeholder=". . . . . . . ."
                    className="form-filled-val px-1 text-center font-black text-sm sm:text-base text-black bg-transparent placeholder:text-slate-950 placeholder:font-black placeholder:tracking-[0.3em] w-28 focus:outline-none"
                  />
                  <span>في</span>
                  <input
                    type="text"
                    value={declarationDate}
                    onChange={(e) => setDeclarationDate(e.target.value)}
                    placeholder=". . . . . . . ."
                    className="form-filled-val px-1 text-center font-mono font-black text-sm sm:text-base text-black bg-transparent placeholder:text-slate-950 placeholder:font-black placeholder:tracking-[0.3em] w-32 focus:outline-none"
                  />
                </div>
                <div className="font-black text-xs sm:text-sm pt-1">
                  الامضاء
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security PIN verification modal */}
      <SecurityPinModal
        isOpen={isPinModalOpen}
        actionType="save"
        actionTitle="تأكيد حفظ تعديل بيانات استمارة المؤطر"
        actionDescription="تعديل وتحديث بيانات المؤطر المسجل"
        onSuccess={executeSaveToMember}
        onClose={() => setIsPinModalOpen(false)}
      />

      {/* Ask: open in Word, or print directly */}
      <PrintChoiceModal
        isOpen={isPrintChoiceOpen}
        onOpenWord={handleConfirmWordExport}
        onPrintDirect={handleConfirmDirectPrint}
        onClose={() => setIsPrintChoiceOpen(false)}
      />
    </div>
  );
};

