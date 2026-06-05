import { useRef, useMemo, useCallback, useEffect } from 'react'
import { useInView } from 'framer-motion'

export default function ShootingStarsGrid(props) {
  const {
    backgroundColor = '#09090b',
    gridSize = 64,
    gridLineColor = 'rgba(255, 255, 255, 0.05)',
    gridLineOpacity = 1,
    pulseMinOpacity = 0.8,
    pulseMaxOpacity = 1,
    pulseDuration = 8,
    maskInnerStop = 20,
    maskOuterStop = 80,
    glowColor = 'rgba(22, 163, 74, 1)',
    glowOpacity = 0.1,
    glowBlur = 120,
    glowWidth = 800,
    glowHeight = 600,
    spawnRateMin = 200,
    spawnRateMax = 600,
    speedMin = 2000,
    speedMax = 4500,
    maxActiveStars = 15,
    trailLength = 150,
    thickness = 1,
    color1 = 'rgba(6, 182, 212, 1)',
    color2 = 'rgba(139, 92, 246, 1)',
    color3 = 'rgba(244, 244, 245, 0.9)',
    style = {}
  } = props

  const containerRef = useRef(null)
  const starsLayerRef = useRef(null)
  const timeoutIdRef = useRef(null)
  const activeStarsRef = useRef(0)
  
  const inView = useInView(containerRef, {
    margin: '200px 0px 200px 0px',
    amount: 0.01
  })

  const colors = useMemo(() => [color1, color2, color3], [color1, color2, color3])
  const clampedGridSize = Math.max(4, Math.round(gridSize))
  const clampedThickness = Math.max(1, thickness)

  const keyframesCss = useMemo(() => {
    const safePulseDuration = Math.max(0.1, pulseDuration)
    const minO = Math.max(0, Math.min(1, pulseMinOpacity))
    const maxO = Math.max(0, Math.min(1, pulseMaxOpacity))
    return `
      @keyframes framer-shooting-stars-pulse-opacity {
        0%, 100% { opacity: ${minO}; }
        50% { opacity: ${maxO}; }
      }
      .framer-shooting-stars-grid-pulse {
        animation: framer-shooting-stars-pulse-opacity ${safePulseDuration}s ease-in-out infinite;
      }
    `
  }, [pulseDuration, pulseMinOpacity, pulseMaxOpacity])

  const maskCss = useMemo(() => {
    const inner = Math.max(0, Math.min(100, maskInnerStop))
    const outer = Math.max(0, Math.min(100, maskOuterStop))
    const innerStop = Math.min(inner, outer)
    const outerStop = Math.max(inner, outer)
    return `radial-gradient(ellipse at center, rgba(0,0,0,1) ${innerStop}%, rgba(0,0,0,0) ${outerStop}%)`
  }, [maskInnerStop, maskOuterStop])

  const cleanupStars = useCallback(() => {
    const layer = starsLayerRef.current
    if (!layer) return
    layer.innerHTML = ''
    activeStarsRef.current = 0
  }, [])

  const stopLoop = useCallback(() => {
    if (timeoutIdRef.current != null && typeof window !== 'undefined') {
      window.clearTimeout(timeoutIdRef.current)
      timeoutIdRef.current = null
    }
  }, [])

  const scheduleNext = useCallback(fn => {
    if (typeof window === 'undefined') return
    const min = Math.max(0, spawnRateMin)
    const max = Math.max(min, spawnRateMax)
    const nextSpawnTime = Math.random() * (max - min) + min
    timeoutIdRef.current = window.setTimeout(fn, nextSpawnTime)
  }, [spawnRateMin, spawnRateMax])

  const animateStar = useCallback((element, keyframeStart, keyframeEnd, duration) => {
    const layer = starsLayerRef.current
    if (!layer) return
    layer.appendChild(element)
    activeStarsRef.current += 1
    const safeDuration = Math.max(16, duration)
    const canAnimate = typeof element.animate === 'function'
    if (!canAnimate) {
      if (typeof window !== 'undefined') {
        window.setTimeout(() => {
          element.remove()
          activeStarsRef.current = Math.max(0, activeStarsRef.current - 1)
        }, 500)
      }
      return
    }
    const animation = element.animate([keyframeStart, keyframeEnd], {
      duration: safeDuration,
      easing: 'linear',
      fill: 'forwards'
    })
    animation.onfinish = () => {
      element.remove()
      activeStarsRef.current = Math.max(0, activeStarsRef.current - 1)
    }
  }, [])

  const createShootingStar = useCallback(() => {
    if (!inView) return
    if (typeof window === 'undefined') return
    const layer = starsLayerRef.current
    const container = containerRef.current
    if (!layer || !container) return
    if (activeStarsRef.current >= Math.max(0, maxActiveStars)) return

    const rect = container.getBoundingClientRect()
    const width = Math.max(1, rect.width)
    const height = Math.max(1, rect.height)
    const isHorizontal = Math.random() > 0.5
    const isForward = Math.random() > 0.5
    const color = colors[Math.floor(Math.random() * colors.length)] ?? 'rgba(6, 182, 212, 1)'
    const star = document.createElement('div')
    star.style.position = 'absolute'
    star.style.zIndex = '1'
    star.style.pointerEvents = 'none'
    star.style.willChange = 'transform'
    star.style.borderRadius = '999px'

    const durMin = Math.max(16, speedMin)
    const durMax = Math.max(durMin, speedMax)
    const duration = Math.random() * (durMax - durMin) + durMin
    const tl = Math.max(1, trailLength)
    const t = Math.max(1, clampedThickness)

    if (isHorizontal) {
      const maxRows = Math.floor(height / clampedGridSize)
      const row = Math.floor(Math.random() * (maxRows + 1))
      const yPos = row * clampedGridSize - t / 2 + 0.5
      star.style.top = `${yPos}px`
      star.style.height = `${t}px`
      star.style.width = `${tl}px`
      if (isForward) {
        star.style.left = `-${tl}px`
        star.style.background = `linear-gradient(to right, transparent, ${color} 80%, rgba(255,255,255,1) 100%)`
        star.style.boxShadow = `10px 0 15px -2px ${color}`
        animateStar(star, { transform: 'translateX(0px)' }, { transform: `translateX(${width + tl * 2}px)` }, duration)
      } else {
        star.style.right = `-${tl}px`
        star.style.background = `linear-gradient(to left, transparent, ${color} 80%, rgba(255,255,255,1) 100%)`
        star.style.boxShadow = `-10px 0 15px -2px ${color}`
        animateStar(star, { transform: 'translateX(0px)' }, { transform: `translateX(-${width + tl * 2}px)` }, duration)
      }
    } else {
      const maxCols = Math.floor(width / clampedGridSize)
      const col = Math.floor(Math.random() * (maxCols + 1))
      const xPos = col * clampedGridSize - t / 2 + 0.5
      star.style.left = `${xPos}px`
      star.style.width = `${t}px`
      star.style.height = `${tl}px`
      if (isForward) {
        star.style.top = `-${tl}px`
        star.style.background = `linear-gradient(to bottom, transparent, ${color} 80%, rgba(255,255,255,1) 100%)`
        star.style.boxShadow = `0 10px 15px -2px ${color}`
        animateStar(star, { transform: 'translateY(0px)' }, { transform: `translateY(${height + tl * 2}px)` }, duration)
      } else {
        star.style.bottom = `-${tl}px`
        star.style.background = `linear-gradient(to top, transparent, ${color} 80%, rgba(255,255,255,1) 100%)`
        star.style.boxShadow = `0 -10px 15px -2px ${color}`
        animateStar(star, { transform: 'translateY(0px)' }, { transform: `translateY(-${height + tl * 2}px)` }, duration)
      }
    }
  }, [animateStar, clampedGridSize, clampedThickness, colors, inView, maxActiveStars, speedMax, speedMin, trailLength])

  const spawnLoop = useCallback(() => {
    if (typeof document !== 'undefined') {
      if (document.visibilityState !== 'visible') {
        scheduleNext(spawnLoop)
        return
      }
    }
    createShootingStar()
    scheduleNext(spawnLoop)
  }, [createShootingStar, scheduleNext])

  useEffect(() => {
    if (!inView) {
      stopLoop()
      return
    }
    if (typeof window === 'undefined') return
    stopLoop()
    timeoutIdRef.current = window.setTimeout(() => {
      spawnLoop()
    }, 500)
    return () => {
      stopLoop()
    }
  }, [inView, spawnLoop, stopLoop])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onResize = () => {
      cleanupStars()
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [cleanupStars])

  const gridLayerStyle = {
    position: 'absolute',
    inset: 0,
    backgroundImage: gridLineColor.startsWith('rgb') || gridLineColor.startsWith('hsl')
      ? `linear-gradient(to right, ${gridLineColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridLineColor} 1px, transparent 1px)`
      : `linear-gradient(to right, rgba(255, 255, 255, ${Math.max(0, Math.min(1, gridLineOpacity)) * 0.05}) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, ${Math.max(0, Math.min(1, gridLineOpacity)) * 0.05}) 1px, transparent 1px)`,
    backgroundPosition: 'center center',
    backgroundSize: `${clampedGridSize}px ${clampedGridSize}px`,
    backgroundAttachment: 'fixed',
    WebkitMaskImage: maskCss,
    maskImage: maskCss
  }

  const starsLayerStyle = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    WebkitMaskImage: maskCss,
    maskImage: maskCss
  }

  const glowStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: `${Math.max(1, glowWidth)}px`,
    height: `${Math.max(1, glowHeight)}px`,
    background: glowColor,
    opacity: Math.max(0, Math.min(1, glowOpacity)),
    filter: `blur(${Math.max(0, glowBlur)}px)`,
    borderRadius: 9999,
    pointerEvents: 'none'
  }

  return (
    <div
      ref={containerRef}
      style={{
        ...style,
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        minWidth: 5,
        minHeight: 5,
        overflow: 'hidden',
        backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      aria-hidden="true"
    >
      <style>{keyframesCss}</style>
      <div className="framer-shooting-stars-grid-pulse" style={gridLayerStyle} />
      <div ref={starsLayerRef} style={starsLayerStyle} />
      <div style={glowStyle} />
    </div>
  )
}
