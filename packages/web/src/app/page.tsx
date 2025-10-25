import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">TaxasGE</h1>
        <div className="space-x-4">
          <Link href="/auth/login" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Connexion
          </Link>
          <Link href="/auth/register" className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Inscription
          </Link>
        </div>
      </div>
    </div>
  )
}
