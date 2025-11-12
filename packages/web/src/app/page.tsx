import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import Hero from "@/components/Hero"
import StatsSection from "@/components/StatsSection"
import FeaturesSection from "@/components/FeaturesSection"
import ServicesDirectory from "@/components/ServicesDirectory"
import FloatingChatbot from "@/components/shared/FloatingChatbot"

/**
 * Page d'accueil TaxasGE
 *
 * @source TASK-M01-014b: Migration page landing
 * @template .github/docs-internal/Documentations/FRONTEND/template/src/pages/Index.tsx
 * @updated Dynamic data from PostgreSQL backend (services, ministries, categories, sectors)
 */
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <StatsSection />
        <FeaturesSection />
        <ServicesDirectory />
      </main>
      <Footer />
      <FloatingChatbot />
    </div>
  )
}
