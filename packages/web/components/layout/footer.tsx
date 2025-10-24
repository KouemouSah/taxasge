import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Calculator, 
  Building2, 
  Users, 
  Mail, 
  Phone, 
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Instagram
} from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  const quickLinks = [
    { name: 'Servicios Fiscales', href: '/services', icon: FileText },
    { name: 'Calculadora', href: '/calculator', icon: Calculator },
    { name: 'Ministerios', href: '/ministries', icon: Building2 },
    { name: 'Sectores', href: '/sectors', icon: Users },
  ];

  const legalLinks = [
    { name: 'Términos de Uso', href: '/terms' },
    { name: 'Política de Privacidad', href: '/privacy' },
    { name: 'Cookies', href: '/cookies' },
    { name: 'Accesibilidad', href: '/accessibility' },
  ];

  const socialLinks = [
    { name: 'Facebook', href: '#', icon: Facebook },
    { name: 'Twitter', href: '#', icon: Twitter },
    { name: 'LinkedIn', href: '#', icon: Linkedin },
    { name: 'Instagram', href: '#', icon: Instagram },
  ];

  return (
    <footer className="bg-muted/30 border-t">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-guinea-red via-guinea-yellow to-guinea-green rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <div>
                <h2 className="text-xl font-display font-bold gradient-text">TAXASGE</h2>
                <p className="text-sm text-muted-foreground">República de Guinea</p>
              </div>
            </Link>
            
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Plataforma oficial para la consulta y gestión de los 547 servicios fiscales 
              de la República de Guinea. Transparencia y eficiencia al servicio del ciudadano.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Conakry, República de Guinea</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 text-primary" />
                <span>+224 XXX XXX XXX</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-primary" />
                <span>info@taxasge.gov.gn</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Enlaces Rápidos</h3>
            <nav className="space-y-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <nav className="space-y-3">
              {legalLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Mantente Informado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Recibe notificaciones sobre nuevos servicios y actualizaciones importantes.
            </p>
            
            <div className="space-y-3">
              <Button className="w-full">
                <Mail className="w-4 h-4 mr-2" />
                Suscribirse
              </Button>
              
              <div className="flex space-x-2">
                {socialLinks.map((social) => (
                  <Button
                    key={social.name}
                    variant="outline"
                    size="icon"
                    asChild
                    className="w-10 h-10"
                  >
                    <Link href={social.href} aria-label={social.name}>
                      <social.icon className="w-4 h-4" />
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="text-sm text-muted-foreground">
            © {currentYear} TAXASGE - Dirección General de Impuestos. Todos los derechos reservados.
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>547 Servicios</span>
            <Separator orientation="vertical" className="h-4" />
            <span>86 Categorías</span>
            <Separator orientation="vertical" className="h-4" />
            <span>16 Sectores</span>
          </div>
        </div>
      </div>
    </footer>
  );
}