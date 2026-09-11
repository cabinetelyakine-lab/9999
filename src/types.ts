export interface StaffMember {
  id: string;
  role: string;
  roleOrder: number;
  firstName: string;
  lastName: string;
  latinFirstName?: string; // Prénom en français
  latinLastName?: string;  // Nom en français
  birthDate: string;
  phone: string;
  nationalId?: string;
  orderNumber?: string; // رقم ترتيبي للمؤطر قابل للتعديل (حتى 4 أرقام: 0001 - 9999)
  notes?: string;
  notesStatus?: 'accepted' | 'rejected' | null;

  // Extended fields for the official Algerian Electoral Authority registration form (استمارة طلب التسجيل)
  fileNumber?: string;
  depositDate?: string;
  communeRegistration?: string;
  votingPlace?: string;
  electoralCardNumber?: string;
  fatherName?: string;
  motherFullName?: string;
  birthCommune?: string;
  birthCertificateNumber?: string;
  maritalStatus?: 'single' | 'married' | string;
  spouseFullName?: string;
  educationLevel?: string;
  specialty?: string;
  professionalStatus?: string;
  profession?: string;
  sector?: string;
  address?: string;
  pastRoles?: { [roleKey: string]: number | string };
  isMemberOfAssociation?: 'yes' | 'no' | string;
  associationType?: 'national' | 'local' | string;
  associationName?: string;
  associationJoinDate?: string;
  isMemberOfPoliticalParty?: 'yes' | 'no' | string;
  partyJoinDate?: string;
  isRegisteredOnAuthorityWebsite?: 'yes' | 'no' | string;
  websiteUrl?: string;
  cityPlace?: string;
  declarationDate?: string;
}

export type OfficeGender = 'H' | 'F';

export interface Office {
  id: string;
  number: number;
  name: string;
  gender: OfficeGender; // 'H' = خاص بالرجال | 'F' = خاص بالنساء
  staff: StaffMember[];
}

export interface Center {
  id: string;
  name: string;
  code?: string;
  address?: string;
  mapUrl?: string;
  imageUrl?: string;
  centerStaff: StaffMember[];
  offices: Office[];
}

export const CENTER_ROLES: string[] = [
  'رئيس مركز',
  'مساعد أول',
  'مساعد ثاني',
  'مساعد ثالث',
  'مساعد رابع',
  'ممثل السلطة',
];

export const OFFICE_ROLES: string[] = [
  'رئيس مكتب',
  'نائب رئيس مكتب',
  'كاتب',
  'مساعد أول',
  'مساعد ثاني',
  'إضافي أول',
  'إضافي ثاني',
];

export type AppView = 'home' | 'staffing' | 'search' | 'staff_table';

export interface SearchResultItem {
  member: StaffMember;
  centerId: string;
  centerName: string;
  officeId?: string;
  officeName?: string;
  officeNumber?: number;
  officeGender?: OfficeGender;
  type: 'center_staff' | 'office_staff';
}

export function sortOfficesMenFirst(offices: Office[]): Office[] {
  if (!offices || !Array.isArray(offices)) return [];
  const male = [...offices]
    .filter((o) => (o.gender || (o.number % 2 === 1 ? 'H' : 'F')) === 'H')
    .sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0));
  const female = [...offices]
    .filter((o) => (o.gender || (o.number % 2 === 1 ? 'H' : 'F')) === 'F')
    .sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0));
  return [...male, ...female];
}
