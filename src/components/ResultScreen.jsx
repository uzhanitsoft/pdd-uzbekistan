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

  // Circle SVG calculations
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (correctCount / totalQuestions) * circumference;

  // Fire confetti on pass
  useEffect(() => {
    if (passed && !confettiFired.current) {
      confettiFired.current = true;
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#007AFF', '#34C759', '#FFCC00', '#FF9500'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#007AFF', '#34C759', '#FFCC00', '#FF9500'],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [passed]);

  // Get wrong questions
  const wrongQuestions = answers
    .map((a, i) => ({ ...a, question: questions[i] }))
    .filter(a => !a.correct);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full bg-bg flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className={`px-5 pt-12 pb-8 text-center ${
        passed 
          ? 'bg-gradient-to-br from-correct via-emerald-500 to-green-600' 
          : 'bg-gradient-to-br from-wrong via-red-500 to-rose-600'
      }`}>
        {/* Score circle */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="inline-flex items-center justify-center mb-4"
        >
          <div className="relative">
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="8"
                fill="none"
              />
              <motion.circle
                cx="80"
                cy="80"
                r={radius}
                stroke="white"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.5, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
                transform="rotate(-90 80 80)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                className="text-4xl font-extrabold text-white"
              >
                {correctCount}
              </motion.span>
              <span className="text-white/70 text-sm font-medium">
                {t('dan')} {totalQuestions}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Status text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <h2 className="text-white text-2xl font-extrabold mb-1">
            {passed ? `${t('topshirdingiz')} ✓` : `${t('topshirmadingiz')} ✗`}
          </h2>
          <p className="text-white/70 text-sm">
            {t('bilet')} {selectedBilet} — {percentage}%
          </p>
        </motion.div>
      </div>

      {/* Results content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 -mt-3 pb-4">
        {/* Stats cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 gap-3 mb-4"
        >
          <div className="bg-white rounded-card p-4 shadow-card text-center">
            <div className="text-2xl font-extrabold text-correct">{correctCount}</div>
            <div className="text-xs text-text-secondary mt-1">{t('togriJavoblar')}</div>
          </div>
          <div className="bg-white rounded-card p-4 shadow-card text-center">
            <div className="text-2xl font-extrabold text-wrong">{wrongCount}</div>
            <div className="text-xs text-text-secondary mt-1">{t('xatolar')}</div>
          </div>
        </motion.div>

        {/* Wrong questions list */}
        {wrongQuestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-card p-4 shadow-card"
          >
            <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-wrong" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {t('xatolarRoyxati')}
            </h3>
            <div className="space-y-3">
              {wrongQuestions.map((item, idx) => {
                if (!item.question) return null;
                const qText = lang === 'ru' ? item.question.question_ru : item.question.question_uz;
                return (
                  <div key={idx} className="border-b border-gray-50 pb-3 last:border-b-0 last:pb-0">
                    <p className="text-xs text-text-primary font-medium leading-snug mb-1.5">
                      {qText}
                    </p>
                    <div className="flex items-start gap-1.5">
                      <span className="text-[10px] bg-correct/10 text-correct px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                        {t('togriJavob')}:
                      </span>
                      <span className="text-[11px] text-correct font-medium leading-snug">
                        {item.question.options[item.question.correct_index]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom buttons */}
      <motion.div
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.3 }}
        className="px-4 py-4 bg-white border-t border-gray-100 safe-area-bottom"
      >
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => startExam(selectedBilet)}
            className="flex-1 py-3.5 bg-primary text-white font-bold text-sm rounded-btn"
            id="btn-retry"
          >
            {t('qaytaUrinish')}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={goHome}
            className="flex-1 py-3.5 bg-gray-100 text-text-primary font-bold text-sm rounded-btn"
            id="btn-home"
          >
            {t('boshSahifa')}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
