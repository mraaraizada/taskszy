import { motion } from 'framer-motion'
import { TestimonialsColumn } from './ui/testimonials-columns-1'
import TrustedByLogos from './TrustedByLogos'
import { useState, useEffect } from 'react'

const testimonials = [
  {
    text: "Taskzy transformed the way we manage client projects. Our team now has complete visibility into tasks, deadlines, and project budgets from one centralized workspace.",
    image: "/djM7S6YOAk9in8E5Qz4p4PZtnM.avif",
    name: "Rahul Sharma",
    role: "Founder, GrowthHive Digital Agency",
  },
  {
    text: "Campaign planning, team coordination, and performance tracking are now seamless. Taskzy has become the operational backbone of our marketing team.",
    image: "/hwKS6jM2fzqST0oKlhTzA49Wo.avif",
    name: "Ananya Patel",
    role: "Marketing Director, BrightEdge Marketing",
  },
  {
    text: "We replaced multiple tools with Taskzy and gained a single source of truth for project management, team collaboration, and workflow visibility.",
    image: "/HagRh9tbpDS8PZObL4sWDqZI.avif",
    name: "Karan Mehta",
    role: "CTO, NovaTech Software Solutions",
  },
  {
    text: "Managing departments, approvals, and internal operations is significantly easier with Taskzy. It has improved accountability across our organization.",
    image: "/dXORuOmVMcU9SeC6ejFWiEuR0.avif",
    name: "Priya Verma",
    role: "Operations Head, Elevate Consulting",
  },
  {
    text: "As a growing startup, we needed a platform that could scale with our team. Taskzy gave us the structure, visibility, and control we were looking for.",
    image: "/djM7S6YOAk9in8E5Qz4p4PZtnM.avif",
    name: "Rohit Gupta",
    role: "Co-Founder, LaunchSprint Technologies",
  },
  {
    text: "Taskzy helps me manage client work, deadlines, deliverables, and communication from one place. It's like having an entire operations system built for freelancers.",
    image: "/pt1xRXvbmHurTMNaJaeiMznDI.avif",
    name: "Vikram Singh",
    role: "Freelance Project Consultant",
  },
  {
    text: "Our YouTube team uses Taskzy to manage content planning, script writing, editing workflows, approvals, and publishing schedules. It keeps everyone aligned.",
    image: "/D2mUHGcBWmpZjgU0oMggS0uX8s.avif",
    name: "Arjun Mehta",
    role: "Founder & YouTube Creator, CreatorCraft",
  },
  {
    text: "From content planning to campaign execution, Taskzy gives our agency complete visibility over projects, resources, and deadlines.",
    image: "/dXORuOmVMcU9SeC6ejFWiEuR0.avif",
    name: "Neha Kapoor",
    role: "Creative Director, PixelForge Media",
  },
]

const firstColumn = testimonials.slice(0, 3)
const secondColumn = testimonials.slice(3, 6)
const thirdColumn = testimonials.slice(6, 9)

export default function Testimonials() {
  return (
    <>
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          {/* Heading - Matching style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-12"
          >
            <p className="text-sm font-medium text-primary font-body mb-4 tracking-wide uppercase">
              Testimonials
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-foreground tracking-tight leading-[1.1] font-semibold">
              Trusted by teams at scale
            </h2>
            <p className="mt-6 text-foreground-muted font-body text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-light">
              See what our customers have to say about Taskzy.
            </p>
          </motion.div>

          {/* Scrolling columns */}
          <div className="flex justify-center gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
            <TestimonialsColumn 
              testimonials={firstColumn} 
              duration={15} 
              columnIndex={0}
            />
            <TestimonialsColumn 
              testimonials={secondColumn} 
              className="hidden md:block" 
              duration={19} 
              columnIndex={1}
            />
            <TestimonialsColumn 
              testimonials={thirdColumn} 
              className="hidden lg:block" 
              duration={17} 
              columnIndex={2}
            />
          </div>
        </div>
      </section>

      {/* Trusted By Logos Section */}
      <TrustedByLogos />
    </>
  )
}
