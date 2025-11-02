import Header from "@/components/Header"
import Footer from "@/components/Footer"
import Hero from "@/components/Hero"
import StatsSection from "@/components/StatsSection"
import FeaturesSection from "@/components/FeaturesSection"
import PopularServices from "@/components/PopularServices"
import FloatingChatbot from "@/components/FloatingChatbot"

/**
 * Page d'accueil TaxasGE
 *
 * @source TASK-M01-014b: Migration page landing
 * @template .github/docs-internal/Documentations/FRONTEND/template/src/pages/Index.tsx
 */
export default function Home() {
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
  )
}
