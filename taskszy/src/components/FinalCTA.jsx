import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export default function FinalCTA() {
  return (
    <section className="py-28 bg-secondary/40">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="bg-foreground px-10 py-20 text-center flex flex-col items-center gap-6"
        >
          <h2 className="font-display text-4xl md:text-5xl lg:text-[3.25rem] text-background tracking-tight leading-[1.1] max-w-2xl">
            Start managing everything seamlessly today
          </h2>
          <p className="text-background/60 font-body text-base md:text-lg max-w-md leading-relaxed">
            Join 500+ teams who've already replaced busywork with intelligent automation.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <a href="/app" className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-medium font-body bg-background text-foreground hover:opacity-90 transition-opacity cursor-pointer">
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </a>
            <a href="#pricing" className="rounded-full px-7 py-3 text-sm font-medium font-body border border-background/30 text-background hover:bg-background/10 transition-colors cursor-pointer">
              View pricing
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
