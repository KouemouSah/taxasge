'use client'

import { useState, useEffect } from 'react'
import { Download, X, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isInWebAppiOS = (window.navigator as any).standalone === true
      const isInWebAppChrome = window.matchMedia('(display-mode: standalone)').matches
      
      return isStandalone || isInWebAppiOS || isInWebAppChrome
    }

    setIsInstalled(checkIfInstalled())

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Attendre un peu avant de montrer le prompt pour ne pas être intrusif
      setTimeout(() => {
        if (!localStorage.getItem('pwa-prompt-dismissed')) {
          setShowPrompt(true)
        }
      }, 3000)
    }

    // Écouter l'installation
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
      
      // Analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'pwa_installed', {
          event_category: 'engagement',
          event_label: 'pwa_install_success'
        })
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      // Afficher le prompt d'installation natif
      await deferredPrompt.prompt()
      
      // Attendre la réponse de l'utilisateur
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('PWA installation accepted')
        
        // Analytics
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'pwa_install_accepted', {
            event_category: 'engagement'
          })
        }
      } else {
        console.log('PWA installation dismissed')
        
        // Analytics
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'pwa_install_dismissed', {
            event_category: 'engagement'
          })
        }
      }
      
      setShowPrompt(false)
      setDeferredPrompt(null)
    } catch (error) {
      console.error('PWA installation failed:', error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    
    // Se souvenir que l'utilisateur a refusé (pour 7 jours)
    const dismissedUntil = Date.now() + (7 * 24 * 60 * 60 * 1000)
    localStorage.setItem('pwa-prompt-dismissed', dismissedUntil.toString())
    
    // Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'pwa_prompt_dismissed', {
        event_category: 'engagement'
      })
    }
  }

  // Ne pas afficher si déjà installé ou pas de prompt disponible
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-sm">
      <Card className="border-2 border-primary/20 bg-background/95 backdrop-blur-sm shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-foreground text-sm">
                    Installer TaxasGE
                  </h4>
                  <Badge variant="secondary" className="text-xs mt-1">
                    Application Officielle
                  </Badge>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="p-1 h-auto"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                Installez TaxasGE sur votre appareil pour un accès rapide, 
                des notifications et une expérience optimisée.
              </p>
              
              <div className="flex items-center space-x-2">
                <Button 
                  size="sm" 
                  onClick={handleInstallClick}
                  className="flex-1"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Installer
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDismiss}
                >
                  Plus tard
                </Button>
              </div>
              
              <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                <span>✓ Mode hors ligne</span>
                <span>✓ Notifications</span>
                <span>✓ Accès rapide</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}