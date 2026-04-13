import SmoothScroll   from '@/components/SmoothScroll';
import Header         from '@/components/Header';
import HeroSection    from '@/components/HeroSection';
import ScienceSection from '@/components/ScienceSection';
import ProductCanvas  from '@/components/ProductCanvas';
import EcosystemSection from '@/components/EcosystemSection';
import Footer         from '@/components/Footer';

export default function Home() {
  return (
    <SmoothScroll>
      <Header />
      <main>
        <HeroSection />
        <ScienceSection />
        <ProductCanvas />
        <EcosystemSection />
      </main>
      <Footer />
    </SmoothScroll>
  );
}
