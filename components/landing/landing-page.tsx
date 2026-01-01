import { HeroSection } from "./hero-section";
import { ProblemSection } from "./problem-section";
import { SolutionSection } from "./solution-section";
import { BenefitsSection } from "./benefits-section";
import { SocialProofSection } from "./social-proof-section";
import { CtaSection } from "./cta-section";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <BenefitsSection />
      <SocialProofSection />
      <CtaSection />
    </div>
  );
}
