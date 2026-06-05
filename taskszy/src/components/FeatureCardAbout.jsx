import { motion } from 'framer-motion'
import { CreditCard, Network, Wallet, Shield } from 'lucide-react'
import { useRef, useState } from 'react'

const features = [
  {
    icon: CreditCard,
    useCustomIcon: true,
    customIconPath: '/credit-card.png',
    iconSize: 'w-7 h-7',
    title: 'Payment Card Programs',
    description: 'Partners can choose from quick-co-branded card integration to comprehensive card programs.',
  },
  {
    icon: Network,
    useCustomIcon: true,
    customIconPath: '/united.png',
    iconSize: 'w-11 h-11',
    title: 'Stablecoin Network Design',
    description: 'Connecting traditional financial operations with stablecoin infrastructure for immediate settlement and easy reporting.',
  },
  {
    icon: Wallet,
    useCustomIcon: true,
    customIconPath: '/list.png',
    iconSize: 'w-9 h-9',
    title: 'Accepting Payments',
    description: 'Merchants can accept FIAT and crypto payments through terminals, APIs or QR code-based e-commerce solutions.',
  },
  {
    icon: Shield,
    useCustomIcon: true,
    customIconPath: '/security.png',
    iconSize: 'w-9 h-9',
    title: 'Security & Compliance',
    description: 'Enterprise-grade security with full compliance to regulatory requirements and industry standards.',
  },
]

function FeatureCard({ feature, index }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative bg-white border border-border rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300 flex flex-col overflow-hidden"
    >
      {/* Base content */}
      <div className="relative z-10">
        {/* Icon with striped background and border */}
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 relative overflow-hidden border-2 border-primary/30">
          {/* Purple diagonal striped pattern behind icon */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              background: 'repeating-linear-gradient(45deg, #6366f1 0px, #6366f1 1px, transparent 1px, transparent 6px)',
            }}
          />
          {feature.useCustomIcon ? (
            <img 
              src={feature.customIconPath} 
              alt={feature.title}
              className={`${feature.iconSize || 'w-7 h-7'} relative z-10`}
              style={{ filter: 'invert(36%) sepia(88%) saturate(2476%) hue-rotate(231deg) brightness(95%) contrast(92%)' }}
            />
          ) : (
            <feature.icon className="w-7 h-7 text-primary relative z-10" strokeWidth={2} />
          )}
        </div>

        {/* Title */}
        <h3 className="font-display text-xl font-semibold text-foreground mb-3 tracking-tight">
          {feature.title}
        </h3>

        {/* Description */}
        <p className="text-foreground-muted font-body text-sm leading-relaxed mb-6 flex-grow">
          {feature.description}
        </p>

        {/* Read More Button with slide-in animation */}
        <button className="relative text-xs font-medium text-foreground border border-foreground px-4 py-2 rounded-full overflow-hidden group transition-all uppercase tracking-wider w-fit">
          <span className="relative z-10 transition-colors duration-300 group-hover:text-background">
            Read More
          </span>
          <span className="absolute inset-0 bg-foreground transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-full"></span>
        </button>
      </div>

      {/* Overlay with circular reveal animation */}
      <motion.div
        initial={{ clipPath: 'circle(0px at 28px 28px)', opacity: 0 }}
        animate={{ 
          clipPath: isHovered ? 'circle(160% at 28px 28px)' : 'circle(0px at 28px 28px)',
          opacity: isHovered ? 1 : 0
        }}
        transition={{ 
          clipPath: {
            duration: isHovered ? 1.8 : 0.5,
            ease: [0.45, 0, 0.15, 1]
          },
          opacity: {
            duration: isHovered ? 0.4 : 0.3,
            ease: 'easeInOut'
          }
        }}
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 pointer-events-none"
      />
    </motion.div>
  )
}

export default function FeatureCardAbout() {
  return (
    <section className="py-32 bg-white relative overflow-hidden">
      <div className="max-w-[1560px] mx-auto px-16 md:px-24 lg:px-32">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-primary font-body mb-4 tracking-wide uppercase">
            Who We Are
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-foreground tracking-tight leading-[1.1] font-semibold mb-6">
            Programmable. Profitable. Digital account layer.
          </h2>
          <p className="text-foreground-muted font-body text-base md:text-lg max-w-4xl mx-auto leading-relaxed">
            TASKZY empowers its partners' payment programs by providing processing, acquiring rails, and stablecoin-fueled settlements. This allows partners to concentrate on delivering value to their users, while TASKZY handles the intricate payment-related tasks, all while simplifying compliance and banking requirements.
          </p>
        </motion.div>

        {/* Four boxes grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
