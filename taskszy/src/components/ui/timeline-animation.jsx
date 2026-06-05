import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

/**
 * TimelineContent — animates children when they scroll into view.
 * `animationNum` controls stagger delay, `customVariants` allows override.
 */
export function TimelineContent({
  as: Tag = 'div',
  animationNum = 0,
  timelineRef,
  customVariants,
  className,
  children,
  ...props
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' })

  const defaultVariants = {
    hidden: { opacity: 0, y: -20, filter: 'blur(10px)' },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { delay: i * 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    }),
  }

  const variants = customVariants || defaultVariants

  const MotionTag = motion[Tag] || motion.div

  return (
    <MotionTag
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants}
      custom={animationNum}
      {...props}
    >
      {children}
    </MotionTag>
  )
}
