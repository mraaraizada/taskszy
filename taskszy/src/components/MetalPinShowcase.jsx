import { motion } from 'framer-motion'
import MetalPinCard from './MetalPinCard'

export default function MetalPinShowcase() {
  const cards = [
    {
      id: 1,
      delay: 0
    },
    {
      id: 2,
      delay: 0.2
    },
    {
      id: 3,
      delay: 0.4
    }
  ]

  return (
    <section className="relative pt-4 pb-44 bg-gradient-to-b from-white via-gray-50 to-white overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgb(229, 231, 235) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(229, 231, 235) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 md:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-8"
        >
          <p className="text-sm font-medium text-accent font-body mb-3 tracking-wide uppercase">
            Premium Collection
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-foreground tracking-tight leading-[1.1]">
            Crafted with precision
          </h2>
          <p className="mt-4 text-muted-foreground font-body text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Experience the perfect blend of design and functionality with our metal collection series
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="flex flex-wrap items-center justify-center gap-12 lg:gap-16">
          {cards.map((card) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{
                duration: 0.8,
                delay: card.delay,
                ease: [0.22, 1, 0.36, 1]
              }}
            >
              <MetalPinCard />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
