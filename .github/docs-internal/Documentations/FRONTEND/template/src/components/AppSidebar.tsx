import { Home, LayoutDashboard, Calculator, FileText, User, CreditCard, Settings, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const menuItems = [
  { title: "Accueil", view: "home", icon: Home },
  { title: "Calculatrice", view: "calculator", icon: Calculator },
  { title: "Déclarations", view: "declarations", icon: FileText },
  { title: "Paiements", view: "payments", icon: CreditCard },
  { title: "Profil", view: "profile", icon: User },
];

interface AppSidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function AppSidebar({ currentView, onViewChange }: AppSidebarProps) {
  const isActive = (view: string) => currentView === view;

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-6">
        <div className="flex flex-col items-center space-y-3">
          <Avatar className="h-20 w-20 border-2 border-primary">
            <AvatarImage src="https://github.com/shadcn.png" alt="User" />
            <AvatarFallback className="text-lg">UN</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <p className="font-semibold text-base">Utilisateur</p>
            <p className="text-xs text-muted-foreground">user@example.com</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    isActive={isActive(item.view)}
                    onClick={() => onViewChange(item.view)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-4" />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => onViewChange('profile')}>
                  <Settings className="h-4 w-4" />
                  <span>Paramètres</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => window.location.href = '/'}>
                  <LogOut className="h-4 w-4" />
                  <span>Déconnexion</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
