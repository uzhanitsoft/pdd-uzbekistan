import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

export default function HomeScreen() {
  const { t, navigateTo, startPractice, progress, toggleLang, lang, loading } = useApp();

  const accuracy = progress.totalAnswered > 0
    ? Math.round((progress.totalCorrect / progress.totalAnswered) * 100)
    : 0;

  const passedCount = Object.values(progress.biletResults).filter(r => r.status === 'passed').length;
  const failedCount = Object.values(progress.biletResults).filter(r => r.status === 'failed').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-bg">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="h-full bg-bg flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary via-blue-500 to-indigo-600 px-5 pt-12 pb-8 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        
        {/* Language toggle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleLang}
          className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold tracking-wider z-10"
          id="lang-toggle"
        >
          {lang === 'uz' ? 'RU' : 'UZ'}
        </motion.button>

        <motion.div variants={container} initial="hidden" animate="show" className="relative z-10">
          <motion.div variants={item} className="flex items-center gap-3 mb-3">
            {/* Traffic light icon */}
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <svg viewBox="0 0 40 40" className="w-8 h-8">
                <rect x="12" y="2" width="16" height="36" rx="4" fill="rgba(255,255,255,0.3)"/>
                <circle cx="20" cy="10" r="4" fill="#FF3B30"/>
                <circle cx="20" cy="20" r="4" fill="#FFCC00"/>
                <circle cx="20" cy="30" r="4" fill="#34C759"/>
              </svg>
            </div>
            <div>
              <h1 className="text-white text-xl font-extrabold leading-tight">{t('appTitle')}</h1>
              <p className="text-white/70 text-xs font-medium mt-0.5">{t('appSubtitle')}</p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Content */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex-1 overflow-y-auto custom-scrollbar px-4 -mt-4 pb-8"
      >
        {/* Main action buttons */}
        <motion.div variants={item} className="grid grid-cols-2 gap-3 mb-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigateTo('tickets')}
            className="bg-white rounded-card p-5 shadow-card text-left touch-active"
            id="btn-biletlar"
          >
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-text-primary font-bold text-base">{t('biletlar')}</h2>
            <p className="text-text-secondary text-xs mt-1">{t('biletlarDesc')}</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={startPractice}
            className="bg-white rounded-card p-5 shadow-card text-left touch-active"
            id="btn-mashq"
          >
            <div className="w-12 h-12 bg-correct/10 rounded-2xl flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-correct" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-text-primary font-bold text-base">{t('mashq')}</h2>
            <p className="text-text-secondary text-xs mt-1">{t('mashqDesc')}</p>
          </motion.button>
        </motion.div>

        {/* Statistics Card */}
        <motion.div variants={item} className="bg-white rounded-card p-5 shadow-card mb-4">
          <h3 className="text-text-primary font-bold text-sm mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {t('statistika')}
          </h3>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-2xl font-extrabold text-primary">{progress.totalAnswered}</div>
              <div className="text-[10px] text-text-secondary mt-1 leading-tight">{t('savollarYechildi')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-extrabold text-correct">{accuracy}%</div>
              <div className="text-[10px] text-text-secondary mt-1 leading-tight">{t('aniqlik')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-extrabold text-text-primary">{passedCount}/30</div>
              <div className="text-[10px] text-text-secondary mt-1 leading-tight">{t('sotlingan')}</div>
            </div>
          </div>

          {/* Progress bar */}
          {progress.totalAnswered > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-[10px] text-text-secondary mb-1.5">
                <span>{t('umumiyNatija')}</span>
                <span>{accuracy}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${accuracy}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                  className={`h-full rounded-full ${accuracy >= 90 ? 'bg-correct' : accuracy >= 70 ? 'bg-yellow-400' : 'bg-wrong'}`}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick stats */}
        <motion.div variants={item} className="grid grid-cols-3 gap-2">
          <div className="bg-correct/10 rounded-2xl p-3 text-center">
            <div className="text-lg font-bold text-correct">{passedCount}</div>
            <div className="text-[10px] text-correct/80">{t('sotlingan')}</div>
          </div>
          <div className="bg-wrong/10 rounded-2xl p-3 text-center">
            <div className="text-lg font-bold text-wrong">{failedCount}</div>
            <div className="text-[10px] text-wrong/80">{t('yiqilgan')}</div>
          </div>
          <div className="bg-gray-100 rounded-2xl p-3 text-center">
            <div className="text-lg font-bold text-text-secondary">{30 - passedCount - failedCount}</div>
            <div className="text-[10px] text-text-secondary">{t('boshlanmagan')}</div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
