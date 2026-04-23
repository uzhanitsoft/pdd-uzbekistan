import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useApp } from '../context/AppContext';

const labels = ['A', 'B', 'C', 'D'];

export default function ExamScreen() {
  const {
    t, lang, examState, setExamState, examTimerRef,
    answerExamQuestion, finishTimedExam, pauseExam, cancelExam, goHome,
  } = useApp();

  const [showConfirm, setShowConfirm] = useState(false);
  const [zoomedImg, setZoomedImg] = useState(null);
  const autoNextRef = useRef(null);
  const dragX = useMotionValue(0);
  const dragOpacity = useTransform(dragX, [-150, 0, 150], [0.5, 1, 0.5]);

  const exam = examState;
  const qi = exam?.currentQuestion || 0;
  const question = exam?.questions?.[qi] || null;
  const total = exam?.questions?.length || 0;
  const ans = question ? exam?.answers?.[question.id] : null;
  const answeredCount = Object.keys(exam?.answers || {}).length;

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

  useEffect(() => {
    return () => { if (autoNextRef.current) clearTimeout(autoNextRef.current); };
  }, [qi]);

  const goToQ = useCallback((i) => {
    if (autoNextRef.current) clearTimeout(autoNextRef.current);
    setExamState(prev => prev ? { ...prev, currentQuestion: i } : prev);
  }, [setExamState]);

  const handleAnswer = useCallback((index) => {
    if (!question || ans || exam?.finished) return;
    const isCorrect = index === question.correct_index;
    answerExamQuestion(question.id, index, isCorrect);
    if (isCorrect) {
      autoNextRef.current = setTimeout(() => {
        const newAnswered = answeredCount + 1;
        if (newAnswered >= total) finishTimedExam(false);
        else if (qi < total - 1) goToQ(qi + 1);
      }, 1000);
    }
  }, [question, ans, exam?.finished, answeredCount, total, qi, answerExamQuestion, finishTimedExam, goToQ]);

  const handleDragEnd = useCallback((e, info) => {
    const threshold = 80;
    if ((info.offset.x < -threshold || info.velocity.x < -300) && qi < total - 1) goToQ(qi + 1);
    else if ((info.offset.x > threshold || info.velocity.x > 300) && qi > 0) goToQ(qi - 1);
  }, [qi, total, goToQ]);

  if (!exam || !exam.questions || !question) return <div />;

  const questionText = lang === 'ru' ? question.question_ru : lang === 'kr' ? question.question_kr : question.question_uz;
  const options = lang === 'ru' ? question.options_ru : lang === 'kr' ? question.options_kr : question.options_uz;
  const m = Math.floor((exam.timeRemaining || 0) / 60);
  const s = (exam.timeRemaining || 0) % 60;
  const timerClass = (exam.timeRemaining || 0) <= 60 ? 'danger' : (exam.timeRemaining || 0) <= 300 ? 'warning' : '';

  // ====== NATIJA EKRANI ======
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
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="inline-block mb-4">
            <div className="stat-ring">
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r={ringR} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="7" />
                <motion.circle cx="70" cy="70" r={ringR} fill="none" stroke="white" strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={ringC} initial={{ strokeDashoffset: ringC }} animate={{ strokeDashoffset: ringOffset }}
                  transition={{ duration: 1.5, delay: 0.5 }} transform="rotate(-90 70 70)" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-white">{correct}</span>
                <span className="text-xs text-white/70">{t('dan')} {total}</span>
              </div>
            </div>
          </motion.div>
          <h2 className="text-white text-2xl font-extrabold mb-1">{passed ? t('otdi') + ' ✓' : t('otmadi') + ' ✗'}</h2>
          <p className="text-white/70 text-sm">{pct}%</p>
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
          <button onClick={goHome} className="nav-btn-primary" id="exam-home">{t('boshSahifa')}</button>
        </div>
      </motion.div>
    );
  }

  // ====== IMTIHON JARAYONI ======
  return (
    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <div className="px-4 pt-4 pb-2 safe-area-top" style={{ background: 'var(--card)', borderBottom: '1px solid var(--card-border)' }}>
        <div className="flex items-center justify-between mb-2">
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => setShowConfirm(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full"
            style={{ background: 'var(--red-bg)' }} id="exam-back">
            <svg className="w-5 h-5" style={{ color: 'var(--red)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
          <div className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>{qi + 1}/{total}</div>
          <div className={`timer-pill ${timerClass}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {m}:{s.toString().padStart(2, '0')}
          </div>
        </div>

        <div className="progress-track" style={{ height: '3px' }}>
          <motion.div className="progress-fill" animate={{ width: `${((qi + 1) / total) * 100}%` }} transition={{ duration: 0.3 }} />
        </div>

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

      {/* Question */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={qi}
            initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.2 }}
            drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.15}
            onDragEnd={handleDragEnd}
            style={{ opacity: dragOpacity }}
            className="h-full overflow-y-auto custom-scrollbar px-4 py-3 touch-pan-y">

            {question.image && (
              <div className="mb-3 rounded-2xl overflow-hidden relative cursor-pointer"
                style={{ boxShadow: 'var(--shadow-sm)', maxHeight: '160px' }}
                onClick={() => setZoomedImg(question.image)}>
                <img src={question.image} alt="" className="w-full h-full object-cover" loading="eager" draggable={false} />
                <div className="absolute bottom-1.5 right-1.5 bg-black/50 rounded-lg px-2 py-1">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            )}

            <p className="font-bold mb-3" style={{ color: 'var(--text-1)', fontSize: '16px', lineHeight: 1.5 }}>{questionText}</p>

            <div className="space-y-2.5">
              {(options || []).map((option, index) => {
                let className = 'answer-option';
                if (ans) {
                  className += ' answered';
                  if (index === question.correct_index) {
                    if (ans.selected === index) className += ' correct-answer';
                    else className += ' show-correct';
                  } else if (index === ans.selected && !ans.correct) {
                    className += ' wrong-answer';
                  } else { className += ' dimmed'; }
                }
                return (
                  <motion.button key={index} whileTap={!ans ? { scale: 0.98 } : {}}
                    onClick={() => handleAnswer(index)} disabled={!!ans} className={className}>
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
            <div style={{ height: '16px' }} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Nav — Oldingi CHAP | Keyingi O'NG */}
      <div className="px-4 py-3 safe-area-bottom" style={{ background: 'var(--card)', borderTop: '1px solid var(--card-border)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => qi > 0 && goToQ(qi - 1)} disabled={qi === 0}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--bg)', border: '1px solid var(--card-border)', color: qi > 0 ? 'var(--text-1)' : 'var(--text-3)', opacity: qi > 0 ? 1 : 0.4 }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            {t('oldingi')}
          </button>
          <div className="text-sm font-bold px-2" style={{ color: 'var(--text-2)' }}>{answeredCount}/{total}</div>
          {qi < total - 1 ? (
            <button onClick={() => goToQ(qi + 1)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
              style={{ background: 'var(--primary)', color: '#fff' }}>
              {t('keyingi')}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          ) : (
            <button onClick={() => finishTimedExam(false)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
              style={{ background: 'var(--green)', color: '#fff' }}>
              {t('yakunlash')} ✓
            </button>
          )}
        </div>
      </div>

      {/* Exit Modal */}
      {showConfirm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="modal-backdrop">
          <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} className="modal-card">
            <div className="text-4xl mb-3">⏸️</div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-1)' }}>{t('imtihonBekor')}</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-2)' }}>{t('imtihonBekorConfirm')}</p>
            <div className="flex flex-col gap-2.5">
              <button onClick={() => setShowConfirm(false)} className="w-full py-3 rounded-2xl text-sm font-bold"
                style={{ background: 'var(--primary)', color: '#fff' }}>{t('davomEttirish')}</button>
              <button onClick={() => { setShowConfirm(false); pauseExam(); }}
                className="w-full py-3 rounded-2xl text-sm font-medium"
                style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary-glow)' }}>
                ⏸ {t('keyinrogDavom')}
              </button>
              <button onClick={() => { setShowConfirm(false); cancelExam(); }}
                className="w-full py-3 rounded-2xl text-sm font-medium"
                style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-border)' }}>
                ✕ {t('imtihonBekor')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {zoomedImg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.85)' }} onClick={() => setZoomedImg(null)}>
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
