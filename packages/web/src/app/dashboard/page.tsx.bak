'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }

    // Vérifier le token (simplifié)
    setUser({ email: 'user@example.com', name: 'Test User' })
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/')
  }

  if (!user) return <div className="flex min-h-screen items-center justify-center">Chargement...</div>

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow">
          <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
          <p className="text-gray-600 mb-4">Bienvenue, {user.name}</p>
          <p className="text-gray-600 mb-8">Email: {user.email}</p>

          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  )
}
