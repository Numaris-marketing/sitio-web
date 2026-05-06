import { Navbar }              from "./components/Navbar";
import { HeroSection }         from "./components/HeroSection";
import { SocialProofSection }  from "./components/SocialProofSection";
import { SolutionsSection }    from "./components/SolutionsSection";
import { ProductSection }      from "./components/ProductSection";
import { FleetSection }        from "./components/FleetSection";
import { CalculatorSection }   from "./components/CalculatorSection";
import { TestimonialsSection } from "./components/TestimonialsSection";
import { CTASection }          from "./components/CTASection";
import { Footer }              from "./components/Footer";

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <HeroSection />
        <SocialProofSection />
        <SolutionsSection />
        <ProductSection />
        <FleetSection />
        <CalculatorSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
