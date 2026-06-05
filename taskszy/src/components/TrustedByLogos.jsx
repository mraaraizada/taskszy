import LogoLoop from './LogoLoop'

// PixelForge Logo Component
const PixelForgeLogo = () => (
  <svg width="48" height="48" viewBox="0 0 240 360" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Orange square */}
    <rect x="0" y="0" width="120" height="120" fill="#D77A61"/>
    {/* Tan square */}
    <rect x="120" y="0" width="120" height="120" fill="#E8C5A5"/>
    {/* Pink square */}
    <rect x="0" y="120" width="120" height="120" fill="#F5C6CB"/>
    {/* Light green square */}
    <rect x="120" y="120" width="120" height="120" fill="#D8E8B0"/>
    {/* Blue square */}
    <rect x="0" y="240" width="120" height="120" fill="#9BCDD2"/>
  </svg>
)

// Brightline Logo Component
const BrightlineLogo = () => (
  <svg width="48" height="48" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="200" fill="#F4D35E"/>
    {/* Sun rays positioned above the 'e' */}
    <g transform="translate(165, 80)">
      <line x1="0" y1="-20" x2="0" y2="-28" stroke="#5A4A2C" strokeWidth="3" strokeLinecap="round"/>
      <line x1="14" y1="-14" x2="20" y2="-20" stroke="#5A4A2C" strokeWidth="3" strokeLinecap="round"/>
      <line x1="20" y1="0" x2="28" y2="0" stroke="#5A4A2C" strokeWidth="3" strokeLinecap="round"/>
      <line x1="14" y1="14" x2="20" y2="20" stroke="#5A4A2C" strokeWidth="3" strokeLinecap="round"/>
      <line x1="0" y1="20" x2="0" y2="28" stroke="#5A4A2C" strokeWidth="3" strokeLinecap="round"/>
      <line x1="-14" y1="14" x2="-20" y2="20" stroke="#5A4A2C" strokeWidth="3" strokeLinecap="round"/>
      <line x1="-20" y1="0" x2="-28" y2="0" stroke="#5A4A2C" strokeWidth="3" strokeLinecap="round"/>
      <line x1="-14" y1="-14" x2="-20" y2="-20" stroke="#5A4A2C" strokeWidth="3" strokeLinecap="round"/>
    </g>
    {/* Text */}
    <text x="100" y="130" fontFamily="serif" fontSize="42" fill="#5A4A2C" textAnchor="middle" fontWeight="400">
      brightline
    </text>
  </svg>
)

// BrightEdge Logo Component
const BrightEdgeLogo = () => (
  <svg width="48" height="48" viewBox="0 0 400 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="80" fill="#00A3DD"/>
    <text x="200" y="55" fontFamily="Arial, sans-serif" fontSize="48" fill="#FFFFFF" textAnchor="middle" fontWeight="700" letterSpacing="2">
      BRIGHTEDGE
    </text>
  </svg>
)

const logos = [
  { node: <><img src="https://cdn.simpleicons.org/databricks/FF5A5F" alt="GrowthHive Digital" style={{ height: '48px', width: '48px' }} /><span style={{ marginLeft: '14px', fontSize: '28px', fontWeight: '600' }}>GrowthHive Digital</span></>, title: 'GrowthHive Digital' },
  { node: <><img src="https://cdn.simpleicons.org/youtube/FF0000" alt="TechWithRohit" style={{ height: '48px', width: '48px' }} /><span style={{ marginLeft: '14px', fontSize: '28px', fontWeight: '600' }}>TechWithRohit</span></>, title: 'TechWithRohit' },
  { node: <><PixelForgeLogo /><span style={{ marginLeft: '14px', fontSize: '28px', fontWeight: '600' }}>PixelForge Agency</span></>, title: 'PixelForge Agency' },
  { node: <><img src="/s.png" alt="NovaTech Solutions" style={{ height: '64px', width: '64px' }} /><span style={{ marginLeft: '14px', fontSize: '28px', fontWeight: '600' }}>NovaTech Solutions</span></>, title: 'NovaTech Solutions' },
  { node: <><img src="https://cdn.simpleicons.org/youtube/FF0000" alt="CreatorCraft" style={{ height: '48px', width: '48px' }} /><span style={{ marginLeft: '14px', fontSize: '28px', fontWeight: '600' }}>CreatorCraft</span></>, title: 'CreatorCraft' },
  { node: <><img src="https://cdn.simpleicons.org/eleventy/000000" alt="Elevate Marketing" style={{ height: '48px', width: '48px' }} /><span style={{ marginLeft: '14px', fontSize: '28px', fontWeight: '600' }}>Elevate Marketing</span></>, title: 'Elevate Marketing' },
  { node: <><img src="/400_filter_nobg_62f5ecc5ca633-300x219.png" alt="Vertex Technologies" style={{ height: '48px', width: '48px' }} /><span style={{ marginLeft: '14px', fontSize: '28px', fontWeight: '600' }}>Vertex Technologies</span></>, title: 'Vertex Technologies' },
  { node: <><img src="https://cdn.simpleicons.org/youtube/FF0000" alt="Digital Creator Hub" style={{ height: '48px', width: '48px' }} /><span style={{ marginLeft: '14px', fontSize: '28px', fontWeight: '600' }}>Digital Creator Hub</span></>, title: 'Digital Creator Hub' },
  { node: <><img src="https://cdn.simpleicons.org/scaleway/4F0DB8" alt="ScaleUp Media" style={{ height: '48px', width: '48px' }} /><span style={{ marginLeft: '14px', fontSize: '28px', fontWeight: '600' }}>ScaleUp Media</span></>, title: 'ScaleUp Media' },
  { node: <><BrightEdgeLogo /><span style={{ marginLeft: '14px', fontSize: '28px', fontWeight: '600' }}>BrightEdge Creative</span></>, title: 'BrightEdge Creative' },
]

const logosRow2 = [
  { node: <><img src="https://cdn.simpleicons.org/youtube/FF0000" alt="GrowthTube India" style={{ height: '48px', width: '48px' }} /><span style={{ marginLeft: '14px', fontSize: '28px', fontWeight: '600' }}>GrowthTube India</span></>, title: 'GrowthTube India' },
  { node: <><img src="/Apex_CG_Logo.webp" alt="Apex Consulting Group" style={{ height: '64px', width: '64px' }} /><span style={{ marginLeft: '14px', fontSize: '28px', fontWeight: '600' }}>Apex Consulting Group</span></>, title: 'Apex Consulting Group' },
  { node: <><img src="/app logo.png" alt="LaunchWave Digital" style={{ height: '48px', width: '48px' }} /><span style={{ marginLeft: '14px', fontSize: '28px', fontWeight: '600' }}>LaunchWave Digital</span></>, title: 'LaunchWave Digital' },
  { node: <><img src="https://cdn.simpleicons.org/youtube/FF0000" alt="The Startup Show" style={{ height: '48px', width: '48px' }} /><span style={{ marginLeft: '14px', fontSize: '28px', fontWeight: '600' }}>The Startup Show</span></>, title: 'The Startup Show' },
  { node: <><img src="/v.png" alt="Visionary Agency" style={{ height: '64px', width: '64px' }} /><span style={{ marginLeft: '14px', fontSize: '28px', fontWeight: '600' }}>Visionary Agency</span></>, title: 'Visionary Agency' },
  { node: <><img src="https://cdn.simpleicons.org/sparkpost/FA6423" alt="SparkGrowth Solutions" style={{ height: '48px', width: '48px' }} /><span style={{ marginLeft: '14px', fontSize: '28px', fontWeight: '600' }}>SparkGrowth Solutions</span></>, title: 'SparkGrowth Solutions' },
  { node: <><img src="https://cdn.simpleicons.org/youtube/FF0000" alt="Creator Studio Pro" style={{ height: '48px', width: '48px' }} /><span style={{ marginLeft: '14px', fontSize: '28px', fontWeight: '600' }}>Creator Studio Pro</span></>, title: 'Creator Studio Pro' },
  { node: <><img src="https://cdn.simpleicons.org/nexon/412991" alt="Nexa Creative Studio" style={{ height: '48px', width: '48px' }} /><span style={{ marginLeft: '14px', fontSize: '28px', fontWeight: '600' }}>Nexa Creative Studio</span></>, title: 'Nexa Creative Studio' },
  { node: <><BrightlineLogo /><span style={{ marginLeft: '14px', fontSize: '28px', fontWeight: '600' }}>Brightline Ventures</span></>, title: 'Brightline Ventures' },
  { node: <><img src="https://cdn.simpleicons.org/youtube/FF0000" alt="Tech Insights Hindi" style={{ height: '48px', width: '48px' }} /><span style={{ marginLeft: '14px', fontSize: '28px', fontWeight: '600' }}>Tech Insights Hindi</span></>, title: 'Tech Insights Hindi' },
]

export default function TrustedByLogos() {
  return (
    <div className="w-full py-16 bg-white overflow-hidden">
      {/* Heading */}
      <div className="text-center mb-12 px-6 md:px-12">
        <p className="text-sm font-medium text-accent font-body mb-2 tracking-wide uppercase">
          Trusted By 500+
        </p>
        <h2 className="font-display text-3xl md:text-4xl text-foreground tracking-tight leading-[1.1]">
          Built for Teams That Move Business Forward
        </h2>
      </div>

      {/* Two-row logo marquee - Full width */}
      <div className="space-y-2 overflow-hidden">
        {/* First row - Right to Left */}
        <LogoLoop
          logos={logos}
          speed={50}
          direction="right"
          logoHeight={56}
          gap={64}
          pauseOnHover={true}
          fadeOut={false}
          scaleOnHover={true}
        />

        {/* Second row - Left to Right */}
        <LogoLoop
          logos={logosRow2}
          speed={50}
          direction="left"
          logoHeight={56}
          gap={64}
          pauseOnHover={true}
          fadeOut={false}
          scaleOnHover={true}
        />
      </div>
    </div>
  )
}
