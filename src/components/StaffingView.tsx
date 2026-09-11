import React, { useState, useEffect, useRef } from 'react';
import { Center, Office, OfficeGender, StaffMember, sortOfficesMenFirst } from '../types';
import {
  ArrowRight,
  Plus,
  Trash2,
  Edit2,
  Phone,
  Calendar,
  Building,
  Vote,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  Settings,
  ChevronLeft,
  ChevronRight,
  Users,
  Eraser,
  ArrowLeft,
  Check,
  Sparkles,
  X,
  PhoneCall,
  MapPin,
  ExternalLink,
  Navigation,
  Printer,
  FileText,
  FileSpreadsheet,
  Lock,
  LogOut,
} from 'lucide-react';
import {
  createDefaultCenter,
  createDefaultOffice,
  SCHOOL_IMAGES,
  ALGERIAN_SCHOOL_CENTER_IMG,
  VOTING_OFFICE_IMG,
  ALGERIAN_VOTER_CARD_IMG,
  ELECTION_STAFF_IMG,
} from '../data/initialData';
import { MemberEditModal } from './MemberEditModal';
import { CenterEditModal } from './CenterEditModal';
import { OfficeEditModal } from './OfficeEditModal';
import { CenterMapModal } from './CenterMapModal';
import { StaffRegistrationFormModal } from './StaffRegistrationFormModal';
import { normalizeMapsUrl } from '../utils/maps';

interface StaffingViewProps {
  centers: Center[];
  onUpdateCenters: (centers: Center[]) => void;
  onBackToHome: () => void;
  onNavigateToSearch: (centerId?: string) => void;
  onNavigateToStaffTable?: (centerId?: string) => void;
  initialCenterId?: string | null;
  isSupervisor?: boolean;
  onSetSupervisor?: (status: boolean) => void;
}

export const StaffingView: React.FC<StaffingViewProps> = ({
  centers,
  onUpdateCenters,
  onBackToHome,
  onNavigateToSearch,
  onNavigateToStaffTable,
  initialCenterId,
  isSupervisor = false,
  onSetSupervisor,
}) => {
  // Navigation Hierarchy State with Dual Storage Persistence (Session + LocalStorage):
  // (Ensures when exiting Google Maps or preview, the user automatically returns to the exact same center and box)
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(() => {
    return (
      initialCenterId ||
      sessionStorage.getItem('staffing_selected_center_id') ||
      localStorage.getItem('staffing_selected_center_id') ||
      null
    );
  });

  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(() => {
    return (
      sessionStorage.getItem('staffing_selected_office_id') ||
      localStorage.getItem('staffing_selected_office_id') ||
      null
    );
  });

  const [isViewingCenterStaff, setIsViewingCenterStaff] = useState<boolean>(() => {
    const s =
      sessionStorage.getItem('staffing_viewing_center_staff') ||
      localStorage.getItem('staffing_viewing_center_staff');
    return s === 'true';
  });

  // Filter for offices inside a center ('all' | 'H' | 'F')
  const [officeGenderFilter, setOfficeGenderFilter] = useState<'all' | 'H' | 'F'>('all');

  // Sync state with both sessionStorage and localStorage for bulletproof persistence
  useEffect(() => {
    try {
      if (selectedCenterId) {
        sessionStorage.setItem('staffing_selected_center_id', selectedCenterId);
        localStorage.setItem('staffing_selected_center_id', selectedCenterId);
      } else {
        sessionStorage.removeItem('staffing_selected_center_id');
        localStorage.removeItem('staffing_selected_center_id');
      }
    } catch {
      // ignore
    }
  }, [selectedCenterId]);

  useEffect(() => {
    try {
      if (selectedOfficeId) {
        sessionStorage.setItem('staffing_selected_office_id', selectedOfficeId);
        localStorage.setItem('staffing_selected_office_id', selectedOfficeId);
      } else {
        sessionStorage.removeItem('staffing_selected_office_id');
        localStorage.removeItem('staffing_selected_office_id');
      }
    } catch {
      // ignore
    }
  }, [selectedOfficeId]);

  useEffect(() => {
    try {
      const val = isViewingCenterStaff ? 'true' : 'false';
      sessionStorage.setItem('staffing_viewing_center_staff', val);
      localStorage.setItem('staffing_viewing_center_staff', val);
    } catch {
      // ignore
    }
  }, [isViewingCenterStaff]);

  // If initialCenterId changes from props (e.g. from search), update state
  useEffect(() => {
    if (initialCenterId) {
      setSelectedCenterId(initialCenterId);
      setSelectedOfficeId(null);
      setIsViewingCenterStaff(false);
    }
  }, [initialCenterId]);

  // Modals state
  const [editingMember, setEditingMember] = useState<{
    member: StaffMember;
    centerId: string;
    centerName: string;
    officeId?: string;
    officeName?: string;
  } | null>(null);

  const [editingCenter, setEditingCenter] = useState<Center | null>(null);
  const [isAddCenterModalOpen, setIsAddCenterModalOpen] = useState(false);
  const [newCenterNameModal, setNewCenterNameModal] = useState('');
  const [newCenterCodeModal, setNewCenterCodeModal] = useState('');
  const [newCenterAddressModal, setNewCenterAddressModal] = useState('');
  const [editingOffice, setEditingOffice] = useState<Office | null>(null);
  const [isBatchOfficeModalOpen, setIsBatchOfficeModalOpen] = useState(false);
  const [batchOfficeCount, setBatchOfficeCount] = useState(4);
  const [batchOfficeGender, setBatchOfficeGender] = useState<'alternate' | 'H' | 'F'>('alternate');
  const [mapModalCenter, setMapModalCenter] = useState<Center | null>(null);
  const lastTapMapRef = useRef<number>(0);

  // Official Staff Registration Form Modal State (استمارة طلب التسجيل والطباعة)
  const [isRegistrationFormOpen, setIsRegistrationFormOpen] = useState(false);
  const [registrationFormMember, setRegistrationFormMember] = useState<StaffMember | null>(null);
  const [registrationFormCenterId, setRegistrationFormCenterId] = useState<string | undefined>(undefined);
  const [registrationFormOfficeId, setRegistrationFormOfficeId] = useState<string | undefined>(undefined);

  // Top Section: Single Dedicated Add Center Form Inputs (خانة إضافة مركز فقط في الأعلى)
  const [quickCenterName, setQuickCenterName] = useState('');
  const [quickCenterCode, setQuickCenterCode] = useState('');

  // Add custom role input to Center
  const [showAddCenterRoleInput, setShowAddCenterRoleInput] = useState(false);
  const [newCenterRoleTitle, setNewCenterRoleTitle] = useState('');

  // Add custom role input to currently opened office
  const [showAddOfficeRoleInput, setShowAddOfficeRoleInput] = useState(false);
  const [newOfficeRoleTitle, setNewOfficeRoleTitle] = useState('');

  // Digital Grid Scroll Ref for scrolling up/down if there are many centers
  const digitalGridContainerRef = useRef<HTMLDivElement>(null);

  // Current active center (if any)
  const currentCenter = selectedCenterId
    ? centers.find((c) => c.id === selectedCenterId) || null
    : null;

  // Current active office (if any)
  const currentOffice =
    currentCenter && selectedOfficeId
      ? currentCenter.offices.find((o) => o.id === selectedOfficeId) || null
      : null;

  // Helper to get Google Maps URL for any center with fallback and coordinate normalization
  const getCenterMapsUrl = (center: Center) => {
    return normalizeMapsUrl(center.mapUrl, {
      name: center.name,
      address: center.address,
    });
  };

  // Helper to format school name cleanly by removing redundant prefixes (مدرسة, ثانوية, متوسطة, مركز...)
  const getCleanSchoolName = (rawName: string): string => {
    if (!rawName) return '';
    let cleaned = rawName.trim();
    cleaned = cleaned.replace(/^مركز\s+/i, '');
    cleaned = cleaned.replace(/^(مدرسة|ثانوية|متوسطة|ابتدائية|إبتدائية|مجمع|معهد|اكمالية|إكمالية)\s+/i, '');
    cleaned = cleaned.replace(/^مركز\s+/i, '');
    return cleaned.trim();
  };

  // Helper to get real photo for any center (Algerian voter card photo)
  const getCenterSchoolImage = (center: Center, _index: number): string => {
    if (center.imageUrl && (center.imageUrl.startsWith('data:') || center.imageUrl.startsWith('blob:'))) {
      return center.imageUrl;
    }
    return ALGERIAN_VOTER_CARD_IMG || ALGERIAN_SCHOOL_CENTER_IMG;
  };

  // Helper to open Google Maps directly
  const handleOpenGoogleMaps = (e: React.MouseEvent, center: Center) => {
    e.stopPropagation();
    const url = getCenterMapsUrl(center);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Helper to open Map Setup / Pin modal
  const handleOpenMapSetupModal = (e: React.MouseEvent, center: Center) => {
    e.stopPropagation();
    e.preventDefault();
    setMapModalCenter(center);
  };

  const handleSaveMapUrl = (centerId: string, mapUrl: string | undefined) => {
    const newCenters = centers.map((c) =>
      c.id === centerId ? { ...c, mapUrl } : c
    );
    onUpdateCenters(newCenters);
  };

  // Helper to save member edit
  const handleSaveMember = (updatedMember: StaffMember) => {
    if (!editingMember) return;

    const newCenters = centers.map((c) => {
      if (c.id !== editingMember.centerId) return c;

      if (!editingMember.officeId) {
        // Center staff update
        return {
          ...c,
          centerStaff: c.centerStaff.map((m) =>
            m.id === updatedMember.id ? updatedMember : m
          ),
        };
      } else {
        // Office staff update
        return {
          ...c,
          offices: c.offices.map((off) => {
            if (off.id !== editingMember.officeId) return off;
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
  };

  // Helper to open official staff registration form modal
  const handleOpenRegistrationForm = (
    member?: StaffMember | null,
    centerId?: string,
    officeId?: string
  ) => {
    setRegistrationFormMember(member || null);
    setRegistrationFormCenterId(centerId || currentCenter?.id);
    setRegistrationFormOfficeId(officeId || currentOffice?.id);
    setIsRegistrationFormOpen(true);
  };

  // Helper to save member directly from the registration form
  const handleSaveRegistrationFormMember = (
    updatedMember: StaffMember,
    centerId: string,
    officeId?: string
  ) => {
    let memberFound = false;

    // 1. First attempt to update existing member across centers/offices
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

    // 2. If member was new (not found in any center/office), add them to the target center
    if (!memberFound) {
      const targetCId = centerId || currentCenter?.id || centers[0]?.id;
      updatedCenters = updatedCenters.map((c) => {
        if (c.id !== targetCId) return c;

        if (officeId) {
          return {
            ...c,
            offices: c.offices.map((off) => {
              if (off.id !== officeId) return off;
              // 1. First look for empty slot matching this specific role (e.g. "إضافي أول")
              const matchingRoleEmptyIdx = off.staff.findIndex(
                (m) => (!m.firstName && !m.lastName) && m.role === updatedMember.role
              );
              // 2. Otherwise look for any empty slot
              const emptyIdx = matchingRoleEmptyIdx >= 0
                ? matchingRoleEmptyIdx
                : off.staff.findIndex(
                    (m) => (!m.firstName && !m.lastName) || m.id === updatedMember.id
                  );
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
          // Add to center staff
          const matchingRoleEmptyIdx = c.centerStaff.findIndex(
            (m) => (!m.firstName && !m.lastName) && m.role === updatedMember.role
          );
          const emptyIdx = matchingRoleEmptyIdx >= 0
            ? matchingRoleEmptyIdx
            : c.centerStaff.findIndex(
                (m) => (!m.firstName && !m.lastName) || m.id === updatedMember.id
              );
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

  // Helper to delete an individual member slot
  const handleDeleteSlot = (memberId: string) => {
    if (!editingMember) return;

    const newCenters = centers.map((c) => {
      if (c.id !== editingMember.centerId) return c;

      if (!editingMember.officeId) {
        return {
          ...c,
          centerStaff: c.centerStaff.filter((m) => m.id !== memberId),
        };
      } else {
        return {
          ...c,
          offices: c.offices.map((off) => {
            if (off.id !== editingMember.officeId) return off;
            return {
              ...off,
              staff: off.staff.filter((m) => m.id !== memberId),
            };
          }),
        };
      }
    });

    onUpdateCenters(newCenters);
  };

  const handleClearSingleStaff = (
    centerId: string,
    officeId: string | undefined,
    memberId: string
  ) => {
    const newCenters = centers.map((c) => {
      if (c.id !== centerId) return c;
      if (!officeId) {
        return {
          ...c,
          centerStaff: c.centerStaff.map((m) =>
            m.id === memberId
              ? {
                  ...m,
                  firstName: '',
                  lastName: '',
                  birthDate: '',
                  phone: '',
                  notes: '',
                }
              : m
          ),
        };
      } else {
        return {
          ...c,
          offices: c.offices.map((off) => {
            if (off.id !== officeId) return off;
            return {
              ...off,
              staff: off.staff.map((m) =>
                m.id === memberId
                  ? {
                      ...m,
                      firstName: '',
                      lastName: '',
                      birthDate: '',
                      phone: '',
                      notes: '',
                    }
                  : m
              ),
            };
          }),
        };
      }
    });

    onUpdateCenters(newCenters);
  };

  // Center Operations
  const handleSaveCenter = (updatedCenter: Center) => {
    const newCenters = centers.map((c) =>
      c.id === updatedCenter.id ? updatedCenter : c
    );
    onUpdateCenters(newCenters);
  };

  const handleDeleteCenter = (centerId: string) => {
    if (centers.length <= 1) {
      if (
        confirm(
          'هذا هو المركز الوحيد في البرنامج. هل تريد حذفه وإعادة ضبط مركز انتخابي جديد فارغ؟'
        )
      ) {
        const freshCenter = createDefaultCenter('مركز انتخابي جديد', '01');
        freshCenter.offices = [createDefaultOffice(1, 'H')];
        onUpdateCenters([freshCenter]);
        setSelectedCenterId(null);
        setSelectedOfficeId(null);
        setIsViewingCenterStaff(false);
      }
      return;
    }
    const targetCenter = centers.find((c) => c.id === centerId);
    const remaining = centers.filter((c) => c.id !== centerId);
    onUpdateCenters(remaining);
    if (selectedCenterId === centerId) {
      setSelectedCenterId(null);
      setSelectedOfficeId(null);
      setIsViewingCenterStaff(false);
    }
  };

  const handleClearCenterStaffOnly = (centerId: string) => {
    const newCenters = centers.map((c) => {
      if (c.id !== centerId) return c;
      return {
        ...c,
        centerStaff: c.centerStaff.map((m) => ({
          ...m,
          firstName: '',
          lastName: '',
          birthDate: '',
          phone: '',
          notes: '',
        })),
      };
    });
    onUpdateCenters(newCenters);
  };

  const handleClearAllCenterAndOffices = (centerId: string) => {
    const newCenters = centers.map((c) => {
      if (c.id !== centerId) return c;
      return {
        ...c,
        centerStaff: c.centerStaff.map((m) => ({
          ...m,
          firstName: '',
          lastName: '',
          birthDate: '',
          phone: '',
          notes: '',
        })),
        offices: c.offices.map((off) => ({
          ...off,
          staff: off.staff.map((m) => ({
            ...m,
            firstName: '',
            lastName: '',
            birthDate: '',
            phone: '',
            notes: '',
          })),
        })),
      };
    });
    onUpdateCenters(newCenters);
  };

  const handleDeleteAllOffices = (centerId: string) => {
    const newCenters = centers.map((c) => {
      if (c.id !== centerId) return c;
      return {
        ...c,
        offices: [],
      };
    });
    onUpdateCenters(newCenters);
    setSelectedOfficeId(null);
  };

  const handleAddCenterRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCenterRoleTitle.trim() || !currentCenter) return;

    const newStaff: StaffMember = {
      id: `cs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      role: newCenterRoleTitle.trim(),
      roleOrder: currentCenter.centerStaff.length + 1,
      firstName: '',
      lastName: '',
      birthDate: '',
      phone: '',
      notes: '',
    };

    const newCenters = centers.map((c) => {
      if (c.id !== currentCenter.id) return c;
      return {
        ...c,
        centerStaff: [...c.centerStaff, newStaff],
      };
    });

    onUpdateCenters(newCenters);
    setNewCenterRoleTitle('');
    setShowAddCenterRoleInput(false);
  };

  // Office Operations inside a center
  const handleAddOffice = (genderPreference?: OfficeGender) => {
    if (!currentCenter) return;
    const defaultGender: OfficeGender = genderPreference || 'H';

    // Count existing offices with this specific gender to start fresh from 1 for each gender
    const sameGenderOffices = currentCenter.offices.filter(
      (o) => (o.gender || (o.number % 2 === 1 ? 'H' : 'F')) === defaultGender
    );
    const maxNum = sameGenderOffices.reduce(
      (max, o) => Math.max(max, Number(o.number) || 0),
      0
    );
    const nextNumber = maxNum + 1;
    const newOffice = createDefaultOffice(nextNumber, defaultGender);

    const newCenters = centers.map((c) => {
      if (c.id !== currentCenter.id) return c;
      return {
        ...c,
        offices: sortOfficesMenFirst([...c.offices, newOffice]),
      };
    });

    onUpdateCenters(newCenters);
  };

  const handleAddBatchOffices = (
    count: number,
    genderPref: 'alternate' | 'H' | 'F'
  ) => {
    if (!currentCenter || count <= 0) return;

    const existingMaleCount = currentCenter.offices.filter(
      (o) => (o.gender || (o.number % 2 === 1 ? 'H' : 'F')) === 'H'
    ).reduce((max, o) => Math.max(max, Number(o.number) || 0), 0);

    const existingFemaleCount = currentCenter.offices.filter(
      (o) => (o.gender || (o.number % 2 === 1 ? 'H' : 'F')) === 'F'
    ).reduce((max, o) => Math.max(max, Number(o.number) || 0), 0);

    let nextMaleNum = existingMaleCount + 1;
    let nextFemaleNum = existingFemaleCount + 1;
    const newOffices: Office[] = [];

    for (let i = 0; i < count; i++) {
      let gender: OfficeGender = 'H';
      let officeNum = 1;

      if (genderPref === 'F') {
        gender = 'F';
        officeNum = nextFemaleNum++;
      } else if (genderPref === 'H') {
        gender = 'H';
        officeNum = nextMaleNum++;
      } else {
        // alternate
        if (i % 2 === 0) {
          gender = 'H';
          officeNum = nextMaleNum++;
        } else {
          gender = 'F';
          officeNum = nextFemaleNum++;
        }
      }
      newOffices.push(createDefaultOffice(officeNum, gender));
    }

    const newCenters = centers.map((c) => {
      if (c.id !== currentCenter.id) return c;
      return {
        ...c,
        offices: sortOfficesMenFirst([...c.offices, ...newOffices]),
      };
    });

    onUpdateCenters(newCenters);
    setIsBatchOfficeModalOpen(false);
  };

  const handleSaveOffice = (updatedOffice: Office) => {
    const newCenters = centers.map((c) => {
      const hasOffice = c.offices.some((off) => off.id === updatedOffice.id);
      if (!hasOffice) return c;
      const updatedOffices = c.offices.map((off) =>
        off.id === updatedOffice.id ? updatedOffice : off
      );
      return {
        ...c,
        offices: sortOfficesMenFirst(updatedOffices),
      };
    });
    onUpdateCenters(newCenters);
    setEditingOffice(null);
  };

  const handleDeleteOffice = (officeId: string) => {
    const newCenters = centers.map((c) => {
      const hasOffice = c.offices.some((off) => off.id === officeId);
      if (!hasOffice) return c;
      return {
        ...c,
        offices: sortOfficesMenFirst(c.offices.filter((o) => o.id !== officeId)),
      };
    });
    onUpdateCenters(newCenters);
    if (selectedOfficeId === officeId) {
      setSelectedOfficeId(null);
    }
    setEditingOffice(null);
  };

  const handleClearOfficeStaff = (officeId: string) => {
    const newCenters = centers.map((c) => {
      const hasOffice = c.offices.some((off) => off.id === officeId);
      if (!hasOffice) return c;
      return {
        ...c,
        offices: c.offices.map((off) => {
          if (off.id !== officeId) return off;
          return {
            ...off,
            staff: off.staff.map((m) => ({
              ...m,
              firstName: '',
              lastName: '',
              birthDate: '',
              phone: '',
              notes: '',
            })),
          };
        }),
      };
    });
    onUpdateCenters(newCenters);
  };

  const handleAddOfficeRole = (officeId: string, roleName: string) => {
    const newCenters = centers.map((c) => {
      const hasOffice = c.offices.some((off) => off.id === officeId);
      if (!hasOffice) return c;
      return {
        ...c,
        offices: c.offices.map((off) => {
          if (off.id !== officeId) return off;
          const newStaff: StaffMember = {
            id: `os_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            role: roleName,
            roleOrder: off.staff.length + 1,
            firstName: '',
            lastName: '',
            birthDate: '',
            phone: '',
            notes: '',
          };
          return {
            ...off,
            staff: [...off.staff, newStaff],
          };
        }),
      };
    });
    onUpdateCenters(newCenters);
  };

  // Top inline single add center handler (خانة إضافة مركز فقط)
  const handleQuickAddCenter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCenterName.trim()) return;

    const nextCode =
      quickCenterCode.trim() || String(centers.length + 1).padStart(2, '0');
    const newCenter = createDefaultCenter(quickCenterName.trim(), nextCode);

    // Default 0 offices (empty for user to register custom offices)
    newCenter.offices = [];

    onUpdateCenters([...centers, newCenter]);

    // Reset quick form inputs
    setQuickCenterName('');
    setQuickCenterCode('');
  };

  // Sorted offices list: Men strictly first (1, 2, 3, 4...), then Women (1, 2, 3, 4...)
  const maleOffices = currentCenter
    ? [...currentCenter.offices]
        .filter((o) => (o.gender || (o.number % 2 === 1 ? 'H' : 'F')) === 'H')
        .sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0))
    : [];

  const femaleOffices = currentCenter
    ? [...currentCenter.offices]
        .filter((o) => (o.gender || (o.number % 2 === 1 ? 'H' : 'F')) === 'F')
        .sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0))
    : [];

  const allSortedOffices = [...maleOffices, ...femaleOffices];
  const maleOfficesCount = maleOffices.length;
  const femaleOfficesCount = femaleOffices.length;

  // Filtered offices list for current center
  const filteredOffices =
    officeGenderFilter === 'H'
      ? maleOffices
      : officeGenderFilter === 'F'
      ? femaleOffices
      : allSortedOffices;

  // Navigation between offices inside Office View (strictly follows sorted order: Men 1,2,3... then Women 1,2,3...)
  const currentOfficeIndex = allSortedOffices.findIndex(
    (o) => o.id === selectedOfficeId
  );

  const handlePrevOffice = () => {
    if (!currentCenter || currentOfficeIndex <= 0) return;
    setSelectedOfficeId(allSortedOffices[currentOfficeIndex - 1].id);
  };

  const handleNextOffice = () => {
    if (
      !currentCenter ||
      currentOfficeIndex < 0 ||
      currentOfficeIndex >= allSortedOffices.length - 1
    )
      return;
    setSelectedOfficeId(allSortedOffices[currentOfficeIndex + 1].id);
  };

  // Gradual Back Navigation (العودة بالتدريج خطوة بخطوة كما دخلت تخرج)
  const handleGradualBack = () => {
    if (selectedOfficeId) {
      // 1. If in office (Level 3) -> return to current center (Level 2)
      setSelectedOfficeId(null);
    } else if (isViewingCenterStaff) {
      // 1.5 If in center staff details (Level 2b) -> return to center overview (Level 2)
      setIsViewingCenterStaff(false);
    } else if (selectedCenterId) {
      // 2. If in center (Level 2) -> return to centers list (Level 1)
      setSelectedCenterId(null);
      setIsViewingCenterStaff(false);
    } else {
      // 3. If in centers list (Level 1) -> return to home screen
      onBackToHome();
    }
  };

  const backButtonLabel = selectedOfficeId
    ? 'رجوع للمركز'
    : isViewingCenterStaff
    ? 'رجوع للمركز'
    : selectedCenterId
    ? 'رجوع لكافة المراكز'
    : 'الرئيسية';

  return (
    <div id="staffing-view-root" className="min-h-screen bg-[#7fa534] text-slate-100 pb-16">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-[#5f8021]/95 backdrop-blur-md border-b border-[#9bc447]/60 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* Main Red Gradual Back Button in Top-Right (خانة رجوع باللون الأحمر في الأعلى على اليمين) */}
          <button
            id="gradual-back-btn"
            onClick={handleGradualBack}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-black transition-all border-2 border-red-300 shadow-md shadow-red-900/30 shrink-0 cursor-pointer"
            title="الرجوع خطوة للوراء"
          >
            <ArrowRight className="w-4 h-4 text-white font-black" />
            <span>{backButtonLabel}</span>
          </button>

          {/* Add Center Button next to Back (خانة إضافة مركز الخضراء مع الزائد) */}
          <button
            id="header-add-center-btn"
            onClick={() => {
              if (!isSupervisor) {
                alert('إضافة مركز انتخابي جديد محصورة بالمشرف فقط.\nلتفعيل وضع المشرف وصلاحيات التعديل، انتقل إلى خانة البحث واكتب mohamed 44000');
                return;
              }
              setIsAddCenterModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-black transition-all shadow-md shadow-emerald-600/30 shrink-0"
            title={isSupervisor ? 'إضافة مركز انتخابي جديد' : 'إضافة مركز (خاص بالمشرف)'}
          >
            <Plus className="w-4 h-4 font-black" />
            <span>إضافة مركز</span>
          </button>

          <div className="h-5 w-px bg-slate-700 mx-1 hidden sm:block" />

          {/* Digital Breadcrumb Navigation (مسار التنقل بالتدريج) */}
          <nav className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-white truncate">
            <button
              onClick={() => {
                setSelectedCenterId(null);
                setSelectedOfficeId(null);
                setIsViewingCenterStaff(false);
              }}
              className={`hover:text-emerald-400 transition-colors ${
                !selectedCenterId ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              كافة المراكز
            </button>

            {currentCenter && (
              <>
                <span className="text-slate-600">/</span>
                <button
                  onClick={() => {
                    setSelectedOfficeId(null);
                    setIsViewingCenterStaff(false);
                  }}
                  className={`hover:text-emerald-400 transition-colors truncate max-w-[130px] sm:max-w-[200px] ${
                    !selectedOfficeId && !isViewingCenterStaff ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                  title={currentCenter.name}
                >
                  {currentCenter.name}
                </button>
              </>
            )}

            {isViewingCenterStaff && currentCenter && (
              <>
                <span className="text-slate-600">/</span>
                <span className="text-amber-400 truncate max-w-[140px] sm:max-w-[200px]">
                  مؤطرو المركز
                </span>
              </>
            )}

            {currentOffice && (
              <>
                <span className="text-slate-600">/</span>
                <span className="text-blue-400 truncate max-w-[130px] sm:max-w-[180px]">
                  {currentOffice.name}
                </span>
              </>
            )}
          </nav>
        </div>

        {/* Header Actions: Print Official Staff Table + Print Registration Form + Quick Search */}
        <div className="flex items-center gap-2 shrink-0">
          {onNavigateToStaffTable && (
            <button
              id="header-staff-table-btn"
              onClick={() => onNavigateToStaffTable(currentCenter?.id)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-emerald-950 hover:bg-emerald-900 active:scale-95 text-emerald-300 hover:text-emerald-200 rounded-xl text-xs sm:text-sm font-black transition-all border-2 border-emerald-400 shadow-md shadow-emerald-950/40 cursor-pointer"
              title="عرض وطباعة جدول المؤطرين الرسمي لجميع المراكز أو للمركز المحدد"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">جدول المؤطرين (طباعة)</span>
              <span className="sm:hidden">جدول الطباعة</span>
            </button>
          )}

          <button
            id="header-registration-form-btn"
            onClick={() => handleOpenRegistrationForm(null, currentCenter?.id, currentOffice?.id)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-blue-950 hover:bg-blue-900 active:scale-95 text-amber-300 hover:text-amber-200 rounded-xl text-xs sm:text-sm font-black transition-all border-2 border-amber-400 shadow-md shadow-blue-950/40 cursor-pointer"
            title="استمارة طلب التسجيل في قائمة تأطير الانتخابات مع الطباعة"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">استمارة المؤطرين</span>
            <span className="sm:hidden">استمارة</span>
          </button>

          {/* Supervisor Logout Button */}
          {isSupervisor ? (
            <button
              type="button"
              id="supervisor-header-indicator"
              onClick={() => {
                onSetSupervisor?.(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/90 hover:bg-rose-900 active:scale-95 text-rose-200 hover:text-white border-2 border-rose-500/80 rounded-xl text-xs sm:text-sm font-black shadow-md shadow-rose-950/30 transition-all cursor-pointer"
              title="انقر لتسجيل خروج المشرف والعودة إلى وضع العرض فقط"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
              <span>خروج المشرف</span>
            </button>
          ) : (
            <button
              type="button"
              id="viewer-header-indicator"
              onClick={() => onNavigateToSearch(currentCenter?.id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-amber-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="لتفعيل وضع المشرف: انتقل إلى خانة البحث واكتب mohamed 44000"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">عرض فقط (غير مشرف)</span>
              <span className="md:hidden">عرض فقط</span>
            </button>
          )}

          <button
            id="goto-search-from-staffing-btn"
            onClick={() => onNavigateToSearch(currentCenter?.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition-colors border border-slate-700/60"
            title="البحث في مؤطري المركز"
          >
            <Search className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">بحث شامل</span>
          </button>
        </div>
      </header>

      {/* Main Container - 1.5x Wider for Grander Cards */}
      <main className="w-full max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-10 pt-5 space-y-6">
        {/* ============================================================= */}
        {/* LEVEL 1: CENTERS OVERVIEW (بطاقات المراكز: عريضة جداً 1.5x مع صور واضحة وأرقام وأسماء كبيرة) */}
        {/* ============================================================= */}
        {!selectedCenterId ? (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  المراكز المسجلة ({centers.length} مراكز)
                </h2>
              </div>
              <span className="text-xs sm:text-sm font-bold text-amber-300 bg-blue-950 px-4 py-1.5 rounded-xl border border-amber-400 w-fit">
                انقر على أي مركز للدخول وإدارة مكاتبه ومؤطريه
              </span>
            </div>

            {/* Centers Cards Stacked Vertically One Above Another - 1.5x Wider Card Size */}
            <div
              ref={digitalGridContainerRef}
              className="p-1 sm:p-2 space-y-5 sm:space-y-6 w-full"
            >
              {centers.map((center, index) => {
                const cleanSchoolName = getCleanSchoolName(center.name);
                const schoolImg = getCenterSchoolImage(center, index);
                const centerNumber = center.code || String(index + 1).padStart(2, '0');

                return (
                  <div
                    key={center.id}
                    id={`center-card-${center.id}`}
                    onClick={() => {
                      setSelectedCenterId(center.id);
                      setSelectedOfficeId(null);
                      setIsViewingCenterStaff(false);
                    }}
                    role="button"
                    tabIndex={0}
                    title={`اضغط على الصورة للدخول إلى ${cleanSchoolName}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedCenterId(center.id);
                        setSelectedOfficeId(null);
                        setIsViewingCenterStaff(false);
                      }
                    }}
                    className="group cursor-pointer rounded-3xl min-h-[380px] sm:min-h-[440px] md:min-h-[480px] w-full p-6 sm:p-10 md:p-12 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1 active:scale-[0.99] select-none relative overflow-hidden shadow-2xl border-3 border-amber-400 hover:border-amber-300 hover:shadow-amber-500/30 bg-slate-900"
                  >
                    {/* Background: Algerian Voter Card Photo - 3x Larger and vividly prominent */}
                    <img
                      src={schoolImg}
                      alt={cleanSchoolName}
                      className="absolute inset-0 w-full h-full object-cover object-center brightness-105 contrast-105 group-hover:scale-105 transition-transform duration-700 ease-out z-0"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = ALGERIAN_SCHOOL_CENTER_IMG;
                      }}
                    />

                    {/* Subtle top & bottom shadow vignettes for crystal-clear readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-transparent to-black/40 pointer-events-none z-0" />

                    {/* Top Row: Google Maps Direct Pin + Print Center Table + Large Arrow */}
                    <div className="relative z-10 flex items-center justify-between w-full pointer-events-none">
                      {/* Left: Google Maps Button & Print Center Table Button */}
                      <div className="flex items-center gap-2">
                        <a
                          href={getCenterMapsUrl(center)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title={`فتح موقع "${cleanSchoolName}" على الخريطة`}
                          className="p-3 sm:p-3.5 rounded-2xl bg-blue-950/90 hover:bg-blue-900 border-2 border-amber-400 hover:border-amber-300 text-amber-300 hover:text-white flex items-center justify-center shadow-2xl active:scale-95 transition-all cursor-pointer backdrop-blur-md pointer-events-auto"
                        >
                          <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                        </a>

                        {onNavigateToStaffTable && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToStaffTable(center.id);
                            }}
                            title={`طباعة جدول مؤطري مركز ${cleanSchoolName}`}
                            className="p-3 sm:p-3.5 rounded-2xl bg-emerald-950/90 hover:bg-emerald-900 border-2 border-emerald-400 hover:border-emerald-300 text-emerald-300 hover:text-white flex items-center justify-center shadow-2xl active:scale-95 transition-all cursor-pointer backdrop-blur-md pointer-events-auto"
                          >
                            <Printer className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                          </button>
                        )}
                      </div>

                      {/* Right: Enter Center Action Indicator */}
                      <div
                        title="اضغط للدخول إلى المركز"
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2 border-amber-400 bg-blue-950/90 text-amber-300 transition-transform group-hover:scale-110 shadow-2xl backdrop-blur-md pointer-events-auto"
                      >
                        <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 group-hover:translate-x-[-4px] transition-transform" />
                      </div>
                    </div>

                    {/* Bottom Row: Large Number + School / Center Name Alone (No edit/delete, No offices badge) */}
                    <div className="relative z-10 flex items-end gap-5 sm:gap-8 md:gap-10 w-full pointer-events-none">
                      {/* Large Number without frame/border and without background */}
                      <div className="shrink-0 flex items-center justify-center pointer-events-auto">
                        <span className="text-7xl sm:text-8xl md:text-9xl font-mono font-black text-amber-300 group-hover:text-amber-200 transition-colors drop-shadow-[0_4px_16px_rgba(0,0,0,1)] drop-shadow-[0_2px_6px_rgba(0,0,0,1)] leading-none select-none tracking-tight">
                          {centerNumber}
                        </span>
                      </div>

                      {/* Institution Name Alone */}
                      <div className="min-w-0 pb-1 pointer-events-auto">
                        <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white group-hover:text-amber-300 transition-colors drop-shadow-[0_4px_16px_rgba(0,0,0,1)] drop-shadow-[0_2px_6px_rgba(0,0,0,1)] leading-tight truncate max-w-[320px] sm:max-w-xl md:max-w-2xl lg:max-w-4xl">
                          {cleanSchoolName}
                        </h3>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : selectedOfficeId && currentOffice && currentCenter ? (
          /* ============================================================= */
          /* LEVEL 3: OFFICE VIEW (عند الدخول للمكتب - عرض مؤطري المكتب) */
          /* ============================================================= */
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Office Switcher Bar with Gradual Back */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-850/90 border border-slate-700 p-3.5 sm:p-4 rounded-2xl shadow-md">
              <div className="flex items-center gap-2.5">
                {/* Red Gradual Back Button to Center */}
                <button
                  id="office-bar-gradual-back-btn"
                  onClick={handleGradualBack}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl text-xs font-black border-2 border-red-300 shadow-md shadow-red-900/30 transition-all cursor-pointer"
                  title="الرجوع لمكاتب المركز"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-white font-black" />
                  <span>رجوع للمركز</span>
                </button>

                <div className="h-5 w-px bg-slate-700 mx-0.5 hidden sm:block" />

                <Vote className="w-5 h-5 text-amber-400" />
                <span className="text-sm sm:text-base font-black text-white">{currentCenter.name}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-lg bg-blue-950 text-amber-300 border border-amber-400 font-mono font-bold">
                  {currentOffice.name}
                </span>
              </div>

              {/* Prev / Next Office Switcher */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevOffice}
                  disabled={currentOfficeIndex <= 0}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                  title="المكتب السابق"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span className="hidden sm:inline">المكتب السابق</span>
                </button>

                <span className="text-xs font-bold text-slate-300 px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-700 font-mono">
                  {currentOfficeIndex + 1} / {currentCenter.offices.length}
                </span>

                <button
                  onClick={handleNextOffice}
                  disabled={currentOfficeIndex >= currentCenter.offices.length - 1}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                  title="المكتب التالي"
                >
                  <span className="hidden sm:inline">المكتب التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Office Header & Details Card with Center 1 School Photo */}
            <div
              className={`relative overflow-hidden border-2 rounded-2xl p-5 shadow-xl transition-all ${
                (currentOffice.gender || (currentOffice.number % 2 === 1 ? 'H' : 'F')) === 'F'
                  ? 'border-pink-400'
                  : 'border-amber-400'
              }`}
            >
              {/* Center 1 School Photo Background (الصورة التي في المركز الأول في جميع المكاتب) */}
              <img
                src={ALGERIAN_SCHOOL_CENTER_IMG || SCHOOL_IMAGES[0]}
                alt="واجهة المؤسسة التعليمية"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover scale-105"
                loading="lazy"
              />
              {/* Dark overlay for contrast */}
              <div
                className={`absolute inset-0 ${
                  (currentOffice.gender || (currentOffice.number % 2 === 1 ? 'H' : 'F')) === 'F'
                    ? 'bg-gradient-to-r from-pink-950/95 via-rose-950/90 to-pink-950/85'
                    : 'bg-gradient-to-r from-blue-950/95 via-blue-950/90 to-[#102a5c]/85'
                }`}
              />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Office Number Avatar */}
                  <div
                    className={`w-14 h-14 rounded-2xl text-white flex flex-col items-center justify-center font-black shadow-md border-2 ${
                      (currentOffice.gender || (currentOffice.number % 2 === 1 ? 'H' : 'F')) === 'F'
                        ? 'bg-pink-600 border-pink-300'
                        : 'bg-blue-950 border-amber-400'
                    }`}
                  >
                    <span className="text-2xs text-amber-300 uppercase">مكتب</span>
                    <span className="text-2xl font-mono leading-none">
                      {String(currentOffice.number).padStart(2, '0')}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-black text-white">
                        {currentOffice.name}
                      </h2>

                      {/* H (Hommes) vs F (Femmes) Static Badge */}
                      <div
                        className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-2 shadow-sm ${
                          (currentOffice.gender || (currentOffice.number % 2 === 1 ? 'H' : 'F')) === 'H'
                            ? 'bg-blue-900 border-blue-600 text-white'
                            : 'bg-pink-600 border-pink-300 text-white'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center text-xs font-black">
                          {currentOffice.gender || (currentOffice.number % 2 === 1 ? 'H' : 'F')}
                        </span>
                        <span>
                          {(currentOffice.gender || (currentOffice.number % 2 === 1 ? 'H' : 'F')) === 'H'
                            ? 'خاص بالرجال (H)'
                            : 'خاص بالنساء (F)'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-200 mt-1">
                      {currentCenter.name} • تم تعيين{' '}
                      <span className="text-emerald-400 font-black">
                        {currentOffice.staff.filter((m) => m.firstName || m.lastName).length}
                      </span>{' '}
                      من أصل{' '}
                      <span className="text-amber-300 font-black">
                        {currentOffice.staff.length}
                      </span>{' '}
                      مؤطرين
                    </p>
                  </div>
                </div>

                {/* Office Header Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowAddOfficeRoleInput(true)}
                    className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl border border-blue-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة منصب للمكتب</span>
                  </button>

                  <button
                    onClick={() => setEditingOffice(currentOffice)}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl border border-amber-400/80 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-amber-300" />
                    <span>تعديل المكتب</span>
                  </button>

                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `هل أنت متأكد من تفريغ كافة مؤطري "${currentOffice.name}" (مسح الأسماء)؟`
                        )
                      ) {
                        handleClearOfficeStaff(currentOffice.id);
                      }
                    }}
                    className="px-3.5 py-2 bg-rose-950 hover:bg-rose-900 text-rose-200 text-xs font-bold rounded-xl border border-rose-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="مسح أسماء المؤطرين في هذا المكتب"
                  >
                    <Eraser className="w-4 h-4 text-rose-400" />
                    <span className="hidden sm:inline">تفريغ الأسماء</span>
                  </button>
                </div>
              </div>

              {/* Add Custom Role to this Office inline form */}
              {showAddOfficeRoleInput && (
                <div className="mt-4 pt-4 border-t border-slate-700/80">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newOfficeRoleTitle.trim()) return;
                      handleAddOfficeRole(currentOffice.id, newOfficeRoleTitle.trim());
                      setNewOfficeRoleTitle('');
                      setShowAddOfficeRoleInput(false);
                    }}
                    className="p-3.5 bg-slate-850 rounded-xl border border-slate-700 flex items-center gap-2 flex-wrap"
                  >
                    <label className="text-xs font-bold text-slate-300">
                      اسم المنصب الإضافي لهذا المكتب:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثلاً: إضافي ثالث، مرشد..."
                      value={newOfficeRoleTitle}
                      onChange={(e) => setNewOfficeRoleTitle(e.target.value)}
                      className="flex-1 min-w-[200px] px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      إضافة
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddOfficeRoleInput(false)}
                      className="px-3.5 py-1.5 text-slate-400 hover:text-white text-xs font-semibold"
                    >
                      إلغاء
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Office Staff Members Grid */}
            <div className="bg-blue-950/90 border-2 border-amber-400 rounded-2xl overflow-hidden shadow-2xl">
              <div className="px-5 py-4 bg-blue-900 border-b-2 border-amber-400/80 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-950 border border-amber-400 text-amber-400 flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">
                      مؤطرو {currentOffice.name} ({currentOffice.staff.length} مناصب)
                    </h3>
                    <p className="text-xs text-slate-300">
                      رئيس المكتب، نائب رئيس المكتب، الكاتب، المساعدين والإضافيين
                    </p>
                  </div>
                </div>

                <div className="text-xs text-amber-300 font-black bg-blue-950 px-3.5 py-1.5 rounded-xl border border-amber-400/80">
                  انقر على أي بطاقة لتعديل الاسم واللقب والمعلومات
                </div>
              </div>

              <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentOffice.staff.map((staff) => (
                  <StaffRoleCard
                    key={staff.id}
                    staff={staff}
                    onEdit={() =>
                      setEditingMember({
                        member: staff,
                        centerId: currentCenter.id,
                        centerName: currentCenter.name,
                        officeId: currentOffice.id,
                        officeName: currentOffice.name,
                      })
                    }
                    onClear={() =>
                      handleClearSingleStaff(
                        currentCenter.id,
                        currentOffice.id,
                        staff.id
                      )
                    }
                    onOpenForm={() =>
                      handleOpenRegistrationForm(
                        staff,
                        currentCenter.id,
                        currentOffice.id
                      )
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        ) : isViewingCenterStaff && currentCenter ? (
          /* ============================================================= */
          /* LEVEL 2b: CENTER STAFF VIEW (عند الدخول لمؤطري المركز - عرض وتعديل الطاقم) */
          /* ============================================================= */
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Back & Breadcrumb navigation bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-850/90 border border-slate-700 p-3.5 sm:p-4 rounded-2xl shadow-md">
              <div className="flex items-center gap-2.5">
                <button
                  id="back-to-center-offices-btn"
                  onClick={handleGradualBack}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-black border-2 border-red-300 shadow-md shadow-red-900/30 active:scale-95 transition-all cursor-pointer"
                  title="الرجوع لمكاتب المركز"
                >
                  <ArrowRight className="w-4 h-4 text-white font-black" />
                  <span>الرجوع لمكاتب المركز</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedCenterId(null);
                    setSelectedOfficeId(null);
                    setIsViewingCenterStaff(false);
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 hidden sm:flex items-center gap-1.5"
                >
                  <Building className="w-3.5 h-3.5 text-emerald-400" />
                  <span>قائمة كافة المراكز</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-amber-300 bg-amber-950/40 border border-amber-800/60 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>مؤطرو المركز</span>
                </span>
              </div>
            </div>

            {/* Center Staff Header & Details Card */}
            <div className="bg-gradient-to-r from-sky-100 via-blue-100 to-sky-100 border-2 border-sky-400 rounded-2xl p-5 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Golden Google Maps Button / Pin (Replaced Center Shield) */}
                  <a
                    href={getCenterMapsUrl(currentCenter)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title={`فتح موقع "${currentCenter.name}" على تطبيق Google Maps`}
                    className="w-14 h-14 rounded-2xl bg-blue-950 border-2 border-amber-400 hover:border-amber-300 hover:bg-blue-900 text-amber-400 flex items-center justify-center font-black shadow-lg shadow-blue-950/20 transition-all active:scale-95 group/maphead cursor-pointer shrink-0"
                  >
                    <MapPin className="w-8 h-8 text-amber-400 group-hover/maphead:text-amber-300 group-hover/maphead:scale-110 transition-all" />
                  </a>

                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-black text-blue-950">
                        مؤطرو المركز
                      </h2>
                      <span className="text-xl sm:text-2xl font-black text-red-600">
                        {currentCenter.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleOpenMapSetupModal(e, currentCenter)}
                        title="تثبيت أو استبدال رابط/إحداثيات المركز في Google Maps"
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 hover:text-amber-600 border border-sky-300 transition-colors text-2xs font-bold flex items-center gap-1"
                      >
                        <Settings className="w-3 h-3 text-amber-600" />
                        <span className="hidden sm:inline">تثبيت النقطة</span>
                      </button>
                      {currentCenter.mapUrl && (
                        <span className="text-3xs bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-md font-mono font-bold">
                          موقع محدد بدقة 📍
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Center Staff Header Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {onNavigateToStaffTable && (
                    <button
                      onClick={() => onNavigateToStaffTable(currentCenter.id)}
                      className="px-3.5 py-2 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl border border-emerald-400 flex items-center gap-1.5 transition-colors shadow-sm"
                      title="طباعة جدول مؤطري هذا المركز في ورقة رسمية أفقية"
                    >
                      <Printer className="w-4 h-4 text-emerald-300" />
                      <span>طباعة جدول المركز</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowAddCenterRoleInput(true)}
                    className="px-3.5 py-2 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-xl border border-blue-900 flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة منصب للمركز</span>
                  </button>

                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `هل أنت متأكد من تفريغ كافة مؤطري "${currentCenter.name}" (مسح الأسماء مع الإبقاء على المناصب)؟`
                        )
                      ) {
                        handleClearCenterStaffOnly(currentCenter.id);
                      }
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-300 flex items-center gap-1.5 transition-colors"
                    title="مسح أسماء المؤطرين في طاقم قيادة المركز"
                  >
                    <Eraser className="w-4 h-4" />
                    <span className="hidden sm:inline">تفريغ الأسماء</span>
                  </button>
                </div>
              </div>

              {/* Add Custom Role to Center inline form */}
              {showAddCenterRoleInput && (
                <div className="mt-4 pt-4 border-t border-slate-700/80">
                  <form
                    onSubmit={handleAddCenterRole}
                    className="p-3.5 bg-slate-850 rounded-xl border border-slate-700 flex items-center gap-2 flex-wrap"
                  >
                    <label className="text-xs font-bold text-slate-300">
                      مسمى المنصب الإضافي للمركز:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثلاً: مساعد خامس، عون تقني، منسق..."
                      value={newCenterRoleTitle}
                      onChange={(e) => setNewCenterRoleTitle(e.target.value)}
                      className="flex-1 min-w-[200px] px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-slate-950 font-black text-xs rounded-lg transition-colors"
                    >
                      إضافة
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddCenterRoleInput(false)}
                      className="px-3.5 py-1.5 text-slate-400 hover:text-white text-xs font-semibold"
                    >
                      إلغاء
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Center Staff Members Grid */}
            <div className="bg-blue-950/90 border-2 border-amber-400 rounded-2xl overflow-hidden shadow-2xl">
              <div className="px-5 py-4 bg-blue-900 border-b-2 border-amber-400/80 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-950 border border-amber-400 text-amber-400 flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">
                      مؤطرو المركز ({currentCenter.centerStaff.length} مناصب)
                    </h3>
                    <p className="text-xs text-slate-300">
                      رئيس المركز، المساعدين، وممثل السلطة
                    </p>
                  </div>
                </div>

                <div className="text-xs text-amber-300 font-black bg-blue-950 px-3.5 py-1.5 rounded-xl border border-amber-400/80">
                  انقر على أي بطاقة لتعديل الاسم واللقب والمعلومات
                </div>
              </div>

              <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentCenter.centerStaff.map((staff) => (
                  <StaffRoleCard
                    key={staff.id}
                    staff={staff}
                    onEdit={() =>
                      setEditingMember({
                        member: staff,
                        centerId: currentCenter.id,
                        centerName: currentCenter.name,
                      })
                    }
                    onClear={() =>
                      handleClearSingleStaff(
                        currentCenter.id,
                        undefined,
                        staff.id
                      )
                    }
                    onOpenForm={() =>
                      handleOpenRegistrationForm(
                        staff,
                        currentCenter.id,
                        undefined
                      )
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        ) : currentCenter ? (
          /* ============================================================= */
          /* LEVEL 2: CENTER LEVEL (عند الدخول للمركز - بطاقة مؤطري المركز فوق + قائمة مكاتب التصويت) */
          /* ============================================================= */
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* SECTION 1: بطاقة مؤطري المركز (بلون أزرق داكن وذهبي أنيق فوق مكاتب التصويت مع صورة المؤطرين البارزة) */}
            <div
              id="center-staff-overview-card"
              className="bg-blue-950 hover:bg-blue-900 border-2 border-amber-400 hover:border-amber-300 rounded-2xl p-5 sm:p-6 shadow-2xl transition-all duration-300 relative overflow-hidden group"
            >
              {/* Background Photo */}
              <img
                src={ELECTION_STAFF_IMG}
                alt="مؤطرو المركز"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-950/95 via-blue-950/90 to-blue-900/80 pointer-events-none" />

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Large Golden Google Maps Icon */}
                  <a
                    id="center-maps-location-btn"
                    href={getCenterMapsUrl(currentCenter)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title={`فتح موقع "${currentCenter.name}" على تطبيق Google Maps`}
                    className="w-14 h-14 rounded-2xl bg-blue-900 border-2 border-amber-400 hover:border-amber-300 hover:bg-blue-800 text-amber-400 flex items-center justify-center font-black shadow-lg shadow-blue-950/40 active:scale-95 transition-all group/maps cursor-pointer shrink-0"
                  >
                    <MapPin className="w-8 h-8 text-amber-400 group-hover/maps:text-amber-300 group-hover/maps:scale-110 transition-all" />
                  </a>

                  <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg sm:text-xl font-black text-white">
                        مؤطرو المركز
                      </h3>
                      <span className="text-lg sm:text-xl font-black text-amber-300">
                        {currentCenter.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleOpenMapSetupModal(e, currentCenter)}
                        title="تثبيت أو استبدال رابط/إحداثيات المركز في Google Maps"
                        className="px-2.5 py-1 rounded-xl bg-blue-900 hover:bg-blue-800 text-slate-200 hover:text-amber-300 border border-blue-700 transition-colors text-2xs font-bold flex items-center gap-1"
                      >
                        <Settings className="w-3 h-3 text-amber-400" />
                        <span className="hidden sm:inline">تثبيت النقطة</span>
                      </button>
                      {currentCenter.mapUrl && (
                        <span className="text-3xs bg-amber-400/20 text-amber-300 border border-amber-400 px-2 py-0.5 rounded-md font-mono font-bold">
                          موقع محدد بدقة 📍
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions: Direct Enter to Center Staff + Edit Center + Delete Center */}
                <div className="flex flex-wrap items-center gap-2.5 sm:self-center">
                  <button
                    type="button"
                    id="edit-current-center-btn"
                    onClick={() => setEditingCenter(currentCenter)}
                    className="px-3.5 py-2.5 bg-blue-900 hover:bg-blue-800 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md border border-amber-400 flex items-center gap-1.5 cursor-pointer"
                    title="تعديل اسم أو عنوان أو رمز المركز"
                  >
                    <Settings className="w-4 h-4 text-amber-300" />
                    <span>تعديل المركز</span>
                  </button>

                  <button
                    type="button"
                    id="delete-current-center-btn"
                    onClick={() => {
                      if (
                        confirm(
                          `هل أنت متأكد من حذف مركز "${currentCenter.name}" وجميع مكاتبه وبياناته بالكامل؟`
                        )
                      ) {
                        handleDeleteCenter(currentCenter.id);
                      }
                    }}
                    className="px-3.5 py-2.5 bg-rose-950/90 hover:bg-rose-900 active:scale-95 text-rose-200 hover:text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md border border-rose-500 flex items-center gap-1.5 cursor-pointer"
                    title="حذف هذا المركز بالكامل"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>حذف المركز</span>
                  </button>

                  {onNavigateToStaffTable && (
                    <button
                      type="button"
                      onClick={() => onNavigateToStaffTable(currentCenter.id)}
                      className="px-3.5 py-2.5 bg-emerald-950 hover:bg-emerald-900 active:scale-95 text-emerald-300 hover:text-white text-xs sm:text-sm font-black rounded-xl transition-all shadow-md border-2 border-emerald-400 flex items-center gap-1.5 cursor-pointer"
                      title="طباعة جدول مؤطري هذا المركز في ورقة رسمية أفقية"
                    >
                      <Printer className="w-4 h-4 text-emerald-400" />
                      <span>طباعة جدول المركز</span>
                    </button>
                  )}

                  <button
                    type="button"
                    id="enter-center-staff-btn"
                    onClick={() => setIsViewingCenterStaff(true)}
                    className="px-5 py-2.5 bg-blue-900 hover:bg-amber-400 hover:text-slate-950 active:scale-95 text-amber-300 text-xs sm:text-sm font-black rounded-xl transition-all shadow-lg shadow-blue-950/40 border-2 border-amber-400 flex items-center gap-2 cursor-pointer"
                  >
                    <span>دخول وعرض مؤطري المركز</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* مكاتب التصويت - شريط الأزرار السريعة (+h و +f) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 px-1 py-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-950 border-2 border-amber-400 text-amber-400 flex items-center justify-center font-bold shadow-md">
                    <Vote className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-black text-white">
                    قائمة مكاتب التصويت
                  </span>
                </div>

                {/* Quick Add Buttons: +h (أزرق) و +f (وردي) */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddOffice('H')}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black rounded-xl text-sm font-mono shadow-md border border-blue-400 cursor-pointer flex items-center gap-1 transition-all"
                    title="إضافة مكتب رجال (+h)"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+h</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddOffice('F')}
                    className="px-3.5 py-1.5 bg-pink-600 hover:bg-pink-500 active:scale-95 text-white font-black rounded-xl text-sm font-mono shadow-md border border-pink-400 cursor-pointer flex items-center gap-1 transition-all"
                    title="إضافة مكتب نساء (+f)"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+f</span>
                  </button>
                </div>
              </div>

              {/* Zero Offices Prompt Banner */}
              {currentCenter.offices.length === 0 ? (
                <div className="p-8 bg-[#102a5c] border-2 border-dashed border-amber-400 rounded-2xl text-center space-y-4 shadow-xl">
                  <div className="w-14 h-14 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center mx-auto border-2 border-amber-400">
                    <Vote className="w-7 h-7" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1.5">
                    <h4 className="text-xl font-black text-white">
                      لا توجد مكاتب مسجلة في هذا المركز حالياً
                    </h4>
                    <p className="text-sm text-slate-200">
                      يمكنك البدء بإضافة مكاتب الرجال (+h) أو مكاتب النساء (+f):
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleAddOffice('H')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-sm font-black transition-all shadow-md flex items-center gap-1.5 border border-blue-400 cursor-pointer font-mono"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+h (مكتب رجال)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddOffice('F')}
                      className="px-4 py-2 bg-pink-600 hover:bg-pink-500 active:scale-95 text-white rounded-xl text-sm font-black transition-all shadow-md flex items-center gap-1.5 border border-pink-400 cursor-pointer font-mono"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+f (مكتب نساء)</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Container with All Offices stacked sequentially (Men First, then Women) - White Clean Background */
                <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-6 space-y-6 shadow-xl">
                  {/* قسم مكاتب الرجال (H) - مرتبة بالتسلسل واحدة فوق واحدة بحجم كبير */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b-2 border-blue-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black border border-blue-700 font-mono text-sm shadow-sm">
                          H
                        </div>
                        <div>
                          <h4 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                            <span>مكاتب الرجال (H)</span>
                            <span className="text-xs font-mono font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-300">
                              {maleOffices.length}
                            </span>
                          </h4>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddOffice('H')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-xs font-black font-mono transition-all shadow-sm border border-blue-400 cursor-pointer"
                        title="إضافة مكتب رجال (+h)"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+h</span>
                      </button>
                    </div>

                    {maleOffices.length > 0 ? (
                      <div className="flex flex-col gap-3.5 sm:gap-4">
                        {maleOffices.map((office) => (
                          <OfficeDigitalCard
                            key={office.id}
                            office={office}
                            onEnter={() => setSelectedOfficeId(office.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        لا توجد مكاتب رجال حالياً في هذا المركز — اضغط على زر (+h) لإضافة مكتب
                      </div>
                    )}
                  </div>

                  {/* فاصل جمالي بين مكاتب الرجال ومكاتب النساء */}
                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t-2 border-slate-200"></div>
                    </div>
                  </div>

                  {/* قسم مكاتب النساء (F) - مرتبة بالتسلسل واحدة فوق واحدة بحجم كبير */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b-2 border-pink-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-pink-600 text-white flex items-center justify-center font-black border border-pink-700 font-mono text-sm shadow-md">
                          F
                        </div>
                        <div>
                          <h4 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                            <span className="text-pink-900">مكاتب النساء (F)</span>
                            <span className="text-xs font-mono font-bold bg-pink-100 text-pink-800 px-2.5 py-0.5 rounded-full border border-pink-300">
                              {femaleOffices.length}
                            </span>
                          </h4>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddOffice('F')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-pink-600 hover:bg-pink-500 active:scale-95 text-white rounded-xl text-xs font-black font-mono transition-all shadow-sm border border-pink-400 cursor-pointer"
                        title="إضافة مكتب نساء (+f)"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+f</span>
                      </button>
                    </div>

                    {femaleOffices.length > 0 ? (
                      <div className="flex flex-col gap-3.5 sm:gap-4">
                        {femaleOffices.map((office) => (
                          <OfficeDigitalCard
                            key={office.id}
                            office={office}
                            onEnter={() => setSelectedOfficeId(office.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        لا توجد مكاتب نساء حالياً في هذا المركز — اضغط على زر (+f) لإضافة مكتب
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>

      {/* ============================================================= */}
      {/* MODALS */}
      {/* ============================================================= */}

      {/* Member Edit Modal */}
      {editingMember && (
        <MemberEditModal
          isOpen={true}
          isSupervisor={isSupervisor}
          onClose={() => setEditingMember(null)}
          member={editingMember.member}
          locationInfo={{
            centerName: editingMember.centerName,
            officeName: editingMember.officeName,
          }}
          onSave={handleSaveMember}
          onDeleteSlot={handleDeleteSlot}
          onOpenForm={(mem) =>
            handleOpenRegistrationForm(
              mem,
              editingMember.centerId,
              editingMember.officeId
            )
          }
        />
      )}

      {/* Center Edit Modal */}
      {editingCenter && (
        <CenterEditModal
          isOpen={true}
          isSupervisor={isSupervisor}
          onClose={() => setEditingCenter(null)}
          center={editingCenter}
          totalCentersCount={centers.length}
          onSave={(updated) => {
            handleSaveCenter(updated);
            setEditingCenter(null);
          }}
          onDeleteCenter={(cId) => {
            handleDeleteCenter(cId);
            setEditingCenter(null);
          }}
          onClearCenterStaffOnly={handleClearCenterStaffOnly}
          onClearAllCenterAndOffices={handleClearAllCenterAndOffices}
          onDeleteAllOffices={handleDeleteAllOffices}
        />
      )}

      {/* Center Map Location Setup / Replace Modal */}
      {mapModalCenter && (
        <CenterMapModal
          isOpen={true}
          onClose={() => setMapModalCenter(null)}
          center={mapModalCenter}
          onSaveMapUrl={handleSaveMapUrl}
        />
      )}

      {/* Office Edit Modal */}
      {editingOffice && (
        <OfficeEditModal
          isOpen={true}
          isSupervisor={isSupervisor}
          onClose={() => setEditingOffice(null)}
          office={editingOffice}
          onSave={handleSaveOffice}
          onDeleteOffice={handleDeleteOffice}
          onClearOfficeStaff={handleClearOfficeStaff}
          onAddCustomRole={handleAddOfficeRole}
        />
      )}

      {/* Add New Center Modal (فتح من الزر الأخضر بجانب الرئيسية) */}
      {isAddCenterModalOpen && (
        <div
          id="add-center-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-slate-800 text-slate-100 w-full max-w-lg rounded-2xl shadow-2xl p-6 border-2 border-amber-400 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b-2 border-amber-400/80">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <span>إضافة مركز انتخابي جديد</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddCenterModalOpen(false);
                  setNewCenterNameModal('');
                  setNewCenterCodeModal('');
                  setNewCenterAddressModal('');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newCenterNameModal.trim()) return;

                const nextCode =
                  newCenterCodeModal.trim() || String(centers.length + 1).padStart(2, '0');
                const newCenter = createDefaultCenter(newCenterNameModal.trim(), nextCode);
                newCenter.address = newCenterAddressModal.trim();

                // Default 0 offices (empty for user to register custom offices)
                newCenter.offices = [];

                onUpdateCenters([...centers, newCenter]);
                setIsAddCenterModalOpen(false);
                setNewCenterNameModal('');
                setNewCenterCodeModal('');
                setNewCenterAddressModal('');
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-black text-amber-300 mb-1.5">
                  اسم المركز الانتخابي: <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مدرسة الإخوة بوعزيز / مركز رقم 01"
                  value={newCenterNameModal}
                  onChange={(e) => setNewCenterNameModal(e.target.value)}
                  className="w-full px-4 py-3 bg-[#102a5c] border-2 border-amber-400 rounded-xl text-xl sm:text-2xl font-black text-white placeholder:text-blue-300/60 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-300 transition-all shadow-inner"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-black text-amber-300 mb-1.5">
                  رقم أو كود المركز:
                </label>
                <input
                  type="text"
                  placeholder={`رقم افتراضي: 0${centers.length + 1}`}
                  value={newCenterCodeModal}
                  onChange={(e) => setNewCenterCodeModal(e.target.value)}
                  className="w-full px-4 py-3 bg-[#102a5c] border-2 border-amber-400 rounded-xl text-xl sm:text-2xl font-mono font-black text-white placeholder:text-blue-300/60 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-300 text-center transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-amber-300 mb-1.5">
                  عنوان المركز (اختياري):
                </label>
                <input
                  type="text"
                  placeholder="عنوان أو حي المركز..."
                  value={newCenterAddressModal}
                  onChange={(e) => setNewCenterAddressModal(e.target.value)}
                  className="w-full px-4 py-3 bg-[#102a5c] border-2 border-amber-400 rounded-xl text-xl sm:text-2xl font-black text-white placeholder:text-blue-300/60 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-300 transition-all shadow-inner"
                />
              </div>

              <div className="pt-3 border-t border-slate-700 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddCenterModalOpen(false);
                    setNewCenterNameModal('');
                    setNewCenterCodeModal('');
                    setNewCenterAddressModal('');
                  }}
                  className="px-4 py-2.5 bg-slate-700 hover:bg-slate-650 text-slate-300 text-sm font-bold rounded-xl transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة المركز وتثبيته</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Batch Offices Modal (إضافة دفعة مكاتب تصويت دفعة واحدة) */}
      {isBatchOfficeModalOpen && currentCenter && (
        <div
          id="batch-office-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-slate-800 text-slate-100 w-full max-w-md rounded-2xl shadow-2xl p-6 border-2 border-amber-400 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b-2 border-amber-400/80">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Vote className="w-5 h-5" />
                </div>
                <span>إضافة دفعة مكاتب تصويت</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsBatchOfficeModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700 text-xs text-slate-300">
                سيتم ترقيم المكاتب تلقائياً وبشكل مستقل: مكاتب الرجال تبدأ من <strong className="text-blue-400 font-mono">0{maleOfficesCount + 1}</strong> ومكاتب النساء تبدأ من <strong className="text-rose-400 font-mono">0{femaleOfficesCount + 1}</strong>.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  عدد المكاتب المراد إنشاؤها:
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[2, 4, 6, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setBatchOfficeCount(num)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        batchOfficeCount === num
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-mono'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600 font-mono'
                      }`}
                    >
                      {num} مكاتب
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={batchOfficeCount}
                  onChange={(e) => setBatchOfficeCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-4 py-3 bg-[#102a5c] border-2 border-amber-400 rounded-xl text-xl sm:text-2xl font-mono font-black text-center text-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-300 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  نوع وتوزيع المكاتب:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBatchOfficeGender('alternate')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      batchOfficeGender === 'alternate'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    بالتناوب (H / F)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchOfficeGender('H')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      batchOfficeGender === 'H'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    كلها رجال (H)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchOfficeGender('F')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      batchOfficeGender === 'F'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    كلها نساء (F)
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-700 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsBatchOfficeModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-700 hover:bg-slate-650 text-slate-300 text-sm font-bold rounded-xl transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBatchOffices(batchOfficeCount, batchOfficeGender)}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-sm font-black rounded-xl transition-all shadow-lg flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>إنشاء {batchOfficeCount} مكتب الآن</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Printable Staff Registration Form Modal */}
      <StaffRegistrationFormModal
        isOpen={isRegistrationFormOpen}
        onClose={() => {
          setIsRegistrationFormOpen(false);
          setRegistrationFormMember(null);
        }}
        centers={centers}
        initialMember={registrationFormMember}
        initialCenterId={registrationFormCenterId}
        initialOfficeId={registrationFormOfficeId}
        onSaveMember={handleSaveRegistrationFormMember}
      />
    </div>
  );
};

// =============================================================
// SUB-COMPONENT: StaffRoleCard (بطاقة المؤطر بيضاء والكتبة سوداء بدون أي إطار أو خلفية)
// =============================================================
interface StaffRoleCardProps {
  staff: StaffMember;
  onEdit: () => void;
  onClear?: () => void;
  onOpenForm?: () => void;
}

const StaffRoleCard: React.FC<StaffRoleCardProps> = ({ staff, onEdit, onClear, onOpenForm }) => {
  const hasData = Boolean(staff.firstName?.trim() || staff.lastName?.trim());
  const fullName = `${staff.lastName || ''} ${staff.firstName || ''}`.trim();

  return (
    <div
      onClick={onEdit}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onEdit();
      }}
      className="group cursor-pointer select-none relative flex flex-col justify-between p-4 sm:p-5 min-h-[140px] sm:min-h-[150px] bg-white text-black shadow-xs hover:shadow-md transition-all rounded-xl border-0 border-none outline-none"
    >
      {/* Top Header: Role Title & Minimal Action Icons */}
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm sm:text-base font-black text-black leading-tight">
          {staff.role}
        </h4>

        {/* Action Icons */}
        <div className="flex items-center gap-1 shrink-0">
          {onOpenForm && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenForm();
              }}
              className="p-1 sm:p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-black transition-colors cursor-pointer"
              title="معاينة وطباعة استمارة هذا المؤطر"
            >
              <Printer className="w-4 h-4 text-black" />
            </button>
          )}

          {hasData && onClear && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="p-1 sm:p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              title="تفريغ وحذف معلومات هذه الخانة"
            >
              <Eraser className="w-4 h-4 text-slate-400 hover:text-rose-600" />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 sm:p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-black transition-colors cursor-pointer"
            title="تعديل بيانات المؤطر"
          >
            <Edit2 className="w-4 h-4 text-black" />
          </button>
        </div>
      </div>

      {/* Full Name in bold black text */}
      <div className="py-2">
        {hasData ? (
          <p className="text-base sm:text-lg md:text-xl font-black text-black leading-tight">
            {fullName}
          </p>
        ) : (
          <span className="text-xs sm:text-sm font-bold text-slate-500">
            + تعيين مؤطر لهذا المنصب
          </span>
        )}
      </div>

      {/* Additional details - BirthDate, Phone, & Notes */}
      {hasData && (staff.phone || staff.birthDate || staff.notes || staff.notesStatus) && (
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
          {staff.birthDate && (
            <span className="text-xs sm:text-sm font-mono font-bold text-black">
              {staff.birthDate}
            </span>
          )}

          {staff.phone && (
            <a
              href={`tel:${staff.phone.replace(/\s+/g, '')}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-black hover:underline text-xs sm:text-sm font-bold mr-auto cursor-pointer"
              title="اتصال مباشر بالمؤطر"
            >
              <PhoneCall className="w-3.5 h-3.5 text-black shrink-0" />
              <span>{staff.phone}</span>
            </a>
          )}

          {(staff.notes || staff.notesStatus) && (
            <div className="w-full flex items-center gap-1.5 text-xs text-black pt-0.5">
              {staff.notesStatus === 'accepted' && (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>مقبول</span>
                </span>
              )}
              {staff.notesStatus === 'rejected' && (
                <span className="inline-flex items-center gap-1 text-rose-700 font-bold shrink-0">
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                  <span>مرفوض</span>
                </span>
              )}
              {staff.notes && (
                <span className="font-semibold text-black truncate max-w-full">
                  {staff.notes}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ========================================================================= */
/* DIGITAL LARGE OFFICE PHOTO CARD (بطاقة كبيرة للمكتب بصورة المدرسة والدخول بمجرد الضغط عليها - 1.5x عريضة) */
/* ========================================================================= */
interface OfficeDigitalCardProps {
  office: Office;
  onEnter: () => void;
}

const OfficeDigitalCard: React.FC<OfficeDigitalCardProps> = ({
  office,
  onEnter,
}) => {
  const officeGender: OfficeGender =
    office.gender || (office.number % 2 === 1 ? 'H' : 'F');
  const isMen = officeGender === 'H';
  const officeNumberStr = String(office.number).padStart(2, '0');
  // الصورة المعتمدة لمكتب التصويت وصندوق الاقتراع
  const officeBgImage = VOTING_OFFICE_IMG || ALGERIAN_SCHOOL_CENTER_IMG || SCHOOL_IMAGES[0];

  return (
    <div
      id={`digital-office-box-${office.id}`}
      onClick={onEnter}
      role="button"
      tabIndex={0}
      title="اضغط على الصورة للدخول إلى المكتب"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onEnter();
        }
      }}
      className={`group cursor-pointer rounded-3xl min-h-[160px] sm:min-h-[190px] md:min-h-[220px] w-full p-5 sm:p-8 md:p-10 flex items-center justify-between transition-all duration-300 hover:scale-[1.015] hover:-translate-y-1 active:scale-[0.99] select-none relative overflow-hidden shadow-2xl border-3 ${
        isMen
          ? 'border-amber-400 hover:border-amber-300 hover:shadow-2xl hover:shadow-blue-900/30'
          : 'border-pink-400 hover:border-pink-300 hover:shadow-2xl hover:shadow-pink-900/30'
      }`}
    >
      {/* Background: Crystal Clear Voting Office Photo */}
      <img
        src={officeBgImage}
        alt={`مكتب ${officeNumberStr}`}
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
        loading="lazy"
      />

      {/* Subtle edge vignette to ensure complete clarity of the voting room & box */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${
          isMen
            ? 'bg-gradient-to-r from-blue-950/40 via-transparent to-blue-950/50 group-hover:from-blue-950/30 group-hover:to-blue-950/40'
            : 'bg-gradient-to-r from-pink-950/40 via-transparent to-pink-950/50 group-hover:from-pink-950/30 group-hover:to-pink-950/40'
        }`}
      />

      {/* Left & Right Accents / Large Number Badge */}
      <div className="relative z-10 flex items-center justify-between w-full pointer-events-none">
        {/* Right side: Large Office Badge (H or F) with Number */}
        <div
          className={`w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl flex flex-col items-center justify-center font-black shadow-2xl border-2 shrink-0 transition-transform group-hover:scale-105 pointer-events-auto ${
            isMen
              ? 'bg-blue-900/95 border-amber-400 text-white shadow-blue-950/90'
              : 'bg-pink-600/95 border-pink-300 text-white shadow-pink-950/90'
          }`}
        >
          <span className="text-xs sm:text-sm md:text-base uppercase font-mono font-black text-amber-300 tracking-widest">
            {isMen ? 'H' : 'F'}
          </span>
          <span className="text-4xl sm:text-5xl md:text-6xl font-mono leading-none font-black drop-shadow-lg text-white">
            {officeNumberStr}
          </span>
        </div>

        {/* Center/Left Visual Hint that clicking enters the office */}
        <div className="flex items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity pointer-events-auto mr-3">
          <div
            className={`w-13 h-13 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-2 transition-transform group-hover:scale-110 shadow-xl backdrop-blur-xs ${
              isMen
                ? 'bg-blue-950/90 border-amber-400 text-amber-300'
                : 'bg-pink-950/90 border-pink-300 text-pink-200'
            }`}
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 group-hover:translate-x-[-4px] transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};

