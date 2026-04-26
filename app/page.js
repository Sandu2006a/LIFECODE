import SmoothScroll      from '@/components/SmoothScroll';
import Header            from '@/components/Header';
import HeroSection       from '@/components/HeroSection';
import BrandMessage      from '@/components/BrandMessage';
import MorningSection    from '@/components/MorningSection';
import RecoverySection   from '@/components/RecoverySection';
import AthleteStory      from '@/components/AthleteStory';
import SystemSection     from '@/components/SystemSection';
import ComparisonSection from '@/components/ComparisonSection';
import EcosystemSection  from '@/components/EcosystemSection';
import Footer            from '@/components/Footer';

export default function Home() {
  return (
    <SmoothScroll>
      <Header />
      <main>
        <HeroSection />
        <BrandMessage />
        <MorningSection />
        <RecoverySection />
        <AthleteStory />
        <SystemSection />
        <ComparisonSection />
        <EcosystemSection />
      </main>
      <Footer />
    </SmoothScroll>
  );
}
