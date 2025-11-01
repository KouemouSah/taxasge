# 📝 FORMULAIRES TAXASGE
## Guide Complet React Hook Form + Zod

**Version** : 1.0  
**Date** : 2025-10-31  
**Statut** : ✅ PRODUCTION READY  
**Stack** : React Hook Form + Zod + shadcn/ui

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Installation & Setup](#installation--setup)
3. [Formulaires simples](#formulaires-simples)
4. [Validation avec Zod](#validation-avec-zod)
5. [Composants formulaires](#composants-formulaires)
6. [Patterns avancés](#patterns-avancés)
7. [Gestion erreurs](#gestion-erreurs)
8. [Best Practices](#best-practices)

---

## 🎯 VUE D'ENSEMBLE

### Stack Formulaires

```
React Hook Form (Gestion état formulaire)
    ↓
Zod (Validation schémas TypeScript)
    ↓
shadcn/ui Form Components (UI)
    ↓
TypeScript (Type Safety)
```

### Pourquoi cette Stack ?

**React Hook Form** :
- ✅ Performance (pas de re-renders inutiles)
- ✅ Validation intégrée
- ✅ Moins de code boilerplate
- ✅ Supporte validation Zod

**Zod** :
- ✅ Schémas TypeScript natifs
- ✅ Validation côté client ET serveur
- ✅ Messages d'erreur customizables
- ✅ Inférence types automatique

**shadcn/ui Form** :
- ✅ Composants accessibles (ARIA)
- ✅ Styling cohérent
- ✅ Intégration native react-hook-form

---

## 📦 INSTALLATION & SETUP

### Installation

```bash
# React Hook Form
npm install react-hook-form

# Zod
npm install zod

# Resolver Zod pour react-hook-form
npm install @hookform/resolvers
```

---

### Setup shadcn/ui Form

```bash
npx shadcn-ui@latest add form
```

Cela installe automatiquement :
- `components/ui/form.tsx`
- `components/ui/label.tsx`
- Dépendances nécessaires

---

## 📝 FORMULAIRES SIMPLES

### Formulaire Contact (Sans Validation)

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function ContactFormSimple() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form data:', formData);
    // API call...
  };
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nom</Label>
        <Input 
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Votre nom"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="votre@email.com"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea 
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Votre message..."
          rows={4}
        />
      </div>
      
      <Button type="submit" className="w-full">
        Envoyer
      </Button>
    </form>
  );
}
```

---

### Formulaire avec React Hook Form

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormData {
  email: string;
  password: string;
}

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  
  const onSubmit = (data: FormData) => {
    console.log('Form data:', data);
    // API call...
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email"
          type="email"
          {...register('email', { required: 'Email requis' })}
          placeholder="votre@email.com"
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input 
          id="password"
          type="password"
          {...register('password', { 
            required: 'Mot de passe requis',
            minLength: {
              value: 8,
              message: 'Minimum 8 caractères'
            }
          })}
          placeholder="••••••••"
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>
      
      <Button type="submit" className="w-full">
        Se connecter
      </Button>
    </form>
  );
}
```

---

## ✅ VALIDATION AVEC ZOD

### Schéma Zod Simple

```ts
// lib/validations/auth.ts
import * as z from 'zod';

export const loginSchema = z.object({
  email: z.string()
    .email('Email invalide')
    .min(1, 'Email requis'),
  password: z.string()
    .min(8, 'Minimum 8 caractères')
    .max(100, 'Maximum 100 caractères'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
```

---

### Formulaire avec Zod

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginFormWithZod() {
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting } 
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });
  
  const onSubmit = async (data: LoginFormData) => {
    try {
      // API call
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Erreur de connexion');
      
      // Success
      console.log('Connexion réussie');
    } catch (error) {
      console.error(error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email"
          type="email"
          {...register('email')}
          placeholder="votre@email.com"
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input 
          id="password"
          type="password"
          {...register('password')}
          placeholder="••••••••"
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>
      
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Connexion...' : 'Se connecter'}
      </Button>
    </form>
  );
}
```

---

### Schémas Zod Avancés

```ts
// lib/validations/declarations.ts
import * as z from 'zod';

// Types personnalisés
const phoneRegex = /^(\+241|00241)?[0-9]{8,9}$/;

export const declarationSchema = z.object({
  // String avec contraintes
  company_name: z.string()
    .min(3, 'Minimum 3 caractères')
    .max(100, 'Maximum 100 caractères'),
  
  // Email
  email: z.string().email('Email invalide'),
  
  // Téléphone custom
  phone: z.string()
    .regex(phoneRegex, 'Numéro de téléphone invalide')
    .optional(),
  
  // Number avec min/max
  revenue: z.number()
    .min(0, 'Le revenu doit être positif')
    .max(1000000000, 'Revenu trop élevé'),
  
  // Date
  declaration_date: z.date()
    .min(new Date('2020-01-01'), 'Date trop ancienne')
    .max(new Date(), 'Date dans le futur impossible'),
  
  // Enum
  declaration_type: z.enum(['monthly', 'quarterly', 'annual'], {
    errorMap: () => ({ message: 'Type de déclaration invalide' }),
  }),
  
  // Boolean
  terms_accepted: z.boolean()
    .refine((val) => val === true, {
      message: 'Vous devez accepter les conditions',
    }),
  
  // Array
  documents: z.array(z.string().url())
    .min(1, 'Au moins un document requis')
    .max(5, 'Maximum 5 documents'),
  
  // Object nested
  address: z.object({
    street: z.string().min(5, 'Adresse requise'),
    city: z.string().min(2, 'Ville requise'),
    postal_code: z.string().length(5, 'Code postal invalide'),
  }),
  
  // Optional
  notes: z.string().optional(),
  
  // Transform (conversion)
  amount_string: z.string()
    .transform((val) => parseFloat(val))
    .pipe(z.number().min(0)),
});

export type DeclarationFormData = z.infer<typeof declarationSchema>;
```

---

### Validation Conditionnelle

```ts
// lib/validations/user.ts
import * as z from 'zod';

export const userSchema = z.object({
  user_type: z.enum(['individual', 'company']),
  
  // Champs communs
  email: z.string().email(),
  
  // Si individual
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  
  // Si company
  company_name: z.string().optional(),
  siret: z.string().optional(),
}).refine(
  (data) => {
    if (data.user_type === 'individual') {
      return !!data.first_name && !!data.last_name;
    }
    if (data.user_type === 'company') {
      return !!data.company_name && !!data.siret;
    }
    return true;
  },
  {
    message: 'Champs requis selon le type utilisateur',
    path: ['user_type'],
  }
);
```

---

## 🧩 COMPOSANTS FORMULAIRES

### Form Component (shadcn/ui)

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
});

export function ProfileForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
    },
  });
  
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log(data);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom d'utilisateur</FormLabel>
              <FormControl>
                <Input placeholder="john_doe" {...field} />
              </FormControl>
              <FormDescription>
                Votre nom d'utilisateur public.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit">Enregistrer</Button>
      </form>
    </Form>
  );
}
```

---

### Select Field

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

<FormField
  control={form.control}
  name="declaration_type"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Type de déclaration</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Choisir un type" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="monthly">Mensuelle</SelectItem>
          <SelectItem value="quarterly">Trimestrielle</SelectItem>
          <SelectItem value="annual">Annuelle</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

### Textarea Field

```tsx
import { Textarea } from '@/components/ui/textarea';

<FormField
  control={form.control}
  name="notes"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Notes</FormLabel>
      <FormControl>
        <Textarea 
          placeholder="Notes additionnelles..."
          rows={4}
          {...field}
        />
      </FormControl>
      <FormDescription>
        Informations complémentaires (optionnel)
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

### Checkbox Field

```tsx
import { Checkbox } from '@/components/ui/checkbox';

<FormField
  control={form.control}
  name="terms_accepted"
  render={({ field }) => (
    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
      <FormControl>
        <Checkbox
          checked={field.value}
          onCheckedChange={field.onChange}
        />
      </FormControl>
      <div className="space-y-1 leading-none">
        <FormLabel>
          J'accepte les conditions générales
        </FormLabel>
        <FormDescription>
          Vous acceptez nos{' '}
          <a href="/terms" className="underline">
            conditions d'utilisation
          </a>
        </FormDescription>
      </div>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

### Radio Group Field

```tsx
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

<FormField
  control={form.control}
  name="user_type"
  render={({ field }) => (
    <FormItem className="space-y-3">
      <FormLabel>Type d'utilisateur</FormLabel>
      <FormControl>
        <RadioGroup
          onValueChange={field.onChange}
          defaultValue={field.value}
          className="flex flex-col space-y-1"
        >
          <FormItem className="flex items-center space-x-3 space-y-0">
            <FormControl>
              <RadioGroupItem value="individual" />
            </FormControl>
            <FormLabel className="font-normal">
              Particulier
            </FormLabel>
          </FormItem>
          <FormItem className="flex items-center space-x-3 space-y-0">
            <FormControl>
              <RadioGroupItem value="company" />
            </FormControl>
            <FormLabel className="font-normal">
              Entreprise
            </FormLabel>
          </FormItem>
        </RadioGroup>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

### Date Picker Field

```tsx
'use client';

import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

<FormField
  control={form.control}
  name="declaration_date"
  render={({ field }) => (
    <FormItem className="flex flex-col">
      <FormLabel>Date de déclaration</FormLabel>
      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              className={cn(
                'w-full pl-3 text-left font-normal',
                !field.value && 'text-muted-foreground'
              )}
            >
              {field.value ? (
                format(field.value, 'PPP')
              ) : (
                <span>Choisir une date</span>
              )}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={field.value}
            onSelect={field.onChange}
            disabled={(date) =>
              date > new Date() || date < new Date('1900-01-01')
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## 🎯 PATTERNS AVANCÉS

### Formulaire Multi-Step

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

// Schémas par étape
const step1Schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const step2Schema = z.object({
  first_name: z.string().min(2),
  last_name: z.string().min(2),
});

const step3Schema = z.object({
  company_name: z.string().min(3),
  phone: z.string().min(8),
});

// Schéma complet
const fullSchema = step1Schema.merge(step2Schema).merge(step3Schema);

type FormData = z.infer<typeof fullSchema>;

export function MultiStepForm() {
  const [step, setStep] = useState(1);
  
  const form = useForm<FormData>({
    resolver: zodResolver(
      step === 1 ? step1Schema :
      step === 2 ? step2Schema :
      step3Schema
    ),
  });
  
  const onNext = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      setStep(step + 1);
    }
  };
  
  const onSubmit = (data: FormData) => {
    console.log('Final data:', data);
    // API call
  };
  
  return (
    <div className="space-y-6">
      <Progress value={(step / 3) * 100} />
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {step === 1 && (
          <>
            <h2 className="text-2xl font-bold">Étape 1 : Compte</h2>
            {/* Email & Password fields */}
          </>
        )}
        
        {step === 2 && (
          <>
            <h2 className="text-2xl font-bold">Étape 2 : Informations</h2>
            {/* Name fields */}
          </>
        )}
        
        {step === 3 && (
          <>
            <h2 className="text-2xl font-bold">Étape 3 : Entreprise</h2>
            {/* Company fields */}
          </>
        )}
        
        <div className="flex justify-between">
          {step > 1 && (
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setStep(step - 1)}
            >
              Précédent
            </Button>
          )}
          
          {step < 3 ? (
            <Button type="button" onClick={onNext}>
              Suivant
            </Button>
          ) : (
            <Button type="submit">
              Soumettre
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
```

---

### Dynamic Fields (Array)

```tsx
'use client';

import { useFieldArray, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';

interface FormData {
  documents: { url: string; name: string }[];
}

export function DocumentsForm() {
  const form = useForm<FormData>({
    defaultValues: {
      documents: [{ url: '', name: '' }],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'documents',
  });
  
  const onSubmit = (data: FormData) => {
    console.log(data);
  };
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <h3 className="text-lg font-medium">Documents</h3>
      
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2">
          <Input 
            {...form.register(`documents.${index}.name`)}
            placeholder="Nom du document"
          />
          <Input 
            {...form.register(`documents.${index}.url`)}
            placeholder="URL"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={() => remove(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      
      <Button
        type="button"
        variant="outline"
        onClick={() => append({ url: '', name: '' })}
      >
        <Plus className="mr-2 h-4 w-4" />
        Ajouter un document
      </Button>
      
      <Button type="submit">Enregistrer</Button>
    </form>
  );
}
```

---

### File Upload

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface FormData {
  files: FileList;
}

export function FileUploadForm() {
  const [preview, setPreview] = useState<string[]>([]);
  const form = useForm<FormData>();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const previews = Array.from(files).map(file => 
      URL.createObjectURL(file)
    );
    setPreview(previews);
  };
  
  const onSubmit = async (data: FormData) => {
    const formData = new FormData();
    
    Array.from(data.files).forEach(file => {
      formData.append('files', file);
    });
    
    // Upload
    await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
  };
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input 
          type="file"
          multiple
          accept="image/*,.pdf"
          {...form.register('files')}
          onChange={handleFileChange}
        />
      </div>
      
      {preview.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {preview.map((url, index) => (
            <img 
              key={index}
              src={url} 
              alt={`Preview ${index}`}
              className="w-full h-32 object-cover rounded"
            />
          ))}
        </div>
      )}
      
      <Button type="submit">
        <Upload className="mr-2 h-4 w-4" />
        Uploader
      </Button>
    </form>
  );
}
```

---

## 🚨 GESTION ERREURS

### Erreurs Formulaire

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { useToast } from '@/components/ui/use-toast';

export function FormWithErrorHandling() {
  const { toast } = useToast();
  const form = useForm();
  
  const onSubmit = async (data) => {
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      toast({
        title: 'Succès',
        description: 'Formulaire soumis avec succès',
      });
      
      form.reset();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message,
      });
    }
  };
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Fields */}
    </form>
  );
}
```

---

### Erreurs Serveur (setError)

```tsx
const onSubmit = async (data) => {
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      
      // Erreur champ spécifique
      if (error.field) {
        form.setError(error.field, {
          type: 'server',
          message: error.message,
        });
        return;
      }
      
      // Erreur globale
      form.setError('root', {
        type: 'server',
        message: error.message,
      });
      return;
    }
    
    // Success
  } catch (error) {
    form.setError('root', {
      type: 'server',
      message: 'Une erreur est survenue',
    });
  }
};

// Afficher erreur root
{form.formState.errors.root && (
  <Alert variant="destructive">
    <AlertDescription>
      {form.formState.errors.root.message}
    </AlertDescription>
  </Alert>
)}
```

---

## 🎯 BEST PRACTICES

### ✅ DO (À FAIRE)

```tsx
// ✅ Utiliser Zod pour validation
const schema = z.object({
  email: z.string().email(),
});

// ✅ Types inférés automatiquement
type FormData = z.infer<typeof schema>;

// ✅ Valeurs par défaut
const form = useForm<FormData>({
  defaultValues: {
    email: '',
  },
});

// ✅ Disabled pendant submit
<Button disabled={form.formState.isSubmitting}>
  {form.formState.isSubmitting ? 'Envoi...' : 'Envoyer'}
</Button>

// ✅ Reset après succès
form.reset();

// ✅ Validation côté serveur aussi
// API route validation avec même schéma Zod

// ✅ Messages d'erreur clairs
z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères')

// ✅ Loading states explicites
const [isSubmitting, setIsSubmitting] = useState(false);
```

---

### ❌ DON'T (À ÉVITER)

```tsx
// ❌ Validation inline répétitive
<Input {...register('email', { 
  required: true, 
  pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i 
})} />

// ✅ Utiliser Zod
const schema = z.object({
  email: z.string().email(),
});

// ❌ useState pour chaque champ
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');

// ✅ react-hook-form
const form = useForm();

// ❌ Pas de disabled pendant submit
<Button type="submit">Envoyer</Button>

// ✅ Disabled
<Button type="submit" disabled={isSubmitting}>
  {isSubmitting ? 'Envoi...' : 'Envoyer'}
</Button>

// ❌ Ignorer erreurs serveur
onSubmit(data); // Fire and forget

// ✅ Gestion erreurs
try {
  await onSubmit(data);
} catch (error) {
  toast({ variant: 'destructive', title: 'Erreur' });
}
```

---

## 📚 SCHÉMAS TAXASGE

### Schémas Disponibles

```
lib/validations/
├── auth.ts              → Login, Register, Reset Password
├── declarations.ts      → Déclarations fiscales
├── services.ts          → Services
└── user.ts              → Profil utilisateur
```

---

### Exemple : auth.ts

```ts
// lib/validations/auth.ts
import * as z from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export const registerSchema = z.object({
  name: z.string().min(3, 'Minimum 3 caractères'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
```

---

## 📚 RÉFÉRENCES

- **React Hook Form** : https://react-hook-form.com/
- **Zod** : https://zod.dev/
- **shadcn/ui Form** : https://ui.shadcn.com/docs/components/form
- **COMPONENTS.md** : Composants UI

---

**Document** : Formulaires  
**Auteur** : Claude (Agent IA)  
**Date** : 2025-10-31  
**Version** : 1.0  
**Statut** : ✅ Production Ready
