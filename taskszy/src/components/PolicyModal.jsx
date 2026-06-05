import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

const PolicyModal = () => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Open modal after 1 second
    const openTimer = setTimeout(() => {
      setIsOpen(true)
    }, 1000)

    // Close modal after 4 seconds
    const closeTimer = setTimeout(() => {
      setIsOpen(false)
    }, 4000)

    // Repeat the cycle every 6 seconds
    const interval = setInterval(() => {
      setIsOpen(true)
      setTimeout(() => {
        setIsOpen(false)
      }, 3000)
    }, 6000)

    return () => {
      clearTimeout(openTimer)
      clearTimeout(closeTimer)
      clearInterval(interval)
    }
  }, [])

  const actions = [
    { icon: '●', label: 'Fetch' },
    { icon: '■', label: 'Listen' },
    { icon: '▦', label: 'Validate' },
    { icon: '◐', label: 'Flag' },
    { icon: '★', label: 'Enrich' },
    { icon: '▲', label: 'Notify' },
  ]

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Horizontal lines (wires) and dots - always visible */}
      {!isOpen && (
        <>
          {/* Dots Icon Button */}
          <motion.button
            className="relative flex items-center justify-center cursor-pointer z-10"
            onClick={() => setIsOpen(true)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            style={{
              width: '50px',
              height: '50px',
              background: 'transparent',
              border: 'none',
              padding: 0,
            }}
          >
            {/* Four BLACK dots in cross pattern */}
            <div className="relative" style={{ width: '28px', height: '28px' }}>
              {/* Top dot */}
              <div
                className="absolute rounded-full"
                style={{
                  width: '7px',
                  height: '7px',
                  backgroundColor: 'black',
                  left: '50%',
                  top: '0',
                  transform: 'translateX(-50%)',
                }}
              />
              {/* Right dot */}
              <div
                className="absolute rounded-full"
                style={{
                  width: '7px',
                  height: '7px',
                  backgroundColor: 'black',
                  right: '0',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
              {/* Bottom dot */}
              <div
                className="absolute rounded-full"
                style={{
                  width: '7px',
                  height: '7px',
                  backgroundColor: 'black',
                  left: '50%',
                  bottom: '0',
                  transform: 'translateX(-50%)',
                }}
              />
              {/* Left dot */}
              <div
                className="absolute rounded-full"
                style={{
                  width: '7px',
                  height: '7px',
                  backgroundColor: 'black',
                  left: '0',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
            </div>
          </motion.button>

          {/* Left wire - attached to left dot */}
          <div 
            className="absolute"
            style={{
              height: '1px',
              width: 'calc(50% - 25px)',
              left: '0',
              top: '50%',
              background: 'linear-gradient(to right, rgba(100, 100, 100, 0.3), rgba(100, 100, 100, 0.5))',
              transform: 'translateY(-50%)',
            }}
          />
          
          {/* Right wire - attached to right dot */}
          <div 
            className="absolute"
            style={{
              height: '1px',
              width: 'calc(50% - 25px)',
              right: '0',
              top: '50%',
              background: 'linear-gradient(to left, rgba(100, 100, 100, 0.3), rgba(100, 100, 100, 0.5))',
              transform: 'translateY(-50%)',
            }}
          />
        </>
      )}

      {/* Modal - Opens in the same space */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute flex items-center justify-center"
            style={{
              backgroundColor: 'rgb(35, 37, 39)',
              borderRadius: '12px',
              top: '-10px',
              bottom: '-30px',
              left: '-18px',
              right: '-18px',
              boxShadow: `
                0 0 0 1px rgba(255, 255, 255, 0.08),
                0 3px 6px rgba(0, 0, 0, 0.4),
                0 10px 20px rgba(0, 0, 0, 0.5),
                0 20px 40px rgba(0, 0, 0, 0.4),
                inset 0 1.5px 0 rgba(255, 255, 255, 0.1),
                inset 0 -1.5px 0 rgba(0, 0, 0, 0.6)
              `,
              transform: 'scale(0.85)',
            }}
            initial={{ opacity: 0, scale: 0.68 }}
            animate={{ opacity: 1, scale: 0.85 }}
            exit={{ opacity: 0, scale: 0.68 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.1 }}
          >
            <div className="w-full h-full flex flex-col p-2">
              {/* Header */}
              <div className="flex items-center justify-between mb-1.5">
                <h2 className="text-sm font-bold text-white">Add job</h2>
                <button
                  className="text-gray-400 hover:text-gray-300 text-xs font-medium flex items-center gap-0.5"
                  onClick={() => setIsOpen(false)}
                >
                  More <span>→</span>
                </button>
              </div>

              {/* Action Grid */}
              <div className="grid grid-cols-3 gap-1 mb-1.5 flex-1">
                {actions.map((action, index) => (
                  <motion.button
                    key={action.label}
                    className="rounded-md p-1.5 text-left transition-all hover:bg-opacity-80 flex flex-col justify-between"
                    style={{
                      backgroundColor: 'rgb(52, 54, 56)',
                      boxShadow: `
                        0 1.5px 3px rgba(0, 0, 0, 0.5),
                        0 3px 6px rgba(0, 0, 0, 0.4),
                        0 5px 10px rgba(0, 0, 0, 0.3),
                        inset 0 1.5px 0 rgba(255, 255, 255, 0.1),
                        inset 0 -1.5px 0 rgba(0, 0, 0, 0.4),
                        0 0 10px rgba(255, 255, 255, 0.025)
                      `,
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    whileHover={{
                      backgroundColor: 'rgb(60, 62, 64)',
                      scale: 1.02,
                      boxShadow: `
                        0 2px 4px rgba(0, 0, 0, 0.6),
                        0 4px 8px rgba(0, 0, 0, 0.5),
                        0 6px 12px rgba(0, 0, 0, 0.4),
                        inset 0 1.5px 0 rgba(255, 255, 255, 0.12),
                        inset 0 -1.5px 0 rgba(0, 0, 0, 0.4),
                        0 0 12px rgba(255, 255, 255, 0.04)
                      `,
                    }}
                  >
                    <div className="text-xl text-gray-400">{action.icon}</div>
                    <div className="text-white font-semibold" style={{ fontSize: '10px' }}>
                      {action.label}
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Text Input */}
              <motion.div
                className="rounded-md p-1.5 flex items-center justify-between"
                style={{
                  backgroundColor: 'rgb(40, 42, 44)',
                  boxShadow: `
                    inset 0 1.5px 4px rgba(0, 0, 0, 0.6),
                    inset 0 -1px 0 rgba(255, 255, 255, 0.04),
                    0 1px 0 rgba(255, 255, 255, 0.06),
                    inset 0 0 6px rgba(0, 0, 0, 0.3)
                  `,
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                <span className="text-gray-400" style={{ fontSize: '10px' }}>
                  Or just describe it
                </span>
                <button 
                  className="w-4 h-4 rounded flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: 'rgb(90, 95, 100)',
                    boxShadow: `
                      0 1.5px 3px rgba(0, 0, 0, 0.4),
                      0 3px 6px rgba(0, 0, 0, 0.3),
                      inset 0 1.5px 0 rgba(255, 255, 255, 0.18),
                      inset 0 -1.5px 0 rgba(0, 0, 0, 0.3)
                    `,
                  }}
                >
                  <span className="text-white text-xs font-light">+</span>
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PolicyModal
