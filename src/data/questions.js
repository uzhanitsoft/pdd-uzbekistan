// This module loads questions from the JSON file and organizes them into bilets
// The data comes from the real PDD Uzbekistan question database

// We'll import the full question set and organize into 30 bilets of 20 questions each
let questionsCache = null;

export async function loadQuestions() {
  if (questionsCache) return questionsCache;
  
  try {
    const response = await fetch('/pdd_savollar_barchasi.json');
    const rawData = await response.json();
    
    // Transform raw data into our format
    const questions = rawData.map((q, index) => {
      const options_uz = [q.javob_1, q.javob_2, q.javob_3, q.javob_4].filter(o => o && o.trim() !== '');
      const options_kr = [q.javob_1_kril, q.javob_2_kril, q.javob_3_kril, q.javob_4_kril].filter(o => o && o.trim() !== '');
      const options_ru = [q.javob_1_rus, q.javob_2_rus, q.javob_3_rus, q.javob_4_rus].filter(o => o && o.trim() !== '');
      const correctIndex = q.togri_javob_raqami - 1;
      
      return {
        id: q.id,
        bilet_number: q.bilet_id,
        question_uz: q.savol,
        question_kr: q.savol_kril || q.savol,
        question_ru: q.savol_rus || q.savol,
        image: q.rasm && q.rasm.trim() !== '' ? q.rasm : null,
        options_uz: options_uz,
        options_kr: options_kr.length > 0 ? options_kr : options_uz,
        options_ru: options_ru.length > 0 ? options_ru : options_uz,
        correct_index: Math.min(correctIndex, options_uz.length - 1),
        explanation_uz: `To'g'ri javob: ${q.togri_javob || options_uz[correctIndex]}`,
        explanation_kr: `Тўғри жавоб: ${q.togri_javob_kril || options_kr[correctIndex] || options_uz[correctIndex]}`,
        explanation_ru: `Правильный ответ: ${q.togri_javob_rus || options_ru[correctIndex] || options_uz[correctIndex]}`
      };
    });

    // Group by bilet_id 
    const biletMap = {};
    questions.forEach(q => {
      if (!biletMap[q.bilet_number]) {
        biletMap[q.bilet_number] = [];
      }
      biletMap[q.bilet_number].push(q);
    });

    // Create exactly 30 bilets with 20 questions each
    const bilets = [];
    const allBiletIds = Object.keys(biletMap).map(Number).sort((a, b) => a - b);
    
    // First, use existing bilet groupings
    let allQuestions = [];
    allBiletIds.forEach(id => {
      allQuestions.push(...biletMap[id]);
    });

    // Now distribute into 30 bilets of 20 questions
    for (let i = 0; i < 30; i++) {
      const start = i * 20;
      const end = start + 20;
      const biletQuestions = allQuestions.slice(start, end);
      
      if (biletQuestions.length === 20) {
        bilets.push({
          number: i + 1,
          questions: biletQuestions.map((q, idx) => ({
            ...q,
            bilet_number: i + 1,
            questionNumber: idx + 1
          }))
        });
      }
    }

    // If we have fewer than 30 full bilets, fill up by cycling
    while (bilets.length < 30) {
      const sourceIndex = bilets.length % Math.max(bilets.length, 1);
      const sourceQuestions = allQuestions.slice(sourceIndex * 20, sourceIndex * 20 + 20);
      if (sourceQuestions.length < 20) break;
      
      bilets.push({
        number: bilets.length + 1,
        questions: sourceQuestions.map((q, idx) => ({
          ...q,
          bilet_number: bilets.length + 1,
          questionNumber: idx + 1
        }))
      });
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
