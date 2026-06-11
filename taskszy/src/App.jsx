import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Services from './components/Services'
import IntegrationArchitecture from './components/IntegrationArchitecture'
import BentoFeatures from './components/BentoFeatures'
import TaskzyArchitecture from './components/TaskzyArchitecture'
import Features from './components/Features'
import FeatureCardAbout from './components/FeatureCardAbout'
import MetalPinShowcase from './components/MetalPinShowcase'
import CompleteSuite from './components/CompleteSuite'
import WhyChooseUs from './components/WhyChooseUs'
import Testimonials from './components/Testimonials'
import FAQ from './components/FAQ'
import Pricing from './components/Pricing'
import Footer from './components/Footer'
import SEOHelmet from './components/SEOHelmet'

export default function App() {
  return (
    <>
      <SEOHelmet 
        title="Taskzy - Complete Workspace Management Platform | Organize Better, Scale Faster"
        description="All-in-one workspace management platform for teams. Manage tasks, projects, budgets, workflows & performance. Free 14-day trial. Built for agencies & growing businesses."
        keywords="task management software, team collaboration tool, project management platform, workspace management, agile project management, team productivity, workflow automation, budget tracking"
        canonical="https://taskzy.com/"
        ogImage="https://taskzy.com/dashboard.png"
        schema={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Taskzy - Complete Workspace Management Platform",
          "description": "All-in-one workspace management for modern teams",
          "url": "https://taskzy.com/",
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://taskzy.com/"
              }
            ]
          }
        }}
      />
      <div className="min-h-screen flex flex-col bg-white">
      {/* Navbar - sticky across all pages */}
      <Navbar />

      {/* Hero — full viewport height */}
      <div className="h-screen flex flex-col overflow-hidden">
        <Hero />
      </div>

      {/* Scrollable sections below */}
      {/* <Services /> */}
      {/* <TaskzyArchitecture /> */}
      <IntegrationArchitecture />
      {/* <BentoFeatures /> */}
      <Features />
      {/* <FeatureCardAbout /> */}
      {/* <MetalPinShowcase /> */}
      <CompleteSuite />
      {/* <WhyChooseUs /> */}
      <Testimonials />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
    </>
  )
}
