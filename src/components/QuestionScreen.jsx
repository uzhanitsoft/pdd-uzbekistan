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
  const [zoomedImg, setZoomedImg] = useState(null);
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
    if (isCorrect) {
      autoNextRef.current = setTimeout(() => {
        if (!isLastQuestion) setCurrentQuestionIndex(prev => prev + 1);
        else finishExam();
      }, 1000);
    }
  }, [alreadyAnswered, question, answerQuestion, isLastQuestion, finishExam, setCurrentQuestionIndex]);

  const handleDragEnd = useCallback((e, info) => {
    const threshold = 80;
    if ((info.offset.x < -threshold || info.velocity.x < -300) && !isLastQuestion) {
      if (autoNextRef.current) clearTimeout(autoNextRef.current);
      setCurrentQuestionIndex(prev => prev + 1);
    } else if ((info.offset.x > threshold || info.velocity.x > 300) && currentQuestionIndex > 0) {
      if (autoNextRef.current) clearTimeout(autoNextRef.current);
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [isLastQuestion, currentQuestionIndex, setCurrentQuestionIndex]);

  if (!question) return null;

  const progressPercent = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const questionText = lang === 'ru' ? question.question_ru : lang === 'kr' ? question.question_kr : question.question_uz;
  const options = lang === 'ru' ? question.options_ru : lang === 'kr' ? question.options_kr : question.options_uz;

  return (
    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* ====== HEADER ====== */}
      <div className="px-4 pt-4 pb-2 safe-area-top" style={{ background: 'var(--card)', borderBottom: '1px solid var(--card-border)' }}>
        <div className="flex items-center justify-between mb-2">
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
        <div className="progress-track" style={{ height: '3px' }}>
          <motion.div className="progress-fill" initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.3 }} />
        </div>

        {/* Question dots — bigger, spaced */}
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
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={currentQuestionIndex}
            initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.2 }}
            drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.15}
            onDragEnd={handleDragEnd}
            style={{ opacity: dragOpacity }}
            className="h-full overflow-y-auto custom-scrollbar px-4 py-3 touch-pan-y">

            {/* Image — tap to zoom */}
            {question.image && (
              <div className="mb-3 rounded-2xl overflow-hidden relative cursor-pointer"
                style={{ boxShadow: 'var(--shadow-sm)', maxHeight: '160px' }}
                onClick={() => setZoomedImg(question.image)}>
                <img src={question.image} alt="" className="w-full h-full object-cover" loading="eager" draggable={false} />
                <div className="absolute bottom-1.5 right-1.5 bg-black/50 rounded-lg px-2 py-1 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            )}

            {/* Question text */}
            <p className="font-bold mb-3" style={{ color: 'var(--text-1)', fontSize: '16px', lineHeight: 1.5 }}>
              {questionText}
            </p>

            {/* Answer options */}
            <div className="space-y-2.5">
              {(options || []).map((option, index) => {
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
                      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    )}
                    {alreadyAnswered && index === selectedAnswer && selectedAnswer !== question.correct_index && (
                      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Spacer for bottom nav */}
            <div style={{ height: '16px' }} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ====== BOTTOM NAV — Oldingi CHAP | Keyingi O'NG ====== */}
      <div className="px-4 py-3 safe-area-bottom" style={{ background: 'var(--card)', borderTop: '1px solid var(--card-border)' }}>
        <div className="flex items-center gap-3">
          {/* OLDINGI — chap tomonda */}
          <button onClick={() => { if (currentQuestionIndex > 0) { if (autoNextRef.current) clearTimeout(autoNextRef.current); setCurrentQuestionIndex(prev => prev - 1); } }}
            disabled={currentQuestionIndex === 0}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-opacity"
            style={{ background: 'var(--bg)', border: '1px solid var(--card-border)', color: currentQuestionIndex > 0 ? 'var(--text-1)' : 'var(--text-3)', opacity: currentQuestionIndex > 0 ? 1 : 0.4 }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            {t('oldingi')}
          </button>

          {/* Hisoblagich */}
          <div className="text-sm font-bold px-2" style={{ color: 'var(--text-2)' }}>
            {answers.length}/{totalQuestions}
          </div>

          {/* KEYINGI — o'ng tomonda */}
          {!isLastQuestion ? (
            <button onClick={() => { if (autoNextRef.current) clearTimeout(autoNextRef.current); setCurrentQuestionIndex(prev => prev + 1); }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
              style={{ background: 'var(--primary)', color: '#fff' }}>
              {t('keyingi')}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          ) : (
            <button onClick={finishExam}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
              style={{ background: 'var(--green)', color: '#fff' }}>
              {t('yakunlash')} ✓
            </button>
          )}
        </div>
      </div>

      {/* ====== IMAGE ZOOM MODAL ====== */}
      <AnimatePresence>
        {zoomedImg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.85)' }}
            onClick={() => setZoomedImg(null)}>
            <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center z-10"
              onClick={() => setZoomedImg(null)}>
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <motion.img src={zoomedImg}
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="max-w-[95vw] max-h-[85vh] object-contain rounded-2xl"
              draggable={false} onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
