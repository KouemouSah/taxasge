# 🧩 COMPOSANTS UI TAXASGE
## Guide Complet shadcn/ui + Composants Custom

**Version** : 1.0  
**Date** : 2025-10-31  
**Statut** : ✅ PRODUCTION READY  
**Bibliothèque** : shadcn/ui + Radix UI + Tailwind CSS

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Composants de Base](#composants-de-base)
3. [Composants Formulaires](#composants-formulaires)
4. [Composants Navigation](#composants-navigation)
5. [Composants Feedback](#composants-feedback)
6. [Composants Layout](#composants-layout)
7. [Composants Custom TaxasGE](#composants-custom-taxasge)
8. [Patterns d'utilisation](#patterns-dutilisation)

---

## 🎯 VUE D'ENSEMBLE

### Système de Composants

```
shadcn/ui (Base)
    ↓
Radix UI (Primitives accessibles)
    ↓
Tailwind CSS (Styling)
    ↓
TaxasGE Custom (Composants métier)
```

### Composants Disponibles

**Base** (30+ composants) :
- Button, Input, Label, Textarea
- Card, Badge, Avatar, Separator
- Dialog, Sheet, Popover, Tooltip
- Select, Checkbox, Radio Group, Switch
- Table, Tabs, Accordion, Collapsible
- Dropdown Menu, Context Menu, Menubar
- Alert, Toast, Progress, Skeleton

**Custom TaxasGE** :
- ServiceCard, StatsCard, DashboardCard
- SearchBar, FilterBar, CategoryFilter
- Header, Footer, Sidebar, Chatbot

---

## 🔘 COMPOSANTS DE BASE

### Button

**Variants** : `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`  
**Sizes** : `default`, `sm`, `lg`, `icon`

```tsx
import { Button } from '@/components/ui/button';
import { ArrowRight, Trash2, Download } from 'lucide-react';

// Variants
<Button variant="default">Action Principale</Button>
<Button variant="secondary">Action Secondaire</Button>
<Button variant="destructive">Supprimer</Button>
<Button variant="outline">Contour</Button>
<Button variant="ghost">Transparent</Button>
<Button variant="link">Lien</Button>

// Sizes
<Button size="default">Normal</Button>
<Button size="sm">Petit</Button>
<Button size="lg">Grand</Button>
<Button size="icon"><ArrowRight /></Button>

// Avec icône
<Button>
  Continuer
  <ArrowRight className="ml-2 h-4 w-4" />
</Button>

<Button variant="destructive">
  <Trash2 className="mr-2 h-4 w-4" />
  Supprimer
</Button>

// États
<Button disabled>Désactivé</Button>
<Button loading>Chargement...</Button>

// Full width
<Button className="w-full">Pleine largeur</Button>
```

**Pattern Navigation** :
```tsx
import Link from 'next/link';

<Link href="/services">
  <Button>Voir les services</Button>
</Link>

// OU
<Button asChild>
  <Link href="/services">Voir les services</Link>
</Button>
```

---

### Card

**Composants** : `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`

```tsx
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Structure complète
<Card className="hover:shadow-lg transition-shadow">
  <CardHeader>
    <CardTitle>Titre de la carte</CardTitle>
    <CardDescription>
      Description optionnelle de la carte
    </CardDescription>
  </CardHeader>
  
  <CardContent>
    <p>Contenu principal de la carte.</p>
    <div className="space-y-2 mt-4">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Prix:</span>
        <span className="font-bold">50,000 XAF</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Durée:</span>
        <span>5-7 jours</span>
      </div>
    </div>
  </CardContent>
  
  <CardFooter>
    <Button className="w-full">Action</Button>
  </CardFooter>
</Card>

// Card simple (sans header/footer)
<Card className="p-6">
  <p>Contenu simple</p>
</Card>

// Card avec gradient
<Card className="bg-gradient-card border-none text-white">
  <CardContent className="pt-6">
    <h3>Titre</h3>
    <p>Contenu</p>
  </CardContent>
</Card>
```

**Pattern Service Card** :
```tsx
<Card className="group hover:shadow-lg transition-all">
  <CardHeader className="flex flex-row items-center justify-between">
    <div>
      <CardTitle className="text-xl">{service.name}</CardTitle>
      <CardDescription>{service.ministry}</CardDescription>
    </div>
    <Badge variant="secondary">{service.code}</Badge>
  </CardHeader>
  
  <CardContent>
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Secteur:</span>
        <span className="font-medium">{service.sector}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Prix:</span>
        <span className="font-bold text-primary">{service.price} XAF</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Durée:</span>
        <span>{service.duration}</span>
      </div>
    </div>
  </CardContent>
  
  <CardFooter>
    <Button className="w-full" asChild>
      <Link href={`/services/${service.id}`}>
        Voir les détails
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </Button>
  </CardFooter>
</Card>
```

**Pattern Stats Card** :
```tsx
<Card>
  <CardHeader className="flex flex-row items-center justify-between pb-2">
    <CardTitle className="text-sm font-medium">
      Déclarations en cours
    </CardTitle>
    <FileText className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">24</div>
    <p className="text-xs text-muted-foreground">
      +2 depuis hier
    </p>
  </CardContent>
</Card>
```

---

### Badge

**Variants** : `default`, `secondary`, `destructive`, `outline`

```tsx
import { Badge } from '@/components/ui/badge';

// Variants
<Badge variant="default">Par défaut</Badge>
<Badge variant="secondary">Secondaire</Badge>
<Badge variant="destructive">Destructif</Badge>
<Badge variant="outline">Contour</Badge>

// Couleurs custom (via className)
<Badge className="bg-success text-success-foreground">
  Actif
</Badge>

<Badge className="bg-warning text-warning-foreground">
  En attente
</Badge>

// Pattern Status Badge
function StatusBadge({ status }: { status: string }) {
  const variants = {
    active: 'bg-success/20 text-success',
    pending: 'bg-warning/20 text-warning',
    rejected: 'bg-destructive/20 text-destructive',
  };
  
  return (
    <Badge className={variants[status] || 'bg-muted'}>
      {status}
    </Badge>
  );
}
```

---

### Avatar

```tsx
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

// Avec image
<Avatar>
  <AvatarImage src="/avatars/user.jpg" alt="User" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>

// Fallback seulement (initiales)
<Avatar>
  <AvatarFallback>JD</AvatarFallback>
</Avatar>

// Sizes
<Avatar className="h-8 w-8">...</Avatar>      {/* Small */}
<Avatar className="h-12 w-12">...</Avatar>    {/* Default */}
<Avatar className="h-16 w-16">...</Avatar>    {/* Large */}
<Avatar className="h-24 w-24">...</Avatar>    {/* XL */}

// Pattern User Avatar
function UserAvatar({ user }: { user: User }) {
  return (
    <Avatar>
      <AvatarImage src={user.avatar} alt={user.name} />
      <AvatarFallback>
        {user.name.split(' ').map(n => n[0]).join('')}
      </AvatarFallback>
    </Avatar>
  );
}
```

---

### Separator

```tsx
import { Separator } from '@/components/ui/separator';

// Horizontal (default)
<Separator />

// Vertical
<div className="flex h-5 items-center space-x-4">
  <div>Item 1</div>
  <Separator orientation="vertical" />
  <div>Item 2</div>
</div>

// Avec texte
<div className="relative">
  <Separator />
  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2">
    <span className="text-muted-foreground text-sm">OU</span>
  </div>
</div>
```

---

## 📝 COMPOSANTS FORMULAIRES

### Input

```tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Mail } from 'lucide-react';

// Input simple
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input 
    id="email"
    type="email"
    placeholder="votre@email.com"
  />
</div>

// Input avec icône (gauche)
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <Input 
    placeholder="Rechercher..." 
    className="pl-9"
  />
</div>

// Input avec icône (droite)
<div className="relative">
  <Input 
    type="email"
    placeholder="Email"
    className="pr-9"
  />
  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
</div>

// Input disabled
<Input disabled placeholder="Désactivé" />

// Input avec erreur
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input 
    id="email"
    type="email"
    className="border-destructive"
  />
  <p className="text-sm text-destructive">Email invalide</p>
</div>

// Types disponibles
<Input type="text" />
<Input type="email" />
<Input type="password" />
<Input type="number" />
<Input type="tel" />
<Input type="url" />
<Input type="date" />
<Input type="time" />
```

---

### Textarea

```tsx
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

<div className="space-y-2">
  <Label htmlFor="description">Description</Label>
  <Textarea 
    id="description"
    placeholder="Entrez votre description..."
    rows={4}
  />
</div>

// Avec limite caractères
<div className="space-y-2">
  <Label>Message</Label>
  <Textarea 
    maxLength={500}
    placeholder="Maximum 500 caractères"
  />
  <p className="text-xs text-muted-foreground text-right">
    {value.length}/500 caractères
  </p>
</div>
```

---

### Select

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Choisir une catégorie" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="license">Licences</SelectItem>
    <SelectItem value="permit">Permis</SelectItem>
    <SelectItem value="certificate">Certificats</SelectItem>
  </SelectContent>
</Select>

// Avec Label
<div className="space-y-2">
  <Label>Catégorie</Label>
  <Select>
    <SelectTrigger>
      <SelectValue placeholder="Sélectionner" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="cat1">Catégorie 1</SelectItem>
      <SelectItem value="cat2">Catégorie 2</SelectItem>
    </SelectContent>
  </Select>
</div>

// Controlled
'use client';

const [value, setValue] = useState('');

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

---

### Checkbox

```tsx
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// Simple
<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Accepter les conditions</Label>
</div>

// Avec description
<div className="flex items-start space-x-2">
  <Checkbox id="marketing" className="mt-1" />
  <div className="space-y-1">
    <Label htmlFor="marketing">Recevoir les emails marketing</Label>
    <p className="text-sm text-muted-foreground">
      Nous vous enverrons des offres et actualités.
    </p>
  </div>
</div>

// Controlled
'use client';

const [checked, setChecked] = useState(false);

<Checkbox 
  checked={checked}
  onCheckedChange={setChecked}
/>
```

---

### Radio Group

```tsx
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

<RadioGroup defaultValue="option1">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option1" id="option1" />
    <Label htmlFor="option1">Option 1</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option2" id="option2" />
    <Label htmlFor="option2">Option 2</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option3" id="option3" />
    <Label htmlFor="option3">Option 3</Label>
  </div>
</RadioGroup>

// Avec descriptions
<RadioGroup defaultValue="standard">
  <div className="flex items-start space-x-2 p-4 border rounded-lg">
    <RadioGroupItem value="standard" id="standard" className="mt-1" />
    <div>
      <Label htmlFor="standard" className="font-medium">Standard</Label>
      <p className="text-sm text-muted-foreground">
        Traitement en 5-7 jours
      </p>
    </div>
  </div>
  
  <div className="flex items-start space-x-2 p-4 border rounded-lg">
    <RadioGroupItem value="express" id="express" className="mt-1" />
    <div>
      <Label htmlFor="express" className="font-medium">Express</Label>
      <p className="text-sm text-muted-foreground">
        Traitement en 24h (+50%)
      </p>
    </div>
  </div>
</RadioGroup>
```

---

### Switch

```tsx
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Simple
<div className="flex items-center space-x-2">
  <Switch id="airplane-mode" />
  <Label htmlFor="airplane-mode">Mode avion</Label>
</div>

// Avec description
<div className="flex items-center justify-between">
  <div className="space-y-0.5">
    <Label htmlFor="notifications">Notifications</Label>
    <p className="text-sm text-muted-foreground">
      Recevoir des notifications par email
    </p>
  </div>
  <Switch id="notifications" />
</div>

// Controlled
'use client';

const [enabled, setEnabled] = useState(false);

<Switch checked={enabled} onCheckedChange={setEnabled} />
```

---

## 🧭 COMPOSANTS NAVIGATION

### Tabs

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
    <TabsTrigger value="analytics">Analytiques</TabsTrigger>
    <TabsTrigger value="reports">Rapports</TabsTrigger>
  </TabsList>
  
  <TabsContent value="overview">
    <Card>
      <CardContent className="pt-6">
        Contenu vue d'ensemble
      </CardContent>
    </Card>
  </TabsContent>
  
  <TabsContent value="analytics">
    <Card>
      <CardContent className="pt-6">
        Contenu analytiques
      </CardContent>
    </Card>
  </TabsContent>
  
  <TabsContent value="reports">
    <Card>
      <CardContent className="pt-6">
        Contenu rapports
      </CardContent>
    </Card>
  </TabsContent>
</Tabs>

// Full width tabs
<TabsList className="grid w-full grid-cols-3">
  <TabsTrigger value="tab1">Tab 1</TabsTrigger>
  <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  <TabsTrigger value="tab3">Tab 3</TabsTrigger>
</TabsList>
```

---

### Dropdown Menu

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Profil</DropdownMenuItem>
    <DropdownMenuItem>Paramètres</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive">
      Déconnexion
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

// Avec icônes
<DropdownMenuContent>
  <DropdownMenuItem>
    <User className="mr-2 h-4 w-4" />
    Profil
  </DropdownMenuItem>
  <DropdownMenuItem>
    <Settings className="mr-2 h-4 w-4" />
    Paramètres
  </DropdownMenuItem>
  <DropdownMenuItem>
    <LogOut className="mr-2 h-4 w-4" />
    Déconnexion
  </DropdownMenuItem>
</DropdownMenuContent>
```

---

### Breadcrumb

```tsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/services">Services</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Patente Commerciale</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

---

## 💬 COMPOSANTS FEEDBACK

### Alert

```tsx
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

// Success
<Alert variant="default" className="border-success">
  <CheckCircle className="h-4 w-4 text-success" />
  <AlertTitle>Succès</AlertTitle>
  <AlertDescription>
    Votre déclaration a été soumise avec succès.
  </AlertDescription>
</Alert>

// Error
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Erreur</AlertTitle>
  <AlertDescription>
    Une erreur est survenue lors de la soumission.
  </AlertDescription>
</Alert>

// Info
<Alert>
  <Info className="h-4 w-4" />
  <AlertTitle>Information</AlertTitle>
  <AlertDescription>
    Votre session expire dans 5 minutes.
  </AlertDescription>
</Alert>
```

---

### Toast (Notifications)

```tsx
'use client';

import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

export function ToastDemo() {
  const { toast } = useToast();

  return (
    <Button
      onClick={() => {
        toast({
          title: "Succès",
          description: "Votre action a été effectuée.",
        });
      }}
    >
      Afficher toast
    </Button>
  );
}

// Variants
// Success
toast({
  title: "Déclaration soumise",
  description: "Votre déclaration a été enregistrée.",
});

// Error
toast({
  variant: "destructive",
  title: "Erreur",
  description: "Une erreur est survenue.",
});

// Avec action
toast({
  title: "Nouveau message",
  description: "Vous avez reçu un nouveau message.",
  action: <Button variant="outline" size="sm">Voir</Button>,
});
```

---

### Dialog (Modal)

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Ouvrir modal</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirmer l'action</DialogTitle>
      <DialogDescription>
        Êtes-vous sûr de vouloir effectuer cette action ?
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Annuler</Button>
      <Button>Confirmer</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// Controlled
'use client';

const [open, setOpen] = useState(false);

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Modal</DialogTitle>
    </DialogHeader>
    <p>Contenu</p>
    <DialogFooter>
      <Button onClick={() => setOpen(false)}>Fermer</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### Progress

```tsx
import { Progress } from '@/components/ui/progress';

<Progress value={33} />
<Progress value={66} />
<Progress value={100} />

// Avec label
<div className="space-y-2">
  <div className="flex justify-between text-sm">
    <span>Progression</span>
    <span className="text-muted-foreground">75%</span>
  </div>
  <Progress value={75} />
</div>

// Couleurs custom
<Progress value={50} className="[&>div]:bg-success" />
<Progress value={50} className="[&>div]:bg-warning" />
<Progress value={50} className="[&>div]:bg-destructive" />
```

---

### Skeleton (Loading)

```tsx
import { Skeleton } from '@/components/ui/skeleton';

// Éléments individuels
<Skeleton className="h-12 w-12 rounded-full" />
<Skeleton className="h-4 w-[250px]" />
<Skeleton className="h-4 w-[200px]" />

// Pattern Card Loading
<Card>
  <CardHeader>
    <Skeleton className="h-6 w-[200px]" />
    <Skeleton className="h-4 w-[150px] mt-2" />
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  </CardContent>
</Card>
```

---

## 📊 COMPOSANTS LAYOUT

### Table

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nom</TableHead>
      <TableHead>Statut</TableHead>
      <TableHead>Date</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {items.map((item) => (
      <TableRow key={item.id}>
        <TableCell className="font-medium">{item.name}</TableCell>
        <TableCell>
          <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
            {item.status}
          </Badge>
        </TableCell>
        <TableCell>{item.date}</TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### Accordion

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Comment créer un compte ?</AccordionTrigger>
    <AccordionContent>
      Cliquez sur "Inscription" et remplissez le formulaire.
    </AccordionContent>
  </AccordionItem>
  
  <AccordionItem value="item-2">
    <AccordionTrigger>Quels documents sont nécessaires ?</AccordionTrigger>
    <AccordionContent>
      Vous aurez besoin de votre carte d'identité et d'un justificatif.
    </AccordionContent>
  </AccordionItem>
</Accordion>

// Multiple items open
<Accordion type="multiple">
  <AccordionItem value="item-1">...</AccordionItem>
  <AccordionItem value="item-2">...</AccordionItem>
</Accordion>
```

---

## 🎨 COMPOSANTS CUSTOM TAXASGE

### ServiceCard (Custom)

```tsx
// components/cards/service-card.tsx
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { Service } from '@/types';

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">{service.name}</CardTitle>
          <CardDescription className="text-primary">
            {service.ministry}
          </CardDescription>
        </div>
        <Badge variant="secondary">{service.code}</Badge>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Secteur:</span>
            <span className="font-medium">{service.sector}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Catégorie:</span>
            <span>{service.category}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Prix:</span>
            <span className="font-bold text-primary">{service.price} XAF</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Durée:</span>
            <span>{service.duration}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button className="w-full" asChild>
          <Link href={`/services/${service.id}`}>
            Voir les détails
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
```

**Usage** :
```tsx
import { ServiceCard } from '@/components/cards/service-card';

<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
  {services.map(service => (
    <ServiceCard key={service.id} service={service} />
  ))}
</div>
```

---

### StatsCard (Custom)

```tsx
// components/cards/stats-card.tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatsCard({ title, value, description, icon: Icon, trend }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {trend && (
          <p className={`text-xs mt-1 ${trend.isPositive ? 'text-success' : 'text-destructive'}`}>
            {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}% depuis hier
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

**Usage** :
```tsx
import { StatsCard } from '@/components/cards/stats-card';
import { FileText, Users, DollarSign, TrendingUp } from 'lucide-react';

<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  <StatsCard 
    title="Déclarations"
    value="24"
    description="+2 depuis hier"
    icon={FileText}
  />
  <StatsCard 
    title="Utilisateurs"
    value="1,234"
    icon={Users}
  />
  <StatsCard 
    title="Revenus"
    value="45.2M XAF"
    icon={DollarSign}
    trend={{ value: 12, isPositive: true }}
  />
  <StatsCard 
    title="Croissance"
    value="+12.5%"
    icon={TrendingUp}
  />
</div>
```

---

## 🎯 PATTERNS D'UTILISATION

### Pattern : Form Complet

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export function LoginForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      // API call
      toast({
        title: "Connexion réussie",
        description: "Bienvenue !",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Identifiants incorrects.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email"
          type="email"
          {...form.register('email')}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input 
          id="password"
          type="password"
          {...form.register('password')}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>
      
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Connexion..." : "Se connecter"}
      </Button>
    </form>
  );
}
```

---

## 📚 RÉFÉRENCES

- **shadcn/ui** : https://ui.shadcn.com/
- **Radix UI** : https://www.radix-ui.com/
- **Lucide Icons** : https://lucide.dev/
- **CHARTE_GRAPHIQUE_COMPLETE.md** : Charte graphique TaxasGE

---

**Document** : Composants UI  
**Auteur** : Claude (Agent IA)  
**Date** : 2025-10-31  
**Version** : 1.0  
**Statut** : ✅ Production Ready
