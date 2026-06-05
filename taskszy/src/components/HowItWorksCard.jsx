import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef, useState } from 'react'
import BlurText from './BlurText'

const cards = [
  {
    id: 1,
    badges: [
      { letter: 'A', label: 'EQUITIES', expanded: true },
      { letter: 'B', expanded: false },
      { letter: 'C', expanded: false },
      { letter: 'D', expanded: false },
    ],
    title: 'Equities on GTE',
    description: 'Trade anything from anywhere in the world. 24/7, permissionless, no brokerage account required. Apple, Tesla, Nvidia, and more.',
  },
  {
    id: 2,
    badges: [
      { letter: 'A', expanded: false },
      { letter: 'B', label: 'CRYPTO', expanded: true },
      { letter: 'C', expanded: false },
      { letter: 'D', expanded: false },
    ],
    title: 'Crypto on GTE',
    description: 'Go long or short on BTC, ETH, SOL, and other popular crypto assets with deep liquidity. The assets you know with the execution you deserve.',
  },
  {
    id: 3,
    badges: [
      { letter: 'A', expanded: false },
      { letter: 'B', expanded: false },
      { letter: 'C', label: 'INDICES', expanded: true },
      { letter: 'D', expanded: false },
    ],
    title: 'Indices on GTE',
    description: 'Get leveraged exposure to entire markets in a single position. Trade the S&P500, Nasdaq, and more without the hassle of individual tickers.',
  },
  {
    id: 4,
    badges: [
      { letter: 'A', expanded: false },
      { letter: 'B', expanded: false },
      { letter: 'C', expanded: false },
      { letter: 'D', label: 'COLOCATION', expanded: true },
    ],
    title: 'Colocation with GTE',
    description: 'Tokyo for crypto, New Jersey for equities, Chicago for commodities — multiple sequencers around the world get you the best price possible.',
  },
]

export default function HowItWorksCard({ onActiveCardChange }) {
  const containerRef = useRef(null)
  const [activeButton, setActiveButton] = useState(null)
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })
  
  // Determine which card to show based on scroll progress
  const activeCardIndex = useTransform(scrollYProgress, (latest) => {
    const index = latest < 0.25 ? 0 : latest < 0.5 ? 1 : latest < 0.75 ? 2 : 3
    
    if (onActiveCardChange) {
      onActiveCardChange(index)
    }
    return index
  })
  
  // Map card index to button letter
  const scrollActiveButton = useTransform(activeCardIndex, (index) => {
    return ['A', 'B', 'C', 'D'][index]
  })

  // Border colors for each card: A=Red, B=Yellow, C=Blue, D=Green
  const borderColor1 = useTransform(activeCardIndex, [0, 1, 2, 3], [
    '#ff5040', // Red for A
    '#fff078', // Yellow for B
    '#64b4ff', // Blue for C
    '#78f096'  // Green for D
  ])
  
  const borderColor2 = useTransform(activeCardIndex, [0, 1, 2, 3], [
    '#ff6450', // Red for A
    '#fff0b4', // Yellow for B
    '#78beff', // Blue for C
    '#8cfa0aa'  // Green for D
  ])
  
  return (
    <div ref={containerRef} className="h-[400vh] relative flex items-start justify-center">
      <div className="sticky top-[10vh] flex items-center justify-center">
        <motion.div 
          className="relative overflow-hidden w-[1220px] h-[600px]"
          style={{
            background: 'linear-gradient(180deg, rgb(248, 248, 248) 0%, rgb(242, 242, 242) 50%, rgb(238, 238, 238) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            boxShadow: '0px 2px 0px 0px rgba(255, 255, 255, 1), 0px -2px 0px 0px rgba(0, 0, 0, 0.08), inset 0px 2px 4px 0px rgba(255, 255, 255, 1), inset 0px -2px 4px 0px rgba(0, 0, 0, 0.15), 0px 20px 60px 0px rgba(0, 0, 0, 0.25), 0px 8px 30px 0px rgba(0, 0, 0, 0.2), 0px 4px 15px 0px rgba(0, 0, 0, 0.15)',
            transform: 'perspective(1000px) rotateX(0deg)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Animated top border */}
          <div className="absolute top-0 left-0 right-0 h-[5px] overflow-hidden">
            <motion.div
              className="absolute h-full w-full"
              style={{
                background: useTransform(
                  [borderColor1, borderColor2],
                  ([c1, c2]) => `linear-gradient(90deg, transparent 0%, ${c1} 25%, ${c2} 50%, transparent 75%)`
                ),
              }}
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </div>

          {/* Animated bottom border */}
          <div className="absolute bottom-0 left-0 right-0 h-[5px] overflow-hidden">
            <motion.div
              className="absolute h-full w-full"
              style={{
                background: useTransform(
                  borderColor2,
                  (c2) => `linear-gradient(90deg, transparent 0%, ${c2} 50%, transparent 100%)`
                ),
              }}
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </div>

          {/* Animated left border */}
          <div className="absolute top-0 left-0 bottom-0 w-[5px] overflow-hidden">
            <motion.div
              className="absolute w-full h-full"
              style={{
                background: useTransform(
                  [borderColor1, borderColor2],
                  ([c1, c2]) => `linear-gradient(180deg, transparent 0%, ${c1} 25%, ${c2} 50%, transparent 75%)`
                ),
              }}
              animate={{
                y: ['-100%', '100%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </div>

          {/* Animated right border */}
          <div className="absolute top-0 right-0 bottom-0 w-[5px] overflow-hidden">
            <motion.div
              className="absolute w-full h-full"
              style={{
                background: useTransform(
                  borderColor2,
                  (c2) => `linear-gradient(180deg, transparent 0%, ${c2} 50%, transparent 100%)`
                ),
              }}
              animate={{
                y: ['-100%', '100%'],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </div>

          {/* Cards */}
          {cards.map((card, index) => {
            const isActive = useTransform(activeCardIndex, (latest) => latest === index)
            
            return (
              <motion.div
                key={card.id}
                style={{
                  display: useTransform(isActive, (active) => active ? 'grid' : 'none'),
                }}
                className="absolute inset-0 grid-cols-[350px_1fr] h-full"
              >
              {/* Left Side - Text Content */}
              <div className="p-12 flex flex-col justify-between">
                {/* Sound Deck Component - Horizontal Layout with 4 Buttons */}
                <div className="w-[320px] h-[68px] relative mb-8 -ml-4" style={{
                  borderRadius: '14px',
                  overflow: 'hidden',
                }}>
                  {/* Behind Part - Shadow layer */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[310px] h-[64px]" style={{
                    backgroundColor: 'rgb(200, 195, 188)',
                    borderRadius: '14px',
                    boxShadow: 'inset 0px 2px 2px 4px rgba(180, 175, 168, 0.86)',
                  }} />
                  
                  {/* Upper Part - Main container */}
                  <div className="absolute inset-0" style={{
                    background: 'linear-gradient(180deg, rgb(220, 215, 208) 0%, rgb(205, 200, 193) 100%)',
                    borderRadius: '14px',
                    boxShadow: 'inset 0px 1px 1px 0px rgba(255, 255, 255, 0.3), inset 0px -1px 1px 0px rgb(190, 185, 178)',
                  }}>
                    {/* Inside - Lighter inner container */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[302px] h-[58px] flex items-center gap-1 overflow-visible" style={{
                      backgroundColor: 'rgb(235, 230, 223)',
                      borderRadius: '9px',
                      boxShadow: '0px 0px 4px 0px rgba(0, 0, 0, 0.08)',
                      zIndex: 2,
                      padding: '2.5px',
                    }}>
                      {/* EQ Dial Section */}
                      <div className="relative w-[58px] h-[53px]" style={{
                        backgroundColor: 'rgb(245, 242, 238)',
                        borderRadius: '7px',
                        boxShadow: 'inset 0px 1px 0px 0px rgb(230, 227, 223), inset 0px -1px 0px 0px rgb(230, 227, 223), inset 0px 0px 19px 0px rgba(200, 200, 200, 0.2)',
                      }}>
                        {/* EQ Label */}
                        <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[11px] font-mono" style={{
                          color: 'rgb(40, 40, 40)',
                          fontFamily: 'monospace',
                        }}>EQ</div>
                        
                        {/* Inner Housing for knob */}
                        <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-[34px] h-[34px] rounded-full" style={{
                          backgroundColor: 'rgb(225, 220, 213)',
                          boxShadow: 'inset 0px -1px 1px 0px rgb(210, 205, 198), inset 0px 1px 1px 0px rgb(210, 205, 198)',
                        }} />
                        
                        {/* Volume Knob */}
                        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-[28px] h-[28px] rounded-full cursor-pointer" style={{
                          background: 'linear-gradient(180deg, rgb(240, 237, 233) 0%, rgb(235, 232, 228) 100%)',
                          boxShadow: 'inset 0px -1px 1px 0px rgb(220, 215, 208), inset 0px 1px 1px 0px rgb(220, 215, 208), inset 0px 4px 8px 0px rgba(0, 0, 0, 0.08)',
                          zIndex: 6,
                        }}>
                          {/* Knob indicator line - rotates based on scroll */}
                          <motion.div 
                            className="absolute top-[2.5px] left-1/2 -translate-x-1/2 w-[2px] h-1 rounded-full origin-bottom" 
                            style={{
                              backgroundColor: 'rgb(255, 111, 0)',
                              boxShadow: 'inset 0px 1px 0px 2px rgb(240, 126, 46), 0px 1px 4px 0px rgba(240, 151, 67, 0.73)',
                              rotate: useTransform(activeCardIndex, [0, 1, 2, 3], [90, 180, 270, 360]),
                              transformOrigin: 'center 14px',
                            }} 
                          />
                        </div>
                      </div>
                      
                      {/* A Button - ORANGE rusty mechanical glow */}
                      <motion.button 
                        onClick={() => setActiveButton(activeButton === 'A' ? null : 'A')}
                        className="relative w-[53px] h-[53px] flex items-center justify-center cursor-pointer overflow-visible"
                        style={{
                          borderRadius: '7px',
                          backgroundColor: 'rgb(245, 242, 238)',
                        }}
                      >
                        {/* Rusty mechanical glow effect */}
                        <motion.div
                          className="absolute inset-0 rounded-[7px]"
                          style={{
                            background: useTransform(scrollActiveButton, (active) => 
                              active === 'A' 
                                ? 'radial-gradient(ellipse at center, rgba(255, 140, 120, 1) 0%, rgba(255, 80, 60, 1) 20%, rgba(220, 50, 40, 1) 40%, rgba(180, 35, 30, 1) 60%, rgba(140, 25, 20, 1) 80%, rgba(100, 20, 15, 1) 100%), linear-gradient(180deg, rgba(80, 15, 10, 0.7) 0%, rgba(140, 30, 20, 0.6) 30%, rgba(200, 60, 40, 0.4) 50%, rgba(255, 90, 60, 0.7) 70%, rgba(255, 130, 100, 1) 100%), radial-gradient(ellipse 70% 50% at 25% 18%, rgba(20, 3, 2, 0.85) 0%, rgba(40, 8, 5, 0.65) 25%, transparent 55%), radial-gradient(ellipse 55% 40% at 75% 12%, rgba(25, 5, 3, 0.82) 0%, rgba(45, 10, 7, 0.6) 30%, transparent 60%), radial-gradient(ellipse 60% 45% at 50% 85%, rgba(30, 6, 4, 0.78) 0%, rgba(50, 12, 8, 0.5) 35%, transparent 65%), radial-gradient(ellipse 40% 30% at 15% 45%, rgba(22, 4, 3, 0.75) 0%, rgba(42, 9, 6, 0.45) 40%, transparent 70%), radial-gradient(ellipse 35% 25% at 85% 55%, rgba(35, 7, 5, 0.7) 0%, transparent 50%), radial-gradient(ellipse 30% 35% at 40% 60%, rgba(18, 4, 2, 0.72) 0%, transparent 55%), radial-gradient(ellipse 25% 20% at 65% 35%, rgba(28, 6, 4, 0.68) 0%, transparent 50%)'
                                : 'transparent'
                            ),
                            boxShadow: useTransform(scrollActiveButton, (active) =>
                              active === 'A'
                                ? '0 0 30px rgba(255, 90, 60, 0.7), 0 0 20px rgba(220, 50, 40, 0.6), 0 0 10px rgba(255, 70, 50, 0.8), inset 0 2px 15px rgba(255, 180, 150, 0.4), inset 0 -2px 20px rgba(140, 30, 20, 0.7), inset 0 0 50px rgba(255, 130, 100, 0.2), inset 0 0 100px rgba(160, 35, 25, 0.4), inset 2px 0 10px rgba(255, 90, 60, 0.3), inset -2px 0 10px rgba(180, 40, 30, 0.5)'
                                : 'none'
                            ),
                            filter: useTransform(scrollActiveButton, (active) =>
                              active === 'A' ? 'blur(0.3px) brightness(1.3) contrast(1.15) saturate(1.2)' : 'none'
                            ),
                          }}
                        />
                        <motion.span 
                          style={{
                            color: useTransform(scrollActiveButton, (active) =>
                              active === 'A' ? 'rgba(255, 250, 230, 1)' : 'rgb(40, 40, 40)'
                            ),
                            textShadow: useTransform(scrollActiveButton, (active) =>
                              active === 'A' ? '0 0 30px rgba(255, 200, 120, 1), 0 0 20px rgba(255, 160, 80, 1), 0 0 10px rgba(255, 140, 60, 1), 0 0 5px rgba(255, 180, 90, 0.8), 0 3px 10px rgba(0, 0, 0, 0.9), 0 1px 3px rgba(255, 220, 150, 0.7)' : 'none'
                            ),
                          }}
                          className="text-[22px] font-mono font-bold relative z-10"
                        >A</motion.span>
                      </motion.button>
                      
                      {/* B Button - WHITE metallic mechanical glow */}
                      <motion.button 
                        onClick={() => setActiveButton(activeButton === 'B' ? null : 'B')}
                        className="relative w-[53px] h-[53px] flex items-center justify-center cursor-pointer overflow-visible"
                        style={{
                          borderRadius: '7px',
                          backgroundColor: 'rgb(245, 242, 238)',
                        }}
                      >
                        {/* Smooth light yellow glow - NO patches */}
                        <motion.div
                          className="absolute inset-0 rounded-[7px]"
                          style={{
                            background: useTransform(scrollActiveButton, (active) => 
                              active === 'B' 
                                ? 'radial-gradient(ellipse at center, rgba(255, 250, 180, 1) 0%, rgba(255, 240, 120, 1) 30%, rgba(240, 220, 80, 1) 60%, rgba(200, 180, 50, 1) 100%)'
                                : 'transparent'
                            ),
                            boxShadow: useTransform(scrollActiveButton, (active) =>
                              active === 'B'
                                ? '0 0 40px rgba(255, 240, 120, 0.8), 0 0 25px rgba(240, 220, 80, 0.7), 0 0 15px rgba(255, 235, 100, 0.9)'
                                : 'none'
                            ),
                            filter: useTransform(scrollActiveButton, (active) =>
                              active === 'B' ? 'blur(0.5px) brightness(1.3) saturate(1.1)' : 'none'
                            ),
                          }}
                        />
                        <motion.span 
                          style={{
                            color: useTransform(scrollActiveButton, (active) =>
                              active === 'B' ? 'rgba(20, 20, 30, 1)' : 'rgb(40, 40, 40)'
                            ),
                            textShadow: useTransform(scrollActiveButton, (active) =>
                              active === 'B' ? '0 0 30px rgba(255, 255, 200, 1), 0 0 20px rgba(255, 240, 150, 1), 0 0 10px rgba(240, 220, 100, 1), 0 0 5px rgba(255, 245, 180, 0.8), 0 3px 10px rgba(0, 0, 0, 0.8), 0 1px 3px rgba(255, 250, 200, 0.7)' : 'none'
                            ),
                          }}
                          className="text-[22px] font-mono font-bold relative z-10"
                        >B</motion.span>
                      </motion.button>
                      
                      {/* C Button - BLUE electric mechanical glow */}
                      <motion.button 
                        onClick={() => setActiveButton(activeButton === 'C' ? null : 'C')}
                        className="relative w-[53px] h-[53px] flex items-center justify-center cursor-pointer overflow-visible"
                        style={{
                          borderRadius: '7px',
                          backgroundColor: 'rgb(245, 242, 238)',
                        }}
                      >
                        {/* Electric mechanical glow effect */}
                        <motion.div
                          className="absolute inset-0 rounded-[7px]"
                          style={{
                            background: useTransform(scrollActiveButton, (active) => 
                              active === 'C' 
                                ? 'radial-gradient(ellipse at center, rgba(180, 220, 255, 1) 0%, rgba(100, 180, 255, 1) 20%, rgba(60, 140, 220, 1) 40%, rgba(30, 80, 160, 1) 60%, rgba(15, 40, 100, 1) 80%, rgba(10, 20, 50, 1) 100%), linear-gradient(180deg, rgba(15, 30, 60, 0.9) 0%, rgba(30, 60, 120, 0.7) 30%, rgba(60, 120, 200, 0.5) 50%, rgba(100, 160, 240, 0.8) 70%, rgba(140, 200, 255, 1) 100%), radial-gradient(ellipse 70% 50% at 25% 18%, rgba(1, 4, 10, 0.95) 0%, rgba(5, 10, 20, 0.75) 25%, transparent 55%), radial-gradient(ellipse 55% 40% at 75% 12%, rgba(2, 6, 14, 0.92) 0%, rgba(8, 15, 28, 0.7) 30%, transparent 60%), radial-gradient(ellipse 60% 45% at 50% 85%, rgba(3, 7, 16, 0.88) 0%, rgba(10, 18, 32, 0.6) 35%, transparent 65%), radial-gradient(ellipse 40% 30% at 15% 45%, rgba(4, 8, 18, 0.85) 0%, rgba(8, 16, 30, 0.5) 40%, transparent 70%), radial-gradient(ellipse 35% 25% at 85% 55%, rgba(5, 10, 22, 0.8) 0%, transparent 50%), radial-gradient(ellipse 30% 35% at 40% 60%, rgba(2, 5, 12, 0.82) 0%, transparent 55%), radial-gradient(ellipse 25% 20% at 65% 35%, rgba(4, 9, 20, 0.78) 0%, transparent 50%)'
                                : 'transparent'
                            ),
                            boxShadow: useTransform(scrollActiveButton, (active) =>
                              active === 'C'
                                ? '0 0 30px rgba(100, 180, 255, 0.7), 0 0 20px rgba(60, 140, 220, 0.6), 0 0 10px rgba(120, 190, 255, 0.8), inset 0 2px 15px rgba(200, 230, 255, 0.4), inset 0 -2px 20px rgba(20, 60, 140, 0.8), inset 0 0 50px rgba(160, 210, 255, 0.2), inset 0 0 100px rgba(20, 60, 140, 0.5), inset 2px 0 10px rgba(100, 180, 255, 0.3), inset -2px 0 10px rgba(30, 80, 160, 0.6)'
                                : 'none'
                            ),
                            filter: useTransform(scrollActiveButton, (active) =>
                              active === 'C' ? 'blur(0.3px) brightness(1.25) contrast(1.2) saturate(1.15)' : 'none'
                            ),
                          }}
                        />
                        <motion.span 
                          style={{
                            color: useTransform(scrollActiveButton, (active) =>
                              active === 'C' ? 'rgba(240, 250, 255, 1)' : 'rgb(40, 40, 40)'
                            ),
                            textShadow: useTransform(scrollActiveButton, (active) =>
                              active === 'C' ? '0 0 30px rgba(180, 230, 255, 1), 0 0 20px rgba(140, 200, 255, 1), 0 0 10px rgba(100, 180, 255, 1), 0 0 5px rgba(160, 210, 255, 0.8), 0 3px 10px rgba(0, 0, 0, 0.9), 0 1px 3px rgba(200, 230, 255, 0.7)' : 'none'
                            ),
                          }}
                          className="text-[22px] font-mono font-bold relative z-10"
                        >C</motion.span>
                      </motion.button>
                      
                      {/* D Button - GREEN toxic mechanical glow */}
                      <motion.button 
                        onClick={() => setActiveButton(activeButton === 'D' ? null : 'D')}
                        className="relative w-[53px] h-[53px] flex items-center justify-center cursor-pointer overflow-visible"
                        style={{
                          borderRadius: '7px',
                          backgroundColor: 'rgb(245, 242, 238)',
                        }}
                      >
                        {/* Bright green glow effect with very light patches */}
                        <motion.div
                          className="absolute inset-0 rounded-[7px]"
                          style={{
                            background: useTransform(scrollActiveButton, (active) => 
                              active === 'D' 
                                ? 'radial-gradient(ellipse at center, rgba(180, 255, 200, 1) 0%, rgba(120, 240, 150, 1) 20%, rgba(80, 200, 110, 1) 40%, rgba(50, 140, 70, 1) 60%, rgba(25, 80, 40, 1) 80%, rgba(15, 40, 20, 1) 100%), linear-gradient(180deg, rgba(20, 50, 30, 0.4) 0%, rgba(40, 100, 60, 0.3) 30%, rgba(80, 160, 100, 0.2) 50%, rgba(120, 210, 140, 0.5) 70%, rgba(160, 250, 180, 1) 100%), radial-gradient(ellipse 70% 50% at 25% 18%, rgba(10, 30, 15, 0.35) 0%, rgba(20, 50, 30, 0.25) 25%, transparent 55%), radial-gradient(ellipse 55% 40% at 75% 12%, rgba(12, 35, 20, 0.32) 0%, rgba(25, 60, 35, 0.2) 30%, transparent 60%)'
                                : 'transparent'
                            ),
                            boxShadow: useTransform(scrollActiveButton, (active) =>
                              active === 'D'
                                ? '0 0 30px rgba(120, 240, 150, 0.7), 0 0 20px rgba(80, 200, 110, 0.6), 0 0 10px rgba(140, 250, 170, 0.8), inset 0 2px 15px rgba(200, 255, 220, 0.4), inset 0 -2px 20px rgba(30, 80, 40, 0.5), inset 0 0 50px rgba(180, 255, 200, 0.2), inset 0 0 100px rgba(40, 100, 60, 0.3), inset 2px 0 10px rgba(120, 240, 150, 0.3), inset -2px 0 10px rgba(50, 140, 70, 0.4)'
                                : 'none'
                            ),
                            filter: useTransform(scrollActiveButton, (active) =>
                              active === 'D' ? 'blur(0.3px) brightness(1.3) contrast(1.15) saturate(1.15)' : 'none'
                            ),
                          }}
                        />
                        <motion.span 
                          style={{
                            color: useTransform(scrollActiveButton, (active) =>
                              active === 'D' ? 'rgba(240, 255, 245, 1)' : 'rgb(40, 40, 40)'
                            ),
                            textShadow: useTransform(scrollActiveButton, (active) =>
                              active === 'D' ? '0 0 30px rgba(180, 255, 210, 1), 0 0 20px rgba(140, 240, 180, 1), 0 0 10px rgba(120, 230, 160, 1), 0 0 5px rgba(160, 250, 190, 0.8), 0 3px 10px rgba(0, 0, 0, 0.9), 0 1px 3px rgba(200, 255, 220, 0.7)' : 'none'
                            ),
                          }}
                          className="text-[22px] font-mono font-bold relative z-10"
                        >D</motion.span>
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Main Heading */}
                <div className="flex-1 flex items-center">
                  <BlurText
                    text={card.title}
                    delay={150}
                    animateBy="words"
                    direction="top"
                    className="font-serif text-4xl md:text-5xl text-black leading-tight font-bold"
                  />
                </div>

                {/* Description */}
                <div>
                  <BlurText
                    text={card.description}
                    delay={100}
                    animateBy="words"
                    direction="top"
                    className="text-gray-700 text-sm leading-relaxed font-medium"
                  />
                </div>
              </div>

              <div className="relative flex items-start justify-center pl-6 pt-6 pb-6 pr-6">
                <div className="w-full h-[550px] bg-white flex items-center justify-center overflow-hidden">
                  <svg
                    viewBox="0 0 400 400"
                    className="w-full h-full"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Placeholder graphic - customize per card */}
                    <circle cx="200" cy="200" r="80" fill="#3a3a3a" opacity="0.8" />
                    <circle cx="180" cy="180" r="8" fill="white" />
                    <circle cx="220" cy="180" r="8" fill="#ff6b35" />
                    <circle cx="200" cy="220" r="8" fill="#9ca3af" />
                  </svg>
                </div>
              </div>
            </motion.div>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}
