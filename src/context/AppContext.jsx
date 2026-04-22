import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loadQuestions } from '../data/questions';
import { translations } from '../data/translations';

const AppContext = createContext();

const STORAGE_KEY = 'pdd_uzbekistan_progress';

function getStoredProgress() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to read progress:', e);
  }
  return {
    biletResults: {}, // { [biletNumber]: { status: 'passed'|'failed', score: number, date: string } }
    totalCorrect: 0,
    totalAnswered: 0,
  };
}

function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
}

export function AppProvider({ children }) {
  const [screen, setScreen] = useState('home'); // 'home' | 'tickets' | 'question' | 'result' | 'practice'
  const [lang, setLang] = useState('uz');
  const [bilets, setBilets] = useState([]);
  const [selectedBilet, setSelectedBilet] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]); // array of { questionId, selectedIndex, correct }
  const [progress, setProgress] = useState(getStoredProgress);
  const [loading, setLoading] = useState(true);
  const [practiceCards, setPracticeCards] = useState([]);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceKnown, setPracticeKnown] = useState([]);

  const t = useCallback((key) => {
    return translations[lang]?.[key] || key;
  }, [lang]);

  useEffect(() => {
    loadQuestions().then(data => {
      setBilets(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const toggleLang = useCallback(() => {
    setLang(prev => prev === 'uz' ? 'ru' : 'uz');
  }, []);

  const navigateTo = useCallback((newScreen) => {
    setScreen(newScreen);
  }, []);

  const startExam = useCallback((biletNumber) => {
    setSelectedBilet(biletNumber);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setScreen('question');
  }, []);

  const answerQuestion = useCallback((questionId, selectedIndex, isCorrect) => {
    setAnswers(prev => [...prev, { questionId, selectedIndex, correct: isCorrect }]);
  }, []);

  const nextQuestion = useCallback(() => {
    const bilet = bilets.find(b => b.number === selectedBilet);
    if (!bilet) return;
    
    if (currentQuestionIndex < bilet.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Calculate result
      const correctCount = answers.filter(a => a.correct).length + 
        (answers.length <= currentQuestionIndex ? 0 : 0); // already counted
      finishExam();
    }
  }, [currentQuestionIndex, bilets, selectedBilet, answers]);

  const finishExam = useCallback(() => {
    const correctCount = answers.filter(a => a.correct).length;
    const bilet = bilets.find(b => b.number === selectedBilet);
    const totalQuestions = bilet ? bilet.questions.length : 20;
    const passed = correctCount >= 18;

    setProgress(prev => {
      const newProgress = {
        ...prev,
        biletResults: {
          ...prev.biletResults,
          [selectedBilet]: {
            status: passed ? 'passed' : 'failed',
            score: correctCount,
            total: totalQuestions,
            date: new Date().toISOString(),
          }
        },
        totalCorrect: prev.totalCorrect + correctCount,
        totalAnswered: prev.totalAnswered + totalQuestions,
      };
      return newProgress;
    });

    setScreen('result');
  }, [answers, bilets, selectedBilet]);

  const startPractice = useCallback(() => {
    const allQuestions = bilets.flatMap(b => b.questions);
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5).slice(0, 30);
    setPracticeCards(shuffled);
    setPracticeIndex(0);
    setPracticeKnown([]);
    setScreen('practice');
  }, [bilets]);

  const goHome = useCallback(() => {
    setScreen('home');
    setSelectedBilet(null);
    setCurrentQuestionIndex(0);
    setAnswers([]);
  }, []);

  const value = {
    screen,
    lang,
    bilets,
    selectedBilet,
    currentQuestionIndex,
    answers,
    progress,
    loading,
    practiceCards,
    practiceIndex,
    practiceKnown,
    t,
    toggleLang,
    navigateTo,
    startExam,
    answerQuestion,
    nextQuestion,
    finishExam,
    startPractice,
    goHome,
    setCurrentQuestionIndex,
    setPracticeIndex,
    setPracticeKnown,
    setAnswers,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
