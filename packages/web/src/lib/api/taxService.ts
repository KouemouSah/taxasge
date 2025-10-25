import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { Tax, SearchFilters, CalculationParams, CalculationResult } from '@/types/tax'

class TaxService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Intercepteur pour gestion d'erreurs
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message)
        return Promise.reject(error)
      }
    )
  }

  // Recherche de services fiscaux
  async searchTaxes(query: string, filters?: SearchFilters): Promise<{
    results: Tax[]
    total: number
    page: number
    totalPages: number
  }> {
    try {
      const response: AxiosResponse = await this.client.post('/api/v1/fiscal-services/search', {
        q: query,
        ...filters,
      })

      return {
        results: response.data.results || [],
        total: response.data.total_results || 0,
        page: response.data.page || 1,
        totalPages: response.data.total_pages || 1,
      }
    } catch (error) {
      console.error('Search taxes failed:', error)
      throw new Error('Erreur lors de la recherche des services fiscaux')
    }
  }

  // Obtenir un service fiscal par ID
  async getTaxById(id: string, language: string = 'es'): Promise<Tax> {
    try {
      const response: AxiosResponse = await this.client.get(`/api/v1/fiscal-services/${id}`, {
        params: { language }
      })

      return response.data.service
    } catch (error) {
      console.error('Get tax by ID failed:', error)
      throw new Error('Service fiscal non trouvé')
    }
  }

  // Calculer le montant d'un service fiscal
  async calculateAmount(params: CalculationParams): Promise<CalculationResult> {
    try {
      const response: AxiosResponse = await this.client.post(`/api/v1/fiscal-services/${params.serviceId}/calculate`, {
        payment_type: params.paymentType,
        calculation_base: params.calculationBase,
        parameters: params.parameters,
      })

      return {
        calculatedAmount: response.data.calculated_amount,
        baseAmount: response.data.base_amount,
        breakdown: response.data.breakdown,
        nextSteps: response.data.next_steps,
        paymentOptions: response.data.payment_options,
        calculatedAt: response.data.calculated_at,
      }
    } catch (error) {
      console.error('Calculate amount failed:', error)
      throw new Error('Erreur lors du calcul du montant')
    }
  }

  // Obtenir la hiérarchie des services (ministères > secteurs > catégories)
  async getHierarchy(language: string = 'es'): Promise<any> {
    try {
      const response: AxiosResponse = await this.client.get('/api/v1/fiscal-services/hierarchy', {
        params: { language }
      })

      return response.data.hierarchy
    } catch (error) {
      console.error('Get hierarchy failed:', error)
      throw new Error('Erreur lors du chargement de la hiérarchie')
    }
  }

  // Obtenir les services populaires
  async getPopularServices(limit: number = 10, language: string = 'es'): Promise<Tax[]> {
    try {
      const response: AxiosResponse = await this.client.get('/api/v1/fiscal-services/popular', {
        params: { limit, language }
      })

      return response.data.services || []
    } catch (error) {
      console.error('Get popular services failed:', error)
      // Fallback avec données statiques
      return this.getMockPopularServices()
    }
  }

  // Obtenir les services récemment mis à jour
  async getRecentUpdates(limit: number = 5, language: string = 'es'): Promise<Tax[]> {
    try {
      const response: AxiosResponse = await this.client.get('/api/v1/fiscal-services/recent', {
        params: { limit, language }
      })

      return response.data.services || []
    } catch (error) {
      console.error('Get recent updates failed:', error)
      return []
    }
  }

  // Obtenir les statistiques globales
  async getStats(): Promise<{
    totalServices: number
    totalMinistries: number
    totalUsers: number
    totalCalculations: number
  }> {
    try {
      const response: AxiosResponse = await this.client.get('/api/v1/stats')

      return {
        totalServices: response.data.total_services || 547,
        totalMinistries: response.data.total_ministries || 8,
        totalUsers: response.data.total_users || 15247,
        totalCalculations: response.data.total_calculations || 89432,
      }
    } catch (error) {
      console.error('Get stats failed:', error)
      // Fallback avec données statiques
      return {
        totalServices: 547,
        totalMinistries: 8,
        totalUsers: 15247,
        totalCalculations: 89432,
      }
    }
  }

  // Données mock pour développement/fallback
  private getMockPopularServices(): Tax[] {
    return [
      {
        id: 'T-001',
        code: 'DRV-LIC-001',
        name: {
          es: 'Permiso de Conducir',
          fr: 'Permis de Conduire',
          en: 'Driving License'
        },
        description: {
          es: 'Permiso para conducir vehículos motorizados',
          fr: 'Permis pour conduire des véhicules motorisés',
          en: 'License to drive motor vehicles'
        },
        category_id: 'cat-transport',
        category: 'Transporte',
        amount: 15000,
        currency: 'XAF',
        processing_time: '5-7 días laborables',
        is_active: true,
      },
      {
        id: 'T-002',
        code: 'COM-PAT-001',
        name: {
          es: 'Patente Comercial',
          fr: 'Patente Commerciale',
          en: 'Commercial License'
        },
        description: {
          es: 'Licencia para ejercer actividades comerciales',
          fr: 'Licence pour exercer des activités commerciales',
          en: 'License to conduct commercial activities'
        },
        category_id: 'cat-commerce',
        category: 'Comercio',
        amount: 25000,
        currency: 'XAF',
        processing_time: '10-15 días laborables',
        is_active: true,
      },
      // Ajouter plus de services mock...
    ] as Tax[]
  }

  // Gestion du cache offline
  async searchOffline(query: string): Promise<Tax[]> {
    try {
      // Recherche dans IndexedDB local
      return new Promise((resolve) => {
        const request = indexedDB.open('taxasge-db', 1)
        
        request.onsuccess = () => {
          const db = request.result
          const transaction = db.transaction(['taxes'], 'readonly')
          const store = transaction.objectStore('taxes')
          const getAllRequest = store.getAll()
          
          getAllRequest.onsuccess = () => {
            const allTaxes = getAllRequest.result
            const filtered = allTaxes.filter((tax: Tax) => {
              const queryLower = query.toLowerCase()

              // Handle name search (string or multilingual object)
              let nameMatch = false
              if (typeof tax.name === 'string') {
                nameMatch = tax.name.toLowerCase().includes(queryLower)
              } else if (tax.name && typeof tax.name === 'object') {
                nameMatch =
                  tax.name.es?.toLowerCase().includes(queryLower) ||
                  tax.name.fr?.toLowerCase().includes(queryLower) ||
                  tax.name.en?.toLowerCase().includes(queryLower)
              }

              // Handle category search
              const categoryMatch = typeof tax.category === 'string'
                ? tax.category.toLowerCase().includes(queryLower)
                : false

              return nameMatch || categoryMatch
            })
            resolve(filtered)
          }
          
          getAllRequest.onerror = () => resolve([])
        }
        
        request.onerror = () => resolve([])
      })
    } catch (error) {
      console.error('Offline search failed:', error)
      return []
    }
  }

  // Synchroniser données avec le serveur
  async syncTaxData(): Promise<void> {
    try {
      const lastSync = localStorage.getItem('taxasge-last-sync')
      const response = await this.client.get('/api/v1/fiscal-services/sync', {
        params: { since: lastSync }
      })

      const { updated, deleted } = response.data

      // Mettre à jour IndexedDB
      await this.updateLocalTaxes(updated)
      await this.deleteLocalTaxes(deleted)

      // Sauvegarder timestamp sync
      localStorage.setItem('taxasge-last-sync', Date.now().toString())
    } catch (error) {
      console.error('Tax data sync failed:', error)
      throw error
    }
  }

  private async updateLocalTaxes(taxes: Tax[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('taxasge-db', 1)
      
      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction(['taxes'], 'readwrite')
        const store = transaction.objectStore('taxes')
        
        taxes.forEach(tax => {
          store.put(tax)
        })
        
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  private async deleteLocalTaxes(taxIds: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('taxasge-db', 1)
      
      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction(['taxes'], 'readwrite')
        const store = transaction.objectStore('taxes')
        
        taxIds.forEach(id => {
          store.delete(id)
        })
        
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
      }
      
      request.onerror = () => reject(request.error)
    })
  }
}

// Instance singleton
export const taxService = new TaxService()