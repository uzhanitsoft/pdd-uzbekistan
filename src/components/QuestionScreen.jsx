import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useApp } from '../context/AppContext';

const labels = ['A', 'B', 'C', 'D'];

export default function QuestionScreen() {
  const {
    t, lang, bilets, selectedBilet, currentQuestionIndex,
    answers, answerQuestion, finishExam, goHome,
    setCurrentQuestionIndex
  } = useApp();

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const autoNextRef = useRef(null);
  const dragX = useMotionValue(0);
  const dragOpacity = useTransform(dragX, [-150, 0, 150], [0.5, 1, 0.5]);

  const bilet = bilets.find(b => b.number === selectedBilet);
  const questions = bilet ? bilet.questions : [];
  const question = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentQuestionIndex >= totalQuestions - 1;
  const alreadyAnswered = selectedAnswer !== null;

  useEffect(() => {
    setSelectedAnswer(null);
    if (autoNextRef.current) clearTimeout(autoNextRef.current);
    return () => { if (autoNextRef.current) clearTimeout(autoNextRef.current); };
  }, [currentQuestionIndex]);

  const handleAnswer = useCallback((index) => {
    if (alreadyAnswered) return;
    setSelectedAnswer(index);
    const isCorrect = index === question.correct_index;
    answerQuestion(question.id, index, isCorrect);

    const delay = isCorrect ? 1000 : 1500;
    autoNextRef.current = setTimeout(() => {
      if (!isLastQuestion) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        finishExam();
      }
    }, delay);
  }, [alreadyAnswered, question, answerQuestion, isLastQuestion, finishExam, setCurrentQuestionIndex]);

  const handleDragEnd = useCallback((e, info) => {
    const threshold = 80;
    if ((info.offset.x < -threshold || info.velocity.x < -300) && !isLastQuestion && alreadyAnswered) {
      if (autoNextRef.current) clearTimeout(autoNextRef.current);
      setCurrentQuestionIndex(prev => prev + 1);
    } else if ((info.offset.x > threshold || info.velocity.x > 300) && currentQuestionIndex > 0) {
      if (autoNextRef.current) clearTimeout(autoNextRef.current);
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [isLastQuestion, currentQuestionIndex, alreadyAnswered, setCurrentQuestionIndex]);

  if (!question) return null;

  const progressPercent = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const questionText = lang === 'ru' ? question.question_ru : lang === 'kr' ? question.question_kr : question.question_uz;
  const options = lang === 'ru' ? question.options_ru : lang === 'kr' ? question.options_kr : question.options_uz;

  const slideVariants = {
    enter: { x: 300, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 },
  };

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

          <div className="w-9" />
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

      {/* ====== QUESTION (swipeable) ====== */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={currentQuestionIndex}
            variants={slideVariants}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.15}
            onDragEnd={handleDragEnd}
            style={{ opacity: dragOpacity }}
            className="h-full overflow-y-auto custom-scrollbar px-4 py-4 touch-pan-y">

            {question.image && (
              <div className="mb-4 rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-md)' }}>
                <img src={question.image} alt="" className="w-full h-auto object-cover" loading="eager" draggable={false} />
              </div>
            )}

            <p className="text-base font-bold leading-relaxed mb-5" style={{ color: 'var(--text-1)', lineHeight: 1.55 }}>
              {questionText}
            </p>

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
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
