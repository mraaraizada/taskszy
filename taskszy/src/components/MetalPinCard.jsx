import { motion, useMotionValue, useTransform } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'

// 3D Hover Effect Hook
const use3DHover = (ref, options = {}) => {
  const {
    perspective = 500,
    tiltLimit = 25,
    scale = 1.3,
    effect = 'evade'
  } = options

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)

  useEffect(() => {
    if (!ref.current) return

    const handleMouseMove = (e) => {
      const rect = ref.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      const deltaX = e.clientX - centerX
      const deltaY = e.clientY - centerY
      
      if (effect === 'evade') {
        // Move away from cursor
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
        const maxDistance = 200
        
        if (distance < maxDistance) {
          const force = (1 - distance / maxDistance) * 30
          x.set(-deltaX * force / 100)
          y.set(-deltaY * force / 100)
        }
      }
      
      // 3D tilt
      const percentX = (deltaX / rect.width) * tiltLimit
      const percentY = (deltaY / rect.height) * tiltLimit
      
      rotateY.set(percentX)
      rotateX.set(-percentY)
    }

    const handleMouseLeave = () => {
      x.set(0)
      y.set(0)
      rotateX.set(0)
      rotateY.set(0)
    }

    const element = ref.current
    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [ref, x, y, rotateX, rotateY, effect, tiltLimit])

  return { x, y, rotateX, rotateY }
}

// Parallax Floating Effect Hook
const useParallaxFloating = (ref, options = {}) => {
  const {
    distance = 200,
    smoothing = 80,
    direction = 'away'
  } = options

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  useEffect(() => {
    if (!ref.current) return

    const handleMouseMove = (e) => {
      const rect = ref.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      const deltaX = (e.clientX - centerX) / smoothing
      const deltaY = (e.clientY - centerY) / smoothing
      
      if (direction === 'away') {
        x.set(-deltaX)
        y.set(-deltaY)
      } else {
        x.set(deltaX)
        y.set(deltaY)
      }
    }

    const handleMouseLeave = () => {
      x.set(0)
      y.set(0)
    }

    document.addEventListener('mousemove', handleMouseMove)
    ref.current?.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      ref.current?.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [ref, x, y, distance, smoothing, direction])

  return { x, y }
}

// Clerk Logo SVG Component
const ClerkLogo = () => (
  <svg width="77" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M35.148 16.738a4.198 4.198 0 0 1-3.06 1.283 3.53 3.53 0 0 1-2.604-1.034c-.619-.645-.975-1.566-.975-2.665 0-2.199 1.432-3.703 3.58-3.703a3.914 3.914 0 0 1 3.034 1.377l1.859-1.644c-1.211-1.47-3.176-2.229-5.042-2.229-3.652 0-6.24 2.517-6.24 6.22 0 1.831.643 3.374 1.728 4.463s2.631 1.728 4.415 1.728c2.317 0 4.166-.94 5.203-2.122l-1.898-1.674Zm3.579-13.31h2.766V20.34h-2.766V3.428Zm16.091 11.855c.046-.368.07-.74.076-1.11 0-3.507-2.296-6.047-5.847-6.047a5.738 5.738 0 0 0-4.215 1.725c-1.038 1.089-1.66 2.631-1.66 4.47 0 3.749 2.642 6.216 6.146 6.216 2.35 0 4.043-.951 5.058-2.242l-1.812-1.605-.09-.076a3.749 3.749 0 0 1-3.008 1.406c-1.778 0-3.061-1.037-3.427-2.737h8.779Zm-8.733-2.22a3.365 3.365 0 0 1 .737-1.449 3.082 3.082 0 0 1 2.368-.996c1.58 0 2.57.988 2.911 2.445h-6.016Zm17.36-4.973v3.084a13.36 13.36 0 0 0-.838-.05c-2.094 0-3.282 1.505-3.282 3.479v5.736h-2.763V8.261h2.763v1.83h.025c.938-1.283 2.284-1.997 3.75-1.997l.345-.004Zm6.442 7.191-1.998 2.222v2.837h-2.764V3.428h2.764v10.374L72.822 8.3h3.283l-4.341 4.86 4.417 7.18h-3.11l-3.133-5.059h-.051Z" fill="#1F0256"/>
    <path d="m19.116 3.16-2.88 2.881a.571.571 0 0 1-.701.084 6.854 6.854 0 0 0-10.39 5.647 6.867 6.867 0 0 0 .979 3.764.571.571 0 0 1-.084.699l-2.88 2.88a.57.57 0 0 1-.865-.063A11.994 11.994 0 0 1 19.051 2.295a.57.57 0 0 1 .065.866Z" fill="url(#a)"/>
    <path d="m19.113 20.829-2.88-2.88a.571.571 0 0 0-.7-.085 6.854 6.854 0 0 1-7.081 0 .571.571 0 0 0-.7.084l-2.881 2.88a.57.57 0 0 0 .062.877 11.994 11.994 0 0 0 14.114 0 .571.571 0 0 0 .066-.876Zm-7.116-5.407a3.427 3.427 0 1 0 0-6.854 3.427 3.427 0 0 0 0 6.854Z" fill="#1F0256"/>
    <defs>
      <linearGradient id="a" x1="16.409" y1="-1.759" x2="-7.885" y2="22.537" gradientUnits="userSpaceOnUse">
        <stop stopColor="#17CCFC"/>
        <stop offset=".5" stopColor="#5D31FF"/>
        <stop offset="1" stopColor="#F35AFF"/>
      </linearGradient>
    </defs>
  </svg>
)

// Blueprint Grid SVG Background - Precise line structure matching the reference
const BlueprintGrid = () => (
  <svg 
    className="absolute inset-0 w-full h-full" 
    viewBox="0 0 321 444" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="none"
  >
    {/* TOP HEADER SECTION - with border */}
    <rect 
      x="12" 
      y="12" 
      width="297" 
      height="32" 
      rx="6" 
      ry="6" 
      fill="none" 
      stroke="rgb(190,190,190)" 
      strokeWidth="0.8"
    />
    
    {/* MIDDLE GRID SECTION - main content area with perspective grid */}
    <rect 
      x="12" 
      y="52" 
      width="297" 
      height="280" 
      rx="4" 
      ry="4" 
      fill="none" 
      stroke="rgb(190,190,190)" 
      strokeWidth="0.8"
    />
    
    {/* BOTTOM TEXT SECTION - with border */}
    <rect 
      x="12" 
      y="340" 
      width="297" 
      height="92" 
      rx="6" 
      ry="6" 
      fill="none" 
      stroke="rgb(190,190,190)" 
      strokeWidth="0.8"
    />
    
    {/* PERSPECTIVE GRID LINES - only in middle section */}
    {/* Vertical center line */}
    <line x1="160.5" y1="52" x2="160.5" y2="332" stroke="rgb(190,190,190)" strokeWidth="0.5" />
    
    {/* Horizontal center line */}
    <line x1="12" y1="192" x2="309" y2="192" stroke="rgb(190,190,190)" strokeWidth="0.5" />
    
    {/* Diagonal lines from corners creating perspective */}
    <line x1="12" y1="52" x2="309" y2="332" stroke="rgb(190,190,190)" strokeWidth="0.4" />
    <line x1="309" y1="52" x2="12" y2="332" stroke="rgb(190,190,190)" strokeWidth="0.4" />
    
    {/* Additional perspective diagonals */}
    <line x1="12" y1="122" x2="309" y2="262" stroke="rgb(190,190,190)" strokeWidth="0.4" />
    <line x1="309" y1="122" x2="12" y2="262" stroke="rgb(190,190,190)" strokeWidth="0.4" />
    
    {/* Horizontal grid divisions */}
    <line x1="12" y1="122" x2="309" y2="122" stroke="rgb(190,190,190)" strokeWidth="0.4" />
    <line x1="12" y1="262" x2="309" y2="262" stroke="rgb(190,190,190)" strokeWidth="0.4" />
    
    {/* Nested concentric rectangles for depth */}
    <rect 
      x="40" 
      y="82" 
      width="241" 
      height="220" 
      rx="3" 
      ry="3" 
      fill="none" 
      stroke="rgb(190,190,190)" 
      strokeWidth="0.5"
    />
    
    <rect 
      x="65" 
      y="107" 
      width="191" 
      height="170" 
      rx="2" 
      ry="2" 
      fill="none" 
      stroke="rgb(190,190,190)" 
      strokeWidth="0.5"
    />
    
    <rect 
      x="90" 
      y="132" 
      width="141" 
      height="120" 
      rx="2" 
      ry="2" 
      fill="none" 
      stroke="rgb(190,190,190)" 
      strokeWidth="0.5"
    />
    
    <rect 
      x="115" 
      y="157" 
      width="91" 
      height="70" 
      rx="1" 
      ry="1" 
      fill="none" 
      stroke="rgb(190,190,190)" 
      strokeWidth="0.5"
    />
  </svg>
)

// Main Metal Pin Card Component
export default function MetalPinCard() {
  const cardRef = useRef(null)
  const pinContainerRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isPinHovered, setIsPinHovered] = useState(false)

  // 3D hover for the pin container
  const { x: pinX, y: pinY, rotateX, rotateY } = use3DHover(pinContainerRef, {
    perspective: 500,
    tiltLimit: 25,
    scale: 1.3,
    effect: 'evade'
  })

  // Parallax for the highlight
  const highlightRef = useRef(null)
  const { x: highlightX, y: highlightY } = useParallaxFloating(highlightRef, {
    distance: 200,
    smoothing: 80,
    direction: 'away'
  })

  return (
    <motion.div
      ref={cardRef}
      className="relative flex items-center justify-center"
      style={{
        width: '349px',
        height: '472px',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Card with Blueprint */}
      <motion.div
        className="relative flex flex-col items-center justify-center overflow-hidden"
        style={{
          width: '321px',
          height: '444px',
          borderRadius: '12px',
          padding: '14px',
          boxShadow: '-1px -1px 0px 0px rgb(255, 255, 255), 0px 3px 5px 0px rgb(135, 135, 135)',
          pointerEvents: 'none',
        }}
        animate={{
          scale: isHovered ? 1.05 : 1
        }}
        transition={{
          type: 'spring',
          bounce: 0.2,
          duration: 0.4
        }}
      >
        {/* Blueprint Background Image */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(https://framerusercontent.com/images/f95grD8FoEU3wPbs94v0IEoZc.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '12px',
            filter: 'brightness(1.5) contrast(1.15)',
          }}
        />

        {/* Paper-like grainy noise overlay */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundColor: '#f8f8f8',
            borderRadius: '12px',
            mixBlendMode: 'overlay',
            opacity: 0.95,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.5' numOctaves='6' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Additional fine grain texture */}
        <div 
          className="absolute inset-0"
          style={{
            borderRadius: '12px',
            opacity: 0.35,
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 1px,
              rgba(0,0,0,0.08) 1px,
              rgba(0,0,0,0.08) 2px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 1px,
              rgba(0,0,0,0.08) 1px,
              rgba(0,0,0,0.08) 2px
            )`,
          }}
        />

        {/* Blueprint Grid Overlay */}
        <div className="absolute inset-0">
          <BlueprintGrid />
        </div>

        {/* Clerk Logo - Top Left in header section */}
        <div 
          className="absolute"
          style={{
            left: '24px',
            top: '20px',
            width: '50px',
            height: '16px',
            mixBlendMode: 'luminosity',
            zIndex: 1,
          }}
        >
          <ClerkLogo />
        </div>

        {/* Metal Collection Text - Top Right in header section */}
        <div 
          className="absolute"
          style={{
            right: '24px',
            top: '22px',
            zIndex: 1,
          }}
        >
          <p 
            className="text-[11px] font-medium tracking-tight whitespace-nowrap"
            style={{
              fontFamily: '"DM Mono", monospace',
              color: 'rgb(51, 55, 58)',
              letterSpacing: '-0.03em',
              lineHeight: '1em',
            }}
          >
            METAL COLLECTION / 2025
          </p>
        </div>
      </motion.div>

      {/* 3D Metallic Pin Overlay */}
      <div 
        ref={pinContainerRef}
        className="absolute inset-0 flex items-center justify-center overflow-visible pointer-events-auto"
        style={{
          zIndex: 4,
        }}
      >
        <motion.div
          className="relative"
          style={{
            width: '210px',
            height: '205px',
            x: pinX,
            y: pinY,
            rotateX,
            rotateY,
            transformStyle: 'preserve-3d',
            perspective: 500,
          }}
          animate={{
            scale: isPinHovered ? 1.2 : 1,
            z: isPinHovered ? 80 : 0,
          }}
          transition={{
            type: 'spring',
            damping: 25,
            stiffness: 150,
            mass: 0.8
          }}
          onMouseEnter={() => setIsPinHovered(true)}
          onMouseLeave={() => setIsPinHovered(false)}
        >
          {/* Shadow Layer */}
          <div 
            className="absolute"
            style={{
              left: '50%',
              top: '-40px',
              transform: 'translateX(-50%)',
              width: '210px',
              height: '204px',
              filter: 'drop-shadow(0px 5px 2px rgba(33, 33, 33, 0.58))',
              zIndex: 1,
            }}
          >
            <img 
              src="https://framerusercontent.com/images/9gHxSgr3Shuxwom0iVjRVPfkwqM.png"
              alt="Metal pin shadow"
              className="w-full h-full object-contain"
              draggable="false"
            />
          </div>

          {/* Metal Pin with Mask */}
          <div 
            className="absolute"
            style={{
              left: '50.15%',
              top: '-41px',
              transform: 'translateX(-50%)',
              width: '210px',
              height: '205px',
              WebkitMask: "url('https://framerusercontent.com/images/u3XfxmWO2mQcxJ4mj9tMofSbApk.png') alpha no-repeat center / cover add",
              mask: "url('https://framerusercontent.com/images/u3XfxmWO2mQcxJ4mj9tMofSbApk.png') alpha no-repeat center / cover add",
              zIndex: 2,
            }}
          >
            {/* Pin Image */}
            <div 
              className="absolute"
              style={{
                left: 0,
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                height: '204px',
                filter: 'drop-shadow(0px 5px 2px rgba(33, 33, 33, 0.58))',
              }}
            >
              <img 
                src="https://framerusercontent.com/images/9gHxSgr3Shuxwom0iVjRVPfkwqM.png"
                alt="Metal pin"
                className="w-full h-full object-contain"
                draggable="false"
              />
            </div>

            {/* Light Control - Highlight Effect */}
            <motion.div
              ref={highlightRef}
              className="absolute"
              style={{
                left: '51%',
                bottom: '59px',
                transform: 'translateX(-50%)',
                width: '21px',
                height: '21px',
              }}
            >
              {/* Radial Gradient Highlight */}
              <motion.div
                className="absolute"
                style={{
                  left: '-26px',
                  right: '-42px',
                  top: '-165px',
                  bottom: '-146px',
                  background: 'radial-gradient(50% 50% at 50% 50%, rgb(255, 255, 255) 0%, rgba(255, 255, 255, 0.67) 51.91%, rgba(255, 255, 255, 0) 100%)',
                  filter: 'blur(6px)',
                  opacity: 0.6,
                  rotate: 202,
                  mixBlendMode: 'overlay',
                }}
              />

              {/* Parallax Floating Element */}
              <motion.div
                className="absolute"
                style={{
                  right: '-39px',
                  top: '-184px',
                  rotate: 60,
                  x: highlightX,
                  y: highlightY,
                }}
                transition={{
                  type: 'spring',
                  damping: 30,
                  stiffness: 200
                }}
              >
                {/* This creates the dynamic light movement */}
                <div 
                  style={{
                    width: '10px',
                    height: '10px',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)',
                    filter: 'blur(4px)',
                  }}
                />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
