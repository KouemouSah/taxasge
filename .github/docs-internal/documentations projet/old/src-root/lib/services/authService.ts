import { User, LoginCredentials, RegisterData, AuthResponse } from '@/types/auth'

class AuthService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  private tokenKey = 'taxasge-auth-token'
  private userKey = 'taxasge-user'

  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur de connexion')
      }

      const authData: AuthResponse = await response.json()
      
      // Stocker le token et les données utilisateur
      localStorage.setItem(this.tokenKey, authData.accessToken)
      localStorage.setItem(this.userKey, JSON.stringify(authData.user))
      
      return authData.user
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  async register(userData: RegisterData): Promise<User> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur d\'inscription')
      }

      const authData: AuthResponse = await response.json()
      
      // Stocker le token et les données utilisateur
      localStorage.setItem(this.tokenKey, authData.accessToken)
      localStorage.setItem(this.userKey, JSON.stringify(authData.user))
      
      return authData.user
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  }

  async logout(): Promise<void> {
    try {
      const token = this.getToken()
      
      if (token) {
        // Appeler l'API de déconnexion
        await fetch(`${this.baseUrl}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      }
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      // Nettoyer le stockage local dans tous les cas
      localStorage.removeItem(this.tokenKey)
      localStorage.removeItem(this.userKey)
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = this.getToken()
      const storedUser = localStorage.getItem(this.userKey)
      
      if (!token || !storedUser) {
        return null
      }

      // Vérifier la validité du token avec l'API
      const response = await fetch(`${this.baseUrl}/api/v1/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        // Token invalide, nettoyer le stockage
        this.logout()
        return null
      }

      const userData = await response.json()
      
      // Mettre à jour les données utilisateur stockées
      localStorage.setItem(this.userKey, JSON.stringify(userData))
      
      return userData
    } catch (error) {
      console.error('Get current user failed:', error)
      return null
    }
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(this.tokenKey)
  }

  isAuthenticated(): boolean {
    return !!this.getToken()
  }

  async refreshToken(): Promise<string | null> {
    try {
      const token = this.getToken()
      
      if (!token) return null

      const response = await fetch(`${this.baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        this.logout()
        return null
      }

      const { accessToken } = await response.json()
      localStorage.setItem(this.tokenKey, accessToken)
      
      return accessToken
    } catch (error) {
      console.error('Token refresh failed:', error)
      this.logout()
      return null
    }
  }

  // Intercepteur pour ajouter automatiquement le token aux requêtes
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getToken()
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    // Si token expiré, essayer de le rafraîchir
    if (response.status === 401 && token) {
      const newToken = await this.refreshToken()
      
      if (newToken) {
        // Retry avec le nouveau token
        headers['Authorization'] = `Bearer ${newToken}`
        return fetch(url, {
          ...options,
          headers,
        })
      }
    }

    return response
  }
}

// Instance singleton
export const authService = new AuthService()