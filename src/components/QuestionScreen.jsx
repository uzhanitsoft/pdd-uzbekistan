import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';

const labels = ['A', 'B', 'C', 'D'];

export default function QuestionScreen() {
  const {
    t, lang, bilets, selectedBilet, currentQuestionIndex,
    answers, answerQuestion, finishExam, goHome,
    setCurrentQuestionIndex
  } = useApp();

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [timerActive, setTimerActive] = useState(true);
  const timerRef = useRef(null);

  const bilet = bilets.find(b => b.number === selectedBilet);
  const questions = bilet ? bilet.questions : [];
  const question = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentQuestionIndex >= totalQuestions - 1;
  const alreadyAnswered = selectedAnswer !== null;

  useEffect(() => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    setTimeLeft(20);
    setTimerActive(true);
  }, [currentQuestionIndex]);

  useEffect(() => {
    if (!timerActive || !question) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setTimerActive(false);
          setSelectedAnswer(-1);
          setShowExplanation(true);
          answerQuestion(question.id, -1, false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timerActive, question, answerQuestion]);

  const handleAnswer = useCallback((index) => {
    if (alreadyAnswered) return;
    clearInterval(timerRef.current);
    setTimerActive(false);
    setSelectedAnswer(index);
    const isCorrect = index === question.correct_index;
    answerQuestion(question.id, index, isCorrect);
    setShowExplanation(true);
  }, [alreadyAnswered, question, answerQuestion]);

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      finishExam();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [isLastQuestion, finishExam, setCurrentQuestionIndex]);

  if (!question) return null;

  const progressPercent = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const questionText = lang === 'ru' ? question.question_ru : lang === 'kr' ? question.question_kr : question.question_uz;
  const options = lang === 'ru' ? question.options_ru : lang === 'kr' ? question.options_kr : question.options_uz;
  const explanationText = lang === 'ru' ? question.explanation_ru : lang === 'kr' ? question.explanation_kr : question.explanation_uz;

  const timerClass = timeLeft <= 5 ? 'danger' : timeLeft <= 10 ? 'warning' : '';

  return (
    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* ====== HEADER ====== */}
      <div className="px-4 pt-4 pb-3 safe-area-top" style={{ background: 'var(--card)', borderBottom: '1px solid var(--card-border)' }}>
        <div className="flex items-center justify-between mb-3">
          <motion.button whileTap={{ scale: 0.85 }} onClick={goHome}
            className="w-9 h-9 flex items-center justify-center rounded-full"
            style={{ background: 'var(--primary-light)' }} id="btn-back-question">
            <svg className="w-5 h-5" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </motion.button>

          <div className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>
            {t('bilet')} {selectedBilet} — {currentQuestionIndex + 1}/{totalQuestions}
          </div>

          <div className={`timer-pill ${timerClass}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {timeLeft}
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-track">
          <motion.div className="progress-fill" initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.3 }} />
        </div>

        {/* Question dots */}
        <div className="q-dots-row mt-2">
          {questions.map((q, i) => {
            let cls = 'q-dot';
            if (i === currentQuestionIndex) cls += ' active';
            else if (i < answers.length) cls += answers[i]?.correct ? ' correct' : ' wrong';
            return <button key={q.id} className={cls} onClick={() => i <= answers.length && setCurrentQuestionIndex(i)}>{i + 1}</button>;
          })}
        </div>
      </div>

      {/* ====== QUESTION CONTENT ====== */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4">
        <AnimatePresence mode="wait">
          <motion.div key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}>

            {/* Image */}
            {question.image && (
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                className="mb-4 rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-md)' }}>
                <img src={question.image} alt="" className="w-full h-auto object-cover" loading="eager" />
              </motion.div>
            )}

            {/* Question text */}
            <p className="text-base font-bold leading-relaxed mb-5" style={{ color: 'var(--text-1)', lineHeight: 1.55 }}>
              {questionText}
            </p>

            {/* ====== ANSWER OPTIONS ====== */}
            <div className="space-y-2.5">
              {options.map((option, index) => {
                let className = 'answer-option';
                if (alreadyAnswered) {
                  className += ' answered';
                  if (index === question.correct_index) {
                    if (selectedAnswer === index) className += ' correct-answer';
                    else className += ' show-correct';
                  } else if (index === selectedAnswer && selectedAnswer !== question.correct_index) {
                    className += ' wrong-answer';
                  } else {
                    className += ' dimmed';
                  }
                }

                return (
                  <motion.button key={index}
                    whileTap={!alreadyAnswered ? { scale: 0.98 } : {}}
                    onClick={() => handleAnswer(index)}
                    disabled={alreadyAnswered}
                    className={className}
                    id={`option-${index}`}>
                    <div className="letter">{labels[index]}</div>
                    <span className="flex-1 text-sm font-medium" style={{ lineHeight: 1.45 }}>{option}</span>
                    {/* Icons */}
                    {alreadyAnswered && index === question.correct_index && (
                      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {alreadyAnswered && index === selectedAnswer && selectedAnswer !== question.correct_index && (
                      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Timeout */}
            {selectedAnswer === -1 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-xl text-center text-sm font-bold"
                style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', color: 'var(--red)' }}>
                ⏱ {t('vaqtTugadi')}
              </motion.div>
            )}

            {/* Explanation */}
            {showExplanation && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="mt-4 p-4 rounded-xl" style={{ background: 'var(--primary-light)', border: '1px solid var(--primary-glow)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>{t('tushuntirish')}</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-1)' }}>{explanationText}</p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ====== BOTTOM NAV ====== */}
      {showExplanation && (
        <motion.div initial={{ y: 80 }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="px-4 py-4 safe-area-bottom" style={{ background: 'var(--card)', borderTop: '1px solid var(--card-border)' }}>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleNext}
            className="nav-btn-primary w-full" id="btn-next">
            {isLastQuestion ? t('yakunlash') : t('keyingi')}
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}
