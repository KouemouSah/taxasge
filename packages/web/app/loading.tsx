export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-gq-green mb-4"></div>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Cargando...
        </p>
      </div>
    </div>
  );
}
