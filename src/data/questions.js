// Question loader & normalizer
// Supports 3 formats:
//   1. Old flat array: [ {savol, savol_kril, savol_rus, javob_1, javob_1_kril, ...} ]
//   2. New language-keyed: { uzb: [...], kril: [...], rus: [...] }
//   3. Simple: [ {savol, javob_1..4, togri_javob_raqami} ]

const QUESTIONS_PER_BILET = 20;
const DB_KEY = 'pdd_questions_db';

// Try to restore from localStorage
export function getStoredQuestions() {
  try {
    const stored = localStorage.getItem(DB_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // New format: { uzb: [...], kril: [...], rus: [...] }
      if (data && !Array.isArray(data) && (data.uzb || data.kril || data.rus)) return data;
      // Old format: flat array
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) { console.error('Restore questions fail:', e); }
  return null;
}

// Save to localStorage
export function storeQuestions(rawData) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(rawData));
  } catch (e) { console.error('Store questions fail:', e); }
}

// Clear stored questions
export function clearStoredQuestions() {
  localStorage.removeItem(DB_KEY);
}

// Normalize a single question (language-specific)
function normalizeSimpleQuestion(q, index) {
  const opts = [
    q.javob_1 || '', q.javob_2 || '', q.javob_3 || '', q.javob_4 || ''
  ].filter(o => o && o.trim() !== '');

  const correctIndex = (q.togri_javob_raqami || 1) - 1;

  return {
    id: q.id || index + 1,
    bilet_number: q.bilet_id || Math.floor(index / QUESTIONS_PER_BILET) + 1,
    question: q.savol || '',
    image: q.rasm && q.rasm.trim() !== '' ? q.rasm : null,
    options: opts,
    correct_index: Math.min(correctIndex, Math.max(opts.length - 1, 0)),
    correct_text: q.togri_javob || opts[correctIndex] || '',
  };
}

// Normalize old format (3 languages in one object)
function normalizeOldQuestion(q, index) {
  const javob1 = q.javob_1 || q.answer_1 || '';
  const javob2 = q.javob_2 || q.answer_2 || '';
  const javob3 = q.javob_3 || q.answer_3 || '';
  const javob4 = q.javob_4 || q.answer_4 || '';
  const options_uz = [javob1, javob2, javob3, javob4].filter(o => o && o.trim() !== '');

  const options_kr = [
    q.javob_1_kril || '', q.javob_2_kril || '', q.javob_3_kril || '', q.javob_4_kril || ''
  ].filter(o => o && o.trim() !== '');

  const options_ru = [
    q.javob_1_rus || '', q.javob_2_rus || '', q.javob_3_rus || '', q.javob_4_rus || ''
  ].filter(o => o && o.trim() !== '');

  const correctIndex = (q.togri_javob_raqami || 1) - 1;

  return {
    id: q.id || index + 1,
    bilet_number: q.bilet_id || Math.floor(index / QUESTIONS_PER_BILET) + 1,
    question_uz: q.savol || '',
    question_kr: q.savol_kril || q.savol || '',
    question_ru: q.savol_rus || q.savol || '',
    image: q.rasm && q.rasm.trim() !== '' ? q.rasm : null,
    options_uz,
    options_kr: options_kr.length > 0 ? options_kr : options_uz,
    options_ru: options_ru.length > 0 ? options_ru : options_uz,
    correct_index: Math.min(correctIndex, Math.max(options_uz.length - 1, 0)),
    explanation_uz: `To'g'ri javob: ${q.togri_javob || options_uz[correctIndex] || ''}`,
    explanation_kr: `Тўғри жавоб: ${q.togri_javob_kril || (options_kr.length > 0 ? options_kr[correctIndex] : options_uz[correctIndex]) || ''}`,
    explanation_ru: `Правильный ответ: ${q.togri_javob_rus || (options_ru.length > 0 ? options_ru[correctIndex] : options_uz[correctIndex]) || ''}`,
  };
}

// Check if data is new language-keyed format
export function isNewFormat(data) {
  return data && !Array.isArray(data) && (data.uzb || data.kril || data.rus);
}

// Process NEW format: { uzb: [...], kril: [...], rus: [...] }
// Returns language-specific bilets based on selected lang
export function processNewFormatQuestions(data, lang) {
  const langKey = lang === 'uz' ? 'uzb' : lang === 'kr' ? 'kril' : 'rus';
  const questions = data[langKey] || data.uzb || [];

  if (!Array.isArray(questions) || questions.length === 0) return [];

  const normalized = questions.map((q, i) => {
    const simple = normalizeSimpleQuestion(q, i);
    // Map to standard field names the UI expects
    return {
      ...simple,
      question_uz: lang === 'uz' ? simple.question : '',
      question_kr: lang === 'kr' ? simple.question : '',
      question_ru: lang === 'ru' ? simple.question : '',
      options_uz: lang === 'uz' ? simple.options : [],
      options_kr: lang === 'kr' ? simple.options : [],
      options_ru: lang === 'ru' ? simple.options : [],
      explanation_uz: lang === 'uz' ? `To'g'ri javob: ${simple.correct_text}` : '',
      explanation_kr: lang === 'kr' ? `Тўғри жавоб: ${simple.correct_text}` : '',
      explanation_ru: lang === 'ru' ? `Правильный ответ: ${simple.correct_text}` : '',
    };
  });

  const bilets = [];
  for (let i = 0; i < normalized.length; i += QUESTIONS_PER_BILET) {
    const biletQuestions = normalized.slice(i, i + QUESTIONS_PER_BILET);
    if (biletQuestions.length > 0) {
      const biletNumber = Math.floor(i / QUESTIONS_PER_BILET) + 1;
      bilets.push({
        number: biletNumber,
        questions: biletQuestions.map((q, idx) => ({
          ...q,
          bilet_number: biletNumber,
          questionNumber: idx + 1,
        })),
      });
    }
  }
  return bilets;
}

// Process OLD format raw data into bilets (backward compatible)
export function processQuestions(rawData) {
  if (!rawData) return [];

  // New format detection
  if (isNewFormat(rawData)) {
    return processNewFormatQuestions(rawData, 'uz'); // default to UZB
  }

  if (!Array.isArray(rawData) || rawData.length === 0) return [];

  const questions = rawData.map((q, i) => normalizeOldQuestion(q, i));

  const bilets = [];
  for (let i = 0; i < questions.length; i += QUESTIONS_PER_BILET) {
    const biletQuestions = questions.slice(i, i + QUESTIONS_PER_BILET);
    if (biletQuestions.length > 0) {
      const biletNumber = Math.floor(i / QUESTIONS_PER_BILET) + 1;
      bilets.push({
        number: biletNumber,
        questions: biletQuestions.map((q, idx) => ({
          ...q,
          bilet_number: biletNumber,
          questionNumber: idx + 1,
        })),
      });
    }
  }

  return bilets;
}

// Legacy: load from static file (fallback)
export async function loadQuestions() {
  try {
    const response = await fetch('/pdd_savollar_barchasi.json');
    if (!response.ok) return [];
    const rawData = await response.json();
    return processQuestions(rawData);
  } catch (error) {
    console.error('Failed to load questions:', error);
    return [];
  }
}
