import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedCollectionsBento } from "@/components/home/FeaturedCollectionsBento";
import { NewArrivalsGrid } from "@/components/home/NewArrivalsGrid";
import { AtelierPromo } from "@/components/home/AtelierPromo";
import { OurAteliers } from "@/components/home/OurAteliers";
import { InstagramGallery } from "@/components/home/InstagramGallery";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { Reveal } from "@/components/ui/Reveal";

export { dynamic } from "@/lib/catalogRendering";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <Reveal>
        <FeaturedCollectionsBento />
      </Reveal>
      <Reveal>
        <NewArrivalsGrid />
      </Reveal>
      <Reveal>
        <AtelierPromo />
      </Reveal>
      <Reveal>
        <OurAteliers />
      </Reveal>
      <Reveal>
        <InstagramGallery />
      </Reveal>
      <Reveal>
        <NewsletterSection />
      </Reveal>
    </>
  );
}
