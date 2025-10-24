import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ArrowRight, Calculator, Building2, FileText, Shield } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-gq-green to-gq-blue py-20 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="mb-4 text-5xl font-bold font-poppins">
              Bienvenido a TAXASGE
            </h1>
            <p className="mb-8 text-xl font-light max-w-2xl mx-auto">
              Plataforma oficial de servicios fiscales de la República de Guinea Ecuatorial
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/services"
                className="bg-white text-gq-green px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
              >
                Explorar servicios
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/auth/login"
                className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        </section>

        {/* Quick Access Cards */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 font-poppins">
              Acceso rápido
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <QuickAccessCard
                icon={<FileText className="w-8 h-8" />}
                title="547 Servicios fiscales"
                description="Consulte todos los servicios disponibles"
                href="/services"
                color="gq-green"
              />
              <QuickAccessCard
                icon={<Calculator className="w-8 h-8" />}
                title="Calculadoras"
                description="Calcule sus impuestos y tasas"
                href="/calculators"
                color="gq-blue"
              />
              <QuickAccessCard
                icon={<Building2 className="w-8 h-8" />}
                title="Ministerios"
                description="Explore los ministerios de GQ"
                href="/ministries"
                color="gq-red"
              />
              <QuickAccessCard
                icon={<Shield className="w-8 h-8" />}
                title="Mi cuenta"
                description="Gestione sus declaraciones"
                href="/auth/profile"
                color="gq-green"
              />
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <StatCard number="547" label="Servicios fiscales" />
              <StatCard number="15+" label="Ministerios" />
              <StatCard number="100%" label="Digital y seguro" />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function QuickAccessCard({
  icon,
  title,
  description,
  href,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  color: string;
}) {
  return (
    <Link href={href} className="group">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700 h-full">
        <div className={`text-${color} mb-4`}>{icon}</div>
        <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {description}
        </p>
      </div>
    </Link>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="p-6">
      <div className="text-4xl font-bold text-primary mb-2 font-poppins">
        {number}
      </div>
      <div className="text-gray-600 dark:text-gray-400">{label}</div>
    </div>
  );
}
