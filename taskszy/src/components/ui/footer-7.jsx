import { Linkedin, Youtube } from 'lucide-react'

const defaultSections = [
  {
    title: 'Product',
    links: [
      { name: 'Solutions', href: '#solutions' },
      { name: 'Features', href: '#features' },
      { name: 'Pricing', href: '#pricing' },
      { name: 'FAQs', href: '#faqs' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { name: 'Documentation', href: '#' },
      { name: 'Help Center', href: '#' },
      { name: 'Blog', href: '#' },
      { name: 'Case Studies', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { name: 'About Us', href: '#' },
      { name: 'Careers', href: '#' },
      { name: 'Contact', href: '#' },
      { name: 'Partners', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'Security', href: '#' },
    ],
  },
]

const defaultSocialLinks = [
  { icon: <Linkedin className="size-5" />, href: '#', label: 'LinkedIn' },
  { icon: <Youtube className="size-5" />, href: '#', label: 'YouTube' },
]

export function Footer7({
  logo = {
    url: '#',
    title: 'TASKSZY',
  },
  sections = defaultSections,
  description = 'The complete workspace management platform for modern teams. Tasks, collaboration, and budget management—all in one place.',
  socialLinks = defaultSocialLinks,
  copyright = '© 2026 TASKSZY. All rights reserved.',
  disclaimer = 'TASKSZY provides workspace management software for teams and organizations. By using the TASKSZY platform, you agree to our Terms of Service and Privacy Policy. All data is encrypted and stored securely in compliance with SOC 2 and GDPR standards.',
}) {
  return (
    <section className="pt-20 bg-[#1a1a1a] text-white" style={{ marginBottom: 0, paddingBottom: 0 }}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 pb-20">
        {/* CTA Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-20 pb-12 border-b border-white/10">
          <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight">
            Ready to get started?
          </h2>
          <div className="flex items-center gap-3">
            <a
              href="#"
              className="relative px-4 py-2 rounded-full border border-white text-white text-xs font-medium overflow-hidden group transition-all cursor-pointer uppercase tracking-wider"
            >
              <span className="relative z-10 transition-colors duration-300 group-hover:text-[#1a1a1a]">
                Contact Sales
              </span>
              <span className="absolute inset-0 bg-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-full"></span>
            </a>
            <a
              href="/app"
              className="relative px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-medium overflow-hidden group transition-all cursor-pointer uppercase tracking-wider border border-primary group-hover:border-primary flex items-center gap-1"
            >
              <span className="relative z-10 transition-colors duration-300 group-hover:text-primary">
                Login/Signup
              </span>
              <span className="relative z-10 transition-colors duration-300 group-hover:text-primary">→</span>
              <span className="absolute inset-0 bg-white border border-primary transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-full"></span>
            </a>
          </div>
        </div>

        <div className="flex w-full flex-col justify-between gap-16 lg:flex-row lg:items-start">
          {/* Brand */}
          <div className="flex w-full flex-col justify-between gap-6 lg:max-w-sm lg:items-start">
            <a href={logo.url} className="text-2xl font-display font-bold tracking-tight text-primary uppercase">
              {logo.title}
            </a>
            <p className="text-sm text-white/60 font-body leading-relaxed">
              {description}
            </p>
            <div className="text-sm text-white/60 font-body">
              <p className="mb-1">Need help?</p>
              <a href="mailto:support.taskszy@gmail.com" className="text-primary hover:text-primary/80 transition-colors">
                support.taskszy@gmail.com
              </a>
            </div>
          </div>

          {/* Link columns */}
          <div className="grid w-full gap-8 grid-cols-2 md:grid-cols-4 lg:gap-12">
            {sections.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                <h3 className="mb-4 text-xs font-semibold text-white font-body uppercase tracking-wider">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <a
                        href={link.href}
                        className="text-sm text-white/60 font-body hover:text-white transition-colors"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-white/10 mb-0">
          <p className="text-xs text-white/40 font-body leading-relaxed mb-4">
            {disclaimer}
          </p>
          <p className="text-xs text-white/40 font-body mb-0">{copyright}</p>
        </div>
      </div>

      {/* Large TASKSZY heading at the end - fully visible */}
      <div className="text-center overflow-hidden w-full" style={{ marginTop: '-2rem', marginBottom: 0, paddingBottom: 0, lineHeight: 0 }}>
        <h2 className="font-display font-bold text-black/15 uppercase w-full" style={{ 
          fontSize: 'clamp(8.5rem, 22vw, 24rem)',
          lineHeight: '0.65',
          marginBottom: '-1rem', 
          paddingBottom: 0,
          marginTop: 0,
          paddingTop: 0,
          letterSpacing: '0.02em',
          width: '100%'
        }}>
          TASKSZY
        </h2>
      </div>
    </section>
  )
}
