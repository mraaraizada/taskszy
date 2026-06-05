import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

const WaitlistButton = () => {
  const [isAnimating, setIsAnimating] = useState(false)
  const [showCursor, setShowCursor] = useState(false)

  useEffect(() => {
    // Show cursor and move it to button
    const cursorTimer = setTimeout(() => {
      setShowCursor(true)
    }, 300)

    // Start animation (tooltip opens) when cursor "clicks"
    const showTimer = setTimeout(() => {
      setIsAnimating(true)
    }, 1500)

    // Hide tooltip after 3 seconds
    const hideTimer = setTimeout(() => {
      setIsAnimating(false)
      setShowCursor(false)
    }, 3500)

    // Repeat animation every 4 seconds
    const interval = setInterval(() => {
      setShowCursor(true)
      setTimeout(() => {
        setIsAnimating(true)
      }, 1200)
      setTimeout(() => {
        setIsAnimating(false)
        setShowCursor(false)
      }, 3200)
    }, 4000)

    return () => {
      clearTimeout(cursorTimer)
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
      clearInterval(interval)
    }
  }, [])

  const avatars = [
    'https://framerusercontent.com/images/HALO860GG8HdyB6G1ao9hkSrTlE.jpeg',
    'https://framerusercontent.com/images/EJefr5fJvuOwno77six4SXpLZnA.jpeg',
    'https://framerusercontent.com/images/4Po9T33MeVG2JWguUJI7ukos.jpeg',
    'https://framerusercontent.com/images/lpITPEykwDSRklvUdN7SyrEvXgo.jpeg',
    'https://framerusercontent.com/images/bcx325UNyNBkyiA3RLmnSx3AivQ.jpeg',
    'https://framerusercontent.com/images/CS03YetD156YhcmuODVbPGVyXc.png',
  ]

  return (
    <div className="relative inline-block">
      {/* Animated Cursor */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: '24px',
          height: '24px',
          zIndex: 100,
        }}
        initial={{ opacity: 0, x: -40, y: 40 }}
        animate={{
          opacity: showCursor ? 1 : 0,
          x: showCursor ? 30 : -40,
          y: showCursor ? 22 : 40,
          scale: isAnimating ? 0.9 : 1,
        }}
        transition={{
          opacity: { duration: 0.2 },
          x: { duration: 0.8, ease: 'easeInOut' },
          y: { duration: 0.8, ease: 'easeInOut' },
          scale: { duration: 0.1 },
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5.5 3.5L18.5 12L11 13.5L8.5 20.5L5.5 3.5Z"
            fill="white"
            stroke="black"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>

      {/* Tooltip */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-2.5 px-5 py-3.5 rounded-xl pointer-events-none"
        style={{
          backgroundColor: 'rgb(80, 85, 90)',
          bottom: '52px',
          minWidth: '195px',
        }}
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: isAnimating ? 1 : 0,
          bottom: isAnimating ? '60px' : '52px',
        }}
        transition={{ 
          duration: 0.3,
          delay: 0,
        }}
      >
        {/* Title */}
        <motion.p
          className="text-sm font-medium whitespace-nowrap"
          style={{ color: 'rgb(255, 255, 255)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isAnimating ? 1 : 0 }}
          transition={{ 
            duration: 0.3,
            delay: isAnimating ? 0.1 : 0,
          }}
        >
          15k+ already joined
        </motion.p>

        {/* Avatars */}
        <div className="relative flex items-center justify-center h-7 w-full gap-0.5">
          {avatars.map((avatar, index) => (
            <motion.div
              key={index}
              className="rounded-full overflow-hidden"
              style={{
                width: '27px',
                height: '27px',
                boxShadow: '0px 0px 0px 2.5px rgb(80, 85, 90)',
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: isAnimating ? 1 : 0,
                y: isAnimating ? 0 : 20,
              }}
              transition={{ 
                duration: 0.3,
                delay: isAnimating ? 0.15 + (index * 0.05) : 0,
              }}
            >
              <img 
                src={avatar} 
                alt={`Avatar ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </motion.div>
          ))}
        </div>

        {/* Tooltip arrow */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: '-6px',
            width: '12px',
            height: '12px',
            backgroundColor: 'rgb(80, 85, 90)',
            transform: 'translateX(-50%) rotate(45deg)',
          }}
        />
      </motion.div>

      {/* Button */}
      <motion.button
        className="px-6 py-2.5 rounded-full font-bold text-white cursor-pointer text-sm"
        style={{
          backgroundColor: 'rgb(0, 128, 255)',
        }}
        animate={{
          backgroundColor: isAnimating ? 'rgb(4, 99, 194)' : 'rgb(0, 128, 255)',
        }}
        transition={{ duration: 0.3 }}
      >
        Join waitlist
      </motion.button>
    </div>
  )
}

export default WaitlistButton
