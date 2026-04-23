// This module loads questions from the JSON file and organizes them into bilets
// The data comes from the real PDD Uzbekistan question database

let questionsCache = null;

export async function loadQuestions() {
  if (questionsCache) return questionsCache;
  
  try {
    const response = await fetch('/pdd_savollar_barchasi.json');
    const rawData = await response.json();
    
    if (!Array.isArray(rawData) || rawData.length === 0) {
      console.error('Invalid or empty question data');
      return [];
    }

    // Transform raw data into our format
    const questions = rawData.map((q, index) => {
      const options_uz = [q.javob_1, q.javob_2, q.javob_3, q.javob_4].filter(o => o && o.trim() !== '');
      const options_kr = [q.javob_1_kril, q.javob_2_kril, q.javob_3_kril, q.javob_4_kril].filter(o => o && o.trim() !== '');
      const options_ru = [q.javob_1_rus, q.javob_2_rus, q.javob_3_rus, q.javob_4_rus].filter(o => o && o.trim() !== '');
      const correctIndex = (q.togri_javob_raqami || 1) - 1;
      
      return {
        id: q.id || index + 1,
        bilet_number: q.bilet_id,
        question_uz: q.savol || '',
        question_kr: q.savol_kril || q.savol || '',
        question_ru: q.savol_rus || q.savol || '',
        image: q.rasm && q.rasm.trim() !== '' ? q.rasm : null,
        options_uz: options_uz,
        options_kr: options_kr.length > 0 ? options_kr : options_uz,
        options_ru: options_ru.length > 0 ? options_ru : options_uz,
        correct_index: Math.min(correctIndex, Math.max(options_uz.length - 1, 0)),
        explanation_uz: `To'g'ri javob: ${q.togri_javob || options_uz[correctIndex] || ''}`,
        explanation_kr: `Тўғри жавоб: ${q.togri_javob_kril || options_kr[correctIndex] || options_uz[correctIndex] || ''}`,
        explanation_ru: `Правильный ответ: ${q.togri_javob_rus || options_ru[correctIndex] || options_uz[correctIndex] || ''}`,
      };
    });

    // Auto-split into bilets of 20 questions each (dynamic, no hardcoded 30)
    const QUESTIONS_PER_BILET = 20;
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

    questionsCache = bilets;
    return bilets;
  } catch (error) {
    console.error('Failed to load questions:', error);
    return [];
  }
}

export function getBiletQuestions(bilets, biletNumber) {
  const bilet = bilets.find(b => b.number === biletNumber);
  return bilet ? bilet.questions : [];
}

export function getRandomQuestions(bilets, count = 20) {
  const allQuestions = bilets.flatMap(b => b.questions);
  const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
