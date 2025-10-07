'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Menu, X, Globe, User, Bell, Calculator, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { useAuth } from '@/components/providers/AuthProvider'
import { useOffline } from '@/components/providers/OfflineProvider'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const { language, setLanguage, t } = useLanguage()
  const { user, logout } = useAuth()
  const { isOnline, syncPending } = useOffline()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const navigationItems = [
    { href: '/', label: t('nav.home'), icon: null },
    { href: '/search', label: t('nav.search'), icon: Search },
    { href: '/calculate', label: t('nav.calculate'), icon: Calculator },
    { href: '/chat', label: t('nav.chat'), icon: MessageCircle },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-custom">
        <div className="flex h-16 items-center justify-between">
          {/* Logo et nom */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">TG</span>
              </div>
              <span className="font-display font-bold text-xl text-foreground">
                TaxasGE
              </span>
            </Link>
            
            {/* Indicateur offline */}
            {!isOnline && (
              <Badge variant="secondary" className="text-xs">
                Hors ligne
              </Badge>
            )}
            
            {/* Indicateur sync en cours */}
            {syncPending && (
              <Badge variant="outline" className="text-xs animate-pulse">
                Synchronisation...
              </Badge>
            )}
          </div>

          {/* Navigation desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Barre de recherche desktop */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('hero.search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4"
              />
            </form>
          </div>

          {/* Actions utilisateur */}
          <div className="flex items-center space-x-2">
            {/* Sélecteur de langue */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Globe className="h-4 w-4 mr-1" />
                  <span className="uppercase text-xs font-medium">
                    {language}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLanguage('es')}>
                  🇪🇸 Español
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('fr')}>
                  🇫🇷 Français
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('en')}>
                  🇬🇧 English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Toggle thème */}
            <ThemeToggle />

            {/* Notifications (si connecté) */}
            {user && (
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
                >
                  3
                </Badge>
              </Button>
            )}

            {/* Menu utilisateur */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">
                      {user.firstName}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      {t('nav.dashboard')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      Profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/favorites">
                      {t('actions.favorites')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">
                    Connexion
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">
                    Inscription
                  </Link>
                </Button>
              </div>
            )}

            {/* Menu mobile */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Menu mobile overlay */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t">
              {/* Recherche mobile */}
              <form onSubmit={handleSearch} className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={t('hero.search.placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4"
                />
              </form>

              {/* Navigation mobile */}
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    {item.icon && <item.icon className="h-4 w-4" />}
                    <span>{item.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}