'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@/types/auth'

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Charger l'utilisateur depuis localStorage au montage
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('taxasge-user')
        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }
      } catch (err) {
        console.error('Failed to load user:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  const login = async (email: string, _password: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // TODO: Appeler l'API backend pour login
      // Pour l'instant, mock
      const mockUser: User = {
        id: '1',
        email,
        firstName: 'John',
        lastName: 'Doe',
        role: 'citizen',
        status: 'active',
        country: 'GQ',
        language: 'es',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        preferences: {
          emailNotifications: true,
          pushNotifications: true,
          language: 'es',
          theme: 'system',
          currency: 'XAF',
          timezone: 'Africa/Malabo',
        },
        profile: {},
      }

      setUser(mockUser)
      localStorage.setItem('taxasge-user', JSON.stringify(mockUser))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('taxasge-user')
  }

  const register = async (
    email: string,
    _password: string,
    firstName: string,
    lastName: string
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      // TODO: Appeler l'API backend pour register
      const mockUser: User = {
        id: Date.now().toString(),
        email,
        firstName,
        lastName,
        role: 'citizen',
        status: 'pending_verification',
        country: 'GQ',
        language: 'es',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        preferences: {
          emailNotifications: true,
          pushNotifications: false,
          language: 'es',
          theme: 'system',
          currency: 'XAF',
          timezone: 'Africa/Malabo',
        },
        profile: {},
      }

      setUser(mockUser)
      localStorage.setItem('taxasge-user', JSON.stringify(mockUser))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        isAuthenticated: !!user,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Hook personnalisé pour utiliser le contexte
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
