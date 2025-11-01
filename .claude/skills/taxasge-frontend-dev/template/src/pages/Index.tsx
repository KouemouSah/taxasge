import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { StatsSection } from "@/components/StatsSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { PopularServices } from "@/components/PopularServices";
import { FloatingChatbot } from "@/components/FloatingChatbot";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <StatsSection />
        <FeaturesSection />
        <PopularServices />
      </main>
      <Footer />
      <FloatingChatbot />
    </div>
  );
};

export default Index;
