'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Menu, 
  X, 
  Search,
  Calculator,
  Building2,
  Users,
  Settings,
  LogIn,
  UserPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Servicios', href: '/services', icon: FileText },
  { name: 'Calculadora', href: '/calculator', icon: Calculator },
  { name: 'Ministerios', href: '/ministries', icon: Building2 },
  { name: 'Sectores', href: '/sectors', icon: Users },
  { name: 'Guía', href: '/guide', icon: Settings },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-gq-red via-gq-yellow to-gq-green rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-display font-bold gradient-text">TAXASGE</h1>
              <p className="text-xs text-muted-foreground">República de Guinea</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Search & Actions */}
          <div className="flex items-center space-x-4">
            {/* Quick Search */}
            <Button variant="outline" size="sm" className="hidden md:flex">
              <Search className="w-4 h-4 mr-2" />
              Buscar servicios...
            </Button>
            
            {/* Auth Buttons */}
            <div className="hidden sm:flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/login">
                  <LogIn className="w-4 h-4 mr-2" />
                  Iniciar Sesión
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth/register">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Registrarse
                </Link>
              </Button>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t bg-card"
            >
              <div className="px-4 py-6 space-y-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-3 py-3 text-base font-medium text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                ))}
                
                <div className="pt-4 space-y-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/auth/login">
                      <LogIn className="w-4 h-4 mr-2" />
                      Iniciar Sesión
                    </Link>
                  </Button>
                  <Button className="w-full" asChild>
                    <Link href="/auth/register">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Registrarse
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}