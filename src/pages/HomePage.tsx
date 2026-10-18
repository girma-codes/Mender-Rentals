import { useOutletContext } from 'react-router-dom';
import { Hero } from '@/components/Hero';
import { FeaturedCategories } from '@/components/sections/FeaturedCategories';
import { FeaturedRentals } from '@/components/sections/FeaturedRentals';
import { WhyChooseUs } from '@/components/sections/WhyChooseUs';
import { HowItWorksVisual } from '@/components/sections/HowItWorksVisual';
import { Testimonials } from '@/components/sections/Testimonials';
import { CTABanner } from '@/components/sections/CTABanner';

interface HomePageContext {
  onOpenListItemModal: () => void;
}

export function HomePage() {
  const { onOpenListItemModal } = useOutletContext<HomePageContext>();
  return (
    <main id="main-content">
      <Hero onOpenListItemModal={onOpenListItemModal} />
      <FeaturedCategories />
      <FeaturedRentals />
      <WhyChooseUs />
      <HowItWorksVisual />
      <Testimonials />
      <CTABanner />
    </main>
  );
}
