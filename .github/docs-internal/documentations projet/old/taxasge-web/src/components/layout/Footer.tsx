'use client'

import Link from 'next/link'
import { Github, Mail, Globe, Shield, FileText, HelpCircle } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'

export function Footer() {
  const { t } = useLanguage()

  const footerSections = [
    {
      title: 'TaxasGE',
      links: [
        { label: 'À Propos', href: '/about' },
        { label: 'Comment ça marche', href: '/how-it-works' },
        { label: 'Fonctionnalités', href: '/features' },
        { label: 'Nouveautés', href: '/changelog' },
      ]
    },
    {
      title: 'Services',
      links: [
        { label: 'Rechercher Taxes', href: '/search' },
        { label: 'Calculatrice', href: '/calculate' },
        { label: 'Assistant IA', href: '/chat' },
        { label: 'API Développeurs', href: '/api-docs' },
      ]
    },
    {
      title: 'Support',
      links: [
        { label: 'Centre d\'aide', href: '/help' },
        { label: 'FAQ', href: '/faq' },
        { label: 'Contact', href: '/contact' },
        { label: 'Signaler un bug', href: '/report-bug' },
      ]
    },
    {
      title: 'Légal',
      links: [
        { label: 'Conditions d\'utilisation', href: '/terms' },
        { label: 'Politique de confidentialité', href: '/privacy' },
        { label: 'Mentions légales', href: '/legal' },
        { label: 'Accessibilité', href: '/accessibility' },
      ]
    }
  ]

  const governmentLinks = [
    { 
      label: 'Direction Générale des Impôts', 
      href: 'https://dgi.gq.gov',
      description: 'Site officiel DGI'
    },
    { 
      label: 'Ministère des Finances', 
      href: 'https://minfinanzas.gq.gov',
      description: 'Ministère des Finances et du Budget'
    },
    { 
      label: 'Présidence de la République', 
      href: 'https://presidencia.gq.gov',
      description: 'Site officiel présidentiel'
    },
    { 
      label: 'BANGE', 
      href: 'https://bange.gq',
      description: 'Partenaire paiements sécurisés'
    },
  ]

  return (
    <footer className="bg-muted/30 border-t">
      <div className="container-custom">
        {/* Section principale */}
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Colonne logo et description */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-white font-bold text-sm">TG</span>
                </div>
                <span className="font-display font-bold text-xl">TaxasGE</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                Application officielle des services fiscaux de Guinée Équatoriale. 
                547 services avec calculatrice et assistant IA.
              </p>
              
              {/* Réseaux sociaux */}
              <div className="flex space-x-3">
                <Link 
                  href="https://github.com/KouemouSah/taxasge"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="h-5 w-5" />
                  <span className="sr-only">GitHub</span>
                </Link>
                <Link 
                  href="mailto:kouemou.sah@gmail.com"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="h-5 w-5" />
                  <span className="sr-only">Email</span>
                </Link>
                <Link 
                  href="https://taxasge.gq"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Globe className="h-5 w-5" />
                  <span className="sr-only">Site web</span>
                </Link>
              </div>
            </div>

            {/* Colonnes de liens */}
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="font-semibold text-sm text-foreground mb-3">
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Section liens gouvernementaux */}
        <div className="py-8 border-t border-border">
          <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Liens Gouvernementaux Officiels
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {governmentLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <Globe className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {link.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {link.description}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Section copyright */}
        <div className="py-6 border-t border-border">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm text-muted-foreground">
              <span>
                © 2024 République de Guinée Équatoriale. Tous droits réservés.
              </span>
              <div className="flex items-center space-x-4">
                <Link 
                  href="/terms" 
                  className="hover:text-foreground transition-colors"
                >
                  Conditions
                </Link>
                <Link 
                  href="/privacy" 
                  className="hover:text-foreground transition-colors"
                >
                  Confidentialité
                </Link>
                <Link 
                  href="/accessibility" 
                  className="hover:text-foreground transition-colors"
                >
                  Accessibilité
                </Link>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <span>Version 1.0.0</span>
              <span>•</span>
              <span>Développé par KOUEMOU SAH Jean Emac</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}