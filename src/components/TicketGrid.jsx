import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.02, delayChildren: 0.1 } } };
const pop = { hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 22 } } };

export default function TicketGrid() {
  const { t, startExam, goHome, bilets, getBiletStatus } = useApp();

  return (
    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* ====== HEADER ====== */}
      <div className="px-4 py-4 flex items-center gap-3 safe-area-top"
        style={{ background: 'var(--card)', borderBottom: '1px solid var(--card-border)' }}>
        <motion.button whileTap={{ scale: 0.85 }} onClick={goHome}
          className="w-10 h-10 flex items-center justify-center rounded-full"
          style={{ background: 'var(--primary-light)' }} id="btn-back-tickets">
          <svg className="w-5 h-5" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </motion.button>
        <h1 className="font-bold text-lg flex-1" style={{ color: 'var(--text-1)' }}>{t('biletlarniTanlang')}</h1>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{bilets.length}</span>
      </div>

      {/* ====== GRID ====== */}
      <motion.div variants={stagger} initial="hidden" animate="show"
        className="flex-1 overflow-y-auto custom-scrollbar p-4">
        <div className="grid grid-cols-3 gap-2.5">
          {bilets.map(bilet => {
            const status = getBiletStatus(bilet.number);
            const total = status.total || 20;
            const answered = status.answeredCount || 0;
            const pct = total > 0 ? Math.round((answered / total) * 100) : 0;

            let borderColor = 'var(--card-border)';
            let accent = 'var(--text-2)';
            let statusBadge = null;
            let progressColor = 'var(--primary)';

            if (status.status === 'passed') {
              borderColor = 'var(--green-border)';
              accent = 'var(--green)';
              progressColor = 'var(--green)';
              statusBadge = (
                <div className="flex items-center gap-1 mt-1.5">
                  <svg className="w-3.5 h-3.5" style={{ color: 'var(--green)' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[10px] font-bold" style={{ color: 'var(--green)' }}>{status.score}/{total}</span>
                </div>
              );
            } else if (status.status === 'failed') {
              borderColor = 'var(--red-border)';
              accent = 'var(--red)';
              progressColor = 'var(--red)';
              statusBadge = (
                <div className="flex items-center gap-1 mt-1.5">
                  <svg className="w-3.5 h-3.5" style={{ color: 'var(--red)' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[10px] font-bold" style={{ color: 'var(--red)' }}>{status.score}/{total}</span>
                </div>
              );
            } else if (status.status === 'in_progress') {
              borderColor = 'var(--yellow-border)';
              accent = 'var(--yellow)';
              progressColor = 'var(--yellow)';
              statusBadge = (
                <span className="text-[10px] font-bold mt-1.5 block" style={{ color: 'var(--yellow)' }}>
                  {answered}/{total}
                </span>
              );
            } else {
              statusBadge = (
                <span className="text-[10px] mt-1.5 block" style={{ color: 'var(--text-3)' }}>{t('bilet')}</span>
              );
            }

            return (
              <motion.button key={bilet.number} variants={pop}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.93 }}
                onClick={() => startExam(bilet.number)}
                className="glass-card p-3 flex flex-col items-center text-center"
                style={{ borderColor }} id={`ticket-${bilet.number}`}>

                {/* Number */}
                <span className="text-xl font-extrabold" style={{ color: accent }}>{bilet.number}</span>

                {/* Status badge */}
                {statusBadge}

                {/* Mini progress bar */}
                {(status.status === 'in_progress' || status.status === 'passed' || status.status === 'failed') && (
                  <div className="w-full mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
                    <div className="h-full rounded-full" style={{
                      width: `${status.status === 'passed' || status.status === 'failed' ? 100 : pct}%`,
                      background: progressColor,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
