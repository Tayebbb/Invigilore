import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { FeaturesSection } from '../components/FeaturesSection';
import { SecuritySection } from '../components/SecuritySection';
import { MonitoringPreview } from '../components/MonitoringPreview';
import { StatsSection } from '../components/StatsSection';
import { PricingSection } from '../components/PricingSection';
import { CTASection } from '../components/CTASection';
import { Footer } from '../components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <SecuritySection />
      <MonitoringPreview />
      <StatsSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
}