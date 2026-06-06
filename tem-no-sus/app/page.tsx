import { SiteNav } from "@/components/site-nav";
import { Hero } from "@/components/hero";
import { ServiceStrip } from "@/components/service-strip";
import { Problem } from "@/components/problem";
import { HowItWorks } from "@/components/how-it-works";
import { Differentiators } from "@/components/differentiators";
import { TextRevealByWord } from "@/components/ui/text-reveal";
import { Impact } from "@/components/impact";
import { FinalCta } from "@/components/final-cta";
import { SiteFooter } from "@/components/site-footer";
import { PermissionPrimer } from "@/components/permission-primer";

export default function Home() {
  return (
    <>
      <PermissionPrimer />
      <SiteNav />
      <main>
        <Hero />
        <ServiceStrip />
        <Problem />
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
