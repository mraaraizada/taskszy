import { motion } from 'framer-motion'
import { useState } from 'react'

export default function FrostedButton({ icon, delay = 0 }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative inline-flex items-center justify-center cursor-pointer"
      style={{
        backgroundColor: 'rgb(254, 130, 169)',
        borderRadius: '32px',
        padding: '3.5px',
        boxShadow: 'inset 0px 0px 0.5px 0.5px rgba(255, 255, 255, 0.3)',
        overflow: 'clip',
      }}
    >
      {/* Horizontal Glow */}
      <motion.div
        className="absolute left-[-10px] right-[-10px] z-[1]"
        style={{
          height: '32px',
          backgroundColor: 'rgb(255, 235, 240)',
          overflow: 'clip',
        }}
        animate={{
          top: isHovered ? 'unset' : 'calc(50% - 16px)',
          bottom: isHovered ? '-25px' : 'unset',
          filter: isHovered ? 'blur(3.5px)' : 'blur(2px)',
          WebkitFilter: isHovered ? 'blur(3.5px)' : 'blur(2px)',
        }}
        transition={{
          type: 'spring',
          bounce: 0.2,
          duration: 0.4,
        }}
      />

      {/* Inner Shape */}
      <div
        className="relative z-[2] flex items-center justify-center"
        style={{
          backgroundColor: 'rgb(255, 176, 201)',
          borderRadius: '32px',
          padding: '0 28px',
          height: '48px',
          overflow: 'clip',
        }}
      >
        {/* Vertical Glow */}
        <motion.div
          className="absolute z-[1]"
          style={{
            backgroundColor: 'rgb(255, 94, 145)',
            borderRadius: '24px',
            top: '3px',
            bottom: '3px',
            filter: 'blur(7px)',
            WebkitFilter: 'blur(7px)',
          }}
          animate={{
            left: isHovered ? '6px' : '14px',
            right: isHovered ? '6px' : '14px',
          }}
          transition={{
            type: 'spring',
            bounce: 0.2,
            duration: 0.4,
          }}
        />

        {/* Icon */}
        <div
          className="relative z-[4] flex items-center justify-center"
          style={{
            width: '30px',
            height: '30px',
            color: 'rgb(255, 235, 240)',
          }}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  )
}
