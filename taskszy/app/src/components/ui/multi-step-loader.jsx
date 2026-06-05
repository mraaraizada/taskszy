import { AnimatePresence, motion } from 'motion/react';
import { useState, useEffect } from 'react';

const CheckFilled = ({ done, active }) => (
  <div style={{
    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
    background: active
      ? 'linear-gradient(135deg, #3B5BFC, #7C3AED)'
      : done ? '#ECFDF5' : '#F0F2F8',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: active ? '0 4px 12px rgba(59,91,252,0.35)' : 'none',
    transition: 'all 0.4s ease',
  }}>
    {active ? (
      <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />
    ) : done ? (
      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14, height: 14, color: '#12C479' }}>
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
      </svg>
    ) : (
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#D1D5DB' }} />
    )}
  </div>
);

export const MultiStepLoader = ({ loadingStates, loading, duration = 2000, loop = false, onComplete }) => {
  const [currentState, setCurrentState] = useState(0);

  useEffect(() => {
    if (!loading) { setCurrentState(0); return; }
    if (!loop && currentState === loadingStates.length - 1) {
      const t = setTimeout(() => onComplete?.(), duration);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setCurrentState(prev =>
        loop
          ? prev === loadingStates.length - 1 ? 0 : prev + 1
          : Math.min(prev + 1, loadingStates.length - 1)
      );
    }, duration);
    return () => clearTimeout(t);
  }, [currentState, loading, loop, loadingStates.length, duration]);

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(15,20,40,0.35)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: '#fff', borderRadius: 24,
              padding: '40px 44px 36px',
              width: '100%', maxWidth: 420,
              boxShadow: '0 24px 64px rgba(59,91,252,0.12), 0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid rgba(255,255,255,0.9)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1A1D2E', letterSpacing: '-0.6px', marginBottom: 4 }}>
                Getting things ready…
              </h2>
              <p style={{ fontSize: 13, color: '#9CA3AF' }}>Just a moment while we set up your workspace</p>
            </div>

            {/* Scrolling steps — Aceternity style inside card */}
            <div style={{ height: 160, overflow: 'hidden', position: 'relative' }}>
              <motion.div
                animate={{ y: -(currentState * 44) }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                style={{ position: 'relative' }}
              >
                {loadingStates.map((state, index) => {
                  const done = index < currentState;
                  const active = index === currentState;
                  const distance = index - currentState;
                  const opacity = distance < 0 ? Math.max(1 - Math.abs(distance) * 0.4, 0) : distance === 0 ? 1 : Math.max(1 - distance * 0.3, 0.2);

                  return (
                    <div
                      key={index}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        height: 44,
                        opacity,
                        transition: 'opacity 0.4s ease',
                      }}
                    >
                      <CheckFilled done={done} active={active} />
                      <span style={{
                        fontSize: 14,
                        fontWeight: active ? 700 : done ? 500 : 400,
                        color: active ? '#1A1D2E' : done ? '#6B7280' : '#9CA3AF',
                        transition: 'all 0.3s',
                      }}>
                        {state.text}
                      </span>
                      {done && (
                        <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: '#12C479' }}>Done</span>
                      )}
                    </div>
                  );
                })}
              </motion.div>

              {/* Fade mask bottom */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: 48,
                background: 'linear-gradient(to top, #fff, transparent)',
                pointerEvents: 'none',
              }} />
            </div>

            {/* Progress bar */}
            <div style={{ marginTop: 20, height: 4, borderRadius: 4, background: '#F0F2F8', overflow: 'hidden' }}>
              <motion.div
                style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #3B5BFC, #7C3AED)' }}
                animate={{ width: `${((currentState + 1) / loadingStates.length) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
