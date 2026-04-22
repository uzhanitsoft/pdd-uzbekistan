import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';

const labels = ['A', 'B', 'C', 'D'];

export default function QuestionScreen() {
  const {
    t, lang, bilets, selectedBilet, currentQuestionIndex,
    answers, answerQuestion, nextQuestion, finishExam, goHome,
    setCurrentQuestionIndex
  } = useApp();

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [timerActive, setTimerActive] = useState(true);
  const [shakeWrong, setShakeWrong] = useState(false);
  const [pulseCorrect, setPulseCorrect] = useState(false);
  const timerRef = useRef(null);

  const bilet = bilets.find(b => b.number === selectedBilet);
  const questions = bilet ? bilet.questions : [];
  const question = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentQuestionIndex >= totalQuestions - 1;
  const alreadyAnswered = selectedAnswer !== null;

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    setTimeLeft(20);
    setTimerActive(true);
    setShakeWrong(false);
    setPulseCorrect(false);
  }, [currentQuestionIndex]);

  // Timer countdown
  useEffect(() => {
    if (!timerActive || !question) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up - auto wrong answer
          clearInterval(timerRef.current);
          setTimerActive(false);
          setSelectedAnswer(-1); // -1 means timeout
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

    if (isCorrect) {
      setPulseCorrect(true);
    } else {
      setShakeWrong(true);
      setTimeout(() => setShakeWrong(false), 400);
    }

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

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-full bg-bg flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-3 shadow-sm safe-area-top">
        <div className="flex items-center justify-between mb-3">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={goHome}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50"
            id="btn-back-question"
          >
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </motion.button>

          <div className="text-sm font-bold text-text-primary">
            {t('bilet')} {selectedBilet} — {currentQuestionIndex + 1} / {totalQuestions}
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${
            timeLeft <= 5 
              ? 'bg-wrong/10 text-wrong animate-timer-pulse' 
              : 'bg-gray-50 text-text-primary'
          }`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {timeLeft}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full progress-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            {/* Image */}
            {question.image && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4 rounded-2xl overflow-hidden shadow-card"
              >
                <img
                  src={question.image}
                  alt="Yo'l vaziyati"
                  className="w-full h-auto object-cover"
                  loading="eager"
                />
              </motion.div>
            )}

            {/* Question text */}
            <p className="text-[17px] font-bold text-text-primary leading-relaxed mb-5">
              {questionText}
            </p>

            {/* Answer options */}
            <div className="space-y-2.5">
              {options.map((option, index) => {
                let optionStyle = 'bg-white border-transparent shadow-option';
                let labelBg = 'bg-primary/10 text-primary';
                let icon = null;
                let animClass = '';

                if (alreadyAnswered) {
                  if (index === question.correct_index) {
                    optionStyle = 'bg-correct/10 border-correct shadow-none';
                    labelBg = 'bg-correct text-white';
                    icon = (
                      <motion.svg
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 text-correct"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </motion.svg>
                    );
                    if (pulseCorrect && index === selectedAnswer) {
                      animClass = 'animate-correct-pulse';
                    }
                  } else if (index === selectedAnswer && selectedAnswer !== question.correct_index) {
                    optionStyle = 'bg-wrong/10 border-wrong shadow-none';
                    labelBg = 'bg-wrong text-white';
                    icon = (
                      <motion.svg
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 text-wrong"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </motion.svg>
                    );
                    animClass = shakeWrong ? 'animate-shake' : '';
                  } else {
                    optionStyle = 'bg-gray-50 border-transparent opacity-50';
                  }
                }

                return (
                  <motion.button
                    key={index}
                    whileTap={!alreadyAnswered ? { scale: 0.98 } : {}}
                    onClick={() => handleAnswer(index)}
                    disabled={alreadyAnswered}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-btn border-2 transition-all duration-200 text-left ${optionStyle} ${animClass}`}
                    id={`option-${index}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${labelBg}`}>
                      {labels[index]}
                    </div>
                    <span className="text-sm font-medium text-text-primary flex-1 leading-snug">
                      {option}
                    </span>
                    {icon && <div className="flex-shrink-0">{icon}</div>}
                  </motion.button>
                );
              })}
            </div>

            {/* Timeout indicator */}
            {selectedAnswer === -1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-wrong/10 rounded-btn border border-wrong/20 text-wrong text-sm font-medium text-center"
              >
                ⏱ {t('vaqtTugadi')}
              </motion.div>
            )}

            {/* Explanation */}
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4 p-4 bg-blue-50 rounded-btn border border-primary/10"
              >
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-bold text-primary">{t('tushuntirish')}</span>
                </div>
                <p className="text-sm text-text-primary leading-relaxed">
                  {explanationText}
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      {showExplanation && (
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="px-4 py-4 bg-white border-t border-gray-100 safe-area-bottom"
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleNext}
            className="w-full py-3.5 bg-primary text-white font-bold text-base rounded-btn shadow-btn active:bg-primary-dark transition-colors"
            id="btn-next"
          >
            {isLastQuestion ? t('yakunlash') : t('keyingi')}
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}
