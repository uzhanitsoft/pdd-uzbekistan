import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { processQuestions, processNewFormatQuestions, isNewFormat, getStoredQuestions, storeQuestions, clearStoredQuestions } from '../data/questions';
import { translations } from '../data/translations';

const AppContext = createContext();

const STORAGE_KEY = 'pdd_uzbekistan_v2';
const THEME_KEY = 'pdd_theme';
const LANG_KEY = 'pdd_lang';
const USER_KEY = 'pdd_user_id';

function getUserId() {
  let uid = localStorage.getItem(USER_KEY);
  if (!uid) { uid = 'u_' + crypto.randomUUID(); localStorage.setItem(USER_KEY, uid); }
  return uid;
}

function getStoredProgress() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { console.error('Progress read fail:', e); }
  return defaultProgress();
}

function defaultProgress() {
  return {
    biletAnswers: {},
    biletResults: {},
    biletScores: {},
    currentBilet: -1,
    currentQuestion: 0,
    examHistory: [],
    activeExam: null,
    updatedAt: Date.now(),
  };
}

function saveProgressLocal(progress) {
  try { progress.updatedAt = Date.now(); localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }
  catch (e) { console.error('Progress save fail:', e); }
}

let syncTimer = null;
async function pushToServer(progress) {
  if (!navigator.onLine) return;
  try {
    const uid = getUserId();
    await fetch(`/api/progress/${uid}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(progress) });
  } catch (e) { /* silent */ }
}
async function pullFromServer() {
  if (!navigator.onLine) return null;
  try {
    const uid = getUserId();
    const resp = await fetch(`/api/progress/${uid}`);
    if (!resp.ok) return null;
    const json = await resp.json();
    return json.exists ? json.data : null;
  } catch (e) { return null; }
}
function mergeProgress(local, server) {
  if (!local && !server) return defaultProgress();
  if (!local) return server;
  if (!server) return local;
  const base = (server.updatedAt || 0) > (local.updatedAt || 0) ? { ...server } : { ...local };
  const other = base === local ? server : local;
  if (other.biletAnswers) {
    if (!base.biletAnswers) base.biletAnswers = {};
    for (const key of Object.keys(other.biletAnswers)) {
      if (!base.biletAnswers[key]) { base.biletAnswers[key] = other.biletAnswers[key]; }
      else { for (const qId of Object.keys(other.biletAnswers[key])) { if (!base.biletAnswers[key][qId]) base.biletAnswers[key][qId] = other.biletAnswers[key][qId]; } }
    }
  }
  if (other.examHistory?.length) {
    if (!base.examHistory) base.examHistory = [];
    const existing = new Set(base.examHistory.map(e => e.startedAt));
    for (const exam of other.examHistory) { if (!existing.has(exam.startedAt)) base.examHistory.push(exam); }
  }
  base.updatedAt = Date.now();
  return base;
}
function schedulePush(progress) {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => pushToServer(progress), 2000);
}

// ====== PROVIDER ======
export function AppProvider({ children }) {
  const [screen, setScreen] = useState('home');
  const [lang, setLang] = useState(() => localStorage.getItem(LANG_KEY) || 'uz');
  const [theme, setThemeState] = useState(() => localStorage.getItem(THEME_KEY) || 'light');
  const [bilets, setBilets] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [selectedBilet, setSelectedBilet] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [progress, setProgress] = useState(getStoredProgress);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  const [examState, setExamState] = useState(null);
  const examTimerRef = useRef(null);

  const t = useCallback((key) => translations[lang]?.[key] || translations['uz']?.[key] || key, [lang]);

  // ====== INIT: restore previously uploaded data ======
  useEffect(() => {
    const stored = getStoredQuestions();
    if (stored) {
      let bils;
      if (isNewFormat(stored)) {
        bils = processNewFormatQuestions(stored, lang);
      } else {
        bils = processQuestions(stored);
      }
      setBilets(bils);
      setAllQuestions(bils.flatMap(b => b.questions));
      setHasData(true);
    }
    setLoading(false);

    // Server sync
    (async () => {
      try {
        const serverData = await pullFromServer();
        if (serverData) {
          setProgress(prev => {
            const merged = mergeProgress(prev, serverData);
            saveProgressLocal(merged);
            return merged;
          });
        }
      } catch (e) { /* silent */ }
    })();

    // Restore active exam
    const prog = getStoredProgress();
    if (prog.activeExam && prog.activeExam.questions && prog.activeExam.questions.length > 0 && !prog.activeExam.finished) {
      setExamState(prog.activeExam);
      setScreen('exam');
    }
  }, []);

  // ====== LANGUAGE CHANGE: reload questions for new format ======
  useEffect(() => {
    const stored = getStoredQuestions();
    if (stored && isNewFormat(stored)) {
      const bils = processNewFormatQuestions(stored, lang);
      setBilets(bils);
      setAllQuestions(bils.flatMap(b => b.questions));
    }
  }, [lang]);

  // ====== FILE UPLOAD ======
  const handleFileUpload = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const rawData = JSON.parse(e.target.result);
          // Support both formats
          const isValid = Array.isArray(rawData) ? rawData.length > 0 : isNewFormat(rawData);
          if (!isValid) {
            reject(new Error('Invalid data format'));
            return;
          }
          storeQuestions(rawData);
          let bils;
          if (isNewFormat(rawData)) {
            bils = processNewFormatQuestions(rawData, lang);
          } else {
            bils = processQuestions(rawData);
          }
          setBilets(bils);
          setAllQuestions(bils.flatMap(b => b.questions));
          setHasData(true);
          const fresh = defaultProgress();
          setProgress(fresh);
          saveProgressLocal(fresh);
          resolve(bils.length);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsText(file);
    });
  }, [lang]);

  const clearData = useCallback(() => {
    clearStoredQuestions();
    setBilets([]);
    setAllQuestions([]);
    setHasData(false);
    const fresh = defaultProgress();
    setProgress(fresh);
    saveProgressLocal(fresh);
    setScreen('home');
  }, []);

  // ====== SAVE PROGRESS ======
  useEffect(() => {
    saveProgressLocal(progress);
    schedulePush(progress);
  }, [progress]);

  // ====== THEME ======
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('dark', 'light');
    if (theme === 'dark') html.classList.add('dark');
    else if (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) html.classList.add('dark');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const cycleTheme = useCallback(() => {
    setThemeState(prev => prev === 'light' ? 'dark' : prev === 'dark' ? 'auto' : 'light');
  }, []);

  // ====== LANGUAGE ======
  const toggleLang = useCallback(() => {
    setLang(prev => { const next = prev === 'uz' ? 'kr' : prev === 'kr' ? 'ru' : 'uz'; localStorage.setItem(LANG_KEY, next); return next; });
  }, []);

  // ====== NAVIGATION ======
  const navigateTo = useCallback((s) => setScreen(s), []);
  const goHome = useCallback(() => {
    setScreen('home');
    setSelectedBilet(null);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    // Imtihonni tozalamaymiz — foydalanuvchi davom ettirishi mumkin
  }, []);

  // ====== BILET EXAM ======
  const startExam = useCallback((biletNumber) => {
    setSelectedBilet(biletNumber); setCurrentQuestionIndex(0); setAnswers([]); setScreen('question');
  }, []);

  const answerQuestion = useCallback((questionId, selectedIndex, isCorrect) => {
    setAnswers(prev => [...prev, { questionId, selectedIndex, correct: isCorrect }]);
    if (selectedBilet !== null) {
      setProgress(prev => {
        const biletKey = String(selectedBilet);
        const newBiletAnswers = { ...prev.biletAnswers };
        if (!newBiletAnswers[biletKey]) newBiletAnswers[biletKey] = {};
        newBiletAnswers[biletKey][String(questionId)] = { selected: selectedIndex, correct: isCorrect };
        return { ...prev, biletAnswers: newBiletAnswers, currentBilet: selectedBilet, currentQuestion: currentQuestionIndex };
      });
    }
  }, [selectedBilet, currentQuestionIndex]);

  const finishExam = useCallback(() => {
    const correctCount = answers.filter(a => a.correct).length;
    const bilet = bilets.find(b => b.number === selectedBilet);
    const totalQuestions = bilet ? bilet.questions.length : 20;
    const passed = correctCount >= 18;
    setProgress(prev => ({
      ...prev,
      biletResults: { ...prev.biletResults, [selectedBilet]: { status: passed ? 'passed' : 'failed', score: correctCount, total: totalQuestions, date: new Date().toISOString() } },
      biletScores: { ...prev.biletScores, [selectedBilet]: { correct: correctCount, wrong: totalQuestions - correctCount, total: totalQuestions } },
    }));
    setScreen('result');
  }, [answers, bilets, selectedBilet]);

  // ====== TIMED EXAM MODE (25 min) ======
  const startTimedExam = useCallback(() => {
    if (allQuestions.length < 20) return;
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 20);
    const exam = { questions: selected, answers: {}, timeRemaining: 25 * 60, startedAt: Date.now(), currentQuestion: 0, finished: false };
    setExamState(exam);
    setProgress(prev => ({ ...prev, activeExam: exam }));
    setScreen('exam');
  }, [allQuestions]);

  const answerExamQuestion = useCallback((qId, selectedIdx, isCorrect) => {
    setExamState(prev => {
      if (!prev || prev.finished) return prev;
      const updated = { ...prev, answers: { ...prev.answers, [qId]: { selected: selectedIdx, correct: isCorrect } } };
      setProgress(p => ({ ...p, activeExam: updated }));
      return updated;
    });
  }, []);

  const finishTimedExam = useCallback((timeUp = false) => {
    if (examTimerRef.current) clearInterval(examTimerRef.current);
    setExamState(prev => {
      if (!prev) return null;
      const total = prev.questions.length;
      const answered = Object.keys(prev.answers).length;
      const correct = Object.values(prev.answers).filter(a => a.correct).length;
      const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
      setProgress(p => ({
        ...p, activeExam: null,
        examHistory: [...(p.examHistory || []), { startedAt: prev.startedAt, finishedAt: Date.now(), correct, wrong: answered - correct, total, pct, timeUp }],
      }));
      return { ...prev, finished: true, finishedAt: Date.now() };
    });
  }, []);

  // Imtihonni pauza qilish (davom ettirish mumkin)
  const pauseExam = useCallback(() => {
    if (examTimerRef.current) clearInterval(examTimerRef.current);
    // examState va activeExam saqlanadi — davom ettirish uchun
    setScreen('home');
  }, []);

  // Imtihonni davom ettirish
  const resumeExam = useCallback(() => {
    if (examState && !examState.finished) {
      setScreen('exam');
    }
  }, [examState]);

  // Imtihonni BUTUNLAY bekor qilish
  const cancelExam = useCallback(() => {
    if (examTimerRef.current) clearInterval(examTimerRef.current);
    // Avval ekranni almashtiramiz, keyin state tozalaymiz
    setScreen('home');
    // Keyingi renderda tozalaymiz
    setTimeout(() => {
      setExamState(null);
      setProgress(prev => ({ ...prev, activeExam: null }));
    }, 100);
  }, []);

  // ====== PRACTICE ======
  const [practiceCards, setPracticeCards] = useState([]);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceKnown, setPracticeKnown] = useState([]);

  const startPractice = useCallback(() => {
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5).slice(0, 30);
    setPracticeCards(shuffled); setPracticeIndex(0); setPracticeKnown([]); setScreen('practice');
  }, [allQuestions]);

  // ====== RESET ======
  const resetProgress = useCallback(() => {
    const fresh = defaultProgress();
    setProgress(fresh); saveProgressLocal(fresh); pushToServer(fresh);
  }, []);

  // ====== HELPERS ======
  const getBiletStatus = useCallback((biletNum) => {
    const result = progress.biletResults?.[biletNum];
    const biletAnswers = progress.biletAnswers?.[String(biletNum)] || {};
    const answeredCount = Object.keys(biletAnswers).length;
    const bilet = bilets.find(b => b.number === biletNum);
    const total = bilet ? bilet.questions.length : 20;
    if (result) return { status: result.status, score: result.score, total: result.total || total, answeredCount };
    if (answeredCount > 0) return { status: 'in_progress', answeredCount, total };
    return { status: 'none', answeredCount: 0, total };
  }, [progress, bilets]);

  const getUnfinishedBilet = useCallback(() => {
    for (const bilet of bilets) { const s = getBiletStatus(bilet.number); if (s.status === 'in_progress') return bilet.number; }
    return null;
  }, [bilets, getBiletStatus]);

  const getOverallStats = useCallback(() => {
    let totalAnswered = 0, totalCorrect = 0;
    // Bilet javoblari
    for (const key of Object.keys(progress.biletAnswers || {})) {
      const ba = progress.biletAnswers[key];
      totalAnswered += Object.keys(ba).length;
      totalCorrect += Object.values(ba).filter(a => a.correct).length;
    }
    // Imtihon tarixi
    for (const exam of (progress.examHistory || [])) {
      totalAnswered += (exam.correct || 0) + (exam.wrong || 0);
      totalCorrect += (exam.correct || 0);
    }
    return {
      totalQuestions: allQuestions.length, totalAnswered, totalCorrect, totalWrong: totalAnswered - totalCorrect,
      passedCount: Object.values(progress.biletResults || {}).filter(r => r.status === 'passed').length,
      failedCount: Object.values(progress.biletResults || {}).filter(r => r.status === 'failed').length,
      examsTaken: (progress.examHistory || []).length,
      examsPassed: (progress.examHistory || []).filter(e => e.pct >= 70).length,
    };
  }, [progress, allQuestions]);

  const value = {
    screen, lang, theme, bilets, allQuestions, selectedBilet,
    currentQuestionIndex, answers, progress, loading, hasData,
    examState, examTimerRef,
    practiceCards, practiceIndex, practiceKnown,
    t, toggleLang, cycleTheme,
    navigateTo, goHome, startExam, answerQuestion, finishExam,
    startTimedExam, answerExamQuestion, finishTimedExam,
    pauseExam, resumeExam, cancelExam,
    startPractice, resetProgress, handleFileUpload, clearData,
    getBiletStatus, getUnfinishedBilet, getOverallStats,
    setCurrentQuestionIndex, setAnswers,
    setPracticeIndex, setPracticeKnown, setExamState,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
