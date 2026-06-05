import { useState, useEffect } from 'react'

export default function Navbar() {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [showBanner, setShowBanner] = useState(true)
  const [timeLeft, setTimeLeft] = useState({ days: 7, hours: 0, minutes: 0, seconds: 0 })

  // Countdown timer effect - 7 days that loops infinitely
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        let { days, hours, minutes, seconds } = prevTime
        
        // Countdown logic
        if (seconds > 0) {
          seconds--
        } else if (minutes > 0) {
          minutes--
          seconds = 59
        } else if (hours > 0) {
          hours--
          minutes = 59
          seconds = 59
        } else if (days > 0) {
          days--
          hours = 23
          minutes = 59
          seconds = 59
        } else {
          // Reset to 7 days when timer reaches 0
          days = 6
          hours = 23
          minutes = 59
          seconds = 59
        }
        
        return { days, hours, minutes, seconds }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Banner logic - instant hide/show
      if (currentScrollY > 0) {
        setShowBanner(false)
      } else {
        setShowBanner(true)
      }

      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        // Scrolling up or at top - show navbar
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide navbar
        setIsVisible(false)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  return (
    <>
      {/* Top Banner */}
      {showBanner && (
        <div className="bg-black text-white py-2 px-6 text-center text-xs font-medium sticky top-0 z-50">
          <span className="text-orange-400">⚡</span> Limited-Time Pricing: <span className="font-bold text-orange-400">Get 10% Off All Plans</span> — Ends in{' '}
          <span className="font-mono">
            {timeLeft.days}d : {timeLeft.hours}h : {timeLeft.minutes}m : {timeLeft.seconds}s
          </span>{' '}
          <span className="text-blue-400 hover:underline ml-2 cursor-pointer">→</span>
        </div>
      )}

      <nav 
        className={`flex items-center justify-center px-6 md:px-12 lg:px-20 py-3 font-body bg-white sticky ${showBanner ? 'top-[32px]' : 'top-0'} z-50 transition-all duration-300 ease-in-out ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
      <div className="flex items-center justify-between w-full max-w-7xl">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img 
            src="/logo.png" 
            alt="TasksZy Logo" 
            className="h-8 w-auto"
          />
          <span className="text-xl font-display font-bold tracking-tight text-foreground uppercase">
            TasksZy
          </span>
        </div>

        {/* Nav links — centered, hidden on mobile */}
        <div className="hidden md:flex items-center gap-12" style={{ marginLeft: '6.5rem' }}>
          <a
            href="#solutions"
            className="text-xs font-medium text-foreground hover:text-primary transition-colors cursor-pointer uppercase tracking-wider"
          >
            Solutions
          </a>
          <a
            href="#features"
            className="text-xs font-medium text-foreground hover:text-primary transition-colors cursor-pointer uppercase tracking-wider"
          >
            Features
          </a>
          <a
            href="#pricing"
            className="text-xs font-medium text-foreground hover:text-primary transition-colors cursor-pointer uppercase tracking-wider"
          >
            Pricing
          </a>
          <a
            href="#faqs"
            className="text-xs font-medium text-foreground hover:text-primary transition-colors cursor-pointer uppercase tracking-wider"
          >
            FAQs
          </a>
        </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-2">
          {/* Contact Sales button */}
          <a
            href="#"
            className="hidden md:block relative px-4 py-2 rounded-full border border-foreground text-foreground text-xs font-medium overflow-hidden group transition-all cursor-pointer uppercase tracking-wider"
          >
            <span className="relative z-10 transition-colors duration-300 group-hover:text-background">
              Contact Sales
            </span>
            <span className="absolute inset-0 bg-foreground transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-full"></span>
          </a>

          {/* Login/Signup Button with arrow */}
          <a
            href="/app/"
            className="relative px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-medium overflow-hidden group transition-all cursor-pointer uppercase tracking-wider border border-primary group-hover:border-primary flex items-center gap-1"
          >
            <span className="relative z-10 transition-colors duration-300 group-hover:text-primary">
              Login/Signup
            </span>
            <span className="relative z-10 transition-colors duration-300 group-hover:text-primary">→</span>
            <span className="absolute inset-0 bg-background border border-primary transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-full"></span>
          </a>
        </div>
      </div>
    </nav>
    </>
  )
}
