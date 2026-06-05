import { CpuArchitecture } from './CpuArchitecture'
import LetterGlitch from './LetterGlitch'

export default function TaskzyArchitecture() {
  return (
    <section 
      className="bg-[#1a1a1a] relative" 
      style={{ paddingTop: 'calc(30rem - 9.5cm)', paddingBottom: 'calc(30rem - 9.5cm)' }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10" style={{ overflow: 'visible' }}>
        <div className="flex items-center justify-between gap-24" style={{ overflow: 'visible' }}>
          {/* CPU Architecture Diagram on the left */}
          <div className="w-full max-w-3xl relative" style={{ marginLeft: '-10rem', marginTop: '3rem', overflow: 'visible' }}>
            {/* Animated binary glitch background - only behind the model */}
            <div 
              className="absolute"
              style={{
                width: '900px',
                height: '550px',
                top: '-50px',
                left: '0',
                opacity: 0.15,
                zIndex: 0,
                overflow: 'visible',
              }}
            >
              <LetterGlitch 
                customCharacters="01"
                glitchColors={["#d8b4fe", "#c084fc", "#a855f7"]}
                glitchSpeed={50}
                smooth={true}
                density={150}
              />
            </div>
            
            {/* Circuit pattern background image - only behind the model */}
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: 'url("/download (2).png")',
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                filter: 'brightness(2) invert(1)',
                width: '900px',
                height: '450px',
                top: '0',
                left: '0',
                opacity: 0.45,
                zIndex: 1,
              }}
            />
            
            <CpuArchitecture 
              width="900px"
              height="450px"
              text="TASKZY"
              className="text-gray-400 relative z-10"
            />
          </div>

          {/* Text Content on the right */}
          <div className="flex-1 max-w-lg" style={{ marginRight: '2rem', marginLeft: '4rem' }}>
            {/* Mission Label */}
            <p className="text-sm font-medium text-accent font-body mb-3 tracking-wide uppercase">
              MISSION
            </p>

            {/* Heading */}
            <h2 className="font-display text-4xl md:text-5xl tracking-tight leading-[1.1] text-white">
              The Future is Self-Custodial
            </h2>

            {/* Description */}
            <p className="mt-4 font-body text-base md:text-lg leading-relaxed text-gray-400">
              Financial autonomy isn't just a feature, it's the very foundation. NAKA introduces self-custody to the real world by establishing essential infrastructure pillars. These pillars enable global payments, partner settlements, and a seamless fiat-crypto bridge, all without the need for intermediaries.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
