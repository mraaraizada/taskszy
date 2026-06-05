import { motion } from 'framer-motion'

export default function VolumeToggle({ isOn, onToggle }) {
  return (
    <div 
      className="relative cursor-pointer"
      onClick={onToggle}
      style={{ width: '99px', height: '50px' }}
    >
      {/* Rail */}
      <div 
        className="absolute"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90px',
          height: '38px',
          borderRadius: '100px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          boxShadow: 'inset 0px 2px 4px rgba(0, 0, 0, 0.1), 0px 2px 8px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden'
        }}
      >
        {/* Rail inner colored bar */}
        <div 
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '68px',
            height: '5px',
            borderRadius: '100px',
            backgroundColor: isOn ? 'rgb(255, 200, 180)' : 'rgb(120, 125, 240)',
          }}
        />
      </div>

      {/* Button */}
      <motion.div
        className="absolute"
        animate={{
          left: isOn ? '4px' : '44px'
        }}
        transition={{ type: 'spring', stiffness: 900, damping: 80, mass: 10 }}
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          width: '50px',
          height: '50px',
          zIndex: 1
        }}
      >
        {/* Button circle */}
        <div
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '100px',
            backgroundColor: 'rgb(255, 255, 255)',
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15), 0px 2px 4px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Icon */}
          {isOn ? (
            // Prev Icon
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" fill="rgb(100, 100, 100)" />
            </svg>
          ) : (
            // Next Icon
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M16 18h2V6h-2v12zM6 18l8.5-6L6 6v12z" fill="rgb(100, 100, 100)" />
            </svg>
          )}
        </div>
      </motion.div>
    </div>
  )
}
