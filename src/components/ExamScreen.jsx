import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';

const labels = ['A', 'B', 'C', 'D'];

export default function ExamScreen() {
  const {
    t, lang, examState, setExamState, examTimerRef,
    answerExamQuestion, finishTimedExam, cancelExam, goHome,
  } = useApp();

  const [showConfirm, setShowConfirm] = useState(false);
  const exam = examState;

  // Timer
  useEffect(() => {
    if (!exam || exam.finished) return;
    examTimerRef.current = setInterval(() => {
      setExamState(prev => {
        if (!prev || prev.finished) { clearInterval(examTimerRef.current); return prev; }
        const newTime = (prev.timeRemaining || 0) - 1;
        if (newTime <= 0) { clearInterval(examTimerRef.current); finishTimedExam(true); return { ...prev, timeRemaining: 0 }; }
        return { ...prev, timeRemaining: newTime };
      });
    }, 1000);
    return () => clearInterval(examTimerRef.current);
  }, [exam?.finished]);

  if (!exam || !exam.questions) return null;

  const qi = exam.currentQuestion || 0;
  const question = exam.questions[qi];
  const total = exam.questions.length;
  const ans = exam.answers?.[question?.id];
  const answeredCount = Object.keys(exam.answers || {}).length;

  if (!question) return null;

  const questionText = lang === 'ru' ? question.question_ru : lang === 'kr' ? question.question_kr : question.question_uz;
  const options = lang === 'ru' ? question.options_ru : lang === 'kr' ? question.options_kr : question.options_uz;
  const m = Math.floor((exam.timeRemaining || 0) / 60);
  const s = (exam.timeRemaining || 0) % 60;
  const timerClass = (exam.timeRemaining || 0) <= 60 ? 'danger' : (exam.timeRemaining || 0) <= 300 ? 'warning' : '';

  const goToQ = (i) => setExamState(prev => ({ ...prev, currentQuestion: i }));

  const handleAnswer = (index) => {
    if (ans || exam.finished) return;
    answerExamQuestion(question.id, index, index === question.correct_index);
  };

  // ====== RESULT SCREEN ======
  if (exam.finished) {
    const correct = Object.values(exam.answers || {}).filter(a => a.correct).length;
    const wrong = answeredCount - correct;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = pct >= 70;
    const ringR = 60; const ringC = 2 * Math.PI * ringR;
    const ringOffset = ringC - (correct / total) * ringC;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
        <div className="pt-12 pb-8 px-5 text-center"
          style={{ background: passed ? 'linear-gradient(135deg, #059669, #10B981, #34D399)' : 'linear-gradient(135deg, #DC2626, #EF4444, #F87171)' }}>
          {/* Score ring */}
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="inline-block mb-4">
            <div className="stat-ring">
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r={ringR} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="7" />
                <motion.circle cx="70" cy="70" r={ringR} fill="none" stroke="white" strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={ringC} initial={{ strokeDashoffset: ringC }} animate={{ strokeDashoffset: ringOffset }}
                  transition={{ duration: 1.5, delay: 0.5, ease: [0.4,0,0.2,1] }} transform="rotate(-90 70 70)" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-white">{correct}</span>
                <span className="text-xs text-white/70">{t('dan')} {total}</span>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            <h2 className="text-white text-2xl font-extrabold mb-1">{passed ? t('otdi') + ' ✓' : t('otmadi') + ' ✗'}</h2>
            <p className="text-white/70 text-sm">{pct}% — {answeredCount}/{total} {t('savollarYechildi')}</p>
          </motion.div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 -mt-3">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-extrabold" style={{ color: 'var(--green)' }}>{correct}</div>
              <div className="text-xs" style={{ color: 'var(--text-2)' }}>{t('togriJavoblar')}</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-extrabold" style={{ color: 'var(--red)' }}>{wrong}</div>
              <div className="text-xs" style={{ color: 'var(--text-2)' }}>{t('xatolar')}</div>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 safe-area-bottom" style={{ background: 'var(--card)', borderTop: '1px solid var(--card-border)' }}>
          <div className="flex gap-3">
            <button onClick={() => goToQ(0)} className="nav-btn-primary" id="exam-review">{t('xatolarniKorish')}</button>
            <button onClick={goHome} className="nav-btn-secondary" id="exam-home">{t('boshSahifa')}</button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ====== EXAM IN PROGRESS ======
  return (
    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* ====== HEADER ====== */}
      <div className="px-4 pt-4 pb-3 safe-area-top" style={{ background: 'var(--card)', borderBottom: '1px solid var(--card-border)' }}>
        <div className="flex items-center justify-between mb-3">
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => setShowConfirm(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full"
            style={{ background: 'var(--red-bg)' }} id="exam-back">
            <svg className="w-5 h-5" style={{ color: 'var(--red)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>

          <div className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>
            {t('imtihon')} — {qi + 1}/{total}
          </div>

          {/* BIG TIMER */}
          <div className={`timer-pill ${timerClass}`} style={{ fontSize: '16px', padding: '8px 16px' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {m}:{s.toString().padStart(2, '0')}
          </div>
        </div>

        {/* Progress */}
        <div className="progress-track">
          <motion.div className="progress-fill" animate={{ width: `${((qi + 1) / total) * 100}%` }} transition={{ duration: 0.3 }} />
        </div>

        {/* Question dots */}
        <div className="q-dots-row mt-2">
          {exam.questions.map((q, i) => {
            const a = exam.answers?.[q.id];
            let cls = 'q-dot';
            if (i === qi) cls += ' active';
            else if (a?.correct) cls += ' correct';
            else if (a && !a.correct) cls += ' wrong';
            return <button key={q.id} className={cls} onClick={() => goToQ(i)}>{i + 1}</button>;
          })}
        </div>
      </div>

      {/* ====== QUESTION ====== */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4">
        <AnimatePresence mode="wait">
          <motion.div key={qi} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
            {question.image && (
              <div className="mb-4 rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-md)' }}>
                <img src={question.image} alt="" className="w-full h-auto object-cover" loading="eager" />
              </div>
            )}
            <p className="text-base font-bold leading-relaxed mb-5" style={{ color: 'var(--text-1)', lineHeight: 1.55 }}>{questionText}</p>
            <div className="space-y-2.5">
              {options.map((option, index) => {
                let className = 'answer-option';
                if (ans) {
                  className += ' answered';
                  if (index === question.correct_index) {
                    if (ans.selected === index) className += ' correct-answer';
                    else className += ' show-correct';
                  } else if (index === ans.selected && !ans.correct) {
                    className += ' wrong-answer';
                  } else {
                    className += ' dimmed';
                  }
                }
                return (
                  <motion.button key={index} whileTap={!ans ? { scale: 0.98 } : {}}
                    onClick={() => handleAnswer(index)} disabled={!!ans}
                    className={className}>
                    <div className="letter">{labels[index]}</div>
                    <span className="flex-1 text-sm font-medium" style={{ lineHeight: 1.45 }}>{option}</span>
                    {ans && index === question.correct_index && (
                      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    )}
                    {ans && index === ans.selected && !ans.correct && (
                      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ====== BOTTOM NAV ====== */}
      <div className="px-4 py-4 safe-area-bottom" style={{ background: 'var(--card)', borderTop: '1px solid var(--card-border)' }}>
        <div className="flex gap-3">
          <button onClick={() => qi > 0 && goToQ(qi - 1)} disabled={qi === 0} className="nav-btn-secondary">{t('oldingi')}</button>
          {answeredCount >= total ? (
            <button onClick={() => finishTimedExam(false)} className="nav-btn-primary" style={{ background: 'var(--green)' }}>🏁 {t('yakunlash')}</button>
          ) : (
            <button onClick={() => qi < total - 1 && goToQ(qi + 1)} disabled={qi >= total - 1} className="nav-btn-primary">{t('keyingi')}</button>
          )}
        </div>
      </div>

      {/* ====== CANCEL MODAL ====== */}
      {showConfirm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="modal-backdrop">
          <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} className="modal-card">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-1)' }}>{t('imtihonBekor')}</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-2)' }}>{t('imtihonBekorConfirm')}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="nav-btn-secondary">{t('yoq')}</button>
              <button onClick={() => { setShowConfirm(false); cancelExam(); }} className="nav-btn-primary" style={{ background: 'var(--red)' }}>{t('ha')}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
