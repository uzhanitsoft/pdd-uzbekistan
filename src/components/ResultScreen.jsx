import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';

export default function ResultScreen() {
  const { t, lang, answers, bilets, selectedBilet, goHome, startExam } = useApp();
  const confettiFired = useRef(false);

  const bilet = bilets.find(b => b.number === selectedBilet);
  const questions = bilet ? bilet.questions : [];
  const totalQuestions = questions.length;
  const correctCount = answers.filter(a => a.correct).length;
  const wrongCount = totalQuestions - correctCount;
  const passed = correctCount >= 18;
  const percentage = Math.round((correctCount / totalQuestions) * 100);

  const ringR = 65; const ringC = 2 * Math.PI * ringR;
  const ringOffset = ringC - (correctCount / totalQuestions) * ringC;

  useEffect(() => {
    if (passed && !confettiFired.current) {
      confettiFired.current = true;
      const end = Date.now() + 3000;
      const frame = () => {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#6366F1','#22C55E','#F59E0B','#EF4444'] });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#6366F1','#22C55E','#F59E0B','#EF4444'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [passed]);

  const wrongQuestions = answers.map((a, i) => ({ ...a, question: questions[i] })).filter(a => !a.correct);
  const getOpts = (q) => lang === 'ru' ? q.options_ru : lang === 'kr' ? q.options_kr : q.options_uz;
  const getQText = (q) => lang === 'ru' ? q.question_ru : lang === 'kr' ? q.question_kr : q.question_uz;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* ====== HEADER ====== */}
      <div className="px-5 pt-12 pb-8 text-center"
        style={{ background: passed ? 'linear-gradient(135deg, #059669, #10B981, #34D399)' : 'linear-gradient(135deg, #DC2626, #EF4444, #F87171)' }}>

        {/* Score ring */}
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="inline-block mb-4">
          <div className="stat-ring">
            <svg width="150" height="150" viewBox="0 0 150 150">
              <circle cx="75" cy="75" r={ringR} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="7" />
              <motion.circle cx="75" cy="75" r={ringR} fill="none" stroke="white" strokeWidth="7" strokeLinecap="round"
                strokeDasharray={ringC} initial={{ strokeDashoffset: ringC }} animate={{ strokeDashoffset: ringOffset }}
                transition={{ duration: 1.5, delay: 0.5, ease: [0.4,0,0.2,1] }} transform="rotate(-90 75 75)" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }} className="text-4xl font-extrabold text-white">
                {correctCount}
              </motion.span>
              <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{t('dan')} {totalQuestions}</span>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
          <h2 className="text-white text-2xl font-extrabold mb-1">
            {passed ? `${t('topshirdingiz')} ✓` : `${t('topshirmadingiz')} ✗`}
          </h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{t('bilet')} {selectedBilet} — {percentage}%</p>
        </motion.div>
      </div>

      {/* ====== CONTENT ====== */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 -mt-3 pb-4">
        {/* Stats cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="grid grid-cols-2 gap-3 mb-4">
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-extrabold" style={{ color: 'var(--green)' }}>{correctCount}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>{t('togriJavoblar')}</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-extrabold" style={{ color: 'var(--red)' }}>{wrongCount}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>{t('xatolar')}</div>
          </div>
        </motion.div>

        {/* Wrong questions */}
        {wrongQuestions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            className="glass-card p-4">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
              <svg className="w-4 h-4" style={{ color: 'var(--red)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {t('xatolarRoyxati')}
            </h3>
            <div className="space-y-3">
              {wrongQuestions.map((item, idx) => {
                if (!item.question) return null;
                const opts = getOpts(item.question);
                return (
                  <div key={idx} className="pb-3" style={{ borderBottom: idx < wrongQuestions.length - 1 ? '1px solid var(--divider)' : 'none' }}>
                    <p className="text-xs font-medium leading-snug mb-1.5" style={{ color: 'var(--text-1)' }}>{getQText(item.question)}</p>
                    <div className="flex items-start gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                        style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>
                        {t('togriJavob')}:
                      </span>
                      <span className="text-[11px] font-medium leading-snug" style={{ color: 'var(--green)' }}>
                        {opts[item.question.correct_index] || ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* ====== BOTTOM ====== */}
      <motion.div initial={{ y: 80 }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.3 }}
        className="px-4 py-4 safe-area-bottom" style={{ background: 'var(--card)', borderTop: '1px solid var(--card-border)' }}>
        <div className="flex gap-3">
          <button onClick={() => startExam(selectedBilet)} className="nav-btn-primary" id="btn-retry">{t('qaytaUrinish')}</button>
          <button onClick={goHome} className="nav-btn-secondary" id="btn-home">{t('boshSahifa')}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
