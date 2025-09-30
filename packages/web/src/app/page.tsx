import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Inicio',
  description: 'Gestión fiscal simplificada para Guinea Ecuatorial. Consulta servicios, calcula tasas y gestiona trámites gubernamentales.',
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="mb-6 text-4xl font-bold md:text-6xl">
            TaxasGE
          </h1>
          <p className="mb-8 text-xl md:text-2xl opacity-90">
            Gestión Fiscal Simplificada para Guinea Ecuatorial
          </p>
          <p className="mb-12 text-lg opacity-80 max-w-2xl mx-auto">
            Consulta servicios fiscales, calcula tasas y gestiona trámites gubernamentales
            de forma rápida y segura desde cualquier dispositivo.
          </p>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar servicios fiscales..."
                className="w-full px-6 py-4 text-lg text-gray-900 bg-white rounded-full shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300"
              />
              <button className="absolute right-2 top-2 bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors">
                Buscar
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl font-bold text-blue-600 mb-2">547</div>
              <div className="text-gray-600">Servicios Fiscales</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl font-bold text-green-600 mb-2">14</div>
              <div className="text-gray-600">Ministerios</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl font-bold text-purple-600 mb-2">86</div>
              <div className="text-gray-600">Categorías</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl font-bold text-orange-600 mb-2">16</div>
              <div className="text-gray-600">Sectores</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Servicios Principales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-lg border-t-4 border-blue-500">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                🔍 Búsqueda de Servicios
              </h3>
              <p className="text-gray-600 mb-6">
                Encuentra rápidamente cualquier servicio fiscal por ministerio,
                sector o categoría específica.
              </p>
              <button className="text-blue-600 font-semibold hover:text-blue-800">
                Explorar servicios →
              </button>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg border-t-4 border-green-500">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                🧮 Calculadora de Tasas
              </h3>
              <p className="text-gray-600 mb-6">
                Calcula automáticamente las tasas y costos de cualquier
                trámite fiscal de forma precisa.
              </p>
              <button className="text-green-600 font-semibold hover:text-green-800">
                Calcular tasas →
              </button>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg border-t-4 border-purple-500">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                📋 Guías Completas
              </h3>
              <p className="text-gray-600 mb-6">
                Accede a guías paso a paso y documentación necesaria
                para cada proceso fiscal.
              </p>
              <button className="text-purple-600 font-semibold hover:text-purple-800">
                Ver guías →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">TaxasGE</h3>
              <p className="text-gray-400">
                Plataforma digital de gestión fiscal de Guinea Ecuatorial
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Servicios</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Búsqueda de servicios</li>
                <li>Calculadora de tasas</li>
                <li>Guías y documentación</li>
                <li>Trámites en línea</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Centro de ayuda</li>
                <li>Contacto</li>
                <li>FAQ</li>
                <li>Términos de uso</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contacto</h4>
              <p className="text-gray-400">
                Email: soporte@taxasge.gq<br/>
                Teléfono: +240 XXX XXX XXX
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 TaxasGE. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}