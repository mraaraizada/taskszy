import { motion } from 'framer-motion'
import RippleGrid from './RippleGrid'
import RadarRings from './RadarRings'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
})

const integrations = [
  {
    id: 1,
    name: 'Zapier',
    description: 'Connect with Taskzy with dozens of applications without code',
    icon: (
      <div className="w-14 h-14 bg-[#FF4A00] flex items-center justify-center">
        <span className="text-white font-bold text-xs tracking-tight">zapier</span>
      </div>
    ),
  },
  {
    id: 2,
    name: 'Readwise',
    description: 'Sync your reading highlights and notes with Taskzy.',
    icon: (
      <div className="w-14 h-14 bg-white flex items-center justify-center border border-gray-200">
        <span className="text-black font-bold text-3xl">R</span>
      </div>
    ),
  },
  {
    id: 3,
    name: 'Google and Outlook',
    description: 'Integrate your contacts and calendars',
    icon: (
      <div className="flex gap-2">
        <div className="w-9 h-9 bg-[#4285F4] rounded flex items-center justify-center">
          <span className="text-white font-bold text-xs">G</span>
        </div>
        <div className="w-9 h-9 bg-[#0078D4] rounded flex items-center justify-center">
          <span className="text-white font-bold text-xs">O</span>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    name: 'Chrome and Safari',
    description: 'Save web clips and sync with your Kindle',
    icon: (
      <div className="flex gap-2">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 via-yellow-500 to-green-500 flex items-center justify-center relative">
          <div className="w-6 h-6 bg-white rounded-full"></div>
        </div>
        <div className="w-9 h-9 bg-[#006CFF] rounded-full flex items-center justify-center relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white rounded-full" style={{ 
              borderTopColor: 'transparent',
              transform: 'rotate(45deg)'
            }}></div>
          </div>
        </div>
      </div>
    ),
  },
]

export default function IntegrationGrid() {
  return (
    <div className="relative w-full min-h-[500px]">
      {/* RippleGrid Background */}
      <div className="absolute inset-0 overflow-hidden">
        <RippleGrid
          enableRainbow={false}
          gridColor="#967fed"
          rippleIntensity={0.05}
          gridSize={25}
          gridThickness={15}
          mouseInteraction={true}
          mouseInteractionRadius={1.2}
          opacity={0.8}
          rippleSpeed={0.3}
          fadeDistance={3.0}
          vignetteStrength={0.5}
        />
      </div>

      {/* 2x2 Grid Container */}
      <div className="grid grid-cols-2 gap-0 relative h-full min-h-[500px] z-10" style={{ transform: 'translateY(-8px)' }}>
        {/* Vertical divider line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gray-700/50 -translate-x-1/2 z-10"></div>
        
        {/* Horizontal divider line */}
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gray-700/50 -translate-y-1/2 z-10"></div>

        {/* Central circular icon */}
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          {/* Radar Rings Animation */}
          <RadarRings />
          
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 via-purple-500 to-violet-600 flex items-center justify-center shadow-xl shadow-purple-500/40">
              <div className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center">
                <span className="text-white font-display font-bold text-2xl">✦</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Grid Items */}
        {integrations.map((integration, index) => (
          <motion.div
            key={integration.id}
            {...fadeUp(0.1 * index)}
            className="flex flex-col items-center justify-center p-10 md:p-16 text-center relative min-h-[250px]"
          >
            {/* Hide Zapier and Readwise cards but keep the space */}
            {integration.id === 1 || integration.id === 2 ? (
              <div className="opacity-0 pointer-events-none">
                {/* Empty space placeholder */}
              </div>
            ) : (
              <>
                {/* Icon */}
                <div className="mb-5">
                  {integration.icon}
                </div>

                {/* Name */}
                <h3 className="text-white font-semibold text-lg md:text-xl mb-3">
                  {integration.name}
                </h3>

                {/* Description */}
                <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-[240px]">
                  {integration.description}
                </p>
              </>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
