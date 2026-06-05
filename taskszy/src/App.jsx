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

export default function App() {
  return (
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
  )
}
