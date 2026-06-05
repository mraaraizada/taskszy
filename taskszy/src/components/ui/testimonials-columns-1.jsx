import React, { useMemo } from 'react'
import { motion } from 'motion/react'

export const TestimonialsColumn = ({ className, testimonials, duration, columnIndex = 0 }) => {
  // Pick one random card to be purple - stays fixed, doesn't change
  const highlightedIndex = useMemo(() => {
    return columnIndex % testimonials.length
  }, [testimonials.length, columnIndex])
  
  return (
    <div className={className}>
      <motion.div
        animate={{ translateY: '-50%' }}
        transition={{
          duration: duration || 10,
          repeat: Infinity,
          ease: 'linear',
          repeatType: 'loop',
        }}
        className="flex flex-col gap-6 pb-6"
        style={{
          // Large offset between columns so only one purple card visible at a time
          transform: `translateY(${columnIndex * -400}px)`
        }}
      >
        {[...new Array(2)].map((_, index) => (
          <React.Fragment key={index}>
            {testimonials.map(({ text, image, name, role }, i) => {
              const isHighlighted = highlightedIndex === i
              
              return (
                <div
                  className={`p-8 border-2 rounded-2xl shadow-lg shadow-primary/5 max-w-xs w-full transition-all duration-500 ${
                    isHighlighted 
                      ? 'bg-primary/60 border-primary/60' 
                      : 'bg-background border-primary/30'
                  }`}
                  key={i}
                >
                  <p className={`text-sm font-body leading-relaxed transition-all duration-500 ${
                    isHighlighted ? 'text-white font-medium' : 'text-muted-foreground'
                  }`}>
                    "{text}"
                  </p>
                  <div className="flex items-center gap-3 mt-5">
                    <img
                      src={image}
                      alt={name}
                      className="object-contain"
                      style={{ 
                        width: 'auto', 
                        height: '40px',
                        filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.6)) drop-shadow(0 0 16px rgba(99, 102, 241, 0.4)) brightness(1.1)',
                      }}
                    />
                    <div className="flex flex-col">
                      <div className={`text-sm font-semibold font-body leading-5 transition-all duration-500 ${
                        isHighlighted ? 'text-white font-bold' : 'text-foreground'
                      }`}>
                        {name}
                      </div>
                      <div className={`text-xs font-body leading-5 transition-all duration-500 ${
                        isHighlighted ? 'text-white' : 'text-muted-foreground'
                      }`}>
                        {role}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  )
}
