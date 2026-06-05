import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { Ripple } from '@/components/ui/material-design-3-ripple'
import { Fingerprint, Lock, Unlock, ChevronRight } from 'lucide-react'
import LanyardCard from './LanyardCard'

const features = [
  {
    id: 1,
    title: 'Intelligent Task Workflow',
    description: '7-stage customizable workflow that adapts to your team\'s process. From new idea to completion, every task has a clear path forward with our proven New → Start → Issue → Review A → Review B → Update → Complete system.',
    type: 'orbit'
  },
  {
    id: 2,
    title: 'Real-Time Team Collaboration',
    description: 'Task-level chat, shared notes, and activity feeds keep everyone aligned. No more digging through Slack or email—everything your team needs is right where the work happens, with @mentions, file attachments, and read receipts.',
    type: 'notifications'
  },
  {
    id: 3,
    title: 'Role-Based Permissions',
    description: '3-tier architecture ensures everyone has exactly the access they need. Admins control workspace settings, Management creates and oversees tasks, and Members focus on their assigned work—all with granular permission controls.',
    type: 'security'
  },
  {
    id: 4,
    title: 'Task Budget',
    description: 'Comprehensive budget management at the task level with real-time cost tracking and financial oversight. Monitor expenses, track payments, and maintain complete visibility into project finances with integrated reporting and analytics.',
    type: 'settlement'
  },
]

// Pill Component with Key Icon
const KeyIcon = () => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="rgb(102,102,255)" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    {/* Circular head with hole */}
    <circle cx="8.5" cy="8.5" r="5" />
    <circle cx="8.5" cy="8.5" r="1.5" fill="rgb(102,102,255)" />
    
    {/* Main shaft going diagonally down-right */}
    <path d="M 12 12 L 21 21" />
    
    {/* Teeth at the end */}
    <path d="M 18 18 L 18 16" />
    <path d="M 20 20 L 20 18" />
  </svg>
)

const Pill = () => {
  const [isExpanded, setIsExpanded] = useState(true) // Keep it expanded to prevent width changes

  return (
    <motion.div
      className="flex items-center justify-center overflow-hidden px-[10px] py-[18px] h-[38px] rounded-[20px]"
      style={{ 
        width: 'auto',
        minWidth: 'min-content',
        gap: '8px',
        background: 'linear-gradient(145deg, rgba(40, 45, 50, 0.95) 0%, rgba(25, 28, 32, 0.98) 50%, rgba(19, 20, 21, 1) 100%)',
        border: '1.5px solid rgba(80, 90, 100, 0.5)',
        borderTop: '1.5px solid rgba(120, 130, 140, 0.7)',
        borderLeft: '1.5px solid rgba(100, 110, 120, 0.6)',
        boxShadow: `
          0 4px 12px rgba(0, 0, 0, 0.5),
          0 12px 32px rgba(0, 0, 0, 0.4),
          inset 0 2px 4px rgba(255, 255, 255, 0.12),
          inset 0 -2px 4px rgba(0, 0, 0, 0.6),
          inset 2px 0 3px rgba(255, 255, 255, 0.1),
          inset -2px 0 3px rgba(0, 0, 0, 0.4)
        `,
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility',
      }}
    >
      {/* Connect section */}
      <div className="flex items-center gap-2">
        <KeyIcon />
        <span className="text-white text-sm font-medium select-none whitespace-pre">Connect</span>
      </div>

      {/* 248k Active Users - always visible */}
      <motion.span
        className="text-[rgb(155,161,165)] text-sm font-medium whitespace-pre"
      >
        · 248k Active Users
      </motion.span>

      {/* Info button - always visible */}
      <motion.div
        className="px-3 py-1 rounded-full text-[rgb(102,102,255)] text-xs font-medium"
            style={{
              background: 'linear-gradient(145deg, rgba(45, 50, 60, 0.95) 0%, rgba(30, 35, 40, 1) 100%)',
              border: '1px solid rgba(102, 102, 255, 0.4)',
              boxShadow: `
                0 4px 12px rgba(0, 0, 0, 0.4),
                0 0 16px rgba(102, 102, 255, 0.3),
                inset 0 2px 3px rgba(102, 102, 255, 0.2),
                inset 0 -2px 3px rgba(0, 0, 0, 0.5)
              `,
            }}
          >
            Info
          </motion.div>
    </motion.div>
  )
}

// NotificationWidget Component - 3D Glassy with Light Cream
const NotificationWidget = ({ isInView }) => {
  const [isExpanded, setIsExpanded] = useState(true); // Always expanded to prevent layout shift
  const [autoExpanded, setAutoExpanded] = useState(true);

  return (
    <div className="flex items-center justify-center w-full h-full">
      <motion.div
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => !autoExpanded && setIsExpanded(false)}
        className="relative rounded-[24px] p-4 flex items-center justify-center overflow-hidden"
        style={{
          background: `
            linear-gradient(145deg, 
              rgba(225, 220, 240, 0.35) 0%, 
              rgba(215, 212, 235, 0.38) 25%,
              rgba(205, 205, 230, 0.42) 50%,
              rgba(195, 198, 225, 0.45) 75%,
              rgba(185, 190, 220, 0.48) 100%
            )
          `,
          backdropFilter: 'blur(28px) saturate(160%) brightness(0.98)',
          WebkitBackdropFilter: 'blur(28px) saturate(160%) brightness(0.98)',
          border: '2.5px solid rgba(210, 205, 240, 0.35)',
          borderTop: '2.5px solid rgba(240, 235, 255, 0.55)',
          borderLeft: '2.5px solid rgba(230, 225, 250, 0.45)',
          borderBottom: '2.5px solid rgba(170, 165, 210, 0.45)',
          borderRight: '2.5px solid rgba(170, 165, 210, 0.5)',
          boxShadow: `
            0 15px 50px rgba(0, 0, 0, 0.2),
            0 25px 80px rgba(0, 0, 0, 0.16),
            0 40px 120px rgba(0, 0, 0, 0.12),
            inset 0 3px 2px rgba(245, 240, 255, 0.6),
            inset 0 6px 20px rgba(230, 225, 255, 0.25),
            inset 0 -6px 25px rgba(170, 170, 220, 0.2),
            inset 6px 0 20px rgba(230, 225, 255, 0.2),
            inset -6px 0 25px rgba(170, 170, 220, 0.18),
            inset 0 0 50px rgba(200, 195, 235, 0.12)
          `,
          width: '300px',
          height: '320px',
          transform: 'none',
          transformStyle: 'flat',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        }}
        layout={false}
      >
        {/* Edge bevel effect - top and left */}
        <div 
          className="absolute inset-0 rounded-[24px] pointer-events-none"
          style={{
            background: `
              linear-gradient(180deg, 
                rgba(255, 255, 255, 0.5) 0%, 
                transparent 8%
              ),
              linear-gradient(90deg, 
                rgba(255, 255, 255, 0.4) 0%, 
                transparent 8%
              )
            `,
          }}
        />
        
        {/* Edge bevel effect - bottom and right */}
        <div 
          className="absolute inset-0 rounded-[24px] pointer-events-none"
          style={{
            background: `
              linear-gradient(0deg, 
                rgba(170, 165, 210, 0.3) 0%, 
                transparent 8%
              ),
              linear-gradient(270deg, 
                rgba(170, 165, 210, 0.25) 0%, 
                transparent 8%
              )
            `,
          }}
        />
        
        {/* Corner highlights - top-left and top-right */}
        <div 
          className="absolute inset-0 rounded-[24px] pointer-events-none"
          style={{
            background: `
              radial-gradient(circle at 5% 5%, 
                rgba(245, 240, 255, 0.35) 0%, 
                transparent 15%
              ),
              radial-gradient(circle at 95% 5%, 
                rgba(235, 230, 255, 0.25) 0%, 
                transparent 15%
              )
            `,
          }}
        />
        
        {/* Corner shadows - bottom-left and bottom-right */}
        <div 
          className="absolute inset-0 rounded-[24px] pointer-events-none"
          style={{
            background: `
              radial-gradient(circle at 5% 95%, 
                rgba(170, 165, 210, 0.2) 0%, 
                transparent 15%
              ),
              radial-gradient(circle at 95% 95%, 
                rgba(160, 158, 205, 0.28) 0%, 
                transparent 15%
              )
            `,
          }}
        />
        
        {/* Glass reflection overlay - enhanced 3D lighting */}
        <div 
          className="absolute inset-0 rounded-[24px] pointer-events-none"
          style={{
            background: `
              linear-gradient(135deg, 
                rgba(245, 240, 255, 0.35) 0%, 
                rgba(235, 230, 255, 0.2) 15%,
                transparent 35%,
                transparent 65%,
                rgba(190, 185, 230, 0.15) 85%,
                rgba(180, 175, 220, 0.2) 100%
              )
            `,
          }}
        />
        
        {/* Curved edge lighting - follows the rounded corners */}
        <div 
          className="absolute inset-0 rounded-[24px] pointer-events-none"
          style={{
            boxShadow: `
              inset 0 0 0 1px rgba(230, 225, 255, 0.25),
              inset 2px 2px 4px rgba(245, 240, 255, 0.35),
              inset -2px -2px 4px rgba(170, 165, 210, 0.25)
            `,
          }}
        />
        
        {/* Glass shine streak - thin blurry diagonal line */}
        <div 
          className="absolute inset-0 rounded-[24px] pointer-events-none overflow-hidden"
          style={{
            background: 'linear-gradient(120deg, transparent 0%, transparent 44%, rgba(255, 255, 255, 0.2) 47%, rgba(255, 255, 255, 0.35) 50%, rgba(255, 255, 255, 0.2) 53%, transparent 56%, transparent 100%)',
            filter: 'blur(16px)',
            transform: 'translateX(-100%)',
            animation: 'shine 8s ease-in-out infinite',
          }}
        />
        
        <style>{`
          @keyframes shine {
            0%, 100% { transform: translateX(-100%); }
            50% { transform: translateX(200%); }
          }
        `}</style>
        {/* Inner Container - holds everything */}
        <motion.div 
          className="flex flex-col w-full"
          style={{ width: '268px', gap: '16px' }}
        >
          {/* Alert Cards Container - FIXED HEIGHT */}
          <div 
            className="flex flex-col items-center justify-start relative w-full"
            style={{ height: '240px', gap: '4px', overflow: 'hidden' }}
          >
            {/* Card 1 - Always visible on top */}
            <motion.div
              className="absolute w-full rounded-[20px] px-5 py-4 flex flex-col justify-between top-0"
              style={{
                height: '76px',
                zIndex: 2,
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.5)',
                border: '2px solid rgba(0, 0, 0, 0.15)',
              }}
              animate={
                isExpanded
                  ? { opacity: 1, y: 0 }
                  : { opacity: 1, y: 0 }
              }
              transition={{ duration: 0.3, delay: 0 }}
            >
              <div className="flex items-start justify-between">
                <h3 className="text-black font-semibold text-[17px] leading-tight" style={{ 
                  fontFamily: 'Inter, sans-serif',
                  WebkitFontSmoothing: 'antialiased',
                  MozOsxFontSmoothing: 'grayscale',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                }}>
                  Orders Import failed
                </h3>
                <div className="flex items-center justify-center rounded-full" style={{ 
                  width: '28px', 
                  height: '28px',
                  backgroundColor: 'rgb(220, 222, 255)' 
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(91, 95, 248)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                </div>
              </div>
              <p className="text-[rgb(100,100,100)] text-[13px] font-normal" style={{ 
                fontFamily: 'Inter, sans-serif',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                fontWeight: 500,
              }}>
                42s · TimeoutError at Step 2
              </p>
            </motion.div>

            {/* Card 2 - Stacks behind/below card 1 */}
            <motion.div
              className="absolute w-full rounded-[20px] px-5 py-4 flex flex-col justify-between"
              style={{
                height: '76px',
                zIndex: 1,
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.5)',
                border: '2px solid rgba(0, 0, 0, 0.15)',
                top: '80px',
              }}
              animate={{
                y: isExpanded ? 0 : -66,
                scale: isExpanded ? 1 : 0.9,
                opacity: isExpanded ? 1 : 0.5,
              }}
              transition={{ 
                duration: 0.4, 
                ease: [0.34, 1.56, 0.64, 1],
                delay: isExpanded ? 0.1 : 0 
              }}
            >
              <h3 className="text-black font-semibold text-[17px] leading-tight" style={{ 
                fontFamily: 'Inter, sans-serif',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                fontWeight: 600,
                letterSpacing: '-0.01em',
              }}>
                SLA breach
              </h3>
              <p className="text-[rgb(100,100,100)] text-[13px] font-normal" style={{ 
                fontFamily: 'Inter, sans-serif',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                fontWeight: 500,
              }}>
                2m 11s · Data enrichment
              </p>
            </motion.div>

            {/* Card 3 - Stacks behind card 2 */}
            <motion.div
              className="absolute w-full rounded-[20px] px-5 py-4 flex flex-col justify-between"
              style={{
                height: '76px',
                zIndex: 0,
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.5)',
                border: '2px solid rgba(0, 0, 0, 0.15)',
                top: '160px',
              }}
              animate={{
                y: isExpanded ? 0 : -132,
                scale: isExpanded ? 1 : 0.8,
                opacity: isExpanded ? 1 : 0.3,
              }}
              transition={{ 
                duration: 0.4, 
                ease: [0.34, 1.56, 0.64, 1],
                delay: isExpanded ? 0.2 : 0 
              }}
            >
              <h3 className="text-black font-semibold text-[17px] leading-tight" style={{ 
                fontFamily: 'Inter, sans-serif',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                fontWeight: 600,
                letterSpacing: '-0.01em',
              }}>
                Orders Import failed
              </h3>
              <p className="text-[rgb(100,100,100)] text-[13px] font-normal" style={{ 
                fontFamily: 'Inter, sans-serif',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                fontWeight: 500,
              }}>
                5m · 404 on GET /products
              </p>
            </motion.div>
          </div>

          {/* Button Section - stays at bottom */}
          <div className="flex items-center justify-start gap-2.5 relative" style={{ marginTop: 'auto' }}>
            {/* Number Badge */}
            <div 
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{
                width: '26px',
                height: '26px',
                backgroundColor: 'rgb(91, 95, 248)',
              }}
            >
              <span className="text-white font-semibold text-[14px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                3
              </span>
            </div>

            {/* Button Text Container */}
            <div className="relative flex items-center justify-start" style={{ width: '120px', height: '24px' }}>
              {/* "Notifications" text - visible when collapsed */}
              <motion.span
                className="text-black font-semibold text-[16px] tracking-tight whitespace-nowrap absolute left-0"
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                  letterSpacing: '-0.04em',
                }}
                animate={{ 
                  opacity: isExpanded ? 0 : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                Notifications
              </motion.span>

              {/* "View all" with arrow - visible when expanded */}
              <motion.div
                className="flex items-center gap-2.5 absolute left-0"
                animate={{ 
                  opacity: isExpanded ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-black font-semibold text-[16px] tracking-tight whitespace-nowrap" style={{ 
                  fontFamily: 'Inter, sans-serif',
                  letterSpacing: '-0.04em',
                }}>
                  View all
                </span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(40, 40, 40)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 15V6M18 6H9M18 6L6.25 17.75"/>
                </svg>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

// OrbitAnimation Component
const magneticSpring = { damping: 40, stiffness: 400 };

function useMagnet(isEnabled, power, area) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const ref = useRef(null);

  useEffect(() => {
    if (!isEnabled) {
      x.set(0);
      y.set(0);
      return;
    }

    const move = (e) => {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < area) {
        const pull = (1 - dist / area) * power;
        x.set(dx * pull);
        y.set(dy * pull);
      } else {
        x.set(0);
        y.set(0);
      }
    };

    document.addEventListener('mousemove', move);
    return () => document.removeEventListener('mousemove', move);
  }, [isEnabled, power, area, x, y]);

  return { ref, x, y };
}

const OrbitAnimation = ({
  size = 300,
  orbitRadius = 130,
  coreIconSize = 100,
  orbitIconSize = 52,
  rotationDuration = 14,
  pulseDuration = 2,
  pulseColor = '#805FFF',
  magneticEnabled = true,
  magneticPower = 0.12,
  magneticArea = 180,
}) => {
  const containerRef = useRef(null);
  const [frameSize, setFrameSize] = useState(size);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([e]) => {
      setFrameSize(Math.min(e.contentRect.width, e.contentRect.height));
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const autoScale = frameSize / size;
  const radius = orbitRadius * autoScale;
  const scaledCoreSize = coreIconSize * autoScale;
  const scaledOrbitSize = orbitIconSize * autoScale;

  const fixedAngles = [225, 315, 45, 135];

  const rotation = useMotionValue(0);
  useEffect(() => {
    const controls = animate(rotation, 360, {
      duration: rotationDuration,
      repeat: Infinity,
      ease: 'linear',
    });
    return () => controls.stop();
  }, [rotationDuration, rotation]);

  const { ref: magnetRef, x: sx, y: sy } = useMagnet(
    magneticEnabled,
    magneticPower,
    magneticArea
  );

  const transforms = fixedAngles.map((base) => ({
    x: useTransform(rotation, (r) => Math.cos(((base + r) * Math.PI) / 180) * radius),
    y: useTransform(rotation, (r) => Math.sin(((base + r) * Math.PI) / 180) * radius),
    rotate: useTransform(rotation, (r) => -(base + r)),
  }));

  const pulseValue = useMotionValue(10);
  const pulseShadow = useTransform(
    pulseValue,
    (v) => `0 0 ${v}px ${pulseColor}, 0 0 ${v * 2}px ${pulseColor}`
  );

  useEffect(() => {
    const controls = animate(pulseValue, [10, 40, 10], {
      duration: pulseDuration,
      repeat: Infinity,
      ease: 'easeInOut',
    });
    return () => controls.stop();
  }, [pulseDuration, pulseValue]);

  const orbitIcons = [
    <svg viewBox="0 0 24 24" fill="white" style={{ width: '60%', height: '60%' }}>
      <path d="M4 4h4v4H4zM10 4h4v4h-4zM16 4h4v4h-4zM4 10h4v4H4zM10 10h4v4h-4zM16 10h4v4h-4z" />
    </svg>,
    <svg viewBox="0 0 24 24" fill="white" style={{ width: '60%', height: '60%' }}>
      <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.5L19.5 8v8L12 19.5 4.5 16V8L12 4.5z" />
    </svg>,
    <svg viewBox="0 0 24 24" fill="white" style={{ width: '60%', height: '60%' }}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v4M12 19v4M23 12h-4M5 12H1M20.5 3.5l-2.8 2.8M6.3 17.7l-2.8 2.8M20.5 20.5l-2.8-2.8M6.3 6.3L3.5 3.5" strokeWidth="2" stroke="white" fill="none" />
    </svg>,
    <svg viewBox="0 0 24 24" fill="white" style={{ width: '60%', height: '60%' }}>
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
      <line x1="6" y1="8" x2="6" y2="16" stroke="white" strokeWidth="1.5" />
      <line x1="18" y1="8" x2="18" y2="16" stroke="white" strokeWidth="1.5" />
      <line x1="8" y1="6" x2="16" y2="6" stroke="white" strokeWidth="1.5" />
      <line x1="8" y1="18" x2="16" y2="18" stroke="white" strokeWidth="1.5" />
    </svg>,
  ];

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minWidth: size,
        minHeight: size,
        aspectRatio: '1/1',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'visible',
      }}
    >
      {[radius * 2.05, radius * 1.42].map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 + i * 0.1 }}
          style={{
            position: 'absolute',
            width: s,
            height: s,
            left: `calc(50% - ${s / 2}px)`,
            top: `calc(50% - ${s / 2}px)`,
            borderRadius: '50%',
            border: `1px solid rgba(130, 108, 233, 0.35)`,
            pointerEvents: 'none',
          }}
        />
      ))}

      <motion.div
        ref={magnetRef}
        initial={{ opacity: 0, filter: 'blur(12px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.8 }}
        style={{
          x: sx,
          y: sy,
          width: scaledCoreSize,
          height: scaledCoreSize,
          borderRadius: '50%',
          background: '#070417',
          position: 'absolute',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
        }}
      >
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            boxShadow: pulseShadow,
          }}
        />
        
        <svg
          viewBox="0 0 24 24"
          fill="white"
          style={{
            width: scaledCoreSize - 30,
            height: scaledCoreSize - 30,
            zIndex: 1,
          }}
        >
          <path d="M12 2C10.5 2 9 3 9 5c0 1.5-1 2-2.5 2C4 7 2 9 2 12s2 5 4.5 5C8 17 9 17.5 9 19c0 2 1.5 3 3 3s3-1 3-3c0-1.5 1-2 2.5-2 2.5 0 4.5-2 4.5-5s-2-5-4.5-5C16 7 15 6.5 15 5c0-2-1.5-3-3-3z" />
        </svg>
      </motion.div>

      {orbitIcons.map((icon, i) => {
        const t = transforms[i];
        return (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.6,
              ease: 'easeOut',
              delay: 0.6 + i * 0.15,
            }}
            style={{
              x: t.x,
              y: t.y,
              rotate: t.rotate,
              width: scaledOrbitSize,
              height: scaledOrbitSize,
              borderRadius: '50%',
              background: '#070417',
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {icon}
          </motion.div>
        );
      })}
    </div>
  );
};

// DoorLock Component
const DoorLock = () => {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [handleRotation, setHandleRotation] = useState(0);
  const [lightOn, setLightOn] = useState(false);
  const [circleRotation, setCircleRotation] = useState(0);

  useEffect(() => {
    const sequence = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsUnlocking(true);
      setLightOn(true);
      await new Promise(resolve => setTimeout(resolve, 400));
      setCircleRotation(360);
      await new Promise(resolve => setTimeout(resolve, 800));
      setHandleRotation(25);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setHandleRotation(0);
      await new Promise(resolve => setTimeout(resolve, 400));
      setCircleRotation(0);
      setLightOn(false);
      setIsUnlocking(false);
    };

    sequence();
    const interval = setInterval(() => {
      sequence();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="relative" style={{ width: '115px', height: '263px' }}>
        {/* Main body with intense metallic 3D */}
        <div
          className="absolute inset-0 rounded-[22px]"
          style={{
            background: `
              linear-gradient(135deg, 
                rgb(160, 161, 167) 0%, 
                rgb(200, 201, 207) 15%,
                rgb(240, 241, 245) 30%,
                rgb(255, 255, 255) 50%,
                rgb(240, 241, 245) 70%,
                rgb(200, 201, 207) 85%,
                rgb(160, 161, 167) 100%
              )
            `,
            boxShadow: `
              inset -2px -2px 6px rgba(0, 0, 0, 0.3),
              inset 2px 2px 6px rgba(255, 255, 255, 0.9),
              inset 0px 0px 1px 1px rgba(174, 175, 178, 0.5),
              0px 15px 35px rgba(0, 0, 0, 0.4),
              0px 25px 60px rgba(0, 0, 0, 0.25),
              0px 5px 15px rgba(0, 0, 0, 0.3)
            `,
          }}
        >
          {/* Grain texture overlay */}
          <div
            className="absolute inset-0 rounded-[22px] opacity-5 pointer-events-none"
            style={{
              backgroundImage: 'url(https://framerusercontent.com/images/6mcf62RlDfRfU61Yg5vb2pefpi4.png?width=256&height=256)',
              backgroundSize: '256px 256px',
              backgroundRepeat: 'repeat',
            }}
          />
          
          {/* Metallic highlight streak */}
          <div
            className="absolute inset-0 rounded-[22px] opacity-40 pointer-events-none"
            style={{
              background: 'linear-gradient(120deg, transparent 20%, rgba(255, 255, 255, 0.8) 45%, rgba(255, 255, 255, 0.9) 50%, rgba(255, 255, 255, 0.8) 55%, transparent 80%)',
            }}
          />
        </div>

        {/* Bottom bar indicator with metallic depth */}
        <div
          className="absolute bottom-[15px] left-1/2 -translate-x-1/2 h-[3px] w-[60px] rounded-full"
          style={{ 
            background: 'linear-gradient(180deg, rgb(140, 141, 150) 0%, rgb(173, 174, 183) 50%, rgb(140, 141, 150) 100%)',
            boxShadow: `
              inset 0px 1px 2px rgba(0, 0, 0, 0.4),
              inset 0px -1px 1px rgba(255, 255, 255, 0.3),
              0px 2px 4px rgba(0, 0, 0, 0.3)
            `
          }}
        />

        {/* Handle with intense metallic 3D */}
        <motion.div
          className="absolute left-[48px] w-[172px] h-[32px] rounded-full"
          style={{
            top: 'calc(50.95% - 16px)',
            background: `
              linear-gradient(180deg, 
                rgb(220, 220, 220) 0%, 
                rgb(255, 255, 255) 20%,
                rgb(245, 245, 245) 40%, 
                rgb(230, 231, 235) 60%,
                rgb(201, 202, 208) 100%
              )
            `,
            boxShadow: `
              inset 0px 3px 6px rgba(255, 255, 255, 0.9),
              inset 0px -3px 8px rgba(0, 0, 0, 0.3),
              inset 0px 0px 2px 1px rgba(0, 0, 0, 0.2),
              0px 8px 20px rgba(0, 0, 0, 0.4),
              0px 12px 30px rgba(0, 0, 0, 0.25),
              0px 3px 8px rgba(0, 0, 0, 0.3)
            `,
            transformOrigin: '10% 50%',
          }}
          animate={{ rotate: handleRotation }}
          transition={{ duration: 0.5, type: 'spring', bounce: 0.8 }}
        >
          {/* Grain on handle */}
          <div
            className="absolute inset-0 rounded-full opacity-5"
            style={{
              backgroundImage: 'url(https://framerusercontent.com/images/6mcf62RlDfRfU61Yg5vb2pefpi4.png?width=256&height=256)',
              backgroundSize: '256px 256px',
              backgroundRepeat: 'repeat',
            }}
          />
          
          {/* Metallic shine on handle */}
          <div
            className="absolute inset-0 rounded-full opacity-50"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, transparent 40%, transparent 60%, rgba(255, 255, 255, 0.3) 100%)',
            }}
          />
        </motion.div>

        {/* Circle outer container with intense metallic 3D */}
        <div
          className="absolute w-[76px] h-[76px] rounded-full flex items-center justify-center"
          style={{
            left: 'calc(50.43% - 38px)',
            top: 'calc(51.33% - 38px)',
            background: `
              linear-gradient(135deg, 
                rgb(170, 171, 175) 0%, 
                rgb(204, 205, 209) 30%,
                rgb(220, 221, 225) 50%,
                rgb(188, 192, 193) 70%,
                rgb(160, 161, 165) 100%
              )
            `,
            boxShadow: `
              inset -2px -2px 5px rgba(0, 0, 0, 0.3),
              inset 2px 2px 5px rgba(255, 255, 255, 0.8),
              0px 3px 3px 0px rgba(255, 255, 255, 0.4),
              0px 8px 20px rgba(0, 0, 0, 0.35),
              0px 4px 10px rgba(0, 0, 0, 0.3)
            `,
            padding: '2.5px',
          }}
        >
          {/* Inner rotating light container with enhanced glow */}
          <motion.div
            className="relative w-[52px] h-[52px] rounded-full overflow-hidden"
            style={{
              background: isUnlocking 
                ? `
                  radial-gradient(circle at 30% 30%, 
                    rgba(220, 255, 210, 1) 0%, 
                    rgba(162, 250, 145, 1) 30%, 
                    rgba(120, 230, 100, 0.9) 70%,
                    rgba(80, 200, 70, 0.8) 100%
                  )
                ` 
                : 'linear-gradient(135deg, rgb(145, 146, 153) 0%, rgb(165, 166, 173) 50%, rgb(145, 146, 153) 100%)',
              boxShadow: isUnlocking 
                ? `
                  0px 0px 30px 15px rgba(162, 250, 145, 1), 
                  0px 0px 60px 25px rgba(162, 250, 145, 0.8),
                  0px 0px 90px 35px rgba(162, 250, 145, 0.5),
                  inset 0px 0px 25px rgba(220, 255, 210, 0.8),
                  inset 0px -5px 15px rgba(80, 200, 70, 0.6),
                  inset 0px 5px 15px rgba(255, 255, 255, 0.4)
                ` 
                : `
                  inset 0px 2px 4px rgba(0, 0, 0, 0.4),
                  inset 0px -2px 4px rgba(255, 255, 255, 0.2)
                `,
              transition: 'all 0.5s ease',
            }}
            animate={{ rotate: circleRotation }}
            transition={{ duration: 0.4, type: 'spring', bounce: 0, delay: 0.4 }}
          >
            {/* Progress circles - 3 segments */}
            {[0, 118, 238].map((startAngle, i) => (
              <div
                key={i}
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(from ${startAngle}deg at 50% 50%, rgb(29, 29, 31) ${startAngle}deg, transparent ${startAngle + 1.6}deg)`,
                }}
              />
            ))}
            
            {/* Extra glow layer when unlocking */}
            {isUnlocking && (
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.6) 0%, transparent 50%)',
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              />
            )}
          </motion.div>
        </div>

        {/* Enhanced shadow */}
        <div
          className="absolute bottom-[79px] right-[-82px] w-[160px] h-[30px] rounded-full"
          style={{
            backgroundColor: 'rgba(33, 33, 33, 0.5)',
            filter: 'blur(6px)',
            transform: 'rotate(30deg)',
          }}
        />

        {/* Top section with intense metallic 3D */}
        <div
          className="absolute top-[12px] left-1/2 -translate-x-1/2 w-[92px] h-[40px] overflow-hidden"
          style={{
            background: `
              linear-gradient(180deg, 
                rgb(78, 79, 83) 0%,
                rgb(98, 99, 103) 20%, 
                rgb(121, 122, 125) 40%,
                rgb(141, 142, 145) 58%, 
                rgb(95, 96, 100) 75%,
                rgb(75, 76, 80) 90%,
                rgb(65, 66, 70) 100%
              )
            `,
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            borderBottomLeftRadius: '28px',
            borderBottomRightRadius: '28px',
            boxShadow: `
              inset 0px 0px 2px 1px rgb(89, 90, 94),
              inset 0px 3px 6px rgba(0, 0, 0, 0.5),
              inset 0px -2px 4px rgba(255, 255, 255, 0.1),
              0px 5px 12px rgba(0, 0, 0, 0.4),
              0px 3px 6px rgba(0, 0, 0, 0.3)
            `,
          }}
        >
          {/* Enhanced light bar with intense glow */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60px] h-[3px] rounded-full"
            style={{
              backgroundColor: lightOn ? 'rgb(177, 244, 163)' : 'rgb(173, 174, 183)',
              boxShadow: lightOn 
                ? `
                  0px 0px 12px 6px rgba(177, 245, 164, 1),
                  0px 0px 25px 12px rgba(177, 245, 164, 0.8),
                  0px 0px 40px 18px rgba(177, 245, 164, 0.6),
                  inset 0px 0px 6px rgba(255, 255, 255, 1)
                ` 
                : `
                  inset 0px 1px 2px rgba(0, 0, 0, 0.4),
                  inset 0px -1px 1px rgba(255, 255, 255, 0.2)
                `,
            }}
            animate={{ opacity: lightOn ? 1 : 0.7 }}
            transition={{ duration: 0.5, type: 'spring', bounce: 0.8 }}
          />
        </div>
      </div>
    </div>
  );
};



const SecurityCard = () => {
  const [unlocked, setUnlocked] = useState(false);
  const [showLanyard, setShowLanyard] = useState(false);
  const [hideCard, setHideCard] = useState(false);

  useEffect(() => {
    // Auto-unlock animation sequence
    const sequence = async () => {
      // Reset states
      setHideCard(false);
      setShowLanyard(false);
      
      // Wait 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Unlock
      setUnlocked(true);
      // Wait 1.2 seconds
      await new Promise(resolve => setTimeout(resolve, 1200));
      // Hide the security card
      setHideCard(true);
      // Wait 400ms for card to disappear
      await new Promise(resolve => setTimeout(resolve, 400));
      // Show lanyard
      setShowLanyard(true);
      // Wait 3 seconds with lanyard visible
      await new Promise(resolve => setTimeout(resolve, 3000));
      // Hide lanyard
      setShowLanyard(false);
      // Wait 400ms
      await new Promise(resolve => setTimeout(resolve, 400));
      // Show card again and lock it
      setHideCard(false);
      setUnlocked(false);
    };

    // Run the sequence
    sequence();

    // Repeat every 9 seconds
    const interval = setInterval(() => {
      sequence();
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-[340px] h-[360px] mx-auto">
      {/* Lanyard appears above after card disappears */}
      <LanyardCard showLanyard={showLanyard} />
      
      <AnimatePresence>
        {!hideCard && (
          <motion.div
            key="security-card-wrapper"
            initial={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-6"
          >
            {/* Pill at the top */}
            <div className="w-full max-w-[400px] flex justify-center">
              <Pill />
            </div>
            
            {/* Security Card */}
            <div className="perspective-[1000px] w-full h-full"
            >
            {/* Main Container with 3D transform */}
            <div className="relative w-full bg-gradient-to-br from-zinc-900/90 via-zinc-950/95 to-black/90 rounded-[30px] border border-white/20 shadow-[0_8px_32px_0_rgba(139,92,246,0.2),0_20px_60px_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] backdrop-blur-xl flex flex-col overflow-hidden transform-gpu transition-transform duration-500 hover:scale-[1.02] hover:shadow-[0_12px_48px_0_rgba(139,92,246,0.4),0_30px_80px_0_rgba(0,0,0,0.7)] h-[360px]"
              style={{
                transformStyle: 'preserve-3d',
                transform: 'rotateX(2deg) rotateY(-2deg)',
              }}
            >
              {/* Permanent metallic shine overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-80 pointer-events-none" 
                style={{
                  maskImage: 'linear-gradient(135deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.2) 70%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(135deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.2) 70%, transparent 100%)',
                }}
              />
              
              {/* Glass reflection overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50 pointer-events-none" />

              {/* Animated Arrow Cursor */}
              <AnimatePresence>
                {!unlocked && (
                  <motion.div
                    className="absolute z-50 pointer-events-none"
                    initial={{ x: -100, y: -100, opacity: 0 }}
                    animate={{
                      x: [160, 180],
                      y: [180, 200],
                      opacity: [1, 1],
                    }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 1.5,
                      times: [0.7, 1],
                      ease: "easeInOut"
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white" className="drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)]">
                      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" stroke="black" strokeWidth="1"/>
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Click ripple effect */}
              <AnimatePresence>
                {!unlocked && (
                  <motion.div
                    className="absolute z-40 pointer-events-none"
                    style={{ left: '180px', top: '200px' }}
                    initial={{ scale: 0, opacity: 0.3 }}
                    animate={{ scale: 3, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, delay: 1.3 }}
                  >
                    <div className="w-8 h-8 rounded-full border border-white/30" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* RIPPLE LAYER */}
              <Ripple
                className="cursor-pointer"
                color="text-white"
                opacity={0.15}
                onClick={() => setUnlocked(!unlocked)}
              >
                {/* CARD CONTENT */}
                <div className="h-full w-full p-8 flex flex-col justify-between relative z-20 pointer-events-none"
                  style={{ transform: 'translateZ(20px)' }}
                >
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="text-zinc-400 text-xs font-medium uppercase tracking-[0.2em] drop-shadow-lg">
                        Security Level
                      </h3>
                      <p className="text-white font-bold text-xl drop-shadow-[0_2px_8px_rgba(255,255,255,0.3)]">Class A</p>
                    </div>
                    <div
                      className={`p-2 rounded-full border transition-all duration-500 backdrop-blur-sm shadow-lg ${
                        unlocked
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                      }`}
                      style={{ transform: 'translateZ(30px)' }}
                    >
                      {unlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                    </div>
                  </div>

                  {/* Central Graphic */}
                  <div className="flex-1 flex items-center justify-center py-8">
                    <div className="relative" style={{ transform: 'translateZ(40px)' }}>
                      {/* Glow layer */}
                      <div
                        className={`absolute inset-0 bg-indigo-500 blur-[40px] transition-opacity duration-700 ${
                          unlocked ? 'opacity-40' : 'opacity-0'
                        }`}
                      />
                      
                      {/* Fingerprint with enhanced effects */}
                      <Fingerprint
                        className={`w-24 h-24 transition-all duration-700 relative ${
                          unlocked
                            ? 'text-indigo-400 scale-110 drop-shadow-[0_0_15px_rgba(129,140,248,0.8)]'
                            : 'text-zinc-700 scale-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]'
                        }`}
                        strokeWidth={1}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="space-y-6">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent shadow-[0_1px_2px_rgba(255,255,255,0.1)]" />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-zinc-500 text-xs drop-shadow-md">Biometric Scan</p>
                        <p className="text-zinc-300 text-sm font-medium mt-0.5 drop-shadow-[0_2px_4px_rgba(255,255,255,0.2)]">
                          {unlocked ? "Access Granted" : "Touch to Authorize"}
                        </p>
                      </div>
                      <div 
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-white/10 transition-all backdrop-blur-sm shadow-lg"
                        style={{ transform: 'translateZ(25px)' }}
                      >
                        <ChevronRight className="w-5 h-5 text-zinc-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </Ripple>
              
              {/* Bottom edge highlight for glass effect */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const NotificationCards = () => {
  const [visibleCards, setVisibleCards] = useState([0, 1, 2, 3])
  const [progress, setProgress] = useState([0, 0, 0, 0])
  
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = [...prev]
        
        // Find the first card that hasn't completed
        const activeIndex = newProgress.findIndex(p => p < 100)
        
        if (activeIndex !== -1) {
          newProgress[activeIndex] += 5 // Increment by 5% every 100ms = 2 seconds total per card
          
          // When a card reaches 100%, remove it after a short delay
          if (newProgress[activeIndex] >= 100) {
            setTimeout(() => {
              setVisibleCards(current => current.filter(i => i !== activeIndex))
            }, 300)
          }
        } else {
          // All cards completed, reset after delay
          setTimeout(() => {
            setVisibleCards([0, 1, 2, 3])
            setProgress([0, 0, 0, 0])
          }, 1000)
        }
        
        return newProgress
      })
    }, 100)
    
    return () => clearInterval(interval)
  }, [])
  
  const cards = [
    {
      id: 0,
      gradient: 'from-[#2a3a4a] via-[#2d4a5a] to-[#3a6a8a]',
      iconBg: 'bg-blue-600',
      iconColor: 'text-blue-200',
      progressColor: 'bg-blue-500',
      title: 'New Message',
      description: 'You have received a new direct message',
      hasClose: true,
      icon: (
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      )
    },
    {
      id: 1,
      gradient: 'from-[#2a3a35] via-[#2d4a40] to-[#3a7a5a]',
      iconBg: 'bg-emerald-600',
      iconColor: 'text-emerald-200',
      progressColor: 'bg-emerald-500',
      title: 'Changes Saved',
      description: 'Your profile has been updated successfully',
      hasClose: true,
      icon: (
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      )
    },
    {
      id: 2,
      gradient: 'from-[#3a3025] via-[#4a4030] to-[#6a5a3a]',
      iconBg: 'bg-amber-600',
      iconColor: 'text-amber-200',
      progressColor: 'bg-amber-500',
      title: 'Storage Low',
      description: "You've used 90% of your space",
      hasClose: true,
      icon: (
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      )
    },
    {
      id: 3,
      gradient: 'from-[#3a2535] via-[#4a3040] to-[#6a4a5a]',
      iconBg: 'bg-rose-600',
      iconColor: 'text-rose-200',
      progressColor: 'bg-rose-500',
      title: 'Upload Failed',
      description: 'Please check your connection',
      hasClose: true,
      icon: (
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      )
    }
  ]

  return (
    <div className="space-y-3 w-full max-w-[500px]">
      <AnimatePresence>
        {cards.map((card) => 
          visibleCards.includes(card.id) && (
            <motion.div
              key={card.id}
              initial={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.3 }}
              className="relative"
              style={{
                transformStyle: 'preserve-3d',
                transform: 'perspective(1000px) rotateX(5deg) rotateY(-3deg)',
              }}
            >
              {/* MASSIVE 3D Shadow - the key to the effect! */}
              <div 
                className="absolute inset-0 rounded-[28px] translate-y-6 translate-x-2"
                style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  filter: 'blur(30px)',
                  transform: 'translateZ(-50px)',
                }}
              />
              
              {/* Main card */}
              <div
                className={`relative bg-gradient-to-r ${card.gradient} rounded-[28px] p-4 shadow-2xl transform-gpu transition-all duration-300 hover:translate-y-[-4px]`}
                style={{
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                }}
              >
                <div className="flex items-start gap-3 relative z-10">
                  <div className={`w-8 h-8 rounded-full ${card.iconBg} flex items-center justify-center flex-shrink-0 shadow-xl`}>
                    <svg className={`w-4 h-4 ${card.iconColor}`} fill="currentColor" viewBox="0 0 20 20">
                      {card.icon}
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white text-base font-semibold mb-0.5">{card.title}</h3>
                    <p className="text-gray-400 text-xs">{card.description}</p>
                  </div>
                  {card.hasClose && (
                    <button className="text-white hover:text-gray-200 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="mt-3 h-0.5 bg-black/30 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full ${card.progressColor} rounded-full shadow-lg`}
                    style={{ width: `${progress[card.id]}%` }}
                    transition={{ duration: 0.1, ease: 'linear' }}
                  />
                </div>
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  )
}

const DURATION = 6000 // 6 seconds per item

export default function Features() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isInView, setIsInView] = useState(true)
  const widgetRef = useRef(null)

  // Auto-rotation enabled
  useEffect(() => {
    // Reset progress immediately when activeIndex changes
    setProgress(0);

    // Calculate duration based on current activeIndex
    let duration;
    
    if (activeIndex === 0) {
      duration = 3000; // 3 seconds for first
    } else if (activeIndex === 1) {
      duration = 6000; // 6 seconds for second
    } else if (activeIndex === 2) {
      duration = 7000; // 7 seconds for third
    } else {
      duration = 6000; // 6 seconds for fourth
    }
    
    const intervalTime = 50; // Update every 50ms for smooth animation
    const totalSteps = duration / intervalTime;
    const increment = 100 / totalSteps;
    
    let currentProgress = 0;
    
    const interval = setInterval(() => {
      currentProgress += increment;
      if (currentProgress >= 100) {
        currentProgress = 100;
        setProgress(100);
      } else {
        setProgress(currentProgress);
      }
    }, intervalTime);

    // Set timeout to move to next feature when duration completes
    const timeout = setTimeout(() => {
      setActiveIndex((current) => (current + 1) % features.length);
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [activeIndex])

  return (
    <section id="features" className="py-20 bg-[#1a1a1a] relative" style={{ overflow: 'hidden', willChange: 'auto' }}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20" style={{ minHeight: '700px' }}>
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-14"
        >
          <p className="text-sm font-medium text-[#8b8fff] font-body mb-3 tracking-wide uppercase">
            Our Features
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-white tracking-tight leading-[1.1]">
            Built for the future
          </h2>
          <p className="mt-4 text-gray-400 font-body text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Powerful features designed to transform the way you work.
          </p>
        </motion.div>

        {/* Feature Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start" style={{ minHeight: '600px' }}>
          {/* Left Side - Text Content with FIXED HEIGHT for descriptions */}
          <div className="space-y-6 w-full pt-20">
            {features.map((feature, index) => (
              <div key={feature.id} className="relative w-full">
                {/* Title - Always visible */}
                <button
                  onClick={() => {
                    setActiveIndex(index)
                    setProgress(0)
                  }}
                  className={`text-left w-full text-xl md:text-2xl font-display transition-all duration-300 p-0 ${
                    activeIndex === index ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {feature.title}
                </button>

                {/* Description - FIXED HEIGHT container to prevent layout shift */}
                <div style={{ height: activeIndex === index ? '120px' : '0px', overflow: 'hidden', transition: 'height 0.4s ease' }} className="w-full">
                  {activeIndex === index && (
                    <p className="mt-4 text-gray-400 font-body text-base leading-relaxed w-full">
                      {feature.description}
                    </p>
                  )}
                </div>

                {/* Progress Line */}
                <div className="mt-4 h-[2px] bg-gray-800 relative overflow-hidden w-full">
                  <motion.div
                    className="absolute inset-0 bg-[#8b8fff] h-full"
                    initial={{ scaleX: 0 }}
                    animate={{
                      scaleX: activeIndex === index ? progress / 100 : 0,
                    }}
                    style={{ transformOrigin: 'left' }}
                    transition={{ 
                      duration: index === 2 ? 0.08 : 0.05,
                      ease: index === 2 ? "easeOut" : "linear"
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Right Side - Animated widget transitions */}
          <div ref={widgetRef} className="relative flex items-center justify-center" style={{ height: '500px', minHeight: '500px' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {features[activeIndex].type === 'notifications' ? (
                  <NotificationCards />
                ) : features[activeIndex].type === 'security' ? (
                  <SecurityCard />
                ) : features[activeIndex].type === 'orbit' ? (
                  <OrbitAnimation />
                ) : features[activeIndex].type === 'settlement' ? (
                  <NotificationWidget isInView={isInView} />
                ) : (
                  <img
                    src={features[activeIndex].image}
                    alt={features[activeIndex].title}
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
