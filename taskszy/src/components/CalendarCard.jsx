import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

export default function CalendarCard({ delay = 0 }) {
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  const day = currentDate.getDate()
  const month = currentDate.toLocaleDateString('en-US', { month: 'short' })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="relative flex items-center justify-center"
      style={{ width: '100px', height: '78px' }}
    >
      {/* Main calendar body */}
      <div
        className="relative w-full h-full"
        style={{
          backgroundColor: 'rgb(36, 96, 237)',
          borderRadius: '16px',
        }}
      >
        {/* Left clip/ring */}
        <div
          className="absolute"
          style={{
            width: '10px',
            height: '22px',
            backgroundColor: 'rgb(255, 255, 255)',
            borderRadius: '12px',
            top: '-11px',
            left: '27px',
            zIndex: 1,
            border: '1px solid rgba(180, 180, 180, 0.5)',
          }}
        />

        {/* Right clip/ring */}
        <div
          className="absolute"
          style={{
            width: '10px',
            height: '22px',
            backgroundColor: 'rgb(255, 255, 255)',
            borderRadius: '12px',
            top: '-11px',
            right: '27px',
            zIndex: 1,
            border: '1px solid rgba(180, 180, 180, 0.5)',
          }}
        />

        {/* Glassmorphic bottom section with date */}
        <div
          className="absolute flex flex-col items-center justify-start"
          style={{
            bottom: '-39px',
            left: 0,
            width: '100%',
            height: '91px',
            background: 'linear-gradient(180deg, rgba(139, 164, 234, 0.5) 0%, rgba(139, 164, 234, 0.5) 85%, rgba(120, 130, 145, 0.25) 98%, rgba(115, 120, 130, 0.28) 100%)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: '19px',
            zIndex: 1,
            overflow: 'clip',
            paddingTop: '12px',
          }}
        >
          {/* Date number */}
          <div
            style={{
              fontFamily: '"Satoshi", "Inter", sans-serif',
              fontSize: '42px',
              fontWeight: 700,
              letterSpacing: '-0.01em',
              lineHeight: '1.2em',
              color: 'rgb(255, 255, 255)',
            }}
          >
            {day}
          </div>

          {/* Month text */}
          <div
            style={{
              fontFamily: '"Satoshi", "Inter", sans-serif',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '-0.01em',
              lineHeight: '1em',
              color: 'rgb(235, 235, 235)',
              marginTop: '2px',
            }}
          >
            {month}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
