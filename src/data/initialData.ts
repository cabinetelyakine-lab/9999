import { Center, CENTER_ROLES, Office, OFFICE_ROLES, OfficeGender, StaffMember } from '../types';
import algerianSchoolCenterImg from '../assets/images/algerian_school_center_1787598071629.jpg';
import votingOfficeBoxImg from '../assets/images/voting_office_box_1787685182716.jpg';
import algerianVoterCardImg from '../assets/images/algerian_voter_card_1787686921832.jpg';
import electionStaffImg from '../assets/images/election_staff_photo_1787731569036.jpg';
import algeriaElectionsLogoImg from '../assets/images/algeria_elections_app_icon_1787858057766.jpg';

export const ALGERIAN_SCHOOL_CENTER_IMG = algerianSchoolCenterImg;
export const VOTING_OFFICE_IMG = votingOfficeBoxImg;
export const ALGERIAN_VOTER_CARD_IMG = algerianVoterCardImg;
export const ELECTION_STAFF_IMG = electionStaffImg;
export const ALGERIA_ELECTIONS_LOGO_IMG = algeriaElectionsLogoImg;

export function createDefaultCenterStaff(): StaffMember[] {
  return CENTER_ROLES.map((role, idx) => ({
    id: `cs_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
    role,
    roleOrder: idx + 1,
    firstName: '',
    lastName: '',
    birthDate: '',
    phone: '',
    notes: '',
  }));
}

export function createDefaultOfficeStaff(): StaffMember[] {
  return OFFICE_ROLES.map((role, idx) => ({
    id: `os_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
    role,
    roleOrder: idx + 1,
    firstName: '',
    lastName: '',
    birthDate: '',
    phone: '',
    notes: '',
  }));
}

export function createDefaultOffice(num: number, gender: OfficeGender = 'H'): Office {
  const genderLabel = gender === 'H' ? 'رجال' : 'نساء';
  return {
    id: `off_${Date.now()}_${gender}_${num}_${Math.random().toString(36).substring(2, 7)}`,
    number: num,
    name: `مكتب تصويت ${genderLabel} رقم ${String(num).padStart(2, '0')}`,
    gender,
    staff: createDefaultOfficeStaff(),
  };
}

export function createDefaultCenter(name: string, code?: string): Center {
  const centerStaff = createDefaultCenterStaff();
  const offices: Office[] = [];
  return {
    id: `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name,
    code: code || '01',
    address: 'وسط المدينة',
    imageUrl: algerianSchoolCenterImg,
    centerStaff,
    offices,
  };
}

// Sample Data Pools
const MALE_NAMES = [
  'محمد', 'أحمد', 'عبد القادر', 'كريم', 'يوسف', 'سمير', 'علي', 'حسين', 'إبراهيم', 'مصطفى',
  'طارق', 'بلال', 'وليد', 'أمين', 'حمزة', 'خالد', 'سفيان', 'هشام', 'رشيد', 'فاروق',
  'مراد', 'نبيل', 'عمر', 'رياض', 'عثمان', 'رضا', 'توفيق', 'جمال', 'منير', 'سليم',
  'الياس', 'حسان', 'عبد الرحمن', 'صالح', 'مهدي', 'فؤاد', 'حميد', 'إسماعيل', 'عادل', 'أيمن'
];

const FEMALE_NAMES = [
  'فاطمة', 'مريم', 'خديجة', 'نادية', 'سميرة', 'سارة', 'أمينة', 'إيمان', 'أسماء', 'حنان',
  'ليلى', 'وهيبة', 'إلهام', 'حسيبة', 'ياسمين', 'كريمة', 'هدى', 'منال', 'صبرينة', 'لبنى',
  'نوال', 'فوزية', 'جميلة', 'سهام', 'كوثر', 'لمياء', 'حفيظة', 'راضية', 'دنيا', 'نسرين'
];

const SURNAMES = [
  'بن عمار', 'قاسمي', 'بوزيد', 'شريف', 'طاهري', 'منصوري', 'مسعودي', 'بلقاسم', 'عماري', 'بن عودة',
  'قادري', 'دراجي', 'درويش', 'بن علي', 'براهيمي', 'رحماني', 'عيساوي', 'زروقي', 'مزيان', 'حاجي',
  'بوساحة', 'بوعلام', 'مقداد', 'عاشور', 'سعدي', 'جلولي', 'مداني', 'سعيدي', 'حداد', 'شعباني',
  'حيمود', 'طالبي', 'حمدي', 'بوطالب', 'سليماني', 'محي الدين', 'غربي', 'عويدات', 'بوعزة', 'بن يوسف'
];

const PROFESSIONS = [
  'أستاذ تعليم ثانوي', 'أستاذ تعليم متوسط', 'أستاذ تعليم ابتدائي', 'موظف إدارة محلية', 'مهندس دولة في الإعلام الآلي',
  'مفتش إدارة', 'إطار بمديرية التربية', 'متصرف إداري', 'محاسب رئيسي', 'متقاعد قطاع التعليم',
  'أمين ضبط بالمحكمة', 'تقني سامي في التسيير', 'أستاذ جامعي', 'موظف مالي', 'إطار بالبلدية'
];

export const SAMPLE_EDUCATION_LEVELS = [
  'جامعي - ليسانس',
  'جامعي - ماستر',
  'جامعي - مهندس دولة',
  'جامعي - دكتوراه',
  'جامعي - دراسات عليا',
  'تقني سامي',
  'ثانوي - بكالوريا',
  'جامعي',
];

export const SAMPLE_SPECIALTIES = [
  'حقوق وعلوم قانونية',
  'إعلام آلي وهندسة برمجيات',
  'علوم اقتصادية وتسيير',
  'أدب ولغة عربية',
  'علوم سياسية وعلاقات دولية',
  'رياضيات وإحصاء',
  'علوم تجارية ومالية',
  'علوم التربية والتعليم',
  'لغة فرنسية',
  'لغة إنجليزية',
  'هندسة معمارية ومدنية',
  'علوم الطبيعة والحياة',
];

const PHONE_PREFIXES = ['0661', '0550', '0770', '0665', '0558', '0775', '0669', '0540', '0790', '0671'];

// Deterministic Pseudo-Random Generator for consistent realistic data
function createSampleStaff(
  id: string,
  role: string,
  roleOrder: number,
  genderPref: 'M' | 'F' | 'ANY',
  seedIndex: number
): StaffMember {
  const isFemale = genderPref === 'F' || (genderPref === 'ANY' && seedIndex % 3 === 0);
  const firstNamesPool = isFemale ? FEMALE_NAMES : MALE_NAMES;
  const firstName = firstNamesPool[seedIndex % firstNamesPool.length];
  const lastName = SURNAMES[(seedIndex * 3 + 7) % SURNAMES.length];
  const prefix = PHONE_PREFIXES[seedIndex % PHONE_PREFIXES.length];
  const suffix = String(100000 + (seedIndex * 3719) % 900000);
  const phone = `${prefix}${suffix}`;
  const profession = PROFESSIONS[(seedIndex * 4) % PROFESSIONS.length];
  const educationLevel = SAMPLE_EDUCATION_LEVELS[seedIndex % SAMPLE_EDUCATION_LEVELS.length];
  const specialty = SAMPLE_SPECIALTIES[(seedIndex * 3) % SAMPLE_SPECIALTIES.length];
  const notes = seedIndex % 2 === 0 ? profession : '';

  return {
    id,
    role,
    roleOrder,
    firstName,
    lastName,
    birthDate: '', // تاريخ الميلاد فارغ افتراضياً ليقوم المستخدم بتعبئته يدوياً
    phone,
    notes,
    educationLevel,
    specialty,
    profession,
  };
}

export const SCHOOL_IMAGES: string[] = [
  // 0. الصورة الرئيسية الرسمية (صورة المؤسسة المدرسية والساحة مع العلم الوطني الجزائري)
  algerianSchoolCenterImg,
  // 1. ثانوية ومؤسسة تعليمية بساحة ومدخل رئيسي
  'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80',
  // 2. فناء ومبنى مدرسي بأروقة وأقسام
  'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=800&q=80',
  // 3. ساحة مدرسة ومبنى دراسي بأقسام وأدراج
  'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&w=800&q=80',
  // 4. قاعة تدريس ومكتب تصويت مدرسي بطاولات وسبورة دراسية واضحة
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
  // 5. مدخل مدرسة وبوابة تعليمية
  'https://images.unsplash.com/photo-1613896527029-79b943f43474?auto=format&fit=crop&w=800&q=80',
  // 6. واجهة مدرسة تقليدية بساحة وأقواس
  'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80',
  // 7. مبنى مؤسسة تعليمية ومدخل الفصول
  'https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?auto=format&fit=crop&w=800&q=80',
  // 8. فناء مدرسي ومبنى تعليمي
  'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=800&q=80',
  // 9. رواق مدرسي وممرات حجرات التدريس
  'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=800&q=80',
  // 10. مدرسة بساحة خضراء ومباني تعليمية
  'https://images.unsplash.com/photo-1525921429624-479b6a26d84d?auto=format&fit=crop&w=800&q=80',
  // 11. حجرة دراسية مجهزة بسبورة ومقاعد دراسية
  'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=800&q=80',
  // 12. مدخل وسلالم مدرسة تعليمية
  'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=800&q=80',
  // 13. واجهة صرح ومؤسسة مدرسية كبرى
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80',
  // 14. قاعة ومدرج تعليمي مدرسي
  'https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?auto=format&fit=crop&w=800&q=80',
];

export function clearAllStaffNamesFromCenters(centersList: Center[]): Center[] {
  return centersList.map((c) => ({
    ...c,
    centerStaff: (c.centerStaff || []).map((m) => ({
      ...m,
      firstName: '',
      lastName: '',
      birthDate: '',
      phone: '',
      nationalId: '',
      notes: '',
      notesStatus: null,
      fileNumber: '',
      depositDate: '',
      electoralCardNumber: '',
      fatherName: '',
      motherFullName: '',
      birthCommune: '',
      birthCertificateNumber: '',
      maritalStatus: '',
      spouseFullName: '',
      educationLevel: '',
      specialty: '',
      professionalStatus: '',
      profession: '',
      sector: '',
      address: '',
      pastRoles: {},
      isMemberOfAssociation: '',
      isMemberOfPoliticalParty: '',
      isRegisteredOnAuthorityWebsite: '',
    })),
    offices: (c.offices || []).map((o) => ({
      ...o,
      staff: (o.staff || []).map((m) => ({
        ...m,
        firstName: '',
        lastName: '',
        birthDate: '',
        phone: '',
        nationalId: '',
        notes: '',
        notesStatus: null,
        fileNumber: '',
        depositDate: '',
        electoralCardNumber: '',
        fatherName: '',
        motherFullName: '',
        birthCommune: '',
        birthCertificateNumber: '',
        maritalStatus: '',
        spouseFullName: '',
        educationLevel: '',
        specialty: '',
        professionalStatus: '',
        profession: '',
        sector: '',
        address: '',
        pastRoles: {},
        isMemberOfAssociation: '',
        isMemberOfPoliticalParty: '',
        isRegisteredOnAuthorityWebsite: '',
      })),
    })),
  }));
}

export function generate15ElectoralCenters(): Center[] {
  const centersConfig = [
    { name: 'الأمير عبد القادر', code: '01', officesCount: 14, address: 'نهج العربي بن مهيدي', imgIdx: 0 },
    { name: 'هواري بومدين', code: '02', officesCount: 16, address: 'شارع حسيبة بن بوعلي', imgIdx: 1 },
    { name: 'العربي بن مهيدي', code: '03', officesCount: 12, address: 'ساحة الساعات الثلاث', imgIdx: 2 },
    { name: 'ابن خلدون', code: '04', officesCount: 15, address: 'حي المنظر الجميل', imgIdx: 3 },
    { name: 'مفدي زكريا', code: '05', officesCount: 10, address: 'طريق وهران القديم', imgIdx: 4 },
    { name: 'العقيد لطفي', code: '06', officesCount: 18, address: 'حي ديار الجماعة', imgIdx: 5 },
    { name: 'الشيخ عبد الحميد بن باديس', code: '07', officesCount: 20, address: 'شارع علي خوجة', imgIdx: 6 },
    { name: 'مالك بن نبي', code: '08', officesCount: 12, address: 'حي المصالحة', imgIdx: 7 },
    { name: 'حسيبة بن بوعلي', code: '09', officesCount: 14, address: 'طريق المطار', imgIdx: 8 },
    { name: 'الشهيد ديدوش مراد', code: '10', officesCount: 15, address: 'شارع 11 ديسمبر 1960', imgIdx: 9 },
    { name: 'زيغود يوسف', code: '11', officesCount: 11, address: 'طريق عين البنيان', imgIdx: 10 },
    { name: 'الأمير خالد', code: '12', officesCount: 13, address: 'هضبة بوزريعة', imgIdx: 11 },
    { name: 'الشيخ البشير الإبراهيمي', code: '13', officesCount: 17, address: 'حي تقصراين', imgIdx: 12 },
    { name: 'أحمد توفيق المدني', code: '14', officesCount: 10, address: 'المنطقة الحضرية', imgIdx: 13 },
    { name: 'جميلة بوحيرد', code: '15', officesCount: 16, address: 'طريق بالم بيتش', imgIdx: 14 },
  ];

  return centersConfig.map((config) => {
    const centerId = `cnt_${config.code}`;
    
    // Generate Center Staff (طاقم قيادة المركز: 5 مناصب شاغرة بدون أي أسماء افتراضية)
    const centerStaff: StaffMember[] = CENTER_ROLES.map((role, rIdx) => ({
      id: `cs_${config.code}_${rIdx + 1}`,
      role,
      roleOrder: rIdx + 1,
      firstName: '',
      lastName: '',
      birthDate: '',
      phone: '',
      notes: '',
      educationLevel: '',
      specialty: '',
      profession: '',
    }));

    return {
      id: centerId,
      name: config.name,
      code: config.code,
      address: config.address,
      imageUrl: ALGERIAN_VOTER_CARD_IMG,
      centerStaff,
      offices: [],
    };
  });
}

export const INITIAL_CENTERS: Center[] = generate15ElectoralCenters();
