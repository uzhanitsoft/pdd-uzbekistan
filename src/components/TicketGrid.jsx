import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03 }
  }
};

const cardVariant = {
  hidden: { opacity: 0, scale: 0.8, y: 10 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } }
};

export default function TicketGrid() {
  const { t, startExam, goHome, progress } = useApp();

  const getTicketStatus = (num) => {
    const result = progress.biletResults[num];
    if (!result) return 'none';
    return result.status;
  };

  const getTicketScore = (num) => {
    const result = progress.biletResults[num];
    if (!result) return null;
    return `${result.score}/${result.total || 20}`;
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-full bg-bg flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center gap-3 shadow-sm safe-area-top">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={goHome}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 transition-colors"
          id="btn-back-tickets"
        >
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </motion.button>
        <h1 className="text-text-primary font-bold text-lg flex-1">{t('biletlarniTanlang')}</h1>
      </div>

      {/* Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4"
      >
        <div className="grid grid-cols-5 gap-2.5">
          {Array.from({ length: 30 }, (_, i) => i + 1).map(num => {
            const status = getTicketStatus(num);
            const score = getTicketScore(num);
            
            let bgClass = 'bg-white';
            let textClass = 'text-text-primary';
            let borderClass = 'border-transparent';
            let statusIcon = null;

            if (status === 'passed') {
              bgClass = 'bg-correct/10';
              textClass = 'text-correct';
              borderClass = 'border-correct/30';
              statusIcon = (
                <svg className="w-3.5 h-3.5 text-correct" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              );
            } else if (status === 'failed') {
              bgClass = 'bg-wrong/10';
              textClass = 'text-wrong';
              borderClass = 'border-wrong/30';
              statusIcon = (
                <svg className="w-3.5 h-3.5 text-wrong" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              );
            }

            return (
              <motion.button
                key={num}
                variants={cardVariant}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => startExam(num)}
                className={`${bgClass} border ${borderClass} rounded-2xl p-2.5 shadow-sm flex flex-col items-center gap-1 touch-active relative`}
                id={`ticket-${num}`}
              >
                {statusIcon && (
                  <div className="absolute top-1 right-1">
                    {statusIcon}
                  </div>
                )}
                <span className={`text-lg font-bold ${textClass}`}>{num}</span>
                {score && (
                  <span className={`text-[9px] font-medium ${textClass} opacity-70`}>{score}</span>
                )}
                {!score && (
                  <span className="text-[9px] text-text-tertiary">{t('bilet')}</span>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
