import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gq-green mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Página no encontrada
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Lo sentimos, la página que buscas no existe.
          </p>
        </div>

        <Link
          href="/"
          className="inline-block bg-gq-green text-white px-8 py-3 rounded-lg font-semibold hover:bg-gq-green/90 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
