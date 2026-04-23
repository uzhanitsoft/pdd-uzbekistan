import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.15 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.2,0.8,0.2,1] } } };

export default function HomeScreen() {
  const {
    t, navigateTo, startPractice, startTimedExam, toggleLang, cycleTheme,
    lang, theme, loading, bilets, getOverallStats, getUnfinishedBilet, startExam,
    resetProgress, allQuestions,
  } = useApp();
  const [showReset, setShowReset] = useState(false);

  const stats = getOverallStats();
  const accuracy = stats.totalAnswered > 0 ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) : 0;
  const unfinished = getUnfinishedBilet();
  const themeIcon = theme === 'dark' ? '🌙' : theme === 'auto' ? '🔄' : '☀️';
  const langLabel = lang === 'uz' ? 'ЎЗ' : lang === 'kr' ? 'RU' : 'UZ';

  // Progress ring SVG
  const ringSize = 52;
  const ringR = 21;
  const ringC = 2 * Math.PI * ringR;
  const ringOffset = ringC - (accuracy / 100) * ringC;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: 'var(--bg)' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-t-transparent rounded-full" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* ====== GRADIENT HEADER ====== */}
      <div className="gradient-header px-5 pt-12 pb-9 safe-area-top" style={{ position: 'relative', zIndex: 1 }}>
        {/* Top row: theme + lang */}
        <div className="flex justify-end gap-2 mb-5" style={{ position: 'relative', zIndex: 10 }}>
          <motion.button whileTap={{ scale: 0.85 }} onClick={cycleTheme}
            className="px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)', color: '#fff' }} id="theme-toggle">
            {themeIcon}
          </motion.button>
          <motion.button whileTap={{ scale: 0.85 }} onClick={toggleLang}
            className="px-3 py-1.5 rounded-full text-xs font-bold tracking-wider"
            style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)', color: '#fff' }} id="lang-toggle">
            {langLabel}
          </motion.button>
        </div>

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex items-center gap-3" style={{ position: 'relative', zIndex: 10 }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)' }}>
            <svg viewBox="0 0 40 40" className="w-8 h-8">
              <rect x="12" y="2" width="16" height="36" rx="4" fill="rgba(255,255,255,0.3)"/>
              <circle cx="20" cy="10" r="4" fill="#FF3B30"/>
              <circle cx="20" cy="20" r="4" fill="#FFCC00"/>
              <circle cx="20" cy="30" r="4" fill="#34C759"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-extrabold leading-tight" style={{ color: '#fff' }}>{t('appTitle')}</h1>
            <p className="text-xs font-medium mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>{t('appSubtitle')}</p>
          </div>
        </motion.div>
      </div>

      {/* ====== CONTENT ====== */}
      <motion.div variants={stagger} initial="hidden" animate="show"
        className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-8" style={{ marginTop: '-20px', position: 'relative', zIndex: 2 }}>

        {/* ====== CONTINUE BANNER ====== */}
        {unfinished && (
          <motion.div variants={fadeUp}>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => startExam(unfinished)}
              className="w-full glass-card p-4 mb-3 flex items-center gap-4 text-left"
              style={{ borderColor: 'var(--primary-glow)', background: 'var(--primary-light)' }} id="btn-continue">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', boxShadow: '0 4px 15px rgba(99,102,241,0.4)' }}>
                <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>{t('davomEttirish')}</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>{t('bilet')} {unfinished}</p>
              </div>
              <svg className="w-5 h-5" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </motion.button>
          </motion.div>
        )}

        {/* ====== ACTION CARDS ====== */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 mb-3">
          {/* Biletlar */}
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
            onClick={() => navigateTo('tickets')} className="glass-card p-5 text-left" id="btn-biletlar">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
              style={{ background: 'var(--primary-light)' }}>
              <svg className="w-5 h-5" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="font-bold text-base" style={{ color: 'var(--text-1)' }}>{t('biletlar')}</h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>{bilets.length} {t('bilet')}</p>
          </motion.button>

          {/* Mashq */}
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
            onClick={startPractice} className="glass-card p-5 text-left" id="btn-mashq">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
              style={{ background: 'var(--green-bg)' }}>
              <svg className="w-5 h-5" style={{ color: 'var(--green)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="font-bold text-base" style={{ color: 'var(--text-1)' }}>{t('mashq')}</h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>{t('mashqDesc')}</p>
          </motion.button>
        </motion.div>

        {/* ====== EXAM BUTTON ====== */}
        <motion.div variants={fadeUp} className="mb-4">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
            onClick={startTimedExam}
            className="w-full rounded-2xl p-5 flex items-center gap-4 text-left"
            style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              boxShadow: '0 8px 30px rgba(99,102,241,0.35)',
              border: 'none',
            }} id="btn-exam">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <span className="text-2xl">🎓</span>
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-base" style={{ color: '#fff' }}>{t('imtihonRejimi')}</h2>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>{t('imtihonDesc')}</p>
            </div>
            <svg className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.7)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </motion.button>
        </motion.div>

        {/* ====== STATISTICS ====== */}
        <motion.div variants={fadeUp} className="glass-card p-5 mb-4">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
            <svg className="w-4 h-4" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {t('statistika')}
          </h3>

          <div className="flex items-center gap-5">
            {/* Ring */}
            <div className="stat-ring flex-shrink-0">
              <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
                <circle cx={ringSize/2} cy={ringSize/2} r={ringR} fill="none" stroke="var(--divider)" strokeWidth="5" />
                <motion.circle cx={ringSize/2} cy={ringSize/2} r={ringR} fill="none"
                  stroke={accuracy >= 70 ? 'var(--green)' : accuracy >= 40 ? 'var(--yellow)' : 'var(--red)'}
                  strokeWidth="5" strokeLinecap="round" strokeDasharray={ringC}
                  initial={{ strokeDashoffset: ringC }}
                  animate={{ strokeDashoffset: stats.totalAnswered > 0 ? ringOffset : ringC }}
                  transition={{ duration: 1.2, delay: 0.4, ease: [0.4,0,0.2,1] }}
                  transform={`rotate(-90 ${ringSize/2} ${ringSize/2})`} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-extrabold" style={{ color: 'var(--text-1)' }}>{accuracy}%</span>
              </div>
            </div>

            {/* Stats grid */}
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div>
                <div className="text-xl font-extrabold" style={{ color: 'var(--primary)' }}>{stats.totalAnswered}</div>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-2)' }}>{t('savollarYechildi')}</div>
              </div>
              <div>
                <div className="text-xl font-extrabold" style={{ color: 'var(--green)' }}>{stats.totalCorrect}</div>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-2)' }}>{t('togri')}</div>
              </div>
              <div>
                <div className="text-xl font-extrabold" style={{ color: 'var(--red)' }}>{stats.totalWrong}</div>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-2)' }}>{t('xato')}</div>
              </div>
              <div>
                <div className="text-xl font-extrabold" style={{ color: 'var(--text-1)' }}>{allQuestions.length}</div>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-2)' }}>{t('jami')}</div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {stats.totalAnswered > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-[10px] mb-1.5" style={{ color: 'var(--text-2)' }}>
                <span>{t('umumiyNatija')}</span>
                <span>{stats.passedCount}/{bilets.length} {t('bilet')}</span>
              </div>
              <div className="progress-track">
                <motion.div className="progress-fill" initial={{ width: 0 }}
                  animate={{ width: `${bilets.length > 0 ? (stats.passedCount / bilets.length) * 100 : 0}%` }}
                  transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }} />
              </div>
            </div>
          )}
        </motion.div>

        {/* ====== QUICK STATS ====== */}
        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-2 mb-4">
          <div className="glass-card p-3 text-center" style={{ borderColor: 'var(--green-border)' }}>
            <div className="text-lg font-bold" style={{ color: 'var(--green)' }}>{stats.passedCount}</div>
            <div className="text-[10px]" style={{ color: 'var(--green)' }}>{t('sotlingan')}</div>
          </div>
          <div className="glass-card p-3 text-center" style={{ borderColor: 'var(--red-border)' }}>
            <div className="text-lg font-bold" style={{ color: 'var(--red)' }}>{stats.failedCount}</div>
            <div className="text-[10px]" style={{ color: 'var(--red)' }}>{t('yiqilgan')}</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-lg font-bold" style={{ color: 'var(--text-2)' }}>{bilets.length - stats.passedCount - stats.failedCount}</div>
            <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>{t('boshlanmagan')}</div>
          </div>
        </motion.div>

        {/* ====== RESET ====== */}
        {stats.totalAnswered > 0 && (
          <motion.div variants={fadeUp}>
            <button onClick={() => setShowReset(true)}
              className="w-full py-3 rounded-2xl text-sm font-medium"
              style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', color: 'var(--red)' }} id="btn-reset">
              {t('progressniTozalash')}
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* ====== RESET MODAL ====== */}
      {showReset && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="modal-backdrop">
          <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal-card">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-1)' }}>{t('progressniTozalash')}</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-2)', lineHeight: 1.5 }}>{t('tozalashConfirm')}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowReset(false)} className="nav-btn-secondary">{t('yoq')}</button>
              <button onClick={() => { resetProgress(); setShowReset(false); }}
                className="nav-btn-primary" style={{ background: 'var(--red)' }}>{t('ha')}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
