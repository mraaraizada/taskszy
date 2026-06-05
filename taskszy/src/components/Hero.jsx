import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import DashboardPreview from './DashboardPreview'
import { UpgradeBanner } from './ui/upgrade-banner'

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4'

const fadeUp = (y, delay = 0, duration = 0.6) => ({
  initial: { opacity: 0, y },
  animate: { opacity: 1, y: 0 },
  transition: { duration, delay, ease: [0.22, 1, 0.36, 1] },
})

export default function Hero() {
  return (
    <section className="relative flex-1 flex flex-col items-center justify-start pt-8 overflow-hidden px-4">
      {/* Background Video - no blur overlay */}
      <video
        src={VIDEO_URL}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* Content - top section */}
      <div className="relative z-10 flex flex-col items-center w-full">
        {/* 1. Trust Badge */}
        <motion.div {...fadeUp(10, 0, 0.5)} className="mb-4">
          <div className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full px-5 py-2 text-sm">
            <span className="text-xl">🏆</span>
            <span className="font-medium text-foreground">Trusted by 500+ teams</span>
          </div>
        </motion.div>

        {/* 2. Headline - centered with 3 lines - larger size */}
        <motion.h1
          {...fadeUp(16, 0.1)}
          className="text-center font-display text-5xl md:text-6xl lg:text-7xl leading-[1.1] tracking-tight text-foreground max-w-5xl font-semibold"
        >
          The Complete Workspace
          <br />
          That Keeps
          <br />
          Teams <span className="text-primary">In Sync</span>
        </motion.h1>

        {/* 3. Subheadline - centered */}
        <motion.p
          {...fadeUp(16, 0.2)}
          className="mt-4 text-center text-base md:text-lg text-foreground-muted max-w-[680px] leading-relaxed font-body font-normal"
        >
          Everything your team needs to manage tasks, collaborate, budgets, and every stage of work, from idea to completion, in centralized workspace.
        </motion.p>

        {/* 4. CTA Buttons */}
        <motion.div {...fadeUp(16, 0.3)} className="mt-5 flex flex-col items-center">
          <a href="/app" className="relative rounded-full px-7 py-3 text-sm font-medium font-body bg-foreground text-background overflow-hidden group transition-all shadow-sm hover:shadow-md active:scale-[0.98] border-2 border-foreground cursor-pointer">
            <span className="relative z-10 transition-colors duration-300 group-hover:text-foreground">
              Create Workspace
            </span>
            <span className="absolute inset-0 bg-background transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-full"></span>
          </a>
        </motion.div>

        {/* 5. Dashboard Preview - positioned with spacing */}
        <motion.div 
          {...fadeUp(30, 0.5, 0.8)} 
          className="w-full flex justify-center -mt-4"
        >
          <DashboardPreview />
        </motion.div>
      </div>
    </section>
  )
}
