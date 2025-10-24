'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gq-red mb-4">Error</h1>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Algo salió mal
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Lo sentimos, ha ocurrido un error inesperado.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={reset}
            className="w-full bg-gq-green text-white px-6 py-3 rounded-lg font-semibold hover:bg-gq-green/90 transition-colors"
          >
            Intentar de nuevo
          </button>

          <Link
            href="/"
            className="block w-full border-2 border-gq-green text-gq-green px-6 py-3 rounded-lg font-semibold hover:bg-gq-green/10 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>

        {error.digest && (
          <p className="mt-6 text-sm text-gray-500">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
