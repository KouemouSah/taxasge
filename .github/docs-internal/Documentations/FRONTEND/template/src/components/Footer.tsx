import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import taxageLogo from "@/assets/taxage_logo.png";

const Footer = () => {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img src={taxageLogo} alt="TaxasGE Logo" className="h-12 w-12" />
              <span className="text-lg font-bold">TaxasGE</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Plateforme officielle des services fiscaux de la Guinée Équatoriale
            </p>
            <div className="flex space-x-2">
              <div className="h-6 w-2 bg-guinea-red rounded"></div>
              <div className="h-6 w-2 bg-guinea-yellow rounded"></div>
              <div className="h-6 w-2 bg-guinea-green rounded"></div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/services" className="text-muted-foreground hover:text-primary transition-colors">
                  Tous les services
                </Link>
              </li>
              <li>
                <Link to="/ministries" className="text-muted-foreground hover:text-primary transition-colors">
                  Ministères
                </Link>
              </li>
              <li>
                <Link to="/calculator" className="text-muted-foreground hover:text-primary transition-colors">
                  Calculateur
                </Link>
              </li>
              <li>
                <Link to="/guide" className="text-muted-foreground hover:text-primary transition-colors">
                  Guide pratique
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">Légal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/legal/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link to="/legal/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Conditions d'utilisation
                </Link>
              </li>
              <li>
                <Link to="/legal/cookies" className="text-muted-foreground hover:text-primary transition-colors">
                  Politique de cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-2 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Ministère des Finance, Malabo, Guinée Équatoriale</span>
              </li>
              <li className="flex items-center space-x-2 text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>+224 XXX XXX XXX</span>
              </li>
              <li className="flex items-center space-x-2 text-muted-foreground">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>contact@taxasge.gq</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© 2025 TaxasGE - Ministère des Finance Guinée Équatoriale. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export { Footer };
export default Footer;
