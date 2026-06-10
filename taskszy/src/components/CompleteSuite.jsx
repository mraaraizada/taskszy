import { motion } from 'framer-motion'

export default function CompleteSuite() {
  return (
    <section className="py-20 bg-white mb-32">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-sm font-medium text-primary font-body mb-4 tracking-wide uppercase">
            Comprehensive Platform
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-foreground tracking-tight leading-[1.1] font-semibold">
            Integrated Solution for Modern Teams
          </h2>
          <p className="mt-6 text-foreground-muted font-body text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-light">
            From task workflows and team collaboration to budget and performance analytics.
          </p>
        </motion.div>

        {/* Icon copy without shadow to the right */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 1.3 }}
          className="grid grid-cols-4 gap-x-36 gap-y-6 mt-16 justify-center"
          style={{ width: 'fit-content', margin: '4rem auto' }}
        >
          {[...Array(16)].map((_, index) => {
            const labels = [
              'Dashboards',
              'Analysis', 
              'Reports',
              'Progress',
              'Stages',
              'Events',
              'Meetings',
              'Updates',
              'Chat',
              'Notes',
              'Excel',
              'Import & Export',
              'Payments',
              'Roles',
              'Permissions',
              'Profile'
            ];
            
            return (
            <motion.div 
              key={index} 
              className="flex flex-col items-center gap-3 cursor-pointer"
              whileHover={{ 
                scale: 1.1,
                y: -8,
                transition: { 
                  type: "spring", 
                  stiffness: 400, 
                  damping: 10 
                }
              }}
              whileTap={{ scale: 0.95 }}
            >
              <div style={{ width: '110px', height: '110px' }}>
              {/* 3D Glass Container */}
              <div 
                className="relative rounded-[16px] flex items-center justify-center w-full h-full"
                style={{
                  background: `
                    linear-gradient(145deg, 
                      rgba(255, 255, 255, 0.65) 0%, 
                      rgba(255, 255, 255, 0.5) 20%,
                      rgba(255, 255, 255, 0.35) 50%,
                      rgba(255, 255, 255, 0.25) 75%,
                      rgba(255, 255, 255, 0.15) 100%
                    )
                  `,
                  backdropFilter: 'blur(50px) saturate(200%) brightness(1.1)',
                  WebkitBackdropFilter: 'blur(50px) saturate(200%) brightness(1.1)',
                  border: '2.5px solid rgba(255, 255, 255, 0.7)',
                  borderTop: '3px solid rgba(255, 255, 255, 0.9)',
                  borderLeft: '2.5px solid rgba(255, 255, 255, 0.8)',
                  borderBottom: '2px solid rgba(255, 255, 255, 0.4)',
                  borderRight: '2px solid rgba(255, 255, 255, 0.45)',
                  boxShadow: `
                    0 15px 40px rgba(0, 0, 0, 0.08),
                    0 8px 16px rgba(0, 0, 0, 0.06),
                    0 4px 8px rgba(0, 0, 0, 0.04),
                    inset 0 5px 15px rgba(255, 255, 255, 0.8),
                    inset 0 -6px 18px rgba(0, 0, 0, 0.05),
                    inset 5px 0 15px rgba(255, 255, 255, 0.6),
                    inset -5px 0 15px rgba(0, 0, 0, 0.03),
                    inset 0 0 50px rgba(255, 255, 255, 0.25)
                  `,
                  transform: 'perspective(1000px) rotateX(2deg) rotateY(-2deg)',
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Top-left liquid highlight - enhanced */}
                <div 
                  className="absolute inset-0 rounded-[16px] pointer-events-none"
                  style={{
                    background: `
                      radial-gradient(ellipse at 15% 15%, 
                        rgba(255, 255, 255, 0.95) 0%, 
                        rgba(255, 255, 255, 0.7) 8%,
                        rgba(255, 255, 255, 0.4) 15%,
                        rgba(255, 255, 255, 0.15) 25%,
                        transparent 45%
                      )
                    `,
                  }}
                />
                
                {/* Bottom-right deep shadow - enhanced */}
                <div 
                  className="absolute inset-0 rounded-[16px] pointer-events-none"
                  style={{
                    background: `
                      radial-gradient(ellipse at 85% 85%, 
                        rgba(0, 0, 0, 0.15) 0%, 
                        rgba(0, 0, 0, 0.08) 15%,
                        transparent 35%
                      )
                    `,
                  }}
                />
                
                {/* Top edge glow */}
                <div 
                  className="absolute inset-0 rounded-[16px] pointer-events-none"
                  style={{
                    background: `
                      linear-gradient(180deg, 
                        rgba(255, 255, 255, 0.5) 0%, 
                        transparent 20%
                      )
                    `,
                  }}
                />
                
                {/* Left edge glow */}
                <div 
                  className="absolute inset-0 rounded-[16px] pointer-events-none"
                  style={{
                    background: `
                      linear-gradient(90deg, 
                        rgba(255, 255, 255, 0.4) 0%, 
                        transparent 20%
                      )
                    `,
                  }}
                />
                
                {/* Bottom edge darkness */}
                <div 
                  className="absolute inset-0 rounded-[16px] pointer-events-none"
                  style={{
                    background: `
                      linear-gradient(0deg, 
                        rgba(0, 0, 0, 0.12) 0%, 
                        transparent 20%
                      )
                    `,
                  }}
                />
                
                {/* Right edge darkness */}
                <div 
                  className="absolute inset-0 rounded-[16px] pointer-events-none"
                  style={{
                    background: `
                      linear-gradient(270deg, 
                        rgba(0, 0, 0, 0.1) 0%, 
                        transparent 20%
                      )
                    `,
                  }}
                />
                
                {/* Diagonal glass shine effect - enhanced */}
                <div 
                  className="absolute inset-0 rounded-[16px] pointer-events-none"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.5) 12%, rgba(255, 255, 255, 0.1) 30%, transparent 50%, transparent 70%, rgba(255, 255, 255, 0.3) 88%, rgba(255, 255, 255, 0.6) 100%)',
                  }}
                />
                
                {/* Liquid reflection streak */}
                <div 
                  className="absolute inset-0 rounded-[16px] pointer-events-none overflow-hidden"
                  style={{
                    background: 'linear-gradient(145deg, transparent 0%, transparent 36%, rgba(255, 255, 255, 0.8) 44%, rgba(255, 255, 255, 1) 50%, rgba(255, 255, 255, 0.8) 56%, transparent 64%, transparent 100%)',
                    transform: 'translateX(-20%)',
                    filter: 'blur(4px)',
                  }}
                />
                
                {/* Curved edge lighting for 3D bulge effect */}
                <div 
                  className="absolute inset-0 rounded-[16px] pointer-events-none"
                  style={{
                    boxShadow: `
                      inset 0 0 0 1.5px rgba(255, 255, 255, 0.3),
                      inset 3px 3px 6px rgba(255, 255, 255, 0.5),
                      inset -3px -3px 6px rgba(0, 0, 0, 0.1)
                    `,
                  }}
                />
                
                <img 
                  src={index === 0 ? "/dashboard_10397277.png" : index === 1 ? "/3.png" : index === 2 ? "/analytics_17257787.png" : index === 3 ? "/13.png" : index === 4 ? "/workflow_14662749.png" : index === 5 ? "/10.png" : index === 6 ? "/8.png" : index === 7 ? "/1.png" : index === 8 ? "/support_18296255.png" : index === 9 ? "/note_5406380.png" : index === 11 ? "/15.png" : index === 12 ? "/2.png" : index === 13 ? "/user_9977567.png" : index === 14 ? "/14.png" : index === 15 ? "/16.png" : "/xls_8361442.png"}
                  alt={index === 0 ? "Dashboard icon" : index === 1 ? "Icon 3" : index === 2 ? "Analytics icon" : index === 3 ? "Icon 13" : index === 4 ? "Workflow icon" : index === 5 ? "Icon 10" : index === 6 ? "Icon 8" : index === 7 ? "Icon 1" : index === 8 ? "Support icon" : index === 9 ? "Note icon" : index === 11 ? "Icon 15" : index === 12 ? "Icon 2" : index === 13 ? "User icon" : index === 14 ? "Icon 14" : index === 15 ? "Icon 16" : "Excel icon"}
                  className="object-contain relative z-10"
                  style={{
                    width: '68px',
                    height: '68px',
                    transform: 'translateZ(20px)',
                  }}
                />
              </div>
              </div>
              <p className="text-gray-500 text-sm font-medium text-center">{labels[index]}</p>
            </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  )
}
