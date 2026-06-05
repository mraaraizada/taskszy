import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

const CollectionPreview = () => {
  const [isHovered, setIsHovered] = useState(false)

  // Auto-animate: toggle between expanded and collapsed every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsHovered(prev => !prev)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const images = [
    'https://framerusercontent.com/images/9OxD5yTUflEg5JpptKm87xH7I4.jpeg', // Pink with rainbow - center
    'https://framerusercontent.com/images/Rh0EJIm9SFE7sDFhIJNSdUZ9z3I.jpeg', // Pink cat on yellow
    'https://framerusercontent.com/images/3e5xyX3hVvsPycvZPZojXbrh0.jpeg', // Blue with skeleton
    'https://framerusercontent.com/images/dy7oIPIr4S761B3NQT2ohf7MgVw.jpeg', // Pink blob
  ]

  return (
    <div 
      className="flex flex-col items-center justify-center gap-4 w-full"
    >
      {/* Cards Row - Stacked when not hovered, fanned out when hovered */}
      <div className="relative flex items-center justify-center h-[100px] w-full">
        {/* Card 1 - Pink cat on yellow (back left) */}
        <motion.div
          className="absolute w-[60px] h-[60px] rounded-2xl overflow-hidden shadow-lg"
          style={{ zIndex: 1 }}
          animate={{
            rotate: isHovered ? 25 : 20,
            x: isHovered ? 110 : 50,
            y: isHovered ? -15 : -15,
          }}
          transition={{ duration: 0.4, type: 'spring', bounce: 0 }}
        >
          <img src={images[1]} alt="Card 1" className="w-full h-full object-cover" />
        </motion.div>

        {/* Card 2 - Green cat on purple background (back left more) */}
        <motion.div
          className="absolute w-[60px] h-[60px] rounded-2xl shadow-lg"
          style={{ 
            zIndex: 2, 
            backgroundColor: '#8b7dd8',
            overflow: 'hidden'
          }}
          animate={{
            rotate: isHovered ? -25 : -25,
            x: isHovered ? -90 : -50,
            y: isHovered ? -20 : -10,
          }}
          transition={{ duration: 0.4, type: 'spring', bounce: 0 }}
        >
          <img 
            src={images[1]} 
            alt="Card 2" 
            className="w-full h-full object-cover"
            style={{
              filter: 'hue-rotate(220deg) saturate(1.3) brightness(1.2)',
              transform: 'scaleX(-1)',
            }}
          />
        </motion.div>

        {/* Card 3 - Pink with rainbow (center front) */}
        <motion.div
          className="absolute w-[60px] h-[60px] rounded-2xl overflow-hidden shadow-xl"
          style={{ zIndex: 5 }}
          animate={{
            rotate: isHovered ? 0 : 0,
            x: isHovered ? 20 : 0,
            y: isHovered ? 5 : 0,
            scale: isHovered ? 1.05 : 1,
          }}
          transition={{ duration: 0.4, type: 'spring', bounce: 0 }}
        >
          <img src={images[0]} alt="Card 3" className="w-full h-full object-cover" />
        </motion.div>

        {/* Card 4 - Pink blob (right) */}
        <motion.div
          className="absolute w-[60px] h-[60px] rounded-2xl overflow-hidden shadow-lg"
          style={{ zIndex: 3 }}
          animate={{
            rotate: isHovered ? 15 : 12,
            x: isHovered ? 75 : 35,
            y: isHovered ? -5 : 0,
          }}
          transition={{ duration: 0.4, type: 'spring', bounce: 0 }}
        >
          <img src={images[3]} alt="Card 4" className="w-full h-full object-cover" />
        </motion.div>

        {/* Card 5 - Skeleton on blue (back right) */}
        <motion.div
          className="absolute w-[60px] h-[60px] rounded-2xl overflow-hidden shadow-lg"
          style={{ zIndex: 4 }}
          animate={{
            rotate: isHovered ? -18 : -15,
            x: isHovered ? -35 : -30,
            y: isHovered ? -10 : 5,
          }}
          transition={{ duration: 0.4, type: 'spring', bounce: 0 }}
        >
          <img src={images[2]} alt="Card 5" className="w-full h-full object-cover" />
        </motion.div>
      </div>

      {/* Text Below Cards - Static, no animation */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-foreground font-semibold text-xl">Avatars</span>
          <svg width="20" height="20" viewBox="0 0 14 14" className="flex-shrink-0">
            <path d="M 0.657 7 C 0.657 6.915 0.64 6.829 0.607 6.75 L 0.147 5.638 C -0.151 4.917 0.014 4.087 0.566 3.534 C 0.745 3.355 0.958 3.213 1.192 3.116 L 2.302 2.656 C 2.462 2.589 2.591 2.462 2.658 2.302 L 3.117 1.191 C 3.313 0.718 3.689 0.343 4.162 0.147 C 4.635 -0.049 5.166 -0.049 5.639 0.147 L 6.748 0.606 C 6.909 0.673 7.09 0.673 7.251 0.606 L 7.252 0.605 L 8.362 0.147 C 9.346 -0.26 10.475 0.208 10.883 1.192 L 11.332 2.276 C 11.395 2.449 11.528 2.587 11.698 2.657 L 12.808 3.117 C 13.793 3.525 14.26 4.654 13.853 5.638 L 13.393 6.749 C 13.327 6.91 13.327 7.09 13.393 7.251 L 13.853 8.362 C 14.26 9.346 13.793 10.475 12.808 10.883 L 11.698 11.343 C 11.528 11.413 11.395 11.552 11.332 11.725 L 10.883 12.808 C 10.687 13.281 10.311 13.656 9.839 13.852 C 9.366 14.048 8.835 14.048 8.362 13.852 L 7.252 13.394 L 7.251 13.394 C 7.09 13.327 6.909 13.327 6.748 13.394 L 5.639 13.853 C 5.166 14.049 4.634 14.049 4.161 13.853 C 3.689 13.657 3.313 13.282 3.117 12.809 L 2.658 11.698 C 2.59 11.537 2.462 11.41 2.301 11.344 L 1.192 10.884 C 0.719 10.688 0.343 10.313 0.147 9.839 C -0.049 9.366 -0.049 8.835 0.147 8.362 L 0.607 7.25 C 0.64 7.17 0.656 7.085 0.656 7 Z" fill="rgb(13,134,255)"/>
            <path d="M 9.669 5.851 C 9.91 5.601 9.907 5.205 9.661 4.959 C 9.416 4.714 9.019 4.71 8.769 4.951 L 6.356 7.365 L 5.533 6.542 C 5.283 6.301 4.886 6.304 4.641 6.55 C 4.395 6.795 4.392 7.192 4.633 7.442 L 5.906 8.715 C 6.154 8.963 6.557 8.963 6.806 8.715 Z" fill="rgb(255,255,255)"/>
          </svg>
        </div>
        <span className="text-foreground-muted text-base font-medium">9998 items</span>
      </div>

      {/* View Button */}
      {/* Removed - no button needed */}
    </div>
  )
}

export default CollectionPreview
