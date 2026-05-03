import SmoothScroll      from '@/components/SmoothScroll';
import Header            from '@/components/Header';
import HeroSection       from '@/components/HeroSection';
import PreOrderSection   from '@/components/PreOrderSection';
import MorningSection    from '@/components/MorningSection';
import RecoverySection   from '@/components/RecoverySection';
import AthleteStory      from '@/components/AthleteStory';
import SystemSection     from '@/components/SystemSection';
import AppSection        from '@/components/AppSection';
import ComparisonSection from '@/components/ComparisonSection';
import EcosystemSection  from '@/components/EcosystemSection';
import VoicesSection     from '@/components/VoicesSection';
import Footer            from '@/components/Footer';

export default function Home() {
  return (
    <SmoothScroll>
      <Header />
      <main>
        <HeroSection />
        <PreOrderSection />
        <AthleteStory />
        <SystemSection />
        <MorningSection />
        <RecoverySection />
        <AppSection />
        <ComparisonSection />
        <EcosystemSection />
        <VoicesSection />
      </main>
      <Footer />
    </SmoothScroll>
  );
}
