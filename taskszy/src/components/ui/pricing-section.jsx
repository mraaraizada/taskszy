import NumberFlow from '@number-flow/react'
import { Check, Minus, Sparkles, Zap, X, ArrowUpRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { Button } from './button'

// BillingReceipt Component
const BillingReceipt = ({ isOpen, onClose, planData }) => {
  if (!planData) return null;

  const audioRef = useRef(null);

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit'
  });

  useEffect(() => {
    if (isOpen && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.loop = true; // Loop the audio
      audioRef.current.playbackRate = 1;
      audioRef.current.play().catch(err => console.log('Audio play failed:', err));
      
      // Stop audio after 7 seconds (when animation completes)
      const timer = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }, 7000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Audio */}
          <audio ref={audioRef} src="/printer-sound.mp3" />

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Receipt */}
          <motion.div
            initial={{ 
              y: '100%',
              opacity: 1
            }}
            animate={{ 
              y: [
                '100%',    // Start: hidden
                '80%',     // 1/5 printed
                '80%',     // Pause
                '60%',     // 2/5 printed
                '60%',     // Pause
                '40%',     // 3/5 printed
                '40%',     // Pause
                '20%',     // 4/5 printed
                '20%',     // Pause
                '0%'       // Fully printed
              ],
              opacity: 1
            }}
            exit={{ 
              opacity: 0,
              transition: { duration: 0 }
            }}
            transition={{
              duration: 7,
              times: [0, 0.1, 0.15, 0.25, 0.3, 0.4, 0.45, 0.55, 0.6, 1],
              ease: "linear"
            }}
            className="fixed bottom-0 right-4 w-[240px] z-50"
            style={{
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: '13px',
              lineHeight: '1.4',
              filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3)) drop-shadow(0 10px 20px rgba(0,0,0,0.2))',
            }}
          >
            {/* Close Button - positioned outside above the bill */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 7, duration: 0.3 }}
              onClick={onClose}
              className="absolute -top-8 right-0 p-1 hover:opacity-70 transition-opacity bg-transparent border-0 cursor-pointer"
              style={{ zIndex: 1000 }}
            >
              <X size={20} className="text-black" strokeWidth={2} />
            </motion.button>

            <div 
              className="relative overflow-hidden"
              style={{
                background: `
                  linear-gradient(135deg, #f8f8f3 0%, #f5f5f0 50%, #f2f2ed 100%),
                  repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.01) 2px, rgba(0,0,0,0.01) 4px)
                `,
                boxShadow: `
                  inset 0 1px 0 rgba(255,255,255,0.5),
                  inset 0 -1px 0 rgba(0,0,0,0.05),
                  0 2px 4px rgba(0,0,0,0.1)
                `,
                clipPath: `polygon(
                  0 4px,
                  3px 0, 6px 4px,
                  9px 0, 12px 4px,
                  15px 0, 18px 4px,
                  21px 0, 24px 4px,
                  27px 0, 30px 4px,
                  33px 0, 36px 4px,
                  39px 0, 42px 4px,
                  45px 0, 48px 4px,
                  51px 0, 54px 4px,
                  57px 0, 60px 4px,
                  63px 0, 66px 4px,
                  69px 0, 72px 4px,
                  75px 0, 78px 4px,
                  81px 0, 84px 4px,
                  87px 0, 90px 4px,
                  93px 0, 96px 4px,
                  99px 0, 102px 4px,
                  105px 0, 108px 4px,
                  111px 0, 114px 4px,
                  117px 0, 120px 4px,
                  123px 0, 126px 4px,
                  129px 0, 132px 4px,
                  135px 0, 138px 4px,
                  141px 0, 144px 4px,
                  147px 0, 150px 4px,
                  153px 0, 156px 4px,
                  159px 0, 162px 4px,
                  165px 0, 168px 4px,
                  171px 0, 174px 4px,
                  177px 0, 180px 4px,
                  183px 0, 186px 4px,
                  189px 0, 192px 4px,
                  195px 0, 198px 4px,
                  201px 0, 204px 4px,
                  207px 0, 210px 4px,
                  213px 0, 216px 4px,
                  219px 0, 222px 4px,
                  225px 0, 228px 4px,
                  231px 0, 234px 4px,
                  237px 0, 240px 4px,
                  243px 0, 246px 4px,
                  249px 0, 252px 4px,
                  255px 0, 258px 4px,
                  261px 0, 264px 4px,
                  267px 0, 270px 4px,
                  273px 0, 276px 4px,
                  279px 0, 280px 4px,
                  280px 100%,
                  0 100%
                )`
              }}
            >
            {/* Watermark Logo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.25] z-0">
              <img 
                src="/logo.png" 
                alt="Taskzy" 
                className="w-40 h-40 object-contain"
                style={{ 
                  transform: 'rotate(-15deg)',
                  filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.15)) drop-shadow(-1px -1px 2px rgba(255,255,255,0.5)) contrast(1.1) brightness(1.05)'
                }}
              />
            </div>

            {/* Paper texture overlay */}
            <div 
              className="absolute inset-0 pointer-events-none z-[1]"
              style={{
                backgroundImage: `
                  url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E"),
                  radial-gradient(circle at 20% 30%, rgba(139, 115, 85, 0.08) 0%, transparent 50%),
                  radial-gradient(circle at 80% 70%, rgba(160, 130, 95, 0.06) 0%, transparent 50%),
                  radial-gradient(circle at 50% 50%, rgba(180, 150, 110, 0.04) 0%, transparent 60%),
                  radial-gradient(circle at 10% 80%, rgba(150, 120, 90, 0.05) 0%, transparent 40%),
                  radial-gradient(circle at 90% 20%, rgba(170, 140, 100, 0.06) 0%, transparent 45%),
                  repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 3px),
                  repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.015) 2px, rgba(0,0,0,0.015) 3px)
                `,
                mixBlendMode: 'multiply',
                opacity: 0.9
              }}
            ></div>

            {/* Receipt Content */}
            <div className="relative z-10 px-5 py-6 text-[#2a2a2a]">
              {/* Logo Header */}
              <div className="flex justify-center mb-4">
                <img 
                  src="/logo.png" 
                  alt="Taskzy Logo" 
                  className="h-8 w-auto object-contain"
                />
              </div>

              {/* Main Title */}
              <div className="text-center mb-3">
                <div className="text-[16px] font-bold tracking-wide mb-1">TASKZY</div>
                <div className="text-[11px] leading-tight">Work Smarter. Scale Faster.</div>
              </div>

              {/* Divider Line */}
              <div className="my-3" style={{ 
                borderTop: '1px dashed #999',
                opacity: 0.6
              }}></div>

              {/* Plan Name */}
              <div className="text-center mb-2">
                <div className="text-[13px] font-bold">{planData.name.toUpperCase()} PLAN</div>
              </div>

              {/* Price */}
              <div className="text-center mb-3">
                <div className="text-[15px] font-bold">₹{planData.price} / Month</div>
              </div>

              {/* Divider Line */}
              <div className="my-3" style={{ 
                borderTop: '1px dashed #999',
                opacity: 0.6
              }}></div>

              {/* Features */}
              <div className="space-y-1.5 mb-3 text-[11px]">
                {planData.features.slice(0, 4).map((feature, index) => (
                  <div key={index} className="leading-tight">
                    ✓ {feature.name}
                  </div>
                ))}
              </div>

              {/* Divider Line */}
              <div className="my-3" style={{ 
                borderTop: '1px dashed #999',
                opacity: 0.6
              }}></div>

              {/* Thank You Message */}
              <div className="text-center space-y-2 mb-3">
                <div className="text-[11px] font-bold">
                  Thank you for choosing Taskzy.
                </div>
                <div className="text-[10px] leading-snug px-2">
                  Once your plan is activated, you will be<br />
                  redirected to your dashboard to start<br />
                  managing your workspace.
                </div>
              </div>

              {/* Divider Line */}
              <div className="my-3" style={{ 
                borderTop: '1px dashed #999',
                opacity: 0.6
              }}></div>

              {/* Footer */}
              <div className="text-center text-[10px] text-gray-600 space-y-0.5">
                <div>Secure Payment • Instant Activation</div>
              </div>
            </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Perfect for small teams.',
    monthly: 1599,
    yearly: 1279,
    users: 'Up to 7 users',
    color: '#3B5BFC',
    cta: 'Select Plan',
    highlight: false,
    features: [
      { text: 'All Dashboards & Roles', ok: true },
      { text: 'Unlimited Task Management', ok: true },
      { text: 'Advanced Workspace Suite', ok: true },
      { text: 'Flexible Billing & Payment', ok: true },
      { text: 'Multi-Administrator Access', ok: true },
      { text: 'Performance Analytics', ok: true },
      { text: 'Unlimited Cloud Storage', ok: false },
      { text: 'Custom Reports', ok: false },
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    tagline: 'For growing teams.',
    monthly: 2499,
    yearly: 1999,
    users: 'Up to 15 users',
    color: '#7C3AED',
    cta: 'Select Plan',
    highlight: true,
    badge: 'Most popular',
    features: [
      { text: 'All Dashboards & Roles', ok: true },
      { text: 'Unlimited Task Management', ok: true },
      { text: 'Advanced Workspace Suite', ok: true },
      { text: 'Flexible Billing & Payment', ok: true },
      { text: 'Multi-Administrator Access', ok: true },
      { text: 'Performance Analytics', ok: true },
      { text: 'Unlimited Cloud Storage', ok: false },
      { text: 'Custom Reports', ok: false },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    tagline: 'For large organizations.',
    monthly: 4599,
    yearly: 3679,
    users: 'Up to 30 users',
    color: '#12C479',
    cta: 'Select Plan',
    highlight: false,
    features: [
      { text: 'All Dashboards & Roles', ok: true },
      { text: 'Unlimited Task Management', ok: true },
      { text: 'Advanced Workspace Suite', ok: true },
      { text: 'Flexible Billing & Payment', ok: true },
      { text: 'Multi-Administrator Access', ok: true },
      { text: 'Performance Analytics', ok: true },
      { text: 'Unlimited Cloud Storage', ok: true },
      { text: 'Custom Reports', ok: false },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'For maximum scale.',
    monthly: 7199,
    yearly: 5759,
    users: 'Up to 50 users',
    color: '#F97316',
    cta: 'Select Plan',
    highlight: false,
    features: [
      { text: 'All Dashboards & Roles', ok: true },
      { text: 'Unlimited Task Management', ok: true },
      { text: 'Advanced Workspace Suite', ok: true },
      { text: 'Flexible Billing & Payment', ok: true },
      { text: 'Multi-Administrator Access', ok: true },
      { text: 'Performance Analytics', ok: true },
      { text: 'Unlimited Cloud Storage', ok: true },
      { text: 'Custom Reports', ok: true },
    ],
  },
]

export default function PricingSection() {
  const [yearly, setYearly] = useState(false)
  const [selectedCard, setSelectedCard] = useState(1) // Default to Pro (index 1)
  const [cardRefs, setCardRefs] = useState([])
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)

  const handlePlanClick = (plan, index) => {
    setSelectedCard(index)
    
    // Don't show receipt for custom plan
    if (plan.isCustom) {
      return;
    }
    
    setSelectedPlan({
      name: plan.name,
      price: yearly ? plan.yearly : plan.monthly,
      description: plan.tagline,
      ref: `PLAN-${String(index + 1).padStart(4, '0')}`,
      features: plan.features.filter(f => f.ok).map(f => ({ name: f.text }))
    })
    setReceiptOpen(true)
  }

  return (
    <section id="pricing" className="py-32 relative overflow-hidden bg-white">
      {/* Remove gradient overlay */}
      
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-primary font-body mb-4 tracking-wide uppercase">
            Pricing
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-foreground tracking-tight leading-[1.1] font-semibold">
            Invest in your team's velocity
          </h2>
          <p className="mt-6 text-foreground-muted font-body text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-light">
            Flexible pricing designed to scale with your organization. Choose the plan that best fits your team's requirements.
          </p>

          {/* Billing toggle */}
          <div className="mt-10 inline-flex items-center gap-1 rounded-full glass-strong p-1.5 shadow-glass">
            <button
              onClick={() => setYearly(false)}
              className={`relative rounded-full px-6 py-2.5 text-sm font-medium font-body transition-all ${
                !yearly ? 'bg-primary text-primary-foreground shadow-elevated' : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`relative rounded-full px-6 py-2.5 text-sm font-medium font-body transition-all flex items-center gap-2 ${
                yearly ? 'bg-primary text-primary-foreground shadow-elevated' : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              Yearly
              <span className="rounded-full bg-accent-soft text-accent text-xs font-semibold px-2.5 py-0.5">
                20% OFF
              </span>
            </button>
          </div>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-stretch relative max-w-[1600px] mx-auto">
          {/* Moving outline with badge */}
          <motion.div
            className="absolute inset-0 pointer-events-none hidden md:block z-10"
            initial={false}
          >
            <motion.div
              className="absolute border-2 border-primary shadow-floating rounded-3xl"
              animate={{
                x: selectedCard === 0 ? 0 : 
                   selectedCard === 1 ? 'calc(100% + 0.75rem)' : 
                   selectedCard === 2 ? 'calc(200% + 1.5rem)' : 
                   'calc(300% + 2.25rem)',
                width: 'calc(25% - 0.5625rem)',
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              style={{
                height: '100%',
              }}
            />
          </motion.div>

          {/* Selected badge - fixed on Professional plan only */}
          <div className="absolute inset-0 pointer-events-none hidden md:block z-10">
            <div 
              className="absolute -top-3.5"
              style={{
                left: 'calc(25% + 0.375rem + 12.5% - 0.28125rem)',
                transform: 'translateX(-50%)',
              }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground font-body uppercase tracking-wider shadow-elevated">
                Selected
              </span>
            </div>
          </div>

          {plans.map(({ id, name, tagline, monthly, yearly: yearlyPrice, cta, highlight, badge, features, isCustom, users, color }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              onMouseEnter={() => setSelectedCard(i)}
              onClick={() => setSelectedCard(i)}
              className="relative group cursor-pointer z-0"
            >
              {/* Curved Arrow for first plan only */}
              {i === 0 && (
                <>
                  <img 
                    src="/download.svg" 
                    alt="" 
                    className="absolute -top-40 left-[30%] w-56 h-56 z-10"
                    style={{ transform: 'rotate(-15deg)' }}
                  />
                  {/* Trial Included Badge */}
                  <div 
                    className="absolute z-20"
                    style={{
                      top: '-105px',
                      left: 'calc(30% + 90px)',
                      transform: 'rotate(-15deg)'
                    }}
                  >
                    <div 
                      className="rounded-full px-5 py-1.5 text-xs font-semibold"
                      style={{
                        backgroundColor: '#F0F6FF',
                        border: '1px solid #A0C4F5',
                        color: '#146EF5',
                        letterSpacing: '0.02em',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 8px rgba(20, 110, 245, 0.15)'
                      }}
                    >
                      TRIAL INCLUDED
                    </div>
                  </div>
                </>
              )}

              {/* Card content */}
              <div className={`surface-elevated rounded-3xl relative flex flex-col h-full transition-all duration-300 ${
                selectedCard === i ? 'md:border-transparent' : ''
              }`}>
                {/* Remove individual badge - it's now on the moving outline */}

                <div className="p-10 flex flex-col gap-4 flex-1">
                  {/* Plan name + tagline */}
                  <div>
                    <p className="text-2xl font-display font-bold tracking-tight text-gray-900 mb-2">
                      {name}
                    </p>
                    <p className="text-xs font-body leading-relaxed text-gray-500 font-normal">
                      {tagline}
                    </p>
                  </div>

                  {/* Price */}
                  <div>
                    {!isCustom ? (
                      <>
                        {/* Discount Badge + Original Price */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-block text-xs font-bold px-2 py-1 rounded border" style={{ backgroundColor: '#ffe8e0', color: '#ff5733', borderColor: '#ffccb3' }}>
                            {yearly ? '20% OFF' : '10% OFF'}
                          </span>
                          <span className="text-sm text-gray-400 line-through font-normal">
                            ₹{yearly ? Math.round(yearlyPrice * 1.25) : Math.round(monthly * 1.11)}.00
                          </span>
                        </div>
                        
                        {/* Main Price */}
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-display text-5xl tracking-tight leading-none text-foreground font-semibold">
                            ₹<NumberFlow
                              value={yearly ? yearlyPrice : monthly}
                              className="font-display text-5xl tracking-tight"
                            />
                          </span>
                          <span className="text-sm text-foreground-muted font-body ml-1 font-light">
                            /month
                          </span>
                        </div>
                      </>
                    ) : (
                      /* Custom Plan Pricing */
                      <div className="flex items-baseline gap-1.5 h-[72px] flex items-center">
                        <span className="font-display text-3xl tracking-tight leading-none text-foreground font-semibold">
                          Contact for pricing
                        </span>
                      </div>
                    )}
                  </div>

                  {!isCustom && (
                    <div className="text-xs text-gray-600 font-body font-light mb-1.5">
                      For 12 months, you pay ₹{(yearly ? Math.round(yearlyPrice * 12) : Math.round(monthly * 12)).toLocaleString('en-IN')}.00 today – no price increase.
                    </div>
                  )}

                  {/* Free Months + Limited Deal Badges */}
                  <div className="flex items-center gap-2 flex-wrap mb-0.5 min-h-[28px]">
                    {!isCustom && (
                      <>
                        <span className="inline-block text-blue-600 text-sm font-semibold border-b-2 border-dashed border-blue-400 pb-0.5">
                          {users}
                        </span>
                        {i === 1 && (
                          <span className="inline-block text-xs font-normal px-2.5 py-1 rounded" style={{ backgroundColor: '#fff0e6', color: '#ff6b35' }}>
                            Limited-Time Deal
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => handlePlanClick({ id, name, tagline, monthly, yearly: yearlyPrice, features, isCustom }, i)}
                    className={`w-full rounded-full py-3.5 text-sm font-semibold font-body transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2 ${
                      selectedCard === i
                        ? 'bg-primary text-primary-foreground shadow-floating'
                        : 'surface border border-border-soft hover:shadow-elevated'
                    }`}
                  >
                    {cta}
                  </button>

                  {/* Price Guarantee Box - Only for non-custom plans */}
                  {!isCustom && (
                    <div className="bg-green-50 rounded-lg py-2.5 px-4">
                      <p className="text-xs text-green-600 font-medium text-center whitespace-nowrap">
                        Price Guaranteed
                      </p>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="h-px w-full bg-gray-250" style={{ backgroundColor: '#e8e8e8' }} />

                  {/* Features */}
                  <ul className="flex flex-col flex-1 gap-3">
                    {features.map(({ text, ok }, idx) => {
                      // Find the index of the last item with ok === true
                      const lastOkIndex = features.map((f, i) => f.ok ? i : -1).filter(i => i !== -1).pop();
                      const shouldShowBorder = ok && idx !== lastOkIndex;
                      
                      return (
                        <li key={text} className="flex items-start gap-3 text-sm font-body">
                          {ok ? (
                            <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" strokeWidth={2.5} />
                          ) : (
                            <Minus className="w-4 h-4 text-muted-foreground/30 shrink-0 mt-0.5" strokeWidth={2.5} />
                          )}
                          <span className={`${ok ? 'text-foreground font-light' : 'text-muted-foreground/40 font-light'} ${shouldShowBorder ? 'border-b-2 border-dashed border-gray-350' : ''}`}
                            style={shouldShowBorder ? { borderBottomColor: '#c0c0c0' } : {}}>
                            {text}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer note with button */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col md:flex-row items-center justify-center gap-6 mt-12"
        >
          <p className="text-center text-sm text-foreground-muted font-body font-light">
            All plans include a 7-day free trial. No credit card required.
          </p>
        </motion.div>
      </div>

      {/* Billing Receipt */}
      <BillingReceipt
        isOpen={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        planData={selectedPlan}
      />
    </section>
  )
}
