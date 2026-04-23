// Question loader & normalizer
// Supports both the full 3-language format (pdd_savollar_barchasi.json)
// and the simple format (savol, javob_1..4, togri_javob_raqami)

const QUESTIONS_PER_BILET = 20;
const DB_KEY = 'pdd_questions_db';

// Try to restore from localStorage
export function getStoredQuestions() {
  try {
    const stored = localStorage.getItem(DB_KEY);
    if (stored) {
      const data = JSON.parse(stored);
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

// Normalize any raw question format into our standard format
function normalizeQuestion(q, index) {
  // Handle answers - filter out empty ones
  const javob1 = q.javob_1 || q.answer_1 || '';
  const javob2 = q.javob_2 || q.answer_2 || '';
  const javob3 = q.javob_3 || q.answer_3 || '';
  const javob4 = q.javob_4 || q.answer_4 || '';
  const options_uz = [javob1, javob2, javob3, javob4].filter(o => o && o.trim() !== '');

  // Cyrillic answers
  const options_kr = [
    q.javob_1_kril || '', q.javob_2_kril || '', q.javob_3_kril || '', q.javob_4_kril || ''
  ].filter(o => o && o.trim() !== '');

  // Russian answers
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

// Process raw data into bilets
export function processQuestions(rawData) {
  if (!Array.isArray(rawData) || rawData.length === 0) return [];

  const questions = rawData.map((q, i) => normalizeQuestion(q, i));

  // Split into bilets of 20
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
