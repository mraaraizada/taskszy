import { motion } from 'framer-motion'
import { Plug, SlidersHorizontal, Zap, BarChart3 } from 'lucide-react'
import StickyTabs from './ui/sticky-section-tabs'

const steps = [
  {
    id: 'connect',
    title: 'Step 1 — Connect your tools',
    icon: Plug,
    heading: 'Plug in your entire stack in minutes',
    description:
      'Taskzy integrates with 200+ tools out of the box. From Slack and Salesforce to custom APIs — connect once and let the platform handle the rest.',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=900&h=500&fit=crop',
    imageAlt: 'Server infrastructure connections',
    bullets: ['OAuth one-click auth', 'REST & GraphQL support', 'No-code connector builder'],
  },
  {
    id: 'configure',
    title: 'Step 2 — Configure your workflows',
    icon: SlidersHorizontal,
    heading: 'Build automations without writing code',
    description:
      'Use our visual workflow builder to define triggers, conditions, and actions. Drag, drop, and deploy — no engineering required.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&h=500&fit=crop',
    imageAlt: 'Dashboard workflow configuration',
    bullets: ['Visual drag-and-drop editor', 'Conditional branching logic', 'Reusable workflow templates'],
  },
  {
    id: 'automate',
    title: 'Step 3 — Automate at scale',
    icon: Zap,
    heading: 'Let intelligent agents do the heavy lifting',
    description:
      "Taskzy's AI agents learn your patterns and execute tasks autonomously — handling thousands of operations simultaneously without breaking a sweat.",
    image: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=900&h=500&fit=crop',
    imageAlt: 'AI automation in action',
    bullets: ['Parallel task execution', 'Self-healing error recovery', 'Real-time event triggers'],
  },
  {
    id: 'analyse',
    title: 'Step 4 — Analyse and optimise',
    icon: BarChart3,
    heading: 'Turn data into decisions instantly',
    description:
      'Every action is logged, measured, and surfaced in your analytics dashboard. Spot bottlenecks, track ROI, and continuously improve your workflows.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&h=500&fit=crop',
    imageAlt: 'Analytics dashboard with charts',
    bullets: ['Live performance metrics', 'Custom KPI dashboards', 'Exportable audit logs'],
  },
]

export default function HowItWorks() {
  return (
    <section>
      {/* Section header — outside the dark sticky tabs */}
      <div className="py-20 bg-background text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-sm font-medium text-accent font-body mb-3 tracking-wide uppercase">
            How it works
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-foreground tracking-tight leading-[1.1]">
            From setup to scale in four steps
          </h2>
          <p className="mt-4 text-muted-foreground font-body text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Taskzy is designed to get you running fast — and keep you running at full speed.
          </p>
        </motion.div>
      </div>

      {/* Sticky scrolling steps */}
      <StickyTabs
        mainNavHeight="0px"
        rootClassName="text-white"
        navSpacerClassName=""
        sectionClassName="bg-[#0e0e0e]"
        stickyHeaderContainerClassName="shadow-xl"
        headerContentWrapperClassName="border-b border-t border-white/10 bg-[#0a0a0a]"
        headerContentLayoutClassName="mx-auto max-w-6xl px-6 md:px-12 py-5"
        titleClassName="my-0 text-xl font-medium leading-none md:text-2xl text-white/80"
        contentLayoutClassName="mx-auto max-w-6xl px-6 md:px-12 py-20"
      >
        {steps.map(({ id, title, icon: Icon, heading, description, image, imageAlt, bullets }) => (
          <StickyTabs.Item key={id} id={id} title={title}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Text */}
              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 bg-accent/20 mb-6">
                  <Icon className="w-6 h-6 text-accent" strokeWidth={1.75} />
                </div>
                <h3 className="font-display text-3xl md:text-4xl text-white tracking-tight leading-[1.1] mb-4">
                  {heading}
                </h3>
                <p className="text-white/60 font-body text-base leading-relaxed mb-8">
                  {description}
                </p>
                <ul className="space-y-3">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-center gap-3 text-sm text-white/70 font-body">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Image */}
              <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <img
                  src={image}
                  alt={imageAlt}
                  className="w-full h-64 md:h-80 object-cover"
                />
              </div>
            </div>
          </StickyTabs.Item>
        ))}
      </StickyTabs>
    </section>
  )
}
