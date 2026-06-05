import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import Lottie from 'lottie-react'

// Encrypted Text Component
const EncryptedText = () => {
  const [displayText, setDisplayText] = useState('wVISQaB96LVw2C')
  const targetText = 'wVISQaB96LVw2C'
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  useEffect(() => {
    let iteration = 0
    const interval = setInterval(() => {
      setDisplayText(prev => 
        prev.split('').map((char, index) => {
          if (index < iteration) {
            return targetText[index]
          }
          return chars[Math.floor(Math.random() * chars.length)]
        }).join('')
      )

      if (iteration >= targetText.length) {
        clearInterval(interval)
        setTimeout(() => {
          iteration = 0
        }, 2000)
      }

      iteration += 1 / 3
    }, 50)

    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      className="font-mono text-lg tracking-wider"
      style={{
        color: 'rgb(96, 165, 250)',
        textShadow: '0 0 10px rgba(96, 165, 250, 0.5)',
      }}
    >
      {displayText.split('').map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0.5 }}
          animate={{ 
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            delay: index * 0.05,
          }}
        >
          {char}
        </motion.span>
      ))}
    </motion.div>
  )
}

const LanyardCard = ({ showLanyard }) => {
  const [animationData, setAnimationData] = useState(null)

  useEffect(() => {
    fetch('/32937e7e-1187-11ee-835e-0b6b322951a1.json')
      .then(response => response.json())
      .then(data => {
        // Modify colors in the animation data
        const modifiedData = JSON.parse(JSON.stringify(data))
        
        // Function to recursively find and replace colors
        const replaceColors = (obj) => {
          if (typeof obj !== 'object' || obj === null) return
          
          for (let key in obj) {
            if (key === 'c' && obj[key].k && Array.isArray(obj[key].k)) {
              const color = obj[key].k
              // Yellow circular background to white [1, 0.941, 0.376, 1] -> [1, 1, 1, 1]
              if (Math.abs(color[0] - 1) < 0.1 && Math.abs(color[1] - 0.941) < 0.1 && Math.abs(color[2] - 0.376) < 0.1) {
                obj[key].k = [1, 1, 1, 1]
              }
              // Green shirt to purple [0.169, 0.71, 0.478, 1] -> [0.576, 0.439, 1, 1]
              else if (Math.abs(color[0] - 0.169) < 0.1 && Math.abs(color[1] - 0.71) < 0.1 && Math.abs(color[2] - 0.478) < 0.1) {
                obj[key].k = [0.576, 0.439, 1, 1]
              }
              // Yellow undershirt to skin color [0.965, 0.631, 0.588, 1] -> [0.957, 0.761, 0.647, 1]
              else if (Math.abs(color[0] - 0.965) < 0.1 && Math.abs(color[1] - 0.631) < 0.1 && Math.abs(color[2] - 0.588) < 0.1) {
                obj[key].k = [0.957, 0.761, 0.647, 1]
              }
            }
            replaceColors(obj[key])
          }
        }
        
        replaceColors(modifiedData)
        setAnimationData(modifiedData)
      })
      .catch(error => console.error('Error loading animation:', error))
  }, [])

  return (
    <AnimatePresence>
      {showLanyard && (
        <motion.div
          initial={{ y: -100, opacity: 0, scale: 0.8 }}
          animate={{ 
            y: 0, 
            opacity: 1, 
            scale: 1,
            rotate: [0, -2, 2, -1, 0],
          }}
          exit={{ y: -100, opacity: 0, scale: 0.8 }}
          transition={{ 
            duration: 0.8, 
            ease: [0.34, 1.56, 0.64, 1],
            rotate: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
          className="absolute top-[-40px] z-50 flex justify-center w-full"
          style={{
            transformOrigin: 'top center',
            left: '15%',
            transform: 'translateX(-50%)',
          }}
        >
          {/* Lanyard String */}
          <div className="relative flex flex-col items-center">
            {/* String/Rope */}
            <div 
              className="w-[6px] h-[80px] relative"
              style={{
                background: 'linear-gradient(180deg, rgba(60, 60, 70, 0.9) 0%, rgba(40, 40, 50, 1) 100%)',
                boxShadow: `
                  inset -1px 0 1px rgba(0, 0, 0, 0.5),
                  inset 1px 0 1px rgba(255, 255, 255, 0.1),
                  2px 0 4px rgba(0, 0, 0, 0.3)
                `,
              }}
            >
              {/* String texture lines */}
              <div className="absolute inset-0 flex flex-col justify-around">
                {[...Array(8)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-full h-[1px]" 
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.05)',
                    }} 
                  />
                ))}
              </div>
            </div>

            {/* ID Card with Metal Clip attached */}
            <motion.div
              animate={{
                rotateZ: [-2, 2, -2],
                rotateY: [-6, -2, -6],
                rotateX: [6, 10, 6],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative w-[260px] h-[370px] rounded-[20px] overflow-visible mt-[-10px]"
              style={{
                transformStyle: 'preserve-3d',
                transform: 'perspective(800px) rotateX(12deg) rotateY(-8deg) translateZ(60px)',
              }}
            >
              {/* Metal Clip - positioned at top of card */}
              <div 
                className="absolute w-[32px] h-[20px] rounded-t-full z-20"
                style={{
                  top: '-17.5px',
                  left: 'calc(35% + 0.51cm)',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(180deg, rgb(180, 180, 190) 0%, rgb(140, 140, 150) 50%, rgb(100, 100, 110) 100%)',
                  boxShadow: `
                    inset 0 2px 3px rgba(255, 255, 255, 0.6),
                    inset 0 -2px 3px rgba(0, 0, 0, 0.5),
                    0 4px 8px rgba(0, 0, 0, 0.4),
                    0 8px 16px rgba(0, 0, 0, 0.3)
                  `,
                  border: '1px solid rgba(80, 80, 90, 0.8)',
                }}
              >
                {/* Clip hole */}
                <div 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[7px] rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.7) 100%)',
                    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.8)',
                  }}
                />
              </div>

              {/* Card Body */}
              <div 
                className="w-full h-full rounded-[20px] overflow-hidden relative z-10"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.98) 0%, rgba(0, 0, 0, 1) 50%, rgba(0, 0, 0, 1) 100%)',
                  boxShadow: `
                    0 30px 80px rgba(0, 0, 0, 0.8),
                    0 15px 40px rgba(0, 0, 0, 0.6),
                    0 5px 15px rgba(0, 0, 0, 0.4),
                    inset 0 2px 4px rgba(255, 255, 255, 0.15),
                    inset 0 -2px 4px rgba(0, 0, 0, 0.6),
                    inset -3px 0 6px rgba(0, 0, 0, 0.3),
                    inset 3px 0 6px rgba(255, 255, 255, 0.05)
                  `,
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  transform: 'translateZ(20px)',
                }}
              >
              {/* Metallic shine overlay */}
              <div 
                className="absolute inset-0 opacity-40 pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.25) 40%, rgba(255, 255, 255, 0.4) 50%, rgba(255, 255, 255, 0.25) 60%, transparent 100%)',
                  transform: 'translateZ(5px)',
                }}
              />

              {/* Holographic pattern overlay */}
              <div 
                className="absolute inset-0 opacity-30 pointer-events-none"
                style={{
                  background: `
                    repeating-linear-gradient(
                      45deg,
                      transparent,
                      transparent 15px,
                      rgba(147, 112, 255, 0.15) 15px,
                      rgba(147, 112, 255, 0.15) 20px
                    )
                  `,
                }}
              />

              {/* Card Content */}
              <div className="relative z-10 p-6 h-full flex flex-col justify-between" style={{ transform: 'translateZ(10px)' }}>
                {/* Top Section - Logo/Brand */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, rgb(139, 92, 246) 0%, rgb(91, 95, 248) 100%)',
                        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4), 0 2px 6px rgba(139, 92, 246, 0.6)',
                        transform: 'translateZ(15px)',
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.5L19.5 8v8L12 19.5 4.5 16V8L12 4.5z" />
                      </svg>
                    </div>
                    <span className="text-white font-bold text-sm tracking-wider">TASKZY</span>
                  </div>
                  <div className="text-zinc-500 text-xs font-mono">
                    AUG 16 2025
                  </div>
                </div>

                {/* Middle Section - Encryption Animation */}
                <div className="flex-1 flex flex-col items-center justify-center gap-6 overflow-hidden pt-6">
                  {/* Encryption Text Animation */}
                  <div className="relative w-full h-[42px] flex items-center justify-center">
                    {/* Encrypted text display */}
                    <div 
                      className="relative px-5 py-1.5 rounded-lg overflow-hidden"
                      style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(96, 165, 250, 0.2)',
                        boxShadow: 'inset 0 0 20px rgba(96, 165, 250, 0.1)',
                      }}
                    >
                      {/* Animated scanning line for text - INSIDE the bar */}
                      <motion.div
                        className="absolute top-0 left-0 h-full pointer-events-none z-10"
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{
                          duration: 6,
                          repeat: Infinity,
                          ease: 'linear',
                          repeatDelay: 0.5
                        }}
                        style={{ width: '100%' }}
                      >
                        <div 
                          className="w-[4px] h-full"
                          style={{
                            background: 'linear-gradient(180deg, transparent 0%, rgba(96, 165, 250, 1) 50%, transparent 100%)',
                            boxShadow: '0 0 30px rgba(96, 165, 250, 0.9), 0 0 60px rgba(96, 165, 250, 0.6)',
                          }}
                        />
                      </motion.div>

                      <EncryptedText />
                      
                      {/* Glow effect */}
                      <div 
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: 'radial-gradient(circle at center, rgba(96, 165, 250, 0.1) 0%, transparent 70%)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Empty space where avatar was - keeping the layout */}
                  <div className="w-[180px] h-[180px] flex items-center justify-center -mt-12">
                    {animationData && (
                      <Lottie 
                        animationData={animationData} 
                        loop={true}
                        style={{ width: '100%', height: '100%' }}
                      />
                    )}
                  </div>
                </div>

                {/* Bottom Section - User Info */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-white font-bold text-xl tracking-tight">
                      Koen Bok
                    </h3>
                    <p className="text-zinc-400 text-sm font-medium mt-1">
                      koen.bok@taskzy.io
                    </p>
                  </div>
                  
                  <div className="pt-3 border-t border-white/10">
                    <p className="text-zinc-500 text-xs font-medium tracking-wider">
                      TASKZY.ENTERPRISE
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom edge highlight */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-[1px]"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.5) 50%, transparent 100%)',
                }}
              />
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default LanyardCard
