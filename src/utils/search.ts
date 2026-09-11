import { Center, SearchResultItem, StaffMember } from '../types';

/**
 * Enhanced Arabic text normalization:
 * - Removes tashkeel / diacritics / tatweel
 * - Normalizes alef forms (أ, إ, آ, ٱ -> ا)
 * - Normalizes teh marbuta / heh (ة -> ه)
 * - Normalizes alef maksura & yeh with hamza (ى, ئ -> ي)
 * - Normalizes waw with hamza (ؤ -> و)
 * - Removes standalone hamza (ء)
 * - Removes tatweel / kashida (ـ)
 * - Trims and normalizes whitespace
 */
export function normalizeArabic(text: string | undefined | null): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    // Remove diacritics / tashkeel
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Remove Tatweel / Kashida
    .replace(/\u0640/g, '')
    // Normalize Alefs
    .replace(/[أإآٱ]/g, 'ا')
    // Normalize Teh Marbuta
    .replace(/ة/g, 'ه')
    // Normalize Alef Maksura & Yeh with Hamza
    .replace(/[ىئ]/g, 'ي')
    // Normalize Waw with hamza
    .replace(/ؤ/g, 'و')
    // Remove standalone Hamza
    .replace(/ء/g, '')
    // Remove special punctuation
    .replace(/[ـ.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Remove common Arabic prefixes like 'ال' (definite article) or 'بن' / 'بو' for lenient matching
 */
export function stripArabicPrefixes(text: string): string {
  const norm = normalizeArabic(text);
  return norm
    .split(' ')
    .map((word) => {
      let w = word;
      if (w.startsWith('ال') && w.length > 3) {
        w = w.slice(2);
      }
      return w;
    })
    .join(' ');
}

/**
 * Calculate Levenshtein Distance for fuzzy matching against typos
 */
export function levenshteinDistance(s1: string, s2: string): number {
  if (s1 === s2) return 0;
  if (!s1.length) return s2.length;
  if (!s2.length) return s1.length;

  const row: number[] = [];
  for (let i = 0; i <= s2.length; i++) {
    row[i] = i;
  }

  for (let i = 1; i <= s1.length; i++) {
    let prev = i;
    for (let j = 1; j <= s2.length; j++) {
      let val: number;
      if (s1[i - 1] === s2[j - 1]) {
        val = row[j - 1];
      } else {
        val = Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
      }
      row[j - 1] = prev;
      prev = val;
    }
    row[s2.length] = prev;
  }

  return row[s2.length];
}

/**
 * Calculates a similarity score between 0.0 (no match) and 1.0 (identical).
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = normalizeArabic(str1);
  const s2 = normalizeArabic(str2);

  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) {
    const minLen = Math.min(s1.length, s2.length);
    const maxLen = Math.max(s1.length, s2.length);
    return 0.8 + 0.2 * (minLen / maxLen);
  }

  const dist = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Extracts all staff members from a list of centers into a flat index of SearchResultItems.
 */
export function flattenAllStaff(centers: Center[]): SearchResultItem[] {
  const items: SearchResultItem[] = [];

  centers.forEach((center) => {
    // 1. Center staff
    center.centerStaff.forEach((member) => {
      // Include any registered member (either has a name or has custom data)
      if (member.firstName || member.lastName || member.phone || member.notes || member.fileNumber) {
        items.push({
          member,
          centerId: center.id,
          centerName: center.name,
          type: 'center_staff',
        });
      }
    });

    // 2. Offices staff
    center.offices.forEach((office) => {
      office.staff.forEach((member) => {
        if (member.firstName || member.lastName || member.phone || member.notes || member.fileNumber) {
          items.push({
            member,
            centerId: center.id,
            centerName: center.name,
            officeId: office.id,
            officeName: office.name,
            officeNumber: office.number,
            officeGender: office.gender || (office.number % 2 === 1 ? 'H' : 'F'),
            type: 'office_staff',
          });
        }
      });
    });
  });

  return items;
}

export const KNOWN_OFFICIAL_ROLES = [
  'رئيس مركز',
  'نائب رئيس المركز',
  'نائب رئيس مركز',
  'رئيس مكتب',
  'نائب رئيس مكتب',
  'كاتب',
  'مساعد أول',
  'مساعد ثاني',
  'مساعد ثالث',
  'مساعد رابع',
  'ممثل السلطة',
  'عضو أمانة 1',
  'عضو أمانة 2',
  'عضو أمانة 3',
  'إضافي أول',
  'إضافي ثاني',
];

/**
 * Strict role matching helper to distinguish separate official positions:
 * "رئيس مكتب" is NOT "نائب رئيس مكتب" and is NOT "رئيس مركز".
 */
export function areRolesMatching(roleA?: string, roleB?: string): boolean {
  if (!roleA || !roleB) return false;
  const normA = normalizeArabic(roleA).trim();
  const normB = normalizeArabic(roleB).trim();
  if (normA === normB) return true;

  // Handle subtle variants like "نائب رئيس المركز" vs "نائب رئيس مركز"
  if (
    (normA === 'نائب رئيس مركز' && normB === 'نائب رئيس المركز') ||
    (normA === 'نائب رئيس المركز' && normB === 'نائب رئيس مركز')
  ) {
    return true;
  }

  // Handle "مساعد رئيس مكتب" legacy synonym to "نائب رئيس مكتب"
  if (
    (normA === 'نائب رئيس مكتب' && (normB === 'مساعد رئيس مكتب' || normB === 'مساعد رئيس المكتب')) ||
    (normB === 'نائب رئيس مكتب' && (normA === 'مساعد رئيس مكتب' || normA === 'مساعد رئيس المكتب'))
  ) {
    return true;
  }

  return false;
}

export interface SearchFilterOptions {
  nameQuery: string; // Search by First Name + Last Name or Last Name + First Name, Education level, Specialty, Typo similar words
  roleQuery: string; // Search by role text
  selectedCenterId: string; // 'all' or specific center ID
  phoneQuery?: string;
  enableFuzzy?: boolean; // Default true: include typo-tolerant similar matches
  statusFilter?: 'all' | 'rejected' | 'accepted'; // Filter by acceptance or rejection status
  educationQuery?: string; // Filter by education level
  specialtyQuery?: string; // Filter by specialty
}

export interface ScoredSearchResult extends SearchResultItem {
  score?: number;
  matchType?: 'exact' | 'direct' | 'bidirectional' | 'education' | 'specialty' | 'profession' | 'partial' | 'similar';
  matchReason?: string;
  matchedFields?: string[];
}

/**
 * Match a staff member against a search query across:
 * - Specific Role ("رئيس مكتب", "رئيس مركز", "نائب رئيس مكتب", etc. with strict isolation)
 * - First Name & Last Name (bidirectional: First+Last or Last+First)
 * - Education Level (المستوى الدراسي)
 * - Specialty (التخصص)
 * - Profession / Notes (المهنة / الملاحظات)
 * - Card / File numbers
 * - Center
 * - Typo tolerance & Similar words
 */
export function scoreMemberMatch(
  member: StaffMember,
  centerName: string,
  officeNumber?: number,
  searchQuery?: string
): { score: number; matchType?: ScoredSearchResult['matchType']; matchReason?: string; matchedFields: string[] } {
  if (!searchQuery || !searchQuery.trim()) {
    return { score: 1.0, matchType: 'exact', matchedFields: [] };
  }

  const normQ = normalizeArabic(searchQuery).trim();
  const strippedQ = stripArabicPrefixes(searchQuery).trim();
  const compactQ = normQ.replace(/\s+/g, '');
  const tokens = normQ.split(/\s+/).filter(Boolean);

  const normFirst = normalizeArabic(member.firstName);
  const normLast = normalizeArabic(member.lastName);
  const normRole = normalizeArabic(member.role);
  const normCenter = normalizeArabic(centerName);
  const normOffice = officeNumber ? `مكتب ${officeNumber}` : '';
  const normCard = normalizeArabic(member.electoralCardNumber || member.nationalId || '');
  const normFile = normalizeArabic(member.fileNumber || '');
  const normEdu = normalizeArabic(member.educationLevel || '');
  const normSpec = normalizeArabic(member.specialty || '');
  const normProf = normalizeArabic(member.profession || member.notes || '');

  // Combined name permutations
  const combinedFirstLast = `${normFirst} ${normLast}`.trim();
  const combinedLastFirst = `${normLast} ${normFirst}`.trim();
  const compactFirstLast = combinedFirstLast.replace(/\s+/g, '');
  const compactLastFirst = combinedLastFirst.replace(/\s+/g, '');
  const strippedFirstLast = stripArabicPrefixes(combinedFirstLast);
  const strippedLastFirst = stripArabicPrefixes(combinedLastFirst);

  const matchedFields: string[] = [];

  // --------------------------------------------------------------------------
  // 1. STRICT ROLE ISOLATION CHECK
  // If the query is an official role (e.g. "رئيس مكتب", "رئيس مركز", "نائب رئيس مكتب")
  // Only the exact role matches!
  // --------------------------------------------------------------------------
  const matchedTargetRole = KNOWN_OFFICIAL_ROLES.find((r) => areRolesMatching(r, normQ));
  if (matchedTargetRole) {
    if (areRolesMatching(member.role, matchedTargetRole)) {
      return {
        score: 1.0,
        matchType: 'direct',
        matchReason: `المنصب: ${member.role}`,
        matchedFields: ['role'],
      };
    }
    // If the query is an official role, do NOT match other roles
    // Check if the person's actual personal name literally matches the query:
    const isPersonalNameExact =
      combinedFirstLast === normQ ||
      combinedLastFirst === normQ ||
      normFirst === normQ ||
      normLast === normQ;

    if (isPersonalNameExact) {
      return {
        score: 0.95,
        matchType: 'direct',
        matchReason: 'تطابق مباشر للاسم',
        matchedFields: ['name'],
      };
    }

    // Role does not match -> return score 0
    return { score: 0, matchedFields: [] };
  }

  // --------------------------------------------------------------------------
  // 2. COMPOUND ROLE CHECK (e.g. "محمد رئيس مكتب" or "قاسمي نائب رئيس مكتب")
  // --------------------------------------------------------------------------
  const sortedRolesByLength = [
    'نائب رئيس المركز',
    'نائب رئيس مركز',
    'نائب رئيس مكتب',
    'رئيس مكتب',
    'رئيس مركز',
    'مساعد أول',
    'مساعد ثاني',
    'مساعد ثالث',
    'مساعد رابع',
    'ممثل السلطة',
    'عضو أمانة 1',
    'عضو أمانة 2',
    'عضو أمانة 3',
    'إضافي أول',
    'إضافي ثاني',
    'كاتب',
  ];

  const embeddedRole = sortedRolesByLength.find((r) => normQ.includes(normalizeArabic(r)));
  if (embeddedRole) {
    // If the compound query specifies a role, the member MUST hold that role
    if (!areRolesMatching(member.role, embeddedRole)) {
      return { score: 0, matchedFields: [] };
    }

    const remainderQuery = normQ.replace(normalizeArabic(embeddedRole), '').trim();
    if (!remainderQuery) {
      return {
        score: 1.0,
        matchType: 'direct',
        matchReason: `المنصب: ${member.role}`,
        matchedFields: ['role'],
      };
    }

    const remainderTokens = remainderQuery.split(/\s+/).filter(Boolean);
    const remainderMatches = remainderTokens.every((t) => {
      const strippedT = stripArabicPrefixes(t);
      return (
        normFirst.includes(t) ||
        normLast.includes(t) ||
        strippedFirstLast.includes(strippedT) ||
        (normEdu && (normEdu.includes(t) || stripArabicPrefixes(normEdu).includes(strippedT))) ||
        (normSpec && (normSpec.includes(t) || stripArabicPrefixes(normSpec).includes(strippedT))) ||
        (normProf && (normProf.includes(t) || stripArabicPrefixes(normProf).includes(strippedT)))
      );
    });

    if (remainderMatches) {
      return {
        score: 0.98,
        matchType: 'direct',
        matchReason: `تطابق الاسم مع المنصب: ${member.role}`,
        matchedFields: ['role', 'name'],
      };
    }

    return { score: 0, matchedFields: [] };
  }

  // --------------------------------------------------------------------------
  // 3. EXACT FULL NAME MATCH (Both Orders)
  // --------------------------------------------------------------------------
  if (
    combinedFirstLast === normQ ||
    combinedLastFirst === normQ ||
    compactFirstLast === compactQ ||
    compactLastFirst === compactQ
  ) {
    return {
      score: 1.0,
      matchType: 'exact',
      matchReason: 'تطابق تام للاسم واللقب',
      matchedFields: ['name'],
    };
  }

  let score = 0;
  let matchType: ScoredSearchResult['matchType'] = undefined;
  let matchReason: string | undefined = undefined;

  // --------------------------------------------------------------------------
  // 4. DIRECT SUBSTRING NAME MATCH
  // --------------------------------------------------------------------------
  if (
    combinedFirstLast.includes(normQ) ||
    combinedLastFirst.includes(normQ) ||
    compactFirstLast.includes(compactQ) ||
    compactLastFirst.includes(compactQ) ||
    normFirst === normQ ||
    normLast === normQ
  ) {
    score = 0.95;
    matchType = 'direct';
    matchReason = 'تطابق مباشر للاسم أو اللقب';
    matchedFields.push('name');
  }

  // --------------------------------------------------------------------------
  // 5. STRIPPED PREFIX NAME MATCH ("القاسمي" <-> "قاسمي")
  // --------------------------------------------------------------------------
  else if (
    strippedFirstLast.includes(strippedQ) ||
    strippedLastFirst.includes(strippedQ)
  ) {
    score = 0.92;
    matchType = 'bidirectional';
    matchReason = 'تطابق الاسم بدون زوائد التعريف';
    matchedFields.push('name');
  }

  // --------------------------------------------------------------------------
  // 6. EDUCATION LEVEL MATCH (المستوى الدراسي)
  // --------------------------------------------------------------------------
  if (normEdu && (normEdu.includes(normQ) || (strippedQ.length > 2 && stripArabicPrefixes(normEdu).includes(strippedQ)))) {
    if (score < 0.9) {
      score = 0.9;
      matchType = 'education';
      matchReason = `المستوى الدراسي: ${member.educationLevel}`;
    }
    matchedFields.push('education');
  }

  // --------------------------------------------------------------------------
  // 7. SPECIALTY MATCH (التخصص)
  // --------------------------------------------------------------------------
  if (normSpec && (normSpec.includes(normQ) || (strippedQ.length > 2 && stripArabicPrefixes(normSpec).includes(strippedQ)))) {
    if (score < 0.9) {
      score = 0.9;
      matchType = 'specialty';
      matchReason = `التخصص: ${member.specialty}`;
    }
    matchedFields.push('specialty');
  }

  // --------------------------------------------------------------------------
  // 8. PROFESSION MATCH (المهنة)
  // --------------------------------------------------------------------------
  if (normProf && (normProf.includes(normQ) || (strippedQ.length > 2 && stripArabicPrefixes(normProf).includes(strippedQ)))) {
    if (score < 0.88) {
      score = 0.88;
      matchType = 'profession';
      matchReason = `المهنة: ${member.profession || member.notes}`;
    }
    matchedFields.push('profession');
  }

  // --------------------------------------------------------------------------
  // 9. CARD OR FILE NUMBER MATCH
  // --------------------------------------------------------------------------
  if (normCard && normCard.includes(normQ)) {
    if (score < 0.92) {
      score = 0.92;
      matchType = 'direct';
      matchReason = 'رقم بطاقة الانتخاب';
    }
    matchedFields.push('card');
  }
  if (normFile && normFile.includes(normQ)) {
    if (score < 0.92) {
      score = 0.92;
      matchType = 'direct';
      matchReason = 'رقم الملف';
    }
    matchedFields.push('file');
  }

  // --------------------------------------------------------------------------
  // 10. MULTI-TOKEN COMPOSITE MATCH (e.g. "محمد ليسانس", "قاسمي حقوق", "ماستر إعلام آلي")
  // Requires ALL tokens to be matched!
  // --------------------------------------------------------------------------
  if (tokens.length > 1) {
    let tokenMatches = 0;
    const tokenMatchedReasons: string[] = [];

    for (const t of tokens) {
      const strippedT = stripArabicPrefixes(t);
      let matchedToken = false;

      if (normFirst.includes(t) || normLast.includes(t) || strippedFirstLast.includes(strippedT)) {
        matchedToken = true;
        tokenMatchedReasons.push('الاسم');
        if (!matchedFields.includes('name')) matchedFields.push('name');
      } else if (normEdu && (normEdu.includes(t) || stripArabicPrefixes(normEdu).includes(strippedT))) {
        matchedToken = true;
        tokenMatchedReasons.push('المستوى');
        if (!matchedFields.includes('education')) matchedFields.push('education');
      } else if (normSpec && (normSpec.includes(t) || stripArabicPrefixes(normSpec).includes(strippedT))) {
        matchedToken = true;
        tokenMatchedReasons.push('التخصص');
        if (!matchedFields.includes('specialty')) matchedFields.push('specialty');
      } else if (normProf && (normProf.includes(t) || stripArabicPrefixes(normProf).includes(strippedT))) {
        matchedToken = true;
        tokenMatchedReasons.push('المهنة');
        if (!matchedFields.includes('profession')) matchedFields.push('profession');
      } else if (normCenter.includes(t)) {
        matchedToken = true;
        tokenMatchedReasons.push('المركز');
      } else if (/\d+/.test(t) && normOffice && normOffice.includes(t)) {
        matchedToken = true;
        tokenMatchedReasons.push('رقم المكتب');
      }

      if (matchedToken) tokenMatches++;
    }

    if (tokenMatches === tokens.length) {
      score = Math.max(score, 0.94);
      matchType = 'partial';
      matchReason = `تطابق مركب: ${Array.from(new Set(tokenMatchedReasons)).join(' + ')}`;
    }
  }

  // --------------------------------------------------------------------------
  // 11. TYPO TOLERANCE & SIMILAR WORDS (تشابه الكلمات والأسماء بالتقريب)
  // Strictly for personal names, education and specialty (never roles)
  // --------------------------------------------------------------------------
  if (score === 0) {
    const simFirstLast = calculateStringSimilarity(combinedFirstLast, normQ);
    const simLastFirst = calculateStringSimilarity(combinedLastFirst, normQ);
    const simFirst = calculateStringSimilarity(normFirst, normQ);
    const simLast = calculateStringSimilarity(normLast, normQ);
    const simEdu = normEdu ? calculateStringSimilarity(normEdu, normQ) : 0;
    const simSpec = normSpec ? calculateStringSimilarity(normSpec, normQ) : 0;

    const maxSim = Math.max(simFirstLast, simLastFirst, simFirst, simLast, simEdu, simSpec);

    // Multi-token fuzzy match (only if all tokens find fuzzy match)
    let tokenFuzzyPass = false;
    if (tokens.length >= 1) {
      const allSearchableWords = `${combinedFirstLast} ${normEdu} ${normSpec} ${normProf}`
        .split(/\s+/)
        .filter((w) => w.length >= 2);

      let fuzzyMatchedTokens = 0;
      for (const qToken of tokens) {
        if (qToken.length <= 2) {
          if (allSearchableWords.some((w) => w.includes(qToken))) {
            fuzzyMatchedTokens++;
          }
        } else {
          const bestSim = Math.max(
            0,
            ...allSearchableWords.map((w) => calculateStringSimilarity(qToken, w))
          );
          if (bestSim >= 0.70) {
            fuzzyMatchedTokens++;
          }
        }
      }

      if (fuzzyMatchedTokens === tokens.length && allSearchableWords.length > 0) {
        tokenFuzzyPass = true;
      }
    }

    if (maxSim >= 0.68 || tokenFuzzyPass) {
      score = Math.max(maxSim, tokenFuzzyPass ? 0.72 : 0.55);
      matchType = 'similar';
      matchReason = 'تشابه كلمات بالتقريب (كلمات مشابهة)';
      matchedFields.push('similar');
    }
  }

  return { score, matchType, matchReason, matchedFields };
}

/**
 * Comprehensive, resilient, and typo-tolerant search filter supporting:
 * - Bidirectional Name + Surname (e.g. "محمد قاسمي" and "قاسمي محمد")
 * - Typo tolerance & similar names / words (e.g. "سليمان" -> "سليماني", "بلعيد" -> "بلعيدي", "براهيم" -> "ابراهيم")
 * - Education Level (المستوى الدراسي: ليسانس، ماستر، مهندس...)
 * - Specialty (التخصص: حقوق، إعلام آلي، علوم اقتصادية...)
 * - Combined & stripped prefixes ("عبد الرحمن" vs "عبدالرحمن", "القاسمي" vs "قاسمي")
 * - Role / Position match
 * - Center scope (all centers vs specific center)
 * - Phone match
 */
export function filterStaffMembers(
  centers: Center[],
  options: SearchFilterOptions
): ScoredSearchResult[] {
  const allStaff = flattenAllStaff(centers);
  const normalizedRoleQuery = normalizeArabic(options.roleQuery);
  const normalizedPhoneQuery = (options.phoneQuery || '').trim();
  const normalizedEduQuery = normalizeArabic(options.educationQuery);
  const normalizedSpecQuery = normalizeArabic(options.specialtyQuery);

  const matchedItems: ScoredSearchResult[] = [];

  for (const item of allStaff) {
    // 1. Center Scope check
    if (options.selectedCenterId && options.selectedCenterId !== 'all') {
      if (item.centerId !== options.selectedCenterId) {
        continue;
      }
    }

    const { member } = item;
    const normRole = normalizeArabic(member.role);
    const normEdu = normalizeArabic(member.educationLevel || '');
    const normSpec = normalizeArabic(member.specialty || '');

    // 2. Role Filter (Strict role matching to isolate each position: رئيس مكتب vs نائب رئيس مكتب vs رئيس مركز)
    if (options.roleQuery && options.roleQuery.trim()) {
      if (!areRolesMatching(member.role, options.roleQuery)) {
        continue;
      }
    }

    // 3. Dedicated Education Filter if passed
    if (normalizedEduQuery) {
      if (!normEdu.includes(normalizedEduQuery)) {
        continue;
      }
    }

    // 4. Dedicated Specialty Filter if passed
    if (normalizedSpecQuery) {
      if (!normSpec.includes(normalizedSpecQuery)) {
        continue;
      }
    }

    // 5. Status Filter (مقبول / مرفوض)
    if (options.statusFilter === 'rejected') {
      const isRejected =
        member.notesStatus === 'rejected' ||
        (member.notes &&
          (member.notes.includes('مرفوض') ||
            member.notes.includes('رفض') ||
            member.notes.includes('عدم قبول')));
      if (!isRejected) {
        continue;
      }
    } else if (options.statusFilter === 'accepted') {
      const isAccepted =
        member.notesStatus === 'accepted' ||
        (member.notes &&
          (member.notes.includes('مقبول') ||
            member.notes.includes('قبول') ||
            member.notes.includes('مؤكد')));
      if (!isAccepted) {
        continue;
      }
    }

    // 6. Phone Filter if provided
    if (normalizedPhoneQuery) {
      const cleanPhone = (member.phone || '').replace(/\D/g, '');
      const cleanSearchPhone = normalizedPhoneQuery.replace(/\D/g, '');
      if (!cleanPhone.includes(cleanSearchPhone)) {
        continue;
      }
    }

    // 7. If no general query was given, it passes with full score
    if (!options.nameQuery || !options.nameQuery.trim()) {
      matchedItems.push({ ...item, score: 1.0, matchType: 'exact', matchReason: 'الكل' });
      continue;
    }

    // 8. Comprehensive matching
    const matchResult = scoreMemberMatch(
      member,
      item.centerName,
      item.officeNumber,
      options.nameQuery
    );

    if (matchResult.score > 0) {
      matchedItems.push({
        ...item,
        score: matchResult.score,
        matchType: matchResult.matchType,
        matchReason: matchResult.matchReason,
        matchedFields: matchResult.matchedFields,
      });
    }
  }

  // Sort results: highest similarity score first, then center/office order
  matchedItems.sort((a, b) => {
    if ((b.score || 0) !== (a.score || 0)) {
      return (b.score || 0) - (a.score || 0);
    }
    return a.centerName.localeCompare(b.centerName, 'ar');
  });

  return matchedItems;
}
