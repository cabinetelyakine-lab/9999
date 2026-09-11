/**
 * Arabic to French / Latin Transliteration Utility specifically calibrated for Algerian names
 * Converts Arabic First and Last names to standard Algerian French spelling (État Civil)
 * Examples:
 *   "محمد" -> "Mohamed"
 *   "حاج جيلاني" -> "Hadj Djillani"
 *   "بن علي" -> "Benali"
 *   "أحمد" -> "Ahmed"
 *   "عبد القادر" -> "Abdelkader"
 */

const COMMON_NAMES_MAP: Record<string, string> = {
  // First names
  محمد: 'Mohamed',
  أحمد: 'Ahmed',
  احمد: 'Ahmed',
  علي: 'Ali',
  عبدالله: 'Abdellah',
  'عبد الله': 'Abdellah',
  عبدالقادر: 'Abdelkader',
  'عبد القادر': 'Abdelkader',
  عبدالرحمن: 'Abderrahmane',
  'عبد الرحمن': 'Abderrahmane',
  عبدالعزيز: 'Abdelaziz',
  'عبد العزيز': 'Abdelaziz',
  عبدالكريم: 'Abdelkrim',
  'عبد الكريم': 'Abdelkrim',
  عبدالحميد: 'Abdelhamid',
  'عبد الحميد': 'Abdelhamid',
  عبدالمجيد: 'Abdelmadjid',
  'عبد المجيد': 'Abdelmadjid',
  فاطمة: 'Fatima',
  'فاطمة الزهراء': 'Fatima Zohra',
  فطيمة: 'Fatima',
  خديجة: 'Khadidja',
  عائشة: 'Aicha',
  مريم: 'Meriem',
  زينب: 'Zineb',
  أمينة: 'Amina',
  امينة: 'Amina',
  إيمان: 'Imane',
  ايمان: 'Imane',
  يوسف: 'Youcef',
  إبراهيم: 'Ibrahim',
  ابراهيم: 'Ibrahim',
  إسماعيل: 'Ismail',
  اسماعيل: 'Ismail',
  ياسين: 'Yacine',
  بلقاسم: 'Belkacem',
  مصطفى: 'Mustapha',
  عمر: 'Omar',
  عثمان: 'Othmane',
  خالد: 'Khaled',
  حمزة: 'Hamza',
  رشيد: 'Rachid',
  أمين: 'Amine',
  امين: 'Amine',
  مراد: 'Mourad',
  طارق: 'Tarek',
  حسان: 'Hassan',
  حسن: 'Hacene',
  حسين: 'Hocine',
  سمير: 'Samir',
  جمال: 'Djamel',
  نادية: 'Nadia',
  ليلى: 'Leila',
  هاجر: 'Hadjer',
  أسماء: 'Asma',
  اسماء: 'Asma',
  صبرينة: 'Sabrina',
  إكرام: 'Ikram',
  اكرم: 'Akram',
  أكرم: 'Akram',
  بلال: 'Bilal',
  صالح: 'Salah',
  سليم: 'Salim',
  سليمان: 'Slimane',
  موسى: 'Moussa',
  عيسى: 'Aissa',
  هارون: 'Haroun',
  زكرياء: 'Zakaria',
  زكريا: 'Zakaria',
  رياض: 'Riad',
  وليد: 'Walid',
  كريم: 'Karim',
  فريد: 'Farid',
  نبيل: 'Nabil',
  صابر: 'Saber',
  توفيق: 'Taoufik',
  لطفي: 'Lotfi',
  عادل: 'Adel',
  منير: 'Mounir',
  فوزي: 'Faouzi',
  سفيان: 'Sofiane',
  حكيم: 'Hakim',
  رضا: 'Redha',
  شمسالدين: 'Chamseddine',
  'شمس الدين': 'Chamseddine',
  نورالدين: 'Noureddine',
  'نور الدين': 'Noureddine',
  علاءالدين: 'Alaeddine',
  'علاء الدين': 'Alaeddine',
  بشير: 'Bachir',
  مبروك: 'Mabrouk',
  عمار: 'Ammar',
  مختار: 'Mokhtar',
  قدور: 'Kaddour',
  جيلالي: 'Djillani',
  جيلاني: 'Djillani',
  بوعلام: 'Boualem',
  بوزيد: 'Bouzid',
  ميلود: 'Miloud',
  طاهر: 'Tahar',
  رابح: 'Rabah',
  صادق: 'Sadek',
  محيالدين: 'Mohieddine',
  'محي الدين': 'Mohieddine',
  حبيبة: 'Habiba',
  حنان: 'Hanane',
  سهام: 'Siham',
  سعاد: 'Souad',
  سميرة: 'Samira',
  فريدة: 'Farida',
  نوال: 'Nawal',
  وسيلة: 'Wassila',
  وفاء: 'Wafa',
  هدى: 'Houda',
  ياسمين: 'Yasmine',
  ياسمينة: 'Yasmina',
  زهرة: 'Zohra',

  // Algerian Surnames and Common Prefixes
  حاج: 'Hadj',
  'حاج جيلاني': 'Hadj Djillani',
  'بن علي': 'Benali',
  بن: 'Ben',
  قاسمي: 'Kasmi',
  براهيمي: 'Brahimi',
  منصوري: 'Mansouri',
  حمادي: 'Hammadi',
  طاهري: 'Taheri',
  بوزيدي: 'Bouzidi',
  رحماني: 'Rahmani',
  سعيدي: 'Saidi',
  بلخير: 'Belkheir',
  عثماني: 'Othmani',
  عيساوي: 'Aissaoui',
  موساوي: 'Moussaoui',
  يعقوبي: 'Yagoubi',
  علالي: 'Allali',
  حداد: 'Haddad',
  نجار: 'Nadjare',
  عماري: 'Ammari',
  جلول: 'Djelloul',
  مداني: 'Madani',
  شريف: 'Cherif',
  معلم: 'Maalem',
  بوعزيز: 'Bouaziz',
  مباركي: 'Mebarki',
  العربي: 'Larbi',
};

// Phonetic Algerian-French character mapping
const CHAR_MAP: Record<string, string> = {
  ا: 'a',
  أ: 'a',
  إ: 'i',
  آ: 'a',
  ء: '',
  ئ: 'i',
  ؤ: 'ou',
  ب: 'b',
  ت: 't',
  ث: 'th',
  ج: 'dj',
  ح: 'h',
  خ: 'kh',
  د: 'd',
  ذ: 'dh',
  ر: 'r',
  ز: 'z',
  س: 's',
  ش: 'ch',
  ص: 's',
  ض: 'd',
  ط: 't',
  ظ: 'dh',
  ع: 'a',
  غ: 'gh',
  ف: 'f',
  ق: 'k',
  ك: 'k',
  ل: 'l',
  م: 'm',
  ن: 'n',
  ه: 'h',
  و: 'ou',
  ي: 'i',
  ى: 'a',
  ة: 'a',
};

export function capitalizeWord(word: string): string {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Transliterates Arabic text (Name or Surname) to Algerian Latin/French format.
 */
export function arabicToLatin(arabicText: string, isLastName = false): string {
  if (!arabicText || !arabicText.trim()) return '';

  const clean = arabicText
    .trim()
    .replace(/[\u064B-\u065F]/g, ''); // strip harakat

  // 1. Direct dictionary match
  if (COMMON_NAMES_MAP[clean]) {
    return COMMON_NAMES_MAP[clean];
  }

  // 2. Handle known prefixes
  if (clean.startsWith('بن ') || clean.startsWith('ابن ')) {
    const rest = clean.replace(/^(بن |ابن )/, '').trim();
    return `Ben ${arabicToLatin(rest, true)}`;
  }
  if (clean.startsWith('حاج ')) {
    const rest = clean.replace(/^حاج /, '').trim();
    return `Hadj ${arabicToLatin(rest, true)}`;
  }
  if (clean.startsWith('بو ') || clean.startsWith('أبو ')) {
    const rest = clean.replace(/^(بو |أبو )/, '').trim();
    return `Bou ${arabicToLatin(rest, true)}`;
  }
  if (clean.startsWith('بل ')) {
    const rest = clean.replace(/^بل /, '').trim();
    return `Bel ${arabicToLatin(rest, true)}`;
  }
  if (clean.startsWith('آل ') || clean.startsWith('ال ')) {
    const rest = clean.replace(/^(آل |ال )/, '').trim();
    return `El ${arabicToLatin(rest, true)}`;
  }

  // 3. Multi-word phrases
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    return words.map((w) => arabicToLatin(w, isLastName)).join(' ');
  }

  // 4. Single word dictionary lookup
  const single = words[0] || clean;
  if (COMMON_NAMES_MAP[single]) {
    return COMMON_NAMES_MAP[single];
  }

  // 5. Letter-by-letter phonetic transcription
  let latin = '';
  for (let i = 0; i < single.length; i++) {
    const char = single[i];
    const nextChar = single[i + 1];

    // Special cases
    if (char === 'ا' && nextChar === 'ل') {
      latin += 'el';
      i++;
      continue;
    }

    if (CHAR_MAP[char] !== undefined) {
      latin += CHAR_MAP[char];
    } else {
      latin += char;
    }
  }

  return capitalizeWord(latin);
}

/**
 * Returns French Prénom:
 * - If member.latinFirstName is set, returns it.
 * - Otherwise transliterates member.firstName.
 */
export function getMemberLatinFirstName(firstName?: string, latinFirstName?: string): string {
  if (latinFirstName && latinFirstName.trim()) {
    return latinFirstName.trim();
  }
  if (!firstName || !firstName.trim()) return '';
  return arabicToLatin(firstName, false);
}

/**
 * Returns French Nom:
 * - If member.latinLastName is set, returns it.
 * - Otherwise transliterates member.lastName.
 */
export function getMemberLatinLastName(lastName?: string, latinLastName?: string): string {
  if (latinLastName && latinLastName.trim()) {
    return latinLastName.trim();
  }
  if (!lastName || !lastName.trim()) return '';
  return arabicToLatin(lastName, true);
}
