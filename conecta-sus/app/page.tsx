import { SiteNav } from "@/components/site-nav";
import { Hero } from "@/components/hero";
import { Problem } from "@/components/problem";
import { ServicesMarquee } from "@/components/services-marquee";
import { HowItWorks } from "@/components/how-it-works";
import { Differentiators } from "@/components/differentiators";
import { TextRevealByWord } from "@/components/ui/text-reveal";
import { Impact } from "@/components/impact";
import { FinalCta } from "@/components/final-cta";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <>
      <SiteNav />
      <main>
        <Hero />
        <Problem />
        <ServicesMarquee />
        <HowItWorks />
        <Differentiators />
        <TextRevealByWord text="O serviço já existe. Já é gratuito. Já é seu por direito. Só faltava alguém te mostrar onde fica." />
        <Impact />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
