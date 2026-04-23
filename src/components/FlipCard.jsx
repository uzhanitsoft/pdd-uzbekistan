import { useState, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useApp } from '../context/AppContext';

export default function FlipCard() {
  const {
    t, lang, practiceCards, practiceIndex, practiceKnown,
    setPracticeIndex, setPracticeKnown, goHome
  } = useApp();

  const [isFlipped, setIsFlipped] = useState(false);
  const [exitDirection, setExitDirection] = useState(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 0.8, 1, 0.8, 0.5]);

  const card = practiceCards[practiceIndex];
  const isFinished = practiceIndex >= practiceCards.length;
  const knownCount = practiceKnown.filter(Boolean).length;

  const handleFlip = useCallback(() => setIsFlipped(prev => !prev), []);

  const handleAction = useCallback((known) => {
    setExitDirection(known ? 1 : -1);
    setPracticeKnown(prev => [...prev, known]);
    setTimeout(() => {
      setIsFlipped(false);
      setExitDirection(0);
      setPracticeIndex(prev => prev + 1);
    }, 300);
  }, [setPracticeKnown, setPracticeIndex]);

  const handleDragEnd = useCallback((e, info) => {
    if (info.offset.x > 100) handleAction(true);
    else if (info.offset.x < -100) handleAction(false);
  }, [handleAction]);

  if (isFinished) {
    const total = practiceCards.length;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="h-full flex flex-col items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="glass-card p-8 text-center w-full max-w-sm">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--primary-light)' }}>
            <svg className="w-8 h-8" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-extrabold mb-2" style={{ color: 'var(--text-1)' }}>{t('mashqTugadi')}</h2>
          <div className="flex justify-center gap-6 my-4">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: 'var(--green)' }}>{knownCount}</div>
              <div className="text-xs" style={{ color: 'var(--text-2)' }}>{t('bilaman')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: 'var(--red)' }}>{total - knownCount}</div>
              <div className="text-xs" style={{ color: 'var(--text-2)' }}>{t('bilmayman')}</div>
            </div>
          </div>
          <button onClick={goHome} className="nav-btn-primary w-full mt-4">{t('boshSahifa')}</button>
        </motion.div>
      </motion.div>
    );
  }

  if (!card) return null;

  const questionText = lang === 'ru' ? card.question_ru : lang === 'kr' ? card.question_kr : card.question_uz;
  const options = lang === 'ru' ? card.options_ru : lang === 'kr' ? card.options_kr : card.options_uz;
  const explanationText = lang === 'ru' ? card.explanation_ru : lang === 'kr' ? card.explanation_kr : card.explanation_uz;

  return (
    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between safe-area-top"
        style={{ background: 'var(--card)', borderBottom: '1px solid var(--card-border)' }}>
        <motion.button whileTap={{ scale: 0.85 }} onClick={goHome}
          className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: 'var(--primary-light)' }}>
          <svg className="w-5 h-5" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </motion.button>
        <div className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>
          {t('mashq')} — {practiceIndex + 1}/{practiceCards.length}
        </div>
        <div className="w-9" />
      </div>

      {/* Progress */}
      <div className="px-4 pt-3">
        <div className="progress-track">
          <motion.div className="progress-fill" animate={{ width: `${((practiceIndex + 1) / practiceCards.length) * 100}%` }} transition={{ duration: 0.3 }} />
        </div>
      </div>

      {/* Swipe labels */}
      <div className="flex justify-between px-8 pt-3">
        <div className="flex items-center gap-1 text-xs font-medium opacity-60" style={{ color: 'var(--red)' }}>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('bilmayman')}
        </div>
        <div className="flex items-center gap-1 text-xs font-medium opacity-60" style={{ color: 'var(--green)' }}>
          {t('bilaman')}
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-4">
        <AnimatePresence mode="wait">
          <motion.div key={practiceIndex}
            style={{ x, rotate, opacity }} drag="x"
            dragConstraints={{ left: 0, right: 0 }} dragElastic={0.7}
            onDragEnd={handleDragEnd}
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ x: exitDirection * 300, opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-full cursor-grab active:cursor-grabbing" onClick={handleFlip}>

            <div className="relative w-full" style={{ minHeight: '320px', perspective: '1200px' }}>
              <div className={`flip-card-inner ${isFlipped ? 'flipped' : ''}`} style={{ minHeight: '320px' }}>
                {/* Front */}
                <div className="flip-card-front p-6 flex flex-col"
                  style={{ background: 'var(--card)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-md)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--primary-light)' }}>
                      <span className="text-sm font-bold" style={{ color: 'var(--primary)' }}>?</span>
                    </div>
                    <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>{t('savol')}</span>
                    <div className="flex-1" />
                    <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>Tap to flip</span>
                  </div>
                  {card.image && (
                    <div className="rounded-xl overflow-hidden mb-3" style={{ boxShadow: 'var(--shadow-sm)' }}>
                      <img src={card.image} alt="" className="w-full h-auto" />
                    </div>
                  )}
                  <p className="text-[15px] font-semibold leading-relaxed flex-1" style={{ color: 'var(--text-1)' }}>{questionText}</p>
                </div>

                {/* Back */}
                <div className="flip-card-back p-6 flex flex-col text-white"
                  style={{ background: 'linear-gradient(135deg, #059669, #10B981, #34D399)', boxShadow: 'var(--shadow-md)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-xs text-white/80 font-medium">{t('togriJavob')}</span>
                  </div>
                  <p className="text-lg font-bold leading-relaxed flex-1">{options[card.correct_index]}</p>
                  <div className="mt-4 pt-3 border-t border-white/20">
                    <p className="text-sm text-white/80 leading-relaxed">{explanationText}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="px-4 py-4 safe-area-bottom">
        <div className="flex gap-3">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleAction(false)}
            className="flex-1 py-3.5 font-bold text-sm rounded-xl border-2 flex items-center justify-center gap-2"
            style={{ background: 'var(--red-bg)', borderColor: 'var(--red-border)', color: 'var(--red)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            {t('bilmayman')}
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleAction(true)}
            className="flex-1 py-3.5 font-bold text-sm rounded-xl border-2 flex items-center justify-center gap-2"
            style={{ background: 'var(--green-bg)', borderColor: 'var(--green-border)', color: 'var(--green)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {t('bilaman')}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
