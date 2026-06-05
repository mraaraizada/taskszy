import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import CountUp from './CountUp'
import CollectionPreview from './CollectionPreview'
import WaitlistButton from './WaitlistButton'
import PolicyModal from './PolicyModal'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
})

const blurFadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20, filter: 'blur(10px)' },
  whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
  viewport: { once: true },
  transition: { 
    duration: 0.5, 
    delay, 
    ease: [0.22, 1, 0.36, 1],
    filter: { duration: 0.3 }
  },
})

const businessFunctions = [
  { name: 'Task Management' },
  { name: 'Team Collaboration' },
  { name: 'Budget & Payments' },
  { name: 'Performance Analytics' },
  { name: 'Scribe & Documentation' },
  { name: 'Calendar & Scheduling' },
]

const integrations = [
  { name: 'Dashboards' },
  { name: 'Workflows' },
  { name: 'Collaboration' },
  { name: 'Budgets' },
  { name: 'Permissions' },
  { name: 'Metrics' },
  { name: 'Storage' },
  { name: 'Reports' },
]

const features = [
  {
    title: 'One auth layer',
    description: 'No hardcoded API keys. No broken OAuth flows. Whether it\'s Claude making the call or a workflow, every credential is managed the same way.',
  },
  {
    title: 'One audit trail',
    description: 'Every action from any AI assistant or developer tool lands in a single admin log. Shadow IT becomes visible IT.',
  },
  {
    title: 'One policy set',
    description: 'IT decides which apps and actions are available. Those rules apply across MCP clients and SDK callers equally. One configuration, no exceptions.',
  },
  {
    title: 'One runtime',
    description: 'Retries, error recovery, reliability. All backed by Taskzy\'s 13-year-old production infrastructure. Not by whatever the LLM decided to write last Tuesday.',
  },
]

export default function IntegrationArchitecture() {
  return (
    <section id="solutions" className="section-spacing-lg relative overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Heading Section - Matching CompleteSuite style */}
        <div className="text-center mb-16">
          <motion.p
            {...fadeUp(0)}
            className="text-sm font-medium text-primary font-body mb-4 tracking-wide uppercase"
          >
            WORKSPACE
          </motion.p>
          <motion.h2 
            {...fadeUp(0.1)}
            className="font-display text-4xl md:text-5xl text-foreground tracking-tight leading-[1.1] font-semibold"
          >
            Manage Tasks, Teams & Budget.
          </motion.h2>
          <motion.p 
            {...fadeUp(0.2)}
            className="mt-6 text-foreground-muted font-body text-base md:text-lg max-w-3xl mx-auto leading-relaxed font-light"
          >
            Taskzy unifies projects, workflows, team collaboration, budget, and performance insights into a workspace built for modern organizations.
          </motion.p>
        </div>
        
        {/* Outlined Container - Wireframe Style with Rounded Edges */}
        <motion.div 
          {...fadeUp(0)}
          className="border-2 border-foreground bg-white overflow-hidden rounded-3xl"
        >
          {/* Top Bar */}
          <div className="px-8 py-5 border-b-2 border-foreground">
            <div className="flex items-center gap-3">
              <span className="font-display text-xl font-semibold text-foreground">Taskzy</span>
              <span className="text-foreground-muted font-medium">Workspace</span>
            </div>
          </div>

          {/* Main Content - Two Columns */}
          <div className="grid md:grid-cols-2 border-b-2 border-foreground">
            {/* Left Column - Headline */}
            <div className="p-12 border-r-2 border-foreground flex items-center">
              <div>
                <h2 className="font-display text-4xl md:text-5xl leading-[0.95] text-foreground font-semibold">
                  One platform.
                  <br />
                  Full control.
                  <br />
                  <span className="text-primary">Pure efficiency.</span>
                </h2>
              </div>
            </div>

            {/* Right Column - Description */}
            <div className="p-12 flex items-center">
              <p className="text-base text-foreground-muted leading-relaxed font-body">
                Integrated platform for task orchestration, team collaboration, financial management, and operational analytics. Empower teams to maintain alignment, progress, and achieve objectives through systematic workflow management.
              </p>
            </div>
          </div>

          {/* Architecture Diagram */}
          <div className="p-16 bg-white border-b-2 border-foreground">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center relative">
              
              {/* Left Side - Business Functions */}
              <div className="space-y-4 relative">
                
                {/* Left-facing bracket connecting to center */}
                <svg 
                  className="absolute pointer-events-none" 
                  style={{ 
                    right: '-24px',
                    top: '30px',
                    width: '40px', 
                    height: 'calc(100% - 30px)', 
                    zIndex: 5 
                  }}
                  viewBox="0 0 40 300"
                  preserveAspectRatio="none"
                >
                  {/* Rounded bracket - top horizontal with curve */}
                  <line x1="20" y1="10" x2="25" y2="10" stroke="currentColor" strokeWidth="2" className="text-foreground" />
                  <path d="M 25 10 Q 30 10, 30 15" stroke="currentColor" strokeWidth="2" fill="none" className="text-foreground" />
                  
                  {/* Vertical line */}
                  <line x1="30" y1="15" x2="30" y2="285" stroke="currentColor" strokeWidth="2" className="text-foreground" />
                  
                  {/* Bottom curve and horizontal */}
                  <path d="M 30 285 Q 30 290, 25 290" stroke="currentColor" strokeWidth="2" fill="none" className="text-foreground" />
                  <line x1="25" y1="290" x2="20" y2="290" stroke="currentColor" strokeWidth="2" className="text-foreground" />
                </svg>
                
                {businessFunctions.map((func, i) => (
                  <motion.div
                    key={func.name}
                    {...blurFadeUp(0.1 * i)}
                    className="px-5 py-3 border-2 border-foreground bg-white rounded-xl relative z-10 mb-3"
                  >
                    <div className="text-sm font-semibold text-foreground">{func.name}</div>
                  </motion.div>
                ))}

              </div>

              {/* Center - Taskzy Workspace OS */}
              <motion.div 
                {...blurFadeUp(0.2)}
                className="flex justify-center relative z-10"
              >
                {/* Horizontal lines at same level - positioned exactly outside the box */}
                <div className="absolute right-full top-1/2 w-8 h-0.5 bg-foreground -translate-y-1/2 z-20" />
                <div className="absolute left-full top-1/2 w-8 h-0.5 bg-foreground -translate-y-1/2 z-20" />
                
                <div className="px-12 py-16 border-2 border-foreground bg-white rounded-2xl relative overflow-hidden">
                  <div className="text-center">
                    <p className="font-display text-2xl font-semibold text-foreground mb-2">
                      Taskzy Workspace
                    </p>
                    <p className="text-xs text-foreground-muted font-medium mb-2 max-w-[200px]">
                      Centralized hub for projects, resources, finances, documentation, and analytics.
                    </p>
                    
                    {/* Animated loading blocks */}
                    <div className="relative overflow-hidden mx-auto h-6 flex items-center justify-center mt-4">
                      <motion.div 
                        className="font-mono text-sm tracking-wider flex"
                        style={{ fontFamily: 'monospace' }}
                      >
                        {[...Array(14)].map((_, i) => (
                          <motion.span
                            key={i}
                            className="inline-block"
                            animate={{
                              color: ['#c5c6fb', '#9a9bf9', '#6f73f7', '#5b5ff8', '#3a3ed5', '#5b5ff8', '#6f73f7', '#9a9bf9', '#c5c6fb'],
                            }}
                            transition={{
                              duration: 0.8,
                              repeat: Infinity,
                              ease: "linear",
                              delay: i * 0.04,
                            }}
                          >
                            {i < 3 ? '▓' : i < 6 ? '▒' : i < 9 ? '░' : i < 12 ? '▒' : '▓'}
                          </motion.span>
                        ))}
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Right Side - Integrations */}
              <div className="space-y-4 relative">
                
                {/* Main bracket structure - ] with rounded corners */}
                <svg 
                  className="absolute pointer-events-none" 
                  style={{ 
                    left: '-24px',
                    top: '30px',
                    width: '40px', 
                    height: 'calc(100% - 37.6px)', 
                    zIndex: 5 
                  }}
                  viewBox="0 0 40 300"
                  preserveAspectRatio="none"
                >
                  {/* Rounded bracket - top horizontal with curve */}
                  <line x1="20" y1="10" x2="15" y2="10" stroke="currentColor" strokeWidth="2" className="text-foreground" />
                  <path d="M 15 10 Q 10 10, 10 15" stroke="currentColor" strokeWidth="2" fill="none" className="text-foreground" />
                  
                  {/* Vertical line */}
                  <line x1="10" y1="15" x2="10" y2="285" stroke="currentColor" strokeWidth="2" className="text-foreground" />
                  
                  {/* Bottom curve and horizontal */}
                  <path d="M 10 285 Q 10 290, 15 290" stroke="currentColor" strokeWidth="2" fill="none" className="text-foreground" />
                  <line x1="15" y1="290" x2="20" y2="290" stroke="currentColor" strokeWidth="2" className="text-foreground" />
                </svg>

                <div className="grid grid-cols-2 gap-3 relative z-10">
                  {integrations.map((app, i) => (
                    <motion.div
                      key={app.name}
                      {...blurFadeUp(0.05 * i)}
                      className="px-4 py-3 border-2 border-foreground bg-white rounded-lg"
                    >
                      <span className="text-xs font-medium text-foreground">{app.name}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Feature Boxes */}
          {/* <div className="grid md:grid-cols-4 border-b-2 border-foreground">
            <motion.div
              {...fadeUp(0)}
              className="p-8 border-r-2 border-foreground"
            >
              <h3 className="font-display text-lg font-semibold text-foreground mb-3">
                {features[0].title}
              </h3>
              <p className="text-sm text-foreground-muted leading-relaxed">
                {features[0].description}
              </p>
            </motion.div>

            <motion.div
              {...fadeUp(0.1)}
              className="p-8 border-r-2 border-foreground flex flex-col items-start justify-start"
            >
              <h3 className="font-display text-lg font-semibold text-foreground mb-6">
                {features[1].title}
              </h3>
              <div className="flex-1 flex items-center justify-start w-full mt-20" style={{ marginLeft: '2.3rem' }}>
                <WaitlistButton />
              </div>
            </motion.div>

            <motion.div
              {...fadeUp(0.2)}
              className="pt-4 px-8 pb-8 border-r-2 border-foreground flex flex-col relative"
            >
              <h3 className="font-display text-lg font-semibold text-foreground mb-3">
                {features[2].title}
              </h3>
              <div className="flex-1 relative">
                <PolicyModal />
              </div>
            </motion.div>
            
            <motion.div
              {...fadeUp(0.3)}
              className="p-8 flex flex-col items-start justify-start"
            >
              <h3 className="font-display text-lg font-semibold text-foreground mb-6">
                One runtime
              </h3>
              <div className="flex-1 flex items-center justify-center w-full">
                <CollectionPreview />
              </div>
            </motion.div>
          </div> */}

          {/* Bento Grid Section */}
          <div className="grid grid-cols-6 auto-rows-[240px] gap-0">
            {/* Typography - Tall (2 cols x 2 rows) */}
            <div className="col-span-2 row-span-2 border-r-2 border-b-2 border-foreground p-8 flex items-center justify-center">
              <span className="text-8xl font-serif">Aa</span>
            </div>

            {/* Layouts - Standard (2 cols x 1 row) */}
            <div className="col-span-2 row-span-1 border-r-2 border-b-2 border-foreground p-8 flex items-center justify-center">
              <div className="flex gap-2">
                <div className="w-12 h-12 bg-gray-300 rounded"></div>
                <div className="w-12 h-12 bg-gray-300 rounded"></div>
                <div className="w-12 h-12 bg-gray-300 rounded"></div>
              </div>
            </div>

            {/* Global CDN - Tall (2 cols x 2 rows) */}
            <div className="col-span-2 row-span-2 border-b-2 border-foreground p-8 flex items-center justify-center">
            </div>

            {/* Speed - Standard (2 cols x 1 row) */}
            <div className="col-span-2 row-span-1 border-r-2 border-b-2 border-foreground p-8 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-semibold">100ms</div>
                <div className="w-32 h-2 bg-gray-200 rounded-full mt-3 mx-auto">
                  <div className="w-full h-full bg-foreground rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Security First - Wide (3 cols x 1 row) */}
            <div className="col-span-3 row-span-1 border-r-2 border-foreground p-8 flex items-center justify-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
            </div>

            {/* Mobile Ready - Wide (3 cols x 1 row) */}
            <div className="col-span-3 row-span-1 p-8 flex items-center justify-center">
              <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                <path d="M12 18h.01"/>
              </svg>
            </div>
          </div>

          {/* CTA Buttons - temporarily hidden */}
          {/* <div className="p-8 bg-white flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              {...fadeUp(0)}
              className="relative px-8 py-4 bg-primary text-primary-foreground font-semibold text-sm overflow-hidden group transition-all border-2 border-foreground rounded-xl"
            >
              <span className="relative z-10 transition-colors duration-300 group-hover:text-background">
                Learn more about MCP
              </span>
              <span className="absolute inset-0 bg-foreground transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-[10px]"></span>
            </motion.button>
            <motion.button
              {...fadeUp(0.1)}
              className="relative px-8 py-4 bg-foreground text-background font-semibold text-sm overflow-hidden group transition-all border-2 border-foreground rounded-xl"
            >
              <span className="relative z-10 transition-colors duration-300 group-hover:text-primary-foreground">
                Get started with Taskzy SDK
              </span>
              <span className="absolute inset-0 bg-primary transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-[10px]"></span>
            </motion.button>
          </div> */}
        </motion.div>

      </div>
    </section>
  )
}
